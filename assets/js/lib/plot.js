/* ==========================================================================
   Minimal canvas plotting + statistics helpers for interactive modules.

   Purpose-built rather than pulled from a chart library: interactive quant
   modules need line/area/histogram/scatter on a shared theme, at 60fps, with
   zero network access. A general charting dependency would be ~200KB for the
   10% of it we use, and would not read theme tokens.
   ========================================================================== */
(function (global) {
  'use strict';

  function themeColor(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  var PALETTE = ['#4f8fd6', '#2f9e79', '#c79a3e', '#b0556b', '#7a63c9', '#3fa5b5', '#c07f3e', '#8a9bb0'];

  /* ------------------------------------------------------------- random -- */

  /** Deterministic PRNG (mulberry32) so an example is reproducible. */
  function rng(seed) {
    var a = seed >>> 0 || 1;
    var next = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    var spare = null;
    return {
      uniform: next,
      /** Box–Muller, cached spare for the second normal. */
      normal: function () {
        if (spare !== null) { var s = spare; spare = null; return s; }
        var u = 0, v = 0, r = 0;
        do { u = next() * 2 - 1; v = next() * 2 - 1; r = u * u + v * v; } while (r === 0 || r >= 1);
        var f = Math.sqrt(-2 * Math.log(r) / r);
        spare = v * f;
        return u * f;
      },
    };
  }

  /* --------------------------------------------------------- statistics -- */

  var stat = {
    mean: function (a) { return a.reduce(function (s, x) { return s + x; }, 0) / (a.length || 1); },
    variance: function (a, sample) {
      var m = stat.mean(a);
      var ss = a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0);
      return ss / Math.max(1, a.length - (sample === false ? 0 : 1));
    },
    std: function (a, sample) { return Math.sqrt(stat.variance(a, sample)); },
    quantile: function (a, q) {
      if (!a.length) return NaN;
      var s = a.slice().sort(function (x, y) { return x - y; });
      var p = (s.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
      return s[lo] + (s[hi] - s[lo]) * (p - lo);
    },
    corr: function (a, b) {
      var ma = stat.mean(a), mb = stat.mean(b), sa = 0, sb = 0, sab = 0;
      for (var i = 0; i < a.length; i += 1) {
        var da = a[i] - ma, db = b[i] - mb;
        sa += da * da; sb += db * db; sab += da * db;
      }
      return sab / Math.sqrt(sa * sb || 1);
    },
    /** Ordinary least squares y = a + b x, with R². */
    ols: function (x, y) {
      var mx = stat.mean(x), my = stat.mean(y), sxy = 0, sxx = 0;
      for (var i = 0; i < x.length; i += 1) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) * (x[i] - mx); }
      var b = sxx ? sxy / sxx : 0;
      var a = my - b * mx;
      var ssTot = 0, ssRes = 0;
      for (var j = 0; j < x.length; j += 1) {
        var pred = a + b * x[j];
        ssRes += (y[j] - pred) * (y[j] - pred);
        ssTot += (y[j] - my) * (y[j] - my);
      }
      return { a: a, b: b, r2: ssTot ? 1 - ssRes / ssTot : 0 };
    },
    /** Standard normal CDF via Abramowitz–Stegun 7.1.26. */
    normalCdf: function (z) {
      var t = 1 / (1 + 0.2316419 * Math.abs(z));
      var d = 0.3989422804014327 * Math.exp(-z * z / 2);
      var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
      return z > 0 ? 1 - p : p;
    },
    histogram: function (values, bins) {
      var lo = Math.min.apply(null, values), hi = Math.max.apply(null, values);
      if (lo === hi) { hi = lo + 1; }
      var n = bins || 40, w = (hi - lo) / n;
      var counts = new Array(n).fill(0);
      values.forEach(function (v) {
        var i = Math.min(n - 1, Math.max(0, Math.floor((v - lo) / w)));
        counts[i] += 1;
      });
      return { lo: lo, hi: hi, width: w, counts: counts,
        centers: counts.map(function (_, i) { return lo + w * (i + 0.5); }) };
    },
  };

  /* ---------------------------------------------------------------- plot -- */

  /**
   * new Plot(canvas, { padding, xLabel, yLabel })
   * Series are drawn in data coordinates; the plot handles scaling, the grid,
   * device-pixel-ratio and theme colours.
   */
  function Plot(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = opts || {};
    this.pad = Object.assign({ top: 12, right: 14, bottom: 26, left: 46 }, this.opts.padding || {});
    this.resize();
  }

  Plot.prototype.resize = function () {
    var dpr = global.devicePixelRatio || 1;
    var rect = this.canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width || this.canvas.width));
    var h = Math.max(1, Math.round(this.opts.height || rect.height || this.canvas.height || 200));
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    return this;
  };

  // Math.min.apply spreads the array across the argument list, which overflows
  // the call stack somewhere past ~125k values -- and a module at max sliders
  // (200 paths x 2000 steps) hands us 400k. Loop instead: no limit, and no
  // intermediate array.
  function extent(a) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < a.length; i += 1) {
      var v = a[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    return [lo, hi];
  }

  Plot.prototype.domain = function (xs, ys) {
    var ex = extent(xs), ey = extent(ys);
    var xmin = ex[0], xmax = ex[1];
    var ymin = ey[0], ymax = ey[1];
    if (xmin === xmax) { xmin -= 0.5; xmax += 0.5; }
    if (ymin === ymax) { ymin -= 0.5; ymax += 0.5; }
    var padY = (ymax - ymin) * 0.06;
    this.x0 = this.opts.xMin != null ? this.opts.xMin : xmin;
    this.x1 = this.opts.xMax != null ? this.opts.xMax : xmax;
    this.y0 = this.opts.yMin != null ? this.opts.yMin : ymin - padY;
    this.y1 = this.opts.yMax != null ? this.opts.yMax : ymax + padY;
    return this;
  };

  Plot.prototype.px = function (x) {
    return this.pad.left + (x - this.x0) / (this.x1 - this.x0 || 1) * (this.w - this.pad.left - this.pad.right);
  };
  Plot.prototype.py = function (y) {
    return this.h - this.pad.bottom - (y - this.y0) / (this.y1 - this.y0 || 1) * (this.h - this.pad.top - this.pad.bottom);
  };

  Plot.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.w, this.h);
    return this;
  };

  Plot.prototype.grid = function (o) {
    o = o || {};
    var ctx = this.ctx;
    var line = themeColor('--line', '#232b36');
    var ink = themeColor('--ink-faint', '#5d6875');
    var xt = o.xTicks || ticks(this.x0, this.x1, 6);
    var yt = o.yTicks || ticks(this.y0, this.y1, 5);
    ctx.save();
    ctx.strokeStyle = line;
    ctx.fillStyle = ink;
    ctx.lineWidth = 1;
    ctx.font = '10px ui-monospace, monospace';

    yt.forEach(function (v) {
      var y = Math.round(this.py(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(this.pad.left, y); ctx.lineTo(this.w - this.pad.right, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(fmt(v, o.yFormat), this.pad.left - 6, y);
    }, this);

    xt.forEach(function (v) {
      var x = Math.round(this.px(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, this.pad.top); ctx.lineTo(x, this.h - this.pad.bottom); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(fmt(v, o.xFormat), x, this.h - this.pad.bottom + 6);
    }, this);
    ctx.restore();
    return this;
  };

  Plot.prototype.line = function (xs, ys, o) {
    o = o || {};
    var ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = o.color || PALETTE[0];
    ctx.lineWidth = o.width || 1.5;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    for (var i = 0; i < xs.length; i += 1) {
      var X = this.px(xs[i]), Y = this.py(ys[i]);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    ctx.restore();
    return this;
  };

  Plot.prototype.area = function (xs, lo, hi, o) {
    o = o || {};
    var ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = o.color || PALETTE[0];
    ctx.globalAlpha = o.alpha == null ? 0.12 : o.alpha;
    ctx.beginPath();
    for (var i = 0; i < xs.length; i += 1) ctx.lineTo(this.px(xs[i]), this.py(hi[i]));
    for (var j = xs.length - 1; j >= 0; j -= 1) ctx.lineTo(this.px(xs[j]), this.py(lo[j]));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return this;
  };

  Plot.prototype.scatter = function (xs, ys, o) {
    o = o || {};
    var ctx = this.ctx;
    var r = o.radius || 2;
    ctx.save();
    ctx.fillStyle = o.color || PALETTE[0];
    ctx.globalAlpha = o.alpha == null ? 0.65 : o.alpha;
    for (var i = 0; i < xs.length; i += 1) {
      ctx.beginPath();
      ctx.arc(this.px(xs[i]), this.py(ys[i]), r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return this;
  };

  Plot.prototype.bars = function (centers, values, o) {
    o = o || {};
    var ctx = this.ctx;
    var w = Math.max(1, (this.px(centers[1]) - this.px(centers[0])) * (o.fill || 0.86)) || 4;
    ctx.save();
    ctx.fillStyle = o.color || PALETTE[0];
    ctx.globalAlpha = o.alpha == null ? 0.8 : o.alpha;
    var base = this.py(Math.max(0, this.y0));
    for (var i = 0; i < centers.length; i += 1) {
      var y = this.py(values[i]);
      ctx.fillRect(this.px(centers[i]) - w / 2, Math.min(y, base), w, Math.abs(base - y));
    }
    ctx.restore();
    return this;
  };

  Plot.prototype.hline = function (y, o) {
    o = o || {};
    var ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = o.color || themeColor('--ink-faint', '#5d6875');
    ctx.lineWidth = o.width || 1;
    if (o.dash !== false) ctx.setLineDash(o.dash || [3, 3]);
    var Y = Math.round(this.py(y)) + 0.5;
    ctx.beginPath(); ctx.moveTo(this.pad.left, Y); ctx.lineTo(this.w - this.pad.right, Y); ctx.stroke();
    if (o.label) {
      ctx.setLineDash([]);
      ctx.fillStyle = o.color || themeColor('--ink-muted', '#8b97a6');
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(o.label, this.pad.left + 4, Y - 2);
    }
    ctx.restore();
    return this;
  };

  Plot.prototype.vline = function (x, o) {
    o = o || {};
    var ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = o.color || themeColor('--ink-faint', '#5d6875');
    ctx.lineWidth = o.width || 1;
    ctx.setLineDash(o.dash || [3, 3]);
    var X = Math.round(this.px(x)) + 0.5;
    ctx.beginPath(); ctx.moveTo(X, this.pad.top); ctx.lineTo(X, this.h - this.pad.bottom); ctx.stroke();
    ctx.restore();
    return this;
  };

  Plot.prototype.legend = function (items) {
    var ctx = this.ctx;
    ctx.save();
    ctx.font = '10.5px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    var x = this.pad.left + 6, y = this.pad.top + 8;
    items.forEach(function (it) {
      ctx.fillStyle = it.color;
      ctx.fillRect(x, y - 3, 8, 6);
      ctx.fillStyle = themeColor('--ink-muted', '#8b97a6');
      ctx.textAlign = 'left';
      ctx.fillText(it.label, x + 13, y);
      x += 21 + ctx.measureText(it.label).width;
    });
    ctx.restore();
    return this;
  };

  function ticks(lo, hi, n) {
    var span = hi - lo;
    if (!isFinite(span) || span <= 0) return [lo];
    var raw = span / n;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    var out = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(v);
    return out;
  }

  function fmt(v, kind) {
    if (kind === 'pct') return (v * 100).toFixed(0) + '%';
    if (typeof kind === 'function') return kind(v);
    var a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e4) return (v / 1e3).toFixed(0) + 'k';
    if (a >= 100) return v.toFixed(0);
    if (a >= 1) return v.toFixed(2).replace(/\.00$/, '');
    if (a === 0) return '0';
    return v.toFixed(3);
  }

  global.KBPlot = {
    Plot: Plot, rng: rng, stat: stat, ticks: ticks, fmt: fmt,
    palette: PALETTE, themeColor: themeColor,
  };
})(window);
