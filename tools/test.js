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

test('yaml: a block scalar keeps its blank lines and "#" lines', () => {
  // Every interview answer is a "|" block written as several paragraphs. The
  // parser used to drop blank lines globally before parsing, so all 62 of them
  // rendered as one fused wall of text; an indented "# heading" vanished too.
  const d = parse(['a: |', '  One.', '', '  Two.', '', '  # Heading', '  Three.', 'b: after'].join('\n'));
  assert.strictEqual(d.a, 'One.\n\nTwo.\n\n# Heading\nThree.\n');
  assert.strictEqual(d.b, 'after', 'the key after the block scalar was lost');
});

test('yaml: a folded scalar folds lines but keeps paragraph breaks', () => {
  const d = parse(['s: >', '  one', '  two', '', '  three', 'k: 1'].join('\n'));
  assert.strictEqual(d.s, 'one two\nthree\n');
  assert.strictEqual(d.k, 1);
});

test('yaml: comments outside a block scalar are still comments', () => {
  const d = parse(['# leading note', 'a: 1', '', '# another', 'b: 2'].join('\n'));
  assert.deepStrictEqual(d, { a: 1, b: 2 });
});

test('markdown: an HTML comment inside code is not stripped', () => {
  // Comments were removed before code was protected, so a paired comment in a
  // sample vanished and an unpaired opener ate everything up to the next
  // "-->" anywhere later in the document, across block boundaries.
  const paired = md.render(['```html', '<p><!-- keep me --></p>', '```'].join('\n'), {}).html;
  assert.ok(/keep me/.test(paired), 'a comment inside a code sample was deleted');

  const spanning = md.render(
    ['```html', '<!-- start', '```', '', 'Middle paragraph.', '', 'Tail --> end.'].join('\n'), {}).html;
  assert.ok(/&lt;!-- start/.test(spanning), 'an unpaired comment opener ate the code sample');
  assert.ok(/Middle paragraph\./.test(spanning), 'the comment swallowed the paragraph between');

  // A real authoring note is still removed.
  assert.ok(!/note/.test(md.render('Before <!-- note --> after.', {}).html));
});

test('markdown: a link with a title renders as a link', () => {
  // inline() escapes first, so by this point the title quotes are &quot; and
  // the titled form never matched -- the raw source leaked onto the page.
  const { html } = md.render('See [docs](https://example.com "Tip") now.', {});
  assert.ok(/<a href="https:\/\/example\.com" title="Tip"/.test(html), html);
  assert.ok(!/\[docs\]/.test(html), 'the raw link source leaked through');
});

test('markdown: an escaped pipe stays inside its table cell', () => {
  const { html } = md.render(['| a | b |', '|---|---|', '| x \\| y | z |'].join('\n'), {});
  const cells = html.match(/<td[^>]*>(.*?)<\/td>/g) || [];
  assert.strictEqual(cells.length, 2, 'the escaped pipe split the row into an extra column');
  assert.ok(/x \| y/.test(cells[0]), cells[0]);
});

test('markdown: "___" is a rule wherever "---" is', () => {
  ['---', '***', '___'].forEach((rule) => {
    const { html } = md.render(['Para one.', rule, 'Para two.'].join('\n'), {});
    assert.ok(/<hr>/.test(html), rule + ' did not produce a rule');
    assert.ok(!new RegExp(rule.replace(/[*]/g, '\\$&')).test(html.replace(/<[^>]*>/g, '')),
      rule + ' rendered as literal text');
  });
});

test('markdown: a heading after a blockquote is not swallowed by it', () => {
  // Lazy continuation is for prose. Absorbing the heading also put a table-of-
  // contents entry inside the quotation.
  const { html, headings } = md.render(['> A quotation.', '## Next Section', '', 'Body.'].join('\n'), {});
  assert.ok(/<\/blockquote>\s*<h2/.test(html), html);
  assert.ok((headings || []).some((h) => /Next Section/.test(h.text || h.title || '')) ||
    /id="next-section"/.test(html));
});

test('markdown: formulas sharing a name get distinct ids', () => {
  const src = [':::formula {name="Variance"}', '$$x$$', ':::', '',
    ':::formula {name="Variance"}', '$$y$$', ':::'].join('\n');
  const { formulas } = md.render(src, {});
  assert.strictEqual(formulas.length, 2);
  assert.notStrictEqual(formulas[0].id, formulas[1].id, 'duplicate ids make the second unreachable');
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

test('build: no length metric survives in the generated output', () => {
  // Word counts and a hand-typed reading time measured the page, not the
  // subject -- and the reading time was a guess in frontmatter, so it could not
  // even be trusted. Both are gone; this is the guard against one drifting back
  // in through the payload, where it would immediately be free to render.
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'data/kb.json'), 'utf8'));

  assert.ok(!('words' in payload.stats), 'stats.words must be gone');
  assert.ok(payload.concepts.length, 'expected concepts to check');
  payload.concepts.forEach((c) => {
    assert.ok(!('wordCount' in c), c.id + ' still carries a word count');
    assert.ok(!('estimatedMinutes' in c), c.id + ' still carries a reading time');
  });

  // Frontmatter is the other end of the same pipe: a `minutes:` key there is
  // silently ignored now, which is worse than an author noticing it is gone.
  const dir = path.join(root, 'content/concepts');
  const stale = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
    .filter((f) => /^minutes:/m.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  assert.deepStrictEqual(stale, [], 'concepts still declaring a reading time');

  const offenders = [];
  ['concepts', 'subjects'].forEach((sub) => {
    const d = path.join(root, sub);
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).filter((f) => f.endsWith('.html')).forEach((f) => {
      if (/kb-readtime/.test(fs.readFileSync(path.join(d, f), 'utf8'))) offenders.push(sub + '/' + f);
    });
  });
  assert.deepStrictEqual(offenders, [], 'reading-time markup left in generated HTML');
});

test('build: every maths expression renders with the macros the site declares', () => {
  // The gap this closes: `\Q` was used in four concepts and never declared as a
  // macro, so KaTeX rendered the literal red text "\Q" in twenty places. Nothing
  // caught it -- the build does not run KaTeX, and the "no unrendered maths" test
  // only looks for leftover delimiters, which this passes.
  //
  // KaTeX is vendored, so it can be required here and asked to render every
  // expression for real. The macro table is parsed out of math.js rather than
  // duplicated, so the test cannot drift from what the browser actually loads.
  const fs = require('fs');
  const katex = require(path.join(__dirname, '../assets/vendor/katex/katex.min.js'));
  const root = path.join(__dirname, '..');

  const js = fs.readFileSync(path.join(root, 'assets/js/math.js'), 'utf8');
  const from = js.indexOf('macros: {');
  assert.ok(from !== -1, 'math.js no longer declares a macros table');
  const macros = {};
  js.slice(from, js.indexOf('},', from)).replace(
    /'(\\\\[A-Za-z0-9]+)':\s*'([^']+)'/g,
    (_, name, body) => { macros[name.replace(/\\\\/g, '\\')] = body.replace(/\\\\/g, '\\'); });
  assert.ok(Object.keys(macros).length >= 8, 'parsed too few macros out of math.js');

  const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

  let checked = 0;
  const broken = [];
  for (const dir of ['concepts', 'subjects', '.']) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) continue;
    for (const f of fs.readdirSync(full).filter((x) => x.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(full, f), 'utf8');
      const re = /class="math-(inline|display)">\\[([]([\s\S]*?)\\[)\]]<\/span>/g;
      let m;
      while ((m = re.exec(html))) {
        checked += 1;
        try {
          katex.renderToString(unescape(m[2]),
            { throwOnError: true, strict: false, macros, displayMode: m[1] === 'display' });
        } catch (e) {
          broken.push(`${dir}/${f}: ${e.message.replace(/ at position[\s\S]*$/, '')}`);
        }
      }
    }
  }
  assert.ok(checked > 500, `expected the corpus to have maths in it, found ${checked}`);
  assert.deepStrictEqual([...new Set(broken)].sort(), [],
    'maths that KaTeX cannot render, and which the page shows in error colour');
});

test('build: local assets are cache-busted, vendored ones are not', () => {
  // The failure this catches is silent and looks like a broken site: a browser
  // holding an old app.css pairs it with freshly deployed HTML, and the layout
  // comes apart. Every local asset URL must carry its own content hash so a
  // changed file is a changed URL. KaTeX must NOT -- it is pinned, unchanging,
  // and 600 KB worth keeping in the cache across deploys.
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  // A generated page and a hand-written one. The root pages are authored by
  // hand and were the gap here: the build stamps them, but nothing checked it,
  // so index.html could quietly go back to serving a cacheable app.css URL.
  const sources = ['concepts/kelly-criterion.html', 'index.html', 'library.html'];

  const refs = [];
  sources.forEach((rel) => {
    fs.readFileSync(path.join(root, rel), 'utf8')
      .replace(/(?:href|src)="([^"]+\.(?:css|js)(?:\?[^"]*)?)"/g, (_, u) => refs.push(u));
  });
  assert.ok(refs.length > 6, 'expected the shell to reference several assets');

  const unversioned = refs.filter((u) => !/\.(css|js)\?v=[0-9a-f]{8}$/.test(u));
  assert.deepStrictEqual(
    unversioned.filter((u) => !u.includes('/vendor/')), [],
    'local assets must carry ?v=<hash>');
  assert.ok(
    refs.some((u) => u.includes('/vendor/katex/')) &&
    refs.filter((u) => u.includes('/vendor/')).every((u) => !u.includes('?v=')),
    'vendored KaTeX must stay unversioned');

  // Every hash has to be its own file's, or it is decoration -- and a tag that
  // has gone stale is worse than none, because it looks deliberate.
  const crypto = require('crypto');
  const wrong = [];
  refs.filter((u) => u.includes('?v=')).forEach((u) => {
    const [rel, tag] = u.split('?v=');
    const file = path.join(root, rel.replace(/^(?:\.\.\/)+/, ''));
    const want = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
    if (tag !== want) wrong.push(`${rel} tagged ${tag}, file hashes ${want}`);
  });
  assert.deepStrictEqual(wrong, [], 'asset tags do not match the files they name');
});

test('css: every color-mix fill keeps a flat fallback under it', () => {
  // color-mix is recent. A browser that does not understand it drops the whole
  // declaration -- and for the primary button that means falling back to
  // .kb-btn's grey, so the primary action silently stops looking primary. The
  // guard is a plain `background:` on the line before, which is easy to lose
  // in a later edit and invisible in every browser we test in.
  const fs = require('fs');
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets/css/app.css'), 'utf8');
  const lines = css.split('\n');

  const offenders = [];
  lines.forEach((line, i) => {
    if (!/^\s*background:/.test(line)) return;
    // Find the whole declaration; a gradient wraps over several lines.
    let decl = line, j = i;
    while (!decl.includes(';') && j + 1 < lines.length) { j += 1; decl += lines[j]; }
    if (!decl.includes('color-mix')) return;
    const prev = (lines[i - 1] || '').trim();
    if (!/^background:\s*[^;]+;$/.test(prev) || prev.includes('color-mix')) {
      offenders.push('line ' + (i + 1) + ': ' + line.trim().slice(0, 48));
    }
  });
  assert.deepStrictEqual(offenders, [], 'color-mix background with no flat fallback above it');
  // And the guard is only meaningful if such fills actually exist.
  assert.ok(css.includes('color-mix'), 'expected at least one color-mix fill to guard');
});

test('css: every typeface the stack names is a vendored file', () => {
  // The stack named Inter and JetBrains Mono for a long time without ever
  // loading them, so every visitor saw their system UI font in a layout tuned
  // for someone else's metrics. Nothing about the page looks broken when that
  // happens, which is exactly why it went unnoticed -- so the check is that
  // every family a --font-* token asks for first is one this stylesheet
  // actually declares, and that the file behind each declaration exists.
  const fs = require('fs');
  const repo = path.join(__dirname, '..');
  const css = fs.readFileSync(path.join(repo, 'assets/css/app.css'), 'utf8');

  const declared = new Set();
  const faces = css.match(/@font-face\s*{[^}]*}/g) || [];
  assert.ok(faces.length >= 2, 'expected vendored @font-face rules');
  faces.forEach((face) => {
    const fam = face.match(/font-family:\s*"([^"]+)"/);
    const src = face.match(/url\("([^"]+)"\)/);
    assert.ok(fam && src, '@font-face missing a family or a src: ' + face.slice(0, 60));
    declared.add(fam[1]);
    // src urls are relative to the stylesheet, which lives in assets/css/.
    const file = path.join(repo, 'assets/css', src[1]);
    assert.ok(fs.existsSync(file), 'font file named but not shipped: ' + src[1]);
  });

  const tokens = css.match(/--font-[a-z]+:\s*"([^"]+)"/g) || [];
  assert.ok(tokens.length >= 3, 'expected --font-ui, --font-mono and --font-read');
  tokens.forEach((t) => {
    const fam = t.match(/"([^"]+)"/)[1];
    assert.ok(declared.has(fam), 'font stack leads with an unvendored family: ' + fam);
  });
});

test('css: the dark theme restates every colour the base theme sets', () => {
  // Every colour token is declared twice, once per theme. A token added to
  // :root and forgotten in the override block does not fail loudly -- it
  // inherits the base value, so one swatch stays cream-coloured on a dark page
  // and only the eye catches it. Structural tokens (radii, durations, fonts,
  // widths) are deliberately shared and are identified by having no colour in
  // their value.
  //
  // The base is the LIGHT theme and the override is dark, which is the reverse
  // of how this started: the site now opens on cream and the toggle opts into
  // the dark one. The assertion is the same either way -- whatever :root sets,
  // the attribute block has to answer for.
  const fs = require('fs');
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets/css/app.css'), 'utf8');
  const block = (start) => {
    const i = css.indexOf(start);
    assert.ok(i !== -1, 'missing block: ' + start);
    return css.slice(i, css.indexOf('\n}', i));
  };
  const names = (text) => {
    const found = new Set();
    (text.match(/--[a-z0-9-]+:[^;]+;/g) || []).forEach((d) => {
      const [name, value] = [d.slice(0, d.indexOf(':')), d.slice(d.indexOf(':') + 1)];
      if (/#[0-9a-f]{3,8}|rgba?\(|color-mix/i.test(value)) found.add(name);
    });
    return found;
  };
  const base = names(block(':root {'));
  const dark = names(block('html[data-theme="dark"] {'));
  assert.ok(base.size >= 20, 'expected :root to define the palette');
  const missing = [...base].filter((n) => !dark.has(n)).sort();
  assert.deepStrictEqual(missing, [], 'colour tokens the dark theme never overrides');
});

test('build: no relevance rating survives in the generated output', () => {
  // Relevance is still in the data -- it ranks the dashboard's "Start here" and
  // filters the library -- but it is no longer *displayed* as a row of stars on
  // every concept, card and table row. The one star glyph allowed anywhere is
  // the bookmark toggle, which is a control rather than a rating.
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const files = [];
  ['concepts', 'subjects'].forEach((dir) => {
    const d = path.join(root, dir);
    if (fs.existsSync(d)) {
      fs.readdirSync(d).filter((f) => f.endsWith('.html')).forEach((f) => files.push(path.join(d, f)));
    }
  });
  ['index.html', 'library.html', 'interview.html', 'graph.html'].forEach((f) => {
    const p2 = path.join(root, f);
    if (fs.existsSync(p2)) files.push(p2);
  });
  assert.ok(files.length > 10, 'expected the generated pages to be present');

  const offenders = [];
  files.forEach((f) => {
    const html = fs.readFileSync(f, 'utf8');
    const name = path.relative(root, f);
    if (html.includes('kb-stars')) offenders.push(name + ': kb-stars markup');
    if (html.includes('\u2605')) offenders.push(name + ': filled star glyph');
    // A hollow star is only ever the bookmark button's own label.
    html.replace(/[^\n]*\u2606[^\n]*/g, (line) => {
      if (!line.includes('data-kb-bookmark')) offenders.push(name + ': stray star glyph');
      return line;
    });
  });
  assert.deepStrictEqual(offenders, []);
});

test('build: every concept page opens with an at-a-glance card', () => {
  // The card is built from the concept's own summary, its first formula and the
  // opening bullets of its revision section -- so it can never disagree with the
  // page, but it can silently go missing if the extraction stops matching the
  // rendered markup. That failure is invisible without this.
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const dir = path.join(root, 'concepts');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
  assert.ok(files.length, 'no concept pages built');

  const offenders = [];
  files.forEach((f) => {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    const card = html.match(/<section class="kb-glance"[\s\S]*?<\/section>/);
    if (!card) { offenders.push(f + ': no card'); return; }
    const body = card[0];
    if (!/<p class="kb-glance-lead">\s*\S/.test(body)) offenders.push(f + ': no lead');
    const points = (body.match(/<li>/g) || []).length;
    if (points < 1) offenders.push(f + ': no revision points');
    if (points > 3) offenders.push(f + ': ' + points + ' points, expected at most 3');
    // The old standalone summary must not linger alongside it.
    if (html.includes('kb-concept-summary')) offenders.push(f + ': duplicate summary paragraph');
  });
  assert.deepStrictEqual(offenders, []);
});

test('build: a concept page carries the rail and not the subject tree', () => {
  // Two things a stale template would quietly undo. The subject tree belongs on
  // pages you browse from -- on a concept page it was a second column of links
  // beside the one that navigates the concept itself. And the rail has to keep
  // its explicit column, because the grid places children by name: an unplaced
  // child auto-flows into track 1 and pushes the article out of the layout.
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const dir = path.join(root, 'concepts');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
  assert.ok(files.length, 'no concept pages built');

  const offenders = [];
  files.forEach((f) => {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    if (/class="kb-nav"/.test(html)) offenders.push(f + ': subject tree');
    if (!/class="kb-rail"/.test(html)) offenders.push(f + ': no rail');
    if (!/class="kb-toc kb-rail-group"/.test(html)) offenders.push(f + ': no table of contents');
  });
  assert.deepStrictEqual(offenders, []);

  const css = fs.readFileSync(path.join(root, 'assets/css/app.css'), 'utf8');
  assert.match(css, /\.kb-main--concept > \.kb-rail\s*{[^}]*grid-column: 1/);
  assert.match(css, /\.kb-main--concept > \.kb-article\s*{[^}]*grid-column: 2/);
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

test('css: no rule is qualified on the theme that has no attribute', () => {
  // Light is the base theme and sets no attribute on <html>, so a selector
  // written `html[data-theme="light"] .thing` matches nobody on a first visit
  // and then starts matching after somebody toggles to dark and back. That is
  // not a dead rule -- it is worse: the same theme renders two different ways
  // depending on the reader's history. Theme-specific rules belong under the
  // OVERRIDE theme; whatever is true of the base belongs unqualified.
  //
  // This fired for real when the default flipped: the card-elevation block had
  // the dark treatment unqualified and the light one behind the attribute, so
  // new visitors got a white top-edge highlight drawn on cream cards.
  const fs = require('fs');
  const dir = path.join(__dirname, '..', 'assets/css');
  const offenders = [];
  fs.readdirSync(dir).filter((f) => f.endsWith('.css')).forEach((f) => {
    // Blank the comments out rather than trying to recognise a comment line by
    // its shape -- these files explain themselves at length, and the prose
    // quotes the very selector being warned about. Newlines are preserved so
    // the reported line numbers still point at the real thing.
    const src = fs.readFileSync(path.join(dir, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    src.split('\n').forEach((line, i) => {
      if (/\[data-theme="light"\]/.test(line)) offenders.push(`${f}:${i + 1}`);
    });
  });
  assert.deepStrictEqual(offenders, [], 'rules qualified on the attribute-less base theme');
});

test('dashboard: every hook the script queries exists in index.html', () => {
  // dashboard.js finds its render targets by data attribute, and index.html is
  // hand-written rather than generated -- so a hook renamed on one side and not
  // the other fails silently: the query returns null, the function returns
  // early, and the section is simply absent from the page. Nothing throws and
  // nothing in the build notices. That is exactly how the track grid shipped
  // empty once, when its hook was renamed to avoid colliding with the one
  // interview.js uses for a different rendering.
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const js = fs.readFileSync(path.join(root, 'assets/js/dashboard.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  const hooks = [...js.matchAll(/UI\.\$\('\[(data-kb-[a-z-]+)\]'\)/g)].map((m) => m[1]);
  assert.ok(hooks.length >= 5, `expected the dashboard to query several hooks, saw ${hooks.length}`);
  const missing = [...new Set(hooks)].filter((h) => !html.includes(h)).sort();
  assert.deepStrictEqual(missing, [], 'hooks dashboard.js renders into that index.html never declares');
});

test('dashboard: the "0 dependencies" figure on the home page is true', () => {
  // The only KPI that is not derived from KB_DATA. It is a claim about the
  // repository -- that everything here runs on Node built-ins and a browser --
  // and it is the sort of number that quietly stops being true the first time
  // someone reaches for a package.
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.deepStrictEqual(Object.keys(pkg.dependencies || {}), [], 'runtime dependencies');
  assert.deepStrictEqual(Object.keys(pkg.devDependencies || {}), [], 'dev dependencies');
  assert.ok(!fs.existsSync(path.join(root, 'node_modules')), 'node_modules should not exist');

  const js = fs.readFileSync(path.join(root, 'assets/js/dashboard.js'), 'utf8');
  assert.ok(/value: 0, label: 'Dependencies'/.test(js),
    'the dashboard no longer states a dependency count -- drop this test with it');
});

test('content: every subject carries a card-sized blurb', () => {
  // The subject grid shows all two dozen side by side at 210px. `description`
  // is a full sentence written for the subject page's header and wraps to five
  // lines in a card; `blurb` is the version written for the grid. The model
  // falls back to the description when a blurb is missing, so a forgotten one
  // is not a crash -- it is one card three times taller than its neighbours.
  const fs = require('fs');
  const raw = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'content/subjects.json'), 'utf8'));
  const missing = raw.filter((s) => !s.blurb).map((s) => s.id);
  assert.deepStrictEqual(missing, [], 'subjects with no blurb');
  const tooLong = raw.filter((s) => s.blurb.length > 60).map((s) => `${s.id} (${s.blurb.length})`);
  assert.deepStrictEqual(tooLong, [], 'blurbs longer than a card line or two');
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
