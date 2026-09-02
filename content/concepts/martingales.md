---
id: martingales
title: Martingales
subject: stochastic-processes
summary: A process whose best forecast of its own future value is its present value — the formal statement of "no predictable edge", and the object that makes arbitrage-free pricing work.
difficulty: advanced
interview_relevance: 4
tags: [stochastic-processes, conditioning, pricing, no-arbitrage, efficiency]
prerequisites: [expectation, conditional-probability]
related: [brownian-motion]
aliases: [martingale, fair game, optional stopping, supermartingale]
minutes: 15
updated: 2026-01-14
references:
  - title: "Williams, *Probability with Martingales*"
    url: ""
  - title: "Shreve, *Stochastic Calculus for Finance II*, ch. 2"
    url: ""
questions:
  - q: A gambler bets on fair coin flips, doubling after every loss (martingale strategy). Expected profit is +$1 per sequence. Why is this not free money?
    difficulty: intermediate
    tags: [optional-stopping, classic, risk-of-ruin]
    hint: Which condition of the optional stopping theorem fails?
    a: |
      Wealth $W_n$ is a martingale, so $\E[W_\tau]=W_0$ *provided* the optional stopping theorem
      applies. It requires one of: bounded stopping time, bounded process, or integrable dominating
      variable. **The doubling strategy satisfies none of them** — the required stake grows as
      $2^n$ without bound, and the stopping time is unbounded.

      Practically: to guarantee +\$1 you must be able to survive an arbitrarily long losing streak
      with unbounded capital. With finite bankroll $B$ you can survive $\lfloor\log_2 B\rfloor$
      losses; beyond that you are wiped out. Expected value is exactly preserved — a small
      probability of a catastrophic loss precisely offsets the near-certain small gain.

      **The trading version:** every strategy that "never loses" (short deep OTM options, martingale
      grid systems, averaging down) is this bet. The P&L distribution is left-skewed to the point
      where the mean is uninformative, and the failure mode arrives as a single terminal event.
  - q: Is a stock price a martingale?
    difficulty: intermediate
    tags: [risk-neutral, efficiency, measure-change]
    a: |
      Not under the real-world measure $\P$ — equities have a positive expected return, so
      $\E^\P[S_{t+1}\mid\mathcal F_t] > S_t$. That is a *submartingale*, and it must be, or nobody
      would hold equity risk.

      Under the **risk-neutral measure** $\Q$, the *discounted* price $\tilde S_t = e^{-rt}S_t$ is a
      martingale:

      $$\E^\Q\!\left[e^{-r(T-t)}S_T \mid \mathcal F_t\right] = S_t$$

      That is the first fundamental theorem of asset pricing: **no arbitrage $\iff$ there exists an
      equivalent measure under which discounted prices are martingales.** Girsanov's theorem
      constructs it by changing the drift while leaving the volatility (and the null sets) alone.

      The distinction is the whole subject. $\P$ tells you what will happen; $\Q$ tells you what
      things cost.
  - q: X is a martingale. Is X² a martingale?
    difficulty: advanced
    tags: [jensen, submartingale]
    a: |
      No — $X^2$ is a **submartingale**. By conditional Jensen with the convex function $x^2$:

      $$\E[X_{t+1}^2 \mid \mathcal F_t] \ge \big(\E[X_{t+1}\mid \mathcal F_t]\big)^2 = X_t^2$$

      with equality only if $X_{t+1}$ is $\mathcal F_t$-measurable (no new randomness).

      The gap is exactly the conditional variance, and correcting for it gives a genuine martingale:
      $X_t^2 - \langle X\rangle_t$, where $\langle X \rangle$ is the quadratic variation. For
      Brownian motion this is the famous $W_t^2 - t$. This construction is the discrete ancestor of
      Itô's lemma's second-order term, and it is why realised variance is tradeable: a variance swap
      is a bet on $\langle X\rangle_T$.
  - q: Prove that a martingale has constant unconditional expectation.
    difficulty: foundational
    tags: [tower-property]
    a: |
      By the tower property of [[conditional-probability|conditional expectation]]:

      $$\E[X_{t+1}] = \E\big[\E[X_{t+1}\mid \mathcal F_t]\big] = \E[X_t]$$

      Induction gives $\E[X_t] = \E[X_0]$ for all $t$.

      This is a good sanity check but a weak one: constant expectation does **not** imply the
      martingale property, which is a statement about every conditional expectation, not just the
      unconditional one.
  - q: Your strategy's cumulative P&L looks like a martingale in-sample. Is that good or bad?
    difficulty: advanced
    tags: [alpha, research-process]
    a: |
      **Bad — a martingale P&L has zero expected profit.** You want a submartingale: positive drift.

      What you *do* want to be a martingale is the sequence of *forecast errors*. If
      $\E[r_{t+1} - \hat r_{t+1} \mid \mathcal F_t] \ne 0$, there is exploitable structure left in
      your residuals and your model is misspecified.

      The useful diagnostic: cumulative residuals should look like a driftless random walk, while
      cumulative P&L should not. Confusing the two is a real and common analytical mistake in
      research reviews.
---

## Intuition

A martingale is a **fair game**. Whatever has happened so far, your expected change from here is
zero. Not "the process is random", and not "the process has no memory" — the past can influence
volatility, higher moments, anything at all. What it cannot influence is the *expected direction of
the next move*.

This is why martingales and market efficiency are the same idea in different vocabulary. If a price
were not (roughly, after adjusting for risk and discounting) a martingale, the predictable part
would be a trade. The act of taking that trade removes the predictability. Efficiency is the
equilibrium in which nothing predictable is left.

:::insight
"Best forecast of tomorrow's value is today's value." The tower property makes this self-consistent:
your forecast today of your forecast tomorrow must equal your forecast today — otherwise you would
already have revised it. That is the entire content of the definition, and it is worth being able
to say it in one sentence in an interview.
:::

## Mathematical Formulation

A process $(X_t)$ adapted to a filtration $(\mathcal F_t)$ is a martingale if:

:::formula {name="Martingale property" used-in="Derivatives, Pricing, Efficiency" note="Plus two technical conditions: adapted to the filtration, and integrable."}
\E\big[X_{t+1} \,\big|\, \mathcal{F}_t\big] = X_t \quad \text{for all } t
:::

with $\E[|X_t|] < \infty$ and $X_t$ being $\mathcal F_t$-measurable. The two one-sided variants:

| Type | Condition | Meaning | Example |
|---|---|---|---|
| Martingale | $\E[X_{t+1}\mid\mathcal F_t] = X_t$ | fair game | discounted price under $\Q$ |
| Submartingale | $\E[X_{t+1}\mid\mathcal F_t] \ge X_t$ | favourable | equity price under $\P$ |
| Supermartingale | $\E[X_{t+1}\mid\mathcal F_t] \le X_t$ | unfavourable | your P&L at a casino |

The theorem that does most of the work:

:::formula {name="Optional stopping theorem" used-in="Barrier Options, Gambler's Ruin, Risk of Ruin" note="Requires τ bounded, or X bounded, or a dominating integrable variable — the conditions are where the interesting failures live."}
\E[X_\tau] = \E[X_0] \quad \text{for a suitable stopping time } \tau
:::

And the result that makes martingales the natural language of limits:

:::formula {name="Martingale convergence theorem" used-in="Estimation, Bayesian Updating"}
\sup_t \E[|X_t|] < \infty \implies X_t \to X_\infty \text{ almost surely}
:::

## Derivation

:::derivation Gambler's ruin via optional stopping
A gambler starts at $k$, bets \$1 on fair flips, stops at $0$ or $N$. Wealth $X_n$ is a martingale
and $\tau = \min\{n : X_n \in \{0,N\}\}$ is a stopping time. The process is bounded in $[0,N]$, so
optional stopping applies:

$$k = \E[X_0] = \E[X_\tau] = 0\cdot\P(\text{ruin}) + N\cdot\P(\text{win})$$

$$\P(\text{reach } N \text{ before } 0) = \frac{k}{N}$$

A gambler with \$100 seeking \$1,000 against an infinitely wealthy house has a 10% chance. Against a
house with any edge at all, the probability decays exponentially in $N$ rather than linearly. This
single calculation is the foundation of every risk-of-ruin and drawdown-probability formula used in
position sizing.
:::

:::derivation Why X² − ⟨X⟩ is a martingale
For a martingale $X$ with increments $\Delta_t = X_{t+1}-X_t$:

$$\E[X_{t+1}^2 \mid \mathcal F_t] = \E[(X_t + \Delta_t)^2\mid\mathcal F_t]
= X_t^2 + 2X_t\underbrace{\E[\Delta_t \mid \mathcal F_t]}_{=0} + \E[\Delta_t^2\mid\mathcal F_t]$$

So $\E[X_{t+1}^2\mid\mathcal F_t] - X_t^2 = \E[\Delta_t^2\mid\mathcal F_t]$, which is non-negative
— hence the submartingale result. Defining the **quadratic variation**
$\langle X\rangle_t = \sum_{s<t}\E[\Delta_s^2\mid\mathcal F_s]$ removes exactly that drift and
restores the martingale property for $X_t^2 - \langle X\rangle_t$.

For [[brownian-motion]], $\langle W\rangle_t = t$, giving the martingale $W_t^2 - t$. This is the
seed of Itô's lemma: the second-order term does not vanish because quadratic variation accumulates
linearly in time rather than quadratically.
:::

## Assumptions & Edge Cases

:::assumption
- **Integrability** $\E|X_t|<\infty$ is required. Heavy-tailed processes may fail it.
- **The filtration matters.** A process can be a martingale with respect to one information set and
  not another. "Is it a martingale?" is incomplete without "with respect to what?"
- **Optional stopping needs a side condition.** Unbounded stopping times with unbounded processes —
  exactly the doubling strategy — break it. This is the single most-tested subtlety.
- **Martingale ≠ independent increments.** GARCH-type processes are martingales with strongly
  dependent volatility. Absence of predictable drift says nothing about predictable risk.
:::

:::warning
"Prices are martingales, therefore returns are unpredictable, therefore quant strategies cannot
work" is a chain of two errors. First, prices are martingales only under $\Q$, not $\P$. Second,
even under $\P$ the martingale property constrains only the conditional *mean* — volatility,
correlation, higher moments and cross-sectional relative value are all still forecastable, and most
systematic strategies live there.
:::

## Worked Example

A market maker quotes a binary event at 40¢. New information arrives and the fair value jumps to
55¢. Was the original quote wrong?

Not necessarily. If the price process is a martingale under the market's information filtration,
then before the news arrived, $\E[P_{t+1}\mid \mathcal F_t] = 0.40$. The news was an unpredictable
increment. Decompose it: suppose the news is either "positive" (probability $p$, price → 55) or
"negative" (probability $1-p$, price → $x$). The martingale property pins down the pair:

$$0.40 = p(0.55) + (1-p)x$$

If the market assessed $p = 0.5$, then $x = 0.25$. The 15¢ up-move was always paired with a
30¢ down-move at equal probability — the asymmetry is what makes the fair game fair.

**This is the correct way to interrogate a quote after the fact.** The question is never "did the
price move?" but "was the *distribution* of possible moves centred on the quote?" A market maker
whose realised moves are systematically upward is not unlucky; their quotes are biased.

## Why It Matters in Quant Finance

Martingales are the mathematical content of no-arbitrage:

**First Fundamental Theorem of Asset Pricing.** A market is arbitrage-free if and only if there
exists an equivalent martingale measure $\Q$ under which all discounted asset prices are
martingales. **Second FTAP.** The market is complete if and only if $\Q$ is unique.

Every derivative price is then a conditional expectation under $\Q$, and hedging is the martingale
representation theorem in disguise: any $\Q$-martingale can be written as a stochastic integral
against the underlying, and *that integrand is the hedge ratio* — the delta. Replication and
pricing are the same theorem viewed from two directions.

Downstream:

- **Efficient market hypothesis** in its weak form is the assertion that risk-adjusted excess
  returns are martingale differences.
- **Variance swaps** trade $\langle X\rangle_T$ directly, made tradeable by the $X^2 - \langle
  X\rangle$ decomposition.
- **Optimal execution** treats the unaffected price as a martingale so that the only thing the
  scheduler optimises is impact versus timing risk — otherwise you would be trading a directional
  view, not executing.
- **Risk of ruin and drawdown probability** come straight from optional stopping.

## Trading & Research Application

:::desk
**The doubling-down family.** Martingale grid systems, averaging down, and short-gamma carry trades
all manufacture a P&L distribution that looks like a martingale with a tiny probability of a
terminal loss. They show high win rates, high Sharpe on short samples, and a left tail that
eventually arrives. Recognising the structure — "am I being paid a small amount often to accept an
unbounded rare loss?" — is the practical skill that optional stopping formalises.

**Residual diagnostics.** After fitting a forecasting model, cumulative residuals should behave like
a driftless martingale. If they trend, the model is misspecified and the trend is free alpha you
have not captured. Plotting cumulative residuals is a two-minute check that catches a surprising
number of broken models.

**$\P$ versus $\Q$ discipline.** Risk management, position sizing and backtests live under $\P$.
Pricing and hedging live under $\Q$. Mixing them — for instance using risk-neutral implied
probabilities as forecasts of real-world outcomes — systematically overstates the probability of
bad states, because the difference between the measures *is* the risk premium.
:::

## Common Mistakes

:::pitfall
- **Forgetting the filtration.** "Is it a martingale?" is meaningless without "with respect to which
  information set?" A process can be a martingale under one filtration and not another.
- **Applying optional stopping without checking its conditions.** This is the doubling-strategy
  error, and its trading form — a strategy that never loses until it loses everything — is a real
  and recurring way to blow up a book.
- **Confusing $\P$ and $\Q$.** Discounted prices are martingales under the risk-neutral measure,
  not the real-world one. Using risk-neutral probabilities as forecasts overstates bad outcomes by
  exactly the risk premium.
- **Reading "martingale" as "unpredictable".** It constrains only the conditional *mean*. Volatility,
  correlation and higher moments remain forecastable, and most systematic strategies live there.
- **Assuming $X$ martingale $\Rightarrow$ $f(X)$ martingale.** Only affine $f$ preserves it; convex
  $f$ gives a submartingale by Jensen.
- **Wanting a martingale P&L.** You want a submartingale. It is the *residuals* that should be a
  martingale difference sequence.
:::

## 30-Second Revision

- $\E[X_{t+1}\mid\mathcal F_t] = X_t$ — fair game; best forecast of the future is the present.
- Sub- ($\ge$) and super- ($\le$) martingales are the favourable and unfavourable versions.
- Stock prices: submartingale under $\P$, discounted martingale under $\Q$. **FTAP**: no arbitrage
  $\iff$ an equivalent martingale measure exists.
- Optional stopping $\E[X_\tau]=\E[X_0]$ needs boundedness — the doubling strategy is the
  counterexample, and it is a real trading failure mode.
- $X$ martingale $\Rightarrow X^2$ submartingale (Jensen); $X^2 - \langle X\rangle$ is a martingale.
  For [[brownian-motion]], $W_t^2 - t$.
- Gambler's ruin: $\P(\text{reach } N \text{ from } k) = k/N$ in a fair game.
