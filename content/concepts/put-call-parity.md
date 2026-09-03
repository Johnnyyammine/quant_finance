---
id: put-call-parity
title: Put–Call Parity
subject: options
summary: A long call and a short put at the same strike are a forward — an identity that holds with no model, no volatility and no distributional assumption, and the first sanity check any option price must pass.
difficulty: foundational
interview_relevance: 5
tags: [options, no-arbitrage, replication, pricing, parity, synthetic]
prerequisites: [forwards-and-futures]
related: [black-scholes-formula, option-greeks]
aliases: [put call parity, synthetic forward, conversion, reversal, box spread]
updated: 2026-09-03
references:
  - title: "Hull, *Options, Futures and Other Derivatives*, ch. 11"
    url: ""
  - title: "Stoll (1969), *The Relationship Between Put and Call Option Prices*"
    url: ""
questions:
  - q: State put–call parity and prove it in one line.
    difficulty: foundational
    tags: [core, no-arbitrage, replication]
    hint: What is max(S−K,0) − max(K−S,0)?
    a: |
      $$C - P = S_0 - Ke^{-rT}$$

      **The one line:** at expiry,
      $\max(S_T-K,0) - \max(K-S_T,0) = S_T - K$ for every value of $S_T$ — check the two cases and
      they agree. So long call plus short put has exactly the payoff of a forward struck at $K$, in
      every state of the world. Two portfolios with identical payoffs in every state have identical
      prices today, and the forward's price is $S_0 - Ke^{-rT}$.

      **What is not in the statement:** volatility, drift, the distribution of $S_T$, anyone's risk
      preferences, or any model. Parity is a statement about payoffs, not about dynamics. That makes
      it the strongest result in option pricing and the first thing to check when a quoted surface
      looks wrong.
  - q: Does put–call parity hold for American options?
    difficulty: intermediate
    tags: [american, early-exercise, bounds]
    a: |
      No — it weakens to an inequality, because early exercise breaks the "identical payoff in every
      state" argument. For non-dividend-paying stock:

      $$S_0 - K \;\le\; C - P \;\le\; S_0 - Ke^{-rT}$$

      **Why the upper bound still binds:** an American call on a non-dividend payer is never
      optimally exercised early (exercising throws away the interest on $K$ and the remaining
      optionality), so $C_{\text{Am}} = C_{\text{Eur}}$. The American *put* can be worth exercising
      early — deep in the money, you would rather have the cash — so $P_{\text{Am}} > P_{\text{Eur}}$
      and the difference $C - P$ falls below the European value.

      With dividends the call can also be worth exercising early, just before an ex-date large
      enough to exceed the remaining time value. Both bounds then loosen.
  - q: A stock trades at 100. The 100-strike call is 6.20, the put is 4.00, r = 5%, T = 1 year. Is there an arbitrage?
    difficulty: intermediate
    tags: [arbitrage, desk, numerical]
    a: |
      Parity requires $C - P = S - Ke^{-rT} = 100 - 100e^{-0.05} = 100 - 95.12 = 4.88$.

      Observed: $6.20 - 4.00 = 2.20$. The call is **cheap relative to the put** by $2.68$.

      **The trade (a reversal):** buy the call, sell the put, sell the stock short, invest the
      proceeds. Payoff at $T$ from the synthetic long forward plus the short stock is exactly zero
      in every state; the cash left over is $2.68$ today, or $2.68e^{0.05} = 2.82$ at expiry.

      **Before sizing it, ask what is really wrong.** A 2.68 gap on a 100 stock is enormous and
      essentially never a genuine free lunch. In order of likelihood: an unmodelled dividend
      (a 2.7% yield explains it exactly); a hard-to-borrow stock, so the short leg costs a stub fee;
      stale or non-simultaneous quotes; or an American put with early-exercise value. The
      professional answer names the missing carry term before naming the trade.
  - q: How do dividends change parity, and what does that imply about early exercise?
    difficulty: intermediate
    tags: [dividends, american, carry]
    a: |
      Discrete dividends with present value $D$, or a continuous yield $q$:

      $$C - P = S_0 - D - Ke^{-rT} \qquad\text{or}\qquad C - P = S_0e^{-qT} - Ke^{-rT}$$

      Holding the stock earns the dividend; holding the synthetic does not, so the synthetic is worth
      less by exactly the dividend's present value.

      **Implication for early exercise:** exercising an American call early buys you the dividend but
      costs you the interest on $K$ and the remaining time value. It is therefore optimal only just
      before an ex-date where the dividend exceeds roughly $K(1 - e^{-r\tau})$ plus the time value
      given up. This is a live operational issue: an option desk that fails to exercise a deep
      in-the-money call before a large ex-date simply gives the dividend away.
  - q: You cannot short the stock. Which half of parity survives?
    difficulty: advanced
    tags: [frictions, bounds, short-selling]
    hint: Which direction of the arbitrage needs a borrow?
    a: |
      The **conversion** (buy stock, sell call, buy put) needs no borrow, so the bound it enforces
      survives: $C - P \le S_0 - Ke^{-rT}$ still holds.

      The **reversal** (short stock, buy call, sell put) requires borrowing the shares. If the borrow
      is impossible or expensive at rate $b$, the lower bound loosens to
      $C - P \ge S_0e^{-bT} - Ke^{-rT}$.

      **So parity becomes one-sided.** In a hard-to-borrow name the puts can look permanently rich
      and stay that way, because nobody can trade against it. This is not a market inefficiency — it
      is the borrow cost showing up in the option market, and the implied borrow rate backed out of
      the parity gap is a genuinely traded quantity that stock-loan desks quote against.
  - q: Why do traders say a box spread is a loan?
    difficulty: advanced
    tags: [box, rates, funding, desk]
    a: |
      A box is parity applied at two strikes: long the $K_1$ synthetic forward, short the $K_2$ one.
      The stock cancels and the terminal payoff is the constant $K_2 - K_1$ in every state, so today
      it must cost

      $$(K_2 - K_1)e^{-rT}$$

      **A guaranteed fixed cash flow at a fixed date — that is a zero-coupon bond.** Buying a box
      lends money at the implied rate; selling one borrows. Institutions use boxes to fund at rates
      inside their bank spread, and the implied box rate is a directly observable market funding
      curve.

      **The famous caveat:** boxes on *American* options are not riskless, because the short legs can
      be assigned early. A retail trader on Robinhood in 2019 discovered this by selling boxes and
      being assigned; the "riskless arbitrage" became a leveraged short position overnight. Sell
      boxes on European-style index options or not at all.
  - q: An interviewer says implied vol on the 90-strike put is 24% and on the 90-strike call is 21%. What do you say?
    difficulty: advanced
    tags: [implied-volatility, skew, desk]
    a: |
      **That cannot be a real observation about the same strike and expiry.** Put–call parity forces
      the call and the put at the same strike to have the *same* implied volatility. The proof needs
      no model beyond Black–Scholes being invertible: parity is $C - P = S - Ke^{-rT}$, and the
      Black–Scholes prices satisfy the same identity for *any* $\sigma$ — so the $\sigma$ that
      reprices the call must reprice the put.

      So the difference is not information about the market's view. It is a data artefact: stale
      quotes on one leg, a mid taken from a wide spread, a wrong dividend or borrow assumption in the
      inverter, or mismatched timestamps.

      **The skew is a function of strike, not of option type.** A 90-strike put and a 110-strike call
      can and do have different vols; a 90-put and a 90-call cannot. Being clear on this distinction
      is a reliable marker of someone who has actually looked at a surface.
---

## Intuition

Options look like they need a model. Put–call parity is the surprise: one *combination* of options
needs no model at all.

Hold a call and sell a put at the same strike $K$ and expiry $T$. Whatever happens:

- If $S_T > K$, your call pays $S_T - K$ and the put expires worthless.
- If $S_T < K$, your call expires worthless and you are assigned on the put, paying $K - S_T$ — i.e.
  receiving $S_T - K$, a negative number.

Either way, you end up with exactly $S_T - K$. **You are long a forward at $K$**, and you got there
without knowing anything about volatility. So the two must cost the same today, and a
[[forwards-and-futures|forward struck at $K$]] costs $S_0 - Ke^{-rT}$.

:::insight
Parity says the call and the put are not two independent instruments — they are one instrument plus
a forward. All the modelling difficulty lives in the *symmetric* part they share; the difference
between them is pure carry, and carry is contractual.

The practical consequence: you never need to model a put. Price the call, then read the put off
parity. Every option pricer in production does exactly this.
:::

## Mathematical Formulation

:::formula {name="Put–call parity (European, no dividends)" used-in="Options, Market Making, Risk" note="Model-free. Holds for any distribution of S_T, any volatility, any risk preferences — it is an identity about payoffs."}
C(K,T) - P(K,T) = S_0 - Ke^{-rT}
:::

:::formula {name="With dividends" used-in="Equity Options, Index Options" note="D is the present value of dividends before T, or use a continuous yield q. This is the version that matters in practice."}
C - P = S_0e^{-qT} - Ke^{-rT} \qquad\text{(discrete: } C - P = S_0 - D - Ke^{-rT})
:::

:::formula {name="Parity in forward terms" used-in="FX Options, Futures Options, Black-76" note="The cleanest statement: the synthetic is a forward. At-the-money-forward (K = F) the call and put are worth the same."}
C - P = e^{-rT}(F_0 - K), \qquad F_0 = S_0e^{(r-q)T}
:::

:::formula {name="American bounds" used-in="Equity Options, Early Exercise" note="An inequality, not an identity: early exercise on the put breaks the state-by-state matching."}
S_0 - K \;\le\; C_{\text{Am}} - P_{\text{Am}} \;\le\; S_0 - Ke^{-rT}
:::

:::formula {name="Box spread" used-in="Funding, Rates, Arbitrage" note="Parity at two strikes. The payoff is a constant, so a box is a zero-coupon bond and its implied rate is a traded funding rate."}
\big[C(K_1) - P(K_1)\big] - \big[C(K_2) - P(K_2)\big] = (K_2 - K_1)e^{-rT}
:::

## Derivation

:::derivation The payoff identity, then the price identity
**Step 1 — the payoffs agree in every state.** For any real number $x$,

$$\max(x,0) - \max(-x,0) = x$$

Put $x = S_T - K$: the long call minus the short put pays $S_T - K$, always. This is an algebraic
identity, not an approximation, and it holds for every possible $S_T$ — there is no distribution
anywhere in it.

**Step 2 — build the same payoff a second way.** Buy one share (cost $S_0$) and borrow $Ke^{-rT}$
(receive $Ke^{-rT}$ now, repay $K$ at $T$). At $T$ this portfolio is worth $S_T - K$.

**Step 3 — equate costs.** Two portfolios with identical payoffs in every state must cost the same,
or the cheaper one is bought and the dearer sold for a riskless profit:

$$C - P = S_0 - Ke^{-rT}$$

The argument uses only *static* replication: set the trade up once, do nothing, wait. That is why
no model appears. Contrast option pricing itself, where the replication is dynamic and the cost of
running the hedge depends on how much the stock moves — which is exactly where volatility enters.
:::

:::derivation The two arbitrage trades, explicitly
Write $\Delta = (C - P) - (S_0 - Ke^{-rT})$ for the parity gap.

**If $\Delta > 0$ (synthetic rich) — a conversion.** Sell the call, buy the put, buy the stock,
borrow $Ke^{-rT}$. Net cash in today $= \Delta > 0$.

| At $T$ | $S_T < K$ | $S_T > K$ |
|---|---|---|
| Short call | $0$ | $-(S_T-K)$ |
| Long put | $K - S_T$ | $0$ |
| Long stock | $S_T$ | $S_T$ |
| Repay loan | $-K$ | $-K$ |
| **Total** | $\mathbf{0}$ | $\mathbf{0}$ |

Zero in both states, $\Delta$ banked today.

**If $\Delta < 0$ (synthetic cheap) — a reversal.** Reverse every leg: buy the call, sell the put,
short the stock, lend the proceeds. Same table with signs flipped, net cash $-\Delta > 0$.

Note the asymmetry that matters in practice: the conversion needs no stock borrow, the reversal
does. So the upper bound is enforced by anyone, and the lower bound only by those who can short.
:::

:::derivation Why call and put share one implied volatility
Black–Scholes prices satisfy parity identically — for **every** $\sigma$, not just the right one:

$$C_{\text{BS}}(\sigma) - P_{\text{BS}}(\sigma) = S_0e^{-qT} - Ke^{-rT}$$

(Substitute the formulas and use $\Phi(-x) = 1 - \Phi(x)$; the $\Phi$ terms collapse.) The right-hand
side has no $\sigma$ in it at all.

Now suppose the market call price is matched by $\sigma_C$. Then

$$P_{\text{mkt}} = C_{\text{mkt}} - (S_0e^{-qT} - Ke^{-rT})
= C_{\text{BS}}(\sigma_C) - (S_0e^{-qT} - Ke^{-rT}) = P_{\text{BS}}(\sigma_C)$$

so $\sigma_P = \sigma_C$. **The implied volatility belongs to the strike, not to the option type.**
Any observed difference is a data problem — a stale leg, a wide spread, or wrong carry inputs — and
the standard fix is to build the surface from out-of-the-money options on both sides, which are the
liquid ones, and let parity supply the rest.
:::

## Assumptions & Edge Cases

:::assumption
Parity is an identity under four conditions, each of which is violated somewhere real:

- **European exercise.** American puts break it into an inequality.
- **Known income.** Dividends must be forecastable; the residual is dividend risk.
- **Shorting is possible.** Otherwise only the conversion side is enforced.
- **One financing rate.** A borrow-lend spread turns the identity into a no-arbitrage *band*.
:::

:::warning
**A parity violation is a diagnostic, not a trade.** Genuine free money in a liquid listed market
is rare enough that the base rate should dominate your reasoning. Work through the causes in order:
an unmodelled dividend, a hard-to-borrow spread, a stale or non-simultaneous quote, an
early-exercise premium on the put, a wide bid-ask where you priced both legs at mid, or a mismatched
settlement convention.

Only after all six come back clean does "arbitrage" become the leading hypothesis — and by then the
gap will usually be inside the spread anyway. What the gap *is* good for is inference: solve it for
the implied borrow rate or the implied dividend, both of which are useful numbers you cannot observe
directly.
:::

## Worked Example

**Backing out the market's dividend forecast.** An index at 4,000, one-year options, $r = 5\%$. The
4,000-strike call trades at 240.0 and the put at 158.0.

Parity with a dividend yield $q$:

$$C - P = S_0e^{-qT} - Ke^{-rT}$$
$$240.0 - 158.0 = 4000e^{-q} - 4000e^{-0.05}$$
$$82.0 = 4000e^{-q} - 3804.9$$
$$e^{-q} = \frac{3886.9}{4000} = 0.97173 \;\Longrightarrow\; q = 2.87\%$$

**The options market is pricing a 2.87% dividend yield**, and it got there without anybody quoting a
dividend. That number is directly tradable — it is what a dividend swap references — and comparing
it to your own bottom-up forecast is a real strategy on an equity derivatives desk.

Run the same calculation on single stocks and the residual after a known dividend is the implied
*borrow* rate. Both quantities come out of one line of algebra that contains no model.

## Why It Matters in Quant Finance

**It is the first validation any pricing system must pass.** Before comparing a model against the
market, check that it satisfies parity to machine precision. A model that violates parity is
arbitrageable by construction and is wrong for a reason that has nothing to do with its dynamics.
This is a standard unit test in every derivatives library.

**It halves the modelling problem.** Price the call, get the put free. Build the volatility surface
from liquid out-of-the-money options — puts below the forward, calls above — and use parity to fill
in the illiquid in-the-money wing rather than trusting its wide quotes.

**It generates synthetic positions.** Long call plus short put is a forward; the equivalences run
both ways and are the basis of conversions, reversals, boxes and jelly rolls. When one instrument is
expensive or unavailable, parity says which combination replaces it.

**It disciplines the vocabulary of skew.** Because implied vol attaches to the strike rather than
the option type, "put vol above call vol" is meaningless at a fixed strike and the smile must be
described as a function of moneyness. Getting this wrong is a fast way to reveal that a surface has
never actually been examined.

**It is where funding shows up in option prices.** Box rates are traded funding curves; parity gaps
in hard-to-borrow names are traded borrow rates. Both are examples of a general lesson: a persistent
apparent arbitrage is almost always a price for something you were not charging for.

## Trading & Research Application

:::desk
**Quote the synthetic, not the leg.** Market makers price and risk-manage in terms of the synthetic
forward and one option, because parity means the second option carries no new information. It also
means a call and a put at one strike must be hedged as a single risk, not two.

**The parity gap is a data-quality alarm.** Run it across the surface continuously. Gaps outside the
bid-ask band flag stale feeds, bad dividend inputs or a borrow that has tightened — usually before
anything else on the desk notices.

**Boxes fund the book.** Selling a box on European index options borrows at the implied box rate,
which for institutions is frequently inside the unsecured bank rate. Never sell an American box: the
short legs can be assigned and the position stops being riskless exactly when it matters.

**Implied borrow is an alpha signal.** In single names, the parity residual after dividends is the
market's borrow rate. A borrow that is widening is a real-time measure of short demand, and it leads
public short-interest data by weeks.

**Do not exercise an in-the-money call for the dividend without doing the arithmetic**, and do not
forget to when the arithmetic says yes. Both errors are pure operational P&L.
:::

## Implementation Notes

```python
import numpy as np

def parity_gap(call, put, spot, strike, r, T, q=0.0):
    """Signed distance from parity. Positive means the synthetic forward
    (long call / short put) is rich to the actual forward.

    In a pricing library this belongs in the test suite, not just the analytics:
    any model whose call and put prices give a non-zero gap is arbitrageable by
    construction, whatever its dynamics."""
    return (call - put) - (spot * np.exp(-q * T) - strike * np.exp(-r * T))

def implied_dividend_yield(call, put, spot, strike, r, T):
    """Solve parity for q. This is the market's dividend forecast, extracted
    with no model at all -- and on an index it is directly comparable to the
    quoted dividend swap."""
    forward_pv = (call - put) + strike * np.exp(-r * T)
    return -np.log(forward_pv / spot) / T

def implied_borrow_rate(call, put, spot, strike, r, T, q):
    """Same algebra, but attribute the residual to the borrow leg instead. Only
    meaningful once q is known independently -- otherwise you are solving one
    equation for two unknowns and will call a dividend a borrow."""
    forward_pv = (call - put) + strike * np.exp(-r * T)
    return -np.log(forward_pv / spot) / T - q

def put_from_call(call, spot, strike, r, T, q=0.0):
    """Never model a put. Price the call and read the put off parity: it is
    exact, it is faster, and it guarantees the two are mutually consistent."""
    return call - spot * np.exp(-q * T) + strike * np.exp(-r * T)

# The test that every option library should have:
#   assert abs(parity_gap(bs_call(...), bs_put(...), ...)) < 1e-12
# for a grid of strikes, maturities AND volatilities -- parity must hold for
# every sigma, which is what forces one implied vol per strike.
```

## Common Mistakes

:::pitfall
- **Applying the European identity to American options.** It becomes a two-sided inequality, and the
  slack is the early-exercise premium on the put.
- **Omitting dividends.** On a 2–3% yielder over a year this is larger than most quoted parity
  "arbitrages", and it is the first thing to check.
- **Calling a gap an arbitrage.** Borrow cost, stale quotes, mid-pricing a wide spread and
  early-exercise value explain nearly all of them.
- **Believing puts and calls at the same strike have different implied vols.** They cannot. The
  observation is always a data artefact.
- **Selling American boxes.** Assignment on the short legs turns a "riskless loan" into a leveraged
  directional position.
- **Using mid prices on both legs.** You cannot trade two mids; a parity screen that ignores the
  spread manufactures signals at exactly the rate the spread is wide.
- **Forgetting that parity constrains prices, not dynamics.** It says nothing about whether your
  volatility model is right — only that whatever it is, it must not break this identity.
:::

## 30-Second Revision

- $C - P = S_0 - Ke^{-rT}$; with income, $C - P = S_0e^{-qT} - Ke^{-rT}$.
- Proof: $\max(x,0) - \max(-x,0) = x$. Long call, short put **is** a forward — in every state.
- Model-free: no volatility, no distribution, no preferences. Static replication only.
- Therefore one implied vol per strike; call vol $\ne$ put vol at a shared strike is a data error.
- American: an inequality, $S_0 - K \le C - P \le S_0 - Ke^{-rT}$. Slack is the put's early-exercise
  value.
- Conversion needs no borrow; reversal does — so in hard-to-borrow names parity is one-sided.
- Box $= (K_2-K_1)e^{-rT}$: a zero-coupon bond, a funding trade, and never safe on American options.
- Practical uses: never model a put; back out implied dividends and implied borrow; use it as the
  first unit test of any pricer.
