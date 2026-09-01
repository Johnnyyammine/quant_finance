/* Interactive module: OLS on noisy data — slope estimation, R² and the
   sampling error that makes small-sample betas untrustworthy. */
KB.modules.register('regression-lab', {
  title: 'Least squares under noise',
  subtitle: 'Estimated slope vs. true slope as sample size and noise change',
  height: 250,
  controls: [
    { id: 'n', label: 'Observations', type: 'range', min: 10, max: 1000, step: 10, value: 120, format: 'int' },
    { id: 'beta', label: 'True slope β', type: 'range', min: -2, max: 2, step: 0.05, value: 0.8, decimals: 2 },
    { id: 'noise', label: 'Residual σ', type: 'range', min: 0.05, max: 3, step: 0.05, value: 1, decimals: 2 },
    { id: 'seed', label: 'Seed', type: 'range', min: 1, max: 200, step: 1, value: 3, format: 'int' },
  ],
  render: function (ctx) {
    var P = window.KBPlot;
    var v = ctx.values;
    var rand = P.rng(v.seed * 104729);
    var xs = [], ys = [];
    for (var i = 0; i < v.n; i += 1) {
      var x = rand.normal();
      xs.push(x);
      ys.push(v.beta * x + v.noise * rand.normal());
    }
    var fit = P.stat.ols(xs, ys);
    var se = v.noise / Math.sqrt(v.n * P.stat.variance(xs, false) || 1);

    var plot = ctx.plot({ height: 250, padding: { left: 46, right: 14, top: 12, bottom: 28 } });
    plot.domain(xs, ys).clear().grid();
    plot.scatter(xs, ys, { color: P.palette[0], radius: 2, alpha: 0.5 });
    var lineX = [plot.x0, plot.x1];
    plot.line(lineX, lineX.map(function (x) { return v.beta * x; }),
      { color: P.themeColor('--ink-faint', '#5d6875'), width: 1.4, dash: [5, 4] });
    plot.line(lineX, lineX.map(function (x) { return fit.a + fit.b * x; }),
      { color: P.palette[1], width: 2 });
    plot.legend([
      { label: 'true relationship', color: P.themeColor('--ink-faint', '#5d6875') },
      { label: 'OLS fit', color: P.palette[1] },
    ]);

    ctx.stats([
      { label: 'β̂', value: fit.b.toFixed(3) },
      { label: 'SE(β̂)', value: se.toFixed(3) },
      { label: 't-stat', value: (fit.b / (se || 1e-9)).toFixed(2) },
      { label: 'R²', value: fit.r2.toFixed(3) },
      { label: 'n', value: v.n },
    ]);
    ctx.note('Standard error scales as \\(1/\\sqrt{n}\\). Drop the sample to 20 points and a real ' +
      'β of 0.8 can estimate anywhere from 0.2 to 1.4 — the reason a beta fitted on one quarter of ' +
      'daily data is not a number you should size a position on.');
  },
});
