---
id: black-scholes-formula
title: Black–Scholes Formula
subject: options
summary: The closed-form price of a European call and put — two probability-weighted terms whose meaning is often garbled, a formula nobody believes literally, and the quoting language of the entire options market.
difficulty: advanced
interview_relevance: 5
tags: [options, pricing, implied-volatility, lognormal, smile, european, moneyness]
prerequisites: [black-scholes-equation, put-call-parity]
related: [option-greeks, expectation]
aliases: [Black-Scholes, BSM formula, Black Scholes Merton, N(d1) N(d2), Black-76, vanilla option price]
updated: 2026-09-03
references:
  - title: "Black & Scholes (1973), *The Pricing of Options and Corporate Liabilities*"
    url: ""
  - title: "Hull, *Options, Futures and Other Derivatives*, ch. 15"
    url: ""
  - title: "Haug, *The Complete Guide to Option Pricing Formulas*"
    url: ""
questions:
  - q: What do N(d₁) and N(d₂) actually mean? Be precise.
    difficulty: advanced
    tags: [core, interpretation, risk-neutral]
    hint: One of them is a probability. The other is not, though it is numerically close to a Greek.
    a: |
      **$N(d_2)$ is a probability:** the risk-neutral probability that the option finishes in the
      money, $\Q(S_T > K)$. That interpretation is exact.

      **$N(d_1)$ is not a probability.** It is $\Q(S_T > K)$ computed under a *different* measure —
      the one that uses the stock itself as numéraire rather than the money-market account.
      Equivalently, $S_0N(d_1) = e^{-rT}\E^\Q[S_T\1\{S_T>K\}]$, the discounted expected value of the
      stock *conditional on exercise*, times the probability of exercise. It is the "how much stock
      do I receive" term.

      So the formula reads: **expected stock received, minus expected cash paid, each weighted by the
      chance of the exercise happening.**

      $N(d_1)$ also happens to equal $\Delta$ for a call. That is a true and useful coincidence, but
      calling $N(d_1)$ "the probability of exercise" is the single most common error in option
      interviews — it confuses the two terms and gets the answer wrong for deep in-the-money options,
      where $N(d_1)$ and $N(d_2)$ diverge substantially.
  - q: Give the at-the-money call price approximation and derive it.
    difficulty: intermediate
    tags: [approximation, mental-math, desk]
    hint: For small x, N(x) ≈ ½ + x/√(2π).
    a: |
      $$C_{\text{ATM}} \approx 0.4\,S\sigma\sqrt{T}$$

      **Derivation.** At $K = F$ (at-the-money forward), $d_1 = \tfrac12\sigma\sqrt T$ and
      $d_2 = -\tfrac12\sigma\sqrt T$. Using $N(x)\approx\tfrac12 + \phi(0)x$ with
      $\phi(0)=1/\sqrt{2\pi}\approx 0.399$:

      $$C \approx S\Big[\big(\tfrac12 + \tfrac{0.399\sigma\sqrt T}{2}\big)
      - \big(\tfrac12 - \tfrac{0.399\sigma\sqrt T}{2}\big)\Big]
      = 0.399\,S\sigma\sqrt T$$

      **Use it constantly.** A 3-month at-the-money call on a \$100 stock at 20% vol:
      $0.4\times100\times0.2\times0.5 = \$4.00$ (exact answer 4.61 with $r=5\%$; 3.99 with $r=0$).

      The reverse direction is more useful still: an at-the-money option quoted at 4% of spot for
      three months implies $\sigma = 0.04/(0.4\times0.5) = 20\%$. Being able to convert price to vol
      in your head is a basic desk skill, and this is the whole of it.
  - q: What is implied volatility, and why does the smile exist?
    difficulty: intermediate
    tags: [implied-volatility, smile, core]
    a: |
      **Implied vol is the $\sigma$ that makes the formula reproduce the market price.** Since vega
      is strictly positive, the map $\sigma \mapsto C$ is monotone, so the inverse exists and is
      unique. It is a *quoting convention*, not an estimate: a price expressed in different units.

      **The smile exists because the model is wrong in a known direction.** If Black–Scholes held,
      one $\sigma$ would price every strike. Instead implied vol rises for low strikes (equity skew)
      because:

      - Real return distributions have **fat left tails** — crashes happen far more often than
        lognormal allows, so out-of-the-money puts must cost more.
      - Volatility is **stochastic and negatively correlated with spot** — markets fall and get
        wilder together, which fattens the left tail further.
      - **Jumps cannot be delta hedged**, so being short a crash carries an irreducible risk premium.
      - **Structural demand:** institutions buy puts for protection and sell calls for yield.

      The smile is therefore the market's correction to the model, expressed in the model's own
      language. Traders keep the formula because it is a monotone, well-understood map from price to
      a comparable number — not because they believe returns are lognormal.
  - q: A call is deep in the money. What does the price converge to, and why is that not obvious?
    difficulty: intermediate
    tags: [limits, bounds, forwards]
    a: |
      As $S \to \infty$, $d_1, d_2 \to \infty$, both $N$ terms $\to 1$, so

      $$C \to S - Ke^{-rT}$$

      — **the forward, not the intrinsic value $S - K$.** The extra $K(1 - e^{-rT})$ is the interest
      saved by not paying the strike until $T$.

      **Why it is not obvious:** a deep in-the-money call is certain to be exercised, so it feels
      like owning the stock. It is not — it is owning the stock *and* deferring the payment. That
      deferral is worth money, and it is why an American call on a non-dividend payer is never
      exercised early: doing so throws away exactly this interest.

      Introduce a dividend yield and $C \to Se^{-qT} - Ke^{-rT}$; if $q$ is large enough the
      early-exercise calculus flips, which is the entire theory of when to exercise an American call.
  - q: Price a 3-month at-the-money call on a $50 stock, σ = 40%, r = 4%. Do it without a calculator.
    difficulty: intermediate
    tags: [mental-math, desk, numerical]
    a: |
      **Approximation first.** $0.4 \times 50 \times 0.40 \times \sqrt{0.25} = 0.4\times50\times0.40\times0.5 = \$4.00$.

      **Refine for the rate.** $r$ raises the forward to $50e^{0.01}\approx 50.50$, so the option is
      slightly in the money against the forward — worth roughly $\Delta\times0.50 \approx +\$0.25$
      more. Call it **\$4.2**, and quote it with an error bar rather than a decimal.

      The exact Black–Scholes value is \$4.22 — the approximation was 5% low before the rate
      adjustment and within 1% after it.

      **What the exercise is really testing:** whether you can decompose a price into
      *volatility value* (the $0.4S\sigma\sqrt T$ term, which is nearly everything) and *carry* (a
      small correction through the forward). An interviewer asking this wants to see the
      approximation, the size of the correction, and an honest error bar — not a memorised formula
      evaluated badly.
  - q: Why is √T in the formula rather than T, and what does that imply for time decay?
    difficulty: intermediate
    tags: [scaling, theta, time]
    a: |
      Because **variances add, standard deviations do not**. Over $T$ the log-price has variance
      $\sigma^2T$ and hence dispersion $\sigma\sqrt T$, and an option's value is driven by dispersion.

      **The consequence for decay:** an at-the-money option is worth $\propto\sqrt T$, so

      $$\Theta_{\text{ATM}} \propto -\frac{\partial\sqrt T}{\partial t} \propto -\frac{1}{\sqrt T}$$

      Decay **accelerates** as expiry approaches — it is not linear. Half the time value of a
      one-year at-the-money option is still there with three months left
      ($\sqrt{0.25}/\sqrt{1} = 0.5$), and then it vanishes in a hurry.

      Two practical readings: a one-month option costs about $\sqrt{12}\approx3.5$ times a one-year
      option per unit of time, which is why systematic short-dated premium selling looks so
      attractive and carries so much gamma risk; and doubling the maturity of a long position buys
      only $\sqrt2$ times the vol exposure, not twice.
  - q: Your model says a call is worth $4.00 and it trades at $4.60. Do you buy it?
    difficulty: advanced
    tags: [desk, implied-volatility, judgement]
    a: |
      **No — first work out what the market is telling you.** Invert both prices to vols. Suppose
      yours implies 20% and the market 23%. The question is no longer "is the option cheap" but
      "will this stock realise more or less than 23%?"

      Then the checklist:

      - **Is there an event?** Earnings, a court ruling, an FDA decision, a central bank meeting
        inside the option's life will lift implied vol legitimately. A model fitted to trailing
        realised vol has no idea a catalyst exists.
      - **Are your inputs right?** Wrong dividend, wrong borrow, or a stale spot will manufacture an
        apparent 3-vol edge instantly. Check parity first.
      - **Is the skew the explanation?** If this is an out-of-the-money put, 23% against a 20%
        at-the-money vol may just be the surface.
      - **Can you actually run the hedge?** The edge is $\tfrac12\Gamma[(\d S)^2 - \sigma_i^2S^2\d t]$
        integrated over the life, and it only accrues if you rebalance. Unhedged, you are taking a
        directional position the model says nothing about.

      **The professional answer starts by suspecting your own inputs.** A persistent 3-vol edge in a
      liquid listed option is far more likely to be a bad dividend forecast than an inefficiency.
---

## Intuition

The formula is the answer to one question: **what does it cost to manufacture a call option?**

[[black-scholes-equation|The hedging argument]] established that the cost of manufacture is the
answer, and that it satisfies a PDE. Solving that PDE for the payoff $\max(S_T - K, 0)$ produces a
difference of two terms, and both have a direct reading:

$$C = \underbrace{S_0N(d_1)}_{\text{stock you expect to receive}} - \underbrace{Ke^{-rT}N(d_2)}_{\text{cash you expect to pay}}$$

You will receive one share, but only if the option finishes in the money. You will pay $K$, but only
in the same states. Discount both, weight both by the appropriate probability, and take the
difference.

:::insight
$N(d_2)$ is the **risk-neutral probability of exercise**. $N(d_1)$ is *not* a probability — it is the
same event measured under a different numéraire, and it doubles as the call's delta.

Confusing them is the classic error. They are close for at-the-money options (which is why the
mistake survives) and far apart in the wings, where it produces visibly wrong answers.
:::

The other thing worth seeing immediately is what the formula does *not* contain: $\mu$. Two stocks
with identical volatility and wildly different expected returns have identically priced options.
That absence is not a simplification — it is the whole content of the hedging argument, and if it
still feels wrong, the instinct being violated belongs to someone holding an unhedged option as a
directional view, not to someone pricing one.

## Mathematical Formulation

:::formula {name="Black–Scholes call" used-in="Equity Options, All Vanilla Pricing" note="N(d₂) is the risk-neutral probability of exercise; N(d₁) is the delta and the stock-numéraire probability. They are not the same thing."}
C = S_0e^{-qT}N(d_1) - Ke^{-rT}N(d_2)
:::

:::formula {name="Black–Scholes put" used-in="Equity Options, Protection, Skew" note="Never derived separately in practice — it follows from the call by put-call parity, which also guarantees the two share one implied volatility."}
P = Ke^{-rT}N(-d_2) - S_0e^{-qT}N(-d_1)
:::

:::formula {name="d₁ and d₂" used-in="Option Pricing, Greeks, Delta Approximation" note="d₂ = d₁ − σ√T always. The numerator is log-moneyness measured against the forward; the denominator is the standard deviation of log return over the life."}
d_1 = \frac{\ln(S_0/K) + (r - q + \tfrac12\sigma^2)T}{\sigma\sqrt T},
\qquad d_2 = d_1 - \sigma\sqrt T
:::

:::formula {name="Black-76 (forward form)" used-in="Futures Options, Caps, Swaptions, FX" note="The market-standard form. Carry is absorbed into F, so the same code prices options on anything with a forward."}
C = e^{-rT}\big[F_0N(d_1) - KN(d_2)\big],
\qquad d_{1,2} = \frac{\ln(F_0/K) \pm \tfrac12\sigma^2T}{\sigma\sqrt T}
:::

:::formula {name="At-the-money approximation" used-in="Mental Math, Desk Quoting" note="Accurate to a few percent for σ√T below about 0.3. The single most useful option formula to carry in your head."}
C_{\text{ATM}} \approx \frac{1}{\sqrt{2\pi}}\,S\sigma\sqrt{T} \approx 0.4\,S\sigma\sqrt{T}
:::

:::formula {name="Risk-neutral density" used-in="Surface Fitting, Exotics, Breeden–Litzenberger" note="The second strike-derivative of call prices IS the density. This is how the market's implied distribution is extracted without assuming one."}
\frac{\partial^2 C}{\partial K^2} = e^{-rT} q_\Q(K)
:::

## Derivation

:::derivation Direct integration under the risk-neutral measure
By [[black-scholes-equation|Feynman–Kac]], $C = e^{-rT}\E^\Q[\max(S_T-K,0)]$ where under $\Q$

$$S_T = S_0\exp\!\left[(r - q - \tfrac{\sigma^2}{2})T + \sigma\sqrt T\,Z\right], \quad Z\sim N(0,1)$$

Exercise happens when $S_T > K$, i.e. when

$$Z > \frac{\ln(K/S_0) - (r-q-\tfrac{\sigma^2}{2})T}{\sigma\sqrt T} = -d_2$$

So $\Q(\text{exercise}) = \P(Z > -d_2) = N(d_2)$ — **that is where the second term's probability
comes from, and it is exactly a probability.** Split the expectation:

$$C = e^{-rT}\Big(\underbrace{\E^\Q[S_T\1\{Z>-d_2\}]}_{\text{(i)}} - K\underbrace{\Q(Z>-d_2)}_{N(d_2)}\Big)$$

For (i), write out the integral and complete the square in the exponent:

$$\E^\Q[S_T\1] = \int_{-d_2}^{\infty} S_0e^{(r-q-\sigma^2/2)T + \sigma\sqrt T z}\,\frac{e^{-z^2/2}}{\sqrt{2\pi}}\,\d z$$

The exponent is $-\tfrac12(z - \sigma\sqrt T)^2 + (r-q)T$, so substituting $u = z - \sigma\sqrt T$
shifts the lower limit to $-d_2 - \sigma\sqrt T = -d_1$:

$$\E^\Q[S_T\1] = S_0e^{(r-q)T}\int_{-d_1}^{\infty}\frac{e^{-u^2/2}}{\sqrt{2\pi}}\d u = S_0e^{(r-q)T}N(d_1)$$

Assembling: $C = S_0e^{-qT}N(d_1) - Ke^{-rT}N(d_2)$.

**The whole derivation is one completed square**, and that completed square is the entire difference
between $d_1$ and $d_2$. The shift $\sigma\sqrt T$ appears because weighting by $S_T$ tilts the
distribution towards higher outcomes — which is precisely what "changing numéraire to the stock"
means.
:::

:::derivation Why $d_2 = d_1 - \sigma\sqrt T$, without algebra
$N(d_2)$ answers: *how likely is exercise?* $N(d_1)$ answers: *how likely is exercise, when each
scenario is weighted by how much stock it delivers?* The second question over-weights the upside,
because up-scenarios deliver more stock. Tilting a lognormal by its own value shifts its log-mean up
by exactly one variance unit, $\sigma^2T$ — hence one standard deviation, $\sigma\sqrt T$, in
$d$-space.

This is the Cameron–Martin/Esscher tilt, and the same shift shows up everywhere the same structure
does: in the $\tfrac12\sigma^2$ of the GBM drift, in the difference between the mean and median of a
lognormal, and in the convexity adjustments of rates modelling.

**The practical marker:** as $T\to0$ or $\sigma\to0$, $d_1$ and $d_2$ converge — the option becomes
a forward and delta becomes a step function. In the far wings they diverge, which is why "$N(d_1)$
is the probability of exercise" produces visibly wrong numbers for deep in-the-money options.
:::

:::derivation Extracting the market's implied distribution
Differentiate $C = e^{-rT}\int_K^\infty (S-K)q_\Q(S)\,\d S$ with respect to $K$:

$$\frac{\partial C}{\partial K} = -e^{-rT}\int_K^\infty q_\Q(S)\,\d S = -e^{-rT}\,\Q(S_T>K)$$

and once more:

$$\frac{\partial^2 C}{\partial K^2} = e^{-rT}q_\Q(K)$$

**Breeden–Litzenberger:** a continuum of call prices *is* the risk-neutral density. No model is
needed — the surface already contains the market's whole distribution, and Black–Scholes is only the
coordinate system it is quoted in.

Two immediate uses. First, this is how the market's implied distribution is plotted, and it makes
the fat left tail directly visible rather than inferred. Second, it is an arbitrage constraint:
$\partial^2C/\partial K^2 \ge 0$ is required (butterfly arbitrage), as is monotonicity in $K$
(call spread) and in $T$ (calendar). Any fitted surface must respect all three, and a naive
interpolation of implied vols routinely does not.
:::

## Assumptions & Edge Cases

:::assumption
Beyond the assumptions of the [[black-scholes-equation|hedging argument]], the closed form adds:

- **European exercise only.** No early exercise; American puts have no closed form.
- **A single terminal payoff** $\max(S_T-K,0)$, path-independent.
- **Lognormal $S_T$** with constant $\sigma$ — the assumption the smile falsifies directly.
- **Deterministic $r$ and $q$** over the option's life.
:::

:::warning
**Implied volatility is a quoting convention, not a forecast.** Because vega is positive, the map
from price to vol is monotone and invertible, so any price can be quoted as a vol. That is all the
number is. When someone says "the market expects 23% volatility", the accurate statement is
"the market is charging what a 23% Black–Scholes hedge would cost, plus a premium for the risks the
model cannot hedge". Implied vol has exceeded subsequent realised vol on equity indices for
essentially the whole history of listed options — the gap is the variance risk premium, and reading
implied vol as an unbiased forecast is how volatility sellers explain their returns as alpha.
:::

:::warning
**The wings are where the model is weakest and where inversion is most fragile.** Deep
out-of-the-money options have tiny vega, so a one-tick price change moves implied vol by whole
points. A surface fitted naively through those quotes will oscillate and can easily violate the
butterfly no-arbitrage condition. Fit to prices with a shape constraint, or fit in a parameterisation
(SVI, SABR) that is arbitrage-free by construction — do not interpolate raw implied vols and hope.
:::

## Worked Example

**A three-month call, worked and then read.** $S = 100$, $K = 105$, $T = 0.25$, $\sigma = 30\%$,
$r = 5\%$, $q = 0$.

$$d_1 = \frac{\ln(100/105) + (0.05 + 0.045)(0.25)}{0.30\times0.5}
= \frac{-0.04879 + 0.02375}{0.15} = -0.1669$$

$$d_2 = -0.1669 - 0.15 = -0.3169$$

$N(d_1) = 0.4337$, $N(d_2) = 0.3756$.

$$C = 100(0.4337) - 105e^{-0.0125}(0.3756) = 43.37 - 38.95 = \$4.42$$

**Now read it, which is the part that matters:**

| Quantity | Value | Meaning |
|---|---|---|
| $N(d_2) = 0.376$ | 37.6% | risk-neutral chance of finishing above 105 |
| $N(d_1) = 0.434$ | — | delta: 43.4 shares per 100 options |
| Intrinsic | \$0 | it is out of the money |
| Time value | \$4.42 | **all** of the premium |
| Forward | $100e^{0.0125} = 101.26$ | still below the strike |

The option costs \$4.42 for a 37.6% chance of a payoff. That is not a bad bet or a good one — it is
the cost of the hedge, and the two numbers are related by the fact that the payoff is larger in the
scenarios that are less likely.

**Sanity-check with the approximation.** At-the-money-forward the call would be
$0.4\times101.26\times0.30\times0.5 = \$6.08$; we are 3.7% out of the money, roughly $0.25\sigma\sqrt T$,
so a delta-weighted haircut of about $0.43\times3.74 = \$1.6$ gives $\approx\$4.5$. Within 2% of the
exact answer, in ten seconds, with no calculator.

## Why It Matters in Quant Finance

**It is the language, not the model.** Nobody on a derivatives desk believes returns are lognormal.
Everybody quotes in Black–Scholes implied volatility, because it is a monotone map that converts a
price — which depends on strike, spot, maturity and rates — into one comparable number. Comparing a
\$4.41 option to a \$0.85 option is meaningless; comparing 30 vol to 34 vol is not.

**It makes the market's beliefs observable.** Breeden–Litzenberger turns the quoted surface into a
risk-neutral density. Parity turns it into implied dividends and implied borrow. The formula is the
instrument through which an options market is read.

**It is the base case every extension is measured against.** Local vol reprices the surface exactly
by construction; stochastic vol adds a variance factor; jump models add a Poisson term. Each is
judged by what it fixes relative to Black–Scholes and what it costs in tractability — and each still
quotes its output in Black–Scholes vol.

**It gives closed-form Greeks.** Because the solution is explicit, so are all its
[[option-greeks|derivatives]], and that is what makes real-time risk on a large book computationally
possible. A model without closed-form Greeks needs a bump-and-reprice for every risk number, which
for a book of hundreds of thousands of positions is a materially different engineering problem.

## Trading & Research Application

:::desk
**Convert price to vol before forming any opinion.** A price is not comparable across strikes,
maturities or underlyings; a vol is. "That option is expensive" is not a sentence a desk uses — "that
strike is 4 vols over the 30-day" is.

**Carry $0.4S\sigma\sqrt T$ everywhere.** It converts an at-the-money price to a vol and back in your
head, and it is the fastest way to catch a fat-fingered quote or a mis-specified maturity in a model
output.

**Trade the surface, not the option.** Vanilla options are the coordinate system; the tradable
structures are relative — call spreads (strike), calendars (maturity), risk reversals (skew),
butterflies (convexity). Each isolates one dimension of the surface's deviation from flat.

**Respect what implied vol is for.** It is the market's price of hedging, systematically above
realised vol on indices. Selling that premium is a real strategy with a real risk profile — short
gamma, short jump, positively skewed until it is catastrophically not — and dressing it up as a
volatility forecast disagreement hides exactly the risk that eventually shows up.

**Check parity and the butterfly condition before believing any surface.** A fitted vol surface that
implies a negative density is producing prices no market can support, and a naive spline through raw
implied vols does this routinely in the wings.
:::

## Implementation Notes

```python
import numpy as np
from math import erf, log, sqrt, exp

def _N(x):
    """Standard normal CDF via erf. Fine in double precision; for the far wings
    of a survival function you would want erfc to avoid catastrophic
    cancellation, but option prices there are below a tick anyway."""
    return 0.5 * (1.0 + erf(x / sqrt(2.0)))

def black_scholes(S, K, r, sigma, T, q=0.0, call=True):
    """European vanilla. Handles the degenerate cases explicitly rather than
    letting them produce nan: T=0 or sigma=0 are not errors, they are the
    intrinsic/forward limits, and a pricing library hit with an expiring option
    should return a number rather than a nan that poisons a whole book."""
    if T <= 0 or sigma <= 0:
        fwd = S * exp(-q * T) - K * exp(-r * T)
        return max(fwd, 0.0) if call else max(-fwd, 0.0)
    d1 = (log(S / K) + (r - q + 0.5 * sigma**2) * T) / (sigma * sqrt(T))
    d2 = d1 - sigma * sqrt(T)
    if call:
        return S * exp(-q * T) * _N(d1) - K * exp(-r * T) * _N(d2)
    return K * exp(-r * T) * _N(-d2) - S * exp(-q * T) * _N(-d1)

def implied_vol(price, S, K, r, T, q=0.0, call=True, tol=1e-10):
    """Invert for sigma. Bisection on a bracketed interval, not Newton.

    Newton on vega is faster but fails exactly where it is most needed: deep
    out-of-the-money, vega -> 0 and the step explodes. Bisection on [1e-9, 5]
    always converges because price is strictly monotone in sigma, and ~50
    iterations is nothing next to the market data call that fetched the price."""
    intrinsic = black_scholes(S, K, r, 0.0, T, q, call)
    if price < intrinsic - tol:
        return float('nan')          # below intrinsic: the quote is stale or wrong
    lo, hi = 1e-9, 5.0
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if black_scholes(S, K, r, mid, T, q, call) < price:
            lo = mid
        else:
            hi = mid
        if hi - lo < tol:
            break
    return 0.5 * (lo + hi)

def risk_neutral_density(strikes, calls, r, T):
    """Breeden-Litzenberger: the second strike-derivative of call prices is the
    discounted risk-neutral density. Noisy in practice -- differentiating market
    quotes twice amplifies the bid-ask enormously -- so smooth the IMPLIED VOLS
    first, reprice, then differentiate. Differentiating raw prices produces
    negative densities and is the standard way to get this wrong."""
    d2C = np.gradient(np.gradient(calls, strikes), strikes)
    return np.exp(r * T) * d2C

# Checks worth having in the test suite:
#   parity: C - P == S*exp(-qT) - K*exp(-rT)   for every sigma, to 1e-12
#   monotone in sigma, so implied_vol(black_scholes(sigma)) == sigma
#   ATM approx: black_scholes(100,100,0,0.2,0.25) ~= 0.4*100*0.2*0.5 = 4.0
```

## Common Mistakes

:::pitfall
- **Calling $N(d_1)$ the probability of exercise.** It is $N(d_2)$. $N(d_1)$ is delta and a
  numéraire-shifted probability; they diverge in the wings.
- **Reading implied vol as a forecast.** It is a quoting convention that embeds a risk premium, and
  it has exceeded realised vol on indices for decades.
- **Expecting one vol to price the surface.** The smile is the market telling you the model is
  wrong; use it, do not argue with it.
- **Newton's method for implied vol.** Vega vanishes in the wings and the iteration blows up exactly
  where you needed an answer. Bracket and bisect.
- **Forgetting $q$.** A 2% dividend yield on a one-year option is a first-order price error and
  contaminates every implied vol derived from it.
- **Using it on American options.** No closed form. American puts need a tree, a PDE or an
  approximation.
- **Interpolating raw implied vols across strikes.** Routinely produces a negative implied density.
  Fit prices under a shape constraint, or use an arbitrage-free parameterisation.
- **Expecting deep in-the-money to converge to $S-K$.** It converges to $S - Ke^{-rT}$; the gap is
  deferred payment of the strike, and it is why American calls are not exercised early.
- **Quoting a price with more precision than the inputs deserve.** The dividend forecast alone is
  usually worth more basis points than the fourth decimal of the answer.
:::

## 30-Second Revision

- $C = Se^{-qT}N(d_1) - Ke^{-rT}N(d_2)$; $P$ follows from parity, never derived separately.
- $d_1 = [\ln(S/K) + (r-q+\tfrac12\sigma^2)T]/(\sigma\sqrt T)$, $d_2 = d_1 - \sigma\sqrt T$.
- $N(d_2) = \Q(\text{exercise})$, exactly. $N(d_1) = \Delta$ and a stock-numéraire probability — not
  a probability of exercise.
- Structure: expected stock received minus expected cash paid, each weighted by its own measure.
- $C_{\text{ATM}}\approx 0.4S\sigma\sqrt T$. Inverts in your head to turn a price into a vol.
- $\sqrt T$, not $T$ — variances add. So theta $\propto 1/\sqrt T$ and decay accelerates.
- Deep ITM $\to S - Ke^{-rT}$, the forward, not $S-K$. That gap is why American calls are not
  exercised early.
- Implied vol is a quoting convention with a risk premium in it, not a forecast.
- $\partial^2C/\partial K^2 = e^{-rT}q_\Q(K)$: the surface *is* the market's distribution, and
  $\ge 0$ is a no-arbitrage constraint.
- No $\mu$ anywhere. The price is the cost of a hedge, not the value of a view.
