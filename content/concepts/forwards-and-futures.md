---
id: forwards-and-futures
title: Forwards & Futures
subject: derivatives
summary: The simplest derivative and the cleanest pricing argument in finance — a forward price is fixed entirely by the cost of carrying the asset, with no model, no volatility and no view on where the price is going.
difficulty: foundational
interview_relevance: 4
tags: [derivatives, no-arbitrage, replication, cost-of-carry, pricing, basis]
prerequisites: []
related: [expectation]
aliases: [forward contract, futures contract, cost of carry, contango, backwardation, basis]
updated: 2026-09-03
references:
  - title: "Hull, *Options, Futures and Other Derivatives*, ch. 5"
    url: ""
  - title: "Baxter & Rennie, *Financial Calculus*, ch. 1"
    url: ""
questions:
  - q: Derive the forward price of a non-dividend-paying stock and explain why no probability appears.
    difficulty: foundational
    tags: [no-arbitrage, core, replication]
    hint: Build the forward payoff out of the stock and a bond, then compare costs.
    a: |
      **Replicate it.** Borrow $S_0$, buy the share, hold to $T$. At $T$ you own the share and owe
      $S_0e^{rT}$. That is exactly the payoff of a long forward struck at $S_0e^{rT}$, and it cost
      nothing to set up. A forward also costs nothing to enter, so

      $$F_0 = S_0e^{rT}$$

      **Why no probability:** the replication is *pathwise* — it delivers the same payoff as the
      forward in every state of the world, not on average. Two portfolios with identical payoffs in
      every state must have identical prices, whatever anyone believes about the distribution of
      $S_T$. Volatility, drift and risk preferences are all absent because none of them can change
      what the replicating trade costs.

      This is the cleanest instance of the principle behind all derivatives pricing: **you are not
      forecasting, you are costing a hedge.**
  - q: Why is the forward price not the expected future spot price?
    difficulty: intermediate
    tags: [expectation, risk-premium, core]
    a: |
      Because $F_0 = S_0e^{rT}$ contains $r$, not the asset's expected return $\mu$. Under the real
      measure $\P$, $\E[S_T] = S_0e^{\mu T}$, so

      $$F_0 = \E^\P[S_T]\,e^{-(\mu - r)T}$$

      The gap is the risk premium. For equities $\mu > r$, so the forward trades *below* the
      expected spot — a long forward is expected to make money, which is the compensation for
      bearing the risk.

      Equivalently: $F_0 = \E^\Q[S_T]$ exactly. The forward price is an expectation, but under the
      risk-neutral measure, where the drift is $r$ by construction. "The futures curve is the
      market's forecast" is one of the most common and most confidently stated errors in finance:
      an upward-sloping curve tells you about carry, not about direction.
  - q: A stock pays a continuous dividend yield q. What is the forward price, and what breaks if you ignore q?
    difficulty: intermediate
    tags: [dividends, cost-of-carry]
    a: |
      $$F_0 = S_0e^{(r-q)T}$$

      Holding the share now earns the dividends; holding the forward does not. The replication buys
      $e^{-qT}$ shares rather than one, since reinvested dividends grow the holding to exactly one
      share by $T$.

      **What breaks if you ignore it:** you overprice the forward by
      $S_0e^{rT}\big(1 - e^{-qT}\big)$ — the *future* value of the dividends you forgot to subtract,
      whose present value is $S_0(1-e^{-qT})$. Relative to the correct forward that is
      $e^{qT}-1$, so on an index at $q = 2\%$ over one year it is a 2% error —
      vastly larger than any bid-ask spread, and it flows straight into every option priced off that
      forward. Index futures fair value, dividend-risk on a delta-one desk and the early-exercise
      boundary of an American call are all this one term.
  - q: Forwards and futures have the same payoff. Why can their prices differ?
    difficulty: advanced
    tags: [futures, margin, correlation, convexity]
    hint: One of them pays you cash along the way.
    a: |
      Futures are **marked to market daily**; forwards settle once at $T$. So a futures holder
      receives or pays cash before maturity, and that cash is invested or financed at the prevailing
      short rate.

      If rates and the asset price are **positively correlated**, you receive margin gains exactly
      when reinvestment rates are high and fund losses when rates are low — an advantage. Futures
      must therefore trade *above* forwards to compensate. Negative correlation reverses it, and if
      rates are deterministic the two are identical.

      $$\text{Futures} > \text{Forward} \iff \Corr(\d S, \d r) > 0$$

      **Where it matters:** it is negligible for short-dated equity futures and material for
      long-dated interest-rate futures, where the asset *is* the rate — hence the convexity
      adjustment applied to Eurodollar and SOFR futures. A second difference matters just as much in
      practice: a future has no counterparty risk to speak of, a forward has plenty.
  - q: Gold forwards trade at a 3% annual premium to spot. Rates are 5%. Is there an arbitrage?
    difficulty: advanced
    tags: [arbitrage, storage, desk]
    a: |
      Cost-of-carry says $F = S e^{(r + u - y)T}$ with $u$ storage and $y$ any convenience or lease
      yield. The observed premium is 3% against a 5% funding cost, so the market is quoting an
      implied $y - u \approx 2\%$.

      **The cash-and-carry direction:** sell the forward, borrow at 5%, buy and store gold. You earn
      the 3% premium and pay 5% plus storage — a loss. So no arbitrage that way.

      **The reverse direction requires borrowing gold**, and that is the point: you must pay the
      lease rate. If the gold lease market clears near 2%, the quote is fair and there is nothing to
      do. Only if you can borrow gold below that does a trade exist.

      The general lesson: an apparent violation of cost-of-carry is nearly always a missing carry
      component — a lease rate, a storage cost, a hard-to-borrow spread, a tax or a balance-sheet
      charge — rather than free money. The honest first move is to ask which one you have failed to
      price, not to size the trade.
  - q: What does a long forward's payoff diagram look like, and why does that make it a bad hedge for a call?
    difficulty: foundational
    tags: [payoff, hedging, delta]
    a: |
      Linear: $S_T - K$, unbounded both ways, crossing zero at $K$. Delta is exactly $1$ everywhere
      and gamma is exactly zero.

      **Why it cannot hedge a call:** a call's delta runs from 0 to 1 depending on where spot is, so
      a fixed one-for-one forward hedge is right at exactly one price and wrong everywhere else. The
      mismatch is gamma, and gamma is precisely the thing a linear instrument cannot supply.

      This is the structural reason options need *dynamic* hedging while forwards need none. It also
      explains what a forward *can* do perfectly: hedge a known future quantity of the asset. If
      your exposure is linear, hedge it linearly; reaching for options there just buys convexity you
      did not need and pays theta for the privilege.
---

## Intuition

A forward contract is an agreement made today to trade an asset at a fixed price on a fixed future
date. No money changes hands now. The only question is what that fixed price should be.

The answer needs no forecasting, because there are two ways to own the asset at $T$:

1. **Buy it now** — pay $S_0$ today, finance it at $r$, collect any income it pays.
2. **Buy it forward** — pay nothing now, pay $F_0$ at $T$.

Both leave you holding the asset at $T$. If they are not equally expensive, the cheaper route
combined with the more expensive one is a money machine. Setting the two costs equal gives the
forward price — and nothing about the asset's volatility or expected return enters, because neither
affects what the financing costs.

:::insight
The forward price is not a prediction. It is the **cost of carrying the asset to the delivery date**
— financing minus income, plus storage. An upward-sloping futures curve (contango) means carry is
expensive, not that the market expects prices to rise. Traders who read the curve as a forecast are
the reason the roll-yield trade exists.
:::

This is worth internalising before anything harder, because the entire options-pricing edifice is
the same argument made dynamic. Forwards can be replicated *once, statically*, so no model is
needed. Options require a hedge that changes as the price moves, and the price of the option becomes
the cost of running that hedge — which is where a model, and therefore volatility, finally enters.

## Mathematical Formulation

:::formula {name="Forward price, no income" used-in="Equities, Delta-One, Index Futures" note="Pure financing. No volatility, no drift, no probability — the replication is pathwise."}
F_0 = S_0e^{rT}
:::

:::formula {name="Cost of carry, general" used-in="Commodities, FX, Equities" note="q is income (dividend or foreign rate), u is storage, y is convenience or lease yield. Every apparent arbitrage is usually a missing term here."}
F_0 = S_0\,e^{(r - q + u - y)T}
:::

:::formula {name="Covered interest parity" used-in="FX, Rates" note="The FX case of cost of carry: the forward points are the interest-rate differential, not a currency forecast."}
F_0^{\text{FX}} = S_0\,e^{(r_{\text{dom}} - r_{\text{for}})T}
:::

:::formula {name="Value of an existing forward" used-in="Mark-to-Market, Risk" note="Zero at inception because F_0 is set to K. Afterwards it is the discounted change in the forward price."}
V_t = (F_t - K)\,e^{-r(T-t)}
:::

:::formula {name="Forward as a risk-neutral expectation" used-in="Pricing Theory" note="The bridge to option pricing: F_0 is an expectation, but under Q, not P. This is why F replaces S e^{rT} in Black-76."}
F_0 = \E^\Q[S_T]
:::

## Derivation

:::derivation The cash-and-carry argument, both directions
**Suppose $F_0 > S_0e^{rT}$.** Today: sell the forward (costs nothing), borrow $S_0$ at $r$, buy the
asset. At $T$: deliver the asset into the forward, receive $F_0$, repay $S_0e^{rT}$. Profit
$F_0 - S_0e^{rT} > 0$, locked in today, with no position left over and no exposure to $S_T$.

**Suppose $F_0 < S_0e^{rT}$.** Reverse everything: buy the forward, short the asset, lend the
proceeds. At $T$: collect $S_0e^{rT}$, pay $F_0$, take delivery and close the short. Profit
$S_0e^{rT} - F_0 > 0$.

Both trades are riskless and self-financing, so neither inequality can persist:

$$F_0 = S_0e^{rT}$$

Note what the argument did *not* use: any assumption about the distribution of $S_T$, any risk
preference, any model. It used only that the two portfolios have identical payoffs in **every**
state — and that shorting is possible, which is the assumption that actually fails in practice.
:::

:::derivation Adding income, and why you buy fewer than one share
With a continuous dividend yield $q$, buy $e^{-qT}$ shares today and reinvest the dividends in more
shares. The holding grows at rate $q$, so it reaches exactly one share at $T$ — which is what the
forward requires you to deliver.

The financing cost of that smaller initial position is $S_0e^{-qT}\cdot e^{rT}$, so

$$F_0 = S_0e^{(r-q)T}$$

For discrete dividends with present value $D$, the same logic gives $F_0 = (S_0 - D)e^{rT}$: pay
for the share, immediately recover the dividend stream's present value, finance the remainder.

**Read $r - q$ as the net carry.** If $q > r$ the forward trades below spot even with positive
rates. That is not a bearish signal — it is the market saying the asset pays you more to hold than
the money costs.
:::

:::derivation Why futures and forwards differ under stochastic rates
Consider holding one futures contract and reinvesting every daily settlement at the overnight rate.
The terminal value of the accumulated margin flows is

$$\sum_i (F_{t_{i+1}} - F_{t_i})\,e^{r(T-t_{i+1})}$$

Each increment is scaled by a *random* reinvestment factor. If $\d F$ and $\d r$ are positively
correlated, the large positive increments get the large multipliers and the negative ones the small
— so the sum has positive expectation relative to the single settlement a forward provides. To keep
both contracts worth zero at inception, the futures price must be higher.

Formally, the futures price is a martingale under $\Q$ with the *rolling* money-market numéraire
while the forward price is a martingale under the $T$-forward measure; the difference is a
covariance term. With deterministic $r$ the two measures coincide and the prices are equal — which
is why the distinction can be ignored for equity index futures and cannot be for SOFR futures,
where the underlying *is* the rate and the correlation is $-1$ by construction.
:::

## Assumptions & Edge Cases

:::assumption
The cost-of-carry relation assumes:

- **Shorting the asset is possible** at no extra cost. Frequently false — hard-to-borrow stocks,
  physical commodities, electricity.
- **One risk-free rate** for lending and borrowing. Real desks face a spread, so the no-arbitrage
  band has width rather than being a point.
- **No transaction costs, no margin drag, no balance-sheet charge.** Post-2008, funding and capital
  charges are large enough to be part of the fair value.
- **The asset is storable.** Electricity is not, so its forward curve is *not* pinned by carry and
  genuinely does contain expectations.
- **Deterministic income.** Dividend forecasts are not certain; the residual is dividend risk, a
  real P&L line on a delta-one desk.
:::

:::warning
**Convenience yield is not an observable — it is the plug.** When a commodity forward trades below
$Se^{(r+u)T}$, the difference is *labelled* a convenience yield, but that label is fitted, not
measured. It absorbs the value of physical availability, storage constraints, and the plain
impossibility of shorting a physical barrel. Treating a fitted plug as a tradable rate is how
commodity carry strategies discover that the "arbitrage" they measured was a cost they could not
pay.
:::

## Worked Example

**An index at 4,000, $r = 5\%$, $q = 2\%$, three-month future quoted at 4,050. Is it rich?**

Fair value:

$$F_0 = 4000\,e^{(0.05-0.02)\times 0.25} = 4000\,e^{0.0075} = 4030.1$$

The future is **20 points rich**, about 0.5%. The trade: sell the future, buy the basket, finance
it. You collect $4050 - 4030 = 20$ points at convergence.

Before sizing it, price the frictions honestly:

| Item | Cost (index points) |
|---|---|
| Gross basis | $+20.0$ |
| Bid-ask on 500 names | $-6$ to $-10$ |
| Financing spread over risk-free (30bp) | $-3.0$ |
| Dividend forecast error ($\pm10\%$ of 20pt) | $\pm2.0$ |
| Margin funding on the short future | $-1.5$ |
| **Net** | $\mathbf{+5.5}$ **to** $\mathbf{+9.5}$, $\pm 2$ |

**A 20-point mispricing is a 5-to-9-point trade.** That ratio is typical, and it is the entire reason
index-arbitrage is a business for whoever has the cheapest balance sheet rather than the best model.
Note also that the dividend forecast error is the *only* line that is not contractual — which makes
dividend risk, not basis risk, the thing that actually loses money on this desk.

## Why It Matters in Quant Finance

**It is the template for every pricing argument you will meet.** Replicate the payoff, equate the
costs, conclude the price. Options use the same three steps; the only difference is that the
replicating portfolio must be rebalanced, so the cost of the hedge depends on how much the price
moves — and *that* is where volatility enters the story. Understanding why forwards need no
volatility is the fastest route to understanding why options do.

**It gives you the forward, which is what options are actually written on.** In Black–Scholes,
$S_0e^{(r-q)T}$ appears everywhere; rewriting the formula in terms of $F$ gives Black-76, which is
the market standard for options on futures, caps, floors and swaptions. Practitioners quote and
hedge in forward space because the forward is directly tradable and absorbs all the carry
assumptions into one number.

**It separates carry from expectation, permanently.** Once the curve is understood as carry, three
things follow: the futures curve is not a forecast; roll yield is a real return source with a
mechanical explanation; and any strategy claiming to profit from "the market's mistaken forecast in
the curve" needs to explain which carry component it is really trading.

**It is where the no-arbitrage bounds on option prices come from.** $C \ge \max(S - Ke^{-rT}, 0)$
is the statement that a call is worth at least a forward, and
[[put-call-parity|put-call parity]] is the statement that a call minus a put *is* a forward.

## Trading & Research Application

:::desk
**Basis is a funding trade dressed as an arbitrage.** The gross basis on index futures is roughly
the financing spread you can achieve. Whoever funds cheapest wins, which is why this sits on bank
delta-one desks and not in hedge funds. If your model says the basis is rich and you cannot fund at
the rate the model assumed, your model priced someone else's trade.

**Roll yield is carry, and it is persistent.** A commodity in contango bleeds as long futures roll
up the curve into cheaper spot; in backwardation it earns. Long-only commodity index products have
lost more to contango than to spot moves. The mechanism is completely mechanical, which is why the
premium has survived being widely known.

**Hedge linear exposure with linear instruments.** A known future quantity of an asset is hedged
exactly by a forward, at zero cost and with no gamma to manage. Reaching for options there buys
convexity you do not need and pays theta for it. Save options for exposures that are genuinely
non-linear, or for genuine uncertainty about the *quantity* you will need to hedge.

**Watch the dividend line.** On a forward or a delta-one book, the only non-contractual input is
projected income. Dividend risk is the residual that survives a perfect basis hedge, and it is
usually the largest single unhedged exposure on the desk.
:::

## Implementation Notes

```python
import numpy as np

def forward_price(spot, r, T, q=0.0, storage=0.0, convenience=0.0):
    """Cost of carry. Every input is a RATE, continuously compounded, so the
    exponent is just the net carry. Keeping storage and convenience separate
    from q matters: q is contractual income, convenience is a fitted plug --
    conflating them is how a storage cost silently becomes 'alpha'."""
    net_carry = r - q + storage - convenience
    return spot * np.exp(net_carry * T)

def implied_carry(forward, spot, T):
    """Back out the net carry the market is quoting. Compare this to your own
    funding rate before calling a basis rich or cheap: the answer is usually
    that the market's carry is right and your funding is worse."""
    return np.log(forward / spot) / T

def forward_value(forward_now, strike, r, T_remaining):
    """A forward struck at `strike` is worth zero at inception and this
    afterwards. Discounting matters: the P&L is realised at maturity, not now."""
    return (forward_now - strike) * np.exp(-r * T_remaining)

# The sanity check that catches a sign error in q:
#   forward_price(100, 0.05, 1, q=0.05) == 100.0   (carry nets to zero)
#   forward_price(100, 0.02, 1, q=0.05) < 100.0    (income beats funding)
```

## Common Mistakes

:::pitfall
- **Reading the futures curve as a forecast.** It is carry. This is the most common error in
  commodities and FX, and it is made confidently.
- **Confusing $F_0$ with $\E^\P[S_T]$.** They differ by the risk premium. $F_0 = \E^\Q[S_T]$ is the
  correct statement.
- **Dropping the dividend yield.** A 2% error on an index forward dwarfs every spread in the trade
  and contaminates every option priced off it.
- **Treating futures and forwards as identical without checking the rate correlation.** Fine for
  short-dated equities, wrong for rate futures, which need a convexity adjustment.
- **Assuming you can short.** The reverse cash-and-carry needs a borrow. Where the borrow is
  expensive or unavailable, the no-arbitrage bound is one-sided and the "mispricing" is real but
  untradeable.
- **Quoting a basis without netting frictions.** Gross basis is not P&L; funding spread, bid-ask
  and dividend uncertainty routinely eat three-quarters of it.
- **Mixing compounding conventions.** $e^{rT}$ and $(1+r)^T$ differ enough to swamp a basis trade;
  pick continuous compounding and stay there.
:::

## 30-Second Revision

- $F_0 = S_0e^{(r-q)T}$. Financing minus income. No volatility, no probability, no forecast.
- The argument is static replication: identical payoffs in **every** state, so identical prices.
- $F_0 = \E^\Q[S_T] \ne \E^\P[S_T]$; the gap is the risk premium.
- General carry: $F_0 = S_0e^{(r-q+u-y)T}$. An apparent arbitrage is usually a missing carry term.
- Contango means expensive carry, not bullish expectations. Roll yield is the return to that carry.
- Futures $>$ forwards when $\Corr(\d S,\d r) > 0$ — daily margin gets reinvested. Equal under
  deterministic rates; the source of the futures convexity adjustment.
- Value of an existing forward: $(F_t - K)e^{-r(T-t)}$; zero at inception.
- Delta $1$, gamma $0$ — perfect for linear exposure, useless as a static hedge for an option.
- Options are this argument made dynamic: that is where a model and a volatility appear.
