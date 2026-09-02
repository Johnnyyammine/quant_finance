#!/usr/bin/env node
'use strict';
/**
 * Self-tests for the build pipeline: `npm run test`.
 *
 * These cover the parts that would silently corrupt content if they broke —
 * the YAML subset, the markdown renderer's math protection, and the derived
 * indexes. No test framework, because there are no dependencies.
 */

const assert = require('assert');
const path = require('path');
const { frontmatter, parse } = require('./lib/yaml');
const md = require('./lib/markdown');
const model = require('./lib/model');
const { buildSearchIndex } = require('./lib/search');

let passed = 0;
let failed = 0;
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

/* ------------------------------------------------------------------ yaml -- */

test('yaml: scalars, lists and nested maps', () => {
  const d = parse([
    'id: alpha',
    'n: 42',
    'f: 1.5',
    'ok: true',
    'nope: false',
    'nul: ~',
    'flow: [a, b, c]',
    'quoted: "a: colon, and #hash"',
    'nested:',
    '  x: 1',
    '  y: [p, q]',
  ].join('\n'));
  assert.strictEqual(d.id, 'alpha');
  assert.strictEqual(d.n, 42);
  assert.strictEqual(d.f, 1.5);
  assert.strictEqual(d.ok, true);
  assert.strictEqual(d.nope, false);
  assert.strictEqual(d.nul, null);
  assert.deepStrictEqual(d.flow, ['a', 'b', 'c']);
  assert.strictEqual(d.quoted, 'a: colon, and #hash');
  assert.deepStrictEqual(d.nested, { x: 1, y: ['p', 'q'] });
});

test('yaml: list of maps with block scalars', () => {
  const d = parse([
    'questions:',
    '  - q: First?',
    '    difficulty: easy',
    '    a: |',
    '      Line one',
    '        indented',
    '      Line two',
    '  - q: Second?',
    '    a: short',
  ].join('\n'));
  assert.strictEqual(d.questions.length, 2);
  assert.strictEqual(d.questions[0].a, 'Line one\n  indented\nLine two\n');
  assert.strictEqual(d.questions[1].a, 'short');
});

test('yaml: comments are stripped outside quotes', () => {
  const d = parse('a: 1 # trailing\nb: "keep # this"');
  assert.strictEqual(d.a, 1);
  assert.strictEqual(d.b, 'keep # this');
});

test('yaml: frontmatter split leaves the body untouched', () => {
  const { data, body } = frontmatter('---\nid: x\n---\n## Head\n\ntext $a_b$\n');
  assert.strictEqual(data.id, 'x');
  assert.strictEqual(body, '## Head\n\ntext $a_b$\n');
});

test('yaml: a document with no frontmatter is all body', () => {
  const { data, body } = frontmatter('# Just markdown\n');
  assert.deepStrictEqual(data, {});
  assert.strictEqual(body, '# Just markdown\n');
});

/* -------------------------------------------------------------- markdown -- */

const render = (src, ctx) => md.render(src, ctx || {});

test('markdown: underscores inside math are not emphasis', () => {
  const { html } = render('Value $\\sigma_1 * \\sigma_2$ and $x_i$ here.');
  assert.ok(!html.includes('<em>'), 'math was mangled by the emphasis rule');
  assert.ok(html.includes('\\sigma_1 * \\sigma_2'));
});

test('markdown: display math survives verbatim', () => {
  const { html } = render('$$\\int_0^T \\sigma_s\\,dW_s$$');
  assert.ok(html.includes('math-display'));
  assert.ok(html.includes('\\int_0^T \\sigma_s\\,dW_s'));
});

test('markdown: a dollar amount is not treated as math', () => {
  const { html } = render('It cost $5 billion and then some.');
  assert.ok(!html.includes('math-inline'), '"$5 billion" was parsed as math');
});

test('markdown: fenced code is escaped and never treated as math', () => {
  const { html } = render('```python\nx = a_b * c  # $not math$\n```');
  assert.ok(html.includes('language-python'));
  assert.ok(html.includes('a_b * c'));
  assert.ok(!html.includes('math-inline'));
});

test('markdown: formula directive is extracted with metadata', () => {
  const out = render(':::formula {name="Variance" used-in="Risk, Stats"}\n\\Var(X) = \\E[X^2]\n:::');
  assert.strictEqual(out.formulas.length, 1);
  assert.strictEqual(out.formulas[0].name, 'Variance');
  assert.strictEqual(out.formulas[0].id, 'variance');
  assert.deepStrictEqual(out.formulas[0].usedIn, ['Risk', 'Stats']);
  assert.ok(out.formulas[0].latex.includes('\\Var(X)'));
  assert.ok(out.html.includes('kb-formula'));
});

test('markdown: wiki links resolve and unresolved ones warn', () => {
  const out = render('See [[known]] and [[unknown|label]].', {
    resolveLink: (id) => (id === 'known' ? { href: 'known.html', title: 'Known' } : { missing: true }),
  });
  assert.ok(out.html.includes('href="known.html"'));
  assert.ok(out.html.includes('kb-link--missing'));
  assert.deepStrictEqual(out.links, ['known', 'unknown']);
  assert.strictEqual(out.warnings.length, 1);
});

test('markdown: module directive parses its JSON config', () => {
  const out = render(':::module random-walk\n{"paths": 40}\n:::');
  assert.deepStrictEqual(out.modules, ['random-walk']);
  assert.ok(out.html.includes('data-module="random-walk"'));
  assert.ok(out.html.includes('&quot;paths&quot;:40'));
});

test('markdown: bad module JSON warns instead of throwing', () => {
  const out = render(':::module x\n{not json}\n:::');
  assert.strictEqual(out.warnings.length, 1);
  assert.ok(/valid JSON/.test(out.warnings[0]));
});

test('markdown: tables, nested lists, callouts and details', () => {
  const out = render([
    '| a | b |', '|---|--:|', '| 1 | 2 |', '',
    '- one', '- two', '  - nested', '',
    ':::warning', 'careful', ':::', '',
    ':::derivation Proof', 'body', ':::',
  ].join('\n'));
  assert.ok(out.html.includes('<table class="kb-table">'));
  assert.ok(out.html.includes('text-align:right'));
  assert.ok(/<ul class="kb-list">[\s\S]*<ul class="kb-list">/.test(out.html), 'nested list missing');
  assert.ok(out.html.includes('kb-callout--warning'));
  assert.ok(out.html.includes('<details class="kb-derivation">'));
});

test('markdown: headings are collected with slug ids', () => {
  const out = render('## Why It Matters in Quant Finance\n\ntext');
  assert.deepStrictEqual(out.headings, [
    { level: 2, text: 'Why It Matters in Quant Finance', id: 'why-it-matters-in-quant-finance' },
  ]);
});

test('markdown: raw HTML in prose is escaped', () => {
  const { html } = render('A <script>alert(1)</script> tag.');
  assert.ok(!html.includes('<script>'), 'HTML was not escaped');
  assert.ok(html.includes('&lt;script&gt;'));
});

test('markdown: HTML comments are stripped, contents and all', () => {
  const out = render('Visible.\n\n<!--\n  authoring note with [[ghost]] and $x_1$\n-->\n\nAlso visible.');
  assert.ok(!out.html.includes('&lt;!--'), 'comment markup leaked into the page');
  assert.ok(!out.html.includes('authoring note'), 'comment body leaked into the page');
  assert.deepStrictEqual(out.links, [], 'a commented-out wiki link was parsed');
  assert.deepStrictEqual(out.warnings, []);
  assert.ok(out.html.includes('Visible.') && out.html.includes('Also visible.'));
  assert.ok(!md.toText('a <!-- hidden --> b').includes('hidden'), 'comment reached the search index');
});

test('markdown: no placeholder sentinels leak into output', () => {
  const { html } = render('$a$ and `code` and $$b$$ and ```\nfence\n```');
  assert.ok(!/\u0000/.test(html), 'internal placeholder leaked');
});

/* ----------------------------------------------------------------- model -- */

test('model: normalisation applies defaults and clamps', () => {
  const { concept, errors } = model.normaliseConcept(
    { title: 'Itô’s Lemma', subject: 'Stochastic Processes', interview_relevance: 99, difficulty: 'nonsense' },
    { file: 'x.md', sourceId: 'ito-lemma' }
  );
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(concept.id, 'ito-lemma');
  assert.strictEqual(concept.subject, 'stochastic-processes');
  assert.strictEqual(concept.interviewRelevance, 5);
  assert.strictEqual(concept.difficulty, 'intermediate');
  assert.strictEqual(concept.path, 'concepts/ito-lemma.html');
});

test('model: a missing subject is an error', () => {
  const { errors } = model.normaliseConcept({ title: 'x' }, { file: 'x.md', sourceId: 'x' });
  assert.ok(errors.some((e) => /subject/.test(e)));
});

test('model: indexes derive reverse edges and symmetric relations', () => {
  const mk = (id, over) => model.normaliseConcept(
    Object.assign({ id, title: id, subject: 's' }, over), { file: id + '.md', sourceId: id }
  ).concept;
  const a = mk('a');
  const b = mk('b', { prerequisites: ['a'], related: ['c'] });
  const c = mk('c');
  const subjects = [model.normaliseSubject({ id: 's', name: 'S' }, 0)];
  const out = model.buildIndexes([a, b, c], subjects, []);
  assert.deepStrictEqual(a.builtOn, ['b'], 'reverse prerequisite not derived');
  assert.ok(c.related.includes('b'), 'related was not made symmetric');
  assert.ok(out.edges.some((e) => e.type === 'prerequisite' && e.from === 'a' && e.to === 'b'));
  assert.strictEqual(subjects[0].conceptCount, 3);
});

test('model: dangling references are dropped with a warning', () => {
  const c = model.normaliseConcept(
    { id: 'x', title: 'X', subject: 's', prerequisites: ['ghost'] }, { file: 'x.md', sourceId: 'x' }
  ).concept;
  const out = model.buildIndexes([c], [model.normaliseSubject({ id: 's', name: 'S' }, 0)], []);
  assert.deepStrictEqual(c.prerequisites, []);
  assert.ok(out.warnings.some((w) => /ghost/.test(w)));
});

test('model: an undeclared subject is auto-stubbed, never fatal', () => {
  const c = model.normaliseConcept(
    { id: 'x', title: 'X', subject: 'brand-new' }, { file: 'x.md', sourceId: 'x' }
  ).concept;
  const subjects = [];
  const out = model.buildIndexes([c], subjects, []);
  assert.strictEqual(subjects.length, 1);
  assert.strictEqual(subjects[0].id, 'brand-new');
  assert.ok(out.warnings.some((w) => /brand-new/.test(w)));
});

test('model: reading progress is not part of the model', () => {
  // The reading-progress feature (status vocabulary, % bars, "mastered")
  // was removed on purpose. It reappearing means a partial revert, so pin it:
  // the model exposes no status vocabulary and normalisation invents no field.
  assert.strictEqual(model.STATUS, undefined);
  assert.strictEqual(model.progressOf, undefined);
  const { concept } = model.normaliseConcept(
    { title: 'x', subject: 'probability', status: 'mastered' },
    { file: 'x.md', sourceId: 'x' }
  );
  assert.ok(!('status' in concept), 'a stray status: in frontmatter must be ignored');
});

test('model: section aliases map onto canonical ids', () => {
  assert.strictEqual(model.SECTION_BY_ALIAS.get('quick revision').id, 'revision');
  assert.strictEqual(model.SECTION_BY_ALIAS.get('the math').id, 'formulation');
  assert.strictEqual(model.SECTION_BY_ALIAS.get('on the desk').id, 'trading-application');
});

/* ---------------------------------------------------------------- search -- */

test('search: index covers concepts, formulas and questions', () => {
  const c = model.normaliseConcept({
    id: 'sharpe-ratio', title: 'Sharpe Ratio', subject: 'stats',
    summary: 'Excess return per unit of volatility.', tags: ['performance'],
    questions: [{ q: 'How do you annualise a Sharpe ratio?', a: 'Multiply by root k.' }],
  }, { file: 'x.md', sourceId: 'sharpe-ratio' }).concept;
  c.formulas = [{ id: 'sr', name: 'Sharpe ratio', latex: '\\frac{\\mu - r_f}{\\sigma}', usedIn: ['Risk'] }];
  const subjects = [model.normaliseSubject({ id: 'stats', name: 'Statistics' }, 0)];
  const ix = buildSearchIndex({
    concepts: [c], subjects, plainText: new Map([['sharpe-ratio', 'volatility drag annualisation']]),
  });
  const kinds = ix.docs.map((d) => d.t);
  assert.ok(kinds.includes('concept') && kinds.includes('formula') && kinds.includes('question'));
  assert.ok(ix.terms.includes('sharpe'));
  assert.ok(ix.terms.includes('annualisation'), 'body text was not indexed');
  assert.ok(ix.terms.length === new Set(ix.terms).size, 'duplicate terms');
  assert.deepStrictEqual(ix.terms.slice().sort(), ix.terms, 'terms must be sorted for prefix search');
});

/* --------------------------------------------------------- end-to-end ---- */

test('build: the repository builds without errors', () => {
  const { build } = require('./build');
  const { problems, payload } = build();
  assert.deepStrictEqual(problems.errors, []);
  assert.ok(payload.concepts.length > 0, 'no concepts were built');
  assert.ok(payload.stats.formulas > 0, 'no formulas were extracted');
  assert.ok(payload.stats.questions > 0, 'no questions were extracted');
  payload.concepts.forEach((c) => {
    assert.ok(c.summary, `${c.id} has no summary`);
    assert.ok(c.path.endsWith('.html'));
  });
});

test('markdown: inline maths may wrap across a line', () => {
  // Prose is hard-wrapped, so a formula near the margin straddles a newline.
  // Forbidding that leaked raw LaTeX onto the page.
  const { html } = md.render('Start with $\\lambda_1 \\ge\n\\lambda_N \\ge 0$ here.', {});
  assert.ok(!/\$/.test(html), 'a wrapped inline formula left a raw $ in the output');
  assert.ok(/\\\(/.test(html), 'a wrapped inline formula was not handed to KaTeX');

  // A blank line still ends it: two stray $ must not swallow a paragraph.
  const two = md.render('costs $5 today\n\nand $10 tomorrow', {}).html;
  assert.ok(/\$5/.test(two) && /\$10/.test(two), 'stray dollar amounts were eaten as maths');
});

test('markdown: backslash-escaped characters lose the backslash', () => {
  const { html } = md.render('Winners make \\$120, losers lose \\$100.', {});
  assert.ok(/\$120/.test(html), 'escaped dollar did not survive');
  assert.ok(!/\\\$/.test(html), 'the backslash was printed instead of being consumed');
});

test('build: generated data and pages carry no progress surface', () => {
  // Same reasoning as the model test, one layer out: the shipped kb.data.js and
  // the committed HTML are what a reader actually loads.
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const data = fs.readFileSync(path.join(root, 'data/kb.json'), 'utf8');
  const payload = JSON.parse(data);
  assert.ok(!('status' in payload.vocab), 'vocab.status must be gone');
  assert.ok(!('progress' in payload.stats), 'stats.progress must be gone');
  payload.concepts.forEach((c) => assert.ok(!('status' in c), c.id + ' still carries a status'));
  payload.subjects.forEach((s) => assert.ok(!('progress' in s), s.id + ' still carries progress'));

  const offenders = [];
  ['index.html', 'library.html', 'interview.html', 'graph.html'].forEach((f) => {
    const p = path.join(root, f);
    if (fs.existsSync(p) && /kb-bar|kb-statusdot|data-kb-status|data-kb-progress/.test(fs.readFileSync(p, 'utf8'))) {
      offenders.push(f);
    }
  });
  ['concepts', 'subjects'].forEach((dir) => {
    const d = path.join(root, dir);
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).filter((f) => f.endsWith('.html')).forEach((f) => {
      if (/kb-bar|kb-statusdot|data-kb-status/.test(fs.readFileSync(path.join(d, f), 'utf8'))) {
        offenders.push(dir + '/' + f);
      }
    });
  });
  assert.deepStrictEqual(offenders, [], 'progress markup left in generated HTML');
});

test('build: no generated page leaks unrendered maths', () => {
  // The failure this catches is visible to every reader: a formula that never
  // reached KaTeX shows up as raw $...$ in the middle of a sentence. Scans the
  // committed HTML, so it tests exactly what gets deployed.
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const files = [];
  ['concepts', 'subjects'].forEach((dir) => {
    const d = path.join(root, dir);
    if (fs.existsSync(d)) fs.readdirSync(d).forEach((f) => {
      if (f.endsWith('.html')) files.push(path.join(dir, f));
    });
  });
  ['index.html', 'library.html', 'interview.html', 'graph.html'].forEach((f) => {
    if (fs.existsSync(path.join(root, f))) files.push(f);
  });
  assert.ok(files.length > 10, 'expected generated pages to scan');

  const offenders = [];
  files.forEach((rel) => {
    const text = fs.readFileSync(path.join(root, rel), 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, '')     // KB_DATA carries source text
      .replace(/\\\([\s\S]*?\\\)/g, '')             // maths correctly handed to KaTeX
      .replace(/\\\[[\s\S]*?\\\]/g, '')
      .replace(/<[^>]*>/g, ' ');                     // attributes legitimately hold LaTeX
    // Two prices in a sentence ("make $120, lose $100") look like $...$ but are
    // not a leak. Unrendered maths is identified by a backslash command -- either
    // inside the delimiters, or loose in the prose.
    const m = text.match(/\$[^$\n]*\\[a-zA-Z]{2,}[^$\n]*\$/)
      || text.match(/\\(?:frac|sqrt|sum|lambda|sigma|approx|times|cdot|Sigma|operatorname|begin)\b/);
    if (m) offenders.push(rel + ' -> ' + m[0].trim().slice(0, 70));
  });
  assert.deepStrictEqual(offenders, [], 'raw $...$ reached the page:\n  ' + offenders.join('\n  '));
});

test('build: the build is deterministic', () => {
  // Generated output is committed, and CI fails if it drifts from content/.
  // A wall-clock timestamp in the payload would make every build differ and
  // turn that check into permanent noise, so it must stay reproducible.
  const { build } = require('./build');
  const a = build().payload;
  const b = build().payload;
  assert.ok(!('generatedAt' in a), 'payload carries a wall-clock timestamp');
  assert.strictEqual(a.contentHash, b.contentHash, 'content hash is unstable');
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b), 'two builds of identical input differ');
  assert.ok(/^[0-9a-f]{12}$/.test(a.contentHash), 'content hash is malformed');
});

test('build: every declared prerequisite and relation resolves', () => {
  const data = require(path.join(__dirname, '..', 'data', 'kb.json'));
  const ids = new Set(data.concepts.map((c) => c.id));
  data.concepts.forEach((c) => {
    c.prerequisites.concat(c.related, c.builtOn).forEach((r) => {
      assert.ok(ids.has(r), `${c.id} references unknown concept "${r}"`);
    });
  });
  data.edges.forEach((e) => {
    assert.ok(ids.has(e.from) && ids.has(e.to), `dangling edge ${e.from} -> ${e.to}`);
  });
});

test('build: the prerequisite graph is acyclic', () => {
  const data = require(path.join(__dirname, '..', 'data', 'kb.json'));
  const prereqs = new Map(data.concepts.map((c) => [c.id, c.prerequisites]));
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 'done') return;
    assert.ok(state.get(id) !== 'open', `prerequisite cycle: ${trail.concat(id).join(' -> ')}`);
    state.set(id, 'open');
    (prereqs.get(id) || []).forEach((p) => visit(p, trail.concat(id)));
    state.set(id, 'done');
  };
  prereqs.forEach((_, id) => visit(id, []));
});

/* ------------------------------------------------------------------ run -- */

const C = process.stdout.isTTY
  ? { red: '\u001b[31m', green: '\u001b[32m', dim: '\u001b[2m', bold: '\u001b[1m', off: '\u001b[0m' }
  : { red: '', green: '', dim: '', bold: '', off: '' };

tests.forEach(({ name, fn }) => {
  try {
    fn();
    passed += 1;
    console.log(`${C.green}pass${C.off} ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`${C.red}FAIL${C.off} ${name}\n     ${C.dim}${e.message.split('\n')[0]}${C.off}`);
  }
});

console.log(`\n${C.bold}${passed} passed, ${failed} failed${C.off}`);
process.exit(failed ? 1 : 0);
