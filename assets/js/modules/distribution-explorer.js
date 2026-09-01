/* Interactive module: sampling distribution of the mean — the CLT in action,
   including how badly it behaves for fat-tailed draws. */
KB.modules.register('distribution-explorer', {
  title: 'Central limit theorem, and where it fails',
  subtitle: 'Sampling distribution of the mean for different populations',
  height: 240,
  controls: [
    { id: 'dist', label: 'Population', type: 'select', value: 'uniform', options: [
      { value: 'uniform', label: 'Uniform' },
      { value: 'exponential', label: 'Exponential (skewed)' },
      { value: 'bernoulli', label: 'Bernoulli p=0.05 (rare event)' },
      { value: 'cauchy', label: 'Cauchy (infinite variance)' },
    ] },
    { id: 'n', label: 'Sample size n', type: 'range', min: 1, max: 200, step: 1, value: 30, format: 'int' },
    { id: 'reps', label: 'Repetitions', type: 'range', min: 200, max: 20000, step: 200, value: 4000, format: 'int' },
  ],
  render: function (ctx) {
    var P = window.KBPlot;
    var v = ctx.values;
    var rand = P.rng(20250901);
    var draw = {
      uniform: function () { return rand.uniform(); },
      exponential: function () { return -Math.log(1 - rand.uniform()); },
      bernoulli: function () { return rand.uniform() < 0.05 ? 1 : 0; },
      cauchy: function () { return Math.tan(Math.PI * (rand.uniform() - 0.5)); },
    }[v.dist];

    var means = [];
    for (var r = 0; r < v.reps; r += 1) {
      var s = 0;
      for (var i = 0; i < v.n; i += 1) s += draw();
      means.push(s / v.n);
    }

    // Cauchy has no finite variance: clip the view or the histogram is one bar.
    var lo = P.stat.quantile(means, 0.005), hi = P.stat.quantile(means, 0.995);
    var shown = means.filter(function (x) { return x >= lo && x <= hi; });
    var h = P.stat.histogram(shown, 46);
    var dens = h.counts.map(function (c) { return c / (shown.length * h.width); });

    var plot = ctx.plot({ height: 240, padding: { left: 48, right: 14, top: 12, bottom: 28 } });
    plot.domain(h.centers, dens.concat([0])).clear().grid();
    plot.bars(h.centers, dens, { color: P.palette[0], alpha: 0.65 });

    var mu = P.stat.mean(shown), sd = P.stat.std(shown);
    if (v.dist !== 'cauchy') {
      var nx = [], ny = [];
      for (var k = 0; k <= 120; k += 1) {
        var x = h.lo + (h.hi - h.lo) * (k / 120);
        nx.push(x);
        ny.push(Math.exp(-((x - mu) * (x - mu)) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI)));
      }
      plot.line(nx, ny, { color: P.palette[3], width: 2 });
      plot.legend([{ label: 'sample means', color: P.palette[0] }, { label: 'normal fit', color: P.palette[3] }]);
    }

    ctx.stats([
      { label: 'Mean', value: mu.toFixed(4) },
      { label: 'SD', value: sd.toFixed(4) },
      { label: 'Skew q95/q05', value: (P.stat.quantile(shown, 0.95) / (P.stat.quantile(shown, 0.05) || 1e-9)).toFixed(2) },
      { label: 'n', value: v.n },
      { label: 'Draws', value: (v.n * v.reps).toLocaleString() },
    ]);
    ctx.note(v.dist === 'cauchy'
      ? 'Cauchy draws have no finite variance, so averaging <em>never</em> converges — the sample mean ' +
        'of \\(n\\) Cauchy variables is itself Cauchy. Raising \\(n\\) buys nothing. Financial returns ' +
        'are not this bad, but they are closer to this than to Gaussian.'
      : 'The population is not normal, but the distribution of the mean approaches normal as \\(n\\) grows. ' +
        'Note how much slower convergence is for the rare-event Bernoulli — the case that matters for tail risk.');
  },
});
