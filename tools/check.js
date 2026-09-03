#!/usr/bin/env node
'use strict';
/**
 * Content health report: `npm run check`.
 *
 * Builds without writing anything meaningful and reports what needs attention —
 * orphan concepts, missing interview questions, missing summaries, maths pages
 * with no formula, unbalanced subjects. Useful before a study session, and as a
 * CI gate. Depth is caught by the build's own "missing recommended section"
 * warning, which names what is absent rather than counting words at it.
 */

const { build } = require('./build');

const C = process.stdout.isTTY
  ? { dim: '\u001b[2m', red: '\u001b[31m', yellow: '\u001b[33m', green: '\u001b[32m', bold: '\u001b[1m', off: '\u001b[0m' }
  : { dim: '', red: '', yellow: '', green: '', bold: '', off: '' };

const { problems, payload } = build();
const { concepts, subjects, tracks, stats } = payload;
const linked = new Set();
payload.edges.forEach((e) => { linked.add(e.from); linked.add(e.to); });

const issues = [];
const push = (kind, msg) => issues.push({ kind, msg });

concepts.forEach((c) => {
  if (!linked.has(c.id)) push('orphan', `${c.id} has no prerequisites, related concepts or inbound links`);
  if (!c.questions.length && c.interviewRelevance >= 4) {
    push('questions', `${c.id} is interview-relevant (${c.interviewRelevance}★) but has no questions`);
  }
  if (!c.summary) push('summary', `${c.id} has no one-sentence summary`);
  if (!c.formulas.length && ['mathematics', 'modelling'].includes(
    (subjects.find((s) => s.id === c.subject) || {}).group)) {
    push('formulas', `${c.id} is a maths-group concept with no :::formula block`);
  }
});

console.log(`\n${C.bold}Knowledge base health${C.off}`);
console.log(`${C.dim}${'─'.repeat(64)}${C.off}`);
console.log(`  ${stats.concepts} concepts · ${stats.formulas} formulas · ${stats.questions} questions`);

console.log(`\n${C.bold}Coverage by subject${C.off}`);
subjects.slice().sort((a, b) => b.conceptCount - a.conceptCount).forEach((s) => {
  const n = s.conceptCount;
  console.log(`  ${s.name.padEnd(28)} ${String(n).padStart(3)} ` +
    (n === 0 ? `${C.dim}(empty)${C.off}` : n === 1 ? 'concept' : 'concepts'));
});

if (tracks.length) {
  console.log(`\n${C.bold}Interview tracks${C.off}`);
  tracks.forEach((t) => {
    const n = t.conceptIds.length;
    console.log(`  ${t.name.padEnd(28)} ${String(n).padStart(3)} ${n === 1 ? 'concept' : 'concepts'}`);
  });
}

const grouped = issues.reduce((m, i) => { (m[i.kind] = m[i.kind] || []).push(i.msg); return m; }, {});
const LABEL = {
  orphan: 'Unconnected concepts (add prerequisites/related)',
  questions: 'Missing interview questions',
  summary: 'Missing summaries',
  formulas: 'Maths concepts with no key formula',
};

if (Object.keys(grouped).length) {
  console.log(`\n${C.bold}To do${C.off}`);
  Object.entries(grouped).forEach(([kind, msgs]) => {
    console.log(`\n  ${C.yellow}${LABEL[kind] || kind}${C.off} (${msgs.length})`);
    msgs.slice(0, 12).forEach((m) => console.log(`    · ${m}`));
    if (msgs.length > 12) console.log(`    ${C.dim}… and ${msgs.length - 12} more${C.off}`);
  });
}

if (problems.warnings.length) {
  console.log(`\n${C.bold}Build warnings${C.off} (${problems.warnings.length})`);
  problems.warnings.slice(0, 20).forEach((w) => console.log(`  ${C.yellow}·${C.off} ${w}`));
  if (problems.warnings.length > 20) console.log(`  ${C.dim}… and ${problems.warnings.length - 20} more${C.off}`);
}

if (problems.errors.length) {
  console.log(`\n${C.red}${C.bold}Errors${C.off} (${problems.errors.length})`);
  problems.errors.forEach((e) => console.log(`  ${C.red}·${C.off} ${e}`));
  process.exit(1);
}
console.log('');
