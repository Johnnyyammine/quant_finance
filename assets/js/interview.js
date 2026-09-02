/* ==========================================================================
   Interview Mode.
   Two halves: a cram sheet (the highest-value concepts for a chosen track,
   sorted by interview relevance) and a question drill that pulls from the
   question bank the build extracts from every concept's frontmatter.
   Tracks are data (content/tracks.json), so adding one needs no code.
   ========================================================================== */
(function (global) {
  'use strict';

  var KB = global.KB, UI = global.KBUI;
  var esc = KB.util.escapeHtml;

  var state = { track: null, minRel: 4, difficulty: '', queue: [], at: 0, revealed: false };

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  /* --------------------------------------------------------------- data -- */

  function trackConcepts(trackId) {
    if (!trackId) {
      return KB.concepts.filter(function (c) { return c.interviewRelevance >= state.minRel; });
    }
    var t = KB.track(trackId);
    if (!t) return [];
    return t.conceptIds.map(KB.concept).filter(function (c) {
      return c && c.interviewRelevance >= state.minRel;
    });
  }

  function questionBank() {
    var ids = {};
    trackConcepts(state.track).forEach(function (c) { ids[c.id] = true; });
    var out = [];
    KB.concepts.forEach(function (c) {
      if (!ids[c.id]) return;
      c.questions.forEach(function (q) {
        if (state.difficulty && q.difficulty !== state.difficulty) return;
        out.push({ q: q, c: c });
      });
    });
    return out;
  }

  /* ------------------------------------------------------------- render -- */

  function renderTracks() {
    var host = UI.$('[data-kb-tracks]');
    var all = [{ id: null, name: 'Everything', description: 'Every concept at or above the relevance threshold, across all subjects.', conceptIds: null }]
      .concat(KB.tracks);
    host.innerHTML = all.map(function (t) {
      var cs = trackConcepts(t.id);
      var qs = cs.reduce(function (n, c) { return n + c.questions.length; }, 0);
      return '<button class="kb-track" type="button" data-track="' + esc(t.id || '') +
        '" aria-pressed="' + (state.track === t.id) + '">' +
        '<span class="kb-track-name">' + esc(t.name) + '</span>' +
        '<p class="kb-track-desc">' + esc(t.description) + '</p>' +
        '<span class="kb-track-foot">' + plural(cs.length, 'concept') +
        '<span class="kb-track-rule"></span>' + plural(qs, 'question') + '</span></button>';
    }).join('');
  }

  function renderCram() {
    var host = UI.$('[data-kb-cram]');
    var cs = trackConcepts(state.track).slice().sort(function (a, b) {
      return b.interviewRelevance - a.interviewRelevance || a.title.localeCompare(b.title);
    });
    UI.$('[data-kb-cram-count]').textContent = plural(cs.length, 'concept') + ' · ' +
      plural(cs.reduce(function (n, c) { return n + c.questions.length; }, 0), 'question');

    host.innerHTML = cs.length ? cs.map(function (c) {
      return '<a class="kb-cram-item" href="' + esc(c.path) + '">' +
        '<span><strong>' + esc(c.title) + '</strong>' +
        '<small>' + esc((KB.subject(c.subject) || {}).name) + ' · ' + esc(c.summary) + '</small></span>' +
        '<span class="kb-result-meta">' + KB.util.stars(c.interviewRelevance) + '</span></a>';
    }).join('') : '<p class="kb-empty">No concepts match. Lower the relevance threshold, or add content for this track.</p>';
  }

  function shuffle(a, seed) {
    var r = seed || Date.now();
    var rand = function () { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; };
    for (var i = a.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function newQueue() {
    state.queue = shuffle(questionBank());
    state.at = 0;
    state.revealed = false;
    renderDrill();
  }

  function renderDrill() {
    var host = UI.$('[data-kb-drill]');
    if (!state.queue.length) {
      host.innerHTML = '<p class="kb-empty">No questions in this selection yet.<br>' +
        'Add a <code>questions:</code> block to a concept and run <code>npm run build</code>.</p>';
      return;
    }
    var item = state.queue[state.at % state.queue.length];
    var q = item.q, c = item.c;
    var drill = KB.drills()[q.id] || { seen: 0, right: 0, wrong: 0 };

    host.innerHTML =
      '<div class="kb-drillcard-eyebrow">' +
        '<a href="' + esc(c.path) + '" style="color:var(--ink-muted)">' + esc(c.title) + '</a>' +
        '<span class="kb-pill kb-pill--' + esc(q.difficulty) + '">' + esc(q.difficulty) + '</span>' +
        KB.util.stars(c.interviewRelevance) +
        (drill.seen ? '<span style="margin-left:auto">seen ' + drill.seen + '× · ' +
          drill.right + ' right</span>' : '') +
      '</div>' +
      '<p class="kb-drillcard-q">' + esc(q.question) + '</p>' +
      '<div class="kb-drillcard-a"' + (state.revealed ? '' : ' hidden') + '>' +
        (q.hasAnswer
          ? '<p style="color:var(--ink-muted);font-size:12.5px">Model answer lives on the concept page — ' +
            '<a href="' + esc(q.path) + '">open it</a>.</p>'
          : '<p style="color:var(--ink-faint)">No model answer recorded yet.</p>') +
      '</div>' +
      '<div class="kb-drillcard-foot">' +
        (state.revealed
          ? '<button class="kb-btn kb-btn--primary" data-drill="right">Got it</button>' +
            '<button class="kb-btn" data-drill="wrong">Missed it</button>' +
            '<a class="kb-btn kb-btn--ghost" href="' + esc(q.path) + '">Read the answer</a>'
          : '<button class="kb-btn kb-btn--primary" data-drill="reveal">Reveal <kbd>space</kbd></button>') +
        '<button class="kb-btn kb-btn--ghost" data-drill="skip">Skip</button>' +
        '<span class="kb-drill-progress">' + ((state.at % state.queue.length) + 1) + ' / ' + state.queue.length + '</span>' +
      '</div>';
  }

  function advance(verdict) {
    var item = state.queue[state.at % state.queue.length];
    if (verdict && item) KB.recordDrill(item.q.id, verdict);
    state.at += 1;
    state.revealed = false;
    renderDrill();
  }

  function renderAll() { renderTracks(); renderCram(); renderDrill(); }

  /* ---------------------------------------------------------------- boot -- */

  function boot() {
    if (!UI.$('[data-kb-tracks]')) return;
    var t = KB.util.param('track');
    if (t && KB.track(t)) state.track = t;

    var relSel = UI.$('[data-kb-rel]');
    relSel.value = String(state.minRel);
    relSel.addEventListener('change', function () { state.minRel = Number(relSel.value); newQueue(); renderAll(); });

    var diffSel = UI.$('[data-kb-diff]');
    diffSel.innerHTML = '<option value="">Any difficulty</option>' +
      KB.vocab.difficulty.map(function (d) { return '<option value="' + d.id + '">' + d.label + '</option>'; }).join('');
    diffSel.addEventListener('change', function () { state.difficulty = diffSel.value; newQueue(); });

    document.addEventListener('click', function (e) {
      var track = e.target.closest('[data-track]');
      if (track) {
        state.track = track.getAttribute('data-track') || null;
        newQueue();
        renderAll();
        var url = global.location.pathname + (state.track ? '?track=' + state.track : '');
        global.history.replaceState(null, '', url);
        return;
      }
      var drill = e.target.closest('[data-drill]');
      if (drill) {
        var action = drill.getAttribute('data-drill');
        if (action === 'reveal') { state.revealed = true; renderDrill(); }
        else if (action === 'skip') advance(null);
        else advance(action);
        return;
      }
      if (e.target.closest('[data-kb-shuffle]')) newQueue();
    });

    document.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
      if (e.key === ' ') {
        e.preventDefault();
        if (!state.revealed) { state.revealed = true; renderDrill(); } else advance(null);
      } else if (e.key === '1' && state.revealed) advance('right');
      else if (e.key === '2' && state.revealed) advance('wrong');
      else if (e.key === 'n') advance(null);
    });

    newQueue();
    renderAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
