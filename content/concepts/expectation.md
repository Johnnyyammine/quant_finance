---
id: expectation
title: Expectation
subject: probability
summary: The probability-weighted average of a random variable — the number a long-run average converges to, and the object almost every pricing and sizing argument is really about.
difficulty: foundational
interview_relevance: 5
tags: [probability, moments, pricing, linearity]
prerequisites: []
related: [variance, conditional-probability]
aliases: [expected value, mean, first moment, EV]
updated: 2026-01-14
references:
  - title: "Grimmett & Stirzaker, *Probability and Random Processes*, ch. 3"
    url: ""
questions:
  - q: A fair die is rolled. You may either take the roll's value in dollars, or pay $1 to re-roll once. What is the value of the game played optimally?
    difficulty: intermediate
    tags: [brainteaser, optimal-stopping]
    hint: Work backwards. What is the continuation value?
    a: |
      Solve backwards. A single roll is worth $\E[X] = 3.5$. So after seeing the first roll you should
      re-roll exactly when the roll is worth less than $3.5 - 1 = 2.5$, i.e. on a 1 or a 2.

      $$\E[\text{game}] = \tfrac{1}{6}\big[2.5 + 2.5 + 3 + 4 + 5 + 6\big] = \tfrac{23}{6} \approx 3.833$$

      The 1 and 2 outcomes are each replaced by the continuation value $3.5 - 1 = 2.5$.
      This is the smallest non-trivial optimal-stopping problem, and the structure —
      compare the payoff now against the expected payoff of continuing, net of cost — is exactly
      the structure of an American option exercise decision.
  - q: X and Y are dependent. Is E[XY] = E[X]E[Y]?
    difficulty: foundational
    tags: [linearity, independence]
    a: |
      Not in general. $\E[XY] = \E[X]\E[Y] + \Cov(X,Y)$, so the factorisation holds only when
      $\Cov(X,Y)=0$ — which independence implies but does not require.

      The trap runs the other way too: **linearity** $\E[X+Y]=\E[X]+\E[Y]$ needs *no* independence
      assumption at all. Candidates routinely add an independence caveat where none is needed and
      omit it where it is essential.
  - q: You flip a fair coin until you see two heads in a row. What is the expected number of flips?
    difficulty: intermediate
    tags: [brainteaser, markov-chain]
    hint: Define states by how many consecutive heads you currently hold.
    a: |
      Let $a$ = expected flips from "0 consecutive heads", $b$ = from "1 consecutive head".

      $$a = 1 + \tfrac12 b + \tfrac12 a, \qquad b = 1 + \tfrac12 \cdot 0 + \tfrac12 a$$

      From the first, $\tfrac12 a = 1 + \tfrac12 b \Rightarrow a = 2 + b$. Substituting:
      $b = 1 + \tfrac12(2+b) \Rightarrow \tfrac12 b = 2 \Rightarrow b = 4$, so $a = 6$.

      **Answer: 6 flips.** The generalisation to $k$ consecutive heads is $2^{k+1}-2$.
  - q: A stock is at 100. It moves up 10% or down 10% each day with equal probability. What is the expected price after 2 days, and the expected log price?
    difficulty: intermediate
    tags: [jensen, compounding]
    a: |
      Prices multiply, so $\E[S_2] = 100 \cdot \E[R]^2$ with $\E[R] = \tfrac12(1.1) + \tfrac12(0.9) = 1.0$,
      giving $\E[S_2] = 100$. Yet the *median* path is down: up-then-down gives $100 \times 1.1 \times 0.9 = 99$.

      In logs, $\E[\ln R] = \tfrac12\ln 1.1 + \tfrac12 \ln 0.9 = -0.005025$, so
      $\E[\ln S_2] = \ln 100 - 0.01005 < \ln 100$. This gap is Jensen's inequality and it is
      the entire content of *volatility drag*: arithmetic mean return exceeds geometric mean return
      by roughly $\sigma^2/2$.
---

## Intuition

Expectation is the number that the average of many independent copies settles down to. Roll a die
ten thousand times and the running average will hug 3.5 — not because any roll is 3.5, but because
the deviations cancel at rate $1/\sqrt{n}$.

The useful mental model is **centre of mass**. Put a point mass $p_i$ at each possible value $x_i$
along a rod; the expectation is the balance point. This immediately explains two things people find
surprising: the expectation need not be an attainable value (3.5 is not a face of a die), and a
single far-out outcome with tiny probability can drag the balance point a long way — which is why
expectation alone is a dangerous summary of a fat-tailed P&L distribution.

## Mathematical Formulation

For a discrete random variable taking values $x_i$ with probabilities $p_i$:

:::formula {name="Expectation (discrete)" used-in="Probability, Pricing, Risk"}
\E[X] = \sum_i x_i \, p_i
:::

For a continuous random variable with density $f$:

:::formula {name="Expectation (continuous)" used-in="Probability, Derivatives"}
\E[X] = \int_{-\infty}^{\infty} x \, f(x)\, \d x
:::

Both are the same object — the Lebesgue integral $\E[X] = \int_\Omega X \,\d\P$ — which is why the
same theorems apply to both. Expectation exists only when $\E[|X|] < \infty$; the Cauchy
distribution is the standard counterexample, and it is not merely pathological: it is the
distribution of a ratio of two independent normals, which is exactly what a naive beta estimate
looks like when the denominator variance is small.

The property that does the real work:

:::formula {name="Linearity of expectation" used-in="Portfolio Theory, Combinatorics, Risk"}
\E\!\left[\sum_{i=1}^{n} a_i X_i\right] = \sum_{i=1}^{n} a_i\, \E[X_i]
:::

:::insight
Linearity holds **without any independence assumption**. This is the single most useful fact in
elementary probability and the source of most slick interview solutions: decompose a complicated
random quantity into a sum of simple indicators, take expectations term by term, and never worry
about how the terms interact.
:::

## Derivation

:::derivation Why linearity needs no independence
Write both variables on the same sample space and sum over outcomes:

$$\E[X+Y] = \sum_{\omega} (X(\omega)+Y(\omega))\,\P(\omega)
          = \sum_{\omega} X(\omega)\P(\omega) + \sum_{\omega} Y(\omega)\P(\omega) = \E[X]+\E[Y]$$

Nothing about the joint structure was used — only that each $\omega$ contributes its own
probability once. Contrast with variance, where the cross term
$2\Cov(X,Y)$ survives precisely because squaring is not linear. That asymmetry is why portfolio
*returns* add trivially and portfolio *risk* does not.
:::

:::derivation The tail-sum formula (useful for waiting-time questions)
For a non-negative integer-valued $X$:

$$\E[X] = \sum_{k=1}^{\infty} \P(X \ge k)$$

*Proof.* $\sum_{k\ge1}\P(X\ge k) = \sum_{k\ge1}\sum_{j\ge k}\P(X=j) = \sum_{j\ge1} j\,\P(X=j) = \E[X]$,
swapping the order of summation (valid for non-negative terms).

This turns "expected number of trials until success" problems into one-line geometric sums:
if each trial succeeds with probability $p$ independently, $\P(X \ge k) = (1-p)^{k-1}$ and
$\E[X] = 1/p$.
:::

## Assumptions & Edge Cases

:::assumption
- **Existence.** $\E[X]$ requires $\E[|X|]<\infty$. Fat-tailed distributions with tail index
  $\alpha \le 1$ have no mean at all; with $\alpha \le 2$ they have no variance. Empirical estimates
  will still print a number — that number is meaningless.
- **Interchange of limits.** $\E[\lim X_n] \ne \lim \E[X_n]$ in general. You need dominated or
  monotone convergence. Monte Carlo estimators quietly rely on this.
- **Non-linear functions.** $\E[g(X)] \ne g(\E[X])$ unless $g$ is affine. See Jensen below.
:::

:::pitfall
$\E[1/X] \ne 1/\E[X]$. This bites in practice: the expected P/E ratio of a basket is not the
reciprocal of its expected earnings yield, and averaging ratios across stocks is a different
estimator from the ratio of averages.
:::

## Worked Example

A strategy has a 55% win rate. Winners make \$120, losers lose \$100. Trade size is fixed.

$$\E[\text{P\&L per trade}] = 0.55 \times 120 + 0.45 \times (-100) = 66 - 45 = \$21$$

Positive edge. But run it 200 times a year and ask what dispersion looks like. Each trade has
$\E[X^2] = 0.55(120)^2 + 0.45(100)^2 = 7920 + 4500 = 12{,}420$, so
$\Var(X) = 12{,}420 - 21^2 = 11{,}979$ and $\sigma \approx \$109.4$ per trade.

Over 200 independent trades: expected P&L $= \$4{,}200$, standard deviation
$= 109.4\sqrt{200} \approx \$1{,}547$. The annual Sharpe ratio is $4200/1547 \approx 2.7$ — strong.

Now cut the win rate to 52%: $\E = 0.52(120) + 0.48(-100) = \$14.4$ per trade, annual expectation
\$2,880 against essentially the same \$1,550 of noise, so Sharpe falls to $1.9$. A three-point
drop in hit rate — well inside the estimation error of a 200-trade sample — costs a third of the
risk-adjusted return. That sensitivity is the reason [[variance]] matters as much as expectation.

## Why It Matters in Quant Finance

Expectation is the primitive of every valuation argument. Under the risk-neutral measure $\Q$,
the price of a claim paying $H$ at time $T$ is

:::formula {name="Risk-neutral pricing" used-in="Derivatives, Options, Fixed Income" note="Everything in derivatives pricing is machinery for computing this one expectation."}
V_0 = \E^{\Q}\!\left[e^{-\int_0^T r_s\,\d s}\, H\right]
:::

Black–Scholes, binomial trees, Monte Carlo and PDE methods are four ways to evaluate that
expectation, not four different theories.

Expectation also underwrites the mechanics of a research process: the expected value of a signal's
next-period return *is* the alpha, and [[linear-regression]] is a machine for estimating conditional
expectations $\E[Y \mid X]$.

## Trading & Research Application

:::desk
Every position sizing rule starts from an expectation and then argues about the second moment.
A trader who reasons only in expectation over-bets; a risk manager who reasons only in variance
never trades. Kelly sizing is the formal reconciliation: maximise $\E[\ln W]$, not $\E[W]$ — because
wealth compounds multiplicatively and $\ln$ is concave, so Jensen's inequality applies with force.

The practical failure mode is a positive-expectation strategy with left-skewed payoff (short
options, carry, illiquidity premia). The expectation is real and the strategy still blows up,
because a mean computed over a period containing no crisis is an estimate of a conditional
expectation you have mislabelled as unconditional.
:::

Jensen's inequality is the bridge between "expectation" and "what actually happens to capital":

:::formula {name="Jensen's inequality" used-in="Portfolio Construction, Position Sizing"}
g \text{ convex} \implies \E[g(X)] \ge g(\E[X])
:::

Applied to $\ln$ (concave, so the inequality flips), it gives the gap that separates arithmetic
from geometric returns: the compounded growth rate is $\mu - \sigma^2/2$, and the $\sigma^2/2$
is volatility drag.

## Implementation Notes

```python
import numpy as np

def expectation_mc(payoff, sampler, n=100_000, seed=0):
    """Monte Carlo expectation with a standard error, which is the only
    number that tells you whether n was large enough."""
    rng = np.random.default_rng(seed)
    draws = payoff(sampler(rng, n))
    mean = draws.mean()
    stderr = draws.std(ddof=1) / np.sqrt(n)
    return mean, stderr          # report both, always

# Convergence is O(1/sqrt(n)): 100x the paths buys 10x the precision.
```

:::warning
Never report a Monte Carlo expectation without its standard error. A price quoted to four decimals
from 10,000 paths is usually accurate to one.
:::

## Common Mistakes

:::pitfall
- **Assuming independence for linearity.** $\E[X+Y]=\E[X]+\E[Y]$ always. Saying "assuming
  independence" here signals you have not internalised the proof.
- **Confusing $\E[g(X)]$ with $g(\E[X])$.** The gap is Jensen's inequality and it is where
  volatility drag, convexity and gamma P&L all live.
- **Reporting a mean for a distribution that has none.** Check tail behaviour before averaging.
- **Confusing the mean with the median** in skewed distributions. For lognormal returns the median
  path is below the mean path; a strategy can have positive expected wealth and lose money in most
  states of the world.
- **Ignoring the conditioning set.** Historical average return is $\E[R \mid \text{regime observed}]$,
  not $\E[R]$.
:::

## 30-Second Revision

- $\E[X] = \sum x_i p_i$ or $\int x f(x)\,\d x$; the balance point of the distribution.
- **Linearity is unconditional**: $\E[\sum a_i X_i] = \sum a_i \E[X_i]$, independence irrelevant.
- $\E[XY] = \E[X]\E[Y] + \Cov(X,Y)$ — independence *is* needed here.
- Jensen: $\E[g(X)] \ge g(\E[X])$ for convex $g$. Volatility drag $\approx \sigma^2/2$.
- Tail-sum: $\E[X] = \sum_{k\ge1}\P(X\ge k)$ for non-negative integers; waiting time $=1/p$.
- Pricing is one expectation under $\Q$; everything else is numerical method.
