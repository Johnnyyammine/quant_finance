/* ==========================================================================
   Concept page behaviour: the interactive-module runtime, TOC scroll-spy,
   the neighbourhood minimap and the revision card.
   ========================================================================== */
(function (global) {
  'use strict';

  var KB = global.KB;
  var UI = global.KBUI;
  var doc = global.document;

  /* ----------------------------------------------------- module runtime -- */
  /**
   * Interactive modules are plain scripts that call:
   *
   *   KB.modules.register('random-walk', {
   *     title: 'Random walk',
   *     subtitle: 'optional',
   *     controls: [{ id:'n', label:'Paths', type:'range', min:1, max:200, value:40 }],
   *     render: function (ctx) { ... }   // ctx.canvas, ctx.values, ctx.stats(), ctx.plot()
   *   });
   *
   * The build emits a <div class="kb-module" data-module data-config> wherever
   * a :::module directive appears and adds the script tag automatically. That
   * is the entire contract — a new module is one file plus one directive.
   */
  var registry = Object.create(null);
  var pending = [];

  function register(name, def) {
    registry[name] = def;
    pending = pending.filter(function (node) { return !mount(node); });
  }

  function mount(node) {
    var name = node.getAttribute('data-module');
    var def = registry[name];
    if (!def) return false;
    if (node.hasAttribute('data-mounted')) return true;
    node.setAttribute('data-mounted', '');

    var config = {};
    try { config = JSON.parse(node.getAttribute('data-config') || '{}'); } catch (e) { /* keep defaults */ }

    var controls = (def.controls || []).map(function (c) {
      var merged = {};
      Object.keys(c).forEach(function (k) { merged[k] = c[k]; });
      if (config[c.id] != null) merged.value = config[c.id];
      return merged;
    });

    node.innerHTML =
      '<div class="kb-module-header">' +
        '<span class="kb-module-title">' + KB.util.escapeHtml(def.title || name) + '</span>' +
        (def.subtitle ? '<span class="kb-module-sub">' + KB.util.escapeHtml(def.subtitle) + '</span>' : '') +
        '<span class="kb-module-badge">interactive</span>' +
      '</div>' +
      '<div class="kb-module-body">' +
        (controls.length ? '<div class="kb-controls"></div>' : '') +
        '<canvas></canvas>' +
        '<div class="kb-stats"></div>' +
        '<div class="kb-module-note"></div>' +
      '</div>';

    var body = node.querySelector('.kb-module-body');
    var controlsHost = node.querySelector('.kb-controls');
    var canvas = node.querySelector('canvas');
    var statsHost = node.querySelector('.kb-stats');
    var noteHost = node.querySelector('.kb-module-note');
    canvas.style.height = (config.height || def.height || 240) + 'px';

    var values = {};
    controls.forEach(function (c) { values[c.id] = c.value; });

    if (controlsHost) {
      controlsHost.innerHTML = controls.map(function (c) {
        if (c.type === 'select') {
          return '<label class="kb-control"><span class="kb-control-label">' + KB.util.escapeHtml(c.label) + '</span>' +
            '<select data-control="' + c.id + '">' + c.options.map(function (o) {
              return '<option value="' + o.value + '"' + (o.value === c.value ? ' selected' : '') + '>' +
                KB.util.escapeHtml(o.label) + '</option>';
            }).join('') + '</select></label>';
        }
        if (c.type === 'checkbox') {
          // Its own modifier class rather than a :has() selector on the label:
          // this file has to run from a file:// URL in whatever browser the
          // reader happens to have, and a class works everywhere.
          return '<label class="kb-control kb-control--check">' +
            '<input type="checkbox" data-control="' + c.id + '"' + (c.value ? ' checked' : '') + '>' +
            '<span class="kb-control-label">' + KB.util.escapeHtml(c.label) + '</span></label>';
        }
        return '<label class="kb-control">' +
          '<span class="kb-control-label">' + KB.util.escapeHtml(c.label) +
          '<span class="kb-control-value" data-value="' + c.id + '">' + format(c, c.value) + '</span></span>' +
          '<input type="range" data-control="' + c.id + '" min="' + c.min + '" max="' + c.max +
          '" step="' + (c.step || 1) + '" value="' + c.value + '"></label>';
      }).join('');
    }

    var ctx = {
      node: node, canvas: canvas, config: config, values: values,
      plot: function (opts) {
        if (!global.KBPlot) return null;
        return new global.KBPlot.Plot(canvas, opts || {});
      },
      stats: function (items) {
        statsHost.innerHTML = items.map(function (s) {
          return '<div class="kb-stat"><span class="kb-stat-label">' + KB.util.escapeHtml(s.label) +
            '</span><span class="kb-stat-value">' + KB.util.escapeHtml(String(s.value)) + '</span></div>';
        }).join('');
      },
      note: function (html) {
        noteHost.innerHTML = html ? '<p style="margin:12px 0 0;font-size:12px;color:var(--ink-muted)">' + html + '</p>' : '';
        doc.dispatchEvent(new CustomEvent('kb:content', { detail: noteHost }));
      },
    };

    var frame = null;
    function draw() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        try { def.render(ctx); }
        catch (e) {
          body.innerHTML = '<div class="kb-module-error">Module "' + KB.util.escapeHtml(name) +
            '" failed: ' + KB.util.escapeHtml(e.message) + '</div>';
          console.error(e);
        }
      });
    }

    node.addEventListener('input', function (e) {
      var input = e.target.closest('[data-control]');
      if (!input) return;
      var id = input.getAttribute('data-control');
      var def_ = controls.find(function (c) { return c.id === id; });
      values[id] = input.type === 'checkbox' ? input.checked
        : input.type === 'range' ? Number(input.value) : input.value;
      var out = node.querySelector('[data-value="' + id + '"]');
      if (out && def_) out.textContent = format(def_, values[id]);
      draw();
    });
    node.addEventListener('change', function (e) {
      if (e.target.closest('select[data-control]')) draw();
    });

    var resizeTimer = null;
    global.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(draw, 120);
    });
    KB.on(function (type) { if (type === 'theme') draw(); });

    draw();
    return true;
  }

  function format(control, value) {
    if (typeof control.format === 'function') return control.format(value);
    if (control.format === 'pct') return (value * 100).toFixed(control.decimals == null ? 0 : control.decimals) + '%';
    if (control.format === 'int') return Number(value).toLocaleString();
    if (control.decimals != null) return Number(value).toFixed(control.decimals);
    return String(value);
  }

  KB.modules = { register: register, registry: registry };

  /* ----------------------------------------------------------- boot page -- */

  function boot() {
    UI.$$('.kb-module').forEach(function (node) {
      if (!mount(node)) {
        pending.push(node);
        var name = node.getAttribute('data-module');
        node.innerHTML = '<div class="kb-module-error">No module registered as "' +
          KB.util.escapeHtml(name) + '". Create <code>assets/js/modules/' +
          KB.util.escapeHtml(name) + '.js</code> and rebuild.</div>';
      }
    });

    scrollSpy();
    minimap();
    // Canvases bake in theme colours at paint time, so repaint on a theme flip.
    KB.on(function (type) { if (type === 'theme') minimap(); });
  }

  /* ------------------------------------------------------------ scrollspy -- */

  function scrollSpy() {
    var links = UI.$$('.kb-toc a');
    if (!links.length || !global.IntersectionObserver) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var targets = Object.keys(byId).map(function (id) { return doc.getElementById(id); }).filter(Boolean);
    var visible = new Set();
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) visible.add(en.target.id); else visible.delete(en.target.id);
      });
      var first = targets.find(function (t) { return visible.has(t.id); });
      links.forEach(function (a) { a.classList.remove('is-active'); });
      if (first && byId[first.id]) byId[first.id].classList.add('is-active');
    }, { rootMargin: '-70px 0px -70% 0px' });
    targets.forEach(function (t) { obs.observe(t); });
  }

  /* -------------------------------------------------------------- minimap -- */

  function minimap() {
    var canvas = UI.$('[data-kb-minimap]');
    if (!canvas) return;
    var id = canvas.getAttribute('data-kb-minimap');
    var hops = KB.neighbours(id, 2);
    var ids = Object.keys(hops);
    if (ids.length < 2) {
      canvas.closest('.kb-neighbourhood').style.display = 'none';
      return;
    }
    var w = canvas.width, h = canvas.height;
    var cx = w / 2, cy = h / 2;
    var pos = {};
    pos[id] = { x: cx, y: cy };
    var rings = { 1: [], 2: [] };
    ids.forEach(function (n) { if (hops[n]) rings[hops[n]].push(n); });
    // Elliptical rings, not circular: the canvas is much wider than it is tall,
    // and a radius taken from the short side would huddle every node into a
    // narrow column down the middle with the width unused.
    [1, 2].forEach(function (ring) {
      var f = ring === 1 ? 0.26 : 0.44;
      var rx = w * f, ry = h * f;
      rings[ring].forEach(function (n, i) {
        var a = (i / rings[ring].length) * Math.PI * 2 - Math.PI / 2 + (ring === 2 ? 0.4 : 0);
        pos[n] = { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
      });
    });

    var ctx = canvas.getContext('2d');
    var hit = canvas._kbHit || (canvas._kbHit = []);
    var css = getComputedStyle(doc.documentElement);
    var line = css.getPropertyValue('--line-strong').trim() || '#2d323c';
    var accent = css.getPropertyValue('--accent').trim() || '#4d7cff';
    var muted = css.getPropertyValue('--ink-faint').trim() || '#686e79';
    var fontStack = css.getPropertyValue('--font-ui').trim() || 'system-ui, sans-serif';

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    KB.edges.forEach(function (e) {
      if (!pos[e.from] || !pos[e.to]) return;
      ctx.globalAlpha = e.type === 'prerequisite' ? 0.85 : 0.4;
      ctx.beginPath();
      ctx.moveTo(pos[e.from].x, pos[e.from].y);
      ctx.lineTo(pos[e.to].x, pos[e.to].y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    hit.length = 0;
    var labels = [];
    ids.forEach(function (n) {
      var c = KB.concept(n);
      if (!c) return;
      var p = pos[n];
      var r = n === id ? 6 : hops[n] === 1 ? 4 : 3;
      ctx.fillStyle = n === id ? accent : (KB.subject(c.subject) || {}).color || muted;
      ctx.globalAlpha = n === id ? 1 : hops[n] === 1 ? 0.9 : 0.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      hit.push({ x: p.x, y: p.y, r: r + 5, id: n, title: c.title });
      labels.push({ x: p.x, y: p.y + r + 12, text: c.title, self: n === id });
    });

    // Labels last, so no node is drawn over one. The map sits in the article
    // column now rather than a 260px rail, and at that size a field of unnamed
    // dots is decoration -- the names are what make it a map.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    labels.forEach(function (l) {
      ctx.font = (l.self ? '600 ' : '') + '11px ' + fontStack;
      ctx.fillStyle = l.self ? accent : muted;
      ctx.globalAlpha = l.self ? 1 : 0.85;
      // Clamp so a name near the edge stays inside the canvas.
      var half = ctx.measureText(l.text).width / 2;
      ctx.fillText(l.text, Math.min(Math.max(l.x, half + 4), w - half - 4), l.y);
    });
    ctx.globalAlpha = 1;

    if (canvas.dataset.bound) return;
    canvas.dataset.bound = '1';
    canvas.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = (e.clientX - rect.left) * (w / rect.width);
      var y = (e.clientY - rect.top) * (h / rect.height);
      var found = hit.find(function (p) { return (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) < p.r * p.r; });
      canvas.title = found ? found.title : '';
      canvas.style.cursor = found ? 'pointer' : 'default';
    });
    canvas.addEventListener('click', function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = (e.clientX - rect.left) * (w / rect.width);
      var y = (e.clientY - rect.top) * (h / rect.height);
      var found = hit.find(function (p) { return (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) < p.r * p.r; });
      if (found && found.id !== id) global.location.href = '../concepts/' + found.id + '.html';
    });
  }

  /* -------------------------------------------------------- revision card -- */

  function revisionCard() {
    var main = UI.$('.kb-main--concept');
    if (!main) return;
    var c = KB.concept(main.getAttribute('data-concept-id'));
    if (!c) return;

    // The "30-Second Revision" section is the card; fall back to the summary.
    var section = null;
    UI.$$('.kb-content .kb-h2').forEach(function (h) {
      if (/revision|summary|tl;?dr/i.test(h.textContent)) section = h;
    });
    var html = '';
    if (section) {
      var n = section.nextElementSibling;
      while (n && !n.classList.contains('kb-h2')) { html += n.outerHTML; n = n.nextElementSibling; }
    }
    if (!html) html = '<p>' + KB.util.escapeHtml(c.summary) + '</p>';
    if (c.formulas.length) {
      html += '<div style="margin-top:14px">' + c.formulas.slice(0, 3).map(function (f) {
        return '<div class="kb-formula-recap-item" style="margin-bottom:8px">' +
          '<span class="kb-formula-recap-name">' + KB.util.escapeHtml(f.name || 'Formula') + '</span>' +
          '<span class="math-display">\\[' + KB.util.escapeHtml(f.latex) + '\\]</span></div>';
      }).join('') + '</div>';
    }

    var node = UI.el('div', { class: 'kb-flashcard' });
    node.innerHTML = '<h2>' + KB.util.escapeHtml(c.title) + '</h2>' +
      '<p class="kb-fc-sub">' + KB.util.escapeHtml((KB.subject(c.subject) || {}).name || '') + '</p>' +
      '<div class="kb-flashcard-body">' + html + '</div>' +
      '<div class="kb-flashcard-foot">' +
      '<button class="kb-btn kb-btn--primary" data-fc="close">Close</button></div>';

    node.addEventListener('click', function (e) {
      if (e.target.closest('[data-fc]')) UI.closeOverlay();
    });

    UI.openOverlay(node);
    doc.dispatchEvent(new CustomEvent('kb:content', { detail: node }));
  }

  doc.addEventListener('click', function (e) {
    if (e.target.closest('[data-kb-flashcards]')) revisionCard();
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.isContentEditable) {
      revisionCard();
    }
  });

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
