---
id: sharpe-ratio
title: Sharpe Ratio
subject: portfolio-construction
summary: Excess return per unit of volatility — the industry's default measure of risk-adjusted performance, and an estimator noisy and gameable enough that knowing its failure modes matters more than knowing its formula.
difficulty: intermediate
interview_relevance: 5
tags: [performance, risk, portfolio, estimation, backtesting, allocation]
prerequisites: [variance, expectation]
related: [covariance-and-correlation, linear-regression]
tracks: [quant-research, quant-trader, stat-arb, equity-long-short, systematic-macro]
aliases: [SR, risk-adjusted return, information ratio, Sharpe]
updated: 2026-01-14
references:
  - title: "Sharpe (1994), *The Sharpe Ratio*, Journal of Portfolio Management"
    url: ""
  - title: "Lo (2002), *The Statistics of Sharpe Ratios*, Financial Analysts Journal"
    url: ""
  - title: "Bailey & López de Prado (2014), *The Deflated Sharpe Ratio*"
    url: ""
questions:
  - q: A strategy reports Sharpe 2.0 over 1 year of daily data. How confident should you be that the true Sharpe is above 1?
    difficulty: advanced
    tags: [sampling-error, estimation, backtesting]
    hint: The standard error of an estimated Sharpe depends on the number of years, not the number of observations.
    a: |
      For i.i.d. normal returns, $\operatorname{SE}(\widehat{SR}) \approx \sqrt{(1 + SR^2/2)/T}$
      with $T$ in **years**. With $T = 1$ and $SR=2$:

      $$\operatorname{SE} \approx \sqrt{(1 + 2)/1} = \sqrt{3} = 1.73$$

      So the 95% confidence interval is roughly $[-1.4, 5.4]$. **You cannot even reject zero.**

      This is the most important practical fact about the Sharpe ratio, and it surprises people:
      sampling frequency does not help. Going from daily to 5-minute data multiplies the number of
      observations by 78 and leaves the precision of the Sharpe estimate essentially unchanged,
      because both the numerator and the denominator scale together. **Only calendar time helps.**

      To establish $SR = 1$ at $t = 2$: set $SR/\operatorname{SE} = 2$ with
      $\operatorname{SE} = \sqrt{(1+SR^2/2)/T}$, giving $T = 4(1 + \tfrac12) = 6$ years. (The
      cruder $t \approx SR\sqrt T$ rule says 4; the difference is the $SR^2/2$ term, and 6 is the
      honest number.)
  - q: How do you annualise a monthly Sharpe ratio, and when is that wrong?
    difficulty: intermediate
    tags: [annualisation, autocorrelation]
    a: |
      Naively $SR_{\text{annual}} = SR_{\text{monthly}} \times \sqrt{12}$, because mean scales with
      $T$ and volatility with $\sqrt T$.

      This assumes **i.i.d. returns**. With AR(1) autocorrelation $\rho_1$, Lo (2002) gives the
      correction factor

      $$\sqrt{\frac{T}{1 + 2\sum_{k=1}^{T-1}\frac{T-k}{T}\rho_k}}$$

      which for AR(1) is approximately $\sqrt{T}\cdot\sqrt{\frac{1-\rho_1}{1+\rho_1}}$.

      With $\rho_1 = 0.3$ (typical of a smoothed credit or private-asset book), the naive $\sqrt{12}$
      overstates the annual Sharpe by about 35%. Trend-following strategies with positive
      autocorrelation are similarly overstated; short-horizon mean reversion with $\rho_1 < 0$ is
      *understated*.
  - q: Name five ways to inflate a Sharpe ratio without adding any skill.
    difficulty: advanced
    tags: [gaming, due-diligence, red-flags]
    a: |
      1. **Sell tail risk.** Short deep OTM options or take illiquidity premia. Returns look smooth
         and positive until they do not; the variance measured pre-event is not the variance.
      2. **Smooth the marks.** Illiquid or model-priced assets have autocorrelated returns, which
         suppress measured volatility. Unsmoothing (Getmansky–Lo–Makarov) typically halves the Sharpe.
      3. **Choose the window.** Report from the trough of the last drawdown. Backtest start dates are
         not chosen at random.
      4. **Survivorship / selection.** Report only the funds or variants that survived. The
         cross-sectional maximum of noise is large.
      5. **Sample at a convenient frequency.** Monthly returns hide daily drawdowns entirely; the
         same P&L path can present very differently.

      A sixth, subtler one: **leverage a low-Sharpe strategy and compare to unlevered peers** — Sharpe
      is leverage-invariant, so this does not work directly, but changing the *risk-free* benchmark or
      excluding financing costs achieves it.
  - q: Two strategies: A has Sharpe 1.5, B has Sharpe 0.8. Which do you allocate to?
    difficulty: intermediate
    tags: [portfolio-construction, correlation]
    hint: The question is incomplete as asked. What is missing?
    a: |
      **Insufficient information — you need the correlation to the existing book.** Sharpe is a
      standalone statistic, and allocation is a marginal decision.

      For a two-asset combination the optimal weight ratio is

      $$\frac{w_A}{w_B} = \frac{\sigma_B}{\sigma_A}\cdot\frac{SR_A - \rho\,SR_B}{SR_B - \rho\,SR_A}$$

      — the second factor is the part that matters here; the $\sigma_B/\sigma_A$ in front simply
      converts the answer from risk weights to capital weights.

      If B is uncorrelated with the existing portfolio and A is 0.8 correlated with it, B may well
      deserve the larger allocation despite the worse standalone number. The right quantity is the
      **marginal** contribution to portfolio Sharpe, not the standalone Sharpe.

      This is why multi-strategy funds pay for uncorrelated mediocrity over correlated excellence,
      and it is the answer interviewers are listening for.
  - q: Why do hedge funds quote the information ratio rather than the Sharpe ratio?
    difficulty: intermediate
    tags: [benchmark, alpha]
    a: |
      The **information ratio** is active return over tracking error — excess return relative to a
      *benchmark* rather than the risk-free rate:

      $$IR = \frac{\E[r_p - r_b]}{\sigma(r_p - r_b)}$$

      It isolates skill from beta. A long-only manager with a Sharpe of 0.9 in a bull market has
      demonstrated nothing if the benchmark's Sharpe was 0.9; their IR is zero.

      Sharpe and IR coincide when the benchmark is cash. Grinold's **fundamental law of active
      management** connects IR to its drivers: $IR \approx IC\sqrt{\text{breadth}}$ — skill per bet
      times the square root of the number of independent bets. That decomposition is why a weak
      signal applied to 3,000 stocks can beat a strong signal applied to 10.
  - q: Your backtest of 500 strategy variants produced a best Sharpe of 2.5. What is the honest expected out-of-sample Sharpe?
    difficulty: research
    tags: [multiple-testing, deflated-sharpe, backtesting]
    a: |
      The maximum of $N$ draws from a zero-mean distribution with standard deviation $\sigma_{SR}$
      has expectation approximately

      $$\E[\max] \approx \sigma_{SR}\left[(1-\gamma)\Phi^{-1}\!\left(1 - \tfrac1N\right) +
      \gamma\,\Phi^{-1}\!\left(1 - \tfrac{1}{Ne}\right)\right]$$

      ($\gamma \approx 0.577$, Euler–Mascheroni). With $N=500$ the bracket is $3.05$, so with
      $\sigma_{SR}=0.7$ the expected best-of-500 is $0.7 \times 3.05 \approx 2.1$ — **a best-of-500
      Sharpe of 2.5 is barely distinguishable from pure noise.**

      Bailey and López de Prado's *deflated Sharpe ratio* formalises this: report the probability
      that the observed Sharpe exceeds what the search itself would have produced. In practice:
      pre-register the hypothesis, hold out data you genuinely do not look at, and disclose the
      number of trials. The number of trials is the most important number in any backtest and the
      one most often omitted.
---

## Intuition

The Sharpe ratio asks a simple question: **how much excess return did you earn per unit of risk
taken?** Two strategies returning 10% are not equivalent if one did it with 5% volatility and the
other with 30%.

The reason this particular ratio became the industry standard is leverage invariance. Lever a
strategy $2\times$ and both excess return and volatility double, leaving Sharpe unchanged. That
makes it a statement about the *quality* of a return stream independent of how much of it you
choose to hold — which is exactly the right separation when capital and leverage are decisions made
elsewhere.

:::insight
Sharpe is fundamentally a **t-statistic**. For a strategy with $T$ years of data,
$t \approx SR \times \sqrt{T}$. A Sharpe of 1.0 over 4 years gives $t=2$. Once you see this, every
statistical property follows: the noise in a Sharpe estimate, why sampling more frequently does not
help, and why the honest evaluation of a backtest is a multiple-testing problem.
:::

## Mathematical Formulation

:::formula {name="Sharpe ratio" used-in="Performance, Allocation, Risk" note="Excess return over the risk-free rate, per unit of volatility. Leverage-invariant."}
SR = \frac{\E[R_p] - r_f}{\sigma(R_p - r_f)}
:::

Annualisation under the i.i.d. assumption:

:::formula {name="Annualisation" used-in="Reporting, Comparison"}
SR_{\text{annual}} = SR_{\text{period}} \times \sqrt{k}
:::

with $k$ periods per year (252 daily, 52 weekly, 12 monthly).

The estimator's own noise — arguably the most useful formula on this page:

:::formula {name="Standard error of an estimated Sharpe (Lo, 2002)" used-in="Backtesting, Due Diligence" note="T is in YEARS. Sampling more finely does not help; only more calendar time does."}
\operatorname{SE}(\widehat{SR}) \approx \sqrt{\frac{1 + \tfrac12 SR^2}{T}}
:::

With non-normal returns, the third and fourth moments enter:

:::formula {name="Non-normal standard error" used-in="Due Diligence, Hedge Fund Analysis"}
\operatorname{SE}(\widehat{SR}) \approx \sqrt{\frac{1 - \gamma_3 SR + \frac{\gamma_4-1}{4}SR^2}{T}}
:::

where $\gamma_3$ is skewness and $\gamma_4$ kurtosis. **Negative skew inflates the standard error** —
precisely the shape produced by option selling and carry, so the strategies with the most flattering
Sharpe ratios are the ones whose Sharpe is least reliably estimated.

## Derivation

:::derivation Why Sharpe scales as √T
Assume i.i.d. period returns with mean $\mu$ and volatility $\sigma$. Over $k$ periods:

$$\E[R_{1:k}] = k\mu \quad\text{(means add)}, \qquad
\sigma(R_{1:k}) = \sigma\sqrt{k} \quad\text{(variances add)}$$

$$SR_k = \frac{k\mu}{\sigma\sqrt k} = \sqrt{k}\,\frac{\mu}{\sigma} = \sqrt k \cdot SR_1$$

The asymmetry between the numerator (linear in $k$) and the denominator (square root) is the same
$\sqrt t$ scaling as [[brownian-motion]], and it is why a Sharpe ratio is meaningless without a
stated horizon.
:::

:::derivation Why more frequent sampling does not improve precision
Sample at frequency $k$ per year over $T$ years, giving $n = kT$ observations. The estimated Sharpe
at that frequency has standard error roughly $1/\sqrt{n}$, and annualising multiplies by $\sqrt k$:

$$\operatorname{SE}(\widehat{SR}_{\text{annual}}) \approx \sqrt{k}\cdot\frac{1}{\sqrt{kT}} = \frac{1}{\sqrt T}$$

**The $k$ cancels.** Precision depends only on calendar time. This is the single most
counter-intuitive and most important statistical fact about performance measurement: a
high-frequency strategy generates millions of observations and still needs years of live trading
before its Sharpe is known to within ±0.3.
:::

:::derivation The optimal combination of two strategies
Maximising the Sharpe of $w R_A + (1-w)R_B$ over $w$ gives the tangency solution
$\mathbf w^\star \propto \Sigma^{-1}\boldsymbol\mu$. For two assets this reduces to

$$\frac{w_A}{w_B} = \frac{\sigma_B(SR_A - \rho\,SR_B)}{\sigma_A(SR_B - \rho\,SR_A)}$$

Note the condition for a positive allocation to B: $SR_B > \rho\,SR_A$. A strategy with a *low*
Sharpe still earns capital if it is sufficiently uncorrelated. With $SR_A = 1.5$, $SR_B = 0.8$ and
$\rho = 0$, both get positive weight and the combined Sharpe is
$\sqrt{1.5^2 + 0.8^2} = 1.70$ — better than either alone. That $\sqrt{\sum SR_i^2}$ formula for
uncorrelated strategies is the mathematical case for the multi-strategy fund.
:::

## Assumptions & Edge Cases

:::assumption
1. **Volatility is the right risk measure.** True only if returns are elliptically distributed or
   the investor has quadratic utility. Neither holds.
2. **Returns are i.i.d.** Broken by autocorrelation (smoothing, trend, illiquidity) and volatility
   clustering.
3. **Symmetric treatment of upside and downside.** Sharpe penalises a +5% month exactly as much as
   a −5% month. Sortino and Omega exist because investors do not.
4. **Stable moments.** Sharpe assumes the mean and variance being estimated are constants; regime
   changes make them conditional quantities.
5. **The risk-free rate is well-defined and achievable.** In a rate regime like 2022–2024 the choice
   of $r_f$ moves reported Sharpe materially; in 2015 it did not.
6. **Negative Sharpe is not comparable.** With negative excess return, higher volatility gives a
   *less negative* Sharpe. Ranking losing strategies by Sharpe is meaningless.
:::

:::warning
**The systematic bias:** every strategy that sells insurance — short volatility, credit carry, FX
carry, merger arb, illiquidity — reports a high Sharpe over any period without a crisis. The
metric's blindness to negative skew is not a rounding error; it is a structural incentive to take
exactly the risks that Sharpe cannot see. LTCM ran a Sharpe above 4 until it did not exist.
:::

## Worked Example

A strategy returns 12% annually with 8% volatility, risk-free 3%.

$$SR = \frac{0.12 - 0.03}{0.08} = 1.125$$

Now interrogate it properly.

**Precision.** Over 3 years, $\operatorname{SE} \approx \sqrt{(1 + 1.125^2/2)/3} = \sqrt{0.544} =
0.74$. So $SR = 1.13 \pm 0.74$: the 95% interval is roughly $[-0.32, 2.57]$. **A three-year track
record cannot distinguish a Sharpe of 1.1 from zero.**

**Autocorrelation.** If monthly returns have $\rho_1 = 0.25$, the correction factor is
$\sqrt{(1-0.25)/(1+0.25)} = 0.77$, so the honest Sharpe is $1.125 \times 0.77 = 0.87$.

**Skew.** If the strategy shows $\gamma_3 = -1.5$ and $\gamma_4 = 8$ (typical for short volatility),
the standard error becomes

$$\sqrt{\frac{1 - (-1.5)(1.125) + \frac{8-1}{4}(1.125)^2}{3}} = \sqrt{\frac{1 + 1.69 + 2.21}{3}}
= \sqrt{1.634} = 1.28$$

— 73% wider than the normal-case estimate. The reported 1.125 now sits inside $[-1.4, 3.6]$.

**Conclusion:** the honest statement is "estimated Sharpe 0.9, indistinguishable from zero on this
sample, with a return distribution that will look worse in a crisis." That is a very different
sentence from "Sharpe 1.13".

## Why It Matters in Quant Finance

Sharpe is the currency of the industry: it determines capital allocation between PMs, sets risk
limits, decides which strategies are launched and killed, and feeds directly into compensation.
Because it is the objective people are measured on, it is also the objective people optimise —
including in ways that do not create value.

Its relatives, each fixing one assumption:

| Metric | Denominator | Fixes |
|---|---|---|
| Sharpe | total volatility | — |
| Information ratio | tracking error | benchmark-relative skill |
| Sortino | downside deviation | symmetry |
| Calmar | max drawdown | path dependence |
| Omega | full distribution | all higher moments |
| Deflated Sharpe | adjusted for $N$ trials | multiple testing |
| Probabilistic Sharpe | — | reports $\P(SR > \text{threshold})$ |

Grinold's fundamental law connects Sharpe to its drivers:

:::formula {name="Fundamental law of active management" used-in="Alpha Research, Capacity Planning" note="Breadth counts INDEPENDENT bets. Correlated positions do not multiply."}
IR \approx IC \times \sqrt{\text{breadth}}
:::

An IC of 0.03 — a correlation of 3% between forecast and outcome, which is a realistic
cross-sectional equity signal — applied to 1,000 independent bets per year yields
$IR \approx 0.03\sqrt{1000} \approx 0.95$. That is the arithmetic of a real equity market-neutral
business, and it shows why breadth and independence are worth as much as forecasting skill.

## Trading & Research Application

:::desk
**Allocate on marginal, not standalone, Sharpe.** The question is never "what is this strategy's
Sharpe?" but "how much does adding it raise the fund's Sharpe?" For uncorrelated strategies,
combined $SR = \sqrt{\sum SR_i^2}$ — five uncorrelated 0.8-Sharpe strategies give 1.79, better than
any single one and better than most single strategies anywhere. This is the entire economic
rationale for the multi-strategy platform.

**Due diligence checklist when someone shows you a Sharpe:**
- Over what period, and who chose the start date?
- Net or gross of fees, financing and transaction costs?
- What is the skew and kurtosis? Negative skew means the Sharpe is both flattering and imprecise.
- What is the autocorrelation of monthly returns? Above 0.2 suggests smoothed marks.
- How many variants were tested? (The question most likely to end the conversation.)
- What is the maximum drawdown, and does it match what the Sharpe implies? For a Sharpe-1 strategy,
  expected max drawdown over a few years is roughly one annual volatility — if the reported
  drawdown is far smaller, the volatility is understated.

**Capacity is invisible to Sharpe.** A backtested Sharpe of 3 at \$10m of capital may be 0.5 at
\$500m once market impact is included. Sharpe says nothing about the size of the business, and a
fund cares about both.

**Live is not backtest.** Realised out-of-sample Sharpe is typically **half** the backtested figure
even with honest research — the combination of overfitting, cost underestimation and alpha decay.
Planning as though the backtest number will be realised is the most reliable way to be
under-capitalised in the first drawdown.
:::

## Implementation Notes

```python
import numpy as np
from scipy import stats   # optional; only for the deflated-Sharpe helper

def sharpe(returns, rf_periodic=0.0, periods_per_year=252):
    excess = np.asarray(returns) - rf_periodic
    if excess.std(ddof=1) == 0:
        return float("nan")
    return excess.mean() / excess.std(ddof=1) * np.sqrt(periods_per_year)

def sharpe_stderr(sr_annual, years, skew=0.0, kurtosis=3.0):
    """Lo (2002), with the non-normal correction. Report this next to every
    Sharpe you quote -- a Sharpe without an interval is not a measurement."""
    var = 1.0 - skew * sr_annual + 0.25 * (kurtosis - 1.0) * sr_annual**2
    return np.sqrt(max(var, 1e-12) / years)

def autocorr_adjusted_sharpe(returns, periods_per_year=252):
    """Lo's autocorrelation correction. Applies to smoothed/illiquid marks and
    to trend strategies -- both of which the naive sqrt(k) rule misstates."""
    r = np.asarray(returns)
    q = periods_per_year
    rho = [np.corrcoef(r[:-k], r[k:])[0, 1] for k in range(1, min(q, len(r) // 2))]
    denom = q + 2 * sum((q - k) * rho[k - 1] for k in range(1, len(rho) + 1))
    naive = r.mean() / r.std(ddof=1)
    return naive * q / np.sqrt(max(denom, 1e-12))

def deflated_threshold(n_trials, sr_stderr):
    """Expected maximum Sharpe from n_trials of pure noise. Your observed
    Sharpe must beat THIS, not zero."""
    gamma = 0.5772156649
    a = stats.norm.ppf(1 - 1 / n_trials)
    b = stats.norm.ppf(1 - 1 / (n_trials * np.e))
    return sr_stderr * ((1 - gamma) * a + gamma * b)
```

## Common Mistakes

:::pitfall
- **Quoting a Sharpe without a confidence interval.** $\operatorname{SE}\approx\sqrt{(1+SR^2/2)/T}$
  with $T$ in years. A one-year Sharpe of 2 is not evidence of anything.
- **Believing more data points help.** Only calendar time reduces the standard error; sampling
  frequency cancels.
- **Annualising by $\sqrt{k}$ with autocorrelated returns.** Overstates smoothed and trend
  strategies, understates mean reversion.
- **Ignoring skew and kurtosis.** Negative skew both flatters the ratio and widens its error bars.
- **Comparing negative Sharpes.** The ordering inverts and is meaningless.
- **Allocating on standalone rather than marginal Sharpe.** Correlation to the existing book is the
  missing variable in almost every allocation question.
- **Not disclosing the number of trials.** The best of 500 backtests is a different object from a
  single pre-registered test, by roughly a factor of three in Sharpe.
- **Confusing Sharpe with the information ratio.** Sharpe uses $r_f$; IR uses a benchmark. A
  long-only manager's Sharpe in a bull market says nothing about skill.
:::

## 30-Second Revision

- $SR = (\E[R]-r_f)/\sigma$; leverage-invariant; annualise by $\sqrt k$ **if i.i.d.**
- Sharpe is a t-statistic: $t \approx SR\sqrt{T}$, $T$ in years.
- $\operatorname{SE}(\widehat{SR}) \approx \sqrt{(1+SR^2/2)/T}$. **Only calendar time helps** —
  higher sampling frequency does not.
- Negative skew both inflates the ratio and widens its error bars: option sellers look best on this
  metric and deserve it least.
- Uncorrelated strategies combine as $\sqrt{\sum SR_i^2}$; allocate on **marginal**, not standalone.
- $IR \approx IC\sqrt{\text{breadth}}$ — skill per bet times the root of independent bets.
- Best-of-$N$ backtests need a deflated threshold; the number of trials is the number that matters.
- Expect realised Sharpe ≈ half the backtest.
