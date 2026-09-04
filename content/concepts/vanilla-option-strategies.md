---
id: vanilla-option-strategies
title: Vanilla Option Strategies
subject: options
summary: Spreads, straddles, butterflies and risk reversals are not a catalogue of trades to memorise — each one isolates a different feature of the risk-neutral distribution, and the structure you choose is the statement of which feature you think the market has priced wrong.
difficulty: intermediate
interview_relevance: 5
tags: [options, strategies, spreads, straddle, strangle, butterfly, condor, risk-reversal, collar, calendar, skew, volatility, payoff, static-replication]
prerequisites: [option-greeks, put-call-parity]
related: [black-scholes-formula, black-scholes-equation, forwards-and-futures]
aliases: [option strategies, vertical spread, bull call spread, bear put spread, straddle, strangle, butterfly spread, iron condor, risk reversal, collar, covered call, protective put, calendar spread, option structures, payoff diagram]
updated: 2026-09-04
references:
  - title: "Hull, *Options, Futures and Other Derivatives*, ch. 12"
    url: ""
  - title: "Natenberg, *Option Volatility and Pricing*, ch. 11–13"
    url: ""
  - title: "Breeden & Litzenberger (1978), *Prices of State-Contingent Claims Implicit in Option Prices*"
    url: ""
  - title: "Carr & Madan (2001), *Optimal Positioning in Derivative Securities*"
    url: ""
questions:
  - q: A candidate says a bull call spread is "a long call with less risk". What is wrong with that description?
    difficulty: intermediate
    tags: [core, spreads, risk]
    hint: Compare the two positions leg by leg, and ask what you gave up to get the discount.
    a: |
      It is wrong about *what* was reduced. Buying the 100 call and selling the 110 call does not
      make the long call safer — **you still lose the entire debit if the stock goes nowhere.** What
      the short leg reduces is the *cost*, and it does that by selling away every payoff above 110.

      Concretely, at $S=100$, $T=0.25$, $r=4\%$, $\sigma=25\%$:

      | | Long 100 call | 100/110 call spread |
      |---|---|---|
      | Cost | 5.47 | **3.55** |
      | Max loss | 5.47 | 3.55 |
      | Max profit | unbounded | **6.45** |
      | Vega | +0.197 | **+0.033** |
      | Gamma | +0.032 | **+0.005** |

      The honest description is that a spread is **a different trade, not a cheaper one**. Vega and
      gamma both collapse by 83.4% — the same figure, because at a single maturity
      $\mathcal{V} = \sigma T S^2 \Gamma$ makes them proportional — so you have converted a
      volatility position into an almost-pure directional one with a capped target. If your view is
      "up, but not past 110, and I do not want to be paid for volatility", the spread expresses it.
      If your view is "this could really move", the spread is the wrong instrument and the discount
      is the price of being wrong about the tail.

      **The tell an interviewer listens for:** does the candidate mention that max loss is unchanged
      as a fraction of premium paid, and that the reduction is in *Greeks*, not in *risk*?
  - q: What does the price of a butterfly tell you about the market's risk-neutral distribution?
    difficulty: advanced
    tags: [core, butterfly, density, breeden-litzenberger]
    hint: Write the butterfly as a finite difference in the strike.
    a: |
      A butterfly is a **second difference in strike**, so its price is a discrete second derivative
      of the call price with respect to strike:

      $$\text{Fly}(K,h) = C(K-h) - 2C(K) + C(K+h) \approx h^2\,\frac{\partial^2 C}{\partial K^2}
      = h^2 e^{-rT} f_{\mathbb{Q}}(K)$$

      That is **Breeden–Litzenberger**: the butterfly, normalised by $h^2$, *is* the discounted
      risk-neutral density at the middle strike. A butterfly is not a directional trade with a good
      payoff ratio — it is a long position in the market's probability of finishing at one point.

      Numerically, with the same inputs as above, the exact BS value of
      $e^{-rT}f_{\mathbb{Q}}(100)$ is $0.031593$, and:

      | Wing spacing $h$ | Fly price | Fly / $h^2$ | Error |
      |---|---|---|---|
      | 10 | 3.0038 | 0.030038 | −4.9% |
      | 5 | 0.7797 | 0.031188 | −1.3% |
      | 2.5 | 0.1968 | 0.031489 | −0.3% |
      | 1 | 0.0316 | 0.031583 | −0.03% |

      **Why this matters more than it looks.** It says option prices across strikes carry the whole
      distribution, not just its variance — which is why a desk quotes a smile rather than a number,
      and why "the market's implied probability of X" is a computation, not an opinion. It also
      gives you a hard no-arbitrage constraint: densities are non-negative, so **every butterfly
      must be worth at least zero**. A negative butterfly on your screen is either an arbitrage or,
      far more often, a broken quote.
  - q: You sell a 95/105 strangle and win on roughly 70% of trades. Is that a good strategy?
    difficulty: intermediate
    tags: [core, short-vol, expectation, risk]
    hint: Win rate and expectation are different quantities. What is the payoff distribution shaped like?
    a: |
      The win rate is not evidence of anything. **A short strangle is engineered to win often and
      lose big** — that is what selling the wings does to the shape of the payoff, and it is true of
      a profitable one and an unprofitable one alike.

      Under the same BS inputs, the 95/105 strangle collects 5.78 and
      $\mathbb{Q}(95 < S_T < 105) = 31\%$, so you keep the full premium about a third of the time
      and something less than it far more often. In a risk-neutral world the expectation is exactly
      zero by construction; the high win rate comes entirely from the *asymmetry*, not from edge.

      **What would make it a good strategy** is one thing only: that implied volatility is above
      what will be realised, by more than the transaction costs and the risk premium you are owed
      for holding a short-convexity position. That is a claim about $\sigma_{\text{impl}}$ vs
      $\sigma_{\text{real}}$, and it is testable. The win rate is not.

      **The trap in the question** is the invitation to argue about the strategy. The right move is
      to reject the metric: ask for the P&L distribution, the worst drawdown, and the realised-vs-
      implied spread over the sample. A strategy whose edge cannot be stated as a mispricing is a
      strategy whose edge has not been identified. See [[kelly-criterion]] for what repeated
      exposure to a left tail does to compounded wealth even when each bet has positive expectation.
  - q: Why does a long butterfly have negative gamma at the middle strike, when it is described as a "low-risk" structure?
    difficulty: advanced
    tags: [butterfly, gamma, greeks]
    a: |
      Because the middle strike is where you are **short two options** and the wings contribute
      little. With the 95/100/105 call fly at $S=100$:

      $$\Gamma_{\text{fly}} = \Gamma_{95} - 2\Gamma_{100} + \Gamma_{105}
      = 0.0274 - 2(0.0316) + 0.0310 = -0.0048$$

      Negative. And correspondingly $\Theta_{\text{fly}} = +0.0042$ per day — the fly *collects*
      theta near the centre. That is the whole trade: **you are paying a small debit for a position
      that wants the spot to sit exactly still**, and it earns while it does.

      The "low risk" label refers only to the bounded max loss (the debit). The risk that matters is
      that it is short gamma exactly where the spot currently is, so a move in either direction
      hurts immediately — the position is at its most fragile at the moment you put it on. The
      convexity flips sign in the wings, which is what caps the loss, but you experience the short
      gamma first.

      **The general rule:** in any structure, the sign of gamma at a point is set by the net option
      position *near that point*, not by the shape of the payoff far away. Reading the whole
      structure's Greeks at one spot and calling it "the position" is the mistake.
  - q: Take a 100/110 call spread and shrink the width to zero, dividing by the width. What do you get?
    difficulty: advanced
    tags: [digital, spreads, limits, replication]
    hint: This is a first difference in strike, not a second.
    a: |
      A **digital (binary) call** — a claim paying \$1 if $S_T > K$:

      $$\lim_{h\to 0}\frac{C(K) - C(K+h)}{h} = -\frac{\partial C}{\partial K} = e^{-rT}\,
      \mathbb{Q}(S_T > K) = e^{-rT}N(d_2)$$

      With the inputs above, $e^{-rT}N(d_2) = 0.5019$, and the normalised spread converges to it:
      width 10 gives 0.3554, width 2 gives 0.4706, width 1 gives 0.4862, width 0.5 gives 0.4940.

      **Two things an interviewer wants out of this.** First, that $N(d_2)$ is the risk-neutral
      probability of finishing in the money — the $N(d_1)$ in the [[black-scholes-formula|Black–Scholes
      formula]] is *not*, it is a delta. Second, that this is how digitals are actually risk-managed:
      nobody hedges the discontinuity, they trade a tight call spread instead, which over-hedges
      slightly and is finite everywhere. The convergence above is slow and one-sided, which is
      exactly why the *width* is a commercial decision rather than a modelling one.

      Note the pairing with the previous question: the **first** difference in strike gives the
      cumulative distribution, the **second** gives the density. Vertical spreads and butterflies
      are the market's difference operators.
  - q: What is a risk reversal, and what does its price tell you?
    difficulty: intermediate
    tags: [skew, risk-reversal, surface]
    a: |
      Long an out-of-the-money call, short an out-of-the-money put (or the reverse), usually at
      symmetric deltas — the 25-delta risk reversal is the market standard. It is **the cleanest
      traded expression of skew**.

      Under a flat volatility, symmetric-delta calls and puts cost roughly the same, so the
      structure is near costless and is almost pure delta. Every real market prices it away from
      that, and the sign tells you which tail the market is paying up for:

      - **Equity indices:** puts are persistently richer. The risk reversal trades for a credit if
        you buy the call, and the 25-delta RR quoted in vol terms is negative — typically several
        volatility points. Crash-o-phobia plus the leverage effect.
      - **FX:** the sign flips with the pair and with the regime; the RR is quoted, tracked and
        traded as the skew instrument in its own right.
      - **Commodities:** frequently positive skew — the supply shock is to the upside.

      **Why it earns its own quote.** A surface has three degrees of freedom a desk cares about at
      each maturity: the level (ATM vol), the slope (risk reversal), and the curvature (butterfly).
      Those three structures span what you can bet on, which is why the market quotes *them* rather
      than individual strikes. Trading a single option mixes all three exposures together; trading
      the structure isolates one.
  - q: A calendar spread is often called a theta trade. Why is that description incomplete?
    difficulty: advanced
    tags: [calendar, vega, term-structure]
    a: |
      Because its dominant exposure is **vega across the term structure**, not theta.

      Sell the near-dated option, buy the far-dated one at the same strike. Theta scales roughly as
      $1/\sqrt{T}$ and vega as $\sqrt{T}$, so the short leg has the bigger theta and the long leg
      has the much bigger vega. You collect decay, yes — but you are **long the far-dated
      volatility and short the near-dated one**, which is a bet on the *slope* of the term
      structure.

      That is why calendars behave the way people find surprising. A parallel shift up in the
      surface makes money (you are net long vega). A near-dated vol spike — earnings, a data print,
      a scare — loses money even though "nothing happened to the stock", because the leg you are
      short is the one that repriced.

      **The correct framing:** a calendar is the term-structure analogue of a butterfly. The fly
      isolates curvature across *strike*; the calendar isolates slope across *time*. Anyone
      describing it as a theta trade is reading one Greek off a position with a bigger one.
  - q: Show that any European payoff can be replicated with vanilla options, and explain why that matters.
    difficulty: research
    tags: [replication, carr-madan, spanning]
    hint: Write the payoff as a second-order Taylor expansion with an exact integral remainder.
    a: |
      For any twice-differentiable $g$ and any reference level $F$:

      $$g(S_T) = g(F) + g'(F)(S_T - F) + \int_0^{F} g''(K)(K-S_T)^+ \,\d K
      + \int_{F}^{\infty} g''(K)(S_T-K)^+ \,\d K$$

      This is the **Carr–Madan spanning formula**, and it is an algebraic identity, not an
      approximation — the integral remainder of a second-order Taylor expansion, written with the
      remainder in terms of hockey-stick functions. Reading it left to right: a constant (bonds), a
      linear term (a forward), and a continuum of vanillas weighted by the payoff's own second
      derivative.

      Taking risk-neutral expectations gives the price directly, with no model:

      $$e^{-rT}\E_{\mathbb{Q}}[g(S_T)] = e^{-rT}g(F) + \int_0^F g''(K)P(K)\,\d K
      + \int_F^\infty g''(K)C(K)\,\d K$$

      **Why it matters.** Three consequences, in ascending order of importance:

      1. Every structure on this page is a special case. A butterfly is $g'' = $ a spike; a vertical
         spread is $g''$ = a pair of spikes; a straddle is $g''$ = a spike at the strike with a kink.
      2. It makes **variance swaps replicable**. Put $g(S) = \log S$, so $g'' = -1/K^2$, and you get
         the log-contract weighting that underlies the VIX: a $1/K^2$-weighted strip of
         out-of-the-money options. That is why the VIX is computed from a strip of option prices
         rather than from a model.
      3. It settles what "the vanilla market" is for. It is not a menu of trades — it is a **basis**.
         The strike axis carries the whole risk-neutral distribution, and any European claim is a
         portfolio of what is already listed.

      **The caveats that make it a real answer.** Strikes are discrete, so the integral becomes a
      sum and the replication is approximate at the wings; the tails are illiquid exactly where
      $g''$ may be largest; and $g$ must be a function of $S_T$ alone — anything path-dependent is
      outside the theorem entirely.
---

## Intuition

There is a temptation to learn option strategies as a catalogue: here is the bull call spread, here
is the iron condor, here is when to use each. That is the wrong shape for the knowledge, and it
falls apart the moment an interviewer asks *why* rather than *which*.

The useful frame is this. A vanilla option market gives you one instrument per strike, per expiry.
Combining them lets you build almost any payoff you like — so the question is never "which strategy"
but **which feature of the distribution do I think is mispriced, and what is the cheapest way to own
exactly that feature and nothing else?**

Four questions determine the structure completely:

| Question | The exposure | The instrument |
|---|---|---|
| Which way? | delta | calls, puts, verticals |
| How much will it move? | gamma / vega | straddles, strangles |
| Which tail is scarier? | skew | risk reversals, collars |
| When will it move? | term structure | calendars, diagonals |

Everything else is a combination. An iron condor is two verticals. A collar is a risk reversal plus
stock. A covered call is a short put in disguise — [[put-call-parity|parity]] says so, and that is
not a metaphor but an identity.

:::insight
The legs are not the trade. **The trade is the exposure profile**, and the legs are one of several
ways to build it.

This matters commercially, not just conceptually. If you want long gamma and you are indifferent to
direction, a straddle and a strangle both deliver it — you pick between them on cost, on where the
gamma sits, and on which strikes are liquid. And if a market maker can build your requested profile
more cheaply out of different legs, they will, and the price you get reflects *their* cheapest
construction. Knowing what you actually want is what stops you paying for exposures you did not ask
for.
:::

## Mathematical Formulation

Every structure here is a weighted sum of hockey sticks. Write the terminal payoff of a portfolio
holding $w_i$ of a call at strike $K_i$, $v_j$ of a put at strike $L_j$, $\alpha$ shares and $\beta$
in cash:

:::formula {name="Portfolio of vanillas" used-in="Options, Structuring, Risk" note="Piecewise linear in S_T, with a kink at every strike held. The slope between strikes is the expiry delta, and it steps by the position size at each kink."}
\Pi(S_T) = \sum_i w_i (S_T-K_i)^+ + \sum_j v_j (L_j-S_T)^+ + \alpha S_T + \beta
:::

The three structures that matter most are the three finite differences in strike.

:::formula {name="Vertical spread as a first difference" used-in="Options, Directional Trading, Digitals" note="Normalised by the width it converges to a digital: the risk-neutral CDF. Bounded payoff, bounded loss, capped gain."}
C(K_1) - C(K_2) \;\xrightarrow[\;K_2 \to K_1\;]{}\; -(K_2-K_1)\frac{\partial C}{\partial K}
= (K_2-K_1)\,e^{-rT}\,\mathbb{Q}(S_T > K_1)
:::

:::formula {name="Butterfly as a second difference (Breeden-Litzenberger)" used-in="Options, Volatility Surface, Density Estimation" note="The single most useful identity in the strike dimension: a butterfly IS the discounted risk-neutral density. Non-negativity of the density is a no-arbitrage constraint on quotes."}
C(K-h) - 2C(K) + C(K+h) \;\approx\; h^2\,\frac{\partial^2 C}{\partial K^2}
= h^2\,e^{-rT} f_{\mathbb{Q}}(K)
:::

:::formula {name="Carr-Madan spanning formula" used-in="Variance Swaps, VIX, Exotic Replication" note="An identity, not an approximation. Any European payoff is bonds plus a forward plus a strip of vanillas weighted by g''. This is why the VIX is computed from option prices."}
g(S_T) = g(F) + g'(F)(S_T-F) + \int_0^{F} g''(K)(K-S_T)^+\d K + \int_{F}^{\infty} g''(K)(S_T-K)^+\d K
:::

:::formula {name="At-the-money straddle approximation" used-in="Market Making, Quick Pricing, Mental Math" note="Accurate to well under 1% for short maturities. Worth memorising: it converts a volatility quote into a price in one step."}
\text{Straddle}_{\text{ATM}} \approx \sqrt{\tfrac{2}{\pi}}\,S\sigma\sqrt{T} \approx 0.8\,S\sigma\sqrt{T}
:::

The Greeks of a structure are the same weighted sums, because differentiation is linear:
$\Delta_\Pi = \sum_i w_i \Delta_i$, and likewise for $\Gamma$, $\mathcal{V}$ and $\Theta$. This is
why reading a structure is mechanical once you can read a single option — see [[option-greeks]].

## Derivation

:::derivation Why a butterfly is the risk-neutral density
Start from risk-neutral pricing: $C(K) = e^{-rT}\E_{\mathbb{Q}}\big[(S_T-K)^+\big]
= e^{-rT}\int_K^\infty (s-K) f_{\mathbb{Q}}(s)\,\d s$.

**First derivative.** Differentiate under the integral in $K$. The boundary term vanishes because
the integrand is zero at $s=K$:

$$\frac{\partial C}{\partial K} = -e^{-rT}\int_K^\infty f_{\mathbb{Q}}(s)\,\d s
= -e^{-rT}\,\mathbb{Q}(S_T > K)$$

So the negative slope of the call curve in strike is the discounted survival function — the digital
price. That is the vertical-spread limit.

**Second derivative.** Differentiate once more:

$$\frac{\partial^2 C}{\partial K^2} = e^{-rT} f_{\mathbb{Q}}(K)$$

**Now connect it to a tradable structure.** The central second difference is exactly the
butterfly's cost, and Taylor expansion of $C$ about $K$ gives

$$C(K-h) - 2C(K) + C(K+h) = h^2 C''(K) + \frac{h^4}{12}C''''(K) + O(h^6)$$

so the error is $O(h^2)$ *relative*, which matches the numbers in the table above: halving the
spacing quarters the error. Convergence is one-sided (the fly under-states the density) because
$C$ is convex in $K$ with positive fourth derivative in the usual case.

**The corollary worth carrying into an interview.** $f_{\mathbb{Q}} \ge 0$ forces
$C(K-h) - 2C(K) + C(K+h) \ge 0$: **call prices must be convex in strike**. Together with
monotonicity ($C$ decreasing in $K$, slope bounded by $-e^{-rT}$ and $0$), that is the complete set
of static no-arbitrage conditions along a single expiry, and it is what a surface fitter enforces.
:::

:::derivation The ATM straddle rule of thumb
At the money forward, $d_1 = -d_2 = \tfrac12\sigma\sqrt{T}$. The straddle is $C + P$, and by
[[put-call-parity|parity]] at $K = F$ the two are equal, so the straddle is $2C$:

$$C = e^{-rT}F\big[N(d_1) - N(d_2)\big] = e^{-rT}F\big[N(\tfrac{\sigma\sqrt T}{2}) - N(-\tfrac{\sigma\sqrt T}{2})\big]$$

For small $x$, $N(x) - N(-x) = 2N(x) - 1 \approx 2\phi(0)x = \sqrt{2/\pi}\,x$. With
$x = \sigma\sqrt{T}/2$:

$$\text{Straddle} = 2C \approx 2e^{-rT}F\cdot\sqrt{\tfrac{2}{\pi}}\cdot\frac{\sigma\sqrt T}{2}
= \sqrt{\tfrac{2}{\pi}}\,e^{-rT}F\,\sigma\sqrt{T} \approx 0.7979\,S\sigma\sqrt{T}$$

**Check it against the exact number.** At $S=100$, $T=0.25$, $\sigma=25\%$, $r=4\%$: the
approximation gives $0.7979 \times 100 \times 0.25 \times 0.5 = 9.974$ and the exact
Black–Scholes straddle is $9.949$ — an error of 0.25%.

Two uses. It converts an implied-vol quote into a cash price in your head, which is what "the
market is pricing a 5% move" means. And inverted, $\sigma \approx 1.25 \times
\text{straddle}/(S\sqrt T)$ reads the implied move straight off a screen price.
:::

:::derivation Why a covered call is a short put
Hold the stock and sell the call: $\Pi = S_T - (S_T-K)^+ = \min(S_T, K) = K - (K-S_T)^+$.

That is a cash amount $K$ minus a put payoff — **a short put plus a bond**, exactly. Rearranged, it
is [[put-call-parity|parity]] with the signs moved around, which is why the two positions have
identical Greeks, identical P&L and identical risk.

The point is not the algebra, it is what the algebra rules out. "Covered call writing is a
conservative income strategy, whereas selling naked puts is speculative" is a statement about two
positions that are the same position. Any argument for one and against the other has to be about
margin treatment, assignment mechanics or behaviour — never about risk.
:::

## Assumptions & Edge Cases

:::assumption
Everything above assumes European exercise, a single financing rate, continuous strikes and
frictionless trading. Each one bites somewhere real:

- **Discrete strikes** turn the spanning integral into a sum. Replication error concentrates in the
  wings, exactly where $g''$ is often largest and liquidity is worst.
- **American exercise** breaks the payoff identities into inequalities, and adds assignment risk on
  every short leg.
- **One rate** — in practice you pay the borrow on short stock and receive less on cash, so every
  identity becomes a band whose width is a funding spread.
- **Frictionless** is the assumption that fails first and hardest on multi-leg structures.
:::

:::warning
**Transaction costs scale with legs, and the effect is not small.** A four-leg iron condor crosses
four bid-ask spreads to open and four to close. If each option is quoted 0.10 wide and you cross the
full spread, that is 0.80 of round-trip cost on a structure that might collect 1.50 in premium —
over half the expected gross P&L, gone, before you have been right or wrong about anything.

This is the single most common reason a backtest of a spread strategy does not survive contact with
execution: the study priced every leg at mid. Two consequences worth stating in an interview: prefer
structures with fewer legs when the view can be expressed either way, and price multi-leg structures
as a package rather than leg by leg — which is what the exchange complex-order books exist for.
:::

:::pitfall
**Pin risk.** A short strike that finishes within pennies of spot at expiry leaves you not knowing
whether you were assigned until after the close, so you go into the weekend with an unknown stock
position and a delta of either 0 or ±100 per contract. It is a real operational risk, not a
theoretical one, and it is why desks flatten near-the-money short strikes into expiry rather than
holding them for the last few cents of premium.
:::

## Worked Example

Take $S = 100$, $T = 0.25$ years, $r = 4\%$, $\sigma = 25\%$ flat, and price the standard structures
from Black–Scholes. Individual options first:

| Option | Price | $\Delta$ | $\Gamma$ | Vega (per pt) | $\Theta$/day |
|---|---|---|---|---|---|
| 95 call | 8.377 | 0.710 | 0.0274 | 0.171 | −0.0303 |
| 100 call | 5.472 | 0.557 | 0.0316 | 0.197 | −0.0325 |
| 105 call | 3.347 | 0.402 | 0.0310 | 0.193 | −0.0305 |
| 110 call | 1.918 | 0.268 | 0.0263 | 0.165 | −0.0253 |
| 100 put | 4.477 | −0.443 | 0.0316 | 0.197 | −0.0217 |
| 95 put | 2.432 | −0.290 | 0.0274 | 0.171 | −0.0200 |

Now build the structures by adding rows:

| Structure | Cost | $\Delta$ | $\Gamma$ | Vega | $\Theta$/day |
|---|---|---|---|---|---|
| 100/110 call spread | 3.554 | +0.289 | +0.0053 | +0.033 | −0.0073 |
| 100 straddle | 9.949 | +0.113 | +0.0632 | +0.395 | −0.0542 |
| 95/105 strangle | 5.779 | +0.112 | +0.0583 | +0.365 | −0.0505 |
| 95/100/105 butterfly | 0.780 | −0.001 | **−0.0048** | −0.030 | **+0.0042** |

**Read the table, not the names.** Three things jump out that the strategy names actively hide:

1. The **call spread has almost no vega** (+0.033 against +0.197 for the outright call). It is a
   directional trade. If your thesis is "vol is cheap", this instrument does not express it.
2. The **butterfly is short gamma and long theta** at the money, despite being a debit structure
   with a bounded loss. It wants nothing to happen.
3. The **straddle and strangle are nearly the same trade** — 0.063 vs 0.058 gamma, 0.395 vs 0.365
   vega — but the strangle costs 42% less. What you give up is where the gamma sits: the strangle's
   is spread across two strikes and dies faster if the spot sits still between them.

**Now the butterfly as a probability statement.** It costs 0.780 with a maximum payoff of 5.00 — a
6.4:1 ratio that looks like a gift. It is not:

$$\mathbb{Q}(95 < S_T < 105) = 31.1\%$$

and you only collect the full 5.00 if the stock finishes at exactly 100. Integrating the payoff
against the risk-neutral density gives $e^{-rT}\E_{\mathbb{Q}}[\text{payoff}] = 0.7797$ — **the
price, to four decimals.** The 6.4:1 is precisely compensated by how rarely and how partially it
pays.

:::insight
That last calculation is the whole discipline in one line. A payoff ratio is not edge. The
risk-neutral density is exactly the weighting that makes every structure fair, so **any argument
that a structure is attractive must be an argument that the real-world density differs from the
risk-neutral one** — in the specific region that structure is exposed to.

Which is a much harder claim than "6.4:1", and a much more honest one.
:::

:::module black-scholes-lab
{"K": 100, "T": 0.25, "sigma": 0.25, "r": 0.04, "view": "gamma"}
:::

## Why It Matters in Quant Finance

**The vanilla surface is a basis, not a menu.** Carr–Madan says any European claim is a portfolio of
listed options. So the strike axis is not a list of trades — it is a coordinate system for the
risk-neutral distribution, and structures are the projections onto its components.

That is why volatility surfaces are quoted the way they are. At each maturity a desk quotes three
numbers — **ATM volatility, the 25-delta risk reversal, and the 25-delta butterfly** — because they
are the level, slope and curvature of the smile, and the three structures that isolate them. A
quoting convention is a statement about which degrees of freedom are worth trading separately.

The same logic produces the VIX. Put $g(S) = \log S$ into the spanning formula, so
$g''(K) = -1/K^2$, and the log-contract is replicated by a $1/K^2$-weighted strip of out-of-the-money
options. The variance swap rate — and therefore the VIX — is a **model-free** functional of observed
option prices. No Black–Scholes anywhere: just the identity, applied to a strip.

:::desk
**What this buys you in research.** Given a screen of option prices you can extract, with no model:

- the risk-neutral CDF (vertical spreads),
- the risk-neutral density (butterflies),
- the market's expected variance (the log-contract strip),
- the implied probability of any event you can write as a European payoff.

Every one of those is a *forecast the market is publishing*, and comparing it to the realised
distribution is one of the oldest and most durable sources of research questions in the field — the
variance risk premium is exactly the gap between the third bullet and what subsequently realises.
:::

## Trading & Research Application

**Choosing the structure is choosing the risk premium you want to harvest.** The main ones:

| View | Structure | What you are actually paid for |
|---|---|---|
| Implied > realised vol | short straddle, delta-hedged | variance risk premium |
| Skew is too steep | risk reversal | the crash premium in index puts |
| Vol of vol is overpriced | short butterfly / condor | curvature premium |
| Term structure too steep | calendar | the slope of the vol curve |
| Directional, capped | vertical spread | nothing — a pure view |

Note the last row. **A vertical spread has no risk premium attached to it.** It is a directional bet
that happens to be built from options, and it lives or dies on the accuracy of the view. That is a
perfectly respectable thing to trade, but it should not be confused with a strategy that earns
something structurally.

:::desk
**Overwriting** — systematically selling calls against a long equity book — is the most widely
deployed vanilla structure in institutional asset management, and it is the covered-call identity at
scale. It is short a put, so it is short the same crash risk the portfolio already has, and it
converts a fraction of the equity risk premium into option premium. Whether it improves risk-adjusted
returns is an empirical question about the variance risk premium net of costs, not a property of the
structure. Reported [[sharpe-ratio|Sharpe ratios]] flatter it badly, because the return distribution
it produces is exactly the negatively-skewed shape Sharpe cannot see.

**Collars** — long put, short call, against stock — are the same trade seen from the risk desk, and
the reason they are quoted as a single package is that the skew makes the two legs price very
differently. A "zero-cost collar" in an index sounds symmetric and is not: the put you buy is
expensive and the call you sell is cheap, so the call strike ends up much closer to spot than the
put. The asymmetry *is* the skew, and it is the first thing to check.
:::

**In research**, the practical uses are extraction and event pricing. Extraction: fit a smooth
arbitrage-free smile, difference it twice, and you have a density to compare with realised outcomes.
Event pricing: an earnings straddle divided by $0.8S\sqrt{T}$ is the market's implied move, and the
term structure around a known date decomposes into a diffusive part and an event part — which is a
tradable quantity if you disagree with either.

## Common Mistakes

**Calling a spread "lower risk".** It is lower *cost* and lower *vega*. The maximum loss is still
the entire debit, and the probability of losing it is higher than for the outright, because you also
lose if the move goes past the short strike after passing through it.

**Reading a win rate as an edge.** Short-premium structures are engineered to win often. The payoff
asymmetry produces the win rate mechanically, in a fair market and an unfair one alike.

**Treating a butterfly as directionally neutral.** It is a long position in the density at one
point. Its delta is near zero *at the middle strike*, and nowhere else.

**Pricing legs at mid.** The most common way a spread backtest produces a result that does not
survive execution. Costs scale with the number of legs.

**Assuming the wings hedge you immediately.** In a long butterfly or condor the wings cap the loss
at expiry, but near the centre and away from expiry you are short gamma. The protection is a
statement about the terminal payoff, not about the path.

**Ignoring assignment and pin risk on American short legs.** A structure that is neat on a payoff
diagram can be an operational problem into expiry.

**Forgetting that skew makes symmetric-looking structures asymmetric.** Zero-cost collars, "delta-
neutral" risk reversals and equidistant strangles are all quietly directional once the smile is not
flat.

## 30-Second Revision

- **Choose the exposure, not the strategy.** Direction → verticals. Magnitude → straddles/strangles.
  Which tail → risk reversals. Timing → calendars.
- **Verticals are first differences in strike**; normalised by width they converge to a digital,
  $e^{-rT}N(d_2)$ — the risk-neutral CDF.
- **Butterflies are second differences**; normalised by $h^2$ they *are* the discounted risk-neutral
  density. Hence: call prices must be convex in strike.
- **Carr–Madan:** any European payoff = bonds + forward + a strip of vanillas weighted by $g''$.
  With $g = \log S$ this gives the variance swap and the VIX, model-free.
- **ATM straddle $\approx 0.8\,S\sigma\sqrt{T}$.** Inverted, it reads implied vol off a price.
- **Covered call = short put + bond.** Parity, not analogy.
- A long butterfly is **short gamma, long theta** at the centre; a call spread has **almost no vega**.
  Read the Greeks, not the name.
- **A payoff ratio is never edge.** The risk-neutral density prices every structure fairly by
  construction; any claim of attractiveness is a claim that the real density differs *there*.
