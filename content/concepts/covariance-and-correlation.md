---
id: covariance-and-correlation
title: Covariance & Correlation
subject: statistics
summary: Covariance measures how two variables move together in raw units; correlation normalises it to [-1, 1] — together they determine whether combining two positions reduces risk or concentrates it.
difficulty: foundational
interview_relevance: 5
tags: [statistics, dependence, risk, diversification, linear-algebra]
prerequisites: [variance, expectation]
related: [linear-regression, sharpe-ratio]
aliases: [rho, correlation matrix, covariance matrix, dependence]
minutes: 14
updated: 2026-01-14
questions:
  - q: Correlation is zero. Are the variables independent?
    difficulty: foundational
    tags: [independence, non-linearity]
    hint: Construct a counterexample with a symmetric relationship.
    a: |
      No. Correlation measures **linear** dependence only. Take $X \sim N(0,1)$ and $Y = X^2$:

      $$\Cov(X, X^2) = \E[X^3] - \E[X]\E[X^2] = 0 - 0 = 0$$

      yet $Y$ is a deterministic function of $X$. Independence implies zero correlation; the
      converse fails.

      **The finance version:** a long straddle has near-zero correlation to the underlying but is
      completely dependent on it. Any risk system that measures exposure by correlation alone will
      report an options book as market-neutral while it is anything but. The exception:
      for *jointly normal* variables, zero correlation does imply independence — which is exactly
      why the normality assumption is so seductive and so dangerous.
  - q: Can three assets have pairwise correlation −0.9?
    difficulty: advanced
    tags: [positive-semidefinite, correlation-matrix]
    hint: The correlation matrix must be positive semi-definite.
    a: |
      No. For an equicorrelated $n \times n$ matrix the eigenvalues are $1+(n-1)\rho$ (once) and
      $1-\rho$ ($n-1$ times). Positive semi-definiteness requires $1 + (n-1)\rho \ge 0$, i.e.

      $$\rho \ge -\frac{1}{n-1}$$

      For $n=3$ the floor is $-0.5$, so $-0.9$ is impossible. Intuitively: if A hedges B and B
      hedges C, then A and C must move *together*. You cannot have everything hedging everything.

      This matters practically — correlation matrices estimated pairwise from unequal samples are
      frequently non-PSD, which makes an optimiser return nonsense or fail outright. Nearest-PSD
      projection or shrinkage is a routine production step, not an edge case.
  - q: A portfolio is 60% stocks (σ=18%), 40% bonds (σ=6%), correlation −0.2. What is the portfolio volatility?
    difficulty: foundational
    tags: [portfolio, arithmetic]
    a: |
      $$\sigma_p^2 = (0.6)^2(0.18)^2 + (0.4)^2(0.06)^2 + 2(0.6)(0.4)(-0.2)(0.18)(0.06)$$
      $$= 0.011664 + 0.000576 - 0.001037 = 0.011203$$
      $$\sigma_p = 10.58\%$$

      The weighted average of the volatilities would be $0.6(18)+0.4(6) = 12.0\%$. Diversification
      saved 142 bp of volatility — and the negative correlation contributed only about 50 bp of
      that. Most of the benefit comes simply from the bond's low standalone volatility, a point
      that is often missed.
  - q: You estimate a 500×500 covariance matrix from 2 years of daily data. What goes wrong?
    difficulty: advanced
    tags: [estimation, curse-of-dimensionality, pca]
    a: |
      You have $T = 504$ observations and $N(N+1)/2 = 125{,}250$ parameters. The sample covariance
      matrix is **singular** whenever $T < N$ and severely ill-conditioned when $T \approx N$.
      Here $T \approx N$, so the smallest eigenvalues are essentially noise.

      Why it matters: mean–variance optimisation inverts $\Sigma$, so it loads maximally on the
      smallest eigenvalues — the ones that are pure estimation error. The optimiser reliably
      produces enormous offsetting positions in whatever pair happened to look most correlated by
      chance. This is why Markowitz "error maximises".

      **Fixes:** factor models (impose structure, $\Sigma = B\Omega B^\top + D$), Ledoit–Wolf
      shrinkage towards a structured target, random-matrix-theory eigenvalue clipping, or simply
      constraining the optimiser. In practice most funds use all four.
  - q: Correlations rise in a crisis. Why, and what does it do to your risk model?
    difficulty: advanced
    tags: [tail-dependence, regime, risk]
    a: |
      Mechanically, in a sell-off a single common factor (deleveraging, liquidity demand,
      risk-off flow) dominates the return variance, so the idiosyncratic share shrinks and measured
      correlation rises towards 1.

      Consequences: the diversification floor $\rho\sigma^2$ rises just as $\sigma$ itself is
      rising, so portfolio variance increases *superlinearly* exactly when you can least afford it.
      A Gaussian copula risk model — which has zero tail dependence by construction — will
      systematically understate joint tail losses. This is not a subtle modelling point; it is what
      made 2008 CDO models fail.

      Practical responses: stress correlations to 1 in scenario analysis, use tail-dependent copulas
      (t, Clayton), measure exceedance correlation, and never let a diversification benefit
      computed in calm markets set the leverage limit.
---

## Intuition

Covariance asks: when $X$ is above its mean, is $Y$ typically above or below its own? Multiply the
two deviations and average. Same-side pairs contribute positively, opposite-side pairs negatively.
If the two are unrelated, the products cancel and the average is zero.

The problem with covariance is that its units are the product of the two variables' units, which
makes the number uninterpretable on its own. Correlation fixes this by dividing by both standard
deviations, producing a unit-free number in $[-1,1]$ that answers "how much of the co-movement is
possible co-movement".

:::insight
Geometric picture: treat demeaned data as vectors in $\R^n$. Then covariance is an inner product,
standard deviation is a norm, and **correlation is the cosine of the angle between them**. Every
correlation fact follows: $|\rho|\le1$ is Cauchy–Schwarz; $\rho=\pm1$ means collinear; $\rho=0$
means orthogonal; and the triangle inequality is why three assets cannot all be strongly negatively
correlated.
:::

## Mathematical Formulation

:::formula {name="Covariance" used-in="Risk, Portfolio Construction, Factor Models"}
\Cov(X,Y) = \E\big[(X-\E X)(Y - \E Y)\big] = \E[XY] - \E[X]\E[Y]
:::

:::formula {name="Correlation" used-in="Risk, Statistics, Pairs Trading" note="Unit-free, bounded, and the cosine of the angle between demeaned data vectors."}
\rho_{XY} = \frac{\Cov(X,Y)}{\sigma_X \sigma_Y} \in [-1, 1]
:::

Bilinearity — the workhorse for portfolio algebra:

:::formula {name="Bilinearity" used-in="Portfolio Construction, Hedging"}
\Cov\!\left(\sum_i a_i X_i, \; \sum_j b_j Y_j\right) = \sum_i \sum_j a_i b_j \,\Cov(X_i, Y_j)
:::

For a portfolio with weights $\mathbf w$ and covariance matrix $\Sigma$:

:::formula {name="Portfolio variance in matrix form" used-in="Portfolio Construction, Risk Management"}
\sigma_p^2 = \mathbf{w}^\top \Sigma\, \mathbf{w}, \qquad
\Sigma = \operatorname{diag}(\boldsymbol\sigma)\, \mathbf{P} \operatorname{diag}(\boldsymbol\sigma)
:::

where $\mathbf P$ is the correlation matrix. $\Sigma$ must be **positive semi-definite** — this is
not a technicality but a no-arbitrage-like constraint: a negative $\mathbf w^\top\Sigma\mathbf w$
would be a portfolio with negative variance.

## Derivation

:::derivation Cauchy–Schwarz gives |ρ| ≤ 1
For any $t \in \R$, variance is non-negative:

$$0 \le \Var(X - tY) = \Var(X) - 2t\Cov(X,Y) + t^2\Var(Y)$$

This quadratic in $t$ is non-negative everywhere, so its discriminant is non-positive:

$$4\Cov(X,Y)^2 - 4\Var(X)\Var(Y) \le 0 \implies \Cov(X,Y)^2 \le \sigma_X^2\sigma_Y^2$$

Dividing gives $|\rho| \le 1$, with equality exactly when $X - tY$ has zero variance — i.e. when
the variables are affinely related. The minimising $t^\star = \Cov(X,Y)/\Var(Y)$ is precisely the
OLS regression slope, which is why $\rho$ and the beta of a [[linear-regression]] are the same
object up to scaling.
:::

:::derivation Why correlation cannot be arbitrary across three assets
$\mathbf P$ must be PSD, so all eigenvalues are $\ge 0$. For the equicorrelation matrix
$\mathbf P = (1-\rho)I + \rho \mathbf{1}\mathbf{1}^\top$, the eigenvector $\mathbf 1$ gives
eigenvalue $1+(n-1)\rho$ and the $(n-1)$-dimensional orthogonal complement gives $1-\rho$.
Non-negativity of the first requires

$$\rho \ge -\frac{1}{n-1}$$

For $n=2$: $\rho \ge -1$ (no constraint beyond the usual). For $n=3$: $\rho \ge -0.5$.
For large $n$: $\rho \ge 0$ approximately — **a large universe cannot be broadly negatively
correlated**, which is the structural reason equity long/short books carry residual market beta
unless it is explicitly hedged.
:::

## Assumptions & Edge Cases

:::assumption
- **Linearity.** $\rho$ sees only linear dependence. Non-monotone relationships (options payoffs,
  volatility exposure) are invisible to it.
- **Stationarity.** Correlation is estimated as if constant; it is not. Regime dependence is the
  rule, not the exception.
- **Finite second moments.** Undefined for infinite-variance distributions.
- **Outlier sensitivity.** Pearson correlation is driven by extremes; a single day can move a
  one-year estimate materially. Spearman (rank) and Kendall's tau are robust alternatives.
- **PSD requirement.** Pairwise estimation from unequal samples routinely violates it.
:::

:::warning
**Correlation is not causation, and it is not even dependence.** Two distinct failures:
$\rho = 0$ with total dependence ($Y=X^2$), and $\rho = 0.9$ with no causal link (both driven by a
third factor). In cross-sectional equity research the third factor is usually sector or size, and
"discovering" it as an alpha signal is the most common rookie result.
:::

## Worked Example

Two strategies, each with 10% annual volatility and expected return 6%. Consider combining them
50/50 at various correlations:

| $\rho$ | $\sigma_p$ | Sharpe (rf = 0) | Diversification benefit |
|---|---|---|---|
| $+1.0$ | 10.0% | 0.60 | none |
| $+0.5$ | 8.66% | 0.69 | 134 bp |
| $0.0$ | 7.07% | 0.85 | 293 bp |
| $-0.5$ | 5.00% | 1.20 | 500 bp |
| $-1.0$ | 0.0% | ∞ | perfect hedge |

$$\sigma_p = \sqrt{0.25(0.01) + 0.25(0.01) + 2(0.25)\rho(0.01)} = 0.10\sqrt{\tfrac{1+\rho}{2}}$$

Expected return is $6\%$ regardless of $\rho$ — combining does not change the mean. **All the value
of diversification is in the second moment.** Moving correlation from $+0.5$ to $0$ raises Sharpe by
23% for free, which is why an uncorrelated strategy with a mediocre standalone Sharpe is often worth
more to a multi-strategy fund than a better but correlated one.

## Why It Matters in Quant Finance

- **Portfolio construction.** $\Sigma$ *is* the risk model. Every optimiser, risk-parity scheme and
  hedge ratio is a statement about covariance.
- **Factor models.** $\Sigma = B\Omega B^\top + D$ decomposes covariance into common factor exposure
  and idiosyncratic risk, reducing $O(N^2)$ parameters to $O(NK)$. This structural reduction is the
  only reason large-universe risk models work.
- **PCA and statistical factors.** The eigenvectors of $\Sigma$ are the principal components; the
  first one is almost always "the market", and the eigenvalue spectrum tells you how many real
  factors there are versus noise (Marchenko–Pastur).
- **Pairs trading and relative value.** The entire premise is that a pair's correlation (or better,
  cointegration) is stable enough to trade the residual.
- **Hedging.** The minimum-variance hedge ratio is $h^\star = \Cov(S, F)/\Var(F)$ — a regression
  beta, not a correlation.

## Trading & Research Application

:::desk
**Correlation is a regime variable, and it moves against you.** The historical stock–bond
correlation was reliably negative from 2000–2020 and turned positive in 2022, which broke risk
parity's central assumption inside a single year. Any leverage decision that treats a historical
correlation as a constant is taking an unhedged position in that correlation.

**The estimation problem is the real problem.** For $N$ assets you estimate $N(N+1)/2$ parameters
from $T$ observations, and mean–variance optimisation inverts the result — loading hardest on the
smallest, noisiest eigenvalues. Shrinkage (Ledoit–Wolf), factor structure and eigenvalue clipping
are not refinements; without them the optimiser is unusable.

**Measure what you actually care about.** Downside correlation and exceedance correlation
(correlation conditional on both assets moving beyond a threshold) are usually much higher than
full-sample correlation. Report both, and size to the stressed one.
:::

## Implementation Notes

```python
import numpy as np

def shrink_covariance(returns: np.ndarray, intensity: float = 0.2) -> np.ndarray:
    """Ledoit-Wolf-style shrinkage towards a constant-correlation target.
    Trades a little bias for a large reduction in estimation variance --
    almost always a good trade when the matrix will be inverted."""
    S = np.cov(returns, rowvar=False)
    sd = np.sqrt(np.diag(S))
    corr = S / np.outer(sd, sd)
    n = corr.shape[0]
    rho_bar = (corr.sum() - n) / (n * (n - 1))       # average off-diagonal
    target_corr = np.full_like(corr, rho_bar)
    np.fill_diagonal(target_corr, 1.0)
    target = target_corr * np.outer(sd, sd)
    return (1 - intensity) * S + intensity * target

def nearest_psd(A: np.ndarray) -> np.ndarray:
    """Clip negative eigenvalues. Pairwise-estimated correlation matrices are
    routinely non-PSD; an optimiser fed one will return nonsense."""
    vals, vecs = np.linalg.eigh((A + A.T) / 2)
    return vecs @ np.diag(np.clip(vals, 1e-10, None)) @ vecs.T
```

## Common Mistakes

:::pitfall
- **Reading $\rho=0$ as independence.** It rules out linear dependence only. The exception is joint
  normality — an assumption, not a fact.
- **Using correlation where covariance is needed.** The hedge ratio is $\Cov(S,F)/\Var(F)$;
  using $\rho$ ignores the volatility ratio and gives the wrong size.
- **Assuming correlation is stable.** It is regime-dependent and rises in crises, precisely when
  the diversification it justified is most needed.
- **Estimating a big matrix from short data** and inverting it. Guaranteed to error-maximise.
- **Ignoring the PSD constraint** when building correlation matrices by hand or from unequal samples.
- **Confusing correlation with beta.** $\beta = \rho\,\sigma_Y/\sigma_X$; they coincide only when
  the volatilities are equal.
:::

## 30-Second Revision

- $\Cov(X,Y) = \E[XY]-\E X\E Y$; $\rho = \Cov/(\sigma_X\sigma_Y) \in [-1,1]$ — a cosine.
- $|\rho|\le1$ is Cauchy–Schwarz, proved from $\Var(X-tY)\ge0$.
- $\rho = 0 \nRightarrow$ independence (unless jointly normal). $Y=X^2$ is the counterexample.
- $\sigma_p^2 = \mathbf w^\top\Sigma\mathbf w$; $\Sigma$ must be PSD, which caps how negative
  equicorrelation can be at $-1/(n-1)$.
- Estimating $N(N+1)/2$ parameters from $T$ points fails for $T \approx N$; use factors or shrinkage.
- Correlations rise in crises — the diversification you priced in calm markets is not there in a sell-off.
