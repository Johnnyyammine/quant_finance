#!/usr/bin/env node
'use strict';
/**
 * Scaffold a new concept from the template, then rebuild.
 *
 *   npm run new -- "Itô's Lemma" --subject stochastic-processes
 *   npm run new -- "Sharpe Ratio" -s statistics -d advanced -r 5 \
 *                  --tags performance,risk --prereqs variance,expectation
 *
 * The point is that this is the ONLY file you touch. Metadata, indexes,
 * navigation, search and the graph all follow from it.
 */

const fs = require('fs');
const path = require('path');
const { slugify } = require('./lib/model');

const ROOT = path.resolve(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);

const FLAGS = {
  subject: ['--subject', '-s'],
  difficulty: ['--difficulty', '-d'],
  relevance: ['--relevance', '-r'],
  tags: ['--tags', '-t'],
  prereqs: ['--prereqs', '-p'],
  related: ['--related'],
  id: ['--id'],
  from: ['--from'],
};

function parseArgs(argv) {
  const out = { _: [], force: argv.includes('--force'), open: argv.includes('--open') };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--force' || a === '--open') continue;
    const key = Object.keys(FLAGS).find((k) => FLAGS[k].includes(a));
    if (key) { out[key] = argv[i + 1]; i += 1; continue; }
    const eq = a.match(/^--([\w-]+)=(.*)$/);
    if (eq) {
      const k = Object.keys(FLAGS).find((kk) => FLAGS[kk].includes('--' + eq[1]));
      out[k || eq[1]] = eq[2];
      continue;
    }
    if (a.startsWith('-')) { console.error(`unknown flag: ${a}`); process.exit(1); }
    out._.push(a);
  }
  return out;
}

const list = (v) => (v ? String(v).split(',').map((s) => slugify(s.trim())).filter(Boolean) : []);
const yamlList = (arr) => (arr.length ? `[${arr.join(', ')}]` : '[]');

function main() {
  const a = parseArgs(process.argv.slice(2));
  const title = a._.join(' ').trim();

  if (!title) {
    console.log(`
Usage: npm run new -- "Concept Title" --subject <subject-id> [options]

  -s, --subject     subject id from content/subjects.json   (required)
  -d, --difficulty  foundational|intermediate|advanced|research
  -r, --relevance   interview relevance 0-5
  -t, --tags        comma,separated
  -p, --prereqs     comma,separated concept ids
      --related     comma,separated concept ids
      --id          override the generated id
      --from        seed the body from a file (e.g. a Claude conversation)
      --force       overwrite an existing file
`);
    const subjects = JSON.parse(fs.readFileSync(P('content/subjects.json'), 'utf8'));
    console.log('Subjects:\n  ' + subjects.map((s) => s.id).join('\n  ') + '\n');
    process.exit(1);
  }

  const id = slugify(a.id || title);
  const subject = slugify(a.subject || '');
  if (!subject) {
    console.error('error: --subject is required (see content/subjects.json)');
    process.exit(1);
  }
  const known = JSON.parse(fs.readFileSync(P('content/subjects.json'), 'utf8')).map((s) => s.id);
  if (!known.includes(subject)) {
    console.error(`warning: "${subject}" is not in content/subjects.json — the build will generate a stub subject.`);
  }

  const dest = P('content/concepts', `${id}.md`);
  if (fs.existsSync(dest) && !a.force) {
    console.error(`error: ${path.relative(ROOT, dest)} already exists (use --force to overwrite)`);
    process.exit(1);
  }

  const template = fs.readFileSync(P('templates/concept.template.md'), 'utf8');
  const [, fmBlock, bodyBlock] = template.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  const today = new Date().toISOString().slice(0, 10);
  let fm = fmBlock
    .replace(/^id: .*$/m, `id: ${id}`)
    .replace(/^title: .*$/m, `title: ${title}`)
    .replace(/^subject: .*$/m, `subject: ${subject}`)
    .replace(/^difficulty: .*$/m, `difficulty: ${a.difficulty || 'intermediate'}`)
    .replace(/^interview_relevance: .*$/m, `interview_relevance: ${a.relevance || 3}`)
    .replace(/^tags: .*$/m, `tags: ${yamlList(list(a.tags))}`)
    .replace(/^prerequisites: .*$/m, `prerequisites: ${yamlList(list(a.prereqs))}`)
    .replace(/^related: .*$/m, `related: ${yamlList(list(a.related))}`)
    .replace(/^updated: .*$/m, `updated: ${today}`)
    // strip the template's own explanatory banner
    .replace(/^# ─+\n(?:#.*\n)*?# ─+\n\n/m, '');

  let body = bodyBlock;
  if (a.from) {
    const src = fs.readFileSync(path.resolve(process.cwd(), a.from), 'utf8');
    body = body.replace(/(## Intuition\n\n)[\s\S]*?(?=\n## Mathematical Formulation)/,
      `$1<!-- Raw material from ${path.basename(a.from)} — rewrite it, don't paste it. -->\n\n` +
      src.trim().split('\n').map((l) => `> ${l}`).join('\n') + '\n');
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, `---\n${fm}\n---\n${body}`);

  console.log(`created  content/concepts/${id}.md`);

  const { build } = require('./build');
  build();
  console.log(`\nNext:\n  1. write the content in content/concepts/${id}.md\n` +
    `  2. npm run build\n  3. open concepts/${id}.html`);
}

if (require.main === module) main();
