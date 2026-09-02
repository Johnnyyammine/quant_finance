'use strict';
/**
 * The knowledge-base data model.
 *
 * Everything the application knows about a concept is declared here once:
 * the controlled vocabularies, the canonical section order, the normalisation
 * rules and the validation. Adding a field means editing this file and
 * nothing else -- the build, the pages and the UI all read from these tables.
 */

const DIFFICULTY = [
  { id: 'foundational', label: 'Foundational', rank: 1 },
  { id: 'intermediate', label: 'Intermediate', rank: 2 },
  { id: 'advanced', label: 'Advanced', rank: 3 },
  { id: 'research', label: 'Research', rank: 4 },
];

/** Learning status doubles as the progress model: weight drives % complete. */
const STATUS = [
  { id: 'not-started', label: 'Not started', weight: 0 },
  { id: 'learning', label: 'Learning', weight: 0.35 },
  { id: 'learned', label: 'Learned', weight: 0.75 },
  { id: 'mastered', label: 'Mastered', weight: 1 },
];

/**
 * Canonical concept sections. `aliases` let authors write natural headings;
 * the build maps them onto stable ids so the template stays consistent even
 * when wording drifts. Unknown headings are kept in document order.
 */
const SECTIONS = [
  { id: 'intuition', label: 'Intuition', aliases: ['intuition', 'the idea', 'plain english'] },
  { id: 'formulation', label: 'Mathematical Formulation', aliases: ['mathematical formulation', 'mathematical definition', 'definition', 'formalism', 'the math'] },
  { id: 'derivation', label: 'Derivation', aliases: ['derivation', 'derivations', 'proof', 'why it is true'] },
  { id: 'assumptions', label: 'Assumptions & Edge Cases', aliases: ['assumptions', 'assumptions & edge cases', 'assumptions and edge cases', 'edge cases', 'when it breaks'] },
  { id: 'example', label: 'Worked Example', aliases: ['worked example', 'example', 'examples', 'numerical example'] },
  { id: 'quant-application', label: 'Why It Matters in Quant Finance', aliases: ['why it matters in quant finance', 'quant finance application', 'application', 'why it matters'] },
  { id: 'trading-application', label: 'Trading & Research Application', aliases: ['trading & research application', 'trading application', 'trading / hedge fund application', 'on the desk', 'hedge fund application', 'trading and research application'] },
  { id: 'implementation', label: 'Implementation Notes', aliases: ['implementation', 'implementation notes', 'code', 'numerics'] },
  { id: 'mistakes', label: 'Common Mistakes', aliases: ['common mistakes', 'mistakes', 'pitfalls', 'common pitfalls'] },
  { id: 'revision', label: '30-Second Revision', aliases: ['30-second revision', 'quick revision', 'revision', '30 second summary', 'summary', 'tl;dr'] },
];

const SECTION_BY_ALIAS = new Map();
SECTIONS.forEach((s) => {
  SECTION_BY_ALIAS.set(s.id, s);
  s.aliases.forEach((a) => SECTION_BY_ALIAS.set(a, s));
});

/** Sections that are generated from metadata rather than authored prose. */
const DERIVED_SECTIONS = ['formulas', 'questions', 'connections'];

/** Sections a well-formed concept should have; missing ones are warnings. */
const RECOMMENDED = ['intuition', 'formulation', 'example', 'quant-application', 'trading-application', 'mistakes', 'revision'];

const slugify = (s) =>
  String(s == null ? '' : s).toLowerCase().trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const asArray = (v) => {
  if (v == null || v === '') return [];
  if (Array.isArray(v)) return v.filter((x) => x != null && x !== '');
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
};

const clampInt = (v, lo, hi, dflt) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

const oneOf = (v, table, dflt) => {
  const id = slugify(v);
  return table.some((t) => t.id === id) ? id : dflt;
};

/**
 * Normalise raw frontmatter into the canonical concept record.
 * Missing fields get sane defaults so a half-written page still builds.
 */
function normaliseConcept(raw, { file, sourceId }) {
  const errors = [];
  const warnings = [];
  const id = slugify(raw.id || sourceId);
  if (!id) errors.push('concept has no usable id');
  if (raw.id && slugify(raw.id) !== String(raw.id)) {
    warnings.push(`id "${raw.id}" was normalised to "${id}"`);
  }
  if (!raw.title) warnings.push('missing "title" -- falling back to the id');
  if (!raw.subject) errors.push('missing "subject"');
  if (!raw.summary) warnings.push('missing "summary" (the one-sentence definition)');
  // The summary is shown as plain text on cards, in search results and in the
  // page's meta description, so LaTeX in it reaches the reader as raw source.
  // Body text is the place for formulas.
  if (/\$[^$]+\$|\\[a-zA-Z]{2,}/.test(String(raw.summary || ''))) {
    warnings.push('"summary" contains LaTeX; it is rendered as plain text, so write it in prose');
  }

  const questions = asArray(raw.questions).map((q, i) => {
    const item = typeof q === 'string' ? { q } : q || {};
    const text = String(item.q || item.question || '').trim();
    return {
      id: slugify(item.id || `${id}-q${i + 1}`),
      question: text,
      answer: String(item.a || item.answer || '').trim(),
      hint: String(item.hint || '').trim(),
      difficulty: oneOf(item.difficulty, DIFFICULTY, 'intermediate'),
      tags: asArray(item.tags),
      concept: id,
      subject: slugify(raw.subject),
    };
  }).filter((q) => q.question);

  return {
    concept: {
      id,
      title: String(raw.title || id).trim(),
      subject: slugify(raw.subject),
      summary: String(raw.summary || '').trim(),
      difficulty: oneOf(raw.difficulty, DIFFICULTY, 'intermediate'),
      interviewRelevance: clampInt(raw.interview_relevance ?? raw.interviewRelevance, 0, 5, 3),
      status: oneOf(raw.status, STATUS, 'not-started'),
      tags: asArray(raw.tags).map(slugify),
      prerequisites: asArray(raw.prerequisites || raw.prereqs).map(slugify),
      related: asArray(raw.related || raw.related_concepts).map(slugify),
      tracks: asArray(raw.tracks).map(slugify),
      aliases: asArray(raw.aliases),
      references: asArray(raw.references).map((r) =>
        (typeof r === 'string' ? { title: r, url: '' } : { title: r.title || r.name || '', url: r.url || '' })),
      estimatedMinutes: clampInt(raw.minutes ?? raw.estimated_minutes, 1, 600, 12),
      updated: String(raw.updated || '').trim(),
      source: file,
      // filled in by the build
      path: `concepts/${id}.html`,
      formulas: [],
      questions,
      sections: [],
      links: [],
      builtOn: [],
      wordCount: 0,
    },
    errors,
    warnings,
  };
}

function normaliseSubject(raw, order) {
  const id = slugify(raw.id || raw.name);
  return {
    id,
    name: String(raw.name || raw.title || id).trim(),
    description: String(raw.description || '').trim(),
    icon: String(raw.icon || '').trim() || defaultIcon(id),
    color: String(raw.color || '').trim() || '#6f7f95',
    group: slugify(raw.group || 'other'),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : order * 10,
    path: `subjects/${id}.html`,
    conceptCount: 0,
    progress: 0,
  };
}

const ICONS = {
  probability: 'P', statistics: 'S', 'linear-algebra': 'A', calculus: 'd',
  optimization: 'O', 'stochastic-processes': 'W', 'time-series': 'T',
  econometrics: 'E', 'statistical-learning': 'M', 'quantitative-trading': 'Q',
  'alpha-research': 'a', 'factor-models': 'F', 'portfolio-construction': 'C',
  'risk-management': 'R', derivatives: 'D', options: 'G', 'fixed-income': 'B',
  'market-microstructure': 'u', execution: 'X', 'alternative-data': 'Z',
  backtesting: 'K', 'numerical-methods': 'N', programming: 'I', 'mental-math': 'x',
};
const defaultIcon = (id) => ICONS[id] || (id[0] || '?').toUpperCase();

/** Weighted completion of a set of concepts, 0..1. */
function progressOf(concepts) {
  if (!concepts.length) return 0;
  const w = new Map(STATUS.map((s) => [s.id, s.weight]));
  return concepts.reduce((sum, c) => sum + (w.get(c.status) || 0), 0) / concepts.length;
}

/**
 * Derive the graph, reverse dependencies and per-subject rollups.
 * Called once by the build; the browser never recomputes any of it.
 */
function buildIndexes(concepts, subjects, tracks) {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const warnings = [];

  // Reverse prerequisites: "what is built on this concept".
  concepts.forEach((c) => {
    c.prerequisites = c.prerequisites.filter((p) => {
      if (byId.has(p)) return true;
      warnings.push(`${c.id}: prerequisite "${p}" does not exist`);
      return false;
    });
    c.related = c.related.filter((r) => {
      if (r === c.id) return false;
      if (byId.has(r)) return true;
      warnings.push(`${c.id}: related concept "${r}" does not exist`);
      return false;
    });
  });
  concepts.forEach((c) => c.prerequisites.forEach((p) => byId.get(p).builtOn.push(c.id)));

  // Related is symmetric in the graph even when only one side declares it.
  concepts.forEach((c) => c.related.forEach((r) => {
    const other = byId.get(r);
    if (!other.related.includes(c.id)) other.related.push(c.id);
  }));

  const edges = [];
  const seen = new Set();
  concepts.forEach((c) => {
    c.prerequisites.forEach((p) => {
      const key = `p:${p}>${c.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ from: p, to: c.id, type: 'prerequisite' });
    });
    c.related.forEach((r) => {
      const key = `r:${[c.id, r].sort().join('|')}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ from: c.id, to: r, type: 'related' });
    });
  });

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  concepts.forEach((c) => {
    if (!subjectById.has(c.subject)) {
      // Auto-register unknown subjects so a new concept never blocks a build.
      const s = normaliseSubject({ id: c.subject, name: titleCase(c.subject), group: 'other' }, subjects.length + 100);
      subjects.push(s);
      subjectById.set(s.id, s);
      warnings.push(`subject "${c.subject}" was not declared in content/subjects.json -- a stub was generated`);
    }
  });
  subjects.forEach((s) => {
    const own = concepts.filter((c) => c.subject === s.id);
    s.conceptCount = own.length;
    s.progress = progressOf(own);
    s.interviewMax = own.reduce((m, c) => Math.max(m, c.interviewRelevance), 0);
  });

  const tagCounts = new Map();
  concepts.forEach((c) => c.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));

  (tracks || []).forEach((t) => {
    t.conceptIds = concepts
      .filter((c) => c.tracks.includes(t.id) ||
        (t.subjects || []).includes(c.subject) ||
        c.tags.some((tag) => (t.tags || []).includes(tag)))
      .filter((c) => c.interviewRelevance >= (t.minRelevance || 0))
      .sort((a, b) => b.interviewRelevance - a.interviewRelevance || a.title.localeCompare(b.title))
      .map((c) => c.id);
    t.progress = progressOf(t.conceptIds.map((id) => byId.get(id)));
  });

  return {
    edges,
    tags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([id, count]) => ({ id, count })),
    warnings,
  };
}

const titleCase = (s) =>
  String(s).split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function normaliseTrack(raw, order) {
  const id = slugify(raw.id || raw.name);
  return {
    id,
    name: String(raw.name || titleCase(id)).trim(),
    description: String(raw.description || '').trim(),
    subjects: asArray(raw.subjects).map(slugify),
    tags: asArray(raw.tags).map(slugify),
    minRelevance: clampInt(raw.min_relevance ?? raw.minRelevance, 0, 5, 3),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : order * 10,
    conceptIds: [],
    progress: 0,
  };
}

module.exports = {
  DIFFICULTY, STATUS, SECTIONS, SECTION_BY_ALIAS, DERIVED_SECTIONS, RECOMMENDED,
  slugify, asArray, titleCase, progressOf,
  normaliseConcept, normaliseSubject, normaliseTrack, buildIndexes,
};
