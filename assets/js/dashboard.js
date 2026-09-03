/* Dashboard: KPIs, the orbit count, the start-here row, the subject grid and
   the interview tracks. Everything is rendered from KB_DATA, so a new subject,
   concept or track appears here without touching this file. */
(function (global) {
  'use strict';

  var KB = global.KB, UI = global.KBUI;
  var esc = KB.util.escapeHtml;

  /* Short labels, not the long ones the subject pages use. These sit in a
     hairline rule beside a row of cards, where "Mathematical foundations"
     reads as a sentence and "Mathematics" reads as a heading. */
  var GROUP_LABEL = {
    mathematics: 'Mathematics',
    modelling: 'Modelling',
    strategy: 'Strategy',
    markets: 'Markets',
    craft: 'Craft',
    other: 'Other',
  };
  var GROUP_ORDER = ['mathematics', 'modelling', 'strategy', 'markets', 'craft', 'other'];

  /* -------------------------------------------------------- prerequisites -- */

  /* How deep a concept sits in the prerequisite DAG: 0 for something with no
     prerequisites, otherwise one past the deepest thing it needs. It is what
     "in prerequisite order" on the start-here row actually sorts by, and it is
     memoised because the same handful of roots is reached from every leaf.

     The `seen` set is not paranoia about bad data so much as insurance: the
     content check warns about a prerequisite cycle but does not refuse to
     build one, and an infinite recursion here would take the whole dashboard
     down rather than mis-sorting four cards. */
  var depthCache = {};
  function depth(id, seen) {
    if (depthCache[id] !== undefined) return depthCache[id];
    seen = seen || {};
    if (seen[id]) return 0;
    seen[id] = true;
    var c = KB.concept(id);
    var pre = (c && c.prerequisites) || [];
    var d = 0;
    pre.forEach(function (p) {
      if (KB.concept(p)) d = Math.max(d, depth(p, seen) + 1);
    });
    delete seen[id];
    depthCache[id] = d;
    return d;
  }

  /* The line under a start-here card. Names what you should have read first,
     because "in prerequisite order" is only useful if each card says what it
     is ordered after. Prerequisites pointing at concepts that do not exist yet
     are skipped rather than printed as a dead title. */
  function prereqNote(c) {
    var names = (c.prerequisites || [])
      .map(function (p) { return KB.concept(p); })
      .filter(Boolean)
      .map(function (p) { return p.title; });
    if (!names.length) return 'no prerequisites';
    if (names.length === 1) return 'after ' + names[0];
    if (names.length === 2) return 'after ' + names[0] + ' + ' + names[1];
    return 'after ' + names[0] + ' + ' + (names.length - 1) + ' more';
  }

  /* ------------------------------------------------------------------ kpis -- */

  function renderKpis() {
    var host = UI.$('[data-kb-kpis]');
    if (!host) return;
    var s = KB.stats;
    var items = [
      { value: s.concepts, label: 'Worked concepts' },
      { value: s.subjects, label: 'Subjects mapped' },
      { value: KB.tracks.length, label: 'Interview tracks' },
      /* Not derived, and deliberately so: it is a fact about package.json, not
         about the content. tools/test.js asserts it stays true. */
      { value: 0, label: 'Dependencies' },
    ];
    host.innerHTML = items.map(function (i) {
      return '<div class="kb-kpi"><span class="kb-kpi-value">' + esc(String(i.value)) + '</span>' +
        '<span class="kb-kpi-label">' + esc(i.label) + '</span></div>';
    }).join('');
  }

  /* The figure in the middle of the hero graphic. Not the concept count: it is
     how many of them are actually wired into the graph the rings are drawing,
     which is the claim the picture is making. */
  function renderOrbit() {
    var host = UI.$('[data-kb-orbit-count]');
    if (!host) return;
    host.textContent = String(KB.concepts.filter(function (c) {
      return (c.prerequisites && c.prerequisites.length) || (c.builtOn && c.builtOn.length);
    }).length);
  }

  /* ------------------------------------------------------------ start here -- */

  function renderStartHere() {
    var host = UI.$('[data-kb-continue]');
    if (!host) return;

    /* Two passes, and they answer different questions. Relevance picks WHICH
       four concepts are worth a card -- the ones an interviewer opens with.
       Depth then decides what ORDER they sit in, so the row reads foundation
       first even though that is not the order relevance would give. */
    var ranked = KB.concepts.slice().sort(function (a, b) {
      return (b.interviewRelevance - a.interviewRelevance) ||
        (b.questions.length - a.questions.length) ||
        a.title.localeCompare(b.title);
    });

    /* At most two per subject. Straight relevance returned three Options cards
       out of four, because the options material is both the best covered and
       the most asked about -- true, and useless as a starting point, since the
       row is then a single topic rather than a route through the base. The cap
       is lifted rather than leaving a gap if it cannot be met. */
    var perSubject = {}, top = [];
    ranked.forEach(function (c) {
      if (top.length < 4 && (perSubject[c.subject] || 0) < 2) {
        perSubject[c.subject] = (perSubject[c.subject] || 0) + 1;
        top.push(c);
      }
    });
    ranked.forEach(function (c) {
      if (top.length < 4 && top.indexOf(c) === -1) top.push(c);
    });

    top.sort(function (a, b) {
      return (depth(a.id) - depth(b.id)) ||
        (b.interviewRelevance - a.interviewRelevance) ||
        a.title.localeCompare(b.title);
    });

    host.innerHTML = top.length ? top.map(function (c) {
      var s = KB.subject(c.subject) || {};
      /* Two tag ramps rather than one per subject: the accent for the
         mathematics a candidate is expected to have, sage for the modelling
         and markets material built on top of it. At four cards a full
         per-subject palette is noise. */
      var tone = s.group === 'mathematics' ? '' : ' kb-eyebrow--sage';
      return '<a class="kb-startcard" href="' + esc(c.path) + '">' +
        '<span class="kb-eyebrow' + tone + '">' + esc(s.name || c.subject) + '</span>' +
        '<span class="kb-startcard-title">' + esc(c.title) + '</span>' +
        '<span class="kb-startcard-sum">' + esc(c.summary) + '</span>' +
        '<span class="kb-startcard-pre">' + esc(prereqNote(c)) + '</span>' +
        '</a>';
    }).join('') : '<p class="kb-empty">No concepts yet.</p>';
  }

  /* --------------------------------------------------------------- subjects -- */

  /* Every subject, filled or not. The empty ones used to be hidden -- on the
     grounds that a plan is not knowledge -- but the taxonomy IS the thing this
     page is showing, and sixteen greyed cards reading EMPTY are an honest
     picture of how much of it is written, without needing a count to say so.
     They are spans rather than links: there is a generated page behind each
     one, and it has nothing on it. */
  function renderSubjects() {
    var host = UI.$('[data-kb-subjects]');
    if (!host) return;

    var groups = [];
    KB.subjects.forEach(function (s) {
      var g = groups.find(function (x) { return x.id === s.group; });
      if (!g) { g = { id: s.group, subjects: [] }; groups.push(g); }
      g.subjects.push(s);
    });
    groups.sort(function (a, b) {
      var ia = GROUP_ORDER.indexOf(a.id), ib = GROUP_ORDER.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    host.innerHTML = groups.map(function (g) {
      return '<section class="kb-subjectgroup">' +
        '<div class="kb-groupbar"><span class="kb-groupbar-label">' +
          esc(GROUP_LABEL[g.id] || g.id) + '</span><span class="kb-groupbar-line"></span></div>' +
        '<div class="kb-subjects">' + g.subjects.map(subjectCard).join('') + '</div>' +
        '</section>';
    }).join('') || '<p class="kb-empty">No subjects declared yet.</p>';

  }

  function subjectCard(s) {
    var n = s.conceptCount;
    var count = n ? n + ' CONCEPT' + (n === 1 ? '' : 'S') : 'EMPTY';
    var inner =
      '<span class="kb-subject-card-name">' + esc(s.name) + '</span>' +
      '<span class="kb-subject-card-desc">' + esc(s.blurb || s.description) + '</span>' +
      '<span class="kb-subject-card-count">' + esc(count) + '</span>';
    if (!n) return '<span class="kb-subject-card" data-empty="true">' + inner + '</span>';
    return '<a class="kb-subject-card" href="subjects/' + esc(s.id) + '.html" ' +
      'style="--subject-color:' + esc(s.color) + '">' + inner + '</a>';
  }

  /* ----------------------------------------------------------------- tracks -- */

  function renderTracks() {
    var host = UI.$('[data-kb-tracklist]');
    if (!host) return;
    host.innerHTML = KB.tracks.map(function (t) {
      /* Concepts, not subjects. A bare numeral beside a track name is read as
         "how much is there to drill", and on a page whose KPI row already says
         "24 subjects mapped" a second subject count would be answering a
         question nobody asked -- every track covers five or six subjects, so
         that column was almost constant and told you nothing. conceptIds is
         the build's own track membership, the same list interview.js drills,
         so the two pages can never disagree about how big a track is. */
      var n = (t.conceptIds || []).length;
      return '<a class="kb-trackrow" href="interview.html?track=' + encodeURIComponent(t.id) + '">' +
        '<span>' + esc(t.name) + '</span>' +
        '<span class="kb-trackrow-n" aria-label="' + n + ' concepts">' + n + '</span></a>';
    }).join('') || '<p class="kb-empty">No tracks defined yet.</p>';
  }

  /* -------------------------------------------------------------------------- */

  function renderAll() {
    renderKpis(); renderOrbit(); renderStartHere(); renderSubjects(); renderTracks();
  }

  KB.on(function (type) { if (type !== 'bookmark') renderAll(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderAll);
  else renderAll();
})(window);
