/* Dashboard: KPIs, progress rollups, subject grid. All rendered from KB_DATA,
   so a new subject or concept appears here without touching this file. */
(function (global) {
  'use strict';

  var KB = global.KB, UI = global.KBUI;
  var esc = KB.util.escapeHtml;

  var GROUP_LABEL = {
    mathematics: 'Mathematical foundations',
    modelling: 'Modelling & inference',
    strategy: 'Strategy & portfolio',
    markets: 'Markets & instruments',
    craft: 'Craft',
    other: 'Other',
  };

  function pct(x) { return Math.round(x * 100); }

  function renderKpis() {
    var host = UI.$('[data-kb-kpis]');
    if (!host) return;
    var s = KB.stats;
    var live = KB.progress(KB.concepts.map(function (c) { return c.id; }));
    var mastered = KB.concepts.filter(function (c) { return KB.statusOf(c.id) === 'mastered'; }).length;
    var highValue = KB.concepts.filter(function (c) { return c.interviewRelevance >= 4; });
    var gaps = highValue.filter(function (c) {
      return KB.statusMeta[KB.statusOf(c.id)].weight < 0.75;
    }).length;

    var items = [
      { label: 'Concepts', value: s.concepts, note: KB.subjects.filter(function (x) { return x.conceptCount; }).length + ' subjects covered' },
      { label: 'Formulas', value: s.formulas, note: 'indexed & searchable' },
      { label: 'Questions', value: s.questions, note: 'in the interview bank' },
      { label: 'Mastered', value: mastered, note: pct(live) + '% weighted progress' },
      { label: 'Interview gaps', value: gaps, note: '4★+ not yet learned' },
    ];
    host.innerHTML = items.map(function (i) {
      return '<div class="kb-kpi"><span class="kb-kpi-label">' + esc(i.label) + '</span>' +
        '<span class="kb-kpi-value">' + esc(String(i.value)) + '</span>' +
        '<span class="kb-kpi-note">' + esc(i.note) + '</span></div>';
    }).join('');
  }

  function renderProgress() {
    var host = UI.$('[data-kb-progress]');
    if (!host) return;
    var rows = KB.subjects
      .filter(function (s) { return s.conceptCount > 0; })
      .map(function (s) { return { s: s, p: KB.subjectProgress(s.id) }; })
      .sort(function (a, b) { return b.p - a.p || b.s.conceptCount - a.s.conceptCount; });

    host.innerHTML = rows.length ? rows.map(function (r) {
      return '<a class="kb-progress-row" href="subjects/' + esc(r.s.id) + '.html">' +
        '<span class="kb-progress-name">' + esc(r.s.name) + '</span>' +
        '<span class="kb-bar"><span class="kb-bar-fill" style="width:' + pct(r.p) +
        '%;background:' + esc(r.s.color) + '"></span></span>' +
        '<span class="kb-bar-num">' + pct(r.p) + '%</span></a>';
    }).join('') : '<p class="kb-empty">No concepts yet.</p>';
  }

  function renderSubjects() {
    var host = UI.$('[data-kb-subjects]');
    if (!host) return;
    var showEmpty = KB.prefs.showEmptySubjects !== false;
    var groups = [];
    KB.subjects.forEach(function (s) {
      if (!showEmpty && !s.conceptCount) return;
      var g = groups.find(function (x) { return x.id === s.group; });
      if (!g) { g = { id: s.group, subjects: [] }; groups.push(g); }
      g.subjects.push(s);
    });

    host.innerHTML = groups.map(function (g) {
      return '<div class="kb-groupbar"><span class="kb-groupbar-label">' +
        esc(GROUP_LABEL[g.id] || g.id) + '</span><span class="kb-groupbar-line"></span>' +
        '<span class="kb-groupbar-label">' + g.subjects.reduce(function (n, s) { return n + s.conceptCount; }, 0) +
        ' concepts</span></div>' +
        '<div class="kb-subjects">' + g.subjects.map(card).join('') + '</div>';
    }).join('');
  }

  function card(s) {
    var p = KB.subjectProgress(s.id);
    return '<a class="kb-subject-card" href="subjects/' + esc(s.id) + '.html" ' +
      'style="--subject-color:' + esc(s.color) + '" data-empty="' + (s.conceptCount === 0) + '">' +
      '<span class="kb-subject-card-top">' +
        '<span class="kb-subject-mark">' + esc(s.icon) + '</span>' +
        '<span class="kb-subject-card-name">' + esc(s.name) + '</span>' +
        '<span class="kb-subject-card-count">' + s.conceptCount + '</span>' +
      '</span>' +
      '<p class="kb-subject-card-desc">' + esc(s.description) + '</p>' +
      '<span class="kb-subject-card-foot">' +
        '<span class="kb-bar"><span class="kb-bar-fill" style="width:' + pct(p) +
        '%;background:' + esc(s.color) + '"></span></span>' +
        '<span class="kb-bar-num">' + pct(p) + '%</span>' +
      '</span></a>';
  }

  function renderRecent() {
    var host = UI.$('[data-kb-continue]');
    if (!host) return;
    // "Continue" = in-progress first, then the highest-relevance unstarted work.
    var scored = KB.concepts.map(function (c) {
      var w = KB.statusMeta[KB.statusOf(c.id)].weight;
      var score = (w > 0 && w < 1 ? 100 : 0) + c.interviewRelevance * 10 - w * 12;
      return { c: c, score: score, w: w };
    }).filter(function (r) { return r.w < 1; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 6);

    host.innerHTML = scored.length ? scored.map(function (r) {
      var c = r.c;
      return '<a class="kb-cram-item" href="' + esc(c.path) + '">' +
        '<span><strong>' + esc(c.title) + '</strong>' +
        '<small>' + esc((KB.subject(c.subject) || {}).name) + ' · ' + esc(c.summary) + '</small></span>' +
        '<span class="kb-result-meta">' + KB.util.stars(c.interviewRelevance) +
        '<span class="kb-statusdot" data-status="' + esc(KB.statusOf(c.id)) + '"></span></span></a>';
    }).join('') : '<p class="kb-empty">Everything is mastered. Add more concepts.</p>';
  }

  function renderTags() {
    var host = UI.$('[data-kb-tags]');
    if (!host) return;
    host.innerHTML = KB.tags.slice(0, 28).map(function (t) {
      return '<a class="kb-tag" href="library.html?tag=' + encodeURIComponent(t.id) + '">#' +
        esc(t.id) + ' <span style="opacity:.55">' + t.count + '</span></a>';
    }).join('') || '<p class="kb-empty">No tags yet.</p>';
  }

  function renderAll() {
    renderKpis(); renderProgress(); renderSubjects(); renderRecent(); renderTags();
    var stamp = UI.$('[data-kb-generated]');
    if (stamp) {
      // The build is deterministic, so there is no build timestamp to show —
      // the content fingerprint is the more useful thing anyway.
      var bits = [];
      if (KB.data.contentUpdated) bits.push('content updated ' + KB.data.contentUpdated);
      if (KB.data.contentHash) bits.push('index ' + KB.data.contentHash);
      stamp.textContent = bits.join(' · ');
    }
  }

  KB.on(function (type) { if (type !== 'bookmark') renderAll(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderAll);
  else renderAll();
})(window);
