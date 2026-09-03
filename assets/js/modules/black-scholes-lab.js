/* Interactive module: the Black-Scholes price and its Greeks across spot.

   The point of plotting against spot rather than tabulating at one point: every
   claim on the concept page is a shape, not a number. Gamma peaking at the money
   and collapsing away from it, delta turning into a step function as T shrinks,
   theta and gamma being mirror images -- none of those read from a table, and
   all of them are obvious in one curve you can drag. */
KB.modules.register('black-scholes-lab', {
  title: 'Black–Scholes price and Greeks',
  subtitle: 'Drag the inputs and watch the shape, not the number',
  height: 300,
  controls: [
    { id: 'view', label: 'Show', type: 'select', value: 'price', options: [
      { value: 'price', label: 'Price vs payoff' },
      { value: 'delta', label: 'Delta' },
      { value: 'gamma', label: 'Gamma' },
      { value: 'vega', label: 'Vega' },
      { value: 'theta', label: 'Theta (per day)' },
    ] },
    { id: 'K', label: 'Strike', type: 'range', min: 60, max: 140, step: 1, value: 100 },
    { id: 'T', label: 'Maturity (years)', type: 'range', min: 0.02, max: 2, step: 0.02, value: 0.25, decimals: 2 },
    { id: 'sigma', label: 'Volatility', type: 'range', min: 0.05, max: 0.8, step: 0.01, value: 0.25, format: 'pct' },
    { id: 'r', label: 'Rate', type: 'range', min: 0, max: 0.1, step: 0.005, value: 0.04, format: 'pct', decimals: 1 },
    { id: 'put', label: 'Put instead of call', type: 'checkbox', value: false },
  ],
  render: function (ctx) {
    var P = window.KBPlot;
    var v = ctx.values;
    var SPOT = 100;                       // the reference spot the stats report at

    // Abramowitz & Stegun 7.1.26 for erf. Accurate to ~1.5e-7, which is far
    // inside a canvas pixel and avoids shipping a special-function library to a
    // page that must open from a file:// URL.
    function erf(x) {
      var s = x < 0 ? -1 : 1;
      x = Math.abs(x);
      var t = 1 / (1 + 0.3275911 * x);
      var y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
        - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
      return s * y;
    }
    function N(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
    function phi(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }

    // Every Greek shares d1, d2 and phi(d1), so they are computed once per spot
    // rather than once per Greek -- the same reason a risk engine returns them
    // together.
    function bs(S) {
      var K = v.K, T = v.T, sig = v.sigma, r = v.r, put = v.put;
      var payoff = put ? Math.max(K - S, 0) : Math.max(S - K, 0);
      if (T <= 0 || sig <= 0) {
        return { price: payoff, delta: put ? (S < K ? -1 : 0) : (S > K ? 1 : 0),
          gamma: 0, vega: 0, theta: 0, payoff: payoff };
      }
      var sqrtT = Math.sqrt(T);
      var d1 = (Math.log(S / K) + (r + 0.5 * sig * sig) * T) / (sig * sqrtT);
      var d2 = d1 - sig * sqrtT;
      var disc = Math.exp(-r * T), pdf = phi(d1);
      var price = put
        ? K * disc * N(-d2) - S * N(-d1)
        : S * N(d1) - K * disc * N(d2);
      var theta = put
        ? -S * pdf * sig / (2 * sqrtT) + r * K * disc * N(-d2)
        : -S * pdf * sig / (2 * sqrtT) - r * K * disc * N(d2);
      return {
        price: price,
        delta: put ? N(d1) - 1 : N(d1),
        gamma: pdf / (S * sig * sqrtT),
        vega: S * pdf * sqrtT / 100,      // per volatility point
        theta: theta / 252,               // per TRADING day, matching the sqrt(252)
                                          // in the break-even move below: sigma is
                                          // annualised on trading days, so a 365-day
                                          // theta would not be comparable to it
        payoff: payoff,
      };
    }

    var xs = [], main = [], payoff = [];
    for (var i = 0; i <= 220; i += 1) {
      var S = 40 + (160 - 40) * (i / 220);
      var g = bs(S);
      xs.push(S);
      main.push(g[v.view === 'price' ? 'price' : v.view]);
      payoff.push(g.payoff);
    }

    var showPayoff = v.view === 'price';
    var plot = ctx.plot({ height: 300, padding: { left: 54, right: 16, top: 14, bottom: 30 } });
    plot.domain(xs, showPayoff ? main.concat(payoff) : main.concat([0])).clear().grid();

    if (showPayoff) {
      plot.line(xs, payoff, { color: P.themeColor('--ink-faint', '#686e79'), width: 1.5, dash: [4, 4] });
    }
    plot.line(xs, main, { color: P.palette[0], width: 2.5 });
    plot.vline(v.K, { color: P.themeColor('--ink-faint', '#686e79') });
    if (v.view === 'delta' || v.view === 'theta') plot.hline(0, { dash: [2, 4] });
    plot.legend(showPayoff
      ? [{ label: 'value now', color: P.palette[0] },
         { label: 'payoff at expiry', color: P.themeColor('--ink-faint', '#686e79') }]
      : [{ label: v.view + ' (strike marked)', color: P.palette[0] }]);

    // The stats read at spot = 100 so the numbers stay comparable as the strike
    // is dragged: what changes is moneyness, which is the variable that matters.
    var at = bs(SPOT);
    var breakeven = SPOT * v.sigma / Math.sqrt(252);
    ctx.stats([
      { label: 'Price', value: at.price.toFixed(2) },
      { label: 'Delta', value: at.delta.toFixed(3) },
      { label: 'Gamma', value: at.gamma.toFixed(4) },
      { label: 'Vega /pt', value: at.vega.toFixed(3) },
      { label: 'Theta /day', value: at.theta.toFixed(3) },
      { label: 'Break-even move', value: '$' + breakeven.toFixed(2) },
    ]);

    var notes = {
      price: 'The gap between the two curves is <strong>time value</strong>, and it is widest at the ' +
        'strike. Drag maturity towards zero and watch the price collapse onto the payoff — that ' +
        'collapse <em>is</em> theta, and it accelerates because value scales with \\(\\sqrt{T}\\).',
      delta: 'Delta runs from 0 to 1 (0 to −1 for a put) across the strike. Shorten the maturity and ' +
        'the transition narrows towards a step function — its slope is gamma, which is why gamma ' +
        'diverges at expiry and why a short strike into expiry is an operational problem, not a ' +
        'modelling one.',
      gamma: 'Gamma peaks at the money and vanishes in both wings, and the peak grows as maturity ' +
        'falls: \\(\\Gamma = \\phi(d_1)/(S\\sigma\\sqrt{T})\\). Raising volatility <em>lowers</em> ' +
        'the peak and widens it — high vol spreads the uncertainty over more strikes.',
      vega: 'Vega has the same shape as gamma but scales with \\(\\sqrt{T}\\) instead of ' +
        '\\(1/\\sqrt{T}\\). Drag maturity up and vega grows while gamma shrinks: the two are ' +
        'proportional for one option (\\(\\mathcal{V} = \\sigma TS^2\\Gamma\\)) and are completely ' +
        'different risks across a term structure.',
      theta: 'Theta is gamma reflected: most negative exactly where gamma is largest. That is the ' +
        'Black–Scholes equation, \\(\\Theta \\approx -\\tfrac12\\sigma^2S^2\\Gamma\\) — you pay ' +
        'rent in proportion to the convexity you own. The break-even move above is where the two ' +
        'exactly cancel.',
    };
    ctx.note(notes[v.view]);
  },
});
