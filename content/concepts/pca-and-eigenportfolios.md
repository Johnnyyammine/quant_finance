---
id: pca-and-eigenportfolios
title: PCA & Eigenportfolios
subject: linear-algebra
summary: The spectral decomposition $\Sigma = Q\Lambda Q^\top$ rewrites a correlated universe as a set of uncorrelated principal portfolios — the eigenvectors are the independent directions of risk and the eigenvalues are how much risk lives in each.
difficulty: intermediate
interview_relevance: 5
status: not-started
tags: [linear-algebra, pca, eigenvalues, factor-models, risk, dimensionality-reduction, diversification]
prerequisites: [covariance-and-correlation]
related: [linear-regression, effective-number-of-bets]
aliases: [PCA, principal component analysis, eigendecomposition, spectral decomposition, eigenportfolio, principal portfolios, eigenvalue decomposition, factor rotation]
minutes: 16
updated: 2026-09-02
references:
  - title: "Laloux, Cizeau, Bouchaud & Potters, *Noise Dressing of Financial Correlation Matrices*, Phys. Rev. Lett. 83 (1999)"
    url: ""
  - title: "Litterman & Scheinkman, *Common Factors Affecting Bond Returns*, Journal of Fixed Income (1991)"
    url: ""
  - title: "Avellaneda & Lee, *Statistical Arbitrage in the US Equities Market*, Quantitative Finance (2010)"
    url: ""
questions:
  - q: Run PCA on daily changes in a government yield curve. What do the first three components look like, and how much variance do they explain?
    difficulty: intermediate
    tags: [fixed-income, classic, interpretation]
    hint: Think about the *shape* of each eigenvector across maturities.
    a: |
      The classic Litterman–Scheinkman result. Across essentially every developed curve and every
      sample period you get:

      | PC | Shape of the eigenvector | Name | Variance explained |
      |---|---|---|---|
      | 1 | roughly flat across maturities | **level** | ~85–90% |
      | 2 | monotone, sign change in the belly | **slope** | ~5–10% |
      | 3 | U-shaped: wings vs belly | **curvature** | ~1–3% |

      Together they routinely explain more than 99% of daily variance, which is why a rates book is
      hedged with three instruments rather than one per tenor, and why "PC01" risk limits exist
      alongside DV01.

      **The follow-up you should expect:** *why* is the level component so dominant? Because
      adjacent tenors are correlated around 0.95–0.99 — the curve is nearly a one-dimensional object.
      And the trap: these are statistical artefacts of the covariance matrix, not economic
      quantities. The "slope" PC rotates between samples, so a hedge built on last year's
      eigenvectors is not exactly slope-neutral today.
  - q: Why do we use `np.linalg.eigh` rather than `np.linalg.eig` on a covariance matrix?
    difficulty: foundational
    tags: [numerics, spectral-theorem, implementation]
    a: |
      Because $\Sigma$ is **real symmetric**, and the spectral theorem then guarantees that its
      eigenvalues are real and that an orthonormal eigenbasis exists. `eigh` exploits that: it uses
      a symmetric algorithm (tridiagonalisation + QL/divide-and-conquer), returns *sorted real*
      eigenvalues, and guarantees an orthogonal $Q$ to machine precision.

      `eig` is the general non-symmetric routine. Fed a symmetric matrix it will still work, but it
      returns complex dtypes with tiny imaginary residues, gives unsorted eigenvalues, and does not
      guarantee orthogonality of the returned vectors. You then spend the next hour debugging why
      $Q^\top Q \ne I$ and why your "uncorrelated" principal portfolios have a correlation of 0.02.

      It is also roughly twice as fast. There is no argument for `eig` here.
  - q: PCA on the covariance matrix or on the correlation matrix?
    difficulty: intermediate
    tags: [scaling, interpretation]
    hint: What happens if one asset is quoted in a unit that makes its variance 10,000× larger?
    a: |
      **PCA is not scale-invariant.** The eigenvectors of $\Sigma$ and of the correlation matrix
      $P$ are *not* related by any simple transformation.

      - **Covariance PCA** lets high-variance assets dominate. PC1 will point at whatever is most
        volatile. This is correct when the units are genuinely comparable and you care about
        currency-denominated risk — a risk model feeding a VaR number, for instance.
      - **Correlation PCA** standardises every asset to unit variance first, so components reflect
        *co-movement structure* rather than volatility levels. This is what you want for
        cross-sectional equity work, where a biotech at 60% vol and a utility at 12% vol should not
        have their relative importance decided by the vol.

      Rule of thumb: mixed units or wildly different volatilities → correlation. Homogeneous units
      and you care about total risk in dollars → covariance. Say which one you used; a candidate who
      does not distinguish them has not run PCA on real data.
  - q: Your top eigenvalue explains 40% of the variance of a 100-asset correlation matrix estimated from 2 years of daily data. Is that a real factor?
    difficulty: advanced
    tags: [marchenko-pastur, random-matrix-theory, noise]
    hint: What would the spectrum look like if the assets were genuinely independent?
    a: |
      Yes — and the way to know is to compute what pure noise would have produced.

      For $N$ independent unit-variance series and $T$ observations with $q = N/T$, the sample
      correlation eigenvalues fill the **Marchenko–Pastur** band

      $$\lambda \in \big[(1-\sqrt{q})^2,\ (1+\sqrt{q})^2\big]$$

      Here $N = 100$, $T \approx 504$, so $q \approx 0.198$, $\sqrt q \approx 0.445$, and the noise
      band is $[0.308,\ 2.09]$. An eigenvalue explaining 40% of a 100-asset correlation matrix is
      $\lambda_1 = 40$ — twenty times the upper edge. That is unambiguously a real common factor,
      almost certainly the market.

      The useful direction is the other one: **most of the spectrum is inside the band and is
      therefore noise.** Laloux et al. (1999) found that only a handful of S&P eigenvalues escape
      the bulk; the rest are indistinguishable from random. So keep the escaping eigenvalues,
      replace the bulk with its average (eigenvalue clipping), and you have a covariance matrix
      that is well conditioned and safe to invert.
  - q: You rebuild your statistical risk model each month. PC4 and PC5 keep swapping. Why, and does it matter?
    difficulty: advanced
    tags: [stability, perturbation, risk-model]
    a: |
      Eigenvector stability is governed by **eigenvalue spacing**. First-order perturbation theory
      gives, for a perturbation $\delta\Sigma$,

      $$\delta q_i \approx \sum_{j \ne i} \frac{q_j^\top \delta\Sigma\, q_i}{\lambda_i - \lambda_j}\, q_j$$

      The denominator is the whole story: when $\lambda_i \approx \lambda_j$ the coefficient blows
      up and the two eigenvectors rotate freely inside their shared subspace. Sampling noise alone
      is enough to reorder them. In the exactly degenerate case the individual eigenvectors are not
      even defined — only the subspace is.

      **Does it matter?** It depends what you use them for.

      - Risk *measurement* is fine. $\Sigma$, the total variance and the variance carried by the
        top-$k$ subspace are all invariant to rotation inside a degenerate block.
      - Risk *attribution* is not. "PC4 contributed 8% of today's PnL" is meaningless if PC4 is an
        arbitrary rotation of PC5. Any report that names individual bulk components is reporting noise.
      - Hedging on individual bulk PCs is worse still — you rebalance every month chasing a
        direction that never existed.

      **What to do:** only interpret components whose eigenvalues are well separated *and* outside
      the Marchenko–Pastur bulk; report the top-$k$ subspace jointly rather than component by
      component; or abandon the eigenbasis for a rotation chosen to be stable and interpretable
      (minimum-torsion factors, or an economic factor model).
  - q: Show that the first principal component maximises portfolio variance subject to a unit-norm weight constraint.
    difficulty: intermediate
    tags: [optimisation, derivation, lagrangian]
    a: |
      Maximise $w^\top \Sigma w$ subject to $w^\top w = 1$. The Lagrangian is

      $$\mathcal{L}(w, \lambda) = w^\top \Sigma w - \lambda(w^\top w - 1)$$

      Setting $\nabla_w \mathcal{L} = 2\Sigma w - 2\lambda w = 0$ gives the eigenvalue equation

      $$\Sigma w = \lambda w$$

      So every stationary point is an eigenvector. At such a point the objective is
      $w^\top \Sigma w = \lambda w^\top w = \lambda$, so the maximum is attained at the **largest**
      eigenvalue and the minimum at the smallest.

      Two consequences worth stating out loud: the smallest eigenvector is the
      **minimum-variance direction** among unit-norm portfolios, which is why it is the one an
      optimiser loads on and the one estimation noise ruins; and repeating the argument on the
      subspace orthogonal to $q_1$ produces $q_2$, which is the deflation view of PCA.
---

## Intuition

A covariance matrix is a *shape*. Plot a cloud of two-asset returns and you get an ellipse: wide
along the direction the two assets move together, narrow across it. PCA finds the axes of that
ellipse. In $N$ dimensions the cloud is an ellipsoid and the axes are the eigenvectors of $\Sigma$;
the squared lengths of the axes are the eigenvalues.

The financial reading is what makes this worth knowing. Each eigenvector is a set of portfolio
weights — an **eigenportfolio**, or *principal portfolio*. These synthetic portfolios have two
properties that no set of real assets has:

1. They are **mutually uncorrelated**, by construction.
2. Their variances are exactly the eigenvalues, and they are ordered.

So PCA takes a universe of $N$ correlated names and re-expresses it as $N$ independent risk
sources, sorted by importance. Almost always, the first one is "everything goes up and down
together" — the market — and it dwarfs the rest.

:::insight
The eigenvalues are a *budget*. Because $\operatorname{tr}(\Sigma) = \sum_i \sigma_i^2 = \sum_i
\lambda_i$, the total variance in the system is fixed no matter which basis you look at it in. PCA
does not create or destroy risk; it moves it into the fewest possible buckets. If $\lambda_1$ is
large, the other buckets *must* be small — the concentration is not an artefact of the method, it
is a property of the market.
:::

## Mathematical Formulation

$\Sigma$ is real symmetric and positive semi-definite, so the spectral theorem applies.

:::formula {name="Spectral decomposition" used-in="Risk Management, Factor Models, Portfolio Construction"}
\Sigma = Q \Lambda Q^\top = \sum_{i=1}^{N} \lambda_i\, q_i q_i^\top,
\qquad Q^\top Q = I, \qquad \lambda_1 \ge \lambda_2 \ge \cdots \ge \lambda_N \ge 0
:::

The columns $q_i$ of $Q$ are orthonormal eigenvectors; $\Lambda = \operatorname{diag}(\lambda_i)$.
Positive semi-definiteness gives $\lambda_i \ge 0$: no portfolio has negative variance.

The **principal portfolios** are the rotated returns $y = Q^\top r$. They satisfy

:::formula {name="Principal portfolios are uncorrelated" used-in="Risk Attribution, Statistical Arbitrage"}
\operatorname{Cov}(y) = Q^\top \Sigma Q = \Lambda
\quad\Longrightarrow\quad
\Var(y_i) = \lambda_i, \quad \Cov(y_i, y_j) = 0 \ \ (i \ne j)
:::

Any portfolio $w$ decomposes into loadings on those independent directions, $\tilde v = Q^\top w$,
and its variance becomes a plain sum with no cross terms:

:::formula {name="Portfolio variance in the eigenbasis" used-in="Risk Management, Diversification"}
\sigma_p^2 = w^\top \Sigma w = \tilde v^\top \Lambda \tilde v = \sum_{i=1}^{N} \tilde v_i^2 \lambda_i
:::

This is the identity everything else is built on: **risk is additive once you rotate into the
eigenbasis**, which is exactly what makes counting bets possible. See
[[effective-number-of-bets]].

:::formula {name="Variance explained" note="The share of total risk carried by the i-th principal portfolio." used-in="Risk Reporting, PCA"}
\text{share}_i = \frac{\lambda_i}{\sum_{j} \lambda_j} = \frac{\lambda_i}{\operatorname{tr}(\Sigma)}
:::

## Derivation

:::derivation The eigenvectors are the successive maximum-variance directions
Take the unit-norm portfolio with the most variance:

$$\max_{w} \ w^\top \Sigma w \quad \text{s.t.} \quad w^\top w = 1$$

The Lagrangian $\mathcal L = w^\top\Sigma w - \lambda(w^\top w - 1)$ has stationarity condition

$$2\Sigma w - 2\lambda w = 0 \iff \Sigma w = \lambda w$$

Every stationary point is an eigenvector, and at an eigenvector the objective equals $\lambda$.
So the maximiser is $q_1$ with value $\lambda_1$, and the minimiser is $q_N$ with value $\lambda_N$.

Now restrict to the subspace orthogonal to $q_1$ and repeat. Because $\Sigma$ maps that subspace to
itself (a consequence of symmetry), the same argument gives $q_2$ with value $\lambda_2$. Induction
produces the whole ordered basis. This is *deflation*, and it is why the components are both
orthogonal and ranked.
:::

:::derivation The spectrum of an equicorrelated universe, in closed form
The single most useful worked case. Take $N$ assets, unit variance, every pairwise correlation
equal to $\rho$:

$$\Sigma = (1-\rho)I + \rho\,\1\1^\top$$

Apply it to $\1$: since $\1\1^\top \1 = N\1$,

$$\Sigma \1 = \big[(1-\rho) + \rho N\big]\1 = \big[1 + (N-1)\rho\big]\1$$

so $q_1 = \1/\sqrt N$ — the **equally weighted portfolio** — with $\lambda_1 = 1 + (N-1)\rho$.

Now take any $v$ with $\1^\top v = 0$ (a long/short portfolio with zero net exposure). Then
$\1\1^\top v = 0$ and

$$\Sigma v = (1-\rho)v$$

so the entire $(N-1)$-dimensional space of dollar-neutral portfolios is one degenerate eigenspace
with $\lambda = 1-\rho$.

Two eigenvalues, and they say everything:

$$\lambda_1 = 1 + (N-1)\rho \quad (\text{multiplicity } 1), \qquad
\lambda = 1-\rho \quad (\text{multiplicity } N-1)$$

Check the trace: $1 + (N-1)\rho + (N-1)(1-\rho) = N$. ✓

The share of variance in the market direction is $\lambda_1/N = \big[1+(N-1)\rho\big]/N \to \rho$
as $N$ grows. Add as many names as you like: the fraction of your risk that is pure market
exposure converges to the average correlation and stops falling.
:::

## Assumptions & Edge Cases

:::assumption
- **PCA is a second-moment method.** It sees only $\Sigma$. Non-linear dependence, tail dependence
  and anything in the third or fourth moment are invisible to it.
- **Not scale-invariant.** Eigenvectors of $\Sigma$ and of the correlation matrix are different
  objects. Standardise or do not, but know which you did.
- **Sign is arbitrary.** $q_i$ and $-q_i$ are both eigenvectors. Fix a convention (largest loading
  positive) or your factor returns will flip between runs.
- **Rotation inside a degenerate block is arbitrary.** If $\lambda_i = \lambda_j$, only the
  subspace is identified, not the individual vectors.
- **Requires $T > N$ for a full-rank estimate.** With $T \le N$ the sample $\Sigma$ is singular and
  has $N - T + 1$ exactly zero eigenvalues — the "portfolios with no risk" an optimiser will
  cheerfully lever into.
- **Stationarity.** The eigenstructure is treated as fixed and is not. Correlations rise in
  stress, which raises $\lambda_1$ and rotates everything below it.
:::

:::warning
**A principal component is a statistical artefact, not an economic factor.** The eigenbasis is
whatever makes the *variance* diagonal in this sample. PC1 is usually recognisable as the market
and PC2 often looks sector-like, but nothing enforces that, the interpretation drifts between
samples, and components 4 and beyond are typically an arbitrary rotation of noise. Use PCA to
*measure* risk concentration; use an economically specified factor model when you need to *explain*
or *hedge* it by name.
:::

## Worked Example

Fifty equicorrelated names with $\rho = 0.3$ and unit variance. From the closed form above:

| | Value |
|---|---|
| $\lambda_1$ | $1 + 49(0.3) = 15.7$ |
| $\lambda_2 \ldots \lambda_{50}$ | $1 - 0.3 = 0.7$ each |
| Trace check | $15.7 + 49(0.7) = 50$ ✓ |
| Variance explained by PC1 | $15.7/50 = 31.4\%$ |
| Ratio $\lambda_1/\lambda_2$ | $22.4$ |

One direction carries 31% of the risk of a fifty-name book and is twenty-two times larger than any
other. Push $\rho$ to $0.6$ — an entirely ordinary correlation for a single-sector equity book in a
sell-off — and $\lambda_1 = 30.4$, i.e. **61% of the risk is one bet**, with $\lambda_1/\lambda_2 =
76$.

Nothing about the portfolio changed. Only the correlation did.

:::module diversification-lab
{ "sectors": 5, "perSector": 10, "rhoMarket": 0.3, "rhoSector": 0, "portfolio": "equal" }
:::

That is the case above, live: fifty names, every pair correlated at 0.3, no sector structure. Drag
*market correlation* and watch the spectrum go from flat to a single spike. Then turn *extra
within-sector correlation* up and a second tier of eigenvalues appears between the market and the
bulk — that is the level / sector / idiosyncratic hierarchy every commercial equity risk model has.

One honest caveat: the module gives each name a different volatility (12%–34%, which is realistic
for single stocks) rather than the unit variances the closed form assumes, so the numbers land
close to but not exactly on the table above. Set every volatility equal and you would recover
$\lambda_1 = 15.7$ precisely.

## Why It Matters in Quant Finance

- **Statistical risk models.** Keep the eigenvalues that escape the Marchenko–Pastur bulk, replace
  the rest with their average, and you have a well-conditioned $\Sigma$ that can be inverted safely.
  This is eigenvalue clipping, and it is standard practice.
- **Yield-curve risk.** Level, slope and curvature *are* the first three PCs of curve changes.
  Rates desks hedge and set limits in that basis rather than tenor by tenor.
- **Statistical arbitrage.** Avellaneda–Lee's construction regresses each stock on the top
  eigenportfolios and trades the mean-reverting residual. PCA defines what "market and sector
  neutral" means when you have no sector labels.
- **Risk attribution.** Because principal portfolios are uncorrelated, variance decomposes as a
  plain sum $\sum \tilde v_i^2 \lambda_i$ with no cross terms — the only decomposition in which
  the contributions actually add up.
- **Counting diversification.** The eigenvalue distribution is the raw input to every effective-
  dimension measure. See [[effective-number-of-bets]].
- **Crowding and systemic risk.** The **absorption ratio** — the share of total variance in the top
  handful of eigenvalues — spikes before market drawdowns (Kritzman, Page & Turkington, 2011).
  A market compressing into one dimension is a market about to move as one.

## Trading & Research Application

:::desk
**The top of the spectrum is signal; the bulk is noise; the bottom is a trap.** Marchenko–Pastur
tells you where the boundary is. The smallest eigenvalues are the most badly estimated *and* the
ones a mean–variance optimiser loads on hardest, because $\Sigma^{-1} = Q\Lambda^{-1}Q^\top$
weights direction $i$ by $1/\lambda_i$. Clip, shrink or constrain before inverting — never invert a
raw sample covariance matrix.

**Neutralising to $k$ components is not free.** Projecting out the top $k$ eigenportfolios removes
the exposure you meant to remove, but the projection is estimated. Regress residual PnL on the
eigenportfolio returns *out of sample* and check that the betas really are zero; they usually are
not, because the eigenvectors you hedged with were last quarter's.

**Watch $\lambda_1/\operatorname{tr}(\Sigma)$ as a live risk indicator.** It is one number, it
needs no portfolio, and it is the cleanest available measure of how one-dimensional the market has
become. A rising top-eigenvalue share means every diversification assumption in your book is
quietly degrading.

**Beware of PCA on returns of different frequencies or with stale prices.** Illiquid names have
artificially low measured correlation, so they land in the low-eigenvalue bulk and look like
diversifiers. They are not — they are just slow to mark.
:::

## Implementation Notes

```python
import numpy as np

def pca(cov: np.ndarray):
    """Eigenvalues descending, with a deterministic sign convention.

    `eigh` (not `eig`) because a covariance matrix is real symmetric: real
    eigenvalues, orthogonal eigenvectors, and about twice the speed."""
    vals, vecs = np.linalg.eigh((cov + cov.T) / 2)   # symmetrise first
    order = np.argsort(vals)[::-1]
    vals, vecs = vals[order], vecs[:, order]
    # q and -q are both eigenvectors; pin the sign or factor returns flip
    # between runs and every time series you store changes sign.
    flip = np.sign(vecs[np.abs(vecs).argmax(axis=0), np.arange(vecs.shape[1])])
    return vals, vecs * flip

def clip_eigenvalues(corr: np.ndarray, n_obs: int) -> np.ndarray:
    """Marchenko-Pastur denoising: keep the eigenvalues that escape the noise
    band, replace the bulk with its mean so the trace is preserved."""
    n = corr.shape[0]
    q = n / n_obs
    edge = (1 + np.sqrt(q)) ** 2                      # upper edge of the bulk
    vals, vecs = pca(corr)
    bulk = vals < edge
    if bulk.any():
        vals[bulk] = vals[bulk].mean()                # trace preserved
    return vecs @ np.diag(vals) @ vecs.T

def variance_explained(vals: np.ndarray) -> np.ndarray:
    return vals / vals.sum()
```

## Common Mistakes

:::pitfall
- **Using `eig` on a symmetric matrix.** Complex dtypes, unsorted output, no orthogonality
  guarantee. Use `eigh`.
- **Forgetting to standardise** — then wondering why PC1 is entirely the one asset quoted in
  basis points.
- **Naming components beyond the second or third.** Below the Marchenko–Pastur edge you are
  interpreting noise, and the labels will not survive the next refit.
- **Ignoring the sign convention,** so stored factor returns flip and every downstream signal
  changes sign with them.
- **Inverting the raw sample covariance matrix.** $\Sigma^{-1}$ scales by $1/\lambda_i$, so it is
  dominated by the worst-estimated directions. This is the mechanism behind "Markowitz error
  maximisation".
- **Assuming the eigenbasis is stable.** Eigenvector sensitivity goes as $1/(\lambda_i-\lambda_j)$;
  closely spaced eigenvalues rotate freely.
- **Confusing variance explained with information.** PC1 explains most of the variance and almost
  none of the cross-sectional alpha — which is precisely why stat arb *removes* it.
:::

## 30-Second Revision

- $\Sigma = Q\Lambda Q^\top$: eigenvectors are uncorrelated portfolios, eigenvalues are their
  variances, and $\sum\lambda_i = \operatorname{tr}(\Sigma)$ is a fixed risk budget.
- $q_1$ maximises $w^\top\Sigma w$ subject to $\|w\|=1$ — a one-line Lagrangian.
- In the eigenbasis, variance is a plain sum: $\sigma_p^2 = \sum_i \tilde v_i^2\lambda_i$ with
  $\tilde v = Q^\top w$.
- Equicorrelation: $\lambda_1 = 1+(N-1)\rho$ once, $1-\rho$ with multiplicity $N-1$. PC1's share
  tends to $\rho$, not to zero.
- Yield curve: level (~90%), slope, curvature. Know this cold.
- Marchenko–Pastur band $[(1-\sqrt q)^2, (1+\sqrt q)^2]$, $q = N/T$ — anything inside it is noise.
- `eigh`, not `eig`. Fix the sign. Never invert a raw sample $\Sigma$.
