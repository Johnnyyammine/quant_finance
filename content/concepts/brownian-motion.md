---
id: brownian-motion
title: Brownian Motion
subject: stochastic-processes
summary: The continuous-time limit of a random walk — Gaussian, independent increments scaling with √t, nowhere differentiable, and the driving noise underneath essentially every continuous-time model in finance.
difficulty: advanced
interview_relevance: 4
tags: [stochastic-processes, wiener-process, diffusion, pricing, quadratic-variation]
prerequisites: [martingales, variance]
related: [expectation]
aliases: [Wiener process, Wt, diffusion, random walk limit]
updated: 2026-01-14
references:
  - title: "Shreve, *Stochastic Calculus for Finance II*, ch. 3"
    url: ""
  - title: "Karatzas & Shreve, *Brownian Motion and Stochastic Calculus*"
    url: ""
questions:
  - q: Why does Brownian motion scale as √t rather than t?
    difficulty: intermediate
    tags: [scaling, variance]
    hint: Variances add for independent increments; standard deviations do not.
    a: |
      Increments are independent, so **variances** add:
      $\Var(W_t) = \sum \Var(\Delta W) = t$. The standard deviation is therefore $\sqrt{t}$.

      Contrast with a deterministic drift, where displacements add linearly. This is why over long
      horizons drift dominates noise ($\mu t$ vs $\sigma\sqrt t$) and over short horizons noise
      dominates drift — the single most important scaling fact in finance.

      **Consequences that follow immediately:** volatility annualises by $\sqrt{252}$; the
      signal-to-noise ratio of a return estimate grows only as $\sqrt{T}$, which is why estimating
      expected returns takes decades; and Sharpe ratio scales as $\sqrt{T}$, which is why it must
      always be quoted with its horizon.
  - q: What is E[W_s W_t]?
    difficulty: intermediate
    tags: [covariance, core]
    a: |
      $\Cov(W_s, W_t) = \min(s,t)$.

      For $s < t$, write $W_t = W_s + (W_t - W_s)$ where the increment is independent of $W_s$:

      $$\E[W_sW_t] = \E[W_s^2] + \E[W_s]\,\E[W_t-W_s] = s + 0 = s = \min(s,t)$$

      Only the shared history contributes. This covariance kernel *defines* Brownian motion among
      Gaussian processes, and it is the reason a Brownian bridge (conditioning on $W_T$) has
      covariance $\min(s,t) - st/T$.
  - q: Brownian motion is continuous but nowhere differentiable. What does that mean for a hedger?
    difficulty: advanced
    tags: [quadratic-variation, hedging, gamma]
    a: |
      Over $[t, t+\d t]$ the path moves $O(\sqrt{\d t})$, so the difference quotient
      $\Delta W/\Delta t \sim 1/\sqrt{\Delta t} \to \infty$. There is no velocity, so ordinary
      calculus does not apply — hence Itô calculus.

      **For a hedger this is not abstract.** Total path length is infinite, so continuous rebalancing
      would require infinite trading and infinite cost. Discrete hedging at interval $\Delta t$
      leaves a residual whose standard deviation scales as $\sqrt{\Delta t}$, and the P&L of that
      residual is the gamma term:

      $$\text{hedging error} \approx \tfrac12 \Gamma \big[(\Delta S)^2 - \sigma^2S^2\Delta t\big]$$

      You are effectively short realised variance and long implied variance. The optimal rebalancing
      frequency trades this variance against transaction costs, and the fact that both scale in
      $\Delta t$ but with different powers is what makes a finite optimum exist.
  - q: What is the quadratic variation of Brownian motion over [0,T], and why is it the key fact in stochastic calculus?
    difficulty: advanced
    tags: [quadratic-variation, ito]
    a: |
      $\langle W\rangle_T = T$, **almost surely** — not merely in expectation. Sum the squared
      increments over a partition of mesh $\Delta t$: there are $T/\Delta t$ terms each with mean
      $\Delta t$, so the sum has mean $T$ and variance $O(\Delta t) \to 0$.

      Why it matters: in a Taylor expansion of $f(W_t)$ the second-order term carries $(\d W)^2$.
      For a smooth path that would be $O(\d t^2)$ and negligible; here $(\d W)^2 = \d t$, which is
      first order. That surviving term is the entire difference between ordinary and Itô calculus:

      $$\d f(W_t) = f'(W_t)\,\d W_t + \tfrac12 f''(W_t)\,\d t$$

      Every convexity effect in finance — gamma P&L, volatility drag, the $-\sigma^2/2$ in lognormal
      returns, the value of a variance swap — is that $\tfrac12 f''$ term.
  - q: A stock follows GBM with μ = 10%, σ = 30%. What is the probability it is above its starting price in one year?
    difficulty: advanced
    tags: [gbm, lognormal, drift]
    a: |
      Under GBM, $\ln(S_T/S_0) \sim N\!\big((\mu - \sigma^2/2)T,\ \sigma^2 T\big)$.

      Log-drift $= 0.10 - 0.045 = 0.055$; log-vol $= 0.30$.

      $$\P(S_1 > S_0) = \P(Z > -0.055/0.30) = \Phi(0.183) \approx 57\%$$

      **The trap:** the expected price is $S_0 e^{0.10} = 1.105 S_0$, a 10.5% gain, yet the stock
      finishes down 43% of the time and the *median* outcome is only $+5.7\%$. The $-\sigma^2/2$
      is volatility drag ([[variance]], Jensen's inequality). At $\sigma = 60\%$ the log-drift turns
      negative $(0.10-0.18=-0.08)$: the stock has positive expected return and declines in the
      majority of scenarios — the exact arithmetic behind the long-run decay of leveraged ETFs.
---

## Intuition

Take a random walk, make the steps smaller and more frequent, and hold the total variance per unit
time fixed. Because variance adds, a step of size $\sigma\sqrt{\Delta t}$ every $\Delta t$ preserves
variance $\sigma^2$ per unit time as $\Delta t \to 0$. The limit is Brownian motion.

Two properties follow from that construction and are worth internalising separately:

1. **The $\sqrt{t}$ scaling.** Dispersion grows with the square root of time, not linearly. This is
   the single most-used quantitative fact in finance.
2. **Roughness at every scale.** Zoom in on a Brownian path and it looks the same — statistically
   self-similar, with $W_{ct} \overset{d}{=} \sqrt{c}\,W_t$. There is no scale at which the path
   becomes smooth, so it has no derivative anywhere.

:::insight
The step size $\sqrt{\Delta t}$ is the whole story. It is why the path is continuous (steps shrink),
why it is not differentiable (steps shrink *slower* than the time interval, so slope $\to \infty$),
and why $(\d W)^2 = \d t$ survives in Itô's lemma while $(\d t)^2$ does not.
:::

:::module random-walk
{"paths": 40, "steps": 500, "sigma": 0.2, "drift": 0}
:::

## Mathematical Formulation

Standard Brownian motion $(W_t)_{t\ge0}$ is defined by four properties:

1. $W_0 = 0$
2. Independent increments: $W_t - W_s \perp \mathcal F_s$ for $s<t$
3. Gaussian increments: $W_t - W_s \sim N(0, t-s)$
4. Continuous sample paths (almost surely)

:::formula {name="Increment distribution" used-in="Derivatives, Simulation, Risk"}
W_t - W_s \sim N(0,\, t-s), \qquad \Cov(W_s, W_t) = \min(s,t)
:::

:::formula {name="Quadratic variation" used-in="Itô Calculus, Volatility Trading" note="Holds almost surely, not just in expectation — this is what makes Itô calculus work."}
\langle W \rangle_T = \lim_{\|\Pi\|\to 0} \sum_{i} (W_{t_{i+1}} - W_{t_i})^2 = T
\quad\Longrightarrow\quad (\d W_t)^2 = \d t
:::

:::formula {name="Itô's lemma (one dimension)" used-in="Options, Derivatives, Hedging" note="The ½f'' term is the source of every convexity effect in finance."}
\d f(t, W_t) = \left(\frac{\partial f}{\partial t} + \frac{1}{2}\frac{\partial^2 f}{\partial x^2}\right)\d t
+ \frac{\partial f}{\partial x}\,\d W_t
:::

Geometric Brownian motion — the model behind Black–Scholes — and its solution:

:::formula {name="Geometric Brownian motion" used-in="Options, Equity Modelling"}
\d S_t = \mu S_t\,\d t + \sigma S_t\,\d W_t
\quad\Longrightarrow\quad
S_t = S_0 \exp\!\left[\left(\mu - \tfrac{\sigma^2}{2}\right)t + \sigma W_t\right]
:::

## Derivation

:::derivation Why quadratic variation equals T
Partition $[0,T]$ into $n$ equal intervals of length $\Delta t = T/n$ and set
$Q_n = \sum_{i=1}^n (\Delta W_i)^2$.

Each $\Delta W_i \sim N(0,\Delta t)$, so $\E[(\Delta W_i)^2] = \Delta t$ and
$\E[Q_n] = n\Delta t = T$ for every $n$.

For the variance, use $\Var(Z^2) = 2\sigma^4$ for $Z\sim N(0,\sigma^2)$:

$$\Var(Q_n) = n \cdot 2(\Delta t)^2 = 2n\frac{T^2}{n^2} = \frac{2T^2}{n} \longrightarrow 0$$

So $Q_n \to T$ in $L^2$, and along a fast enough sequence of partitions, almost surely. Compare a
differentiable path, where $\sum(\Delta f)^2 \approx \sum (f')^2(\Delta t)^2 = O(\Delta t) \to 0$.
**Non-zero quadratic variation is exactly what separates a diffusion from a smooth path**, and it is
why $(\d W)^2$ cannot be discarded.
:::

:::derivation The GBM solution and where −σ²/2 comes from
Apply Itô's lemma to $f(S) = \ln S$, with $f' = 1/S$ and $f'' = -1/S^2$:

$$\d(\ln S_t) = \frac{1}{S_t}\d S_t - \frac{1}{2}\frac{1}{S_t^2}(\d S_t)^2$$

Substituting $\d S_t = \mu S_t\d t + \sigma S_t \d W_t$ and using
$(\d S_t)^2 = \sigma^2S_t^2 (\d W_t)^2 = \sigma^2S_t^2\,\d t$:

$$\d(\ln S_t) = \left(\mu - \frac{\sigma^2}{2}\right)\d t + \sigma\, \d W_t$$

Integrating gives the closed form. The $-\sigma^2/2$ is **not a modelling choice** — it is forced by
the concavity of $\ln$ meeting non-zero quadratic variation. It is Jensen's inequality made
dynamic, and it is the mathematical identity of volatility drag: expected log return is expected
arithmetic return minus $\sigma^2/2$.
:::

:::derivation Nowhere differentiability, informally
Over $[t, t+h]$, $|W_{t+h} - W_t| \sim \sqrt h$ in distribution. Then

$$\left|\frac{W_{t+h}-W_t}{h}\right| \sim \frac{\sqrt h}{h} = \frac{1}{\sqrt h} \longrightarrow \infty$$

Continuity requires only that the numerator vanish, which it does. Differentiability requires it to
vanish *faster than $h$*, which it does not. The path is continuous everywhere and differentiable
nowhere — an object that seemed pathological when Weierstrass constructed one, and which turns out
to be the generic behaviour of prices.
:::

## Assumptions & Edge Cases

:::assumption
Brownian motion is a model, and every one of its defining properties is violated by market data:

- **Gaussian increments.** Real returns are leptokurtic. A 5σ daily move should occur once per
  7,000 years; equity markets deliver several per decade.
- **Independent increments.** Returns show weak autocorrelation, but *squared* returns are strongly
  autocorrelated — volatility clusters. GARCH and stochastic-volatility models exist for this.
- **Continuous paths.** Markets gap on news, overnight, and at open. Jump-diffusion (Merton) and
  Lévy processes address this; the practical consequence is that delta hedging cannot be made safe
  by trading faster.
- **Constant $\sigma$.** Implied volatility varies by strike and maturity — the volatility smile is
  the market's direct statement that GBM is wrong.
:::

:::warning
The failures are not uniform across applications. GBM is a reasonable scaffold for *relative* value
and hedging, where errors partly cancel, and a poor model for *tail risk*, where the Gaussian
assumption fails precisely where it matters. A VaR model built on Brownian motion will understate
crisis losses systematically — the model does not merely have errors, it has errors that are
correlated with the states you care about.
:::

## Worked Example

A stock at \$100 with $\sigma = 25\%$ annual. What is the probability it falls below \$80 within
one year, ignoring drift?

Log-return needed: $\ln(80/100) = -0.223$. Annual log-vol $= 0.25$, so the terminal probability is

$$\P(S_1 < 80) = \Phi(-0.223/0.25) = \Phi(-0.892) \approx 18.6\%$$

But "falls below at any point" is a first-passage question, not a terminal one. By the **reflection
principle**, for driftless Brownian motion the probability of ever hitting a level is exactly twice
the probability of finishing beyond it:

$$\P\!\left(\min_{t\le 1} S_t < 80\right) \approx 2 \times 18.6\% = 37.2\%$$

**Twice as likely.** The reflection principle is worth committing to memory: it prices every
knock-in and knock-out barrier option, and it is the reason a stop-loss is triggered far more often
than a naive terminal-distribution calculation suggests. A trader who sizes a stop using the
terminal probability will be stopped out roughly twice as often as planned.

## Why It Matters in Quant Finance

Brownian motion is the noise term in nearly every continuous-time model:

| Model | SDE | Used for |
|---|---|---|
| GBM | $\d S = \mu S\,\d t + \sigma S\,\d W$ | equities, Black–Scholes |
| Ornstein–Uhlenbeck | $\d X = \theta(\mu - X)\d t + \sigma\,\d W$ | mean reversion, pairs, spreads |
| Vasicek / CIR | $\d r = a(b-r)\d t + \sigma r^\gamma \d W$ | short rates |
| Heston | $\d v = \kappa(\theta-v)\d t + \xi\sqrt v\,\d W$ | stochastic volatility |
| Almgren–Chriss | $\d S = -\eta\,\d Q + \sigma\,\d W$ | optimal execution |

The Black–Scholes PDE emerges from Itô's lemma plus the no-arbitrage argument: form a portfolio
long the option and short $\partial V/\partial S$ shares, and the $\d W$ terms cancel exactly.
What remains is riskless, so it must earn $r$ — and that equation is Black–Scholes. The
[[martingales|martingale]] view says the same thing: under $\Q$ the discounted price is a
martingale and the hedge ratio is the martingale representation integrand.

## Trading & Research Application

:::desk
**Position sizing and time scaling.** $\sqrt{t}$ scaling determines how a stop-loss, a drawdown
limit or a rebalancing horizon should be set. Doubling the holding period increases expected P&L by
2× and risk by only $\sqrt2$ — the entire case for lower-turnover strategies, and the
counterweight to signal decay.

**Hedging error is a variance trade.** Discrete delta hedging at frequency $\Delta t$ produces a
residual P&L of $\tfrac12\Gamma[(\Delta S)^2 - \sigma^2S^2\Delta t]$. Long an option and hedging
discretely, you are systematically long realised variance and short implied. The whole gamma
scalping business is the accumulation of this term.

**Where the model breaks is where the money is.** Options are not priced with a single $\sigma$
because the market knows GBM is wrong; the skew is the price of the missing left tail. Anyone
selling options at a flat Black–Scholes vol is selling the model's error to someone who has
noticed it.

**Simulation discipline.** Simulate log prices, not prices, and never let discretisation reintroduce
the $\sigma^2/2$ you already accounted for. Getting this wrong produces a systematic drift bias in
Monte Carlo pricing that is easy to miss and hard to debug.
:::

## Implementation Notes

```python
import numpy as np

def simulate_gbm(s0, mu, sigma, T, steps, paths, seed=0):
    """Exact GBM simulation. Note the -sigma²/2: the SDE's drift mu is the
    ARITHMETIC expected return; the log-drift is mu - sigma²/2. Omitting it
    is the most common simulation bug in quantitative finance."""
    rng = np.random.default_rng(seed)
    dt = T / steps
    shocks = rng.standard_normal((paths, steps)) * np.sqrt(dt)
    log_increments = (mu - 0.5 * sigma**2) * dt + sigma * shocks
    log_paths = np.cumsum(log_increments, axis=1)
    return s0 * np.exp(np.concatenate([np.zeros((paths, 1)), log_paths], axis=1))

# Sanity check that catches the bug above:
#   paths[:, -1].mean() should approach s0 * exp(mu * T), not s0 * exp((mu - sigma²/2) * T)
```

## Common Mistakes

:::pitfall
- **Forgetting $-\sigma^2/2$** when converting between arithmetic and log drift. This is the single
  most common error in derivatives interviews and in production simulation code.
- **Applying ordinary chain rule** to functions of $W_t$. $(\d W)^2 = \d t$ does not vanish.
- **Confusing $\E[S_T]$ with the median.** For lognormal $S$, mean $>$ median, and the gap widens
  with $\sigma^2 T$.
- **Using terminal probabilities for barrier questions.** The reflection principle roughly doubles
  first-passage probabilities.
- **Treating $\sqrt{t}$ scaling as universal.** It requires independent increments; autocorrelated
  or regime-switching returns scale differently.
- **Trusting Gaussian tails.** The model's worst failures are concentrated exactly in the scenarios
  risk management exists to handle.
:::

## 30-Second Revision

- $W_t - W_s \sim N(0, t-s)$, independent increments, continuous, $\Cov(W_s,W_t)=\min(s,t)$.
- Scaling is $\sqrt t$: variances add, standard deviations do not.
- $\langle W\rangle_T = T$ almost surely, so $(\d W)^2 = \d t$ — the fact that creates Itô calculus.
- Itô: $\d f = (f_t + \tfrac12 f_{xx})\d t + f_x\,\d W$. The $\tfrac12 f_{xx}$ term is all convexity.
- GBM: $S_t = S_0\exp[(\mu-\sigma^2/2)t + \sigma W_t]$. The $-\sigma^2/2$ is volatility drag.
- Reflection principle: $\P(\text{ever hit a level}) \approx 2\,\P(\text{finish beyond it})$.
- Continuous everywhere, differentiable nowhere — so continuous hedging is impossible and
  the residual is gamma P&L.
