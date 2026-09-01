/* ==========================================================================
   Knowledge graph — force-directed layout on canvas.

   Canvas rather than SVG or a graph library: at a thousand nodes SVG DOM
   updates dominate the frame budget, and the whole simulation is ~120 lines.
   Pan, zoom, hover, focus mode and click-through to the concept page.
   ========================================================================== */
(function (global) {
  'use strict';

  var KB = global.KB, UI = global.KBUI;
  var esc = KB.util.escapeHtml;

  var view = { x: 0, y: 0, k: 1 };
  var opts = { subject: '', focus: null, hops: 2, showRelated: true, showPrereq: true, label: 'auto' };
  var nodes = [], links = [], byId = {};
  var hover = null, selected = null, dragNode = null, alpha = 1;
  var canvas, ctx, wrap, tooltip, raf;

  /* ---------------------------------------------------------- build data -- */

  function rebuild() {
    var visible = KB.concepts.filter(function (c) {
      return !opts.subject || c.subject === opts.subject;
    });
    if (opts.focus) {
      var hops = KB.neighbours(opts.focus, opts.hops);
      visible = KB.concepts.filter(function (c) { return hops[c.id] !== undefined; });
    }
    var ids = {};
    visible.forEach(function (c) { ids[c.id] = true; });

    var prev = byId;
    nodes = visible.map(function (c) {
      var old = prev[c.id];
      return {
        id: c.id, c: c,
        x: old ? old.x : (Math.random() - 0.5) * 500,
        y: old ? old.y : (Math.random() - 0.5) * 500,
        vx: 0, vy: 0, deg: 0,
      };
    });
    byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    links = KB.edges.filter(function (e) {
      if (!ids[e.from] || !ids[e.to]) return false;
      if (e.type === 'related' && !opts.showRelated) return false;
      if (e.type === 'prerequisite' && !opts.showPrereq) return false;
      return true;
    }).map(function (e) {
      byId[e.from].deg += 1;
      byId[e.to].deg += 1;
      return { source: byId[e.from], target: byId[e.to], type: e.type };
    });

    alpha = 1;
    fitPending = true;
    UI.$('[data-kb-graph-count]').textContent = nodes.length + ' nodes · ' + links.length + ' edges';
  }

  /* ---------------------------------------------------------- simulation -- */

  function step() {
    if (alpha < 0.005) return;
    alpha *= 0.985;
    var k = alpha;

    // Repulsion. O(n²) is fine to ~1500 nodes; swap in Barnes–Hut beyond that.
    for (var i = 0; i < nodes.length; i += 1) {
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j += 1) {
        var b = nodes[j];
        var dx = b.x - a.x, dy = b.y - a.y;
        var d2 = dx * dx + dy * dy || 0.01;
        if (d2 > 90000) continue;
        var f = 2400 / d2 * k;
        var d = Math.sqrt(d2);
        var fx = dx / d * f, fy = dy / d * f;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Springs: prerequisites pull harder and prefer a left-to-right ordering.
    links.forEach(function (l) {
      var dx = l.target.x - l.source.x, dy = l.target.y - l.source.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      var rest = l.type === 'prerequisite' ? 90 : 130;
      var f = (d - rest) * (l.type === 'prerequisite' ? 0.035 : 0.018) * k;
      var fx = dx / d * f, fy = dy / d * f;
      l.source.vx += fx; l.source.vy += fy;
      l.target.vx -= fx; l.target.vy -= fy;
      if (l.type === 'prerequisite') {
        // gentle hierarchy: prerequisite sits above its dependant
        var want = (l.source.y + 60) - l.target.y;
        l.source.vy -= want * 0.006 * k;
        l.target.vy += want * 0.006 * k;
      }
    });

    // Weak centring keeps disconnected islands on screen.
    nodes.forEach(function (n) {
      n.vx -= n.x * 0.0016 * k;
      n.vy -= n.y * 0.0016 * k;
      if (n === dragNode) { n.vx = 0; n.vy = 0; return; }
      n.x += (n.vx *= 0.82);
      n.y += (n.vy *= 0.82);
    });
  }

  /* -------------------------------------------------------------- render -- */

  function css(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function draw() {
    var dpr = global.devicePixelRatio || 1;
    var w = wrap.clientWidth, h = wrap.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2 + view.x, h / 2 + view.y);
    ctx.scale(view.k, view.k);

    var focusSet = null;
    var active = hover || selected;
    if (active) {
      focusSet = { };
      focusSet[active.id] = true;
      links.forEach(function (l) {
        if (l.source.id === active.id) focusSet[l.target.id] = true;
        if (l.target.id === active.id) focusSet[l.source.id] = true;
      });
    }

    var lineCol = css('--line-strong', '#323d4c');
    var accent = css('--accent', '#4f8fd6');

    links.forEach(function (l) {
      var lit = focusSet && (focusSet[l.source.id] && focusSet[l.target.id]);
      ctx.globalAlpha = focusSet ? (lit ? 0.95 : 0.07) : (l.type === 'prerequisite' ? 0.5 : 0.22);
      ctx.strokeStyle = lit ? accent : lineCol;
      ctx.lineWidth = (l.type === 'prerequisite' ? 1.2 : 0.9) / Math.sqrt(view.k);
      if (l.type === 'related') ctx.setLineDash([3 / view.k, 3 / view.k]); else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(l.source.x, l.source.y);
      ctx.lineTo(l.target.x, l.target.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    var showLabels = opts.label === 'all' || (opts.label === 'auto' && (view.k > 0.75 || nodes.length < 60));

    nodes.forEach(function (n) {
      var dim = focusSet && !focusSet[n.id];
      var r = radius(n);
      var subject = KB.subject(n.c.subject) || {};
      var weight = KB.statusMeta[KB.statusOf(n.id)].weight;

      ctx.globalAlpha = dim ? 0.16 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = subject.color || accent;
      // Unstarted concepts are hollow: the graph doubles as a progress map.
      if (weight === 0) {
        ctx.globalAlpha = dim ? 0.1 : 0.22;
        ctx.fill();
        ctx.globalAlpha = dim ? 0.16 : 0.9;
        ctx.lineWidth = 1.2 / view.k;
        ctx.strokeStyle = subject.color || accent;
        ctx.stroke();
      } else {
        ctx.globalAlpha = dim ? 0.16 : 0.45 + weight * 0.55;
        ctx.fill();
      }

      if (n === selected || n === hover) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = css('--ink-strong', '#f2f5f8');
        ctx.lineWidth = 1.6 / view.k;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 3 / view.k, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (showLabels && !dim) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = css('--ink', '#dde3ea');
        ctx.font = (11 / view.k).toFixed(1) + 'px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(n.c.title, n.x, n.y + r + 3 / view.k);
      }
    });

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function radius(n) { return 4 + Math.min(7, Math.sqrt(n.deg) * 1.7) + n.c.interviewRelevance * 0.35; }

  /** Frame the whole graph: the layout's absolute scale is arbitrary, so the
      only sensible default zoom is whatever makes every node visible. */
  function fitView(padding) {
    if (!nodes.length) return;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(function (n) {
      var r = radius(n) + 26;              // leave room for the label
      minX = Math.min(minX, n.x - r); maxX = Math.max(maxX, n.x + r);
      minY = Math.min(minY, n.y - r); maxY = Math.max(maxY, n.y + r);
    });
    var pad = padding == null ? 40 : padding;
    var w = Math.max(1, wrap.clientWidth - pad * 2);
    var h = Math.max(1, wrap.clientHeight - pad * 2);
    view.k = Math.max(0.2, Math.min(1.6, Math.min(w / (maxX - minX || 1), h / (maxY - minY || 1))));
    view.x = -((minX + maxX) / 2) * view.k;
    view.y = -((minY + maxY) / 2) * view.k;
    var zoomHud = UI.$('[data-kb-graph-zoom]');
    if (zoomHud) zoomHud.textContent = 'zoom ' + view.k.toFixed(2) + '\u00d7';
  }

  var fitPending = true;
  function tick() {
    step();
    // Fit once the simulation has cooled, then leave the user's view alone.
    if (fitPending && alpha < 0.25) { fitView(); fitPending = false; }
    draw();
    raf = requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------ pointers -- */

  function toWorld(clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left - r.width / 2 - view.x) / view.k,
      y: (clientY - r.top - r.height / 2 - view.y) / view.k,
    };
  }

  function pick(p) {
    var best = null, bestD = Infinity;
    nodes.forEach(function (n) {
      var d = (n.x - p.x) * (n.x - p.x) + (n.y - p.y) * (n.y - p.y);
      var r = radius(n) + 6;
      if (d < r * r && d < bestD) { best = n; bestD = d; }
    });
    return best;
  }

  function bindPointer() {
    var panning = false, last = null, moved = 0;

    canvas.addEventListener('mousedown', function (e) {
      var p = toWorld(e.clientX, e.clientY);
      var n = pick(p);
      moved = 0;
      if (n) { dragNode = n; alpha = Math.max(alpha, 0.35); }
      else { panning = true; canvas.classList.add('is-dragging'); }
      last = { x: e.clientX, y: e.clientY };
    });

    global.addEventListener('mousemove', function (e) {
      if (dragNode) {
        var p = toWorld(e.clientX, e.clientY);
        dragNode.x = p.x; dragNode.y = p.y;
        moved += 1;
        return;
      }
      if (panning && last) {
        view.x += e.clientX - last.x;
        view.y += e.clientY - last.y;
        last = { x: e.clientX, y: e.clientY };
        moved += 1;
        return;
      }
      if (e.target !== canvas) { setHover(null); return; }
      setHover(pick(toWorld(e.clientX, e.clientY)), e.clientX, e.clientY);
    });

    global.addEventListener('mouseup', function (e) {
      if (dragNode && moved < 3) select(dragNode);
      else if (panning && moved < 3 && e.target === canvas) select(null);
      dragNode = null; panning = false; last = null;
      canvas.classList.remove('is-dragging');
    });

    canvas.addEventListener('dblclick', function (e) {
      var n = pick(toWorld(e.clientX, e.clientY));
      if (n) global.location.href = n.c.path;
    });

    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = canvas.getBoundingClientRect();
      var mx = e.clientX - r.left - r.width / 2;
      var my = e.clientY - r.top - r.height / 2;
      var k = Math.max(0.2, Math.min(4, view.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      view.x = mx - (mx - view.x) * (k / view.k);
      view.y = my - (my - view.y) * (k / view.k);
      view.k = k;
      UI.$('[data-kb-graph-zoom]').textContent = 'zoom ' + view.k.toFixed(2) + '×';
    }, { passive: false });
  }

  function setHover(n, cx, cy) {
    hover = n;
    if (!n) { tooltip.removeAttribute('data-show'); canvas.style.cursor = 'grab'; return; }
    canvas.style.cursor = 'pointer';
    var r = wrap.getBoundingClientRect();
    tooltip.innerHTML = '<strong>' + esc(n.c.title) + '</strong><small>' +
      esc((KB.subject(n.c.subject) || {}).name) + ' · ' + esc(n.c.summary) + '</small>';
    tooltip.style.left = Math.min(r.width - 270, cx - r.left + 12) + 'px';
    tooltip.style.top = (cy - r.top + 14) + 'px';
    tooltip.setAttribute('data-show', '');
  }

  /* --------------------------------------------------------------- panel -- */

  function select(n) {
    selected = n;
    var host = UI.$('[data-kb-graph-detail]');
    if (!n) {
      host.innerHTML = '<p class="kb-empty">Click a node to inspect it. Double-click to open the concept.</p>';
      return;
    }
    var c = n.c;
    var lst = function (title, ids) {
      if (!ids.length) return '';
      return '<div class="kb-gd-heading">' + title + '</div><ul class="kb-gd-list">' +
        ids.map(function (id) {
          var t = KB.concept(id);
          return t ? '<li><a href="#" data-goto="' + esc(id) + '">' + esc(t.title) + '</a></li>' : '';
        }).join('') + '</ul>';
    };
    host.innerHTML = '<h3>' + esc(c.title) + '</h3>' +
      '<p class="kb-gd-sum">' + esc(c.summary) + '</p>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">' +
      '<span class="kb-pill kb-pill--' + esc(c.difficulty) + '">' + esc(KB.difficultyMeta[c.difficulty].label) +
      '</span>' + KB.util.stars(c.interviewRelevance) + '</div>' +
      '<a class="kb-btn kb-btn--primary" href="' + esc(c.path) + '">Open concept</a> ' +
      '<button class="kb-btn kb-btn--ghost" type="button" data-focus="' + esc(c.id) + '">Focus here</button>' +
      lst('Prerequisites', c.prerequisites) +
      lst('Builds towards', c.builtOn) +
      lst('Related', c.related);
  }

  /* ---------------------------------------------------------------- boot -- */

  function boot() {
    wrap = UI.$('.kb-graph-canvas-wrap');
    if (!wrap) return;
    canvas = UI.$('canvas', wrap);
    ctx = canvas.getContext('2d');
    tooltip = UI.$('.kb-graph-tooltip');

    var subjectSel = UI.$('[data-kb-graph-subject]');
    subjectSel.innerHTML = '<option value="">All subjects</option>' +
      KB.subjects.filter(function (s) { return s.conceptCount; }).map(function (s) {
        return '<option value="' + esc(s.id) + '">' + esc(s.name) + ' (' + s.conceptCount + ')</option>';
      }).join('');

    var focusSel = UI.$('[data-kb-graph-focus]');
    focusSel.innerHTML = '<option value="">No focus — show everything</option>' +
      KB.concepts.slice().sort(function (a, b) { return a.title.localeCompare(b.title); })
        .map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.title) + '</option>'; }).join('');

    opts.focus = KB.util.param('focus');
    if (opts.focus && KB.concept(opts.focus)) focusSel.value = opts.focus;
    else opts.focus = null;
    var sub = KB.util.param('subject');
    if (sub) { opts.subject = sub; subjectSel.value = sub; }

    subjectSel.addEventListener('change', function () { opts.subject = subjectSel.value; rebuild(); });
    focusSel.addEventListener('change', function () { opts.focus = focusSel.value || null; rebuild(); });
    UI.$('[data-kb-graph-hops]').addEventListener('change', function (e) {
      opts.hops = Number(e.target.value); rebuild();
    });
    UI.$$('[data-kb-graph-toggle]').forEach(function (b) {
      b.addEventListener('change', function () {
        opts[b.getAttribute('data-kb-graph-toggle')] = b.checked;
        rebuild();
      });
    });
    UI.$('[data-kb-graph-labels]').addEventListener('change', function (e) { opts.label = e.target.value; });
    UI.$('[data-kb-graph-reset]').addEventListener('click', function () {
      alpha = 1;
      fitPending = true;
    });

    document.addEventListener('click', function (e) {
      var goto = e.target.closest('[data-goto]');
      if (goto) {
        e.preventDefault();
        var n = byId[goto.getAttribute('data-goto')];
        if (n) { select(n); view.x = -n.x * view.k; view.y = -n.y * view.k; }
        else { global.location.href = 'concepts/' + goto.getAttribute('data-goto') + '.html'; }
        return;
      }
      var f = e.target.closest('[data-focus]');
      if (f) {
        opts.focus = f.getAttribute('data-focus');
        focusSel.value = opts.focus;
        rebuild();
      }
    });

    bindPointer();
    rebuild();
    select(opts.focus ? byId[opts.focus] : null);
    if (opts.focus && byId[opts.focus]) { byId[opts.focus].x = 0; byId[opts.focus].y = 0; }
    tick();
    KB.on(function (t) { if (t === 'status') alpha = Math.max(alpha, 0.02); });
    global.addEventListener('resize', function () { alpha = Math.max(alpha, 0.05); fitPending = true; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
