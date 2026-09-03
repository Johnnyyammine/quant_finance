---
id: black-scholes-equation
title: The Black–Scholes Equation
subject: options
summary: Hedge an option with the underlying, watch the randomness cancel, and impose that what is left must earn the risk-free rate — the derivation that turns a model of the stock into a price for anything written on it, and explains why the expected return never appears.
difficulty: advanced
interview_relevance: 5
tags: [options, pricing, hedging, pde, replication, risk-neutral, no-arbitrage, gamma]
prerequisites: [itos-lemma]
related: [martingales, put-call-parity]
aliases: [Black-Scholes PDE, Black Scholes equation, BSM equation, delta hedging argument, replication argument]
updated: 2026-09-03
references:
  - title: "Black & Scholes (1973), *The Pricing of Options and Corporate Liabilities*"
    url: ""
  - title: "Merton (1973), *Theory of Rational Option Pricing*"
    url: ""
  - title: "Shreve, *Stochastic Calculus for Finance II*, ch. 4–5"
    url: ""
questions:
  - q: Derive the Black–Scholes PDE. Where exactly does μ disappear?
    difficulty: advanced
    tags: [core, derivation, replication]
    hint: Form a portfolio whose dW term is zero, then ask what such a portfolio must earn.
    a: |
      Take $\d S = \mu S\,\d t + \sigma S\,\d W$ and $V(t,S)$. Itô gives

      $$\d V = \left(V_t + \mu S V_S + \tfrac12\sigma^2S^2V_{SS}\right)\d t + \sigma S V_S\,\d W$$

      Form $\Pi = V - V_S\,S$. The $\d W$ terms are $\sigma SV_S$ from the option and
      $-V_S\cdot\sigma S$ from the hedge — they cancel **exactly**, and so does every $\mu$ term:

      $$\d\Pi = \left(V_t + \tfrac12\sigma^2S^2V_{SS}\right)\d t$$

      $\Pi$ is riskless over $\d t$, so no arbitrage forces $\d\Pi = r\Pi\,\d t$:

      $$\boxed{V_t + rSV_S + \tfrac12\sigma^2S^2V_{SS} = rV}$$

      **Where $\mu$ went:** it appears in the option's drift as $\mu SV_S$ and in the hedge's as
      $-V_S\cdot\mu S$. Both are multiplied by the *same* $V_S$, because the hedge ratio was chosen
      to kill the noise — and killing the noise necessarily kills the drift with it, since they
      enter $\d S$ together. Two people who disagree completely about $\mu$ agree on the option
      price, because both can run the same hedge.
  - q: Why is the expected return of the stock irrelevant to the option price? Give the economic version.
    difficulty: advanced
    tags: [risk-neutral, core, intuition]
    a: |
      **Mechanically:** the hedge that removes the risk removes the drift with it, as above.

      **Economically:** you are not being asked what the option is worth *to* you. You are being
      asked what it costs to manufacture. The option can be built out of stock and cash by a trading
      strategy, and the cost of running that strategy depends on how much the stock *moves*, not on
      where it ends up on average. A bullish view raises the value of the stock and of the hedge in
      exactly offsetting proportion.

      **The consequence that trips people:** a stock with $\mu = 30\%$ and one with $\mu = 3\%$, same
      $\sigma$, have identically priced options. If that felt wrong, the instinct being violated is
      "higher expected return should make a call worth more" — true for someone holding an
      unhedged call as a view, false for the price, because the price is set by whoever can hedge.

      Note this is a statement about a *complete* market. Where the payoff cannot be replicated —
      jumps, stochastic vol, an illiquid underlying — $\mu$ and risk preferences do come back.
  - q: What kind of PDE is it, and what does that tell you?
    difficulty: advanced
    tags: [pde, heat-equation, numerics]
    a: |
      A **backward parabolic** PDE — the heat equation in disguise. Substituting
      $S = Ke^x$, $t = T - 2\tau/\sigma^2$ and scaling $V$ turns it into $u_\tau = u_{xx}$ exactly.

      Three things follow:

      **1. It is solved backwards from the payoff.** The terminal condition $V(T,S) = \text{payoff}$
      is the data; you integrate back to $t=0$. Time runs the wrong way for a forward-diffusion
      intuition, which is why the substitution flips it.

      **2. It smooths.** Heat equations destroy irregularity instantly, so a kinked payoff becomes
      analytic for any $t < T$. This is why option prices are smooth even though payoffs are not,
      and why gamma is finite before expiry and unbounded at it.

      **3. It is the same equation for every payoff.** Only the terminal condition changes. Digitals,
      barriers, Asians and vanillas all solve the same PDE — which is what makes a single
      finite-difference engine price a whole book.
  - q: State the Feynman–Kac link and use it to write the price as an expectation.
    difficulty: advanced
    tags: [feynman-kac, risk-neutral, martingales]
    a: |
      Feynman–Kac says the solution of
      $V_t + rSV_S + \tfrac12\sigma^2S^2V_{SS} - rV = 0$ with $V(T,\cdot) = H$ is

      $$V(t,S) = \E^\Q\!\left[e^{-r(T-t)}H(S_T)\;\middle|\;S_t = S\right]$$

      where under $\Q$ the stock follows $\d S = rS\,\d t + \sigma S\,\d W^\Q$ — the same volatility,
      the drift replaced by $r$.

      **The two views are one theorem.** The PDE is the hedging argument; the expectation is the
      martingale argument; Feynman–Kac is the bridge. Practically you pick whichever is cheaper:
      PDE for low dimension, early exercise and Greeks; Monte Carlo under $\Q$ for high dimension
      and path dependence.

      **The standard trap:** $\Q$ is not anyone's belief about the world. It is a change of measure
      that makes discounted prices [[martingales|martingales]]. Nobody thinks stocks return $r$.
  - q: A colleague says "we should use a higher discount rate for the option because it is riskier than the stock." Respond.
    difficulty: advanced
    tags: [risk-neutral, discounting, misconception]
    a: |
      An option *is* riskier than the stock — a call is a leveraged position, with beta several times
      the underlying's. The colleague's premise is correct and the conclusion is still wrong.

      The reason: the correct risk-adjusted discount rate for an option is **not constant**. A call's
      beta changes continuously with spot, time and volatility, so there is no single rate to apply.
      Risk-neutral pricing sidesteps the problem entirely — it adjusts the *probabilities* rather
      than the discount rate, and then discounts everything at $r$.

      You can verify the two agree: compute a call's price by Black–Scholes, then compute
      $\E^\P[\text{payoff}]$ under the true measure and solve for the discount rate that reproduces
      the price. You get the option's correct risk-adjusted rate — a different number for every
      strike, maturity and spot level. Black–Scholes gives you that answer without ever needing to
      know $\mu$ or the market price of risk.
  - q: The derivation assumes continuous, costless rebalancing. What actually happens when you hedge discretely?
    difficulty: advanced
    tags: [hedging-error, gamma, transaction-costs, desk]
    a: |
      Hedging $n$ times over the life of the option leaves a residual P&L whose standard deviation
      scales as $n^{-1/2}$ — so halving the error costs four times the trades. Per step the error is
      the gamma term:

      $$\varepsilon = \tfrac12\Gamma\big[(\Delta S)^2 - \sigma^2S^2\Delta t\big]$$

      and it has **mean zero but non-zero variance**, so discrete hedging is unbiased and imprecise
      rather than wrong.

      Transaction costs run the other way, scaling as $n^{+1/2}$ (more trades, more spread paid).
      The two combine into a finite optimum: rebalance until marginal variance reduction equals
      marginal cost. In practice desks hedge on a delta *band* rather than a clock — trade when
      delta drifts outside a tolerance — which is the solution to the Whalley–Wilmott problem and
      strictly better than fixed-interval hedging.

      The honest summary: continuous hedging is a mathematical device, and the residual it hides is
      the desk's actual daily P&L.
  - q: Which assumption of the derivation does the volatility smile falsify?
    difficulty: advanced
    tags: [smile, assumptions, limitations]
    a: |
      **Constant $\sigma$ — and the market says so explicitly.** If Black–Scholes were right, one
      volatility would price every strike and maturity. Instead implied vol varies by strike (skew)
      and by maturity (term structure), which is the market's direct statement that the model is
      wrong in a specific way.

      What it is compensating for: real returns have fat left tails and jumps, and volatility is
      itself stochastic and negatively correlated with spot. Out-of-the-money puts must therefore
      cost more than a lognormal says, and the skew is that surcharge.

      **The deeper point:** the smile is not a flaw in the formula's arithmetic. It is the market
      pricing the failure of the *hedging argument* — with jumps, delta hedging cannot be made safe
      by trading faster, so the residual risk of being short a crash carries a genuine premium.
      Traders keep the formula and let $\sigma$ vary by strike, using it as a quoting convention
      rather than a belief.
---

## Intuition

The result that makes options tractable is not a formula. It is an argument, and it goes in three
steps.

**1. An option's randomness is the stock's randomness.** Both are driven by the same $\d W$. Itô's
lemma says the option moves with $\sigma SV_S\,\d W$ and the stock with $\sigma S\,\d W$. So a
position of $V_S$ shares has exactly the option's noise, with the opposite sign.

**2. So hold both, and the randomness is gone.** Long the option, short $V_S$ shares. Over the next
instant the portfolio has no exposure to $\d W$ whatsoever — it is riskless. Not approximately:
exactly, in this model.

**3. A riskless portfolio must earn the risk-free rate.** Otherwise borrow at $r$, buy it, and
collect the difference for free. Imposing that gives one equation, and that equation is
Black–Scholes.

:::insight
The trick is that **the hedge ratio was chosen to cancel the noise, and the noise and the drift enter
$\d S$ together.** Kill one and you kill the other. That single accident of algebra is why $\mu$ —
the expected return, the hardest quantity in finance to estimate — never appears in an option price.

You are not forecasting the stock. You are costing a manufacturing process.
:::

That reframing is the whole subject. An option is not a bet whose value depends on your view; it is
a product that can be assembled from stock and cash, and its price is the cost of assembly. The
assembly cost depends on how much the stock *wiggles* — because that is what forces you to
rebalance — and not at all on where it drifts.

## Mathematical Formulation

:::formula {name="The Black–Scholes equation" used-in="All Derivatives Pricing, PDE Methods" note="One equation for every payoff. Only the terminal condition changes — that is what makes a single finite-difference engine price a whole book."}
\frac{\partial V}{\partial t} + rS\frac{\partial V}{\partial S}
+ \frac{1}{2}\sigma^2S^2\frac{\partial^2 V}{\partial S^2} = rV
:::

:::formula {name="Greek form" used-in="Risk Management, Desk P&L" note="The same equation read as a P&L identity: theta plus gamma plus carry on the delta equals the financing cost of the position."}
\Theta + rS\Delta + \tfrac12\sigma^2S^2\Gamma = rV
:::

:::formula {name="Delta-hedged P&L" used-in="Gamma Trading, Volatility Arbitrage" note="What a hedged option actually earns over dt: pure convexity against the implied variance you paid for."}
\d\Pi = \tfrac12\Gamma\Big[(\d S)^2 - \sigma^2S^2\,\d t\Big]
:::

:::formula {name="Risk-neutral valuation (Feynman–Kac)" used-in="Monte Carlo, Exotics" note="Same content as the PDE. The drift becomes r; the volatility is unchanged. Q is a pricing device, not a belief."}
V(t,S) = \E^\Q\!\left[e^{-r(T-t)}H(S_T)\,\middle|\,S_t=S\right],
\qquad \d S = rS\,\d t + \sigma S\,\d W^\Q
:::

:::formula {name="Terminal and boundary conditions" used-in="Numerical Pricing" note="The PDE is universal; these select the instrument. Get them wrong and a perfect solver prices the wrong contract."}
V(T,S) = \max(S-K,0), \qquad V(t,0) = 0, \qquad V(t,S)\to S - Ke^{-r(T-t)} \text{ as } S\to\infty
:::

## Derivation

:::derivation The hedging argument, in full
**Model.** $\d S_t = \mu S_t\,\d t + \sigma S_t\,\d W_t$, with $r$ and $\sigma$ constant. Let
$V(t,S)$ be the value of a claim written on $S$.

**Step 1 — Itô on the option.** From [[itos-lemma]]:

$$\d V = \left(V_t + \mu SV_S + \tfrac12\sigma^2S^2V_{SS}\right)\d t + \sigma SV_S\,\d W$$

**Step 2 — form the hedged portfolio.** Hold one option and short $\Delta$ shares,
$\Pi = V - \Delta S$. Treating $\Delta$ as fixed over $[t, t+\d t]$ (this is the self-financing
condition — the hedge is set *before* the move, which is precisely why Itô rather than Stratonovich
is the right calculus here):

$$\d\Pi = \d V - \Delta\,\d S
= \left(V_t + \mu SV_S + \tfrac12\sigma^2S^2V_{SS} - \mu S\Delta\right)\d t
+ \sigma S(V_S - \Delta)\,\d W$$

**Step 3 — choose $\Delta$ to kill the noise.** Set $\Delta = V_S$. The $\d W$ coefficient vanishes
— and notice the $\mu$ terms, $\mu SV_S$ and $-\mu S\Delta$, cancel at the same moment and for the
same reason:

$$\d\Pi = \left(V_t + \tfrac12\sigma^2S^2V_{SS}\right)\d t$$

**Step 4 — no arbitrage.** $\d\Pi$ is deterministic over the interval, so $\Pi$ is a riskless
portfolio and must earn $r$:

$$\left(V_t + \tfrac12\sigma^2S^2V_{SS}\right)\d t = r\Pi\,\d t = r(V - SV_S)\,\d t$$

Rearranging:

$$V_t + rSV_S + \tfrac12\sigma^2S^2V_{SS} = rV$$

**Read the final equation as a sentence:** the option's time decay, plus the interest on the shares
you are short, plus the convexity gain from the stock's wiggling, must add up to the financing cost
of the option itself. Every term is a real cash flow on a desk.
:::

:::derivation The martingale route to the same equation
An alternative that generalises better. Discount the stock: $\tilde S_t = e^{-rt}S_t$. By Itô's
product rule (the $e^{-rt}$ factor is deterministic, so there is no cross-variation term):

$$\d\tilde S_t = e^{-rt}\big[(\mu - r)S_t\,\d t + \sigma S_t\,\d W_t\big]$$

This is a martingale exactly when $\mu = r$. Girsanov's theorem says we may change measure to $\Q$
under which $\d W^\Q_t = \d W_t + \frac{\mu-r}{\sigma}\d t$ is Brownian — the quantity
$\lambda = (\mu-r)/\sigma$ is the market price of risk, and it is exactly what gets absorbed. Under
$\Q$:

$$\d S_t = rS_t\,\d t + \sigma S_t\,\d W^\Q_t$$

The discounted option value $e^{-rt}V(t,S_t)$ is then also a martingale, so

$$V(t,S) = \E^\Q\!\left[e^{-r(T-t)}H(S_T)\mid S_t=S\right]$$

Applying Itô to $e^{-rt}V$ and setting the $\d t$ coefficient to zero — which is what "is a
martingale" means — returns the PDE. **The two derivations are the same theorem seen from two
sides:** the PDE view says *hedge it*, the martingale view says *change measure*, and Feynman–Kac
is the dictionary. The martingale route survives into settings where a PDE is unwieldy, which is
why it dominates modern treatments.
:::

:::derivation Reduction to the heat equation
Substitute $S = Ke^x$, $\tau = \tfrac12\sigma^2(T-t)$, and
$V = Ke^{\alpha x + \beta\tau}u(x,\tau)$ with $k = 2r/\sigma^2$,
$\alpha = -\tfrac12(k-1)$, $\beta = -\tfrac14(k+1)^2$. All first-order and zeroth-order terms
cancel and what remains is

$$\frac{\partial u}{\partial\tau} = \frac{\partial^2 u}{\partial x^2}$$

the heat equation on the whole line, whose solution by Gaussian convolution is textbook. Pushing the
call's terminal condition through the substitution and doing the Gaussian integral produces the
[[black-scholes-formula|Black–Scholes formula]] — the $N(d_1)$ and $N(d_2)$ appear as the two pieces
of that integral.

**Why this matters beyond the algebra:** it identifies option pricing as diffusion. Value diffuses
backwards from the payoff; irregularities smooth instantly, which is why a kinked payoff has a
smooth price; and the log substitution is the reason every practical finite-difference grid is built
in $\ln S$ rather than $S$.
:::

## Assumptions & Edge Cases

:::assumption
The derivation needs all of the following, and the market violates every one:

- **Continuous, costless trading** in arbitrary fractions of the stock.
- **Constant, known $\sigma$** — the assumption the smile falsifies most directly.
- **Continuous paths.** No jumps, no gaps, no overnight.
- **Constant, single $r$** for borrowing and lending, and unlimited shorting.
- **No dividends** in the basic form ($r \to r-q$ fixes this cleanly).
- **A frictionless, infinitely liquid market** with no price impact from your own hedging.
:::

:::warning
**Jumps break the argument, not just the formula.** Every other failed assumption degrades the answer
gracefully — discrete hedging adds variance, costs add a spread, dividends are a known adjustment.
Jumps are different in kind: the hedge portfolio is riskless only because the $\d W$ terms cancel
*to first order*, and a finite gap move is not first order. Trading faster does not help.

The residual $V(S+J) - V(S) - \Delta J$ is positive for a long-gamma position and negative for a
short one, whatever the direction of the jump. So being short options carries an unhedgeable loss
that no rebalancing frequency removes — which is the honest reason out-of-the-money puts trade above
their lognormal value, and why the skew is a risk premium rather than a mispricing.
:::

:::warning
**The formula's own hedge is what makes it self-consistent, so an unhedged position is not covered by
it.** A trader who buys an option because Black–Scholes says it is cheap, and then does not delta
hedge, has not put on the trade the model describes. Their P&L depends on $\mu$ — which the model
was specifically built to be independent of. Cheapness relative to a hedging model is only
realisable by hedging.
:::

## Worked Example

**Reading the equation as a desk P&L statement.** Long one at-the-money call: $S = 100$, $K = 100$,
$T = 0.25$, $\sigma = 20\%$, $r = 5\%$. The Greeks are $V = 4.6150$, $\Delta = 0.5695$,
$\Gamma = 0.03929$, $\Theta = -10.474$ per year.

Check the equation, per year:

| Term | Value | What it is |
|---|---|---|
| $\Theta$ | $-10.474$ | time decay you pay |
| $rS\Delta$ | $0.05\times100\times0.5695 = +2.847$ | interest earned on the short stock hedge |
| $\tfrac12\sigma^2S^2\Gamma$ | $0.5\times0.04\times10000\times0.03929 = +7.858$ | expected convexity gain |
| **Sum** | $\mathbf{+0.2307}$ | |
| $rV$ | $0.05\times4.6150 = 0.2307$ | financing the option |

**The identity is exact**, not approximate — the equation is not a rule of thumb about the Greeks,
it is a constraint they satisfy to machine precision. The structure it enforces: **theta is the rent
you pay for gamma**, adjusted by the interest on the hedge.

Now make it concrete daily, on the delta-hedged position. The hedged carry is
$(\Theta + rS\Delta)/252 = (-10.474 + 2.847)/252 = -\$0.0303$ a day, and the expected gamma gain is
$\tfrac12\Gamma\sigma^2S^2/252 = 7.858/252 = +\$0.0312$. They cancel to within $rV/252 = \$0.0009$,
which is precisely the cost of financing the premium — **if the stock realises exactly 20% vol.**

Realise 25% instead and gamma pays $\tfrac12(0.03929)(0.25^2)(100^2)/252 = \$0.0487$ against the same
carry: an excess of $\tfrac12\Gamma S^2(\sigma_r^2 - \sigma_i^2)/252 = \$0.0175$ a day, about 1.8
cents, made without any view on direction. That difference is the entire volatility-arbitrage
business, and the equation is where it comes from.

## Why It Matters in Quant Finance

**It converts a modelling problem into an engineering one.** Given a payoff and a terminal condition,
the price is the solution of a known parabolic PDE. Vanillas have a closed form; everything else is
a grid or a simulation. The same equation prices a digital, a barrier, a convertible bond and an
employee stock option — only the boundary data changes.

**It defines the Greeks as the terms of one identity.** $\Theta$, $\Delta$ and $\Gamma$ are not five
separate risk numbers invented for reporting; they are the coefficients in the equation, and the
equation says exactly how they trade off. A risk report that shows them in separate columns is
showing you one relationship taken apart.

**It is the template every later model extends.** Add a variance process and you get Heston; add
jumps and you get Merton or a Lévy model; make $\sigma$ a function of $(t,S)$ and you get Dupire
local volatility; make $r$ stochastic and you get the multi-factor rates models. Each is the same
three-step argument — Itô, hedge, no arbitrage — with more state variables and, crucially, an
incomplete market where the hedge no longer removes all risk.

**It tells you what completeness buys.** One source of noise and one tradable asset means perfect
replication, a unique price, and no role for preferences. Two sources of noise and one hedging
instrument means a range of arbitrage-free prices and a genuine market price of risk to estimate.
Almost everything hard in derivatives comes from that gap.

## Trading & Research Application

:::desk
**Theta is rent on gamma, and the equation prices the rent.** A long option position pays theta every
day and is compensated by realised movement. The break-even daily move is $\sigma S\sqrt{\d t}$.
Every gamma trader carries that number for their book, and the equation is where it comes from.

**Hedge on a band, not a clock.** Discrete hedging error falls as $n^{-1/2}$ while costs rise as
$n^{1/2}$; the optimum is finite. The practical implementation is a delta tolerance — rebalance when
delta leaves the band — which dominates fixed-interval hedging for the same cost.

**Vol arbitrage is a bet on the gamma term.** Buy the option at implied $\sigma_i$, hedge, and you
earn $\tfrac12\Gamma[(\d S)^2 - \sigma_i^2S^2\d t]$ integrated over the life. If realised beats
implied you win, and the direction of the stock never enters — provided you actually hedge, and
provided nothing gaps.

**Where you cannot hedge, do not trust the price.** The model's authority comes entirely from the
replication argument. In an illiquid underlying, a name that gaps, or a position too large to
rebalance without moving the market, the price is an indication and the residual risk is yours.
Reserve capital against that rather than against the model's confidence interval.

**Use the equation as a consistency check on a book.** Aggregate $\Theta + rS\Delta +
\tfrac12\sigma^2S^2\Gamma - rV$ across positions; it should be near zero on a book marked
consistently. A large residual means someone's marks, dividends or rate curve disagree with someone
else's.
:::

## Implementation Notes

```python
import numpy as np

def crank_nicolson_call(S_max, K, r, sigma, T, M=400, N=400):
    """Solve the Black-Scholes PDE on a log-S grid.

    Two choices that matter more than the scheme:
      1. Grid in x = ln(S). The PDE has constant coefficients there (the S and
         S^2 factors are exactly what the log substitution removes), so the
         matrix is tridiagonal-Toeplitz and the truncation error is uniform
         instead of concentrated near S = 0.
      2. Put a grid NODE on the strike. The payoff kink between nodes is the
         single largest error source in a vanilla PDE price, and it shows up as
         oscillating gamma near the strike rather than as an obvious price error.
    """
    x_min, x_max = np.log(K) - 5 * sigma * np.sqrt(T), np.log(K) + 5 * sigma * np.sqrt(T)
    x = np.linspace(x_min, x_max, M + 1)
    dx, dt = x[1] - x[0], T / N
    V = np.maximum(np.exp(x) - K, 0.0)                     # terminal condition

    a = 0.5 * sigma**2
    b = r - 0.5 * sigma**2                                  # log-space drift
    lower = dt * (a / dx**2 - b / (2 * dx))
    diag = dt * (-2 * a / dx**2 - r)
    upper = dt * (a / dx**2 + b / (2 * dx))

    for _ in range(N):                                      # march backwards
        V[1:-1] = V[1:-1] + 0.5 * (lower * V[:-2] + diag * V[1:-1] + upper * V[2:])
        V[0] = 0.0                                          # S -> 0
        V[-1] = np.exp(x[-1]) - K * np.exp(-r * dt)         # S -> infinity
    return x, V

def hedge_simulation(S0, K, r, sigma, T, n_hedges, n_paths, rng):
    """Discretely delta-hedge a short call and return the terminal P&L.

    The point of running this: the mean is ~0 (the model is right) but the
    standard deviation is NOT, and it falls only as n_hedges**-0.5. That spread
    is the desk's real daily P&L, and it is invisible in the closed-form price."""
    dt = T / n_hedges
    S = np.full(n_paths, float(S0))
    cash = np.zeros(n_paths)
    delta = np.zeros(n_paths)
    for i in range(n_hedges):
        tau = T - i * dt
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * tau) / (sigma * np.sqrt(tau))
        new_delta = 0.5 * (1 + np.vectorize(np.math.erf)(d1 / np.sqrt(2)))
        cash -= (new_delta - delta) * S                     # buy/sell the hedge
        delta = new_delta
        cash *= np.exp(r * dt)                              # finance it
        S *= np.exp((r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * rng.standard_normal(n_paths))
    return cash + delta * S - np.maximum(S - K, 0.0)
```

## Common Mistakes

:::pitfall
- **Looking for $\mu$ in the answer.** It cancels. If it appears, the hedge ratio was not $V_S$ or
  the portfolio was not self-financing.
- **Thinking $\Q$ is a forecast.** It is a change of measure that makes discounted prices
  martingales. Nobody believes stocks return $r$.
- **Treating $\Delta$ as constant inside the derivation's interval, then forgetting it is not.**
  Over $\d t$ it is fixed; over a day it moves, and that movement is gamma — the source of the
  hedging error the derivation assumes away.
- **Discounting an option at a risk-adjusted rate.** Its beta is not constant, so there is no such
  single rate. Adjust the probabilities instead.
- **Believing faster hedging removes all risk.** True for diffusion, false for jumps. This is the
  assumption the skew is priced against.
- **Applying the equation to an underlying you cannot trade** — an index you cannot short, a
  temperature, a realised volatility. Without a tradable hedge there is no replication and no unique
  price.
- **Solving the PDE on a grid in $S$ with the strike between nodes.** Both choices degrade gamma near
  the strike badly, and the price error is small enough that it is easy to miss.
- **Quoting "the Black–Scholes price" of an exotic without saying which boundary conditions.** The
  PDE is shared; the contract is entirely in the terminal and boundary data.
:::

## 30-Second Revision

- $V_t + rSV_S + \tfrac12\sigma^2S^2V_{SS} = rV$. Backward parabolic; the heat equation after
  $S=Ke^x$.
- Derivation: Itô on $V$; hedge $\Delta = V_S$ to cancel $\d W$; a riskless portfolio must earn $r$.
- $\mu$ vanishes because the hedge that kills the noise kills the drift with it. Price is the cost of
  manufacture, not the value of a view.
- Greek form: $\Theta + rS\Delta + \tfrac12\sigma^2S^2\Gamma = rV$ — theta is rent on gamma.
- Feynman–Kac: $V = \E^\Q[e^{-r(T-t)}H]$ with drift $r$. PDE view and martingale view are one
  theorem.
- Same PDE for every payoff; the contract lives entirely in the terminal and boundary conditions.
- Delta-hedged P&L $=\tfrac12\Gamma[(\d S)^2 - \sigma^2S^2\d t]$: long realised vol, short implied.
- Discrete hedging error falls as $n^{-1/2}$, costs rise as $n^{1/2}$ — hedge on a delta band.
- The smile falsifies constant $\sigma$; jumps falsify the hedging argument itself, and that is what
  the skew charges for.
