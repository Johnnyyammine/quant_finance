---
id: variance
title: Variance
subject: statistics
summary: The expected squared deviation from the mean — the second moment that turns a return forecast into a position size, and the quantity that does not add when you combine assets.
difficulty: foundational
interview_relevance: 5
tags: [statistics, moments, risk, volatility, dispersion]
prerequisites: [expectation]
related: [covariance-and-correlation, sharpe-ratio]
aliases: [volatility, sigma, second moment, stdev, dispersion]
updated: 2026-01-14
questions:
  - q: Why divide by n−1 rather than n in the sample variance?
    difficulty: foundational
    tags: [estimation, bias]
    hint: The sample mean is itself estimated from the same data.
    a: |
      Because deviations are measured from the *sample* mean $\bar X$, which is chosen to minimise
      $\sum (X_i - c)^2$. The residuals are therefore systematically too small, and dividing by $n$
      would underestimate $\sigma^2$ by a factor $(n-1)/n$.

      Formally, the $n$ residuals satisfy one linear constraint $\sum (X_i - \bar X) = 0$, so only
      $n-1$ of them are free. Dividing by the degrees of freedom restores unbiasedness:
      $\E[s^2] = \sigma^2$.

      **Worth adding:** $s$ is still a biased estimate of $\sigma$ even though $s^2$ is unbiased for
      $\sigma^2$ — because $\sqrt{\cdot}$ is concave, Jensen's inequality gives $\E[s] < \sigma$.
      Unbiasedness does not survive non-linear transformation.
  - q: A portfolio holds n equally weighted assets, each with volatility σ, pairwise correlation ρ. What is the portfolio variance as n → ∞?
    difficulty: intermediate
    tags: [diversification, portfolio]
    hint: Separate the diagonal from the off-diagonal terms.
    a: |
      $$\Var(R_p) = \frac{\sigma^2}{n} + \frac{n-1}{n}\rho\sigma^2 \;\xrightarrow{n\to\infty}\; \rho\sigma^2$$

      Idiosyncratic risk diversifies away at rate $1/n$; **correlated risk does not diversify at all**.
      With $\rho = 0.3$ and $\sigma=25\%$, the floor is $\sigma_p = 25\%\sqrt{0.3} \approx 13.7\%$,
      no matter how many names you own.

      This is the quantitative content of "diversification is the only free lunch, and it is a small
      lunch". It also explains why crisis periods feel so violent: $\rho \to 1$ and the floor rises to
      the full single-asset volatility.
  - q: Var(X) = 4, Var(Y) = 9. What are the possible values of Var(X + Y)?
    difficulty: intermediate
    tags: [correlation-bounds]
    a: |
      $\Var(X+Y) = 4 + 9 + 2\rho \cdot 2 \cdot 3 = 13 + 12\rho$ with $\rho \in [-1,1]$, so the range is
      $[1, 25]$.

      The endpoints are the perfectly hedged case ($\rho=-1$, $\sigma_p = |3-2| = 1$) and the fully
      concentrated case ($\rho=1$, $\sigma_p = 3+2=5$). Note the answer is a *range*: variance of a
      sum is not determined by the marginals, which is precisely why correlation estimation is where
      portfolio risk models live or die.
  - q: Your strategy's daily returns have volatility 1%. What is annual volatility, and when is that calculation wrong?
    difficulty: intermediate
    tags: [annualisation, autocorrelation]
    a: |
      Naively $1\% \times \sqrt{252} \approx 15.9\%$.

      The $\sqrt{T}$ rule assumes **i.i.d. returns**. It fails when:

      - **Returns are autocorrelated.** With AR(1) coefficient $\rho_1$, the correct multiplier is
        approximately $\sqrt{T\,\frac{1+\rho_1}{1-\rho_1}}$. Trend strategies have $\rho_1 > 0$ so true
        annual vol is *higher*; mean-reversion strategies have $\rho_1 < 0$ so it is *lower*.
      - **Volatility clusters** (GARCH). The unconditional number understates risk in stressed regimes.
      - **Returns are illiquid or smoothed** (credit, private assets). Stale marks suppress measured
        daily vol and inflate the apparent Sharpe — the classic Sharpe-inflation trick.
  - q: You observe 20 daily returns with sample volatility 1.2%. How precise is that estimate?
    difficulty: advanced
    tags: [sampling-error, estimation]
    a: |
      For normal data the relative standard error of $\hat\sigma$ is approximately
      $1/\sqrt{2(n-1)}$. With $n=20$ that is $\approx 16\%$ — so 1.2% ± 0.19% at one standard error,
      and roughly $[0.81\%, 1.59\%]$ at two.

      **Volatility needs far less data than mean return, but far more than people assume.** For
      comparison, estimating a mean return to comparable relative precision takes decades. That
      asymmetry is why risk models are estimated from short windows and expected returns are not.
---

## Intuition

Variance is the average squared distance from the centre. Squaring — rather than taking absolute
values — is not arbitrary: it makes variance the unique dispersion measure that **adds** across
independent sources, which is the property that makes portfolio mathematics tractable at all.

Two consequences follow immediately from the squaring. First, variance is in squared units, so we
usually quote its root, the **standard deviation** (in finance, the *volatility*). Second, large
deviations are weighted quadratically — a single 10σ day contributes as much as a hundred 1σ days.
For fat-tailed financial returns that means the sample variance is dominated by a handful of
observations, and is therefore far noisier than its formula suggests.

:::insight
The one identity to have automatic: $\Var(X) = \E[X^2] - \E[X]^2$. It converts almost every variance
question into two expectations, and it makes the non-negativity of variance equivalent to
$\E[X^2] \ge \E[X]^2$ — which is Jensen's inequality for the convex function $x^2$.
:::

## Mathematical Formulation

:::formula {name="Variance" used-in="Risk, Statistics, Portfolio Theory" note="The computational form on the right is how you actually evaluate it."}
\Var(X) = \E\big[(X - \E[X])^2\big] = \E[X^2] - \E[X]^2
:::

The behaviour under affine transformation — note that a constant shift does nothing:

:::formula {name="Affine scaling" used-in="Leverage, Risk Scaling"}
\Var(aX + b) = a^2 \Var(X)
:::

And the identity that governs every portfolio:

:::formula {name="Variance of a sum" used-in="Portfolio Construction, Risk Management"}
\Var\!\left(\sum_i w_i X_i\right) = \sum_i \sum_j w_i w_j \Cov(X_i, X_j) = \mathbf{w}^\top \Sigma \,\mathbf{w}
:::

The unbiased sample estimator:

:::formula {name="Sample variance" used-in="Statistics, Estimation"}
s^2 = \frac{1}{n-1}\sum_{i=1}^{n} (X_i - \bar X)^2
:::

## Derivation

:::derivation The computational form
$$\Var(X) = \E[(X-\mu)^2] = \E[X^2 - 2\mu X + \mu^2]
= \E[X^2] - 2\mu\E[X] + \mu^2 = \E[X^2] - \mu^2$$

using linearity of [[expectation]] and $\E[X]=\mu$. Note this is numerically dangerous: when
$\E[X^2]$ and $\E[X]^2$ are close (small variance, large mean — exactly the case for price levels
rather than returns), you subtract two nearly equal large numbers and lose precision catastrophically.
Use Welford's online algorithm in production code.
:::

:::derivation Why the sample variance divides by n−1
$$\sum_i (X_i - \bar X)^2 = \sum_i (X_i - \mu)^2 - n(\bar X - \mu)^2$$

Taking expectations, and using $\Var(\bar X) = \sigma^2/n$:

$$\E\left[\sum_i (X_i-\bar X)^2\right] = n\sigma^2 - n\cdot\frac{\sigma^2}{n} = (n-1)\sigma^2$$

So dividing by $n-1$ gives $\E[s^2]=\sigma^2$. The subtracted term is exactly the variance of the
estimated mean — one degree of freedom consumed by estimating $\bar X$ from the same sample.
:::

:::derivation The diversification limit
For $n$ equally weighted assets with common variance $\sigma^2$ and common pairwise correlation
$\rho$, there are $n$ diagonal terms and $n(n-1)$ off-diagonal terms, each weighted $1/n^2$:

$$\Var(R_p) = \frac{1}{n^2}\left[n\sigma^2 + n(n-1)\rho\sigma^2\right]
= \frac{\sigma^2}{n} + \frac{n-1}{n}\rho\sigma^2 \;\longrightarrow\; \rho\sigma^2$$

The first term is diversifiable (idiosyncratic) risk; the second is the systematic floor.
:::

## Assumptions & Edge Cases

:::assumption
- **Variance may not exist.** Distributions with tail index $\alpha \le 2$ have infinite variance.
  Equity returns are usually estimated around $\alpha \approx 3$–$5$: finite, but close enough to
  the boundary that estimates converge slowly and are dominated by extremes.
- **Variance is symmetric.** It penalises upside and downside identically, which is not what an
  investor cares about. Semi-variance, downside deviation and expected shortfall exist for this
  reason.
- **$\sqrt{T}$ scaling requires i.i.d.** Autocorrelation, volatility clustering and stale pricing
  all break it, and all three are present in real data.
- **Unbiasedness does not transfer through $\sqrt{\cdot}$**: $s^2$ unbiased for $\sigma^2$ does not
  make $s$ unbiased for $\sigma$.
:::

## Worked Example

Daily returns over five days: $+1.2\%, -0.4\%, +0.8\%, -1.6\%, +0.5\%$.

Mean: $\bar r = (1.2 - 0.4 + 0.8 - 1.6 + 0.5)/5 = 0.5/5 = 0.10\%$.

Squared deviations (in %²):
$(1.1)^2 = 1.21$, $(-0.5)^2 = 0.25$, $(0.7)^2 = 0.49$, $(-1.7)^2 = 2.89$, $(0.4)^2 = 0.16$.
Sum $= 5.00$.

$$s^2 = \frac{5.00}{4} = 1.25 \;(\%^2), \qquad s = 1.118\%$$

Annualised: $1.118\% \times \sqrt{252} = 17.7\%$.

:::warning
That 17.7% carries a relative standard error of about $1/\sqrt{2\times4} = 35\%$ — the true annual
volatility is plausibly anywhere from 11% to 24%. **Five observations is not an estimate, it is an
anecdote.** Quoting it to three significant figures, as done above, is exactly the false precision
an interviewer is testing for.
:::

## Why It Matters in Quant Finance

Variance is the denominator of nearly every decision:

- **Position sizing.** Volatility targeting sets $w_i \propto 1/\sigma_i$ so each position
  contributes comparable risk. Doing this well accounts for more of a systematic fund's Sharpe than
  most people's alpha does.
- **Portfolio optimisation.** Markowitz minimises $\mathbf w^\top \Sigma \mathbf w$ subject to a
  return target. The whole apparatus is variance.
- **Option pricing.** Black–Scholes prices *variance*, not direction — $\sigma^2 T$ is the only
  place uncertainty enters, and implied volatility is the market's variance forecast.
- **Performance measurement.** The [[sharpe-ratio]] is a mean divided by a standard deviation, so
  every criticism of variance is a criticism of Sharpe.

:::module distribution-explorer
{"dist": "exponential", "n": 30, "reps": 4000}
:::

## Trading & Research Application

:::desk
**Risk does not add; it combines.** A PM who says "these two books are each 8% vol so together we
are at 16%" has made the defining error. If correlation is 0.3, the combined vol is
$\sqrt{0.08^2+0.08^2+2(0.3)(0.08)(0.08)} = 12.9\%$, not 16%. The gap between 12.9% and 16% is the
firm's entire diversification benefit, and it is what the risk system exists to measure.

**Volatility is more forecastable than return.** Vol is persistent (clustering, GARCH), so
yesterday's vol predicts today's. Return is close to unforecastable. This asymmetry is why risk
models are trusted with short estimation windows while expected-return models are shrunk hard
towards zero.

**Beware suppressed variance.** Illiquid or model-marked assets show artificially low measured
variance because prices are stale, not stable. A credit book showing 4% vol and a Sharpe of 3 is
usually reporting a smoothing artefact; unsmoothing the returns (Getmansky–Lo–Makarov) typically
halves the Sharpe.
:::

## Implementation Notes

```python
import numpy as np

def welford(xs):
    """Numerically stable one-pass variance. Prefer this to E[X²]−E[X]²,
    which catastrophically cancels when the mean dominates the spread."""
    n = 0
    mean = m2 = 0.0
    for x in xs:
        n += 1
        delta = x - mean
        mean += delta / n
        m2 += delta * (x - mean)
    return m2 / (n - 1) if n > 1 else float("nan")

def ewma_var(returns, halflife=32):
    """Exponentially weighted variance: what risk systems actually use,
    because it responds to regime changes instead of averaging over them."""
    lam = 0.5 ** (1.0 / halflife)
    weights = lam ** np.arange(len(returns))[::-1]
    weights /= weights.sum()
    return float(np.sum(weights * (returns - np.average(returns, weights=weights)) ** 2))
```

## Common Mistakes

:::pitfall
- **Adding volatilities.** Variances add (with covariance terms); standard deviations do not.
- **Annualising by $\sqrt{252}$ unconditionally**, ignoring autocorrelation and clustering.
- **Treating variance as risk.** It is a symmetric measure of dispersion. Investors care about
  drawdown and left-tail loss, which variance captures only under normality.
- **Trusting short-window estimates.** Relative standard error is $\approx 1/\sqrt{2(n-1)}$.
- **Using $\E[X^2]-\E[X]^2$ on price levels**, where floating-point cancellation destroys the answer.
- **Forgetting that a constant shift changes nothing**: $\Var(X + b) = \Var(X)$.
:::

## 30-Second Revision

- $\Var(X) = \E[X^2] - \E[X]^2$; $\Var(aX+b) = a^2\Var(X)$.
- $\Var(X+Y) = \Var(X)+\Var(Y)+2\Cov(X,Y)$ — the cross term is the whole of portfolio theory.
- Sample variance divides by $n-1$: one degree of freedom goes to estimating the mean.
- Equal-weight diversification floor: $\Var \to \rho\sigma^2$. Correlated risk never diversifies.
- Relative SE of $\hat\sigma \approx 1/\sqrt{2(n-1)}$ — 20 observations gives ±16%.
- $\sqrt{T}$ annualisation assumes i.i.d.; autocorrelation and smoothing break it in both directions.
