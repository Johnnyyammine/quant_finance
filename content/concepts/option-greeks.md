---
id: option-greeks
title: Option Greeks
subject: options
summary: Delta, gamma, vega, theta and rho are the terms of one Taylor expansion, not five separate risk numbers — and the Black–Scholes equation is the identity that ties them together into a single statement about what a hedged position earns.
difficulty: intermediate
interview_relevance: 5
tags: [options, greeks, hedging, risk, gamma, vega, theta, delta, sensitivity]
prerequisites: [black-scholes-formula]
related: [black-scholes-equation, put-call-parity, itos-lemma]
aliases: [delta, gamma, vega, theta, rho, vanna, volga, charm, option sensitivities, the Greeks]
updated: 2026-09-03
references:
  - title: "Hull, *Options, Futures and Other Derivatives*, ch. 19"
    url: ""
  - title: "Taleb, *Dynamic Hedging*"
    url: ""
  - title: "Wilmott, *Paul Wilmott on Quantitative Finance*, ch. 8"
    url: ""
questions:
  - q: Write down the P&L of an option position as a Taylor expansion and name each term.
    difficulty: intermediate
    tags: [core, taylor, risk]
    hint: Expand V(t, S, σ) in all three arguments and keep second order in S.
    a: |
      $$\d V \approx \underbrace{\Delta\,\d S}_{\text{direction}}
      + \underbrace{\tfrac12\Gamma(\d S)^2}_{\text{convexity}}
      + \underbrace{\mathcal{V}\,\d\sigma}_{\text{vol level}}
      + \underbrace{\Theta\,\d t}_{\text{time}}
      + \underbrace{\rho\,\d r}_{\text{rates}}$$

      **That is the whole framework.** The Greeks are not five independent quantities somebody chose
      to report — they are the coefficients of one expansion, and a risk report is that expansion
      written as a table.

      Two structural points an interviewer is listening for. First, $\Gamma$ appears at second order
      because it multiplies $(\d S)^2$, which for a diffusion is $O(\d t)$ — the same order as
      $\Theta\,\d t$. That is why theta and gamma are the pair that trade against each other.
      Second, delta-hedging sets the first term to zero, which is what promotes the second term from
      a correction to the entire position.
  - q: Why are theta and gamma always opposite in sign, and what is the exact relationship?
    difficulty: intermediate
    tags: [theta, gamma, core, bs-equation]
    a: |
      Rearrange the Black–Scholes equation:

      $$\Theta = rV - rS\Delta - \tfrac12\sigma^2S^2\Gamma$$

      For a delta-hedged position ($r$ terms small or netted), $\Theta \approx
      -\tfrac12\sigma^2S^2\Gamma$. **Positive gamma forces negative theta.**

      **The economics:** gamma is the right to profit from movement in either direction. Nobody gives
      that away, so you rent it, and theta is the rent. Long option, long gamma, paying theta; short
      option, short gamma, collecting theta.

      **The number to carry:** setting the two equal gives the break-even move,
      $|\d S| = \sigma S\sqrt{\d t}$. At $S=100$, $\sigma=20\%$, that is
      $100\times0.20/\sqrt{252} = \$1.26$ a day. Move more and gamma pays for theta; move less and
      theta wins. Every gamma trader knows this number for their book without looking it up.
  - q: Where is gamma largest, and why does that make short-dated options dangerous?
    difficulty: intermediate
    tags: [gamma, expiry, risk, desk]
    a: |
      Gamma peaks **at the money, near expiry**, and diverges as $T\to0$:

      $$\Gamma = \frac{\phi(d_1)}{S\sigma\sqrt T} \;\xrightarrow{\;T\to0\;}\; \infty \text{ at } S=K$$

      **Why:** delta must travel from 0 to 1 across the strike, and as expiry approaches it does so
      over a narrower and narrower range of spot. In the limit delta is a step function and gamma is
      a delta function.

      **The danger, concretely.** A short at-the-money position the day before expiry has enormous
      gamma: delta can swing from 0.2 to 0.8 on a small move, so a hedge that was flat this morning
      is materially short or long by lunchtime. Hedging it requires trading with the market, into the
      move, repeatedly — and that is precisely when liquidity is worst.

      This is pinning risk. It is also why desks reduce or roll short-dated strike concentrations
      rather than model them better: the risk is operational, not analytical.
  - q: Why is vega highest for long-dated at-the-money options while gamma is highest for short-dated ones?
    difficulty: advanced
    tags: [vega, gamma, term-structure, core]
    hint: Vega scales with √T; gamma scales with 1/√T.
    a: |
      $$\mathcal{V} = S\phi(d_1)\sqrt T, \qquad \Gamma = \frac{\phi(d_1)}{S\sigma\sqrt T}$$

      Vega carries $\sqrt T$; gamma carries $1/\sqrt T$. **They point in opposite directions along the
      term structure**, and the relationship is exact:
      $\mathcal{V} = \sigma T S^2\Gamma$.

      **The intuition:** vega measures sensitivity to the *level* of volatility over the whole
      remaining life, so more life means more exposure. Gamma measures the curvature of the price in
      spot right now, and curvature concentrates as the payoff kink approaches.

      **The practical consequence** is that vol risk splits into two trades that need different
      instruments. Want a view on where implied vol goes? Buy long-dated options — high vega, low
      gamma, low theta bleed. Want to trade realised against implied? Buy short-dated options — high
      gamma, high theta. Confusing the two is how a "long volatility" position ends up with almost no
      exposure to what the trader actually meant.
  - q: A trader is delta-neutral and loses money on a large move. What happened?
    difficulty: intermediate
    tags: [gamma, hedging, desk, diagnosis]
    a: |
      **Short gamma.** Delta-neutral means the first-order term is zero; it says nothing about the
      second. With $\Gamma < 0$:

      $$\d V \approx \tfrac12\Gamma(\d S)^2 < 0$$

      — a loss for a move in *either* direction, growing with the square of the move.

      Worse, the hedge itself is destabilising: as spot rises the short-gamma delta becomes more
      negative, so re-hedging means *buying* into a rally and *selling* into a fall. You trade with
      the move every time, realising a loss at each rebalance. This is the mechanism behind gamma
      squeezes and behind the classic "delta-hedged and still lost money" report.

      Two other candidates worth naming: **vega**, if implied vol moved (common in a large spot move,
      and correlated with it via vanna); and **the hedge being stale**, if the move happened between
      rebalances.
  - q: What are vanna and volga, and when do they matter?
    difficulty: advanced
    tags: [second-order, vanna, volga, skew, fx]
    a: |
      $$\text{vanna} = \frac{\partial^2V}{\partial S\,\partial\sigma} = \frac{\partial\Delta}{\partial\sigma},
      \qquad \text{volga} = \frac{\partial^2V}{\partial\sigma^2} = \frac{\partial\mathcal{V}}{\partial\sigma}$$

      **Vanna** is how delta changes when vol moves — equivalently, how vega changes with spot. It is
      the Greek of *skew*: in equities, spot down and vol up move together, so a position with vanna
      exposure has a systematic P&L that a delta-and-vega report shows as zero.

      **Volga** (vol gamma) is convexity in volatility. It is positive for out-of-the-money options,
      which is why they gain from vol *moving* regardless of direction, and it is the Greek of the
      *smile's curvature*.

      **When they matter:** whenever the position is large, the moves are large, or the payoff is
      not vanilla. FX desks manage vanna and volga explicitly — the standard vanna-volga pricing
      method for FX exotics is built entirely on them. On an equity book they are usually second
      order until a crash, at which point spot, vol and skew all move together and the vanna term is
      the one that was unhedged.
  - q: Your risk report shows net vega of zero across a book of options with different maturities. Are you vol-neutral?
    difficulty: advanced
    tags: [vega, term-structure, risk-reporting, desk]
    a: |
      **No.** Summing raw vega across maturities adds numbers that respond to different things. A
      one-month vega and a two-year vega both say "value change per vol point", but implied vols at
      different tenors do not move one-for-one — short-dated vol is far more volatile than long-dated.

      The standard correction is **vega bucketing with a term-structure weight**, typically scaling
      each tenor's vega by $\sqrt{T_{\text{ref}}/T}$ so that positions are expressed in equivalent
      units of the move you actually expect. A book that is flat on raw vega is routinely long
      short-dated and short long-dated vol — a calendar position — and will make or lose money the
      moment the term structure moves.

      The same criticism applies across strikes (skew is not a parallel shift) and, more sharply,
      across underlyings, where summing vega assumes correlation 1. **A single aggregated Greek is a
      summary, not a hedge**, and the mistake of treating it as one is what makes stress tests, not
      Greeks, the binding risk constraint on a large book.
---

## Intuition

The Greeks look like five things to memorise. They are one thing: a **Taylor expansion of the option
price** in its arguments.

$$\d V = \underbrace{\frac{\partial V}{\partial S}}_{\Delta}\d S
+ \tfrac12\underbrace{\frac{\partial^2V}{\partial S^2}}_{\Gamma}(\d S)^2
+ \underbrace{\frac{\partial V}{\partial\sigma}}_{\mathcal V}\d\sigma
+ \underbrace{\frac{\partial V}{\partial t}}_{\Theta}\d t
+ \underbrace{\frac{\partial V}{\partial r}}_{\rho}\d r$$

Every risk report you will ever read is this line, arranged as a table. Once that is clear, the
questions become natural: which term dominates, which can you hedge away, and what is left when you
do.

:::insight
Hedging is **choosing which term to zero out**. Delta-hedge and the first term goes; what remains is
led by $\tfrac12\Gamma(\d S)^2$, which is always the same sign as your gamma and never depends on
direction.

That is why a delta-hedged option is not a neutral position but a **position in variance** — and why
options traders talk about volatility rather than price.
:::

The one relationship that ties it together is the [[black-scholes-equation|Black–Scholes equation]]
itself, rewritten:

$$\Theta + rS\Delta + \tfrac12\sigma^2S^2\Gamma = rV$$

The Greeks are not free to take any values. Theta is pinned by gamma. Long convexity means paying
rent, and the equation says exactly how much.

:::module black-scholes-lab
{"height": 300, "view": "price", "K": 100, "T": 0.25, "sigma": 0.25, "r": 0.04}
:::

## Mathematical Formulation

For a European option under Black–Scholes, with $d_1, d_2$ as usual and $\phi$ the standard normal
density. Dividend yield $q$ is set to zero here for readability; restoring it multiplies every
$S$-term by $e^{-qT}$.

:::formula {name="Delta" used-in="Hedging, Risk, Replication" note="Call delta is N(d₁) — also the number of shares in the replicating portfolio. Put delta is call delta minus one, which is put-call parity differentiated."}
\Delta_{\text{call}} = N(d_1), \qquad \Delta_{\text{put}} = N(d_1) - 1
:::

:::formula {name="Gamma" used-in="Gamma Trading, Hedging Frequency, Pinning" note="Identical for calls and puts — parity's difference is linear in S, so it has no curvature. Peaks at the money and diverges as T→0."}
\Gamma = \frac{\phi(d_1)}{S\sigma\sqrt T}
:::

:::formula {name="Vega" used-in="Volatility Trading, Surface Risk" note="Also identical for calls and puts, for the same reason. Scales with √T, so long-dated options carry the vol-level risk."}
\mathcal{V} = \frac{\partial V}{\partial\sigma} = S\,\phi(d_1)\sqrt T
:::

:::formula {name="Theta (call)" used-in="Carry, Time Decay, P&L Attribution" note="Two pieces: the volatility-value decay (first term) and the financing of the deferred strike (second). For a put the second term flips sign."}
\Theta_{\text{call}} = -\frac{S\phi(d_1)\sigma}{2\sqrt T} - rKe^{-rT}N(d_2)
:::

:::formula {name="Rho" used-in="Rates Exposure, Long-Dated Options" note="Usually the smallest Greek on equity options and the largest on long-dated or rates-linked ones. Sign is opposite for puts."}
\rho_{\text{call}} = KTe^{-rT}N(d_2), \qquad \rho_{\text{put}} = -KTe^{-rT}N(-d_2)
:::

:::formula {name="Gamma–vega–theta identity" used-in="Risk Consistency, Desk P&L" note="These are not independent numbers. Vega and gamma are proportional; theta is pinned to gamma by the pricing equation."}
\mathcal{V} = \sigma T S^2\,\Gamma, \qquad
\Theta \approx -\tfrac12\sigma^2S^2\Gamma \;\;(\text{delta-hedged})
:::

:::formula {name="Second-order cross Greeks" used-in="FX Exotics, Skew Risk, Large Books" note="Vanna is the Greek of skew, volga the Greek of smile curvature. Both are zero in a report that only shows delta and vega — and neither is zero in a crash."}
\text{vanna} = \frac{\partial\Delta}{\partial\sigma} = -\frac{\phi(d_1)d_2}{\sigma},
\qquad \text{volga} = \mathcal{V}\,\frac{d_1d_2}{\sigma}
:::

## Derivation

:::derivation Why call delta is N(d₁) — and why the messy terms cancel
Differentiate $C = SN(d_1) - Ke^{-rT}N(d_2)$ with respect to $S$. Both $d_1$ and $d_2$ depend on
$S$, so the product rule gives three terms:

$$\Delta = N(d_1) + S\phi(d_1)\frac{\partial d_1}{\partial S} - Ke^{-rT}\phi(d_2)\frac{\partial d_2}{\partial S}$$

Since $d_2 = d_1 - \sigma\sqrt T$, the two partials are equal, both $=1/(S\sigma\sqrt T)$. So the
last two terms cancel if and only if

$$S\phi(d_1) = Ke^{-rT}\phi(d_2)$$

which is a genuine identity — write out both densities, use $d_2^2 = d_1^2 - 2d_1\sigma\sqrt T +
\sigma^2T$, and the exponents differ by exactly $\ln(S/K) + rT$. Hence

$$\Delta_{\text{call}} = N(d_1)$$

**The cancellation is not a coincidence.** $S\phi(d_1) = Ke^{-rT}\phi(d_2)$ is the same
completed-square identity that produced $d_1$ from $d_2$ in the first place, and it is what makes
every Greek come out clean. It is also why $N(d_1)$ is simultaneously the delta *and* the
stock-numéraire exercise probability: differentiating the price with respect to $S$ and changing
numéraire to $S$ are the same operation.
:::

:::derivation Gamma and vega are proportional
$$\Gamma = \frac{\partial N(d_1)}{\partial S} = \phi(d_1)\frac{\partial d_1}{\partial S}
= \frac{\phi(d_1)}{S\sigma\sqrt T}$$

$$\mathcal{V} = \frac{\partial C}{\partial\sigma} = S\phi(d_1)\frac{\partial d_1}{\partial\sigma}
- Ke^{-rT}\phi(d_2)\frac{\partial d_2}{\partial\sigma} = S\phi(d_1)\sqrt T$$

(using the same identity, and $\partial d_1/\partial\sigma - \partial d_2/\partial\sigma = \sqrt T$).
Dividing:

$$\boxed{\;\mathcal{V} = \sigma T S^2\,\Gamma\;}$$

**Read this carefully, because it is often misquoted as "gamma and vega are the same risk".** They
are proportional *for a single option*, with a factor $\sigma TS^2$ that depends strongly on
maturity. Across a book of different maturities the proportionality breaks: a one-week and a
two-year option with equal gamma have vegas differing by a factor of 100.

So gamma and vega are the same risk *locally* and completely different risks *across the term
structure* — which is exactly why a desk hedges them with different instruments.
:::

:::derivation Theta from the pricing equation, not by differentiating
Differentiating the formula for $\Theta$ works but is ugly. The pricing equation gives it in one
line:

$$\Theta = rV - rS\Delta - \tfrac12\sigma^2S^2\Gamma$$

For a **delta-hedged** position the middle term is the interest on the hedge and $rV$ is the
financing of the option; on a book where these roughly net, what is left is

$$\Theta \approx -\tfrac12\sigma^2S^2\Gamma$$

**Setting expected gamma gain equal to theta cost** gives the break-even move directly. Over $\d t$,
gamma earns $\tfrac12\Gamma(\d S)^2$ and theta costs $\tfrac12\sigma^2S^2\Gamma\,\d t$, so the two
are equal when

$$(\d S)^2 = \sigma^2S^2\,\d t \quad\Longleftrightarrow\quad |\d S| = \sigma S\sqrt{\d t}$$

This is the single most-used number on a gamma book, and it comes out of the pricing equation with
no differentiation at all.
:::

## Assumptions & Edge Cases

:::assumption
Black–Scholes Greeks are **model outputs**, and they inherit every assumption of the model:

- **Constant $\sigma$.** But we compute vega, the sensitivity to a parameter the model says is
  constant. The formula is being used outside its own logic — deliberately, and it works, but it is
  worth knowing.
- **A parallel shift in vol.** Raw vega assumes the whole surface moves together. It does not.
- **Continuous rebalancing.** Delta hedging is exact only in the limit.
- **Small moves.** The expansion is second order in $S$; for a large move the higher terms matter.
- **No jumps.** All Greeks are derivatives, and derivatives describe local behaviour.
:::

:::warning
**Greeks are a local linearisation and fail exactly when you need them.** For a 1% move they are
excellent. For a 20% overnight gap they are not: the expansion's neglected terms grow as $(\d S)^3$
and higher, spot and vol move together (vanna), and the surface reprices. Every serious risk system
therefore runs a **spot–vol grid** — full revaluation across a matrix of shocks — alongside the
Greeks, and the binding risk limit on a large book is the grid, not the Greeks.

The failure mode is specific and recurrent: a book that is flat delta, flat vega and small gamma
under normal moves can be badly exposed at $-20\%$ spot with $+10$ vols. That combination is the
scenario, not the derivative.
:::

:::warning
**Aggregating Greeks across maturities, strikes or underlyings hides real positions.** Summing vega
across tenors assumes one-for-one vol moves; summing across underlyings assumes correlation 1;
summing across strikes assumes a parallel smile shift. A book flat on total vega is very often long
short-dated and short long-dated volatility, and will discover this the first time the term
structure steepens. Bucket by tenor, weight by expected move, and never treat one aggregated number
as a hedge.
:::

## Worked Example

**The full Greek picture for one position.** Long 100 at-the-money calls, $S=K=100$, $T=0.25$,
$\sigma=25\%$, $r=4\%$. One contract on one share, for clarity.

$d_1 = 0.1425$, $d_2 = 0.0175$, $\phi(d_1) = 0.3949$. Theta is quoted per **trading** day, since
$\sigma$ is annualised on 252 of them — mixing that with a 365-day theta is a common and expensive
unit error.

| Greek | Per option | ×100 | Reading |
|---|---|---|---|
| $V$ | 5.472 | \$547.21 | premium paid |
| $\Delta = N(d_1)$ | 0.5567 | 55.7 shares | sell 56 shares to hedge |
| $\Gamma$ | 0.03159 | 3.159 | delta moves 3.2 per \$1 |
| $\mathcal V = S\phi\sqrt T$ | 0.1975 /vol pt | \$19.75 per vol pt | 1 vol = \$19.75 |
| $\Theta$ | $-11.881$/yr | $-\$4.71$/day | daily rent |
| $\rho$ | 0.1255 per 1% | \$12.55 per 1% | small, as usual |

**Now check the identity.** Expected daily gamma gain:

$$\tfrac12\Gamma\sigma^2S^2\,\d t = 0.5\times3.159\times0.0625\times10000/252 = \$3.918$$

against theta of \$4.715. The \$0.797 gap is **not** slack in the approximation — it is exactly the
financing terms the delta-hedged form drops:

$$\frac{(rS\Delta - rV)\times100}{252} = \frac{(0.04\times100\times0.5567 - 0.04\times5.472)\times100}{252} = \$0.797$$

Gamma accounts for 83% of theta and the interest on the hedge accounts for the rest. That is the
Black–Scholes equation, term by term, on a real position.

**Break-even daily move:** $\sigma S\sqrt{\d t} = 0.25\times100/\sqrt{252} = \$1.57$.

Test it. A \$3 move gives $\tfrac12(3.159)(9) = \$14.22$ of gamma against \$4.71 of theta — a
**\$9.50 profit**, in either direction. A \$0.50 move gives $\tfrac12(3.159)(0.25) = \$0.39$
against \$4.71 — a **\$4.32 loss**. Same position, opposite outcome, and the direction of the stock
was never used.

## Why It Matters in Quant Finance

**They are the position, not a description of it.** A derivatives book is not managed as a list of
contracts; it is managed as a vector of Greeks. Trades are chosen to move that vector, limits are
set on it, and P&L is attributed to it. Two books holding entirely different instruments with the
same Greeks are the same position.

**They give P&L attribution, which is how you find out whether the model is working.** Decompose the
day's P&L into $\Delta\,\d S + \tfrac12\Gamma(\d S)^2 + \mathcal V\,\d\sigma + \Theta\,\d t$ and
compare to actual. The **unexplained residual** is the number that matters: it is the model's error,
and a residual that grows is the earliest warning that something — a dividend, a borrow, a
correlation, a missing second-order Greek — is wrong. This is standard daily practice on every
derivatives desk.

**They define what "hedged" means, and therefore what it does not.** Delta-neutral is not
risk-neutral; it is neutral to the first term of one expansion. Naming the term you have zeroed and
the terms you have not is the whole of derivatives risk management.

**They are what makes real-time risk computable.** Because Black–Scholes has closed-form
derivatives, a book of hundreds of thousands of positions can be re-risked in milliseconds. Models
without closed-form Greeks need bump-and-reprice, which is a different engineering problem
altogether — and the reason Black–Scholes remains the risk layer even where a better model does the
pricing.

## Trading & Research Application

:::desk
**Know your break-even move.** $\sigma S\sqrt{\d t}$ is the daily move at which gamma pays theta. It
is the number that says whether today was a good day for the book, before the P&L arrives.

**Gamma and vega are different trades.** Short-dated for realised-versus-implied (high gamma, high
theta); long-dated for a view on the level of implied vol (high vega, low bleed). A trader who wants
"long vol" and buys weeklies has bought gamma and a large theta bill, not vol.

**Short gamma is a position that hedges itself into losses.** Rebalancing a short-gamma book means
buying rallies and selling dips — trading with the move, realising a loss each time, and
mechanically amplifying the move you are losing to. Size it for the day it goes wrong, not for the
carry it earns.

**Watch vanna in equities.** Spot down and vol up are correlated, so a book flat on delta and vega
can have a systematic P&L that neither number shows. It is invisible until a crash, and then it is
the main term.

**Attribute P&L every day and chase the residual.** The unexplained line is where model error,
stale marks, wrong dividends and missing Greeks announce themselves — usually well before anything
else does.

**Run the spot–vol grid, not just the Greeks.** The Greeks tell you about today's move. The grid
tells you about the move that closes the desk, and it is the one risk management should bind on.
:::

## Implementation Notes

```python
import numpy as np
from math import erf, log, sqrt, exp, pi

def _N(x): return 0.5 * (1.0 + erf(x / sqrt(2.0)))
def _phi(x): return exp(-0.5 * x * x) / sqrt(2.0 * pi)

def greeks(S, K, r, sigma, T, q=0.0, call=True):
    """All first- and second-order Greeks in one pass.

    Computed together on purpose: d1, d2 and phi(d1) are shared by every one of
    them, so a book-level risk run that calls five separate functions does five
    times the transcendental work for the same answer. On a large book that is
    the difference between real-time risk and a batch job.

    Units are the ones a desk actually reads: theta per TRADING day, vega and rho
    per PERCENTAGE POINT. Trading days rather than calendar days because sigma is
    annualised on 252 of them, so a 252-theta is directly comparable to the
    break-even move sigma*S*sqrt(1/252) and a 365-theta is not. Mixing the two
    conventions in one report understates theta by 31%."""
    if T <= 0 or sigma <= 0:
        intrinsic = max(S - K, 0.0) if call else max(K - S, 0.0)
        delta = (1.0 if S > K else 0.0) if call else (-1.0 if S < K else 0.0)
        return {'price': intrinsic, 'delta': delta, 'gamma': 0.0,
                'vega': 0.0, 'theta': 0.0, 'rho': 0.0, 'vanna': 0.0, 'volga': 0.0}

    sqrtT = sqrt(T)
    d1 = (log(S / K) + (r - q + 0.5 * sigma**2) * T) / (sigma * sqrtT)
    d2 = d1 - sigma * sqrtT
    disc_r, disc_q, pdf = exp(-r * T), exp(-q * T), _phi(d1)

    price = (S * disc_q * _N(d1) - K * disc_r * _N(d2) if call
             else K * disc_r * _N(-d2) - S * disc_q * _N(-d1))
    delta = disc_q * (_N(d1) if call else _N(d1) - 1.0)
    gamma = disc_q * pdf / (S * sigma * sqrtT)          # same for call and put
    vega = S * disc_q * pdf * sqrtT                     # same for call and put
    decay = -S * disc_q * pdf * sigma / (2 * sqrtT)     # shared by call and put
    if call:
        theta = decay + q * S * disc_q * _N(d1) - r * K * disc_r * _N(d2)
        rho = K * T * disc_r * _N(d2)
    else:
        theta = decay - q * S * disc_q * _N(-d1) + r * K * disc_r * _N(-d2)
        rho = -K * T * disc_r * _N(-d2)

    # Every sensitivity to sigma is reported per VOL POINT, the second-order
    # ones included: vanna carries one factor of sigma and volga two, so they
    # need one and two factors of 1/100 to be in the same units as vega. Mixing
    # a per-point vega with a per-unit volga in one dict is a 100x error waiting
    # to be summed into a risk report.
    return {'price': price, 'delta': delta, 'gamma': gamma,
            'vega': vega / 100.0,                       # per 1 vol point
            'theta': theta / 252.0,                     # per trading day
            'rho': rho / 100.0,                         # per 1% rate move
            'vanna': -disc_q * pdf * d2 / sigma / 100.0,        # per vol point
            'volga': vega * d1 * d2 / sigma / 100.0**2}         # per vol point^2

def attribute_pnl(g0, S0, S1, sigma0, sigma1, dt, actual_pnl):
    """Explain a day's P&L with the Taylor expansion, and return the residual.

    The residual is the point of the function, not a byproduct, which is why
    `actual_pnl` is a required argument rather than an optional one: components
    that sum to something plausible tell you nothing on their own. A residual
    that is small and stationary means the model is describing the book; one
    that grows means something unmodelled -- a dividend, a borrow, skew moving
    non-parallel, or a second-order Greek you are not carrying."""
    dS, dsig = S1 - S0, (sigma1 - sigma0) * 100.0
    parts = {'delta': g0['delta'] * dS,
             'gamma': 0.5 * g0['gamma'] * dS**2,
             'vega': g0['vega'] * dsig,
             'theta': g0['theta'] * dt * 252.0,
             'vanna': g0['vanna'] * dS * dsig}
    parts['explained'] = sum(parts.values())
    parts['residual'] = actual_pnl - parts['explained']
    return parts

# Consistency checks worth asserting:
#   gamma and vega identical for call and put at the same strike
#   vega == sigma * T * S**2 * gamma   (to floating point)
#   theta + r*S*delta + 0.5*sigma**2*S**2*gamma == r*price   (the BS equation)
#   delta_call - delta_put == exp(-q*T)                      (parity differentiated)
```

## Common Mistakes

:::pitfall
- **Believing delta-neutral means risk-neutral.** It zeroes one term of five. Gamma, vega and vanna
  are all still live.
- **Calling delta "the probability of finishing in the money".** That is $N(d_2)$; delta is
  $N(d_1)$. Close at the money, badly different in the wings.
- **Summing vega across maturities.** Short and long vols do not move together. Bucket and weight.
- **Confusing gamma and vega risk.** Proportional for one option, radically different across a term
  structure. They need different hedges.
- **Quoting theta without its convention.** Per day or per year, calendar or business days — a
  factor of 365 or 252 hides in this and it is a common source of nonsense P&L forecasts.
- **Ignoring vanna in equities.** Spot and vol are correlated; a delta- and vega-flat book can still
  have a systematic exposure to that correlation.
- **Trusting Greeks through a gap.** They are a local expansion. Beyond a few percent, revalue.
- **Assuming gamma is safely small because it is small today.** It diverges as expiry approaches. A
  benign short strike becomes the whole risk of the book in the final week.
- **Reporting Greeks in mixed units.** Vega per vol point next to theta per year makes the smaller
  risk look larger; pick a convention and enforce it in the library, not in the spreadsheet.
:::

## 30-Second Revision

- The Greeks are one Taylor expansion:
  $\d V = \Delta\d S + \tfrac12\Gamma(\d S)^2 + \mathcal V\d\sigma + \Theta\d t + \rho\,\d r$.
- $\Delta_{\text{call}} = N(d_1)$, $\Delta_{\text{put}} = N(d_1)-1$. $\Gamma$ and $\mathcal V$ are the
  same for calls and puts.
- $\Gamma = \phi(d_1)/(S\sigma\sqrt T)$ — peaks at the money, diverges at expiry.
- $\mathcal V = S\phi(d_1)\sqrt T$ — grows with maturity. So $\mathcal V = \sigma TS^2\Gamma$: same
  risk locally, different risks across the term structure.
- $\Theta \approx -\tfrac12\sigma^2S^2\Gamma$ when delta-hedged. Theta is the rent on gamma; the
  Black–Scholes equation is the lease.
- Break-even daily move $= \sigma S\sqrt{\d t}$. Move more, gamma wins; move less, theta wins.
- Delta-neutral $\ne$ risk-neutral. Short gamma loses on moves in *either* direction and hedges
  itself into the loss.
- Vanna $= \partial\Delta/\partial\sigma$ is the skew Greek; volga is smile convexity. Both bite in a
  crash.
- Aggregate Greeks hide term-structure and cross-asset positions. Bucket them, and run a spot–vol
  grid for anything large.
