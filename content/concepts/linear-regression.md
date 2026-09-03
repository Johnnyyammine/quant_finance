---
id: linear-regression
title: Linear Regression
subject: statistics
summary: The projection of a target onto the span of its predictors — the estimator behind every beta, factor loading and hedge ratio in finance, and the one whose assumptions market data violates most reliably.
difficulty: intermediate
interview_relevance: 5
tags: [statistics, econometrics, ols, factor-models, estimation]
prerequisites: [covariance-and-correlation, variance]
related: [expectation, sharpe-ratio]
aliases: [OLS, least squares, beta, regression]
updated: 2026-01-14
references:
  - title: "Hayashi, *Econometrics*, ch. 1–2"
    url: ""
  - title: "Cochrane, *Asset Pricing*, ch. 12 (cross-sectional regressions)"
    url: ""
questions:
  - q: Derive the OLS estimator for simple regression and state what it equals in terms of covariance.
    difficulty: foundational
    tags: [derivation, core]
    a: |
      Minimise $S(\alpha,\beta) = \sum_i (y_i - \alpha - \beta x_i)^2$. First-order conditions:

      $$\frac{\partial S}{\partial \alpha} = -2\sum (y_i - \alpha - \beta x_i) = 0
      \implies \hat\alpha = \bar y - \hat\beta \bar x$$

      $$\frac{\partial S}{\partial \beta} = -2\sum x_i(y_i - \alpha - \beta x_i) = 0
      \implies \hat\beta = \frac{\sum (x_i-\bar x)(y_i - \bar y)}{\sum (x_i - \bar x)^2}
      = \frac{\widehat{\Cov}(x,y)}{\widehat{\Var}(x)}$$

      So **beta is a covariance divided by a variance**, and $\hat\beta = \rho\,\sigma_y/\sigma_x$.
      In matrix form $\hat{\boldsymbol\beta} = (X^\top X)^{-1}X^\top y$, which is the projection of
      $y$ onto the column space of $X$.
  - q: What breaks if the residuals are autocorrelated? Is OLS still usable?
    difficulty: intermediate
    tags: [inference, standard-errors, gauss-markov]
    a: |
      $\hat\beta$ remains **unbiased and consistent** — autocorrelation is a property of the error
      term, not a violation of $\E[\varepsilon\mid X]=0$. What breaks is **inference**: the usual
      standard error formula $\sigma^2(X^\top X)^{-1}$ assumes i.i.d. errors and understates the true
      variance when errors are positively autocorrelated. Your t-stats are inflated, sometimes by
      several times.

      Fix with Newey–West (HAC) standard errors, or model the dependence directly (GLS, ARMA errors).

      **The finance instance that matters:** overlapping return windows. Regressing 12-month forward
      returns on monthly-sampled predictors induces mechanical autocorrelation of order 11 in the
      residuals. A large fraction of published return-predictability results shrink to
      insignificance under Hodrick or Newey–West standard errors with proper lag selection.
  - q: You regress stock returns on 50 candidate factors with 10 years of monthly data. What is wrong?
    difficulty: advanced
    tags: [overfitting, multiple-testing, degrees-of-freedom]
    a: |
      $T=120$ observations, $k=50$ parameters. Several problems compound:

      1. **In-sample $R^2$ is mechanically inflated.** $\E[R^2] \approx k/T = 0.42$ even if every
         factor is pure noise. Always report adjusted $R^2$ — or better, out-of-sample $R^2$.
      2. **Multiple testing.** At the 5% level you expect 2–3 "significant" factors from noise alone.
         The relevant threshold after searching 50 candidates is around $t > 3.0$, not $2.0$
         (Harvey–Liu–Zhu argue for $t>3$ even for pre-specified factors in asset pricing).
      3. **Multicollinearity.** Fifty equity factors are heavily overlapping, so $X^\top X$ is
         ill-conditioned; individual coefficients become unstable and flip sign between subsamples
         even when the fitted values are stable.

      Remedies: regularisation (ridge/LASSO), dimension reduction (PCA on the factors), economic
      priors on which factors to include, and out-of-sample validation with an honest count of how
      many specifications were tried.
  - q: Your regression of returns on a signal gives beta = 0.03 with t-stat 2.1 and R² of 0.4%. Is this tradeable?
    difficulty: advanced
    tags: [alpha-research, economic-significance]
    a: |
      Possibly — low $R^2$ is normal and not disqualifying. Daily return predictability with
      $R^2 = 0.4\%$ can support a very good strategy, because the information ratio scales with
      $\sqrt{\text{breadth}}$: apply a weak signal across 2,000 names every day and the aggregate
      edge is substantial. Roughly, $\text{IR} \approx \text{IC}\sqrt{N}$ (the fundamental law of
      active management), and $\text{IC}\approx\sqrt{R^2} = 0.063$.

      The real questions are elsewhere:
      - **t = 2.1 is weak** for a searched result. How many signals were tested?
      - **Are the standard errors right?** Clustered by date, or the cross-sectional correlation of
        residuals will inflate t-stats several-fold.
      - **Does the edge survive costs?** A 3 bp per-name edge with 8 bp round-trip costs is a losing
        strategy however significant the coefficient.
      - **Is the exposure incidental?** Regress the strategy's returns on standard factors; a "new"
        signal that is 90% short-term reversal is not new.
  - q: What is the difference between a time-series and a cross-sectional regression in asset pricing?
    difficulty: advanced
    tags: [factor-models, fama-macbeth]
    a: |
      **Time-series:** for each asset $i$, regress its excess returns on factor realisations
      $r_{i,t} = \alpha_i + \boldsymbol\beta_i^\top f_t + \varepsilon_{i,t}$. This *estimates
      exposures* $\boldsymbol\beta_i$, and $\alpha_i$ is the pricing error — the thing an equity
      long/short manager is trying to capture.

      **Cross-sectional:** at each date $t$, regress the panel of returns on the (previously
      estimated) betas or characteristics: $r_{i,t} = \gamma_{0,t} + \boldsymbol\gamma_t^\top
      \boldsymbol\beta_i + u_{i,t}$. This *estimates factor risk premia* $\boldsymbol\gamma_t$.

      **Fama–MacBeth** runs the cross-sectional regression period by period and averages the
      $\hat\gamma_t$ over time, taking the standard error from the time series of estimates. That
      procedure handles cross-sectional correlation of residuals automatically — which is precisely
      the correlation that makes a pooled OLS t-stat wildly overstated.
---

## Intuition

Regression finds the line that makes the errors as small as possible in a squared sense. But the
useful way to see it is **geometric**: your target $y$ is a vector in $\R^n$, your predictors span a
subspace, and OLS drops a perpendicular from $y$ onto that subspace. The fitted values are the
shadow of $y$ on the space you can explain; the residuals are what is left over, orthogonal to
everything you used.

That orthogonality is not an assumption — it is a consequence of minimising squared error, and it
is why residuals are automatically uncorrelated with the regressors *in sample*, whether or not the
model is true.

The second interpretation matters just as much: under squared-error loss, the best possible
predictor of $Y$ given $X$ is the conditional expectation $\E[Y\mid X]$. Linear regression is the
best *linear* approximation to that conditional expectation. Everything regression can and cannot
do follows from that sentence.

:::insight
$\hat\beta = \Cov(X,Y)/\Var(X)$. A beta is not a correlation — it is a correlation scaled by the
ratio of volatilities, $\beta = \rho\,\sigma_Y/\sigma_X$. Hedge ratios use $\beta$; comparisons of
association use $\rho$. Substituting one for the other is a live source of mis-sized hedges.
:::

## Mathematical Formulation

The model, in matrix form with $X \in \R^{n\times k}$:

$$\mathbf{y} = X\boldsymbol{\beta} + \boldsymbol{\varepsilon}, \qquad \E[\boldsymbol\varepsilon \mid X] = 0$$

:::formula {name="OLS estimator" used-in="Factor Models, Hedging, Econometrics" note="A projection: ŷ = X(XᵀX)⁻¹Xᵀy = Hy, where H is the hat matrix."}
\hat{\boldsymbol\beta} = (X^\top X)^{-1} X^\top \mathbf{y}
:::

:::formula {name="Simple regression slope" used-in="Hedging, Beta Estimation"}
\hat\beta = \frac{\Cov(X,Y)}{\Var(X)} = \rho_{XY}\,\frac{\sigma_Y}{\sigma_X}
:::

Under homoskedastic, uncorrelated errors:

:::formula {name="Coefficient covariance" used-in="Inference, Significance Testing"}
\Var(\hat{\boldsymbol\beta}) = \sigma^2 (X^\top X)^{-1}
:::

:::formula {name="Coefficient of determination" used-in="Model Evaluation"}
R^2 = 1 - \frac{\text{SS}_{\text{res}}}{\text{SS}_{\text{tot}}}, \qquad
\bar R^2 = 1 - (1-R^2)\frac{n-1}{n-k-1}
:::

:::module regression-lab
{"n": 120, "beta": 0.8, "noise": 1.0, "seed": 3}
:::

## Derivation

:::derivation OLS as an orthogonal projection
Minimise $\|\mathbf y - X\boldsymbol\beta\|^2$. Setting the gradient to zero:

$$\nabla_{\boldsymbol\beta}\left[(\mathbf y - X\boldsymbol\beta)^\top(\mathbf y - X\boldsymbol\beta)\right]
= -2X^\top(\mathbf y - X\boldsymbol\beta) = 0$$

giving the **normal equations** $X^\top X\hat{\boldsymbol\beta} = X^\top\mathbf y$, and provided
$X$ has full column rank, $\hat{\boldsymbol\beta} = (X^\top X)^{-1}X^\top\mathbf y$.

The normal equations say $X^\top\hat{\boldsymbol\varepsilon} = 0$: the residual is orthogonal to
every regressor. The fitted values are $\hat{\mathbf y} = H\mathbf y$ with
$H = X(X^\top X)^{-1}X^\top$, and $H$ is idempotent ($H^2 = H$) and symmetric — the algebraic
signature of a projection. Rank-deficient $X$ (perfect multicollinearity) makes $X^\top X$
singular and the projection non-unique, which is precisely what happens when you include a full set
of dummy variables plus an intercept.
:::

:::derivation Gauss–Markov: why "best linear unbiased"
Under (i) linearity, (ii) $\E[\boldsymbol\varepsilon\mid X]=0$, (iii)
$\Var(\boldsymbol\varepsilon\mid X)=\sigma^2 I$, and (iv) full rank, OLS has the smallest variance
among all *linear unbiased* estimators.

Take any other linear unbiased estimator $\tilde\beta = C\mathbf y$ and write $C = (X^\top X)^{-1}X^\top + D$.
Unbiasedness forces $DX = 0$, and then

$$\Var(\tilde\beta) = \sigma^2\left[(X^\top X)^{-1} + DD^\top\right] \succeq \Var(\hat\beta)$$

since $DD^\top$ is PSD. Note what is *not* assumed: normality of errors. Normality is needed only
for exact finite-sample t and F distributions, not for unbiasedness, consistency or efficiency
within the linear class. Note also what *is* assumed — homoskedasticity — which financial data
violates comprehensively.
:::

## Assumptions & Edge Cases

:::assumption
The classical assumptions, ranked by how badly finance violates them:

1. **Exogeneity $\E[\varepsilon\mid X]=0$** — the only one whose failure biases $\hat\beta$ itself.
   Broken by omitted variables, simultaneity (prices affect flows affect prices), and measurement
   error in $X$ (which attenuates $\hat\beta$ towards zero).
2. **Homoskedasticity** — violated by volatility clustering in essentially all financial series.
   Fix: White/robust standard errors. Does not bias $\hat\beta$.
3. **No autocorrelation** — violated by overlapping windows and persistent predictors.
   Fix: Newey–West. Does not bias $\hat\beta$.
4. **Full rank / no perfect multicollinearity** — violated by redundant factors. Near-violation
   inflates coefficient variance without biasing it.
5. **Normal errors** — rarely true, rarely necessary (CLT rescues inference asymptotically),
   but matters in small samples and for prediction intervals.
:::

:::warning
**Only exogeneity failure biases the coefficient.** Heteroskedasticity and autocorrelation corrupt
your *confidence*, not your *estimate*. Candidates frequently claim OLS is "biased" under
heteroskedasticity; it is not, and saying so is a reliable tell.
:::

## Worked Example

Regressing a stock's monthly excess returns on the market's over 60 months gives:

$$\hat\beta = 1.35, \quad \text{SE} = 0.18, \quad \hat\alpha = 0.42\%\text{/month}, \quad
\text{SE}_\alpha = 0.31\%, \quad R^2 = 0.49$$

**Beta.** $t = 1.35/0.18 = 7.5$ — very precisely estimated. A 95% interval is roughly
$[0.99, 1.71]$; that width still matters if you are sizing a hedge, since hedging with 1.35 when
the truth is 1.0 leaves a 35% residual short position in the market.

**Alpha.** $t = 0.42/0.31 = 1.35$ — not significant. Annualised alpha of 5.0% sounds impressive and
is statistically indistinguishable from zero. This asymmetry is fundamental: with $R^2=0.49$ the
regression pins down the *exposure* well and the *intercept* badly, because alpha is a mean and
means need enormous samples ([[variance]]).

**How long to establish this alpha?** To reach $t=2$ you need
$T \ge (2 \times 0.31/0.42)^2 \times 60 \approx 131$ months — **eleven years**. And that is
assuming the alpha is stable over eleven years, which it will not be. This calculation, not the
backtest, is the honest answer to "is this manager skilled?"

## Why It Matters in Quant Finance

Regression is not one tool in finance; it is the tool:

| Use | Regression |
|---|---|
| CAPM beta / hedge ratio | $r_i$ on $r_m$ |
| Fama–French exposures | $r_i$ on $[\text{MKT}, \text{SMB}, \text{HML}, \ldots]$ |
| Factor risk premia | Fama–MacBeth cross-sectional regressions |
| Alpha signal validation | forward returns on signal, cross-sectionally |
| Risk-model residuals | idiosyncratic variance $= \Var(\hat\varepsilon)$ |
| Yield curve fitting | Nelson–Siegel by (non-linear) least squares |
| Transaction cost model | slippage on size, volatility, participation rate |
| Performance attribution | P&L on factor returns |

The $R^2$ tells you how much risk is common; $1-R^2$ is the idiosyncratic share and thus the
diversifiable part of the position.

## Trading & Research Application

:::desk
**Low $R^2$ is the normal case, not a failure.** A daily cross-sectional signal with $R^2 = 0.3\%$
is a perfectly respectable alpha. The fundamental law of active management,
$\text{IR} \approx \text{IC}\sqrt{\text{breadth}}$, says a weak signal applied widely beats a strong
signal applied narrowly. Rejecting a signal for low $R^2$ is a beginner's error; accepting it
without checking costs and crowding is the expert's version of the same error.

**Cluster your standard errors.** In a panel of stock-days, residuals are strongly correlated across
stocks on the same day (they share the market factor). Pooled OLS t-stats can be 3–5× too large.
Cluster by date, or use Fama–MacBeth, which does it structurally.

**Beta estimation is a shrinkage problem.** A 60-day realised beta of 1.8 has a standard error big
enough that the honest posterior is near 1.3. Blume/Vasicek shrinkage towards the cross-sectional
mean is standard practice for exactly this reason — see [[bayes-theorem]].

**Watch the sign flips.** If a coefficient reverses sign between the first and second half of your
sample, you have either a regime change or multicollinearity. Both mean the coefficient should not
be traded at full size.
:::

## Implementation Notes

```python
import numpy as np

def ols(X: np.ndarray, y: np.ndarray):
    """Solve via QR/lstsq, never by explicitly inverting XᵀX -- inversion
    squares the condition number and loses half your significant digits
    on the collinear design matrices typical of factor models."""
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    resid = y - X @ beta
    dof = len(y) - X.shape[1]
    s2 = resid @ resid / dof
    xtx_inv = np.linalg.pinv(X.T @ X)
    se = np.sqrt(np.diag(s2 * xtx_inv))
    return beta, se, resid

def newey_west_se(X: np.ndarray, resid: np.ndarray, lags: int):
    """HAC standard errors. Mandatory for overlapping-window regressions,
    where residual autocorrelation is induced by construction."""
    n, k = X.shape
    xtx_inv = np.linalg.pinv(X.T @ X)
    S = (X * resid[:, None]).T @ (X * resid[:, None])
    for L in range(1, lags + 1):
        w = 1.0 - L / (lags + 1.0)                     # Bartlett kernel
        G = (X[L:] * resid[L:, None]).T @ (X[:-L] * resid[:-L, None])
        S += w * (G + G.T)
    return np.sqrt(np.diag(xtx_inv @ S @ xtx_inv))
```

## Common Mistakes

:::pitfall
- **Claiming heteroskedasticity biases $\hat\beta$.** It does not; it biases the standard errors.
- **Reporting in-sample $R^2$ with many regressors.** $\E[R^2]\approx k/T$ under the null. Use
  adjusted or out-of-sample $R^2$.
- **Ignoring overlapping windows.** Twelve-month forward returns sampled monthly have 11 lags of
  induced autocorrelation; naive t-stats are roughly $\sqrt{12}\times$ too big.
- **Confusing $\beta$ with $\rho$.** $\beta = \rho\sigma_Y/\sigma_X$.
- **Inverting $X^\top X$ explicitly** on collinear factor data.
- **Interpreting coefficients causally.** Regression estimates conditional expectations, not causal
  effects, unless the design earns that interpretation.
- **Forgetting the search.** A $t$ of 2.1 found after 50 specifications is not evidence of anything.
:::

## 30-Second Revision

- $\hat\beta = (X^\top X)^{-1}X^\top y$ — an orthogonal projection of $y$ onto the span of $X$.
- Simple case: $\hat\beta = \Cov(X,Y)/\Var(X) = \rho\,\sigma_Y/\sigma_X$.
- Gauss–Markov: OLS is BLUE under exogeneity, homoskedasticity, no autocorrelation, full rank.
  Normality is **not** required.
- Only **exogeneity failure biases $\hat\beta$**; heteroskedasticity and autocorrelation break
  inference only — fix with White / Newey–West.
- $\E[R^2]\approx k/T$ under the null; low $R^2$ is fine for a wide cross-sectional signal.
- Betas are estimated precisely, alphas are not. Establishing 5%/yr alpha at $t=2$ can take a decade.
