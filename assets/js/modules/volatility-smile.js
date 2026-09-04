/* Interactive module: the smile, and the distribution it is a statement about.

   The whole argument of the concept page is that a smile and a risk-neutral
   density are the same object in two coordinate systems, and that argument is
   unconvincing in prose: nobody looks at "sigma rises 4.8 points at a 10% lower
   strike" and pictures a left tail. So the controls are the three numbers a desk
   actually quotes -- level, slope, curvature -- and the views are the same slice
   drawn as a smile, as a density against the lognormal it replaces, and as the
   price ratio that shows what a flat vol would have cost you in the wings.

   The slice is SVI in total variance, not a parabola in sigma, for the reason
   the page gives: total variance must grow at most linearly in log-moneyness
   (Lee's bound), and a parabola does not. SVI's wings are linear by
   construction, so the far strikes stay sane however hard the sliders are
   pushed -- and when they are pushed too hard, Gatheral's g(k) goes negative and
   the module says so, which is the lesson. */
KB.modules.register('volatility-smile', {
  title: 'The volatility smile and its density',
  subtitle: 'Drag level, skew and convexity — the three numbers a desk quotes',
  height: 300,
  controls: [
    { id: 'view', label: 'Show', type: 'select', value: 'smile', options: [
      { value: 'smile', label: 'Implied vol by strike' },
      { value: 'density', label: 'Density vs lognormal' },
      { value: 'ratio', label: 'Flat-vol mispricing' },
    ] },
    { id: 'sigma', label: 'ATM volatility', type: 'range', min: 0.08, max: 0.6, step: 0.01, value: 0.25, format: 'pct' },
    { id: 'skew', label: 'ATM skew ∂σ/∂k', type: 'range', min: -1.2, max: 0.3, step: 0.02, value: -0.36, decimals: 2 },
    { id: 'convexity', label: 'Convexity ∂²σ/∂k²', type: 'range', min: 0, max: 12, step: 0.1, value: 3.3, decimals: 1 },
    { id: 'T', label: 'Maturity (years)', type: 'range', min: 0.08, max: 2, step: 0.02, value: 0.25, decimals: 2 },
  ],
  render: function (ctx) {
    var P = window.KBPlot;
    var v = ctx.values;
    var S = 100, r = 0.04;
    var T = v.T, F = S * Math.exp(r * T);

    function erf(x) {
      var s = x < 0 ? -1 : 1;
      x = Math.abs(x);
      var t = 1 / (1 + 0.3275911 * x);
      var y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
        - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
      return s * y;
    }
    function N(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }

    /* ---- the slice ------------------------------------------------------
       Raw SVI centred at the money: w(k) = a + b(rho*k + sqrt(k^2 + s^2)),
       with w = sigma^2 T. The three sliders pin the slice AT the money --
       w(0), w'(0) and w''(0) -- and SVI then fixes the wings:

         w(0) = sigma^2 T,  w'(0) = 2 T sigma * skew,
         w''(0) = 2 T (skew^2 + sigma * convexity)

       and SVI gives w'(0) = b*rho, w''(0) = b/s. That is two equations in
       three unknowns, so `s` (the wing width) is the free shape parameter; it
       is floored at 0.2 to keep |rho| well away from 1, where the wings kink
       so hard that the slice is arbitrageable for reasons the sliders did not
       ask for. */
    var w0 = v.sigma * v.sigma * T;
    var wp = 2 * T * v.sigma * v.skew;
    var wpp = 2 * T * (v.skew * v.skew + v.sigma * v.convexity);
    var sviS, sviB, sviRho;
    if (wpp <= 1e-9) {                        // flat and skewless: a constant slice
      sviS = 0.2; sviB = 0; sviRho = 0;
    } else {
      sviS = Math.max(0.2, Math.abs(wp) / (0.98 * wpp));
      sviB = sviS * wpp;
      sviRho = Math.max(-0.98, Math.min(0.98, wp / sviB));
    }
    var sviA = w0 - sviB * sviS;

    function w(k) { return sviA + sviB * (sviRho * k + Math.sqrt(k * k + sviS * sviS)); }
    function wPrime(k) { return sviB * (sviRho + k / Math.sqrt(k * k + sviS * sviS)); }
    function wSecond(k) {
      var q = k * k + sviS * sviS;
      return sviB * sviS * sviS / (q * Math.sqrt(q));
    }
    // Total variance can be driven negative in a wing by an extreme skew; clamp
    // rather than return NaN, so the plot degrades to a floor instead of a gap.
    function volK(K) { return Math.sqrt(Math.max(w(Math.log(K / F)), 1e-8) / T); }
    var ATM = volK(F);

    function call(K, sig) {
      if (sig <= 0 || T <= 0) return Math.max(S - K * Math.exp(-r * T), 0);
      var sq = Math.sqrt(T);
      var d1 = (Math.log(S / K) + (r + 0.5 * sig * sig) * T) / (sig * sq);
      return S * N(d1) - K * Math.exp(-r * T) * N(d1 - sig * sq);
    }
    function put(K, sig) { return call(K, sig) - S + K * Math.exp(-r * T); }
    function cDelta(K, sig) {
      var sq = Math.sqrt(T);
      return N((Math.log(S / K) + (r + 0.5 * sig * sig) * T) / (sig * sq));
    }
    var smileCall = function (K) { return call(K, volK(K)); };
    var flatCall = function (K) { return call(K, ATM); };

    /* Breeden-Litzenberger: the density IS the second difference in strike, so
       it is computed the same way here as it is priced on a desk. h is a
       fraction of spot rather than a constant because the useful strike range
       widens with volatility and maturity. */
    var h = Math.max(0.25, 0.004 * S * v.sigma * Math.sqrt(T) * 20);
    function density(K, cf) {
      return Math.exp(r * T) * (cf(K - h) - 2 * cf(K) + cf(K + h)) / (h * h);
    }

    /* Plot over a fixed number of standard deviations so the window tracks the
       distribution rather than a hard-coded strike range. The ratio view gets a
       tighter one: a flat vol's error grows without bound as the option it is
       mispricing goes worthless, so at three standard deviations the curve is a
       vertical wall that flattens everything readable into the axis. Just under
       two is where the interesting range -- roughly 0.8x to 6x -- fills the
       frame. */
    var sd = v.sigma * Math.sqrt(T);
    var span = v.view === 'ratio' ? Math.max(0.12, 1.9 * sd) : Math.max(0.18, 3.2 * sd);
    var kLo = -span, kHi = span * (v.view === 'ratio' ? 1 : 0.85);
    var xs = [], ks = [];
    for (var i = 0; i <= 220; i += 1) {
      var k = kLo + (kHi - kLo) * (i / 220);
      ks.push(k);
      xs.push(F * Math.exp(k));
    }

    var plot = ctx.plot({ height: 300, padding: { left: 56, right: 16, top: 14, bottom: 30 } });
    var faint = P.themeColor('--ink-faint', '#686e79');
    var j;

    if (v.view === 'smile') {
      var vols = [], flat = [];
      for (j = 0; j < xs.length; j += 1) { vols.push(100 * volK(xs[j])); flat.push(100 * ATM); }
      plot.domain(xs, vols.concat(flat)).clear().grid();
      plot.line(xs, flat, { color: faint, width: 1.5, dash: [4, 4] });
      plot.line(xs, vols, { color: P.palette[0], width: 2.5 });
      plot.vline(F, { color: faint });
      plot.legend([{ label: 'implied vol (%)', color: P.palette[0] },
        { label: 'flat ATM vol', color: faint }]);
    } else if (v.view === 'density') {
      var fs = [], fl = [];
      for (j = 0; j < xs.length; j += 1) {
        fs.push(density(xs[j], smileCall));
        fl.push(density(xs[j], flatCall));
      }
      plot.domain(xs, fs.concat(fl).concat([0])).clear().grid();
      plot.line(xs, fl, { color: faint, width: 1.5, dash: [4, 4] });
      plot.line(xs, fs, { color: P.palette[0], width: 2.5 });
      plot.vline(F, { color: faint });
      plot.hline(0, { dash: [2, 4] });
      plot.legend([{ label: 'implied density', color: P.palette[0] },
        { label: 'lognormal at ATM vol', color: faint }]);
    } else {
      // Out-of-the-money options only -- puts below the forward, calls above --
      // because that is the half of each contract a smile actually reprices, and
      // an in-the-money ratio is dominated by intrinsic value and reads as 1.
      var ratio = [], one = [];
      for (j = 0; j < xs.length; j += 1) {
        var K = xs[j], otmSmile, otmFlat;
        if (K < F) { otmSmile = put(K, volK(K)); otmFlat = put(K, ATM); }
        else { otmSmile = call(K, volK(K)); otmFlat = call(K, ATM); }
        ratio.push(otmFlat > 1e-9 ? Math.min(otmSmile / otmFlat, 10) : 1);
        one.push(1);
      }
      plot.domain(xs, ratio.concat([1])).clear().grid();
      plot.line(xs, one, { color: faint, width: 1.5, dash: [4, 4] });
      plot.line(xs, ratio, { color: P.palette[3], width: 2.5 });
      plot.vline(F, { color: faint });
      plot.legend([{ label: 'OTM price ÷ flat-vol price', color: P.palette[3] },
        { label: 'flat vol is right', color: faint }]);
    }

    /* ---- what the desk would quote off this slice ----------------------- */
    function solveStrike(f) {
      var lo = F * 0.2, hi = F * 4;
      for (var n = 0; n < 90; n += 1) {
        var mid = 0.5 * (lo + hi);
        if (f(mid) > 0) lo = mid; else hi = mid;
      }
      return 0.5 * (lo + hi);
    }
    var K25c = solveStrike(function (K) { return cDelta(K, volK(K)) - 0.25; });
    var K25p = solveStrike(function (K) { return 0.25 - (1 - cDelta(K, volK(K))); });
    var rr = 100 * (volK(K25c) - volK(K25p));
    var bf = 100 * (0.5 * (volK(K25c) + volK(K25p)) - ATM);

    /* Gatheral's butterfly condition, from analytic SVI derivatives. g(k) >= 0
       everywhere is exactly "the implied density is non-negative", so this one
       number decides whether the slice on screen is a market or a free lunch. */
    function g(k) {
      var W = w(k);
      if (W <= 0) return -1;
      var d1 = wPrime(k), d2 = wSecond(k);
      return Math.pow(1 - k * d1 / (2 * W), 2) - (d1 * d1 / 4) * (1 / W + 0.25) + d2 / 2;
    }
    var minG = Infinity;
    for (var kk = -1.5; kk <= 1.5; kk += 0.005) minG = Math.min(minG, g(kk));

    /* Skewness of the implied density, integrated over the strike axis. This is
       the number the smile exists to express: a lognormal is always positively
       skewed, so a negative reading is something no choice of a single sigma
       could have produced. Computed only for an admissible slice -- once
       g(k) < 0 the "density" is negative in places and its moments are not a
       distribution's moments. */
    var skewness = 0;
    if (minG >= 0) {
      var lo = F * 0.05, hi = F * 4, n = 1200, step = (hi - lo) / n;
      var m0 = 0, m1 = 0, fv = [], K2;
      for (j = 0; j <= n; j += 1) {
        K2 = lo + j * step;
        var d = Math.max(density(K2, smileCall), 0);
        fv.push(d);
        m0 += d * step; m1 += K2 * d * step;
      }
      var mean = m0 > 0 ? m1 / m0 : F, m2 = 0, m3 = 0;
      for (j = 0; j <= n; j += 1) {
        var dev = lo + j * step - mean;
        m2 += dev * dev * fv[j] * step; m3 += dev * dev * dev * fv[j] * step;
      }
      m2 /= (m0 || 1); m3 /= (m0 || 1);
      skewness = m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0;
    }

    ctx.stats([
      { label: 'ATM vol', value: (100 * ATM).toFixed(2) + '%' },
      { label: 'RR 25Δ', value: (rr >= 0 ? '+' : '') + rr.toFixed(2) },
      { label: 'BF 25Δ', value: (bf >= 0 ? '+' : '') + bf.toFixed(2) },
      // Reported only when the slice is admissible: once g(k) < 0 the "density"
      // has negative regions and its moments are not a distribution's moments.
      { label: 'Density skew', value: minG >= 0 ? skewness.toFixed(3) : '—' },
      { label: 'min g(k)', value: minG.toFixed(3) },
      { label: 'Arbitrage', value: minG >= 0 ? 'none' : 'butterfly' },
    ]);

    var notes = {
      smile: 'The slope is the <strong>risk reversal</strong> and the curvature the ' +
        '<strong>butterfly</strong> — the two numbers, with the ATM level, that transmit a whole ' +
        'smile. Push maturity up and watch the smile flatten <em>in vol</em> while total variance ' +
        '\\(w = \\sigma^2T\\) keeps growing: that is why no-arbitrage is stated in \\(w\\), not ' +
        'in \\(\\sigma\\).',
      density: 'Same slice, drawn as the distribution it encodes. The dashed lognormal is what a ' +
        'single volatility would have assumed. Drag the skew negative and probability leaves the ' +
        'near-left shoulder for the <em>far</em> left tail — the density statistic above goes ' +
        'negative, which no lognormal can do at any \\(\\sigma\\).',
      ratio: 'Every point is an out-of-the-money option priced on the smile, divided by its price ' +
        'at the flat ATM vol. The wings are where the ratio lives: a downside put can be worth ' +
        'several times its flat-vol price while an upside call is worth less. Quoting wings off an ' +
        'ATM number is not a small approximation.',
    };
    var warn = minG < 0
      ? ' <strong>This slice is not arbitrage-free:</strong> \\(g(k) &lt; 0\\) somewhere, so the ' +
        'implied density is negative and some butterfly is worth less than nothing. The smile can ' +
        'be steep, but not arbitrarily steep — that bound is a computation, not a taste.'
      : '';
    ctx.note(notes[v.view] + warn);
  },
});
