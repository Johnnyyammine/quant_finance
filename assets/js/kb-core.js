/* ==========================================================================
   KB core — data access, search, personal state.
   Plain script (no modules): ES modules are blocked by CORS over file://,
   and this knowledge base must work from a double-click.
   ========================================================================== */
(function (global) {
  'use strict';

  var DATA = global.KB_DATA || { concepts: [], subjects: [], tracks: [], edges: [], tags: [], stats: {}, vocab: {} };
  var SEARCH = global.KB_SEARCH || { docs: [], terms: [], postings: [] };

  /* ------------------------------------------------------------- lookup -- */

  var conceptById = Object.create(null);
  DATA.concepts.forEach(function (c) { conceptById[c.id] = c; });
  var subjectById = Object.create(null);
  DATA.subjects.forEach(function (s) { subjectById[s.id] = s; });
  var trackById = Object.create(null);
  (DATA.tracks || []).forEach(function (t) { trackById[t.id] = t; });

  var STATUS_META = Object.create(null);
  (DATA.vocab.status || []).forEach(function (s) { STATUS_META[s.id] = s; });
  var DIFF_META = Object.create(null);
  (DATA.vocab.difficulty || []).forEach(function (d) { DIFF_META[d.id] = d; });

  /* ------------------------------------------------- personal state store -- */
  /**
   * Everything the reader changes (status overrides, bookmarks, drill history)
   * lives in one localStorage blob, separate from the generated content. That
   * keeps `npm run build` non-destructive and makes the state exportable —
   * the seam through which spaced repetition and notes will later plug in.
   */
  var KEY = 'qfkb:v1';
  var state = { status: {}, bookmarks: {}, notes: {}, drills: {}, theme: null, prefs: {} };

  function load() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        Object.keys(state).forEach(function (k) {
          if (parsed[k] != null) state[k] = parsed[k];
        });
      }
    } catch (e) { /* private mode, disabled storage: fall back to in-memory */ }
  }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { global.localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { /* quota or disabled: state stays in memory for this session */ }
    }, 120);
  }
  load();

  var listeners = [];
  function emit(type, detail) {
    listeners.forEach(function (fn) { try { fn(type, detail); } catch (e) { console.error(e); } });
  }

  /** Effective status = authored status in the markdown, overridden locally. */
  function statusOf(id) {
    if (Object.prototype.hasOwnProperty.call(state.status, id)) return state.status[id];
    var c = conceptById[id];
    return c ? c.status : 'not-started';
  }

  function setStatus(id, value) {
    var c = conceptById[id];
    if (c && c.status === value) delete state.status[id];
    else state.status[id] = value;
    save();
    emit('status', { id: id, status: value });
  }

  function isBookmarked(id) { return Boolean(state.bookmarks[id]); }
  function toggleBookmark(id) {
    if (state.bookmarks[id]) delete state.bookmarks[id];
    else state.bookmarks[id] = Date.now();
    save();
    emit('bookmark', { id: id, on: isBookmarked(id) });
    return isBookmarked(id);
  }

  function recordDrill(questionId, verdict) {
    var d = state.drills[questionId] || { seen: 0, right: 0, wrong: 0, last: 0 };
    d.seen += 1;
    d.last = Date.now();
    if (verdict === 'right') d.right += 1;
    if (verdict === 'wrong') d.wrong += 1;
    state.drills[questionId] = d;
    save();
  }

  /** Weighted progress over a list of concept ids, honouring local overrides. */
  function progress(ids) {
    if (!ids.length) return 0;
    var total = 0;
    ids.forEach(function (id) {
      var meta = STATUS_META[statusOf(id)];
      total += meta ? meta.weight : 0;
    });
    return total / ids.length;
  }

  function subjectProgress(subjectId) {
    return progress(DATA.concepts.filter(function (c) { return c.subject === subjectId; })
      .map(function (c) { return c.id; }));
  }

  function exportState() {
    return JSON.stringify({ exported: new Date().toISOString(), state: state }, null, 2);
  }
  function importState(json) {
    var parsed = JSON.parse(json);
    var incoming = parsed.state || parsed;
    Object.keys(state).forEach(function (k) { if (incoming[k] != null) state[k] = incoming[k]; });
    save();
    emit('import', {});
  }
  function resetState() {
    state = { status: {}, bookmarks: {}, notes: {}, drills: {}, theme: state.theme, prefs: {} };
    save();
    emit('reset', {});
  }

  /* ------------------------------------------------------------- search -- */
  /**
   * Prefix search over a sorted term array. Binary-search the lower bound,
   * then walk the run of matching terms. O(log n + matches) per query token,
   * which stays instant well past a thousand concepts.
   */
  function lowerBound(terms, prefix) {
    var lo = 0, hi = terms.length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (terms[mid] < prefix) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function tokenizeQuery(q) {
    return String(q).toLowerCase().split(/[^a-z0-9'+.^_-]+/)
      .map(function (t) { return t.replace(/^[.^_'-]+|[.^_'-]+$/g, ''); })
      .filter(function (t) { return t.length > 0; });
  }

  function stem(t) {
    if (t.length > 4 && t.slice(-3) === 'ies') return t.slice(0, -3) + 'y';
    if (t.length > 3 && t.slice(-1) === 's' && t.slice(-2) !== 'ss' && t.slice(-2) !== 'us') return t.slice(0, -1);
    return t;
  }

  /**
   * @param {string} query
   * @param {object} [opts] { limit, types:[..], subjects:[..], filter(doc) }
   */
  function search(query, opts) {
    opts = opts || {};
    var tokens = tokenizeQuery(query);
    if (!tokens.length) return [];
    var terms = SEARCH.terms, postings = SEARCH.postings;
    var perToken = [];

    tokens.forEach(function (tok) {
      var hits = Object.create(null);
      [tok, stem(tok)].filter(function (v, i, a) { return a.indexOf(v) === i; }).forEach(function (t) {
        var i = lowerBound(terms, t);
        for (; i < terms.length && terms[i].lastIndexOf(t, 0) === 0; i += 1) {
          // Exact term beats a longer prefix match; long tails decay smoothly.
          var penalty = terms[i] === t ? 1 : t.length / terms[i].length;
          var list = postings[i];
          for (var k = 0; k < list.length; k += 2) {
            var doc = list[k];
            var sc = list[k + 1] * penalty;
            if (!hits[doc] || hits[doc] < sc) hits[doc] = sc;
          }
        }
      });
      perToken.push(hits);
    });

    // Documents matching every token rank far above partial matches.
    var scores = Object.create(null);
    var counts = Object.create(null);
    perToken.forEach(function (hits) {
      Object.keys(hits).forEach(function (doc) {
        scores[doc] = (scores[doc] || 0) + hits[doc];
        counts[doc] = (counts[doc] || 0) + 1;
      });
    });

    var out = [];
    Object.keys(scores).forEach(function (docIdx) {
      var doc = SEARCH.docs[docIdx];
      if (!doc) return;
      if (opts.types && opts.types.length && opts.types.indexOf(doc.t) === -1) return;
      if (opts.subjects && opts.subjects.length && opts.subjects.indexOf(doc.sub) === -1) return;
      if (opts.filter && !opts.filter(doc)) return;
      var coverage = counts[docIdx] / tokens.length;
      var score = scores[docIdx] * (coverage === 1 ? 3 : coverage);
      // A title that literally contains the query wins outright.
      if (doc.title && doc.title.toLowerCase().indexOf(query.toLowerCase()) !== -1) score += 40;
      out.push({ doc: doc, score: score, coverage: coverage });
    });

    out.sort(function (a, b) { return b.score - a.score || a.doc.title.length - b.doc.title.length; });
    return out.slice(0, opts.limit || 40);
  }

  /* --------------------------------------------------------------- misc -- */

  function neighbours(id, hops) {
    hops = hops || 1;
    var seen = Object.create(null);
    seen[id] = 0;
    var frontier = [id];
    for (var h = 1; h <= hops; h += 1) {
      var next = [];
      frontier.forEach(function (cur) {
        DATA.edges.forEach(function (e) {
          var other = e.from === cur ? e.to : (e.to === cur ? e.from : null);
          if (other && seen[other] === undefined) { seen[other] = h; next.push(other); }
        });
      });
      frontier = next;
    }
    return seen;
  }

  /** Topological-ish learning path: every prerequisite before the target. */
  function learningPath(targetId) {
    var order = [];
    var mark = Object.create(null);
    (function visit(id, stack) {
      if (mark[id] === 'done' || stack[id]) return;
      stack[id] = true;
      var c = conceptById[id];
      if (c) c.prerequisites.forEach(function (p) { visit(p, stack); });
      delete stack[id];
      mark[id] = 'done';
      order.push(id);
    })(targetId, Object.create(null));
    return order;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function highlight(text, query) {
    var safe = escapeHtml(text);
    var toks = tokenizeQuery(query).filter(function (t) { return t.length > 1; });
    if (!toks.length) return safe;
    var re = new RegExp('(' + toks.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|') + ')', 'ig');
    return safe.replace(re, '<mark>$1</mark>');
  }

  function stars(n) {
    return '<span class="kb-stars"><span class="kb-stars-on">' + '★'.repeat(n) +
      '</span><span class="kb-stars-off">' + '☆'.repeat(5 - n) + '</span></span>';
  }

  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(global.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  /** Path prefix back to the repository root, from wherever this page lives. */
  var base = /\/(concepts|subjects)\/[^/]*$/.test(global.location.pathname) ? '../' : '';

  global.KB = {
    data: DATA,
    search: search,
    searchIndex: SEARCH,
    base: base,
    concept: function (id) { return conceptById[id]; },
    concepts: DATA.concepts,
    subject: function (id) { return subjectById[id]; },
    subjects: DATA.subjects,
    track: function (id) { return trackById[id]; },
    tracks: DATA.tracks || [],
    edges: DATA.edges,
    tags: DATA.tags,
    stats: DATA.stats,
    vocab: DATA.vocab,
    statusMeta: STATUS_META,
    difficultyMeta: DIFF_META,
    statusOf: statusOf,
    setStatus: setStatus,
    isBookmarked: isBookmarked,
    toggleBookmark: toggleBookmark,
    bookmarks: function () { return Object.keys(state.bookmarks); },
    recordDrill: recordDrill,
    drills: function () { return state.drills; },
    prefs: state.prefs,
    savePrefs: save,
    progress: progress,
    subjectProgress: subjectProgress,
    neighbours: neighbours,
    learningPath: learningPath,
    exportState: exportState,
    importState: importState,
    resetState: resetState,
    on: function (fn) { listeners.push(fn); },
    theme: {
      get: function () { return state.theme; },
      set: function (t) { state.theme = t; save(); emit('theme', { theme: t }); },
    },
    util: { escapeHtml: escapeHtml, highlight: highlight, stars: stars, param: param, tokenize: tokenizeQuery },
  };
})(window);
