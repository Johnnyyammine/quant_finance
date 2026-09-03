---
id: itos-lemma
title: Itô's Lemma
subject: stochastic-processes
summary: The chain rule for functions of a diffusion — a second-order term survives because the squared Brownian increment equals dt, and that surviving term is every convexity effect in finance, from gamma P&L to volatility drag.
difficulty: advanced
interview_relevance: 5
tags: [stochastic-processes, ito, quadratic-variation, convexity, gamma, pricing, diffusion]
prerequisites: [brownian-motion]
related: [martingales, variance]
aliases: [Ito's lemma, Ito lemma, Itô formula, stochastic chain rule, Ito calculus]
updated: 2026-09-03
references:
  - title: "Shreve, *Stochastic Calculus for Finance II*, ch. 4"
    url: ""
  - title: "Øksendal, *Stochastic Differential Equations*, ch. 4"
    url: ""
  - title: "Baxter & Rennie, *Financial Calculus*, ch. 3"
    url: ""
questions:
  - q: State Itô's lemma and say in one sentence why it differs from the ordinary chain rule.
    difficulty: intermediate
    tags: [core, quadratic-variation]
    hint: Which term in the Taylor expansion is second order in dt for a smooth path but first order for a diffusion?
    a: |
      For $\d X_t = \mu\,\d t + \sigma\,\d W_t$ and $f(t,x)$ twice differentiable in $x$:

      $$\d f(t,X_t) = \left(f_t + \mu f_x + \tfrac12\sigma^2 f_{xx}\right)\d t + \sigma f_x\,\d W_t$$

      **Why it differs:** Brownian motion has non-zero quadratic variation, so
      $(\d W_t)^2 = \d t$ rather than $O(\d t^2)$. The second-order Taylor term is therefore
      *first order in time* and cannot be discarded. Ordinary calculus drops it; Itô calculus keeps
      it as $\tfrac12\sigma^2 f_{xx}$.

      Everything distinctive about derivatives pricing lives in that one term. It is the
      $-\sigma^2/2$ in lognormal returns, the $\tfrac12\sigma^2S^2\Gamma$ in the Black–Scholes PDE,
      the reason a variance swap has value, and the reason a delta-hedged option is not a flat
      position.
  - q: Apply Itô's lemma to f(S) = ln S under GBM. What do you get and what does the extra term mean?
    difficulty: intermediate
    tags: [gbm, lognormal, volatility-drag, core]
    a: |
      With $\d S = \mu S\,\d t + \sigma S\,\d W$, $f' = 1/S$, $f'' = -1/S^2$, and
      $(\d S)^2 = \sigma^2S^2\,\d t$:

      $$\d(\ln S) = \frac{\d S}{S} - \frac12\frac{(\d S)^2}{S^2}
      = \left(\mu - \frac{\sigma^2}{2}\right)\d t + \sigma\,\d W$$

      **The meaning:** $\mu$ is the *arithmetic* expected return, $\mu - \sigma^2/2$ the
      *logarithmic* one. The gap is volatility drag — Jensen's inequality made dynamic, forced by
      the concavity of $\ln$ meeting non-zero quadratic variation. It is not a modelling choice.

      Practical consequences: a fund with $+10\%$ expected return and $60\%$ vol compounds at
      $10 - 18 = -8\%$; leveraged ETFs decay; and the median terminal price sits below the mean.
      Getting the sign wrong here is the most common Monte Carlo bug in derivatives code.
  - q: Show that S_t = S_0 exp[(μ − σ²/2)t + σW_t] solves dS = μS dt + σS dW.
    difficulty: advanced
    tags: [sde, verification]
    a: |
      Write $S_t = f(t, W_t)$ with $f(t,x) = S_0\exp[(\mu-\tfrac{\sigma^2}{2})t + \sigma x]$. Then
      $f_t = (\mu - \tfrac{\sigma^2}{2})f$, $f_x = \sigma f$, $f_{xx} = \sigma^2 f$. Itô's lemma for
      a function of $t$ and $W_t$ ($\mu_W = 0$, $\sigma_W = 1$) gives

      $$\d S = \left(f_t + \tfrac12 f_{xx}\right)\d t + f_x\,\d W
      = \left[\left(\mu - \tfrac{\sigma^2}{2}\right) + \tfrac{\sigma^2}{2}\right]S\,\d t + \sigma S\,\d W
      = \mu S\,\d t + \sigma S\,\d W$$

      The $-\sigma^2/2$ in the exponent is *exactly* what the $+\tfrac12 f_{xx}$ term produces, so
      they cancel and leave the drift $\mu$. That cancellation is the reason the correction appears
      in the solution at all: it is there so the arithmetic drift comes out right.
  - q: A delta-hedged long call position. Use Itô to write down its P&L over dt and read off the trade.
    difficulty: advanced
    tags: [gamma, hedging, theta, desk]
    hint: The hedge kills the dW term. What is left?
    a: |
      Portfolio $\Pi = V(t,S) - \Delta S$ with $\Delta = V_S$. Itô on $V$:

      $$\d\Pi = \left(V_t + \tfrac12\sigma^2S^2V_{SS}\right)\d t
      + \underbrace{(V_S - \Delta)}_{=\,0}\,\d S$$

      The $\d W$ exposure is gone by construction. What remains is **theta plus gamma**. Replacing
      the realised move $(\d S)^2$ with what actually happens rather than the model's
      $\sigma^2S^2\d t$:

      $$\d\Pi = \tfrac12\Gamma\Big[(\d S)^2 - \sigma_{\text{imp}}^2S^2\,\d t\Big]$$

      **The trade:** long an option and delta-hedged, you are long realised variance and short
      implied. You make money if the stock moves more than the vol you paid for, lose if it moves
      less, and your direction is irrelevant. This single line is the entire economics of gamma
      scalping, and it is why option traders quote positions in vol rather than in price.
  - q: When does Itô's lemma NOT apply, and what replaces it?
    difficulty: advanced
    tags: [jumps, assumptions, limitations]
    a: |
      Three failure modes, each with a different fix:

      **1. $f$ is not $C^2$.** A vanilla payoff $\max(S-K,0)$ has no second derivative at the
      strike — gamma is a delta function there. The fix is the Itô–Tanaka formula, which replaces
      $\tfrac12 f''\,\d t$ with a local-time term. Practically this is why gamma explodes near
      expiry at the strike and why pinning risk exists.

      **2. The process jumps.** For $\d S = \mu S\,\d t + \sigma S\,\d W + S\,\d J$, the Taylor
      expansion cannot be truncated: a jump moves $S$ by a finite amount, so *all* orders matter.
      Itô's lemma for semimartingales adds a compensated sum over jumps,
      $\sum [f(S_{t}) - f(S_{t^-})]$. The consequence that matters: **you cannot hedge a jump by
      trading faster.** Delta hedging is exact only in the continuous limit.

      **3. Infinite quadratic variation.** Fractional Brownian motion with $H \ne 1/2$ has no
      finite $\langle X\rangle$, so the whole construction fails; rough volatility models
      ($H \approx 0.1$) live here and need different machinery.

      A good answer names case 2 unprompted — it is the honest limitation of the Black–Scholes
      hedging argument and the reason the volatility skew exists.
  - q: Two assets, dS_i = μ_i S_i dt + σ_i S_i dW_i with corr(dW_1, dW_2) = ρ. What is d(S_1 S_2)?
    difficulty: advanced
    tags: [multivariate, correlation, cross-variation]
    a: |
      The multidimensional Itô lemma adds cross-variation terms
      $\d W_1\,\d W_2 = \rho\,\d t$. For $f = xy$: $f_x = y$, $f_y = x$, $f_{xy} = 1$,
      $f_{xx} = f_{yy} = 0$:

      $$\d(S_1S_2) = S_2\,\d S_1 + S_1\,\d S_2 + \d S_1\,\d S_2
      = S_1S_2\Big[(\mu_1 + \mu_2 + \rho\sigma_1\sigma_2)\d t + \sigma_1\d W_1 + \sigma_2\d W_2\Big]$$

      Note the ordinary product rule *plus* $\d S_1\d S_2$ — the Itô correction. So a product of two
      lognormals is lognormal with a drift that depends on $\rho$: the correlation is not a
      second-order detail, it shifts the expected value.

      This is exactly the machinery behind quanto adjustments, the drift correction when changing
      numéraire, and why a basket option is not a portfolio of options.
---

## Intuition

Ordinary calculus says: to first order, a smooth function of a smooth path moves by
$f'(x)\,\d x$. The second-order term $\tfrac12 f''(\d x)^2$ is negligible because for a smooth path
$\d x \sim \d t$ and so $(\d x)^2 \sim (\d t)^2$ — vanishingly small.

A Brownian path is not smooth. It moves $\d W \sim \sqrt{\d t}$, so
$(\d W)^2 \sim \d t$ — the *same* order as the first-order term in time. The second-order term
refuses to vanish. Itô's lemma is nothing more than a Taylor expansion in which you keep it:

$$\d f = \underbrace{f'\,\d W}_{\text{ordinary}} + \underbrace{\tfrac12 f''\,\d t}_{\text{survives because }(\d W)^2=\d t}$$

Everything else is bookkeeping.

:::insight
Read Itô's lemma as a statement about **convexity, not calculus**. A convex function of a random
variable gains from volatility ($\tfrac12 f'' > 0$); a concave one loses. The $\tfrac12 f''$ term
is the rate at which that happens per unit of variance. So Itô's lemma is Jensen's inequality
turned into a differential equation — and the reason a trader with positive gamma is happy when
markets move and a lender with concave payoff is not.
:::

The three facts worth carrying:

1. **$(\d W)^2 = \d t$.** Not approximately: the quadratic variation of Brownian motion over
   $[0,T]$ is $T$ almost surely.
2. **$(\d t)^2$ and $\d t\,\d W$ still vanish**, being $O(\d t^2)$ and $O(\d t^{3/2})$.
3. **Only one extra term appears**, and it is deterministic — which is precisely what makes hedging
   possible: the randomness stays in $f'\,\d W$, where a position in the underlying can cancel it.

## Mathematical Formulation

Let $X_t$ be an Itô process, $\d X_t = \mu(t,X_t)\,\d t + \sigma(t,X_t)\,\d W_t$, and let
$f(t,x)$ be once continuously differentiable in $t$ and twice in $x$.

:::formula {name="Itô's lemma" used-in="Options, Derivatives, Hedging, Rates" note="The ½σ²f_xx term is the whole difference from ordinary calculus, and the source of every convexity effect in finance."}
\d f(t,X_t) = \left(\frac{\partial f}{\partial t} + \mu\frac{\partial f}{\partial x}
+ \frac{1}{2}\sigma^2\frac{\partial^2 f}{\partial x^2}\right)\d t
+ \sigma\frac{\partial f}{\partial x}\,\d W_t
:::

The mnemonic form is a Taylor expansion with one substitution rule:

:::formula {name="Itô multiplication table" used-in="Stochastic Calculus" note="Everything follows from (dW)² = dt. The other three products are higher order and vanish."}
(\d W_t)^2 = \d t, \qquad \d t\,\d W_t = 0, \qquad (\d t)^2 = 0
:::

Applied to geometric Brownian motion, which is the case Black–Scholes needs:

:::formula {name="Itô's lemma under GBM" used-in="Black–Scholes, Option Pricing" note="Written in terms of S rather than W: this is the form that produces the Black–Scholes PDE."}
\d f(t,S_t) = \left(f_t + \mu S f_S + \tfrac12\sigma^2S^2 f_{SS}\right)\d t + \sigma S f_S\,\d W_t
:::

:::formula {name="Multidimensional Itô" used-in="Baskets, Quantos, Multi-factor Models" note="Cross terms use dW_i dW_j = ρ_ij dt. Correlation enters the drift, not just the variance."}
\d f = \left(f_t + \sum_i \mu_i f_{x_i} + \tfrac12\sum_{i,j}\rho_{ij}\sigma_i\sigma_j f_{x_ix_j}\right)\d t
+ \sum_i \sigma_i f_{x_i}\,\d W_i
:::

## Derivation

:::derivation Itô's lemma from a Taylor expansion
Expand $f(t + \d t, X_{t+\d t})$ about $(t, X_t)$, keeping every term up to order $\d t$:

$$\d f = f_t\,\d t + f_x\,\d X + \tfrac12 f_{xx}(\d X)^2 + \tfrac12 f_{tt}(\d t)^2 + f_{tx}\,\d t\,\d X + \cdots$$

Now count orders using $\d X = \mu\,\d t + \sigma\,\d W$ and $\d W \sim \sqrt{\d t}$:

| Term | Order | Keep? |
|---|---|---|
| $f_t\,\d t$ | $\d t$ | yes |
| $f_x\,\mu\,\d t$ | $\d t$ | yes |
| $f_x\,\sigma\,\d W$ | $\sqrt{\d t}$ | yes — this is the noise |
| $\tfrac12 f_{xx}\sigma^2(\d W)^2$ | $\d t$ | **yes — the Itô term** |
| $\tfrac12 f_{xx}\mu^2(\d t)^2$ | $\d t^2$ | no |
| $f_{xx}\mu\sigma\,\d t\,\d W$ | $\d t^{3/2}$ | no |
| $\tfrac12 f_{tt}(\d t)^2$, $f_{tx}\d t\,\d X$ | $\ge \d t^{3/2}$ | no |

Substituting $(\d W)^2 = \d t$ into the fourth row and collecting the survivors gives the lemma.
The whole content of the theorem is the single row in bold: a term that ordinary calculus discards
as second order is, for a diffusion, first order in time.

Making this rigorous means proving that $\sum(\Delta W_i)^2 \to t$ in $L^2$ (see
[[brownian-motion]]) and that the remainder terms converge to zero uniformly — but the accounting
above is the whole idea, and it is what an interviewer wants to hear.
:::

:::derivation Where the ½ comes from, and why it is not arbitrary
The coefficient is the $\tfrac12$ of the second-order Taylor coefficient $f''/2!$ — nothing more
exotic. But its *financial* meaning is worth stating: consider $f$ convex and a symmetric move
$\pm h$ in $X$. The average of $f(X+h)$ and $f(X-h)$ exceeds $f(X)$ by

$$\tfrac12\big[f(X+h) + f(X-h)\big] - f(X) = \tfrac12 f''(X)h^2 + O(h^4)$$

Substituting $h^2 = \E[(\Delta X)^2] = \sigma^2\Delta t$ gives $\tfrac12\sigma^2f''\Delta t$
per unit time. So the Itô term is exactly the **expected gain from convexity per unit of
variance** — which is why a long-gamma position earns it and a short-gamma position pays it.

Contrast Stratonovich integration, which uses the midpoint rather than the left endpoint and
produces no correction term. Finance uses Itô because the left endpoint means *the hedge ratio is
set before the move happens* — a non-anticipating strategy, which is the only kind you can trade.
:::

:::derivation Itô's product rule
For two Itô processes, apply the two-dimensional lemma to $f(x,y) = xy$:

$$\d(X_tY_t) = X_t\,\d Y_t + Y_t\,\d X_t + \d X_t\,\d Y_t$$

The first two terms are the ordinary product rule; the third is new. With
$\d X = \sigma_X\d W_X$, $\d Y = \sigma_Y\d W_Y$ and $\d W_X\d W_Y = \rho\,\d t$, that third term
is $\rho\sigma_X\sigma_Y\,\d t$.

This is the workhorse behind every change of numéraire. Discounted price
$\tilde S_t = e^{-rt}S_t$: with $X_t = e^{-rt}$ deterministic, $\d X\,\d S = 0$ and

$$\d\tilde S_t = e^{-rt}\big[(\mu - r)S_t\,\d t + \sigma S_t\,\d W_t\big]$$

which is a [[martingales|martingale]] exactly when $\mu = r$ — the risk-neutral drift, obtained
here with no economics at all, purely from Itô's product rule.
:::

## Assumptions & Edge Cases

:::assumption
Itô's lemma needs three things, each of which fails somewhere that matters:

- **$f \in C^{1,2}$.** Twice differentiable in the state variable. Vanilla payoffs are not: $\max(S-K,0)$
  has a kink at $K$.
- **Continuous paths of finite quadratic variation.** No jumps, and $\langle X\rangle_t$ finite.
- **Adapted, left-endpoint integration.** The integrand $f_x$ must be known before the increment
  arrives — otherwise there is no lemma and no hedge.
:::

:::warning
**The kink is not a technicality.** At expiry a call's gamma is a delta function at the strike, so
the Itô term is unbounded there. That is not a mathematical curiosity: it is why a market maker
short a large strike into expiry faces pinning risk, why gamma hedging becomes impossible in the
last hours, and why "gamma" quoted for a near-expiry at-the-money option is nearly meaningless as
a risk number. The Itô–Tanaka formula handles it properly with a local-time term, but on a desk
the answer is to reduce the position, not to reach for better mathematics.
:::

:::warning
**Jumps break hedging, not just the formula.** In the continuous model, delta hedging error goes to
zero as you rebalance faster. With jumps it does not — a gap move produces a loss of
$V(S+J) - V(S) - \Delta J$ no matter how fast you trade, and for a long-gamma position that is a
*gain*, for a short-gamma position a loss that no rebalancing frequency reduces. This asymmetry is
the honest reason out-of-the-money puts trade above their Black–Scholes value.
:::

## Worked Example

**A stock at \$100, $\sigma = 30\%$, and a call with $\Gamma = 0.04$ per \$1².** The market prices
30% vol. Over one day the stock moves \$3. What did a delta-hedged long call earn?

Implied variance charged for the day:

$$\sigma^2S^2\,\d t = 0.30^2 \times 100^2 \times \tfrac{1}{252} = 3.571$$

Realised squared move: $(\d S)^2 = 3^2 = 9$.

$$\d\Pi = \tfrac12\Gamma\big[(\d S)^2 - \sigma^2S^2\,\d t\big]
= \tfrac12 (0.04)(9 - 3.571) = \$0.109$$

**Profit of about 11 cents, and the direction of the \$3 move never entered the calculation.** The
break-even daily move is $\sigma S\sqrt{\d t} = 0.30\times100/\sqrt{252} = \$1.89$: move more than
that and gamma pays for theta, move less and theta wins.

Now run the same day at a \$1 move: $\tfrac12(0.04)(1 - 3.571) = -\$0.051$. Same position, same
gamma, opposite sign — because a delta-hedged option is a position in *variance*, and variance is
the only thing it is a position in.

## Why It Matters in Quant Finance

Itô's lemma is the single lemma that turns a model of the underlying into a model of everything
written on it. Three uses dominate.

**1. It produces the pricing PDE.** Apply Itô to $V(t,S)$, form the hedged portfolio
$\Pi = V - V_S\,S$, observe that the $\d W$ terms cancel, and impose that a riskless portfolio must
earn $r$. What drops out is the [[black-scholes-equation|Black–Scholes equation]]. No distributional
assumption about the payoff is needed — only Itô plus no arbitrage.

**2. It changes measure.** The product rule shows that $e^{-rt}S_t$ is a martingale exactly when the
drift is $r$. That is the risk-neutral world: prices are expectations under $\Q$, and Itô is how you
verify that a candidate process has the martingale property you claimed.

**3. It quantifies convexity everywhere, not just in options.**

| Instrument | Convexity term | Consequence |
|---|---|---|
| Long option | $+\tfrac12\Gamma\sigma^2S^2$ | gamma P&L, long realised vol |
| Bond | $+\tfrac12 C\sigma_y^2$ | convexity gain, DV01 is not enough |
| Log wealth | $-\tfrac12\sigma^2$ | volatility drag, the Kelly penalty |
| Variance swap | $\int \d\langle \ln S\rangle$ | replicated by a strip of options |
| Leveraged ETF | $-\tfrac12 k(k{-}1)\sigma^2$ | daily-rebalance decay |

That table is one lemma applied five times. The [[kelly-criterion]] penalty $-\sigma^2/2$ and the
gamma of an option are *the same term* — the first for a concave function of wealth, the second for
a convex function of price.

## Trading & Research Application

:::desk
**Quote in vol, not in price.** The Itô decomposition of a delta-hedged option contains no $\d S$
and no $\mu$ — only $\Gamma$ and variance. Since your P&L does not depend on direction, neither
should your language. This is why an options desk trades "35 vol" and not "\$4.20".

**Break-even move is the number to carry.** $\sigma S\sqrt{\d t}$ is the daily move at which gamma
exactly pays theta. Long gamma and the stock is quieter than that, you are bleeding; short gamma
and it is livelier, you are bleeding. Everything else is second order.

**Convexity is a position even when you did not intend one.** A bond portfolio matched on duration
is still short or long convexity; a fund reporting arithmetic returns while compounding
geometrically is short $\sigma^2/2$; a strategy that rebalances to constant leverage is short
gamma. Itô's lemma is how you find the convexity you are carrying by accident.

**Where the model is wrong, be short the assumption, not the instrument.** The lemma assumes
continuity. Every crisis is a jump. Selling out-of-the-money puts at a flat vol is selling exactly
the term Itô cannot see — which is why that trade looks profitable for years and then is not.
:::

## Implementation Notes

```python
import numpy as np

def gbm_paths(s0, mu, sigma, T, steps, paths, seed=0):
    """Exact GBM via the Itô solution rather than an Euler step on dS.

    Euler on dS = mu*S*dt + sigma*S*dW is biased at any practical dt and can go
    negative; the log form is exact for every dt because Itô gives the closed
    solution. Note (mu - 0.5*sigma**2): that IS the Itô term, and dropping it is
    the single most common bug in derivatives simulation code."""
    rng = np.random.default_rng(seed)
    dt = T / steps
    dW = rng.standard_normal((paths, steps)) * np.sqrt(dt)
    log_path = np.cumsum((mu - 0.5 * sigma**2) * dt + sigma * dW, axis=1)
    return s0 * np.exp(np.hstack([np.zeros((paths, 1)), log_path]))

def hedge_pnl(prices, gamma, sigma, dt):
    """P&L of a delta-hedged option: the Itô term, realised against implied.

    Returns the per-step 0.5*Gamma*[(dS)^2 - sigma^2 S^2 dt]. Summed over a path
    this is the realised-vs-implied variance trade, which is the entire economics
    of the position -- the direction of the moves never appears."""
    ds = np.diff(prices)
    implied = sigma**2 * prices[:-1]**2 * dt
    return 0.5 * gamma * (ds**2 - implied)

# Sanity check that catches the missing Itô term:
#   gbm_paths(...)[:, -1].mean() -> s0 * exp(mu * T)      (arithmetic drift)
#   np.log(gbm_paths(...)[:, -1]).mean() -> log(s0) + (mu - sigma**2/2) * T
# If the first one comes out as exp((mu - sigma**2/2)*T), the correction was
# applied twice.
```

## Common Mistakes

:::pitfall
- **Using the ordinary chain rule.** $\d(S^2) = 2S\,\d S$ is wrong; it is
  $2S\,\d S + (\d S)^2 = (2\mu + \sigma^2)S^2\d t + 2\sigma S^2\d W$. The missing $\sigma^2$ term is
  the entire point.
- **Applying $-\sigma^2/2$ twice**, or not at all, when moving between arithmetic and log drift.
  Check with $\E[S_T] = S_0e^{\mu T}$.
- **Forgetting cross terms** in the multivariate case. $\d W_1\d W_2 = \rho\,\d t$ shifts the
  *drift* of a product, not just its variance — which is why quanto and basket pricing need it.
- **Assuming the lemma survives a kink.** Vanilla payoffs are not $C^2$ at the strike; near expiry
  this is a live risk, not a footnote.
- **Believing faster hedging removes the risk.** True in the continuous model, false with jumps.
  The residual is exactly what the skew is charging for.
- **Quoting gamma without a horizon.** $\tfrac12\Gamma\sigma^2S^2$ has units of currency per unit
  time; a gamma number with no $\d t$ attached cannot be compared to a theta number.
- **Reaching for Itô when the function is deterministic in $t$ only.** If $f$ has no $x$-dependence
  there is no correction, and writing one anyway signals the mechanics were memorised rather than
  understood.
:::

## 30-Second Revision

- $\d f = (f_t + \mu f_x + \tfrac12\sigma^2f_{xx})\d t + \sigma f_x\,\d W$.
- The one new term exists because $(\d W)^2 = \d t$; $\d t\,\d W$ and $(\d t)^2$ vanish.
- $\tfrac12 f''$ is convexity — Jensen's inequality per unit of variance.
- $\ln S$ under GBM: drift $\mu - \sigma^2/2$. That gap is volatility drag.
- Product rule gains a term: $\d(XY) = X\d Y + Y\d X + \d X\,\d Y$, with $\d W_1\d W_2 = \rho\,\d t$.
- Delta-hedged option P&L $= \tfrac12\Gamma[(\d S)^2 - \sigma^2S^2\d t]$: long realised vol, short
  implied, direction irrelevant. Break-even daily move $= \sigma S\sqrt{\d t}$.
- Hedge the $\d W$ term away and what is left must earn $r$ — that step is Black–Scholes.
- Fails on kinks (Itô–Tanaka), on jumps (semimartingale form; unhedgeable), and on infinite
  quadratic variation (rough vol).
