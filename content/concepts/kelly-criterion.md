---
id: kelly-criterion
title: Kelly Criterion
subject: portfolio-construction
summary: The bet size that maximises the long-run growth rate of wealth — obtained by maximising expected log wealth rather than expected wealth, because capital compounds multiplicatively.
difficulty: intermediate
interview_relevance: 5
tags: [sizing, leverage, compounding, growth, risk]
prerequisites: [expectation, variance]
related: [sharpe-ratio]
aliases: [Kelly, optimal f, log-optimal, growth-optimal, edge over odds]
updated: 2026-01-14
references:
  - title: "Kelly (1956), *A New Interpretation of Information Rate*, Bell System Technical Journal"
    url: ""
  - title: "Thorp (2006), *The Kelly Criterion in Blackjack, Sports Betting and the Stock Market*"
    url: ""
  - title: "MacLean, Thorp & Ziemba, *The Kelly Capital Growth Investment Criterion*"
    url: ""
questions:
  - q: A bet doubles your money with probability ½ and loses 60% with probability ½. Expected return per round is +20%. Should you bet everything every round?
    difficulty: intermediate
    tags: [classic, compounding, ruin]
    hint: Compute the typical path, not the average path.
    a: |
      **No — you go broke almost surely.**

      Expected wealth per round is $\tfrac12(2.0) + \tfrac12(0.4) = 1.2$, so betting everything
      maximises $\E[W]$. But wealth compounds, so the realised growth rate is governed by the
      *geometric* mean:

      $$\E[\ln R] = \tfrac12\ln 2.0 + \tfrac12\ln 0.4 = \tfrac12(0.693) + \tfrac12(-0.916) = -0.112$$

      Negative. A typical pair of rounds gives $2.0 \times 0.4 = 0.8$ — a 20% loss. By the law of
      large numbers $W_n \approx W_0 e^{-0.112n} \to 0$ almost surely.

      The expectation still grows without bound, carried by the vanishing set of paths that win
      every round. **The mean is not where you live.** Kelly asks what fraction $f$ of wealth to
      stake; here $f^\star = (0.5)(1.0)/(1.0) \cdot \ldots$ works out well below 1, and at any
      $f$ above roughly 0.4 the growth rate turns negative.
  - q: Derive the Kelly fraction for a bet paying b-to-1 with win probability p.
    difficulty: intermediate
    tags: [derivation, core]
    a: |
      Staking fraction $f$, wealth multiplies by $(1+fb)$ on a win and $(1-f)$ on a loss. Maximise
      the expected log growth:

      $$g(f) = p\ln(1+fb) + q\ln(1-f), \qquad q = 1-p$$

      $$g'(f) = \frac{pb}{1+fb} - \frac{q}{1-f} = 0
      \;\Longrightarrow\; pb(1-f) = q(1+fb)$$

      $$pb - pbf = q + qbf \;\Longrightarrow\; f^\star = \frac{pb - q}{b}$$

      Read it as **edge over odds**: the numerator $pb - q$ is the expected profit per unit staked,
      and dividing by $b$ converts it to a fraction of capital. If the edge is zero, $f^\star = 0$;
      if it is negative, $f^\star < 0$ and the correct action is the other side of the bet, or no
      bet at all.

      $g$ is strictly concave on $(0, 1)$, so the stationary point is the maximum.
  - q: Why does almost everyone trade a fraction of Kelly rather than full Kelly?
    difficulty: advanced
    tags: [practice, estimation-error, drawdown]
    a: |
      Three reasons, and they compound.

      1. **You do not know your edge — you estimated it.** Kelly is optimal given $p$; substituting
         $\hat p$ makes the sizing itself a random variable. The growth curve $g(f)$ is asymmetric
         around $f^\star$: overbetting hurts far more than underbetting by the same amount, and
         estimation error puts you on the wrong side about half the time.
      2. **Full Kelly drawdowns are intolerable.** Under full Kelly the probability of at some point
         halving your capital is roughly $1/2$; of quartering it, roughly $1/4$. In general
         $\P(\text{ever fall to fraction } x) \approx x$. No allocator, and no human, sits through that.
      3. **The trade is cheap.** Growth at a fraction $k$ of Kelly is $k(2-k)$ times the full-Kelly
         rate. **Half Kelly gives 75% of the growth for half the volatility.** Giving up a quarter
         of the growth rate to halve the risk is an obviously good deal, and it is why "half Kelly"
         is the de facto industry default.
  - q: What happens at exactly twice the Kelly fraction?
    difficulty: advanced
    tags: [growth-rate, leverage]
    a: |
      **Zero growth rate.** Since $g(k f^\star) = k(2-k)\,g(f^\star)$, at $k=2$ we get
      $2(2-2) = 0$. Beyond $2\times$ Kelly the growth rate is *negative*: you lose money in the long
      run despite every individual bet having positive expected value.

      This is the cleanest statement of why leverage is not free. The expectation is linear in size;
      the growth rate is not, because the variance drag $-\tfrac12 f^2\sigma^2$ grows quadratically
      while the drift term $f\mu$ grows linearly. It also explains the long-run decay of leveraged
      ETFs: a 3× daily-rebalanced product on an index is often past its own $2\times$-Kelly point.
  - q: Kelly for continuous returns — state the fraction and the resulting growth rate.
    difficulty: advanced
    tags: [continuous, sharpe, gbm]
    a: |
      For a continuously-rebalanced asset with drift $\mu$ (in excess of the risk-free rate) and
      volatility $\sigma$:

      $$f^\star = \frac{\mu}{\sigma^2}, \qquad g(f^\star) = \frac{\mu^2}{2\sigma^2} = \frac{SR^2}{2}$$

      **The optimal growth rate is half the squared Sharpe ratio.** That is a strikingly useful
      identity: a Sharpe of 1 supports at most 50% annual log growth *at full Kelly*, which
      immediately tells you that a strategy claiming 30% returns at Sharpe 0.5 is claiming
      leverage well beyond Kelly, not skill.

      It also links directly to [[sharpe-ratio]]: since Sharpe is leverage-invariant and Kelly
      growth is not, Sharpe measures the *quality* of an opportunity and Kelly turns that quality
      into a *size*.
  - q: You have two uncorrelated strategies, each with its own Kelly fraction. Can you run both at full Kelly?
    difficulty: research
    tags: [portfolio, correlation]
    a: |
      Not by simply adding them — you must solve the joint problem. The multivariate Kelly solution
      for a vector of excess returns is

      $$\mathbf f^\star = \Sigma^{-1}\boldsymbol\mu$$

      which is the **same direction as the mean–variance tangency portfolio**; Kelly picks the point
      on that ray, where mean–variance leaves the scale to a risk-aversion parameter.

      For genuinely uncorrelated strategies $\Sigma$ is diagonal and the individual fractions *are*
      the joint solution, so you can run both at full Kelly — and the growth rates add:
      $g = \sum SR_i^2/2$. With correlation, $\Sigma^{-1}$ shrinks the combined exposure below the
      sum of the individual fractions, and it does so most aggressively for the pairs that look most
      similar. Sizing each strategy at its standalone Kelly and stacking them is a common and
      expensive mistake — it is over-betting by exactly the amount the correlation implies.
---

## Intuition

Expectation is the wrong objective for anything you compound.

Suppose a bet doubles your stake half the time and takes 60% of it the other half. Expected wealth
per round is $\tfrac12(2.0) + \tfrac12(0.4) = 1.2$ — a 20% gain. So bet everything, every round?

Run it. Win then lose: $1.0 \times 2.0 \times 0.4 = 0.8$. You are down 20% after seeing exactly the
outcome frequencies you expected. Over many rounds you go broke almost surely, while the *expectation*
grows without bound — carried entirely by the shrinking sliver of paths that never lose.

:::insight
Expected wealth is dominated by paths that essentially never happen. The mean of a compounded
process sits far above its median, and **you live on the median**. Kelly replaces $\E[W]$ with
$\E[\ln W]$ because $\ln$ turns products into sums, and the law of large numbers applies to sums:

$$\frac{1}{n}\sum_{i=1}^n \ln R_i \longrightarrow \E[\ln R] \quad \text{almost surely}$$

So $\E[\ln R]$ is the growth rate you *actually realise*, not merely the one you expect.
:::

## Mathematical Formulation

For a discrete bet paying $b$-to-1 with win probability $p$ and $q = 1-p$:

:::formula {name="Kelly fraction (discrete bet)" used-in="Position Sizing, Betting, Risk" note="Read it as edge divided by odds."}
f^\star = \frac{pb - q}{b}
:::

For continuously-rebalanced returns with excess drift $\mu$ and volatility $\sigma$:

:::formula {name="Kelly fraction (continuous)" used-in="Portfolio Construction, Leverage"}
f^\star = \frac{\mu}{\sigma^2}
:::

:::formula {name="Optimal growth rate" used-in="Portfolio Construction, Performance" note="The optimal log-growth rate is half the squared Sharpe ratio."}
g(f^\star) = \frac{\mu^2}{2\sigma^2} = \frac{SR^2}{2}
:::

The multi-asset generalisation, which is where it meets portfolio theory:

:::formula {name="Multivariate Kelly" used-in="Portfolio Construction, Allocation" note="The same direction as the mean–variance tangency portfolio."}
\mathbf{f}^\star = \Sigma^{-1}\boldsymbol{\mu}
:::

And the fact that justifies everyone's actual behaviour:

:::formula {name="Growth at a fraction of Kelly" used-in="Position Sizing, Risk Management" note="k = ½ gives 75% of the growth for half the volatility; k = 2 gives none at all."}
g(k f^\star) = k(2-k)\, g(f^\star)
:::

## Derivation

:::derivation The discrete Kelly fraction
Staking fraction $f$ of wealth, one round multiplies wealth by $(1+fb)$ with probability $p$ and by
$(1-f)$ with probability $q$. The expected log growth per round is

$$g(f) = p\ln(1+fb) + q\ln(1-f)$$

$$g'(f) = \frac{pb}{1+fb} - \frac{q}{1-f}$$

Setting $g'(f)=0$:

$$pb(1-f) = q(1+fb) \;\Longrightarrow\; pb - pbf = q + qbf
\;\Longrightarrow\; f^\star = \frac{pb-q}{b}$$

$g''(f) = -\dfrac{pb^2}{(1+fb)^2} - \dfrac{q}{(1-f)^2} < 0$ everywhere on $(0,1)$, so $g$ is
strictly concave and the stationary point is the unique maximum.
:::

:::derivation The continuous case, and where σ² comes from
For a position of size $f$ in an asset following geometric [[brownian-motion]] with excess drift
$\mu$ and volatility $\sigma$, the portfolio follows

$$\frac{\d W_t}{W_t} = f\mu\,\d t + f\sigma\,\d W_t$$

By Itô's lemma applied to $\ln W$ — the $-\tfrac12 f''$ term again — the log-growth rate is

$$g(f) = f\mu - \tfrac{1}{2}f^2\sigma^2$$

The drift term is **linear** in size; the variance drag is **quadratic**. Maximising:

$$g'(f) = \mu - f\sigma^2 = 0 \;\Longrightarrow\; f^\star = \frac{\mu}{\sigma^2}$$

$$g(f^\star) = \frac{\mu^2}{\sigma^2} - \frac{1}{2}\frac{\mu^2}{\sigma^2} = \frac{\mu^2}{2\sigma^2}$$

That quadratic drag is the same $\sigma^2/2$ that appears as volatility drag in [[variance]] and in
the GBM solution. Kelly is not a separate theory — it is Jensen's inequality solved for position size.
:::

:::derivation Why k(2−k), and why 2× Kelly gives nothing
Substitute $f = kf^\star = k\mu/\sigma^2$ into $g(f) = f\mu - \tfrac12 f^2\sigma^2$:

$$g(kf^\star) = \frac{k\mu^2}{\sigma^2} - \frac{1}{2}\frac{k^2\mu^2}{\sigma^2}
= \frac{\mu^2}{2\sigma^2}\left(2k - k^2\right) = k(2-k)\,g(f^\star)$$

A parabola through $k=0$ and $k=2$, peaking at $k=1$. Hence: half Kelly $\to 0.75$, quarter Kelly
$\to 0.4375$, double Kelly $\to 0$, and anything beyond $2\times$ is a negative growth rate on a
strictly positive-expectation bet.

The asymmetry is the practical point. Being at $k=0.5$ costs 25% of the growth rate; being at
$k=1.5$ costs the same 25% — but with three times the position and three times the drawdown.
**When you are unsure of your edge, err low.**
:::

## Assumptions & Edge Cases

:::assumption
- **The edge is known.** Kelly is optimal *given* $p$ and $b$. In practice you have $\hat p$ from a
  finite sample, and the plug-in estimate systematically overbets.
- **Infinite horizon, infinitely divisible capital.** Kelly optimises the asymptotic growth rate. It
  is not the right objective if you have a fixed short horizon, a hard drawdown limit, or a
  liquidation threshold.
- **Log utility.** Maximising $\E[\ln W]$ is exactly optimal for a log-utility investor; for anyone
  else it is a growth-rate argument, not a utility argument. Someone with a genuine risk budget or
  a redemption clause is not a log-utility investor.
- **Repeated, independent bets.** Correlated or one-shot bets need the multivariate solution or a
  different framework entirely.
- **No transaction costs and continuous rebalancing** in the continuous version.
:::

:::warning
Kelly says nothing about drawdown tolerance, and full Kelly's drawdowns are severe:
$\P(\text{wealth ever falls to fraction } x \text{ of its peak}) \approx x$. A 50% drawdown is a
coin flip. Any real mandate — an allocator, a risk committee, a personal tolerance — imposes a
constraint Kelly does not know about, and fractional Kelly is how that constraint enters.
:::

## Worked Example

A market-neutral strategy has estimated annual excess return $\mu = 6\%$ with volatility
$\sigma = 8\%$ (Sharpe 0.75).

**Full Kelly:**

$$f^\star = \frac{0.06}{0.08^2} = \frac{0.06}{0.0064} = 9.4\times \text{ leverage}$$

$$g(f^\star) = \frac{0.06^2}{2(0.08)^2} = \frac{0.0036}{0.0128} = 28.1\%\text{ log growth} = \frac{0.75^2}{2}$$

Nine times leverage on a Sharpe-0.75 strategy. That number should stop you.

**Why it is not the answer.** At $9.4\times$, the portfolio's volatility is
$9.4 \times 8\% = 75\%$ annualised, and the expected drawdown is catastrophic. Worse, $\mu = 6\%$
is an *estimate*: from [[sharpe-ratio]], the standard error of a Sharpe of 0.75 over 5 years is
$\sqrt{(1+0.75^2/2)/5} \approx 0.51$. The true Sharpe could plausibly be 0.25, in which case the
true $f^\star$ is one ninth of what you computed and you are at $9\times$ Kelly — deep into
negative growth.

**Quarter Kelly:**

$$f = 2.35\times, \quad \sigma_p = 18.8\%, \quad g = 0.25(1.75)(28.1\%) = 12.3\%$$

You keep 44% of the theoretical growth at a quarter of the leverage, and you survive being wrong
about $\mu$ by a factor of three. That is the trade every serious desk makes, and the reason
published Kelly fractions are almost never traded as published.

## Why It Matters in Quant Finance

Kelly is the bridge between *forecasting* and *sizing* — the step that turns a signal into a
position. Its consequences are everywhere:

- **The connection to Sharpe.** $g(f^\star) = SR^2/2$ means growth is quadratic in Sharpe. Doubling
  Sharpe quadruples the sustainable growth rate. This is the quantitative case for improving signal
  quality over adding leverage.
- **The connection to mean–variance.** $\mathbf f^\star = \Sigma^{-1}\boldsymbol\mu$ is the tangency
  portfolio direction. Kelly and Markowitz agree on *what to hold* and differ only on *how much* —
  Kelly fixes the scale by an objective, Markowitz leaves it to a risk-aversion parameter.
- **Volatility targeting is fractional Kelly in disguise.** Sizing $w \propto 1/\sigma$ is
  $f = \mu/\sigma^2$ with $\mu$ assumed proportional to $\sigma$ — i.e. constant Sharpe across
  assets. Making that assumption explicit is often more honest than estimating $\mu$ per asset.
- **Leveraged product decay.** A 3× daily ETF on an index is frequently past $2\times$ Kelly for
  that index, which is why it loses money over long horizons in a flat market.

## Trading & Research Application

:::desk
**Nobody trades full Kelly.** Typical practice is a quarter to a half, and the reasoning is
mechanical rather than timid: the growth curve is flat near the optimum and steep beyond it, your
edge estimate has large error bars, and drawdown constraints are real and externally imposed.

**Size the estimate, not the point forecast.** The Bayesian version — shrink $\hat\mu$ towards zero
in proportion to its standard error, then apply Kelly — is closer to correct than applying Kelly to
a raw sample mean. Fractional Kelly is a crude approximation to exactly this shrinkage, which is why
it works as well as it does.

**Correlation is the expensive mistake.** Running $n$ strategies each at its standalone Kelly
fraction over-bets by whatever the correlation implies. Use $\Sigma^{-1}\boldsymbol\mu$, and
remember from [[covariance-and-correlation]] that $\Sigma^{-1}$ loads hardest on the smallest
eigenvalues — the noisiest ones. Kelly inherits every estimation problem mean–variance has.

**The one-line diagnostic.** Given a strategy's Sharpe, $SR^2/2$ is the *maximum* log growth rate
available at any leverage. If a pitch claims returns above that, it is claiming leverage beyond
Kelly — and therefore, by construction, a worse long-run outcome than a smaller position.
:::

## Implementation Notes

```python
import numpy as np

def kelly_discrete(p: float, b: float) -> float:
    """Edge over odds. Negative means the other side of the bet, or no bet."""
    return max(0.0, (p * b - (1 - p)) / b)

def kelly_continuous(mu: float, sigma: float, fraction: float = 0.25) -> float:
    """Fractional Kelly for continuous returns. `fraction` defaults to a quarter:
    full Kelly assumes you know mu, and you do not."""
    return fraction * mu / (sigma ** 2)

def kelly_portfolio(mu: np.ndarray, cov: np.ndarray, fraction: float = 0.25) -> np.ndarray:
    """Multivariate Kelly = Sigma^-1 mu, the tangency direction.

    Solve rather than invert, and shrink the covariance first: this expression
    loads hardest on the smallest eigenvalues, which are the noisiest ones.
    """
    return fraction * np.linalg.solve(cov, mu)

def growth_rate(k: float, sharpe: float) -> float:
    """Log growth at k times the Kelly fraction. k=0.5 -> 75%, k=2 -> 0."""
    return k * (2 - k) * sharpe ** 2 / 2
```

## Common Mistakes

:::pitfall
- **Maximising $\E[W]$ instead of $\E[\ln W]$.** The headline error, and it leads to certain ruin on
  a positive-expectation bet.
- **Treating the estimated edge as known.** Plug-in Kelly on a sample mean systematically overbets,
  and the growth curve punishes overbetting far more than underbetting.
- **Stacking standalone Kelly fractions across correlated strategies.** Use
  $\Sigma^{-1}\boldsymbol\mu$; anything else over-bets by the correlation.
- **Assuming more leverage means more growth.** Growth peaks at $f^\star$, hits zero at $2f^\star$
  and is negative beyond — with positive expected value at every single bet.
- **Applying Kelly over a short horizon.** It optimises an asymptotic growth rate; over ten trades
  its guarantees do not apply.
- **Ignoring the drawdown implication.** $\P(\text{ever fall to fraction } x) \approx x$ under full
  Kelly. A 50% drawdown is a coin flip, and no mandate survives that.
:::

## 30-Second Revision

- Maximise $\E[\ln W]$, not $\E[W]$ — wealth compounds, so the geometric mean is what you realise.
- Discrete: $f^\star = (pb-q)/b$, **edge over odds**. Continuous: $f^\star = \mu/\sigma^2$.
- Optimal growth $= \mu^2/2\sigma^2 = SR^2/2$. Growth is **quadratic in Sharpe**.
- Fractional Kelly: $g(kf^\star) = k(2-k)\,g(f^\star)$. Half Kelly → **75% of the growth, half the
  risk**. Double Kelly → **zero growth**.
- Multi-asset: $\mathbf f^\star = \Sigma^{-1}\boldsymbol\mu$ — the tangency direction; Kelly fixes
  the scale.
- Nobody trades full Kelly: the edge is estimated, and $\P(\text{50\% drawdown}) \approx 1/2$.
