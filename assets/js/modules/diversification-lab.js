/* Interactive module: how many independent bets a portfolio actually takes.

   Builds a block-structured covariance matrix (one market factor, one factor
   per sector, idiosyncratic vol), diagonalises it, and shows the eigenvalue
   spectrum next to the portfolio's own risk contributions across those
   uncorrelated directions. N_eff falls out of the eigenvalues alone; ENB needs
   the weights too, which is exactly the distinction the page is about.

   The eigensolver is a cyclic Jacobi rotation written out in full: the matrix
   is at most 60x60, this runs in a couple of milliseconds, and it keeps the
   page dependency-free and usable over file://. */
(function () {
  'use strict';

KB.modules.register('diversification-lab', {
  title: 'Positions versus bets',
  subtitle: 'Eigenvalue spectrum, effective dimension and the effective number of bets',
  height: 250,
  controls: [
    { id: 'sectors', label: 'Sectors', type: 'range', min: 1, max: 6, step: 1, value: 5, format: 'int' },
    { id: 'perSector', label: 'Names per sector', type: 'range', min: 2, max: 10, step: 1, value: 10, format: 'int' },
    { id: 'rhoMarket', label: 'Market correlation', type: 'range', min: 0, max: 0.9, step: 0.01, value: 0.25, decimals: 2 },
    { id: 'rhoSector', label: 'Extra within-sector correlation', type: 'range', min: 0, max: 0.6, step: 0.01, value: 0.2, decimals: 2 },
    { id: 'portfolio', label: 'Portfolio', type: 'select', value: 'equal', options: [
      { value: 'equal', label: 'Equal weight (all names)' },
      { value: 'invvol', label: 'Inverse volatility' },
      { value: 'minvar', label: 'Minimum variance' },
      { value: 'neutral', label: 'Market neutral (long/short within sector)' },
      { value: 'concentrated', label: 'Concentrated (5 names)' },
    ] },
  ],

  render: function (ctx) {
    var P = window.KBPlot;
    var v = ctx.values;
    var sectors = Math.round(v.sectors);
    var perSector = Math.round(v.perSector);
    var n = sectors * perSector;

    /* ------------------------------------------------- covariance matrix -- */

    // Volatilities are drawn from a fixed seed and consumed in index order, so
    // name i always has the same vol however many names are on screen.
    var rand = P.rng(20260902);
    var vol = [];
    for (var i = 0; i < n; i += 1) vol.push(0.12 + 0.22 * Math.pow(rand.uniform(), 1.5));

    // Total pairwise correlation within a sector is market + sector. Cap it
    // below 1 so the matrix stays comfortably positive definite.
    var rhoM = v.rhoMarket;
    var rhoIn = Math.min(0.97, rhoM + v.rhoSector);
    var sectorOf = function (k) { return Math.floor(k / perSector); };

    var cov = [];
    for (i = 0; i < n; i += 1) {
      cov.push(new Array(n));
      for (var j = 0; j < n; j += 1) {
        var c = i === j ? 1 : (sectorOf(i) === sectorOf(j) ? rhoIn : rhoM);
        cov[i][j] = c * vol[i] * vol[j];
      }
    }

    /* ------------------------------------------------- eigendecomposition -- */

    var eig = jacobi(cov, n);
    var lam = eig.values;      // descending
    var Q = eig.vectors;       // Q[row][component]

    var traceSum = 0, sumSq = 0;
    for (i = 0; i < n; i += 1) { traceSum += lam[i]; sumSq += lam[i] * lam[i]; }
    var nEff = (traceSum * traceSum) / (sumSq || 1);
    var shares = lam.map(function (x) { return x / (traceSum || 1); });

    /* ------------------------------------------------------------ weights -- */

    var w = weights(v.portfolio, n, perSector, vol, lam, Q);

    // Loadings on the principal portfolios, then the variance each one carries.
    var contrib = [], sigma2 = 0;
    for (var a = 0; a < n; a += 1) {
      var load = 0;
      for (var k = 0; k < n; k += 1) load += Q[k][a] * w[k];
      var cA = load * load * lam[a];
      contrib.push(cA);
      sigma2 += cA;
    }

    var p = contrib.map(function (x) { return x / (sigma2 || 1); });
    var entropy = 0;
    p.forEach(function (x) { if (x > 1e-12) entropy -= x * Math.log(x); });
    var enb = Math.exp(entropy);

    var gross = w.reduce(function (s, x) { return s + Math.abs(x); }, 0);
    var sigmaP = Math.sqrt(Math.max(0, sigma2));

    /* ------------------------------------------------------------- render -- */

    var idx = [], yMax = 0;
    for (i = 0; i < n; i += 1) {
      idx.push(i + 1);
      yMax = Math.max(yMax, shares[i], p[i]);
    }

    var plot = ctx.plot({ height: 250, yMin: 0, yMax: yMax * 1.12, xMin: 0.5, xMax: n + 0.5,
      padding: { left: 46, right: 14, top: 12, bottom: 28 } });
    plot.domain(idx, [0, yMax]).clear().grid({ yFormat: 'pct' });
    plot.bars(idx, shares, { color: P.palette[0], alpha: 0.45, fill: 0.9 });
    plot.bars(idx, p, { color: P.palette[3], alpha: 0.95, fill: 0.42 });
    plot.legend([
      { label: 'share of market risk (λᵢ / Σλ)', color: P.palette[0] },
      { label: 'share of THIS portfolio’s risk', color: P.palette[3] },
    ]);

    ctx.stats([
      { label: 'Positions', value: n },
      { label: 'N_eff (market)', value: nEff.toFixed(1) },
      { label: 'ENB (portfolio)', value: enb.toFixed(2) },
      { label: 'Top eigenvalue', value: (shares[0] * 100).toFixed(0) + '% of risk' },
      { label: 'Vol per unit gross', value: (sigmaP / (gross || 1) * 100).toFixed(1) + '%' },
    ]);

    ctx.note(noteFor(v.portfolio, n, nEff, enb, shares[0], rhoM));

    /* ----------------------------------------------------------- helpers -- */

    function weights(kind, size, per, vols, values, vecs) {
      var out = new Array(size).fill(0), t;

      if (kind === 'invvol') {
        t = 0;
        for (t = 0; t < size; t += 1) out[t] = 1 / vols[t];
        return normaliseSum(out);
      }

      if (kind === 'minvar') {
        // w proportional to inverse(Sigma) * 1, assembled from the spectrum:
        // inverse(Sigma) = Q diag(1/lambda) Q'. Cheap, and it reuses the
        // decomposition we already have.
        var ones = new Array(size).fill(1);
        for (var comp = 0; comp < size; comp += 1) {
          if (values[comp] < 1e-10) continue;
          var dot = 0;
          for (t = 0; t < size; t += 1) dot += vecs[t][comp] * ones[t];
          var scale = dot / values[comp];
          for (t = 0; t < size; t += 1) out[t] += vecs[t][comp] * scale;
        }
        return normaliseSum(out);
      }

      if (kind === 'neutral') {
        // Long the first half of every sector, short the second half. The
        // result is orthogonal to the all-ones vector, so it carries no
        // loading on the market eigenportfolio at all.
        var half = Math.floor(per / 2);
        for (var s = 0; s < size / per; s += 1) {
          for (var m = 0; m < per; m += 1) {
            var at = s * per + m;
            if (m < half) out[at] = 1;
            else if (m >= per - half) out[at] = -1;
          }
        }
        return normaliseGross(out);
      }

      if (kind === 'concentrated') {
        var take = Math.min(5, size);
        for (t = 0; t < take; t += 1) out[t] = 1 / take;
        return out;
      }

      for (t = 0; t < size; t += 1) out[t] = 1 / size;   // equal weight
      return out;
    }

    function normaliseSum(x) {
      var s = x.reduce(function (acc, y) { return acc + y; }, 0) || 1;
      return x.map(function (y) { return y / s; });
    }

    function normaliseGross(x) {
      var s = x.reduce(function (acc, y) { return acc + Math.abs(y); }, 0) || 1;
      return x.map(function (y) { return y / s; });
    }

    function noteFor(kind, size, ne, bets, topShare, rho) {
      var shown = bets.toFixed(1);
      var head = '<strong>' + size + ' positions, ' + shown + ' effective bet' +
        (shown === '1.0' ? '' : 's') + '.</strong> ';

      if (kind === 'neutral') {
        return head + 'The weights are orthogonal to the all-ones vector, so the market ' +
          'eigenportfolio — which carries ' + (topShare * 100).toFixed(0) + '% of the ' +
          'market’s risk — contributes nothing here. The blue bar at component 1 is tall ' +
          'and the red bar next to it is absent: that gap <em>is</em> hedging, drawn to scale. ' +
          'Raising market correlation now barely moves ENB, because the risk it concentrates is ' +
          'risk this portfolio does not hold.';
      }
      if (kind === 'minvar') {
        return head + 'Minimum variance loads on the <em>smallest</em> eigenvalues by ' +
          'construction — \\(\\Sigma^{-1}\\) weights direction \\(i\\) by \\(1/\\lambda_i\\). ' +
          'That is why it scores well here and still fails in practice: those directions are the ' +
          'worst-estimated ones in the matrix, so the portfolio is fitted to sampling noise.';
      }
      if (kind === 'concentrated') {
        return head + 'Five names, and ENB is not five. Some of the risk is the shared market ' +
          'factor and some is the shared sector factor; only what is left is genuinely ' +
          'independent. Holding fewer names does not even cost you as much diversification as ' +
          'the count suggests — because the count was never the diversification.';
      }
      if (rho > 0.55) {
        return head + 'At a market correlation of ' + rho.toFixed(2) + ' the top eigenvalue ' +
          'absorbs ' + (topShare * 100).toFixed(0) + '% of all risk, and the whole market offers ' +
          'only ' + ne.toFixed(1) + ' independent directions. This is the stress regime: nothing ' +
          'about the holdings changed, only what they mean.';
      }
      return head + 'The market offers \\(N_{\\text{eff}} = ' + ne.toFixed(1) + '\\) independent ' +
        'directions; this portfolio uses ' + bets.toFixed(1) + ' of them. The gap between the two ' +
        'numbers is diversification that is available and not being taken. Now drag market ' +
        'correlation towards 0.7 and watch both numbers fall together.';
    }
  },
});

/* Cyclic Jacobi eigensolver for a real symmetric matrix. Returns eigenvalues in
   descending order and the matching orthonormal eigenvectors as columns.
   Declared after the registration because function declarations hoist. */
function jacobi(A, n) {
  var a = [], vec = [], i, j, k, sweep, p, q;
  for (i = 0; i < n; i += 1) {
    a.push(A[i].slice());
    vec.push(new Array(n).fill(0));
    vec[i][i] = 1;
  }

  for (sweep = 0; sweep < 30; sweep += 1) {
    var off = 0;
    for (i = 0; i < n - 1; i += 1) for (j = i + 1; j < n; j += 1) off += a[i][j] * a[i][j];
    if (off < 1e-16) break;

    for (p = 0; p < n - 1; p += 1) {
      for (q = p + 1; q < n; q += 1) {
        if (Math.abs(a[p][q]) < 1e-18) continue;
        var theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        var t = 1 / (Math.abs(theta) + Math.sqrt(1 + theta * theta));
        if (theta < 0) t = -t;
        var c = 1 / Math.sqrt(1 + t * t);
        var s = t * c;

        for (k = 0; k < n; k += 1) {            // columns: A <- A J
          var akp = a[k][p], akq = a[k][q];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
        }
        for (k = 0; k < n; k += 1) {            // rows: A <- J' A
          var apk = a[p][k], aqk = a[q][k];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
        }
        for (k = 0; k < n; k += 1) {            // accumulate V <- V J
          var vkp = vec[k][p], vkq = vec[k][q];
          vec[k][p] = c * vkp - s * vkq;
          vec[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }

  var order = [];
  for (i = 0; i < n; i += 1) order.push(i);
  order.sort(function (x, y) { return a[y][y] - a[x][x]; });

  var values = order.map(function (o) { return Math.max(0, a[o][o]); });
  var vectors = [];
  for (i = 0; i < n; i += 1) {
    vectors.push(order.map(function (o) { return vec[i][o]; }));
  }
  return { values: values, vectors: vectors };
}
})();
