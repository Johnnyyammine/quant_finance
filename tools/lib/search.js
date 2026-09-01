'use strict';
/**
 * Client-side search index.
 *
 * Shape: a sorted term array + parallel postings array. Sorting the terms lets
 * the browser binary-search a prefix in O(log n) and then walk the run of
 * matches, which is what keeps type-ahead instant at 1,000+ concepts without
 * shipping a search library. Postings are flat [docId, score, docId, score...]
 * pairs to keep the generated file small.
 */

const FIELD_WEIGHT = {
  title: 12,
  id: 9,
  alias: 9,
  tag: 6,
  subject: 5,
  summary: 4,
  formula: 5,
  question: 3,
  heading: 2,
  body: 1,
};

const STOP = new Set(
  ('a an the of in on at to for and or is are be was were it its as by with from that this these those ' +
   'we you i he she they can will would should if then than but not no do does how what when which why ' +
   'into over under about their there here also such very more most some any each other same own').split(' ')
);

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^a-z0-9'+.^_-]+/)
    .map((t) => t.replace(/^[''.^_-]+|[''.^_-]+$/g, ''))
    .filter((t) => t.length > 1 && t.length < 40);
}

/** Very small suffix stripper -- enough to unify sharpe/sharpes, model/models. */
function stem(t) {
  if (t.length > 4 && t.endsWith('ies')) return t.slice(0, -3) + 'y';
  if (t.length > 4 && (t.endsWith('sses') || t.endsWith('shes') || t.endsWith('ches'))) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') && !t.endsWith('us')) return t.slice(0, -1);
  return t;
}

class IndexBuilder {
  constructor() {
    this.docs = [];
    this.terms = new Map(); // term -> Map(docId -> score)
  }

  addDoc(doc) {
    const id = this.docs.length;
    this.docs.push(doc);
    return id;
  }

  addField(docId, field, text) {
    const weight = FIELD_WEIGHT[field] || 1;
    const counts = new Map();
    for (const raw of tokenize(text)) {
      if (field === 'body' && STOP.has(raw)) continue;
      for (const t of new Set([raw, stem(raw)])) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    for (const [term, n] of counts) {
      let postings = this.terms.get(term);
      if (!postings) { postings = new Map(); this.terms.set(term, postings); }
      // Saturating term frequency: a word repeated 40 times is not 40x better.
      postings.set(docId, (postings.get(docId) || 0) + weight * (1 + Math.log(n)));
    }
  }

  serialise() {
    const terms = [...this.terms.keys()].sort();
    const postings = terms.map((t) => {
      const flat = [];
      for (const [doc, score] of this.terms.get(t)) flat.push(doc, Math.round(score * 10) / 10);
      return flat;
    });
    return { docs: this.docs, terms, postings };
  }
}

/**
 * Build the index over everything a person might search for: concepts,
 * subjects, individual formulas and individual interview questions.
 */
function buildSearchIndex({ concepts, subjects, plainText }) {
  const ix = new IndexBuilder();

  subjects.forEach((s) => {
    const d = ix.addDoc({ t: 'subject', id: s.id, title: s.name, sub: s.id, path: s.path, ctx: 'Subject' });
    ix.addField(d, 'title', s.name);
    ix.addField(d, 'id', s.id.replace(/-/g, ' '));
    ix.addField(d, 'summary', s.description);
  });

  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));

  concepts.forEach((c) => {
    const d = ix.addDoc({
      t: 'concept', id: c.id, title: c.title, sub: c.subject, path: c.path,
      ctx: subjectName.get(c.subject) || c.subject, sum: c.summary,
      diff: c.difficulty, rel: c.interviewRelevance, st: c.status,
    });
    ix.addField(d, 'title', c.title);
    ix.addField(d, 'id', c.id.replace(/-/g, ' '));
    ix.addField(d, 'alias', c.aliases.join(' '));
    ix.addField(d, 'tag', c.tags.join(' ').replace(/-/g, ' '));
    ix.addField(d, 'subject', (subjectName.get(c.subject) || '') + ' ' + c.subject.replace(/-/g, ' '));
    ix.addField(d, 'summary', c.summary);
    ix.addField(d, 'heading', c.sections.map((s) => s.label).join(' '));
    ix.addField(d, 'body', plainText.get(c.id) || '');
    // Formula names and LaTeX identifiers are searchable on the concept too.
    ix.addField(d, 'formula', c.formulas.map((f) => f.name + ' ' + latexWords(f.latex)).join(' '));

    c.formulas.forEach((f) => {
      const fd = ix.addDoc({
        t: 'formula', id: c.id + '#' + f.id, title: f.name || f.latex.slice(0, 48),
        sub: c.subject, path: c.path + '#' + f.id, ctx: c.title, latex: f.latex,
      });
      ix.addField(fd, 'title', f.name);
      ix.addField(fd, 'formula', latexWords(f.latex) + ' ' + f.usedIn.join(' '));
      ix.addField(fd, 'subject', c.title);
    });

    c.questions.forEach((q) => {
      const qd = ix.addDoc({
        t: 'question', id: q.id, title: q.question, sub: c.subject,
        path: c.path + '#q-' + q.id, ctx: c.title, diff: q.difficulty, rel: c.interviewRelevance,
      });
      ix.addField(qd, 'question', q.question);
      ix.addField(qd, 'body', q.answer);
      ix.addField(qd, 'tag', q.tags.join(' '));
      ix.addField(qd, 'subject', c.title);
    });
  });

  return ix.serialise();
}

/** Pull human-meaningful words out of LaTeX so "\text{Sharpe}" is findable. */
function latexWords(latex) {
  return String(latex)
    .replace(/\\(?:text|mathrm|operatorname|mathbf|mathbb|mathcal)\s*\{([^}]*)\}/g, ' $1 ')
    .replace(/\\[a-zA-Z]+/g, (m) => ' ' + m.slice(1) + ' ')
    .replace(/[{}\\^_$&]/g, ' ');
}

module.exports = { buildSearchIndex, tokenize, stem, FIELD_WEIGHT };
