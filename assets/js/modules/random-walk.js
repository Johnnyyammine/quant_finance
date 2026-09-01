/* Interactive module: random walk / Brownian motion sample paths.
   Reference implementation — copy this file to build a new module. */
KB.modules.register('random-walk', {
  title: 'Random walk sample paths',
  subtitle: 'Scaling, dispersion and the √t law',
  height: 260,
  controls: [
    { id: 'paths', label: 'Paths', type: 'range', min: 1, max: 200, step: 1, value: 40, format: 'int' },
    { id: 'steps', label: 'Steps', type: 'range', min: 10, max: 2000, step: 10, value: 500, format: 'int' },
    { id: 'drift', label: 'Drift μ (per unit time)', type: 'range', min: -0.5, max: 0.5, step: 0.01, value: 0, decimals: 2 },
    { id: 'sigma', label: 'Volatility σ', type: 'range', min: 0.02, max: 0.8, step: 0.01, value: 0.2, format: 'pct' },
    { id: 'seed', label: 'Seed', type: 'range', min: 1, max: 200, step: 1, value: 7, format: 'int' },
  ],
  render: function (ctx) {
    var P = window.KBPlot;
    var v = ctx.values;
    var n = v.steps, m = v.paths, dt = 1 / n;
    var rand = P.rng(v.seed * 7919);

    var xs = [];
    for (var i = 0; i <= n; i += 1) xs.push(i * dt);

    var paths = [];
    var finals = [];
    for (var p = 0; p < m; p += 1) {
      var y = 0;
      var series = [0];
      for (var t = 1; t <= n; t += 1) {
        y += v.drift * dt + v.sigma * Math.sqrt(dt) * rand.normal();
        series.push(y);
      }
      paths.push(series);
      finals.push(y);
    }

    var all = [];
    paths.forEach(function (s) { all = all.concat(s); });

    var plot = ctx.plot({ height: 260, padding: { left: 50, right: 14, top: 12, bottom: 26 } });
    plot.domain(xs, all).clear().grid({ yFormat: 'pct' });

    // ±1σ and ±2σ theoretical envelopes: the point of the demo.
    var lo1 = xs.map(function (t) { return v.drift * t - v.sigma * Math.sqrt(t); });
    var hi1 = xs.map(function (t) { return v.drift * t + v.sigma * Math.sqrt(t); });
    var lo2 = xs.map(function (t) { return v.drift * t - 2 * v.sigma * Math.sqrt(t); });
    var hi2 = xs.map(function (t) { return v.drift * t + 2 * v.sigma * Math.sqrt(t); });
    plot.area(xs, lo2, hi2, { color: P.palette[0], alpha: 0.07 });
    plot.area(xs, lo1, hi1, { color: P.palette[0], alpha: 0.11 });

    paths.forEach(function (s, i) {
      plot.line(xs, s, { color: P.palette[i % P.palette.length], width: 0.9, alpha: m > 40 ? 0.3 : 0.7 });
    });
    plot.line(xs, xs.map(function (t) { return v.drift * t; }),
      { color: P.themeColor('--ink-strong', '#fff'), width: 1.4, dash: [5, 4] });

    var sd = P.stat.std(finals);
    ctx.stats([
      { label: 'Paths', value: m },
      { label: 'Mean W₁', value: P.stat.mean(finals).toFixed(4) },
      { label: 'SD of W₁', value: sd.toFixed(4) },
      { label: 'Theory σ√T', value: (v.sigma * 1).toFixed(4) },
      { label: 'Max |W₁|', value: Math.max.apply(null, finals.map(Math.abs)).toFixed(3) },
    ]);
    ctx.note('Shaded bands are the theoretical \\(\\pm1\\sigma\\) and \\(\\pm2\\sigma\\) envelopes ' +
      '\\(\\mu t \\pm k\\sigma\\sqrt{t}\\). Dispersion grows with \\(\\sqrt{t}\\), not \\(t\\) — ' +
      'raise the number of paths and the sample SD converges on σ√T.');
  },
});
