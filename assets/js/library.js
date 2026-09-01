/* Library: the full concept table with faceted filtering, sorting and
   URL-shareable state. Facets are derived from the data, never hardcoded. */
(function (global) {
  'use strict';

  var KB = global.KB, UI = global.KBUI;
  var esc = KB.util.escapeHtml;

  var state = {
    q: '', subjects: [], difficulty: [], status: [], tags: [], minRel: 0,
    bookmarked: false, sort: 'relevance', dir: 'desc',
  };

  function readUrl() {
    var get = KB.util.param;
    ['tag', 'subject', 'difficulty', 'status'].forEach(function (k) {
      var v = get(k);
      if (!v) return;
      var target = k === 'tag' ? 'tags' : k === 'subject' ? 'subjects' : k;
      state[target] = v.split(',');
    });
    if (get('q')) state.q = get('q');
    if (get('rel')) state.minRel = Number(get('rel')) || 0;
    if (get('bookmarked')) state.bookmarked = true;
  }

  function writeUrl() {
    var parts = [];
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (state.tags.length) parts.push('tag=' + state.tags.join(','));
    if (state.subjects.length) parts.push('subject=' + state.subjects.join(','));
    if (state.difficulty.length) parts.push('difficulty=' + state.difficulty.join(','));
    if (state.status.length) parts.push('status=' + state.status.join(','));
    if (state.minRel) parts.push('rel=' + state.minRel);
    if (state.bookmarked) parts.push('bookmarked=1');
    var url = global.location.pathname + (parts.length ? '?' + parts.join('&') : '');
    global.history.replaceState(null, '', url);
  }

  function matches(c) {
    if (state.subjects.length && state.subjects.indexOf(c.subject) === -1) return false;
    if (state.difficulty.length && state.difficulty.indexOf(c.difficulty) === -1) return false;
    if (state.status.length && state.status.indexOf(KB.statusOf(c.id)) === -1) return false;
    if (state.minRel && c.interviewRelevance < state.minRel) return false;
    if (state.bookmarked && !KB.isBookmarked(c.id)) return false;
    if (state.tags.length && !state.tags.every(function (t) { return c.tags.indexOf(t) !== -1; })) return false;
    return true;
  }

  function current() {
    var pool;
    if (state.q.trim()) {
      // Reuse the search index so the library ranks the same way the palette does.
      var order = {};
      KB.search(state.q, { limit: 500, types: ['concept'] }).forEach(function (r, i) { order[r.doc.id] = i; });
      pool = KB.concepts.filter(function (c) { return order[c.id] != null; });
      pool.sort(function (a, b) { return order[a.id] - order[b.id]; });
      if (state.sort === 'relevance') return pool.filter(matches);
    } else {
      pool = KB.concepts.slice();
    }
    pool = pool.filter(matches);
    var dir = state.dir === 'asc' ? 1 : -1;
    var diffRank = {};
    KB.vocab.difficulty.forEach(function (d) { diffRank[d.id] = d.rank; });
    pool.sort(function (a, b) {
      switch (state.sort) {
        case 'title': return a.title.localeCompare(b.title) * -dir;
        case 'subject': return (a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title)) * -dir;
        case 'difficulty': return ((diffRank[a.difficulty] - diffRank[b.difficulty]) || a.title.localeCompare(b.title)) * dir;
        case 'status': return ((KB.statusMeta[KB.statusOf(a.id)].weight - KB.statusMeta[KB.statusOf(b.id)].weight)
          || a.title.localeCompare(b.title)) * dir;
        case 'length': return (a.wordCount - b.wordCount) * dir;
        default: return ((a.interviewRelevance - b.interviewRelevance) || a.title.localeCompare(b.title) * -1) * dir;
      }
    });
    return pool;
  }

  function facetGroup(title, key, options) {
    return '<div class="kb-facet"><h3>' + esc(title) + '</h3><div class="kb-facet-options">' +
      options.map(function (o) {
        var on = state[key].indexOf(o.id) !== -1;
        return '<button class="kb-facet-opt" type="button" data-facet="' + key + '" data-value="' +
          esc(o.id) + '" aria-pressed="' + on + '">' + esc(o.label) +
          '<span class="kb-facet-count">' + o.count + '</span></button>';
      }).join('') + '</div></div>';
  }

  function renderFacets() {
    var host = UI.$('[data-kb-facets]');
    if (!host) return;
    var count = function (fn) { return KB.concepts.filter(fn).length; };

    host.innerHTML =
      facetGroup('Subject', 'subjects', KB.subjects.filter(function (s) { return s.conceptCount; })
        .map(function (s) { return { id: s.id, label: s.name, count: s.conceptCount }; })) +
      facetGroup('Difficulty', 'difficulty', KB.vocab.difficulty.map(function (d) {
        return { id: d.id, label: d.label, count: count(function (c) { return c.difficulty === d.id; }) };
      })) +
      facetGroup('Status', 'status', KB.vocab.status.map(function (s) {
        return { id: s.id, label: s.label, count: count(function (c) { return KB.statusOf(c.id) === s.id; }) };
      })) +
      '<div class="kb-facet"><h3>Interview relevance</h3><div class="kb-facet-options">' +
      [5, 4, 3, 0].map(function (n) {
        return '<button class="kb-facet-opt" type="button" data-minrel="' + n + '" aria-pressed="' +
          (state.minRel === n) + '">' + (n ? '★'.repeat(n) + ' and up' : 'Any') +
          '<span class="kb-facet-count">' + count(function (c) { return c.interviewRelevance >= n; }) +
          '</span></button>';
      }).join('') + '</div></div>' +
      '<div class="kb-facet"><h3>Saved</h3><div class="kb-facet-options">' +
      '<button class="kb-facet-opt" type="button" data-bookmarked aria-pressed="' + state.bookmarked +
      '">Bookmarked<span class="kb-facet-count">' + KB.bookmarks().length + '</span></button></div></div>' +
      '<div class="kb-facet"><h3>Tags</h3><div class="kb-facet-tags">' +
      KB.tags.slice(0, 40).map(function (t) {
        var on = state.tags.indexOf(t.id) !== -1;
        return '<button class="kb-tag" type="button" data-facet="tags" data-value="' + esc(t.id) +
          '" style="' + (on ? 'border-color:var(--accent);color:var(--accent-ink)' : '') + '">#' +
          esc(t.id) + '</button>';
      }).join('') + '</div></div>';
  }

  var COLUMNS = [
    { id: 'title', label: 'Concept' },
    { id: 'subject', label: 'Subject' },
    { id: 'difficulty', label: 'Level' },
    { id: 'relevance', label: 'Interview' },
    { id: 'status', label: 'Status' },
    { id: 'length', label: 'Words' },
  ];

  function renderTable() {
    var host = UI.$('[data-kb-table]');
    if (!host) return;
    var rows = current();

    UI.$('[data-kb-count]').textContent = rows.length + ' of ' + KB.concepts.length + ' concepts';

    host.innerHTML = '<thead><tr>' + COLUMNS.map(function (col) {
      var sorted = state.sort === col.id;
      return '<th data-sort="' + col.id + '"' +
        (sorted ? ' aria-sort="' + (state.dir === 'asc' ? 'ascending' : 'descending') + '"' : '') +
        '>' + esc(col.label) + '</th>';
    }).join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map(function (c) {
        return '<tr>' +
          '<td class="kb-cell-title"><a href="' + esc(c.path) + '">' + esc(c.title) +
          '<span class="kb-cell-sum">' + esc(c.summary) + '</span></a></td>' +
          '<td><a href="subjects/' + esc(c.subject) + '.html" style="color:var(--ink-muted)">' +
          esc((KB.subject(c.subject) || {}).name) + '</a></td>' +
          '<td><span class="kb-pill kb-pill--' + esc(c.difficulty) + '">' +
          esc(KB.difficultyMeta[c.difficulty].label) + '</span></td>' +
          '<td>' + KB.util.stars(c.interviewRelevance) + '</td>' +
          '<td><span class="kb-statusdot" data-kb-status-dot="' + esc(c.id) + '" data-status="' +
          esc(KB.statusOf(c.id)) + '"></span> <span style="font-size:11.5px;color:var(--ink-muted)">' +
          esc(KB.statusMeta[KB.statusOf(c.id)].label) + '</span></td>' +
          '<td class="kb-cell-num">' + c.wordCount.toLocaleString() + '</td></tr>';
      }).join('')
        : '<tr><td colspan="6" class="kb-empty">No concepts match these filters.</td></tr>') +
      '</tbody>';
  }

  function render() { renderFacets(); renderTable(); writeUrl(); }

  function boot() {
    readUrl();
    var input = UI.$('[data-kb-library-search]');
    if (input) {
      input.value = state.q;
      input.addEventListener('input', function () { state.q = input.value; renderTable(); writeUrl(); });
    }

    document.addEventListener('click', function (e) {
      var facet = e.target.closest('[data-facet]');
      if (facet) {
        var key = facet.getAttribute('data-facet');
        var val = facet.getAttribute('data-value');
        var i = state[key].indexOf(val);
        if (i === -1) state[key].push(val); else state[key].splice(i, 1);
        render();
        return;
      }
      var rel = e.target.closest('[data-minrel]');
      if (rel) { state.minRel = Number(rel.getAttribute('data-minrel')); render(); return; }
      var bm = e.target.closest('[data-bookmarked]');
      if (bm) { state.bookmarked = !state.bookmarked; render(); return; }
      var clear = e.target.closest('[data-kb-clear]');
      if (clear) {
        state.subjects = []; state.difficulty = []; state.status = []; state.tags = [];
        state.minRel = 0; state.bookmarked = false; state.q = '';
        if (input) input.value = '';
        render();
        return;
      }
      var th = e.target.closest('th[data-sort]');
      if (th) {
        var col = th.getAttribute('data-sort');
        if (state.sort === col) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
        else { state.sort = col; state.dir = 'desc'; }
        renderTable();
      }
    });

    KB.on(function () { render(); });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
