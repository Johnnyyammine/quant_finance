---
id: bayes-theorem
title: Bayes' Theorem
subject: probability
summary: The rule for inverting a conditional probability — turning "how likely is this evidence if the hypothesis is true" into "how likely is the hypothesis given the evidence".
difficulty: foundational
interview_relevance: 5
tags: [probability, bayes, inference, base-rates, updating]
prerequisites: [conditional-probability]
related: [expectation]
aliases: [Bayes rule, posterior, base rate, likelihood ratio]
minutes: 13
updated: 2026-01-14
references:
  - title: "Jaynes, *Probability Theory: The Logic of Science*, ch. 4"
    url: ""
questions:
  - q: A test for a disease affecting 1 in 1,000 people is 99% accurate in both directions. You test positive. What is the probability you have the disease?
    difficulty: foundational
    tags: [base-rate, classic]
    hint: Imagine 100,000 people rather than manipulating symbols.
    a: |
      Take 100,000 people. 100 have the disease; 99 of them test positive. 99,900 are healthy;
      1% — that is 999 — test positive anyway.

      $$\P(D\mid +) = \frac{99}{99 + 999} = \frac{99}{1098} \approx 9.0\%$$

      **False positives outnumber true positives 10 to 1** because the healthy pool is a thousand
      times larger. The natural-frequency framing is worth practising: interviewers use it to see
      whether you reason about base rates automatically or only when prompted.
  - q: Your model flags 200 stocks a month as "will beat earnings". It is right 65% of the time. Base rate of beats is 55%. Is the model useful?
    difficulty: intermediate
    tags: [signal-evaluation, lift]
    a: |
      Lift is $0.65/0.55 = 1.18\times$ — a real but thin edge, so the question becomes whether it
      survives costs and whether 65% is estimated precisely enough.

      With $n=200$/month over a year ($N=2400$), the standard error on a proportion is
      $\sqrt{p(1-p)/N} = \sqrt{0.65\cdot0.35/2400} \approx 0.97\%$. So 65% ± 2% at two standard
      errors, comfortably above 55%. **Statistically real.**

      The economic question is separate: an 18% lift on a binary event converts to a small expected
      return, and if the flagged names are the crowded ones, realised alpha after impact may be zero.
      Always answer both the statistical and the economic question.
  - q: Two coins: one fair, one two-headed. You pick one at random and flip 3 heads in a row. Probability it is the two-headed coin?
    difficulty: intermediate
    tags: [likelihood-ratio, classic]
    a: |
      Prior odds 1:1. Likelihood ratio per flip is $1 / 0.5 = 2$, so three flips give $2^3 = 8$.

      **Posterior odds 8:1**, i.e. $\P = 8/9 \approx 88.9\%$.

      Doing it in odds form avoids the normalising constant entirely — this is how you should do
      every Bayes question under time pressure.
  - q: A strategy shows a Sharpe of 2.0 over 3 years. You know 90% of proposed strategies are worthless and backtests of worthless strategies produce Sharpe ≥ 2 about 5% of the time. What do you believe?
    difficulty: advanced
    tags: [multiple-testing, backtesting, research-process]
    a: |
      Prior odds good:bad $= 1:9$. Assume a genuinely good strategy shows Sharpe $\ge 2$ with
      probability $0.5$. Likelihood ratio $= 0.5/0.05 = 10$.

      Posterior odds $= (1/9)\times 10 = 10/9$, so $\P(\text{real}) \approx 53\%$ — **a coin flip**,
      from what looked like an outstanding backtest.

      Now the killer follow-up: if you tested 100 variants and reported the best, the relevant
      likelihood is $\P(\max \text{Sharpe} \ge 2 \mid \text{all worthless}) \approx 1 - 0.95^{100}
      \approx 99.4\%$, so the likelihood ratio collapses to $0.5/0.994 \approx 0.5$ and the
      posterior odds fall to $1:18$ — **about 5%**. This is why the number of trials is the single
      most important thing to disclose in a research meeting, and why deflated Sharpe ratios exist.
---

## Intuition

Bayes' theorem answers a question people constantly get backwards. You know how the world produces
evidence — $\P(\text{evidence} \mid \text{hypothesis})$ — and you want the reverse,
$\P(\text{hypothesis} \mid \text{evidence})$. The two are not the same, and the exchange rate
between them is the **base rate**.

The clearest mental model is the two-column picture. Split the population by hypothesis, work out
how much evidence each column produces, then ask which column your observed evidence most likely
came from. If one column is a thousand times bigger, even a rare false-positive rate in that column
can swamp the true positives from the small one.

:::insight
Bayes is best done in **odds form**, where the normalising constant disappears entirely:

$$\underbrace{\frac{\P(H\mid E)}{\P(\neg H \mid E)}}_{\text{posterior odds}}
= \underbrace{\frac{\P(H)}{\P(\neg H)}}_{\text{prior odds}} \times
\underbrace{\frac{\P(E\mid H)}{\P(E\mid \neg H)}}_{\text{likelihood ratio}}$$

Evidence is a *multiplier on odds*. That single sentence solves most interview questions faster
than the standard formula.
:::

## Mathematical Formulation

:::formula {name="Bayes' theorem" used-in="Alpha Research, Risk, Credit, Microstructure"}
\P(H \mid E) = \frac{\P(E \mid H)\,\P(H)}{\P(E)}
:::

With the denominator expanded by the law of total probability — the form you actually compute with:

:::formula {name="Bayes' theorem, expanded" used-in="Statistics, Classification"}
\P(H \mid E) = \frac{\P(E \mid H)\,\P(H)}{\P(E\mid H)\P(H) + \P(E \mid \neg H)\,\P(\neg H)}
:::

And in log-odds, where updates simply add — the form used inside every logistic regression and
naive-Bayes classifier:

:::formula {name="Log-odds update" used-in="Machine Learning, Signal Combination"}
\operatorname{logit}\P(H\mid E) = \operatorname{logit}\P(H) + \ln \frac{\P(E\mid H)}{\P(E\mid\neg H)}
:::

:::module bayes-explorer
{"prior": 0.01, "sens": 0.99, "spec": 0.99}
:::

## Derivation

:::derivation Two lines from the definition
By [[conditional-probability|the definition of conditional probability]], the joint probability
factors two ways:

$$\P(H \cap E) = \P(H\mid E)\,\P(E) = \P(E \mid H)\,\P(H)$$

Divide both sides by $\P(E)$:

$$\P(H\mid E) = \frac{\P(E\mid H)\,\P(H)}{\P(E)}$$

That is the whole theorem. Its difficulty is entirely conceptual, not mathematical — which is
precisely why interviewers like it.
:::

:::derivation Sequential updating and why order does not matter
With conditionally independent evidence $E_1, E_2$ given $H$:

$$\frac{\P(H\mid E_1,E_2)}{\P(\neg H\mid E_1,E_2)} = \frac{\P(H)}{\P(\neg H)}\cdot
\frac{\P(E_1\mid H)}{\P(E_1\mid\neg H)}\cdot\frac{\P(E_2\mid H)}{\P(E_2\mid\neg H)}$$

Likelihood ratios multiply, so today's posterior is tomorrow's prior and the order of arrival is
irrelevant. **The conditional independence assumption is doing real work here** — correlated
evidence double-counts. Combining five momentum signals as if independent produces wildly
overconfident posteriors, which is the Bayesian statement of why signal orthogonalisation matters.
:::

## Assumptions & Edge Cases

:::assumption
- **The prior must be honest.** Garbage prior in, garbage posterior out. In finance the prior is
  usually "most strategies do not work", and it should be pessimistic.
- **Conditional independence of evidence** is assumed by naive Bayes and violated by almost all
  financial signals.
- **A zero prior is unrecoverable**: $\P(H)=0 \Rightarrow \P(H\mid E)=0$ for any evidence. Cromwell's
  rule — never assign probability zero to something you would revise on.
- **The evidence must be the evidence you actually would have observed.** Conditioning on "I found
  a strategy with Sharpe 2" differs from "the best of 100 tried had Sharpe 2".
:::

## Worked Example

A credit model assigns a firm a 3% one-year default probability. A ratings downgrade arrives.
Historically, 40% of firms that defaulted were downgraded in the preceding year; 6% of firms that
survived were also downgraded.

Odds form:

- Prior odds: $0.03 / 0.97 = 0.0309$
- Likelihood ratio: $0.40 / 0.06 = 6.67$
- Posterior odds: $0.0309 \times 6.67 = 0.206$
- Posterior probability: $0.206 / 1.206 = \mathbf{17.1\%}$

The downgrade multiplied the default odds by nearly seven, but the absolute probability is still
only 17% — the base rate keeps it anchored. Pricing the bond as though default were near-certain
would be a large error, and so would ignoring the downgrade.

Now suppose a second, correlated signal arrives (a widening CDS spread, itself largely driven by the
same downgrade). Treating it as independent evidence with its own LR of 5 would give posterior odds
$1.03$, i.e. 51% — roughly triple the honest answer. **Correlated evidence must not be multiplied.**

## Why It Matters in Quant Finance

Bayes is the formal grammar of the research process:

- **Strategy evaluation.** A backtest is evidence, not a conclusion. The posterior probability that
  a strategy is real depends on how many strategies you tried — the multiple-testing problem is a
  Bayesian statement about the likelihood of the evidence under the null.
- **Parameter estimation.** Shrinkage estimators (James–Stein, Ledoit–Wolf covariance shrinkage,
  Black–Litterman) are all posterior means: a noisy sample estimate pulled towards a prior in
  proportion to its own imprecision.
- **Regime inference.** Hidden Markov models and Kalman filters are Bayes applied recursively;
  the filter *is* a running posterior over an unobserved state.
- **Market microstructure.** The PIN model and Glosten–Milgrom infer $\P(\text{informed} \mid
  \text{order flow})$ trade by trade — a market maker's quote is a posterior.

## Trading & Research Application

:::desk
**Black–Litterman is Bayes with a straight face.** Market-implied equilibrium returns are the prior;
your views are the likelihood; the blended vector is the posterior mean, with the weight on your
view set by the confidence you attach to it. It exists because raw mean–variance optimisation on
sample means produces absurd portfolios — the sample mean is a maximum-likelihood estimate with no
prior, and it overfits.

**Shrinkage.** A 60-day realised beta of 1.8 for a mid-cap should not be traded as 1.8. The
cross-sectional prior is ~1.0, and the posterior is roughly $w \cdot 1.8 + (1-w)\cdot 1.0$ with $w$
falling as the estimate's standard error rises. Every practitioner does this; Bayes tells you what
$w$ should be rather than leaving it to taste.

**The research meeting question.** "How many variants did you test?" is a question about the
likelihood term. A Sharpe of 2 from the first thing you tried and a Sharpe of 2 from the best of
500 are entirely different pieces of evidence.
:::

## Implementation Notes

```python
import numpy as np

def posterior_odds(prior_odds: float, likelihood_ratios) -> float:
    """Sequential Bayesian update. Work in logs: products of many small
    likelihood ratios underflow, and additive updates are easier to debug."""
    log_odds = np.log(prior_odds) + np.sum(np.log(likelihood_ratios))
    return float(np.exp(log_odds))

def to_probability(odds: float) -> float:
    return odds / (1.0 + odds)

# Correlated evidence: shrink each LR towards 1 before combining, or model
# the joint likelihood directly. Multiplying correlated LRs is the single
# most common way to build an overconfident signal.
```

## Common Mistakes

:::pitfall
- **Base-rate neglect.** The most-tested error in the entire quant interview canon. A 99% accurate
  test for a 1-in-1000 condition is right about 9% of the time when it fires.
- **Confusing $\P(E\mid H)$ with $\P(H\mid E)$** — the prosecutor's fallacy. A p-value is
  $\P(\text{data}\mid\text{null})$; it is *not* $\P(\text{null}\mid\text{data})$.
- **Multiplying correlated likelihood ratios**, producing false confidence from five versions of
  the same signal.
- **Forgetting the search.** Conditioning on the best of $N$ trials, not on a single pre-registered
  test, changes the likelihood by orders of magnitude.
- **Assigning zero prior**, making a hypothesis permanently unlearnable.
:::

## 30-Second Revision

- $\P(H\mid E) = \P(E\mid H)\P(H)/\P(E)$. Posterior $\propto$ likelihood $\times$ prior.
- **Odds form is faster**: posterior odds = prior odds × likelihood ratio. Log-odds add.
- Base rate dominates when the classes are very unbalanced — 99% accurate, 1-in-1000 base rate,
  $\approx$ 9% posterior.
- $\P(\text{data}\mid\text{null}) \ne \P(\text{null}\mid\text{data})$.
- Correlated evidence must not be multiplied as if independent.
- In finance: shrinkage, Black–Litterman, Kalman filters and deflated Sharpe are all Bayes.
