---
id: conditional-probability
title: Conditional Probability
subject: probability
summary: The probability of an event once you restrict attention to the states of the world where another event has occurred — the formal machinery for "given what I now know".
difficulty: foundational
interview_relevance: 5
status: learning
tags: [probability, conditioning, information, bayes]
prerequisites: []
related: [bayes-theorem, expectation]
aliases: [conditioning, P(A|B)]
minutes: 11
updated: 2026-01-14
questions:
  - q: A family has two children. At least one is a boy. What is the probability both are boys?
    difficulty: intermediate
    tags: [brainteaser, conditioning]
    hint: Write out the sample space explicitly before doing any arithmetic.
    a: |
      Sample space $\{BB, BG, GB, GG\}$, each with probability $1/4$. Conditioning on
      "at least one boy" removes $GG$, leaving three equally likely outcomes of which one is $BB$:

      $$\P(BB \mid \text{at least one } B) = \frac{1/4}{3/4} = \frac{1}{3}$$

      **The follow-up that separates candidates:** if instead you *meet one of the children and he
      is a boy*, the answer is $1/2$. The two questions condition on different events. The first
      conditions on a property of the family; the second on a property of a randomly selected child,
      which double-weights $BB$ (either child could have been the one you met).

      The lesson generalises: the answer depends on the *sampling mechanism that generated the
      information*, not just on the information's content. This is the same reasoning error behind
      survivorship bias in backtests.
  - q: Three prisoners; one will be pardoned. A asks the guard to name a prisoner other than himself who will be executed. The guard says B. Has A's survival probability improved?
    difficulty: advanced
    tags: [brainteaser, monty-hall]
    hint: Condition on the guard's *protocol*, not just on the statement.
    a: |
      No — A stays at $1/3$; **C rises to $2/3$**. This is Monty Hall in disguise.

      Let the guard name B. If A is pardoned ($p=1/3$) the guard picks B or C at random, so
      $\P(\text{says B} \mid A) = 1/2$. If C is pardoned ($p=1/3$) the guard *must* say B, so
      $\P(\text{says B}\mid C)=1$. If B is pardoned the guard cannot say B.

      $$\P(A \mid \text{says B}) = \frac{\tfrac13 \cdot \tfrac12}{\tfrac13\cdot\tfrac12 + \tfrac13 \cdot 1} = \frac{1/6}{1/2} = \frac13$$

      The information is asymmetric because the guard's *protocol* constrains what he can say.
      Change the protocol (a guard who names a random non-pardoned prisoner including possibly A)
      and the answer changes.
  - q: P(A) = 0.6, P(B) = 0.5, P(A ∪ B) = 0.8. Are A and B independent?
    difficulty: foundational
    tags: [independence]
    a: |
      $\P(A\cap B) = 0.6 + 0.5 - 0.8 = 0.3$. Independence requires
      $\P(A)\P(B) = 0.30$. They match, so **yes, independent**.

      Then $\P(A\mid B) = 0.3/0.5 = 0.6 = \P(A)$ — conditioning tells you nothing, which is what
      independence *means*.
  - q: In a market-making context, why is P(informed trader | my quote was hit) larger than P(informed trader)?
    difficulty: advanced
    tags: [microstructure, adverse-selection]
    a: |
      Because informed traders hit quotes selectively — precisely when the quote is stale relative
      to their information. The event "my quote was hit" is *positively correlated* with the event
      "someone knows something I don't".

      $$\P(I \mid \text{hit}) = \frac{\P(\text{hit}\mid I)\,\P(I)}{\P(\text{hit})} > \P(I)
      \quad\text{because}\quad \P(\text{hit}\mid I) > \P(\text{hit}\mid \neg I)$$

      This is **adverse selection**, and it is the whole reason bid–ask spreads exist. The spread
      is compensation for the fact that your realised counterparty mix is worse than the population
      mix. Any market maker who prices off unconditional probabilities is systematically picked off.
---

## Intuition

Conditioning is *shrinking the sample space*. Before you know anything, the universe of possible
outcomes is $\Omega$. Learning that $B$ occurred throws away every outcome outside $B$ and
renormalises what remains so the probabilities still sum to one.

That renormalisation — dividing by $\P(B)$ — is where all the counter-intuitive results come from.
The numerator only counts outcomes in both $A$ and $B$; the denominator has shrunk. Whether
$\P(A\mid B)$ is larger or smaller than $\P(A)$ depends entirely on whether $B$ eliminated
relatively more non-$A$ outcomes than $A$ outcomes.

:::insight
The hardest part of a conditioning problem is almost never the arithmetic. It is stating precisely
*what event you are conditioning on* — and in particular, what process generated the information.
"A boy exists in this family" and "the child I met is a boy" are different events with different
answers.
:::

## Mathematical Formulation

:::formula {name="Conditional probability" used-in="Probability, Risk, Microstructure"}
\P(A \mid B) = \frac{\P(A \cap B)}{\P(B)}, \qquad \P(B) > 0
:::

Rearranged, this is the **multiplication rule**, which is usually the more useful direction:

:::formula {name="Chain rule" used-in="Probability, Time Series, Machine Learning"}
\P(A_1 \cap \cdots \cap A_n) = \P(A_1)\,\P(A_2\mid A_1)\,\P(A_3 \mid A_1\cap A_2)\cdots \P(A_n \mid A_1 \cap \cdots \cap A_{n-1})
:::

**Independence** is the special case where conditioning changes nothing:

$$A \perp B \iff \P(A\mid B) = \P(A) \iff \P(A\cap B) = \P(A)\P(B)$$

And the decomposition that makes conditioning a computational tool:

:::formula {name="Law of total probability" used-in="Risk, Scenario Analysis, Credit"}
\P(A) = \sum_{i} \P(A \mid B_i)\, \P(B_i) \quad \text{for a partition } \{B_i\}
:::

Its expectation analogue, the **tower property**, is the single most-used identity in stochastic
finance:

:::formula {name="Tower property (law of iterated expectations)" used-in="Derivatives, Martingales, Alpha Research"}
\E\big[\,\E[X \mid \mathcal{G}]\,\big] = \E[X]
:::

## Derivation

:::derivation Why the definition must divide by P(B)
Conditional probability should be a genuine probability measure on the restricted space: it must be
non-negative, and $\P(\Omega \mid B)$ must equal 1.

Define an unnormalised measure $\mu(A) = \P(A\cap B)$. It is non-negative and additive, but
$\mu(\Omega) = \P(B) \ne 1$. Dividing through by $\P(B)$ is the unique rescaling that restores
total mass one while preserving relative likelihoods within $B$. Any other normalisation would
either break additivity or distort ratios of outcomes inside $B$ — neither of which we want, since
learning $B$ occurred should tell us nothing new about the *relative* odds of outcomes within $B$.
:::

:::derivation Tower property in one line
Partition on the conditioning variable $Y$:

$$\E\big[\E[X\mid Y]\big] = \sum_y \E[X \mid Y=y]\,\P(Y=y)
= \sum_y \sum_x x\,\P(X=x\mid Y=y)\P(Y=y) = \sum_x x \,\P(X=x) = \E[X]$$

Interpretation: *your best forecast today of your best forecast tomorrow is your best forecast
today.* If it were not, you would already have updated. This is exactly the [[martingales|martingale]]
property, and it is why a price that is a conditional expectation cannot be predictably improved on.
:::

## Assumptions & Edge Cases

:::assumption
- $\P(B) > 0$ is required. Conditioning on probability-zero events (a continuous variable taking an
  exact value) needs the measure-theoretic construction $\E[X\mid\mathcal{G}]$, and naive limits give
  the Borel–Kolmogorov paradox: different limiting procedures give different answers.
- Independence is **not** transitive, and pairwise independence does not imply mutual independence.
- Conditional independence given $C$ neither implies nor is implied by unconditional independence.
  Two stocks can be independent given the market factor while being strongly correlated
  unconditionally — the entire premise of a [[linear-regression|factor model]].
:::

## Worked Example

A signal flags 8% of stock-days as "buy". Over the sample, 12% of all stock-days are followed by a
>2% move up. Among flagged days, 21% are followed by such a move.

$$\P(\text{up} \mid \text{flag}) = 0.21, \qquad \P(\text{up}) = 0.12$$

The **lift** is $0.21/0.12 = 1.75\times$. Now check the other direction with the multiplication rule:

$$\P(\text{flag}\mid \text{up}) = \frac{\P(\text{up}\mid\text{flag})\P(\text{flag})}{\P(\text{up})}
= \frac{0.21 \times 0.08}{0.12} = 0.14$$

So the signal catches only 14% of the big up-moves. **Precision 21%, recall 14%.** Both numbers
matter and they answer different questions: precision determines whether a trade is worth taking,
recall determines whether the strategy has enough capacity to matter. A signal with 90% precision
and 0.1% recall is a fine trade and a useless business.

## Why It Matters in Quant Finance

Nearly every quantity a quant estimates is a conditional expectation in disguise:

| Object | What it really is |
|---|---|
| Alpha forecast | $\E[r_{t+1} \mid \mathcal{F}_t]$ |
| Beta / factor loading | $\E[r_i \mid r_f]$, linear approximation |
| Option price | $\E^{\Q}[\,\text{payoff} \mid \mathcal{F}_t\,]$ discounted |
| Conditional VaR | quantile of $r \mid$ regime |
| Default probability | $\P(\text{default} \mid \text{covariates}, \text{horizon})$ |

The information set $\mathcal{F}_t$ in each row is the thing that must be defined honestly. A
backtest that uses restated fundamentals is computing $\E[r_{t+1}\mid\mathcal{F}_T]$ with $T > t$ —
a conditional expectation on information that did not exist. Look-ahead bias is not sloppiness about
data; it is conditioning on the wrong sigma-algebra.

## Trading & Research Application

:::desk
**Adverse selection is a conditioning statement.** As a market maker your unconditional view might
be that 5% of flow is informed. But conditional on *your quote being lifted*, that share is much
higher — informed traders trade exactly when your quote is wrong. The spread you quote must price
$\P(\text{informed}\mid\text{filled})$, not $\P(\text{informed})$.

**Regime conditioning.** A strategy's Sharpe estimated over 2012–2019 is
$\E[\text{Sharpe}\mid\text{low-vol regime, falling rates}]$. Presenting it as unconditional is the
most common failure in a research meeting. The honest version quotes the number and the
conditioning set together.

**Signal decay.** $\P(\text{profitable}\mid\text{signal fired } h \text{ hours ago})$ falls with $h$.
Measuring that curve tells you the urgency of execution, which is the input to the
[[linear-regression|impact-vs-alpha]] trade-off.
:::

## Common Mistakes

:::pitfall
- **Confusing $\P(A\mid B)$ with $\P(B\mid A)$** — the prosecutor's fallacy. $\P(\text{evidence}\mid
  \text{guilty})$ is not $\P(\text{guilty}\mid\text{evidence})$; the ratio between them is the base
  rate, and it is usually the dominant term. See [[bayes-theorem]].
- **Ignoring the information-generating process.** Two-children, Monty Hall and the prisoners
  problem all hinge on *how* you learned the fact, not the fact itself.
- **Treating conditional independence as unconditional.** Assets independent given the market factor
  are still correlated in the raw data.
- **Conditioning on the future.** Survivorship bias, restated data and in-sample feature selection
  are all instances of conditioning on information not available at decision time.
- **Forgetting $\P(B)>0$.** Continuous conditioning needs the measure-theoretic definition.
:::

## 30-Second Revision

- $\P(A\mid B) = \P(A\cap B)/\P(B)$ — shrink the sample space, renormalise.
- Independence $\iff \P(A\cap B)=\P(A)\P(B) \iff$ conditioning changes nothing.
- Total probability: $\P(A)=\sum_i \P(A\mid B_i)\P(B_i)$; tower: $\E[\E[X\mid\mathcal G]] = \E[X]$.
- $\P(A\mid B) \ne \P(B\mid A)$; the bridge between them is the base rate ([[bayes-theorem]]).
- The hard part is naming the conditioning event, including how the information arrived.
- Every alpha, beta, price and risk number is a conditional expectation — state the information set.
