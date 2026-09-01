/* Subject page: client-side filtering over the server-rendered concept list,
   plus a small prerequisite map for the subject. */
(function (global) {
  'use strict';

  var KB = global.KB, UI = global.KBUI;

  function boot() {
    var main = UI.$('.kb-main--subject');
    if (!main) return;
    var subjectId = main.getAttribute('data-subject-id');

    /* ------------------------------------------------------------ filters -- */
    var rows = UI.$$('.kb-conceptrow');
    var text = UI.$('[data-kb-filter-text]');
    var selects = UI.$$('[data-kb-filter]');
    var countHost = UI.$('[data-kb-filter-count]');

    function apply() {
      var q = (text && text.value || '').toLowerCase().trim();
      var want = {};
      selects.forEach(function (s) { want[s.getAttribute('data-kb-filter')] = s.value; });
      var shown = 0;
      rows.forEach(function (row) {
        var id = row.getAttribute('data-id');
        var c = KB.concept(id) || {};
        var hay = ((c.title || '') + ' ' + (c.summary || '') + ' ' + (c.tags || []).join(' ')).toLowerCase();
        var ok = (!q || hay.indexOf(q) !== -1) &&
          (!want.difficulty || row.getAttribute('data-difficulty') === want.difficulty) &&
          (!want.status || KB.statusOf(id) === want.status) &&
          (!want.relevance || Number(row.getAttribute('data-relevance')) >= Number(want.relevance));
        row.hidden = !ok;
        if (ok) shown += 1;
      });
      if (countHost) countHost.textContent = shown + ' of ' + rows.length;
    }

    if (text) text.addEventListener('input', apply);
    selects.forEach(function (s) { s.addEventListener('change', apply); });
    apply();

    /* ----------------------------------------------------- live progress -- */
    function repaintProgress() {
      var host = UI.$('[data-kb-subject-progress]');
      if (!host) return;
      var p = KB.subjectProgress(subjectId);
      host.querySelector('.kb-bar-fill').style.width = Math.round(p * 100) + '%';
      host.querySelector('.kb-bar-num').textContent = Math.round(p * 100) + '%';
    }
    KB.on(function (t) { if (t === 'status' || t === 'import' || t === 'reset') { repaintProgress(); apply(); } });

    drawMap(subjectId);
    KB.on(function (t) { if (t === 'theme') drawMap(subjectId); });
  }

  /* --------------------------------------------------------- concept map -- */
  /**
   * A layered prerequisite map: depth = longest prerequisite chain within the
   * subject, so the picture reads left-to-right as a study order.
   */
  function drawMap(subjectId) {
    var canvas = UI.$('[data-kb-subject-graph]');
    if (!canvas) return;
    var own = KB.concepts.filter(function (c) { return c.subject === subjectId; });
    if (own.length < 2) { canvas.closest('.kb-subject-graph').style.display = 'none'; return; }

    var ids = own.map(function (c) { return c.id; });
    var inSubject = function (id) { return ids.indexOf(id) !== -1; };

    var depth = {};
    function depthOf(id, seen) {
      if (depth[id] != null) return depth[id];
      if (seen[id]) return 0;
      seen[id] = true;
      var c = KB.concept(id);
      var d = 0;
      c.prerequisites.filter(inSubject).forEach(function (p) { d = Math.max(d, depthOf(p, seen) + 1); });
      delete seen[id];
      depth[id] = d;
      return d;
    }
    ids.forEach(function (id) { depthOf(id, {}); });

    var layers = [];
    ids.forEach(function (id) {
      (layers[depth[id]] = layers[depth[id]] || []).push(id);
    });

    var dpr = global.devicePixelRatio || 1;
    var w = canvas.clientWidth || 900;
    var h = Math.max(220, layers.reduce(function (m, l) { return Math.max(m, l.length); }, 0) * 46 + 40);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var css = getComputedStyle(document.documentElement);
    var colLine = css.getPropertyValue('--line-strong').trim() || '#323d4c';
    var colInk = css.getPropertyValue('--ink').trim() || '#dde3ea';
    var colCard = css.getPropertyValue('--bg-sunken').trim() || '#0a0d12';
    var accent = css.getPropertyValue('--accent').trim() || '#4f8fd6';

    var colW = w / Math.max(1, layers.length);
    var boxW = Math.min(190, colW - 26);
    var pos = {};
    layers.forEach(function (layer, li) {
      layer.forEach(function (id, i) {
        pos[id] = { x: li * colW + colW / 2, y: 30 + (h - 50) * ((i + 0.5) / layer.length) };
      });
    });

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = colLine;
    ctx.lineWidth = 1.2;
    own.forEach(function (c) {
      c.prerequisites.filter(inSubject).forEach(function (p) {
        var a = pos[p], b = pos[c.id];
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.x + boxW / 2, a.y);
        ctx.bezierCurveTo((a.x + b.x) / 2, a.y, (a.x + b.x) / 2, b.y, b.x - boxW / 2, b.y);
        ctx.stroke();
        // arrow head
        ctx.beginPath();
        ctx.moveTo(b.x - boxW / 2, b.y);
        ctx.lineTo(b.x - boxW / 2 - 6, b.y - 3.5);
        ctx.lineTo(b.x - boxW / 2 - 6, b.y + 3.5);
        ctx.closePath();
        ctx.fillStyle = colLine;
        ctx.fill();
      });
    });

    var hits = canvas._kbHits || (canvas._kbHits = []);
    hits.length = 0;
    own.forEach(function (c) {
      var p = pos[c.id];
      var status = KB.statusOf(c.id);
      ctx.fillStyle = colCard;
      ctx.strokeStyle = status === 'not-started' ? colLine : accent;
      ctx.lineWidth = 1;
      roundRect(ctx, p.x - boxW / 2, p.y - 14, boxW, 28, 3);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = colInk;
      ctx.font = '11.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(clip(ctx, c.title, boxW - 16), p.x, p.y);
      hits.push({ x: p.x - boxW / 2, y: p.y - 14, w: boxW, h: 28, id: c.id, title: c.title });
    });

    canvas.style.cursor = 'default';
    if (canvas.dataset.bound) return;
    canvas.dataset.bound = '1';
    canvas.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      var f = find(hits, e.clientX - r.left, e.clientY - r.top);
      canvas.style.cursor = f ? 'pointer' : 'default';
      canvas.title = f ? f.title : '';
    });
    canvas.addEventListener('click', function (e) {
      var r = canvas.getBoundingClientRect();
      var f = find(hits, e.clientX - r.left, e.clientY - r.top);
      if (f) global.location.href = '../concepts/' + f.id + '.html';
    });
  }

  function find(hits, x, y) {
    return hits.find(function (b) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; });
  }
  function clip(ctx, text, max) {
    if (ctx.measureText(text).width <= max) return text;
    var t = text;
    while (t.length > 3 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
    return t + '…';
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
