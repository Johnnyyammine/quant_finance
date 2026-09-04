---
id: implied-volatility-and-the-smile
title: Implied Volatility & the Volatility Smile
subject: options
summary: Implied volatility is not a forecast but a change of units — the number that makes Black–Scholes reproduce a price — and because it varies by strike and maturity, the resulting smile is the market's direct statement of the risk-neutral distribution it is actually using.
difficulty: intermediate
interview_relevance: 5
tags: [options, implied-volatility, volatility-smile, skew, volatility-surface, term-structure, risk-reversal, butterfly, sticky-strike, sticky-delta, no-arbitrage, local-volatility, stochastic-volatility, svi, vega, breeden-litzenberger]
prerequisites: [black-scholes-formula, option-greeks]
related: [vanilla-option-strategies, put-call-parity, black-scholes-equation, brownian-motion]
aliases: [implied volatility, implied vol, IV, volatility smile, vol smile, volatility skew, skew, volatility surface, vol surface, smirk, term structure of volatility, risk reversal, SVI, local volatility, sticky delta, sticky strike]
updated: 2026-09-04
references:
  - title: "Gatheral, *The Volatility Surface: A Practitioner's Guide*, ch. 1–4"
    url: ""
  - title: "Hull, *Options, Futures and Other Derivatives*, ch. 20"
    url: ""
  - title: "Dupire (1994), *Pricing with a Smile*, Risk 7(1)"
    url: ""
  - title: "Lee (2004), *The Moment Formula for Implied Volatility at Extreme Strikes*"
    url: ""
  - title: "Gatheral & Jacquier (2014), *Arbitrage-free SVI Volatility Surfaces*"
    url: ""
  - title: "Gatheral, Jaisson & Rosenbaum (2018), *Volatility is Rough*"
    url: ""
questions:
  - q: Implied volatility is often described as "the market's forecast of volatility". What is wrong with that, and what is it really?
    difficulty: foundational
    tags: [core, definition, quoting]
    hint: Ask what would have to be true of the model for the description to hold.
    a: |
      **It is a change of units, not a forecast.** Implied vol is defined as the unique $\sigma$
      solving $\text{BS}(S,K,T,r,\sigma) = C_{\text{mkt}}$. It is a *quoting convention* in exactly
      the sense that a bond's yield is: an invertible map from a price to a more comparable number.
      Rebonato's line is the one to remember — it is **"the wrong number in the wrong formula to get
      the right price."**

      Three things follow immediately, and each is a follow-up an interviewer may ask:

      1. **It would only be a forecast if Black–Scholes were true.** Under the model $\sigma$ is a
         constant, so every strike would imply the same number. They do not, which is proof that the
         map from price to $\sigma$ is absorbing everything the model omits — fat tails, skewness,
         jumps, stochastic volatility — into one strike-dependent parameter.
      2. **It is still perfectly well defined.** Vega is strictly positive, so $\sigma \mapsto C$ is
         strictly increasing from the arbitrage lower bound to $S$: any arbitrage-free price has one
         and only one implied vol. Nothing about the smile threatens that.
      3. **It is not even the risk-neutral expectation of realised vol.** Under a stochastic-vol
         model the ATM implied *variance* is roughly $\E_{\Q}[\bar\sigma^2]$, so the ATM implied
         *vol* is roughly $\sqrt{\E_{\Q}[\bar\sigma^2]}$ — the root-mean-square of realised vol,
         not its mean. Since $\sqrt{\cdot}$ is concave, Jensen gives
         $\sqrt{\E_{\Q}[\bar\sigma^2]} \ge \E_{\Q}[\bar\sigma]$, so implied sits *above* the
         risk-neutral expected realised vol purely from the convexity of the map, before you add
         the variance risk premium — which historically pushes it further above subsequent realised
         by a couple of points on index options.

      **The honest one-liner:** implied vol is a price. Comparing it to realised vol is a trade
      idea, not a definition.
  - q: Why does a three-month equity index smile slope downwards, while three-month FX is roughly symmetric?
    difficulty: intermediate
    tags: [core, skew, economics, cross-asset]
    hint: What does a crash look like in each market, and who is structurally on which side?
    a: |
      Because the two markets have different tails and different flow, and the smile shows both.

      **Equity indices have a one-sided tail.** Crashes are fast and correlated; rallies are slow and
      dispersing. There is also a leverage effect — as equity value falls, the same debt is a larger
      fraction of the firm, so volatility rises — which makes the *return* distribution genuinely
      left-skewed rather than merely perceived that way. On top of the physics sits the flow:
      institutions are structurally long equities and buy downside puts, while overwriters sell
      upside calls. Both push the same way, and the result is a **skew** (or "smirk"): a downward
      slope, not a symmetric smile.

      **FX has a two-sided tail.** $\text{EUR/USD}$ falling *is* $\text{USD/EUR}$ rising, and the
      option that is a call in one currency is a put in the other. There is no economic reason for
      the distribution to be asymmetric unless the market has a directional view — so the baseline
      is a symmetric **smile**, quoted as an ATM level plus a butterfly, and the asymmetry is quoted
      separately as a risk reversal that is usually small and mean-reverting. Pegged and managed
      currencies break this and show violent one-sided skew, which is the informative case.

      **Single-stock equity** sits in between and is often flatter than the index: a single name has
      idiosyncratic upside (takeover) that the index does not, and index skew is partly a
      *correlation* phenomenon — in a crash everything moves together, so the index tail is fatter
      than the average of its members' tails.

      **The point the question is testing:** the smile is not a modelling artefact you could fit
      away. It is data about the distribution, and its shape is different in different markets for
      reasons you should be able to name.
  - q: Two calls on the same underlying with the same expiry trade at different implied vols. Is that an arbitrage?
    difficulty: intermediate
    tags: [core, no-arbitrage, misconception]
    a: |
      **No — and the fact that it is not is the whole subject.** Different implied vols at different
      strikes says only that the market's distribution is not lognormal. Nothing forbids that.

      What *is* forbidden are conditions on **prices**, and they translate into conditions on the
      smile rather than the other way round. In strike, at a fixed maturity:

      - $C(K)$ must be **non-increasing**: $-1 \le \partial C/\partial K \le 0$, or the vertical
        spread is free money.
      - $C(K)$ must be **convex**: $\partial^2 C/\partial K^2 \ge 0$. This is the *butterfly*
        condition, and by [[vanilla-option-strategies|Breeden–Litzenberger]] it is exactly the
        statement that the implied density is non-negative.

      In maturity, at fixed log-moneyness $k$, **total implied variance $w(k,T) = \sigma^2 T$ must be
      non-decreasing in $T$** — otherwise a calendar spread is free money. Note the coordinates: it
      is $\sigma^2T$ that must rise, not $\sigma$, so an inverted term structure is perfectly
      normal.

      **The right answer to give:** two vols differing is information; two *prices* violating
      convexity is an arbitrage. And in practice, a butterfly that prices negative on your screen is
      almost never an arbitrage — it is a stale quote, a wide market marked at mid, or an option
      whose bid-ask straddles the boundary. See [[put-call-parity]] for the one case where a
      genuine relation is being violated and it *does* usually mean bad data: a call and a put at
      the same strike must share one implied vol.
  - q: You are long a 100-strike call and hedged with the Black–Scholes delta. The smile is downward sloping. Are you actually delta neutral?
    difficulty: advanced
    tags: [core, delta, sticky-delta, hedging]
    hint: The Black–Scholes delta holds sigma fixed. Does the market hold it fixed when spot moves?
    a: |
      **Almost certainly not.** The Black–Scholes delta is a partial derivative at *constant*
      $\sigma$. But when spot moves, the option's implied vol usually moves too, and you own vega, so
      the total derivative has a second term:

      $$\Delta_{\text{total}} = \frac{\partial C}{\partial S}
      + \frac{\partial C}{\partial \sigma}\,\frac{\partial \sigma_{\text{impl}}}{\partial S}
      = \Delta_{\text{BS}} + \mathcal{V}\,\frac{\partial \sigma_{\text{impl}}}{\partial S}$$

      Which regime you assume decides the second term:

      - **Sticky strike** — each strike keeps its own vol as spot moves. Then
        $\partial\sigma/\partial S = 0$ and the BS delta is right. This is roughly what quiet,
        range-bound markets do.
      - **Sticky delta (sticky moneyness)** — the smile is a fixed function of $k = \ln(K/F)$ and
        rides along with spot. Then $\partial\sigma/\partial S = -(\partial\sigma/\partial k)/S$, and
        since $\partial \sigma/\partial k < 0$ on an equity skew, the correction is **positive** for
        a long call. This is closer to what trending markets do.

      **The magnitude is not academic.** On the example surface on this page, the 95-strike call has
      $\Delta_{\text{BS}} = 0.697$, vega $17.47$, and $\partial\sigma/\partial k = -0.483$ at that
      strike. Sticky-delta gives $\partial \sigma/\partial S = +0.00483$, so

      $$\Delta_{\text{smile}} = 0.697 + 17.47 \times 0.00483 = 0.781$$

      That is **8.4 more shares per 100 options**, a 12% error in the hedge, from a term that is not
      in the formula. On a book with a large downside strike position it is the difference between a
      flat P&L and a bad day.

      **What a good candidate adds:** the two regimes are the extremes, real markets are somewhere
      between and move between them, and this is precisely why desks quote and risk-manage in
      $(k, T)$ coordinates rather than $(K, T)$.
  - q: What does a 25-delta risk reversal actually give you exposure to, once you delta hedge it?
    difficulty: intermediate
    tags: [risk-reversal, skew, greeks, quoting]
    a: |
      **Skew** — the *slope* of the smile — and not direction.

      Long the 25-delta call, short the 25-delta put, delta hedged, you are long vega at a high
      strike and short vega at a low strike in roughly equal amounts. Net vega is near zero; what is
      left is a position that makes money if the call's vol rises relative to the put's, which is
      exactly $\sigma_{25c} - \sigma_{25p}$ becoming less negative. That difference is what the
      market quotes as the risk reversal:

      $$\text{RR}_{25} = \sigma_{25c} - \sigma_{25p}, \qquad
      \text{BF}_{25} = \tfrac{1}{2}(\sigma_{25c} + \sigma_{25p}) - \sigma_{\text{ATM}}$$

      On the surface used on this page, $\text{RR}_{25} = -5.31$ vol points and
      $\text{BF}_{25} = +1.13$ vol points. Together with the ATM level those three numbers are how a
      desk transmits an entire smile: **level, slope, curvature** — the first three terms of the
      smile's expansion, and the reason FX is quoted as ATM/RR/BF rather than as a list of strikes.

      **The traps.** (i) A risk reversal is only skew-neutral-of-direction *after* hedging; unhedged
      it is a large delta and interviewers ask this to see whether you say so. (ii) The hedge itself
      depends on the smile — see the delta question above — so a "zero-cost, delta-neutral" risk
      reversal is quietly directional under sticky-delta. (iii) The two legs have different gammas,
      so the position is not path-neutral even when it starts vega-neutral.
  - q: How does the price of a 100-strike digital call change when you move from a flat vol to a downward-sloping smile?
    difficulty: advanced
    tags: [digital, skew, replication, pricing]
    hint: A digital is the limit of a call spread. Differentiate the call price in K, remembering sigma depends on K.
    a: |
      **It goes up, and the reason is a term Black–Scholes does not have.** A digital is the limit
      of a tight call spread, so it is $-\partial C/\partial K$ — but now $C$ depends on $K$ both
      directly and through $\sigma_{\text{impl}}(K)$:

      $$\text{Digital}(K) = -\frac{\partial C}{\partial K}
      = \underbrace{e^{-rT}N(d_2)}_{\text{Black--Scholes}}
      \;-\; \underbrace{\mathcal{V}\,\frac{\partial \sigma_{\text{impl}}}{\partial K}}_{\text{skew term}}$$

      On an equity skew $\partial\sigma/\partial K < 0$, so the skew term is **positive** and the
      digital is worth more than the formula says. With the example surface at $K=100$:

      | | value |
      |---|---|
      | $e^{-rT}N(d_2)$ at that strike's vol | 0.5012 |
      | skew term $-\mathcal{V}\,\partial\sigma/\partial K$ | **+0.0694** |
      | true digital $-\partial C/\partial K$ | **0.5705** |

      **A 14% pricing error** from using the right vol in the wrong formula. This is the single most
      common way a candidate who "knows Black–Scholes" gets an exotic wrong: plugging the correct
      implied volatility into a closed form does *not* price anything whose payoff depends on the
      density rather than on one option's value. Digitals, barriers and anything with a
      discontinuous payoff must be priced from the smile, or replicated with a finite call spread
      and the residual quoted as a risk.

      The counterpart result is on [[vanilla-option-strategies]]: a call spread is a first difference
      in strike, a butterfly a second. Here the first difference is being taken *along the smile*,
      and that is where the extra value comes from.
  - q: The equity index smile flattens as maturity increases. Why, and how fast?
    difficulty: advanced
    tags: [term-structure, skew, research, rough-volatility]
    a: |
      **Why: averaging.** A long-dated option's return is a sum of many short-dated returns. Even
      strongly skewed and fat-tailed daily returns aggregate towards normality when they are close
      to independent, so the terminal distribution at two years is far closer to lognormal than the
      distribution at two weeks. Whatever generates the skew — jumps, leverage, spot-vol correlation
      — its effect on the *terminal* distribution dilutes with horizon.

      **How fast: slower than a diffusion can explain, and that is the interesting part.** Write the
      ATM skew $\psi(T) = |\partial \sigma_{\text{impl}}/\partial k|$ at $k=0$.

      - **Empirically**, index $\psi(T)$ follows a power law close to $T^{-1/2}$, and it stays steep
        at very short maturities.
      - **A stochastic-volatility diffusion** such as Heston cannot do that. As $T \to 0$ its ATM
        skew tends to a *finite* constant, and it decays like $1/T$ at the long end. To fit short-
        dated skew you are forced into implausible parameters — a vol-of-vol that then ruins the
        long end.
      - **Adding jumps** fixes the short end: a jump gives an $O(1)$ chance of a large move over any
        horizon, so the skew survives $T \to 0$.
      - **Rough volatility** — modelling log-variance as fractional Brownian motion with Hurst
        parameter $H \approx 0.1$ — produces $\psi(T) \propto T^{H - 1/2} \approx T^{-0.4}$ across
        the whole surface with one parameter, which is why the model gained ground fast after
        Gatheral, Jaisson & Rosenbaum (2018).

      **What this is really testing:** whether you know that the term structure of skew is a *model
      selection* device, not a curve-fitting nuisance. A candidate who can say "the short end rules
      out pure diffusions" is telling the interviewer they have thought about what the surface is
      evidence *for*.
  - q: Your quant hands you a fitted surface and every butterfly on it prices positive. Is the surface arbitrage-free?
    difficulty: advanced
    tags: [no-arbitrage, calibration, svi, practical]
    hint: Butterflies are one direction. What is the other?
    a: |
      **Not necessarily — you have checked one of two conditions.** A static-arbitrage-free surface
      needs both:

      1. **No butterfly arbitrage** at each maturity: the implied density is non-negative, i.e.
         $\partial^2C/\partial K^2 \ge 0$. In total-variance coordinates this is Gatheral's condition
         $g(k) \ge 0$ with
         $g(k) = \left(1 - \frac{k w'}{2w}\right)^{2} - \frac{(w')^{2}}{4}\left(\frac{1}{w} + \frac14\right) + \frac{w''}{2}$.
      2. **No calendar arbitrage** across maturities: $\partial w(k,T)/\partial T \ge 0$ at every
         fixed $k$. Slices must not cross in total variance.

      Positive butterflies at each expiry say nothing about (2), and a surface interpolated
      *maturity by maturity* — the normal way to build one — violates it easily, especially around
      dividend and earnings dates where the raw quotes are lumpy.

      **Two practical points worth making unprompted.** First, the failure mode is usually
      *interpolation*, not data: fitting in $\sigma$ rather than in $w$, or interpolating in $K$
      rather than in $k$, can create arbitrage that was not in any quote. Second, the reason SVI is
      standard is precisely that its no-arbitrage conditions are known in closed form — Gatheral &
      Jacquier give parameter constraints under which a whole SVI surface is provably free of both —
      so you can guarantee the property rather than test for it after the fact.

      And the wings are a modelling choice, not data: beyond the last listed strike you are
      extrapolating. Lee's moment formula bounds how fast you may: $w(k)/|k| \le 2$ as
      $|k| \to \infty$, so total variance may grow at most linearly in log-moneyness. A quadratic
      fit extended into the wings breaks that immediately, which is why nobody ships one.
---

## Intuition

Black–Scholes has one free parameter you cannot observe: $\sigma$. Turn the formula around and it
becomes a machine for measuring that parameter. Take a market price, ask what $\sigma$ would have
produced it, and you have the **implied volatility** of that option.

Do this for every listed strike at one expiry and something awkward happens. The model says you
should get the same number every time — $\sigma$ is a constant in the model, a property of the
stock, not of the contract. Instead you get a curve: low strikes imply high volatility, high strikes
imply low volatility, and the shape is stable enough that desks quote it, trade it and give its
parts names. That curve is the **volatility smile**, or on equity indices, where it slopes
persistently downward, the **skew**.

The temptation is to read the smile as a flaw. It is the opposite. Prices are the primitive; implied
volatility is a *quoting convention* applied to them, in the same sense that a bond's yield is a
quoting convention applied to its price. Nobody thinks a yield curve means the bond formula is
broken. The smile is what happens when you apply a lognormal ruler to a distribution that is not
lognormal: the ruler has to bend, and the way it bends tells you exactly how the real distribution
differs.

:::insight
Rebonato's definition is the one to carry into an interview: implied volatility is **"the wrong
number in the wrong formula to get the right price."** Every property of the smile follows from
taking that seriously. It is not an estimate, it is not a forecast, and it is not evidence against
the market. It is a change of units — and because the units are strike-dependent, the *pattern* of
the units is data about the risk-neutral density.
:::

And that density is recoverable. [[vanilla-option-strategies|Breeden–Litzenberger]] says a butterfly
is the second difference of call prices in strike, and therefore *is* the discounted risk-neutral
density. So the smile is not a vague qualitative statement that "tails are fat" — it is a complete,
quantitative description of the distribution the market is using to price. The rest of this page is
about reading it.

## Mathematical Formulation

Start with the definition, which is an inverse problem with a guaranteed answer.

:::formula {name="Implied volatility" used-in="Options, Market Making, Risk" note="Well-posed because vega is strictly positive: the map from sigma to price is strictly increasing from the arbitrage bound to S, so any arbitrage-free price has exactly one implied vol."}
\sigma_{\text{impl}}(K,T): \quad \text{BS}\big(S,K,T,r,\sigma_{\text{impl}}\big) = C_{\text{mkt}}(K,T)
:::

The right coordinates are not $(K,T)$. Strikes are not comparable across underlyings or across
maturities, and $\sigma$ is not the quantity no-arbitrage constrains. Use **log-moneyness** and
**total implied variance**:

:::formula {name="Total variance in log-moneyness" used-in="Surface Fitting, Calendar Spreads, Research" note="w is what must be monotone in T for no calendar arbitrage - not sigma. An inverted term structure in sigma is normal; an inverted one in w is an arbitrage."}
k = \ln\!\frac{K}{F}, \qquad F = Se^{(r-q)T}, \qquad w(k,T) = \sigma_{\text{impl}}^2(k,T)\,T
:::

The smile is a statement about the density, and the link is exact. Differentiating the call price
twice in strike, with $\sigma_{\text{impl}}$ now a function of $K$, gives the market's implied
distribution:

:::formula {name="The smile IS the density" used-in="Density Estimation, Exotics, VIX" note="Convexity of C in K is equivalent to non-negativity of the density. This is the butterfly no-arbitrage condition, and it is the constraint that stops the smile from being any shape you like."}
f_{\Q}(K) = e^{rT}\frac{\partial^2 C}{\partial K^2} \;\ge\; 0,
\qquad C(K) = \text{BS}\big(K, \sigma_{\text{impl}}(K)\big)
:::

Desks do not transmit a curve. They transmit three numbers per maturity — level, slope, curvature —
and rebuild the curve from them:

:::formula {name="ATM, risk reversal, butterfly" used-in="FX Options, Quoting, Skew Trading" note="The first three terms of the smile's expansion. Delta-based strikes rather than fixed strikes, so the quotes stay comparable as spot moves."}
\text{RR}_{25} = \sigma_{25c} - \sigma_{25p},
\qquad \text{BF}_{25} = \tfrac{1}{2}\big(\sigma_{25c} + \sigma_{25p}\big) - \sigma_{\text{ATM}}
:::

Finally, the result that turns a static surface into a dynamic model. Dupire showed that for any
arbitrage-free surface there is exactly **one** diffusion consistent with it:

:::formula {name="Dupire local volatility" used-in="Exotics Pricing, Model Calibration" note="Unique: one surface, one local-vol diffusion. The numerator is a calendar spread and the denominator a butterfly, so local vol is a ratio of two things you can trade."}
\sigma_{\text{loc}}^2(K,T) = \frac{\dfrac{\partial C}{\partial T} + (r-q)K\dfrac{\partial C}{\partial K} + qC}{\tfrac{1}{2}K^2\dfrac{\partial^2 C}{\partial K^2}}
:::

Local volatility is not the same object as implied volatility: $\sigma_{\text{loc}}(K,T)$ is the
instantaneous volatility *if* spot is at $K$ at time $T$, whereas $\sigma_{\text{impl}}(K,T)$ is an
average over all paths to that point. The rule of thumb — Derman's — is that local volatility moves
about **twice as fast** in strike as implied volatility does.

## Derivation

:::derivation Why implied volatility exists and is unique
Fix $S, K, T, r$ and treat the Black–Scholes call price as a function of $\sigma$ alone. Vega is

$$\mathcal{V} = \frac{\partial C}{\partial \sigma} = S\phi(d_1)\sqrt{T} > 0
\quad\text{for all } \sigma > 0,\ T > 0.$$

Strictly positive, with no dependence on the sign of anything — so $C(\sigma)$ is **strictly
increasing**. Now take the two limits:

$$\lim_{\sigma \to 0^+} C = \big(S - Ke^{-rT}\big)^+ , \qquad \lim_{\sigma \to \infty} C = S.$$

Those are exactly the no-arbitrage bounds on a European call. A strictly increasing continuous
function mapping $(0,\infty)$ onto $\big((S-Ke^{-rT})^+,\, S\big)$ has a unique inverse on that
interval, so:

- any price **strictly inside** the bounds has exactly one implied volatility;
- a price **on or outside** them has none, and that is a data problem, not a market with an
  interesting distribution. It is the usual outcome for deep in-the-money quotes marked at a stale
  mid.

Two practical consequences. Newton's method converges fast because $\mathcal{V}$ is available in
closed form, but vega $\to 0$ in both wings, so the inversion is **ill-conditioned exactly where the
smile is steepest** — a one-tick price change in a far strike can move its implied vol by a point.
That is why desks fit surfaces to prices weighted by vega, not to implied vols equally.
:::

:::derivation From the smile to the digital: where the extra value comes from
A digital call paying $\1\{S_T > K\}$ is the limit of a tight call spread, so its value is
$-\partial C/\partial K$. Under Black–Scholes with a *flat* vol that derivative is $e^{-rT}N(d_2)$.
With a smile, $C$ depends on $K$ twice — directly, and through $\sigma_{\text{impl}}(K)$ — so the
chain rule adds a term:

$$\text{Digital}(K) = -\frac{\d C}{\d K}
= -\frac{\partial C}{\partial K}\bigg|_{\sigma} - \frac{\partial C}{\partial \sigma}\frac{\partial \sigma_{\text{impl}}}{\partial K}
= e^{-rT}N(d_2) - \mathcal{V}\,\frac{\partial \sigma_{\text{impl}}}{\partial K}$$

On an equity skew $\partial\sigma_{\text{impl}}/\partial K < 0$, so the correction is positive: **a
digital call is worth more than the Black–Scholes formula says.** The economics are visible in the
replication. To be long the digital you buy the $K$ call and sell the $K+h$ call; with a downward
sloping smile the call you sell carries a *lower* vol than the one you buy, so the spread costs less
than a flat-vol calculation suggests and the digital it converges to is worth more.

The same chain rule, differentiated once more, is what turns $\partial^2C/\partial K^2 \ge 0$ into a
condition on the smile's slope and curvature rather than on prices — and that is the constraint
Gatheral's $g(k) \ge 0$ expresses in total-variance coordinates.
:::

:::derivation Why the smile breaks your delta
The Black–Scholes delta is a partial derivative taken at constant $\sigma$. What you actually own is
a position whose implied vol moves when spot moves, and you have vega, so the *total* derivative is

$$\Delta_{\text{total}} = \frac{\d C}{\d S} = \frac{\partial C}{\partial S}
+ \frac{\partial C}{\partial \sigma}\frac{\partial \sigma_{\text{impl}}}{\partial S}
= \Delta_{\text{BS}} + \mathcal{V}\,\frac{\partial \sigma_{\text{impl}}}{\partial S}.$$

The second term needs a *regime* — an assumption about how the surface moves — and there are two
canonical ones:

**Sticky strike.** Each fixed strike keeps its vol: $\partial\sigma_{\text{impl}}/\partial S = 0$ and
$\Delta_{\text{total}} = \Delta_{\text{BS}}$. Quiet, range-bound markets behave roughly this way, and
it is the implicit assumption in any risk system that reports a single BS delta.

**Sticky delta (sticky moneyness).** The smile is a fixed function of $k = \ln(K/F)$ and translates
with spot. Then $\sigma_{\text{impl}}(K,S) = \varsigma\big(\ln(K/F(S))\big)$ and

$$\frac{\partial \sigma_{\text{impl}}}{\partial S} = -\frac{1}{S}\,\frac{\partial \varsigma}{\partial k}.$$

On an equity skew $\partial\varsigma/\partial k < 0$, so this is **positive**, and the smile-adjusted
delta of a long call is *larger* than the Black–Scholes delta. Note that local volatility implies a
third regime — and an aggressive one: it makes the smile move *down* as spot rises, roughly twice as
fast as the surface's own slope, which is why pure local-vol models are known to misprice forward
volatility and forward-starting products.
:::

## Assumptions & Edge Cases

:::assumption
- **The price must be arbitrage-free.** Outside $\big((S-Ke^{-rT})^+, S\big)$ no implied volatility
  exists. Deep ITM quotes and stale marks fail this routinely; a surface builder must reject them
  rather than solve harder.
- **European exercise, known carry.** The inversion assumes the Black–Scholes payoff. American
  options need an American inverter, and the whole surface is conditional on your dividend and
  borrow assumptions — the "smile" of a hard-to-borrow single name is largely a borrow-rate curve in
  disguise.
- **One vol per strike, not per option type.** [[put-call-parity]] forces the call and the put at a
  strike to share an implied volatility. If yours differ, you have a data problem — wrong forward,
  wrong dividend, wrong borrow — not a trading opportunity.
- **The wings are extrapolation.** Strikes are listed on a discrete grid, so the density is only
  recovered where options trade. Everything beyond the last strike is a modelling choice, and
  Lee's moment formula is the one hard constraint on it: $w(k)/|k| \le 2$ as $|k|\to\infty$.
:::

:::warning
**The smile is a band, not a curve.** Every point on it is a mid between a bid and an ask that can be
one or two vol points wide in the wings. Fitting a smooth curve through mids and then computing
second derivatives amplifies that noise into a density — which is why an unconstrained fit so often
produces a wobbly, locally negative "density" that reflects only the bid-ask spread. Fit with
no-arbitrage constraints imposed, not checked afterwards.
:::

:::pitfall
**Interpolation creates arbitrage that was never in the data.** Linear interpolation in $\sigma$
versus in $w = \sigma^2T$ versus in *price* give different answers, and only some preserve
convexity. The safe recipe: interpolate in total variance, in log-moneyness, with a parameterisation
whose no-arbitrage conditions you can state — which is exactly why SVI became standard.
:::

## Worked Example

Take $S = 100$, $T = 0.25$, $r = 4\%$, $q = 0$, so the forward is $F = 100e^{0.01} = 101.005$. Fit
a raw **SVI** slice — total variance as a hyperbola in log-moneyness, so the wings are linear and
Lee's bound is respected by construction:

$$w(k) = a + b\Big(\rho k + \sqrt{k^2 + \varsigma^2}\Big)$$

Rather than quote $(a,b,\rho,\varsigma)$, pin the slice with the three numbers a desk would actually
say: **ATM volatility $25\%$, ATM skew $\partial\sigma/\partial k = -0.32$, convexity
$\partial^2\sigma/\partial k^2 = 3.2$.** Those fix $w(0)$, $w'(0)$ and $w''(0)$, and SVI turns them
into $a = -0.002423$, $b = 0.09024$, $\rho = -0.443$ with wing width $\varsigma = 0.20$. Gatheral's
condition gives $\min_k g(k) = 0.22 > 0$, so the slice is free of butterfly arbitrage. It is also
the slice the module below opens on, so every number here can be dragged.

Read the smile off it, and price each strike **at its own volatility**:

| Strike | $k = \ln(K/F)$ | $\sigma_{\text{impl}}$ | Call (smile) | Call (flat 25%) | Put (smile) |
|---|---|---|---|---|---|
| 85 | −0.173 | **33.65%** | 17.068 | 16.284 | 1.223 |
| 90 | −0.115 | **30.35%** | 12.738 | 12.030 | 1.843 |
| 95 | −0.061 | **27.50%** | 8.810 | 8.377 | 2.864 |
| 100 | −0.010 | **25.34%** | 5.538 | 5.472 | 4.543 |
| 105 | 0.039 | **24.01%** | 3.155 | 3.347 | 7.111 |
| 110 | 0.085 | **23.48%** | 1.672 | 1.918 | 10.577 |
| 115 | 0.130 | **23.58%** | 0.861 | 1.032 | 14.717 |

Note the turn at the top: the minimum sits at $K = 111.5$ and the curve rises again above it. This is a
*smile* with a strong downward tilt, not a monotone line, which is what makes "skew" and
"convexity" separate quotes. A strike $10\%$ below the forward carries **4.79 more vol points**
than the money. In desk terms: $\text{ATM} = 25.00\%$, $\text{RR}_{25} = -5.31$ points (the
25-delta put at $K = 92.61$ implies $28.79\%$ against the 25-delta call at $K = 110.08$ implying
$23.48\%$), and $\text{BF}_{25} = +1.13$ points.

**Now extract the density.** Take butterflies with $h = 5$ and normalise by $h^2$:

| Middle strike | Fly (smile) | Fly (flat) | $f_\Q$ (smile) | $f_\Q$ (flat) | Ratio |
|---|---|---|---|---|---|
| 90 | 0.401 | 0.601 | 0.0162 | 0.0243 | **0.67×** |
| 95 | 0.658 | 0.748 | 0.0266 | 0.0302 | 0.88× |
| 100 | 0.888 | 0.780 | 0.0359 | 0.0315 | 1.14× |
| 105 | 0.899 | 0.696 | 0.0363 | 0.0281 | **1.29×** |
| 110 | 0.673 | 0.543 | 0.0272 | 0.0219 | 1.24× |

Two densities, same mean ($101.005$ — both are martingale measures, so this is a check, not a
result), completely different shape:

| | Smile | Lognormal |
|---|---|---|
| Std. deviation | 14.11 | 12.68 |
| Skewness | **−0.742** | +0.378 |
| Excess kurtosis | **+3.83** | +0.26 |

:::insight
**The smile turned a right-skewed distribution into a left-skewed one.** A lognormal is always
positively skewed — that is what exponentiating a normal does. The market's density has skewness
$-0.74$. No amount of choosing a different constant $\sigma$ could have produced that: the level of
volatility is one number and the *shape* is a separate object, which is precisely why one implied
vol per strike is needed to describe it.
:::

Where the mass actually went is more interesting than the summary statistics:

| | $\Q(S_T < 70)$ | $\Q(S_T<80)$ | $\Q(S_T<90)$ | $\Q(S_T>110)$ |
|---|---|---|---|---|
| Smile | **3.01%** | 6.37% | 15.84% | 22.19% |
| Lognormal | **0.20%** | 3.57% | 19.48% | 22.81% |

The smile makes a $30\%$ crash in three months **fifteen times more likely** than lognormal does —
while making a mild $10\%$ decline *less* likely. It does not shift the distribution left; it moves
probability out of the near-left shoulder and into the far tail. In prices that is the difference
between a put worth $0.134$ and one worth $0.830$:

| Option | Flat 25% | Smile | Ratio |
|---|---|---|---|
| 80 put | 0.134 | 0.830 | **6.2×** |
| 85 put | 0.439 | 1.223 | 2.8× |
| 90 put | 1.135 | 1.843 | 1.6× |
| 110 call | 1.918 | 1.672 | 0.87× |

:::warning
**A six-fold pricing error is what "just use a flat vol" costs in the wings.** And it is not
conservative in either direction: the same flat vol that underprices the 80 put by $6.2\times$
overprices the 110 call by $15\%$. Anyone quoting wings off an ATM number is not making a small
approximation — they are quoting a different distribution.
:::

Finally, the smile is constrained. Holding the ATM level and convexity fixed and steepening the
skew, Gatheral's $g(k)$ first goes negative at $\partial\sigma/\partial k = -1.16$, about **3.6
times** the slope fitted above. Past that the implied density is negative somewhere and some
butterfly is worth less than zero. The smile can be steep, but not arbitrarily steep, and the bound
is a computation rather than a taste — drag the skew slider below $-1.16$ and the module says so.

:::module volatility-smile
{"sigma": 0.25, "skew": -0.32, "convexity": 3.2, "T": 0.25, "view": "smile"}
:::

## Why It Matters in Quant Finance

**Everything in derivatives is quoted, marked and risk-managed in volatility.** A trade is agreed in
vol and converted to a price at the point of execution; a book is marked to a surface, not to a list
of prices; P&L is attributed to moves in the *surface*, decomposed into level, skew and term
structure. If you cannot read a smile you cannot read a derivatives desk's risk report.

**Vega is not one number.** [[option-greeks|Vega]] as a single figure assumes the whole surface moves
in parallel, which it never does. Real risk is bucketed by strike and maturity, and the two
first-order shape risks have their own names and their own hedges: risk reversal risk (skew) and
butterfly risk (convexity). A book can be vega-flat and lose badly on a day the skew steepens.

**Exotics are priced from the density, not from a vol.** Anything whose payoff is discontinuous or
path-dependent — digitals, barriers, autocallables, cliquets — depends on the shape of the
distribution and not merely on its width. The digital calculation above is the smallest possible
example, and it is already a $14\%$ error.

**Model-free measurement.** Because the smile is the density, quantities that look model-dependent
are not. The VIX is a weighted integral of out-of-the-money option prices across the whole strip —
the [[vanilla-option-strategies|Carr–Madan]] spanning formula applied to $g(S) = \log S$ — which is
why it is a *measurement* of 30-day risk-neutral variance rather than an output of some model.

**The variance risk premium.** Averaged over long samples, index implied volatility exceeds
subsequently realised volatility, and the gap is largest in the downside wing. That is a risk
premium paid for insurance, and it is the reason systematic short-volatility strategies show
attractive Sharpe ratios and occasional catastrophic drawdowns — a payoff shape that
[[kelly-criterion]] treats very differently from its mean.

## Trading & Research Application

:::desk
**Market making.** You quote in vol and hedge in delta, so the surface *is* your inventory. Three
things follow. You hedge with a smile-adjusted delta, not the Black–Scholes one — the 12% hedge
error computed above is a daily P&L leak if you do not. You warehouse skew and convexity risk
deliberately, because you cannot avoid them, and you know your RR and BF exposures as precisely as
your vega. And you police your own quotes: every butterfly non-negative, every calendar monotone in
total variance, checked continuously rather than at end of day, because a crossed slice is an
invitation for someone to lift you.
:::

:::desk
**Research.** The surface is a rich, high-frequency, forward-looking feature set that most equity
signals ignore: the skew's steepness, the term structure's slope, the spread between implied and
recently realised volatility, and the changes in each. It is also a *prediction* — the whole
risk-neutral density is there, so a strategy can be tested against what the market had priced rather
than against a naive baseline.

The discipline it demands is unusual, though. Fit arbitrage-free by construction rather than checking
after the fact; use point-in-time surfaces, since a surface rebuilt today from today's dividend and
borrow curves is a look-ahead bias with extra steps; and remember that the risk-neutral density is
not the real-world one. The gap between them *is* the risk premium, so a "signal" that the market
underprices crashes may be nothing more than a rediscovery of the fact that insurance costs money.
:::

## Implementation Notes

```python
import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d1 - sigma * np.sqrt(T))

def implied_vol(price, S, K, T, r):
    """Brent on the bracketed root. Newton is faster but vega -> 0 in the wings,
    which is exactly where you most need the answer not to diverge."""
    lo, hi = max(S - K * np.exp(-r * T), 0.0), S
    if not lo < price < hi:                 # outside the no-arbitrage bounds
        return np.nan                       # no sigma exists: reject the quote
    return brentq(lambda s: bs_call(S, K, T, r, s) - price, 1e-6, 5.0, xtol=1e-10)

def svi_total_variance(k, a, b, rho, m, sigma):
    return a + b * (rho * (k - m) + np.sqrt((k - m) ** 2 + sigma**2))

def gatheral_g(k, w, dw, d2w):
    """>= 0 everywhere <=> no butterfly arbitrage (implied density non-negative)."""
    return (1 - k * dw / (2 * w)) ** 2 - (dw**2 / 4) * (1 / w + 0.25) + d2w / 2
```

Three things that matter more than the algorithm. **Weight by vega** when fitting: an equal-weighted
fit in implied-vol space chases noise in the wings, where a tick of price is a point of vol.
**Impose no-arbitrage during calibration**, not after — a constrained fit that is slightly worse in
sample is worth far more than an unconstrained one you have to repair. And **fit in $(k, w)$**, never
in $(K, \sigma)$: the coordinates are what make the constraints expressible.

## Common Mistakes

**Calling implied vol a forecast.** It is a price in different units. The comparison of implied to
realised is a *trade*, and the historical gap between them is a risk premium, not a market error.

**Using the Black–Scholes delta on a skewed surface.** The vega-times-smile-slope term is missing,
and on a 95-strike call in the example above it is worth 8.4 shares per 100 options.

**Plugging the right implied vol into the wrong formula.** Correct for a vanilla at that strike;
wrong for anything whose payoff depends on the density — digitals, barriers, and every exotic.

**Comparing volatilities across maturities.** Only total variance $w = \sigma^2 T$ is constrained to
be monotone. An inverted $\sigma$ term structure is an ordinary event, not a signal.

**Interpolating in the wrong coordinates.** Linear-in-strike, linear-in-$\sigma$ fits create
butterfly arbitrage from clean data. Interpolate in log-moneyness and total variance.

**Treating a call/put implied-vol difference as information.** [[put-call-parity]] forbids it; the
difference is measuring your forward, dividend or borrow assumption.

**Extrapolating a parabola into the wings.** Quadratic total variance violates Lee's bound
$w(k)/|k|\le 2$ and will price the far tail at an implied vol of several hundred percent.

**Confusing local and implied volatility.** $\sigma_{\text{loc}}(K,T)$ is instantaneous and
conditional; $\sigma_{\text{impl}}(K,T)$ is a path average. The local surface is roughly twice as
steep in strike.

## 30-Second Revision

- **Implied vol is the unique $\sigma$ that reproduces a market price.** Unique because vega $>0$
  makes $C(\sigma)$ strictly increasing from $(S-Ke^{-rT})^+$ to $S$. It is a *quoting convention* —
  "the wrong number in the wrong formula to get the right price."
- **The smile is the density.** $f_\Q(K)=e^{rT}\partial^2C/\partial K^2$, so a non-flat smile is a
  non-lognormal distribution — nothing more mysterious, and nothing less quantitative.
- **Work in $k=\ln(K/F)$ and $w=\sigma^2T$.** No butterfly arbitrage $\Leftrightarrow$ $C$ convex in
  $K$ $\Leftrightarrow$ Gatheral's $g(k)\ge0$. No calendar arbitrage $\Leftrightarrow$ $w$
  non-decreasing in $T$. Wings bounded by Lee: $w(k)/|k|\le2$.
- **Level, slope, curvature = ATM, $\text{RR}_{25}$, $\text{BF}_{25}$.** A delta-hedged risk reversal
  is a bet on skew; a butterfly, on convexity.
- **Smile delta $= \Delta_{\text{BS}} + \mathcal{V}\,\partial\sigma/\partial S$.** Sticky strike sets
  the second term to zero; sticky delta makes it positive for a call on an equity skew.
- **Digital $= e^{-rT}N(d_2) - \mathcal{V}\,\partial\sigma/\partial K$.** The skew term was a 14%
  correction in the example. Right vol, wrong formula, wrong price.
- **Equity slopes down, FX smiles symmetrically**, and skew decays with maturity roughly like
  $T^{-1/2}$ — too slowly for a pure diffusion, which is the empirical case for jumps or rough
  volatility.
- **Dupire:** one arbitrage-free surface, one local-vol diffusion. Local vol is roughly twice as
  steep in strike as implied vol.
