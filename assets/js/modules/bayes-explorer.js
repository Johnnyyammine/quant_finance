/* Interactive module: base rates and posterior probability.
   The classic "the test is 99% accurate" trap, made visual. */
KB.modules.register('bayes-explorer', {
  title: 'Posterior vs. base rate',
  subtitle: 'Why a 99% accurate test can still be wrong most of the time',
  height: 210,
  controls: [
    { id: 'prior', label: 'Prior P(H)', type: 'range', min: 0.001, max: 0.5, step: 0.001, value: 0.01, format: 'pct', decimals: 1 },
    { id: 'sens', label: 'Sensitivity P(E|H)', type: 'range', min: 0.5, max: 0.999, step: 0.001, value: 0.99, format: 'pct', decimals: 1 },
    { id: 'spec', label: 'Specificity P(¬E|¬H)', type: 'range', min: 0.5, max: 0.999, step: 0.001, value: 0.99, format: 'pct', decimals: 1 },
  ],
  render: function (ctx) {
    var P = window.KBPlot;
    var v = ctx.values;
    var post = function (prior) {
      var tp = prior * v.sens;
      var fp = (1 - prior) * (1 - v.spec);
      return tp / (tp + fp);
    };

    var xs = [], ys = [];
    for (var i = 0; i <= 200; i += 1) {
      var p = 0.0005 + (0.5 - 0.0005) * (i / 200);
      xs.push(p); ys.push(post(p));
    }

    var plot = ctx.plot({ height: 210, yMin: 0, yMax: 1, padding: { left: 50, right: 14, top: 12, bottom: 30 } });
    plot.domain(xs, ys).clear().grid({ xFormat: 'pct', yFormat: 'pct' });
    plot.line(xs, ys, { color: P.palette[0], width: 2 });
    plot.line(xs, xs, { color: P.themeColor('--ink-faint', '#5d6875'), width: 1, dash: [4, 4] });
    plot.vline(v.prior, { color: P.palette[3] });
    plot.hline(post(v.prior), { color: P.palette[3], label: 'P(H|E) = ' + (post(v.prior) * 100).toFixed(1) + '%' });
    plot.legend([
      { label: 'P(H | E)', color: P.palette[0] },
      { label: 'prior (no update)', color: P.themeColor('--ink-faint', '#5d6875') },
    ]);

    var tp = v.prior * v.sens;
    var fp = (1 - v.prior) * (1 - v.spec);
    ctx.stats([
      { label: 'Prior', value: (v.prior * 100).toFixed(2) + '%' },
      { label: 'Posterior', value: (post(v.prior) * 100).toFixed(1) + '%' },
      { label: 'True positives', value: (tp * 10000).toFixed(0) + ' / 10k' },
      { label: 'False positives', value: (fp * 10000).toFixed(0) + ' / 10k' },
      { label: 'Bayes factor', value: (v.sens / (1 - v.spec)).toFixed(1) + '×' },
    ]);
    ctx.note('The evidence multiplies the prior <em>odds</em> by the likelihood ratio ' +
      '\\(P(E\\mid H)/P(E\\mid \\neg H)\\). A rare hypothesis stays rare unless that ratio is large — ' +
      'the same arithmetic that governs a signal with low hit rate on a rare event.');
  },
});
