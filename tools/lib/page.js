'use strict';
/**
 * Static page templates.
 *
 * Concept and subject pages are generated as complete HTML: the prose is baked
 * in so a page is readable, printable and greppable with JavaScript disabled.
 * JavaScript only *enhances* -- search, filtering, interactive modules.
 */

const { escapeHtml } = require('./markdown');
const { DIFFICULTY } = require('./model');

const attr = escapeHtml;
const DIFF_LABEL = new Map(DIFFICULTY.map((d) => [d.id, d.label]));

function stars(n) {
  const full = '★'.repeat(n);
  const empty = '☆'.repeat(5 - n);
  return `<span class="kb-stars" title="Interview relevance ${n} of 5" aria-label="Interview relevance ${n} of 5">` +
    `<span class="kb-stars-on">${full}</span><span class="kb-stars-off">${empty}</span></span>`;
}

/**
 * @param {object} o { base, title, description, bodyClass, head, body, scripts, page }
 */
function shell(o) {
  const b = o.base;
  return `<!DOCTYPE html>
<html lang="en" data-page="${attr(o.page || '')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(o.title)}</title>
<meta name="description" content="${attr(o.description || '')}">
<link rel="icon" href="${b}assets/icons/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${b}assets/vendor/katex/katex.min.css">
<link rel="stylesheet" href="${b}assets/css/app.css">
<link rel="stylesheet" href="${b}assets/css/views.css">
${o.head || ''}
</head>
<body class="${attr(o.bodyClass || '')}">
${o.body}
<script src="${b}data/kb.data.js"></script>
<script src="${b}data/search.index.js"></script>
<script src="${b}assets/js/kb-core.js"></script>
<script src="${b}assets/js/kb-ui.js"></script>
<script src="${b}assets/vendor/katex/katex.min.js" defer></script>
<script src="${b}assets/vendor/katex/auto-render.min.js" defer></script>
<script src="${b}assets/js/math.js" defer></script>
${(o.scripts || []).map((s) => `<script src="${b}${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}

/** Top chrome shared by every page. Breadcrumb items: {label, href?}. */
function topbar(base, crumbs) {
  const trail = crumbs
    .map((c, i) => {
      const last = i === crumbs.length - 1;
      const inner = c.href && !last
        ? `<a href="${attr(c.href)}">${escapeHtml(c.label)}</a>`
        : `<span aria-current="page">${escapeHtml(c.label)}</span>`;
      return `<li>${inner}</li>`;
    })
    .join('<li class="kb-crumb-sep" aria-hidden="true">/</li>');
  return `<header class="kb-topbar">
  <a class="kb-brand" href="${base}index.html" title="Home (H)">
    <span class="kb-brand-mark">QF</span><span class="kb-brand-text">Quant Knowledge Base</span>
  </a>
  <nav class="kb-crumbs" aria-label="Breadcrumb"><ol>${trail}</ol></nav>
  <div class="kb-topbar-actions">
    <button class="kb-searchbtn" type="button" data-kb-open-search>
      <span>Search concepts, formulas, questions</span><kbd>/</kbd>
    </button>
    <nav class="kb-toplinks" aria-label="Sections">
      <a href="${base}index.html" data-nav="home">Dashboard</a>
      <a href="${base}graph.html" data-nav="graph">Graph</a>
      <a href="${base}interview.html" data-nav="interview">Interview</a>
      <a href="${base}library.html" data-nav="library">Library</a>
    </nav>
    <button class="kb-iconbtn" type="button" data-kb-theme title="Toggle theme (T)" aria-label="Toggle theme">◑</button>
    <button class="kb-iconbtn" type="button" data-kb-help title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">?</button>
  </div>
</header>`;
}

/* ------------------------------------------------------------- concept ---- */

/**
 * Persistent site navigation: every subject that has content, with its
 * concepts underneath. This is the piece a reference site lives or dies on --
 * you move between concepts without going back to an index, and you can always
 * see where the page you are on sits in the whole.
 *
 * Rendered as <details> so the open/closed state needs no JavaScript; the
 * section containing the current page is forced open.
 */
function siteNav(base, groups, currentId, currentSubject) {
  const section = (g) => {
    const here = g.subject.id === currentSubject;
    return `<details class="kb-nav-group"${here ? ' open' : ''}>
      <summary class="kb-nav-summary">
        <span class="kb-nav-dot" style="background:${attr(g.subject.color)}"></span>
        <span class="kb-nav-name">${escapeHtml(g.subject.name)}</span>
        <span class="kb-nav-count">${g.concepts.length}</span>
      </summary>
      <ul class="kb-nav-list">
        ${g.concepts.map((c) => {
          const on = c.id === currentId;
          return `<li><a class="kb-nav-link${on ? ' is-current' : ''}" href="${base}concepts/${attr(c.id)}.html"${on ? ' aria-current="page"' : ''}>${escapeHtml(c.title)}</a></li>`;
        }).join('')}
      </ul>
    </details>`;
  };

  return `<nav class="kb-nav" aria-label="All concepts">
    <a class="kb-nav-top${currentId || currentSubject ? '' : ' is-current'}" href="${base}index.html">Dashboard</a>
    <a class="kb-nav-top" href="${base}library.html">Library</a>
    <a class="kb-nav-top" href="${base}interview.html">Interview mode</a>
    <a class="kb-nav-top" href="${base}graph.html">Knowledge graph</a>
    <div class="kb-nav-heading">Subjects</div>
    ${groups.map(section).join('')}
  </nav>`;
}

function conceptPage(c, ctx) {
  const base = '../';
  const subject = ctx.subject;
  const byId = ctx.byId;
  const link = (id) => `${base}concepts/${id}.html`;

  const relatedGroup = (title, ids, note) => {
    if (!ids.length) return '';
    return `<section class="kb-relgroup"><h3>${escapeHtml(title)}</h3>` +
      (note ? `<p class="kb-relnote">${escapeHtml(note)}</p>` : '') +
      `<ul class="kb-rellist">${ids.map((id) => {
        const t = byId.get(id);
        if (!t) return '';
        return `<li><a href="${link(id)}" class="kb-relitem">
          <span class="kb-relitem-title">${escapeHtml(t.title)}</span>
          <span class="kb-relitem-meta">${escapeHtml(ctx.subjectName(t.subject))} · ${escapeHtml(DIFF_LABEL.get(t.difficulty))}</span>
          <span class="kb-relitem-sum">${escapeHtml(t.summary)}</span>
        </a></li>`;
      }).join('')}</ul></section>`;
  };

  const toc = c.sections.length
    ? `<nav class="kb-toc" aria-label="On this page"><h3>On this page</h3><ol>${
        c.sections.map((s) => `<li><a href="#${attr(s.id)}">${escapeHtml(s.label)}</a></li>`).join('')
      }${c.formulas.length ? '<li><a href="#key-formulas">Key Formulas</a></li>' : ''
      }${c.questions.length ? '<li><a href="#interview-questions">Interview Questions</a></li>' : ''
      }<li><a href="#connections">Connections</a></li></ol></nav>`
    : '';

  const formulaCard = c.formulas.length
    ? `<section class="kb-side-card" id="side-formulas"><h3>Key formulas</h3><ul class="kb-side-formulas">${
        c.formulas.map((f) => `<li><a href="#${attr(f.id)}">${escapeHtml(f.name || f.latex.slice(0, 40))}</a></li>`).join('')
      }</ul></section>`
    : '';

  const questionsHtml = c.questions.length
    ? `<section class="kb-section" id="interview-questions">
        <h2 class="kb-h kb-h2"><a class="kb-anchor" href="#interview-questions" aria-label="Link to this section">#</a>Interview Questions</h2>
        <ol class="kb-questions">${c.questions.map((q) => `
          <li class="kb-question" id="q-${attr(q.id)}" data-difficulty="${attr(q.difficulty)}">
            <div class="kb-question-head">
              <span class="kb-question-text">${ctx.inlineMd(q.question)}</span>
              <span class="kb-tagline">${escapeHtml(DIFF_LABEL.get(q.difficulty))}${
                q.tags.length ? ' · ' + q.tags.map(escapeHtml).join(' · ') : ''}</span>
            </div>
            ${q.hint ? `<details class="kb-hint"><summary>Hint</summary><div>${ctx.md(q.hint)}</div></details>` : ''}
            ${q.answer ? `<details class="kb-answer"><summary>Answer</summary><div class="kb-answer-body">${ctx.md(q.answer)}</div></details>`
              : '<p class="kb-answer-missing">No model answer recorded yet.</p>'}
          </li>`).join('')}</ol>
      </section>`
    : '';

  const formulasSection = c.formulas.length
    ? `<section class="kb-section" id="key-formulas">
        <h2 class="kb-h kb-h2"><a class="kb-anchor" href="#key-formulas" aria-label="Link to this section">#</a>Key Formulas</h2>
        <div class="kb-formula-recap">${c.formulas.map((f) => `
          <a class="kb-formula-recap-item" href="#${attr(f.id)}">
            <span class="kb-formula-recap-name">${escapeHtml(f.name || 'Formula')}</span>
            <span class="math-display">\\[${escapeHtml(f.latex)}\\]</span>
          </a>`).join('')}</div>
      </section>`
    : '';

  const nav = `<nav class="kb-prevnext" aria-label="Concept navigation">
    ${ctx.prev ? `<a class="kb-prevnext-item kb-prevnext-prev" href="${link(ctx.prev.id)}" rel="prev">
      <span class="kb-prevnext-label">← Previous</span><span>${escapeHtml(ctx.prev.title)}</span></a>` : '<span></span>'}
    <a class="kb-prevnext-item kb-prevnext-up" href="${base}subjects/${attr(subject.id)}.html">
      <span class="kb-prevnext-label">Subject</span><span>${escapeHtml(subject.name)}</span></a>
    ${ctx.next ? `<a class="kb-prevnext-item kb-prevnext-next" href="${link(ctx.next.id)}" rel="next">
      <span class="kb-prevnext-label">Next →</span><span>${escapeHtml(ctx.next.title)}</span></a>` : '<span></span>'}
  </nav>`;

  const body = `${topbar(base, [
    { label: 'Dashboard', href: base + 'index.html' },
    { label: subject.name, href: base + 'subjects/' + subject.id + '.html' },
    { label: c.title },
  ])}
<main class="kb-main kb-main--concept" data-concept-id="${attr(c.id)}">
  ${siteNav(base, ctx.navGroups || [], c.id, subject.id)}
  <article class="kb-article">
    <header class="kb-concept-head">
      <div class="kb-concept-eyebrow">
        <a class="kb-subject-chip" href="${base}subjects/${attr(subject.id)}.html" style="--subject-color:${attr(subject.color)}">
          <span class="kb-subject-mark">${escapeHtml(subject.icon)}</span>${escapeHtml(subject.name)}</a>
        <span class="kb-pill kb-pill--${attr(c.difficulty)}">${escapeHtml(DIFF_LABEL.get(c.difficulty))}</span>
        ${stars(c.interviewRelevance)}
        <span class="kb-meta-dot">·</span>
        <span class="kb-readtime">${c.estimatedMinutes} min</span>
      </div>
      <h1 class="kb-concept-title">${escapeHtml(c.title)}</h1>
      <p class="kb-concept-summary">${ctx.inlineMd(c.summary)}</p>
      <div class="kb-concept-controls">
        <button class="kb-btn kb-btn--ghost" type="button" data-kb-bookmark="${attr(c.id)}">☆ Bookmark</button>
        <button class="kb-btn kb-btn--ghost" type="button" data-kb-flashcards>Revision card</button>
        <a class="kb-btn kb-btn--ghost" href="${base}graph.html?focus=${attr(c.id)}">Show in graph</a>
      </div>
      ${c.tags.length ? `<ul class="kb-taglist">${c.tags.map((t) =>
        `<li><a class="kb-tag" href="${base}library.html?tag=${attr(t)}">#${escapeHtml(t)}</a></li>`).join('')}</ul>` : ''}
    </header>

    <div class="kb-content">${c.html}</div>
    ${formulasSection}
    ${questionsHtml}

    <section class="kb-section" id="connections">
      <h2 class="kb-h kb-h2"><a class="kb-anchor" href="#connections" aria-label="Link to this section">#</a>Connections</h2>
      <div class="kb-connections">
        ${relatedGroup('Prerequisites', c.prerequisites, 'Understand these first.')}
        ${relatedGroup('Builds towards', c.builtOn, 'Concepts that depend on this one.')}
        ${relatedGroup('Related', c.related, '')}
        ${!c.prerequisites.length && !c.builtOn.length && !c.related.length
          ? '<p class="kb-empty">No relationships recorded yet. Add <code>prerequisites:</code> or <code>related:</code> to the frontmatter.</p>' : ''}
      </div>
      ${c.references.length ? `<div class="kb-references"><h3>References</h3><ul>${c.references.map((r) =>
        `<li>${r.url ? `<a href="${attr(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a>`
          : escapeHtml(r.title)}</li>`).join('')}</ul></div>` : ''}
    </section>

    ${nav}
    <footer class="kb-source-note">
      Source: <code>${escapeHtml(c.source)}</code>${c.updated ? ` · updated ${escapeHtml(c.updated)}` : ''}
      · edit the markdown and run <code>npm run build</code>.
    </footer>
  </article>

  <aside class="kb-sidebar">
    ${toc}
    ${formulaCard}
    <section class="kb-side-card">
      <h3>Metadata</h3>
      <dl class="kb-meta">
        <dt>Subject</dt><dd><a href="${base}subjects/${attr(subject.id)}.html">${escapeHtml(subject.name)}</a></dd>
        <dt>Difficulty</dt><dd>${escapeHtml(DIFF_LABEL.get(c.difficulty))}</dd>
        <dt>Interview</dt><dd>${stars(c.interviewRelevance)}</dd>
        <dt>Prereqs</dt><dd>${c.prerequisites.length || '—'}</dd>
        <dt>Formulas</dt><dd>${c.formulas.length || '—'}</dd>
        <dt>Questions</dt><dd>${c.questions.length || '—'}</dd>
      </dl>
    </section>
    <section class="kb-side-card kb-side-minimap">
      <h3>Neighbourhood</h3>
      <canvas data-kb-minimap="${attr(c.id)}" width="260" height="200" aria-label="Local knowledge graph"></canvas>
      <a class="kb-side-more" href="${base}graph.html?focus=${attr(c.id)}">Open full graph →</a>
    </section>
  </aside>
</main>`;

  return shell({
    base,
    page: 'concept',
    title: `${c.title} · Quant Knowledge Base`,
    description: c.summary,
    bodyClass: 'kb-body kb-body--concept',
    body,
    scripts: ['assets/js/concept.js', ...ctx.moduleScripts],
  });
}

/* ------------------------------------------------------------- subject ---- */

function subjectPage(s, concepts, ctx) {
  const base = '../';
  const rows = concepts.map((c) => `
    <li class="kb-conceptrow" data-difficulty="${attr(c.difficulty)}"
        data-relevance="${c.interviewRelevance}" data-tags="${attr(c.tags.join(' '))}" data-id="${attr(c.id)}">
      <a class="kb-conceptrow-link" href="${base}concepts/${attr(c.id)}.html">
        <span class="kb-conceptrow-main">
          <span class="kb-conceptrow-title">${escapeHtml(c.title)}</span>
          <span class="kb-conceptrow-sum">${escapeHtml(c.summary)}</span>
        </span>
        <span class="kb-conceptrow-meta">
          <span class="kb-pill kb-pill--${attr(c.difficulty)}">${escapeHtml(DIFF_LABEL.get(c.difficulty))}</span>
          ${stars(c.interviewRelevance)}
        </span>
      </a>
    </li>`).join('');

  const body = `${topbar(base, [
    { label: 'Dashboard', href: base + 'index.html' },
    { label: s.name },
  ])}
<main class="kb-main kb-main--subject" data-subject-id="${attr(s.id)}">
  ${siteNav(base, ctx.navGroups || [], null, s.id)}
  <div class="kb-subject-wrap">
    <header class="kb-subject-head" style="--subject-color:${attr(s.color)}">
      <div class="kb-subject-mark kb-subject-mark--lg">${escapeHtml(s.icon)}</div>
      <div>
        <h1>${escapeHtml(s.name)}</h1>
        <p class="kb-subject-desc">${escapeHtml(s.description)}</p>
        <div class="kb-subject-stats">
          <span><strong>${concepts.length}</strong> concepts</span>
          <span><strong>${concepts.reduce((n, c) => n + c.formulas.length, 0)}</strong> formulas</span>
          <span><strong>${concepts.reduce((n, c) => n + c.questions.length, 0)}</strong> questions</span>
        </div>
      </div>
    </header>

    <div class="kb-filterbar" data-kb-filters>
      <input class="kb-filter-input" type="search" placeholder="Filter concepts in this subject…" data-kb-filter-text>
      <select data-kb-filter="difficulty"><option value="">All difficulty</option>${
        DIFFICULTY.map((d) => `<option value="${d.id}">${d.label}</option>`).join('')}</select>
      <select data-kb-filter="relevance"><option value="">Any relevance</option>${
        [5, 4, 3, 2, 1].map((n) => `<option value="${n}">${'★'.repeat(n)} and up</option>`).join('')}</select>
      <span class="kb-filter-count" data-kb-filter-count></span>
    </div>

    <ol class="kb-conceptlist">${rows || '<li class="kb-empty">No concepts in this subject yet.</li>'}</ol>

    <section class="kb-subject-graph">
      <h2>Concept map</h2>
      <canvas data-kb-subject-graph="${attr(s.id)}" height="360" aria-label="Concept map for ${attr(s.name)}"></canvas>
    </section>
  </div>
</main>`;

  return shell({
    base,
    page: 'subject',
    title: `${s.name} · Quant Knowledge Base`,
    description: s.description,
    bodyClass: 'kb-body kb-body--subject',
    body,
    scripts: ['assets/js/subject.js'],
  });
}

module.exports = { shell, topbar, conceptPage, subjectPage, stars };
