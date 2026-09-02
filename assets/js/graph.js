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
        var f = 4200 / d2 * k;
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
      var rest = l.type === 'prerequisite' ? 120 : 175;
      var f = (d - rest) * (l.type === 'prerequisite' ? 0.035 : 0.016) * k;
      var fx = dx / d * f, fy = dy / d * f;
      l.source.vx += fx; l.source.vy += fy;
      l.target.vx -= fx; l.target.vy -= fy;
      if (l.type === 'prerequisite') {
        // gentle hierarchy: prerequisite sits above its dependant
        var want = (l.source.y + 85) - l.target.y;
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

  /* ---------------------------------------------------------------- paint --

     Everything below is drawn in world coordinates inside a translate+scale,
     so anything that should keep a constant size on screen -- line widths,
     fonts, arrowheads -- is divided by view.k. */

  /** Mix two hex colours. Used to tint an edge from its source to its target. */
  function mix(a, bcol, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(bcol.slice(1), 16);
    var r = Math.round((pa >> 16 & 255) * (1 - t) + (pb >> 16 & 255) * t);
    var g = Math.round((pa >> 8 & 255) * (1 - t) + (pb >> 8 & 255) * t);
    var bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function nodeColour(n) {
    var subject = KB.subject(n.c.subject) || {};
    return subject.color || css('--accent', '#4f8fd6');
  }

  /** Quadratic control point: bow the edge sideways so parallel links separate
      and the whole graph reads as a diagram rather than a ball of string. */
  function controlPoint(l) {
    var mx = (l.source.x + l.target.x) / 2, my = (l.source.y + l.target.y) / 2;
    var dx = l.target.x - l.source.x, dy = l.target.y - l.source.y;
    return { x: mx - dy * 0.13, y: my + dx * 0.13 };
  }

  function quadAt(p0, c, p1, t) {
    var u = 1 - t;
    return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
             y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
             tx: 2 * u * (c.x - p0.x) + 2 * t * (p1.x - c.x),
             ty: 2 * u * (c.y - p0.y) + 2 * t * (p1.y - c.y) };
  }

  function draw() {
    var dpr = global.devicePixelRatio || 1;
    var w = wrap.clientWidth, h = wrap.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // A faint vignette centred on the graph, drawn in screen space. Gives the
    // canvas a middle and keeps the corners from reading as dead space.
    var vg = ctx.createRadialGradient(w / 2 + view.x, h / 2 + view.y, 0,
                                      w / 2 + view.x, h / 2 + view.y, Math.max(w, h) * 0.62);
    vg.addColorStop(0, css('--bg-raised', '#151a22'));
    vg.addColorStop(1, css('--bg', '#0c0f14'));
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(w / 2 + view.x, h / 2 + view.y);
    ctx.scale(view.k, view.k);

    var focusSet = null;
    var active = hover || selected;
    if (active) {
      focusSet = {};
      focusSet[active.id] = true;
      links.forEach(function (l) {
        if (l.source.id === active.id) focusSet[l.target.id] = true;
        if (l.target.id === active.id) focusSet[l.source.id] = true;
      });
    }

    var accent = css('--accent', '#4f8fd6');
    var inv = 1 / view.k;

    /* ------------------------------------------------------------- edges -- */

    ctx.lineCap = 'round';
    links.forEach(function (l) {
      var lit = focusSet && focusSet[l.source.id] && focusSet[l.target.id];
      var p0 = l.source, p1 = l.target, c = controlPoint(l);
      var prereq = l.type === 'prerequisite';

      ctx.globalAlpha = focusSet ? (lit ? 1 : 0.05) : (prereq ? 0.55 : 0.3);

      if (lit) {
        ctx.strokeStyle = accent;
      } else {
        // Tinted from source subject to target subject: a cross-subject link
        // is visibly a bridge between two colours.
        var grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
        grad.addColorStop(0, nodeColour(p0));
        grad.addColorStop(1, nodeColour(p1));
        ctx.strokeStyle = prereq ? grad : mix(nodeColour(p0), nodeColour(p1), 0.5);
      }

      ctx.lineWidth = (lit ? 2.2 : prereq ? 1.6 : 1.1) * inv;
      ctx.setLineDash(prereq ? [] : [4 * inv, 5 * inv]);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(c.x, c.y, p1.x, p1.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Prerequisites are directed -- "learn this first" -- so they get a head.
      if (prereq) {
        var dist = Math.sqrt((p1.x - p0.x) * (p1.x - p0.x) + (p1.y - p0.y) * (p1.y - p0.y)) || 1;
        var t = Math.max(0.05, 1 - (radius(p1) + 5 * inv) / dist);
        var pt = quadAt(p0, c, p1, t);
        var a = Math.atan2(pt.ty, pt.tx);
        var size = 7 * inv;
        ctx.fillStyle = lit ? accent : nodeColour(p1);
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x - size * Math.cos(a - 0.42), pt.y - size * Math.sin(a - 0.42));
        ctx.lineTo(pt.x - size * Math.cos(a + 0.42), pt.y - size * Math.sin(a + 0.42));
        ctx.closePath();
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    /* ------------------------------------------------------------- nodes -- */

    // Automatic labelling keys off zoom, not node count. A dozen nodes fitted
    // into a phone-sized canvas sits near 0.55x, where the labels are longer
    // than the gaps between nodes and collide into an unreadable mess; the
    // user zooms in, or picks "All" in the Labels control.
    var showLabels = opts.label === 'all' || (opts.label === 'auto' && view.k >= 0.8);
    var labelled = [];

    nodes.forEach(function (n) {
      var dim = focusSet && !focusSet[n.id];
      var r = radius(n);
      var col = nodeColour(n);
      var weight = KB.statusMeta[KB.statusOf(n.id)].weight;
      var isActive = n === selected || n === hover;

      // Soft halo. This is what stops the nodes reading as flat dots.
      if (!dim) {
        var halo = ctx.createRadialGradient(n.x, n.y, r * 0.7, n.x, n.y, r * 2.6);
        halo.addColorStop(0, col);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = isActive ? 0.34 : 0.16;
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Opaque backing first. The body fill below is translucent so that status
      // reads through it, and without this the edges running underneath showed
      // through the node as a cross.
      if (!dim) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = css('--bg', '#0c0f14');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body. Unstarted concepts stay hollow: the graph doubles as a progress map.
      ctx.globalAlpha = dim ? 0.12 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      if (weight === 0) {
        ctx.fillStyle = css('--bg', '#0c0f14');
        ctx.fill();
        ctx.globalAlpha = dim ? 0.12 : 0.75;
        ctx.lineWidth = 1.6 * inv;
        ctx.strokeStyle = col;
        ctx.stroke();
      } else {
        var body = ctx.createRadialGradient(n.x - r * 0.35, n.y - r * 0.45, r * 0.1, n.x, n.y, r);
        body.addColorStop(0, mix(col, '#ffffff', 0.26));
        body.addColorStop(1, col);
        ctx.globalAlpha = dim ? 0.12 : 0.55 + weight * 0.45;
        ctx.fillStyle = body;
        ctx.fill();
      }

      // Progress ring: how far round the circle you have got with this concept.
      // Deliberately quiet -- the fill already carries the same information
      // roughly, and a bright white arc on every node reads as an artefact.
      if (weight > 0 && weight < 1 && !dim) {
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = css('--ink-muted', '#8d99aa');
        ctx.lineWidth = 1.5 * inv;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 5 * inv, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * weight);
        ctx.stroke();
      }

      // Selection is the accent, so it can never be confused with progress.
      if (isActive) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2 * inv;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 8 * inv, 0, Math.PI * 2);
        ctx.stroke();
      }

      if ((showLabels || isActive) && !dim) labelled.push({ n: n, r: r, active: isActive });
    });

    /* ------------------------------------------------------------ labels -- */
    // Drawn last so no edge or node crosses them, each with a dark outline so
    // the text survives wherever it lands.
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    labelled.forEach(function (item) {
      var size = (item.active ? 12.5 : 11.5) * inv;
      ctx.font = (item.active ? '600 ' : '') + size.toFixed(2) +
        'px "Inter Variable", Inter, system-ui, sans-serif';
      var y = item.n.y + item.r + 7 * inv;
      ctx.strokeStyle = css('--bg', '#0c0f14');
      ctx.lineWidth = 3.5 * inv;
      ctx.strokeText(item.n.c.title, item.n.x, y);
      ctx.fillStyle = item.active ? css('--ink-strong', '#f4f6fa') : css('--ink', '#dfe4ec');
      ctx.fillText(item.n.c.title, item.n.x, y);
    });

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function radius(n) { return 5.5 + Math.min(9, Math.sqrt(n.deg) * 2.1) + n.c.interviewRelevance * 0.5; }

  /** Frame the whole graph: the layout's absolute scale is arbitrary, so the
      only sensible default zoom is whatever makes every node visible. */
  function fitView(padding) {
    if (!nodes.length) return;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(function (n) {
      var r = radius(n);
      minX = Math.min(minX, n.x - r); maxX = Math.max(maxX, n.x + r);
      minY = Math.min(minY, n.y - r); maxY = Math.max(maxY, n.y + r);
    });
    // Padding is in screen pixels and covers the label under the lowest node,
    // so it must not be scaled with the graph -- the old version added a
    // world-space allowance for labels, which grew with the zoom and left the
    // graph sitting in a third of the canvas.
    // Padding scales with the canvas: a fixed 76px eats most of a phone.
    var pad = padding == null ? Math.min(76, wrap.clientWidth * 0.09) : padding;
    var w = Math.max(1, wrap.clientWidth - pad * 2);
    var h = Math.max(1, wrap.clientHeight - pad * 2);
    // Cap raised from 1.6: a dozen concepts should fill the space they are
    // given rather than huddle in the middle of an empty canvas. The floor
    // matters on a phone -- fitting everything there would shrink the nodes to
    // specks, so below it the graph overflows and the user pans instead.
    view.k = Math.max(0.55, Math.min(3.2, Math.min(w / (maxX - minX || 1), h / (maxY - minY || 1))));
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

  /* Pointer Events rather than mouse events: one code path covers mouse, touch
     and pen. The canvas previously listened for mousedown/mousemove/wheel,
     which meant a phone could tap a node but never pan or zoom the graph. */
  function bindPointer() {
    var panning = false, last = null, moved = 0;
    var pointers = {}, pinch = null;

    function active() {
      return Object.keys(pointers).map(function (k) { return pointers[k]; });
    }

    /** Midpoint and spread of the two active pointers. */
    function pinchState() {
      var p = active();
      var dx = p[0].x - p[1].x, dy = p[0].y - p[1].y;
      return { dist: Math.sqrt(dx * dx + dy * dy) || 1,
        cx: (p[0].x + p[1].x) / 2, cy: (p[0].y + p[1].y) / 2 };
    }

    /** Zoom by `factor`, keeping the point under (clientX, clientY) fixed. */
    function zoomAt(clientX, clientY, factor) {
      var r = canvas.getBoundingClientRect();
      var mx = clientX - r.left - r.width / 2;
      var my = clientY - r.top - r.height / 2;
      var k = Math.max(0.2, Math.min(4, view.k * factor));
      view.x = mx - (mx - view.x) * (k / view.k);
      view.y = my - (my - view.y) * (k / view.k);
      view.k = k;
      UI.$('[data-kb-graph-zoom]').textContent = 'zoom ' + view.k.toFixed(2) + '×';
    }

    canvas.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = active().length;

      // A second finger means a pinch, not a drag. Abandon whatever the first
      // finger started so the gesture does not drag a node across the screen.
      if (n === 2) {
        dragNode = null; panning = false; last = null;
        canvas.classList.remove('is-dragging');
        pinch = pinchState();
        return;
      }
      if (n > 2) return;

      canvas.setPointerCapture(e.pointerId);
      var node = pick(toWorld(e.clientX, e.clientY));
      moved = 0;
      if (node) { dragNode = node; alpha = Math.max(alpha, 0.35); }
      else { panning = true; canvas.classList.add('is-dragging'); }
      last = { x: e.clientX, y: e.clientY };
    });

    global.addEventListener('pointermove', function (e) {
      if (pointers[e.pointerId]) pointers[e.pointerId] = { x: e.clientX, y: e.clientY };

      if (pinch && active().length >= 2) {
        var now = pinchState();
        view.x += now.cx - pinch.cx;          // follow the midpoint...
        view.y += now.cy - pinch.cy;
        zoomAt(now.cx, now.cy, now.dist / pinch.dist);   // ...then scale about it
        pinch = now;
        moved += 1;
        return;
      }
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
      // Hover is a mouse idea. A finger has no hover state, and showing a
      // tooltip under it would just cover the node you are trying to read.
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (e.target !== canvas) { setHover(null); return; }
      setHover(pick(toWorld(e.clientX, e.clientY)), e.clientX, e.clientY);
    });

    function release(e) {
      delete pointers[e.pointerId];
      if (active().length < 2) pinch = null;
      if (active().length > 0) return;        // other fingers still down

      if (dragNode && moved < 3) select(dragNode);
      else if (panning && moved < 3 && e.target === canvas) select(null);
      dragNode = null; panning = false; last = null;
      canvas.classList.remove('is-dragging');
    }
    global.addEventListener('pointerup', release);
    global.addEventListener('pointercancel', release);

    canvas.addEventListener('dblclick', function (e) {
      var n = pick(toWorld(e.clientX, e.clientY));
      if (n) global.location.href = n.c.path;
    });

    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
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
