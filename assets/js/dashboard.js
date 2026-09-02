/* Dashboard: KPIs, subject grid, tags. All rendered from KB_DATA, so a new
   subject or concept appears here without touching this file. */
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

  function renderKpis() {
    var host = UI.$('[data-kb-kpis]');
    if (!host) return;
    var s = KB.stats;
    var highValue = KB.concepts.filter(function (c) { return c.interviewRelevance >= 4; }).length;

    var items = [
      { label: 'Concepts', value: s.concepts, note: KB.subjects.filter(function (x) { return x.conceptCount; }).length + ' subjects covered' },
      { label: 'Formulas', value: s.formulas, note: 'indexed & searchable' },
      { label: 'Questions', value: s.questions, note: 'in the interview bank' },
      { label: 'Words', value: s.words.toLocaleString(), note: 'of written explanation' },
      { label: 'Interview core', value: highValue, note: '4★+ concepts' },
    ];
    host.innerHTML = items.map(function (i) {
      return '<div class="kb-kpi"><span class="kb-kpi-label">' + esc(i.label) + '</span>' +
        '<span class="kb-kpi-value">' + esc(String(i.value)) + '</span>' +
        '<span class="kb-kpi-note">' + esc(i.note) + '</span></div>';
    }).join('');
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
    return '<a class="kb-subject-card" href="subjects/' + esc(s.id) + '.html" ' +
      'style="--subject-color:' + esc(s.color) + '" data-empty="' + (s.conceptCount === 0) + '">' +
      '<span class="kb-subject-card-top">' +
        '<span class="kb-subject-mark">' + esc(s.icon) + '</span>' +
        '<span class="kb-subject-card-name">' + esc(s.name) + '</span>' +
        '<span class="kb-subject-card-count">' + s.conceptCount + '</span>' +
      '</span>' +
      '<p class="kb-subject-card-desc">' + esc(s.description) + '</p></a>';
  }

  function renderRecent() {
    var host = UI.$('[data-kb-continue]');
    if (!host) return;
    // The concepts an interviewer is most likely to open with: highest
    // relevance first, richest question bank as the tie-break.
    var top = KB.concepts.slice()
      .sort(function (a, b) {
        return (b.interviewRelevance - a.interviewRelevance) ||
          (b.questions.length - a.questions.length) ||
          a.title.localeCompare(b.title);
      })
      .slice(0, 6);

    host.innerHTML = top.length ? top.map(function (c) {
      return '<a class="kb-cram-item" href="' + esc(c.path) + '">' +
        '<span><strong>' + esc(c.title) + '</strong>' +
        '<small>' + esc((KB.subject(c.subject) || {}).name) + ' · ' + esc(c.summary) + '</small></span>' +
        '<span class="kb-result-meta">' + KB.util.stars(c.interviewRelevance) + '</span></a>';
    }).join('') : '<p class="kb-empty">No concepts yet.</p>';
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
    renderKpis(); renderSubjects(); renderRecent(); renderTags();
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
