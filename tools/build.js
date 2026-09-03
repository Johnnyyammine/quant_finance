#!/usr/bin/env node
'use strict';
/**
 * Knowledge-base build.
 *
 *   content/concepts/*.md  +  content/subjects.json  +  content/tracks.json
 *        -> data/kb.data.js       (window.KB_DATA, loadable over file://)
 *        -> data/search.index.js  (window.KB_SEARCH)
 *        -> data/kb.json          (same payload, for external tooling)
 *        -> concepts/<id>.html
 *        -> subjects/<id>.html
 *
 * Deliberately dependency-free: Node built-ins only, so `npm install` is
 * never required and the repository stays usable offline forever.
 *
 * Usage: node tools/build.js [--watch] [--quiet] [--strict]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { frontmatter } = require('./lib/yaml');
const md = require('./lib/markdown');
const model = require('./lib/model');
const page = require('./lib/page');
const { buildSearchIndex } = require('./lib/search');

const ROOT = path.resolve(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);
const args = new Set(process.argv.slice(2));
const QUIET = args.has('--quiet');
const STRICT = args.has('--strict');

const C = process.stdout.isTTY
  ? { dim: '\u001b[2m', red: '\u001b[31m', yellow: '\u001b[33m', green: '\u001b[32m', bold: '\u001b[1m', off: '\u001b[0m' }
  : { dim: '', red: '', yellow: '', green: '', bold: '', off: '' };

const log = (...a) => { if (!QUIET) console.log(...a); };

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`${path.relative(ROOT, file)} is not valid JSON: ${e.message}`);
  }
}

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (entry.name.endsWith(ext) && !entry.name.startsWith('_')) out.push(full);
  }
  return out;
}

function writeIfChanged(file, content, stats) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) {
    stats.unchanged += 1;
    return false;
  }
  fs.writeFileSync(file, content);
  stats.written += 1;
  return true;
}

/** Remove generated pages whose source markdown is gone. */
function prune(dir, keep, stats) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.html')) continue;
    if (keep.has(name)) continue;
    fs.unlinkSync(path.join(dir, name));
    stats.pruned.push(path.join(path.basename(dir), name));
  }
}

/** How many revision bullets the summary card carries. */
const GLANCE_POINTS = 3;

/**
 * The first `n` list items of the first list under the heading with `id`.
 *
 * Slices rendered HTML rather than re-parsing the markdown: the bullets carry
 * inline maths and wiki links that only exist after rendering, and lifting the
 * finished markup guarantees the card and the section it quotes can never
 * disagree. Bounded to the slice between this heading and the next one, so a
 * section without a list yields nothing rather than borrowing the next one's.
 */
function firstListItems(html, id, n) {
  const head = html.indexOf(`<h2 id="${id}"`);
  if (head === -1) return [];
  const rest = html.slice(head);
  const end = rest.indexOf('<h2 ', 1);
  const section = end === -1 ? rest : rest.slice(0, end);
  const list = section.match(/<ul[^>]*>([\s\S]*?)<\/ul>/);
  if (!list) return [];
  const items = list[1].match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];
  return items.slice(0, n).map((li) => li.replace(/^<li[^>]*>/, '').replace(/<\/li>$/, '').trim());
}

function build() {
  const t0 = Date.now();
  const problems = { errors: [], warnings: [] };
  const err = (file, msg) => problems.errors.push(`${file}: ${msg}`);
  const warn = (file, msg) => problems.warnings.push(`${file}: ${msg}`);

  /* ---------------------------------------------------- load subjects ---- */
  const subjectsRaw = readJson(P('content/subjects.json'), []);
  const subjects = (Array.isArray(subjectsRaw) ? subjectsRaw : subjectsRaw.subjects || [])
    .map((s, i) => model.normaliseSubject(s, i));
  const tracksRaw = readJson(P('content/tracks.json'), []);
  const tracks = (Array.isArray(tracksRaw) ? tracksRaw : tracksRaw.tracks || [])
    .map((t, i) => model.normaliseTrack(t, i));

  /* ---------------------------------------------------- load concepts ---- */
  const files = walk(P('content/concepts'), '.md').sort();
  const concepts = [];
  const rawBodies = new Map();
  const seenIds = new Map();

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    let parsed;
    try {
      parsed = frontmatter(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      err(rel, `frontmatter could not be parsed (${e.message})`);
      continue;
    }
    const sourceId = path.basename(file, '.md');
    const { concept, errors, warnings } = model.normaliseConcept(parsed.data, { file: rel, sourceId });
    errors.forEach((m) => err(rel, m));
    warnings.forEach((m) => warn(rel, m));
    if (errors.length) continue;
    if (seenIds.has(concept.id)) {
      err(rel, `duplicate id "${concept.id}" (already defined in ${seenIds.get(concept.id)})`);
      continue;
    }
    seenIds.set(concept.id, rel);
    rawBodies.set(concept.id, parsed.body);
    concepts.push(concept);
  }

  const byId = new Map(concepts.map((c) => [c.id, c]));

  /* ------------------------------------------------------ render prose --- */
  const plainText = new Map();
  for (const c of concepts) {
    const body = rawBodies.get(c.id);
    const resolveLink = (id) => {
      const target = byId.get(model.slugify(id));
      return target ? { href: `${target.id}.html`, title: target.title } : { missing: true };
    };
    const out = md.render(body, { resolveLink });
    c.html = out.html;
    c.formulas = out.formulas;
    c.modules = [...new Set(out.modules)];
    c.links = [...new Set(out.links.map(model.slugify))].filter((id) => byId.has(id) && id !== c.id);
    c.sections = out.headings
      .filter((h) => h.level === 2)
      .map((h) => {
        const canonical = model.SECTION_BY_ALIAS.get(h.text.toLowerCase().replace(/\s+/g, ' ').trim());
        return { id: h.id, label: h.text, canonical: canonical ? canonical.id : null };
      });
    out.warnings.forEach((m) => warn(c.source, m));

    // The "at a glance" card is assembled here rather than in the template so
    // it ships inside the static HTML -- a reader with JavaScript off still
    // gets it. It reuses what the author already wrote: the first few bullets
    // of the revision section, which is the one section written to be read in
    // isolation. Nothing new to maintain, and it cannot drift from the page.
    const revision = c.sections.find((h) => h.canonical === 'revision');
    c.glance = revision ? firstListItems(c.html, revision.id, GLANCE_POINTS) : [];
    if (revision && !c.glance.length) {
      warn(c.source, 'the revision section has no bullet list, so the summary card has no points');
    }

    const text = md.toText(body);
    plainText.set(c.id, text);
    c.wordCount = text ? text.split(/\s+/).length : 0;

    const have = new Set(c.sections.map((s) => s.canonical).filter(Boolean));
    const missing = model.RECOMMENDED.filter((s) => !have.has(s));
    if (missing.length) warn(c.source, `missing recommended section(s): ${missing.join(', ')}`);

    // Prose wiki links imply a relationship; fold them into "related" so the
    // graph reflects what you actually wrote, not just what you declared.
    c.links.forEach((id) => {
      if (!c.related.includes(id) && !c.prerequisites.includes(id)) c.related.push(id);
    });
  }

  /* -------------------------------------------------------- index pass --- */
  const { edges, tags, warnings: modelWarnings } = model.buildIndexes(concepts, subjects, tracks);
  modelWarnings.forEach((m) => warn('model', m));
  subjects.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  tracks.sort((a, b) => a.order - b.order);

  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || model.titleCase(id);
  const orderIn = new Map();
  subjects.forEach((s) => {
    const own = concepts
      .filter((c) => c.subject === s.id)
      .sort((a, b) => {
        // Order within a subject: prerequisites first, then difficulty, then title.
        const ap = a.prerequisites.filter((p) => byId.get(p).subject === s.id).length;
        const bp = b.prerequisites.filter((p) => byId.get(p).subject === s.id).length;
        return ap - bp ||
          model.DIFFICULTY.findIndex((d) => d.id === a.difficulty) - model.DIFFICULTY.findIndex((d) => d.id === b.difficulty) ||
          a.title.localeCompare(b.title);
      });
    orderIn.set(s.id, own);
  });

  /* ------------------------------------------------------------ output --- */
  const stats = { written: 0, unchanged: 0, pruned: [] };

  // Persistent navigation tree, shared by every generated page. Only subjects
  // that actually have concepts appear -- an empty section in a sidebar is a
  // dead end, and the dashboard already lists the ones still to be written.
  const navGroups = subjects
    .filter((s) => (orderIn.get(s.id) || []).length)
    .map((s) => ({ subject: s, concepts: orderIn.get(s.id) || [] }));

  // Fingerprint of the inputs. Sorted so it does not depend on directory order.
  const contentHash = crypto.createHash('sha1')
    .update(JSON.stringify([...rawBodies.entries()].sort((a, b) => a[0].localeCompare(b[0]))))
    .update(JSON.stringify(subjects.map((s) => s.id)))
    .update(JSON.stringify(tracks.map((t) => t.id)))
    .digest('hex')
    .slice(0, 12);
  const contentUpdated = concepts.map((c) => c.updated).filter(Boolean).sort().pop() || '';

  const payload = {
    // Deliberately NOT a wall-clock timestamp: the build is deterministic, so
    // identical content produces byte-identical output. That keeps `git status`
    // clean across rebuilds and lets CI verify the committed output is current.
    contentHash: contentHash,
    contentUpdated: contentUpdated,
    version: 1,
    vocab: {
      difficulty: model.DIFFICULTY,
      sections: model.SECTIONS.map(({ id, label }) => ({ id, label })),
    },
    subjects,
    tracks,
    tags,
    edges,
    concepts: concepts.map((c) => ({
      id: c.id, title: c.title, subject: c.subject, summary: c.summary,
      difficulty: c.difficulty, interviewRelevance: c.interviewRelevance,
      tags: c.tags, prerequisites: c.prerequisites, related: c.related, builtOn: c.builtOn,
      tracks: c.tracks, path: c.path, estimatedMinutes: c.estimatedMinutes, wordCount: c.wordCount,
      updated: c.updated, modules: c.modules,
      sections: c.sections.map((s) => ({ id: s.id, label: s.label })),
      formulas: c.formulas.map((f) => ({ id: f.id, name: f.name, latex: f.latex, usedIn: f.usedIn })),
      questions: c.questions.map((q) => ({
        id: q.id, question: q.question, difficulty: q.difficulty, tags: q.tags,
        concept: q.concept, subject: q.subject, hasAnswer: Boolean(q.answer),
        path: `${c.path}#q-${q.id}`,
      })),
    })),
    stats: {
      concepts: concepts.length,
      subjects: subjects.length,
      formulas: concepts.reduce((n, c) => n + c.formulas.length, 0),
      questions: concepts.reduce((n, c) => n + c.questions.length, 0),
      words: concepts.reduce((n, c) => n + c.wordCount, 0),
    },
  };

  const banner = '/* GENERATED by tools/build.js -- do not edit. Run `npm run build`. */\n';
  writeIfChanged(P('data/kb.data.js'), banner + 'window.KB_DATA = ' + JSON.stringify(payload) + ';\n', stats);
  writeIfChanged(P('data/kb.json'), JSON.stringify(payload, null, 2) + '\n', stats);

  const searchIndex = buildSearchIndex({ concepts, subjects, plainText });
  writeIfChanged(P('data/search.index.js'), banner + 'window.KB_SEARCH = ' + JSON.stringify(searchIndex) + ';\n', stats);

  // Concept pages
  const keepConcepts = new Set();
  for (const c of concepts) {
    const siblings = orderIn.get(c.subject) || [];
    const i = siblings.findIndex((x) => x.id === c.id);
    const subject = subjects.find((s) => s.id === c.subject);
    const found = c.modules
      .map((m) => `assets/js/modules/${m}.js`)
      .filter((rel) => {
        if (fs.existsSync(P(rel))) return true;
        warn(c.source, `interactive module "${path.basename(rel, '.js')}" has no script at ${rel}`);
        return false;
      });
    // The plotting helper is only shipped to pages that actually mount a module.
    const moduleScripts = found.length ? ['assets/js/lib/plot.js', ...found] : [];
    const html = page.conceptPage(c, {
      subject,
      byId,
      subjectName,
      navGroups,
      prev: i > 0 ? siblings[i - 1] : null,
      next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null,
      moduleScripts,
      md: (src) => md.render(src, { resolveLink: (id) => {
        const t = byId.get(model.slugify(id));
        return t ? { href: `${t.id}.html`, title: t.title } : { missing: true };
      } }).html,
      inlineMd: (src) => md.render(src, {}).html.replace(/^<p>|<\/p>$/g, ''),
    });
    keepConcepts.add(`${c.id}.html`);
    writeIfChanged(P('concepts', `${c.id}.html`), html, stats);
  }
  prune(P('concepts'), keepConcepts, stats);

  // Subject pages
  const keepSubjects = new Set();
  for (const s of subjects) {
    const html = page.subjectPage(s, orderIn.get(s.id) || [], { subjectName, navGroups });
    keepSubjects.add(`${s.id}.html`);
    writeIfChanged(P('subjects', `${s.id}.html`), html, stats);
  }
  prune(P('subjects'), keepSubjects, stats);

  /* ------------------------------------------------------------ report --- */
  const ms = Date.now() - t0;
  if (!QUIET) {
    problems.warnings.forEach((w) => console.log(`${C.yellow}warn${C.off}  ${w}`));
    problems.errors.forEach((e) => console.log(`${C.red}ERROR${C.off} ${e}`));
    stats.pruned.forEach((f) => console.log(`${C.dim}pruned ${f}${C.off}`));
    console.log(
      `${C.green}${C.bold}built${C.off} ${payload.stats.concepts} concepts · ` +
      `${payload.stats.subjects} subjects · ${payload.stats.formulas} formulas · ` +
      `${payload.stats.questions} questions · ${payload.stats.words.toLocaleString()} words\n` +
      `${C.dim}${stats.written} files written, ${stats.unchanged} unchanged, ` +
      `${problems.warnings.length} warnings, ${problems.errors.length} errors in ${ms}ms${C.off}`
    );
    if (!concepts.length) {
      console.log(`${C.yellow}No concepts found. Add one with: npm run new -- "My Concept" --subject probability${C.off}`);
    }
  }

  return { problems, payload };
}

function watch() {
  const dirs = [P('content'), P('tools'), P('assets/js'), P('assets/css')];
  let timer = null;
  const rerun = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.clear();
      console.log(`${C.dim}${new Date().toLocaleTimeString()} rebuilding…${C.off}`);
      try { build(); } catch (e) { console.error(`${C.red}build failed:${C.off} ${e.message}`); }
    }, 80);
  };
  dirs.forEach((d) => {
    if (fs.existsSync(d)) fs.watch(d, { recursive: true }, rerun);
  });
  console.log(`${C.dim}watching content/ and tools/ — Ctrl+C to stop${C.off}`);
}

if (require.main === module) {
  let result;
  try {
    result = build();
  } catch (e) {
    console.error(`${C.red}build failed:${C.off} ${e.message}`);
    process.exit(1);
  }
  if (args.has('--watch')) watch();
  else if (result.problems.errors.length || (STRICT && result.problems.warnings.length)) process.exit(1);
}

module.exports = { build };
