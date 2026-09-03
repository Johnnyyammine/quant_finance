---
id: effective-number-of-bets
title: Effective Number of Bets
subject: risk-management
summary: Diversification is not the number of assets you hold but the number of independent risks you actually bear — measured by the effective dimension of the covariance spectrum and by the entropy of a portfolio's risk contributions across uncorrelated directions.
difficulty: intermediate
interview_relevance: 5
tags: [risk, diversification, pca, eigenvalues, concentration, factor-models, portfolio-construction, crowding, stress-testing]
prerequisites: [pca-and-eigenportfolios, covariance-and-correlation]
related: [sharpe-ratio, kelly-criterion]
aliases: [ENB, effective number of independent bets, effective dimension, effective rank, participation ratio, diversification ratio, N_eff, absorption ratio, risk concentration]
updated: 2026-09-02
references:
  - title: "Meucci, *Managing Diversification*, Risk, 22(5) (2009)"
    url: ""
  - title: "Meucci, Santangelo & Deguest, *Risk Budgeting and Diversification Based on Optimised Uncorrelated Factors* (2015)"
    url: ""
  - title: "Choueifaty & Coignard, *Toward Maximum Diversification*, Journal of Portfolio Management (2008)"
    url: ""
  - title: "Kritzman, Page & Turkington, *Principal Components as a Measure of Systemic Risk*, Journal of Portfolio Management (2011)"
    url: ""
questions:
  - q: You hold 50 stocks, equally weighted. How many bets is that?
    difficulty: foundational
    tags: [diversification, intuition, classic]
    hint: What is the average pairwise correlation, and what does it do to the eigenvalues?
    a: |
      "Fifty" is the wrong answer and the interviewer knows it. The right move is to ask what the
      average pairwise correlation is, because that number — not the count — determines the answer.

      With $N$ equicorrelated names at correlation $\rho$, the covariance spectrum is
      $\lambda_1 = 1+(N-1)\rho$ once and $1-\rho$ with multiplicity $N-1$, giving

      $$N_{\text{eff}} = \frac{N^2}{\big[1+(N-1)\rho\big]^2 + (N-1)(1-\rho)^2}$$

      For $N = 50$: $\rho = 0.1 \Rightarrow 33.6$; $\rho = 0.3 \Rightarrow 9.2$;
      $\rho = 0.6 \Rightarrow 2.7$. A single-sector US equity book in a sell-off runs at
      $\rho \approx 0.6$ — so fifty names really is about three bets.

      **The line that finishes the answer:** as $N \to \infty$ with $\rho$ fixed,
      $N_{\text{eff}} \to 1/\rho^2$. Diversification has a ceiling set by correlation, and adding
      names cannot raise it. At $\rho = 0.5$ that ceiling is four, whether you hold fifty names or
      five hundred.
  - q: Prove that an equally weighted portfolio of equicorrelated assets has an effective number of bets of exactly one.
    difficulty: advanced
    tags: [derivation, enb, eigenvectors]
    hint: What is the first eigenvector of an equicorrelation matrix?
    a: |
      The first eigenvector of $\Sigma = (1-\rho)I + \rho\1\1^\top$ is $q_1 = \1/\sqrt N$, and every
      other eigenvector is orthogonal to $\1$.

      The equally weighted portfolio is $w = \1/N$, which is **parallel to $q_1$**. So the loadings
      on the principal portfolios, $\tilde v = Q^\top w$, are

      $$\tilde v_1 = q_1^\top w = \frac{1}{\sqrt N}\cdot N \cdot \frac 1N = \frac{1}{\sqrt N},
      \qquad \tilde v_i = 0 \ \text{ for } i \ge 2$$

      All risk contributions vanish except the first: $p_1 = 1$, $p_{i\ge2} = 0$. Hence

      $$\text{ENB} = \exp\!\big(-\textstyle\sum_i p_i \log p_i\big) = \exp(0) = 1$$

      **Exactly one bet, for any $N$ and any $\rho > 0$.** Equal weighting on an equicorrelated
      universe is a pure, undiluted bet on the market factor and nothing else.

      Note the contrast: $N_{\text{eff}}$, computed from the same $\Sigma$, is 9.2 at $\rho=0.3$.
      The *risk model* has nine directions available. The *portfolio* uses one of them. That gap is
      the entire point of distinguishing the two measures.
  - q: What is the difference between the effective dimension of the covariance matrix and the effective number of bets?
    difficulty: intermediate
    tags: [enb, definitions, risk-attribution]
    a: |
      They answer different questions and are computed from different inputs.

      | | $N_{\text{eff}}$ | ENB |
      |---|---|---|
      | Input | eigenvalues of $\Sigma$ only | eigenvalues **and** the weights $w$ |
      | Question | how many independent risk directions does this *market* have? | how many of them is this *portfolio* actually betting on? |
      | Shares used | $\lambda_i / \sum_j \lambda_j$ | $\tilde v_i^2\lambda_i / \sigma_p^2$, with $\tilde v = Q^\top w$ |
      | Aggregation | inverse sum of squares (Rényi-2) | exponential of Shannon entropy |
      | Depends on rotation? | no | **yes** |

      $N_{\text{eff}}$ is a property of the opportunity set — it tells you the most diversification
      that is *available*. ENB tells you how much of it you took. A book can sit in a market with
      $N_{\text{eff}} = 20$ and still have ENB $= 1.1$.

      Use $N_{\text{eff}}$ to monitor the regime (it moves when correlations move) and ENB to
      monitor the portfolio (it moves when the PM does something).
  - q: A PM's book has an ENB of 1.2 and a Sharpe ratio of 3.0. Do you make them diversify?
    difficulty: intermediate
    tags: [judgement, risk-limits, sharpe]
    a: |
      No — and a risk manager who says yes has misunderstood what the number is for.

      **ENB is a concentration measure, not a quality measure.** It says nothing about expected
      return. A pure market-neutral pairs trade has ENB near 1 and can be an outstanding position;
      an equally weighted index fund also has ENB near 1 and is a completely different animal. High
      ENB with no edge is diworsification.

      What ENB = 1.2 *does* tell you, and what you should actually say:

      1. **Your risk is one number.** Whatever that direction is, size it as a single position,
         not as a fifty-name book. Gross exposure massively overstates the diversification here.
      2. **The Sharpe estimate has one effective observation per period, not fifty.** With one
         independent bet the standard error on Sharpe is what a single-strategy standard error
         would be — a Sharpe of 3.0 from a short sample is far less certain than a 50-name book's.
      3. **Stress it as one position.** Scenario losses will not diversify away.
      4. **Ask what the bet is.** If the PM cannot name the direction, they are not intentionally
         taking it — and unintentional concentration is the actual finding.

      The right escalation is a *sizing* conversation, not a diversification mandate.
  - q: Your colleague computes ENB two different ways and gets 3.4 and 7.1 on the same portfolio. Who is wrong?
    difficulty: advanced
    tags: [rotation, minimum-torsion, identification]
    hint: How unique is the set of uncorrelated factors?
    a: |
      Possibly neither. **ENB is not invariant to the choice of uncorrelated basis**, and this is
      the metric's most serious practical weakness.

      Any rotation $\tilde Q = QU$ with $U$ orthogonal *within a degenerate eigenspace* produces an
      equally valid set of uncorrelated factors but different risk shares $p_i$ and hence a
      different entropy. More generally, there are infinitely many uncorrelated bases (PCA, Cholesky
      in any asset ordering, symmetric whitening) and each gives its own ENB. Cholesky is the worst
      offender: reorder the assets and the number changes.

      In real covariance matrices the bulk eigenvalues are *nearly* degenerate, so the problem is
      not exotic — small sampling differences rotate the basis and swing ENB materially.

      **The standard fix** is Meucci, Santangelo and Deguest's **minimum-torsion** basis: among all
      uncorrelated bases, pick the one closest to the original assets in a least-squares sense
      (built from the symmetric square root of the correlation matrix rather than from its
      eigenvectors). It is unique, it is stable under perturbation, and its factors retain the
      identity of the underlying names, so "bet 3" is interpretable rather than an arbitrary
      rotation.

      What to say: *"ENB is basis-dependent, so quote the basis. I use minimum-torsion for
      reporting because it is unique and stable; PCA if the question is specifically about
      variance-maximal directions. And I never compare ENB across two different conventions."*
  - q: Your risk system reports $N_{\text{eff}} = 12$ for a 50-name book estimated from one year of daily returns. Do you believe it?
    difficulty: advanced
    tags: [estimation, marchenko-pastur, noise, bias]
    a: |
      Treat it as biased, and know the direction.

      Write $N_{\text{eff}} = N / \big(1 + \mathrm{CV}^2\big)$, where $\mathrm{CV}^2 =
      \Var(\lambda)/\overline{\lambda}^2$ is the dispersion of the eigenvalues. For a correlation
      matrix $\overline\lambda = 1$ always, so

      $$N_{\text{eff}} = \frac{N}{1 + \Var(\lambda)}$$

      Sampling noise **spreads** the spectrum, which raises $\Var(\lambda)$ and therefore *lowers*
      $N_{\text{eff}}$. Concretely: for genuinely independent assets, Marchenko–Pastur gives
      $\Var(\lambda) = q = N/T$, so

      $$\E\big[N_{\text{eff}}^{\text{sample}}\big] \approx \frac{N}{1 + N/T}$$

      With $N = 50$ and $T = 252$, a perfectly diversified book would measure $N_{\text{eff}}
      \approx 50/1.198 \approx 42$, not 50. So the estimator is **pessimistic**, and most
      pessimistic exactly where the portfolio looks best.

      Two more things before you trust the 12:

      - **Denoise first.** Clip the eigenvalues inside the Marchenko–Pastur band to their mean, or
        shrink, then recompute. If 12 becomes 16, the raw number was mostly noise.
      - **Check stability.** Recompute on overlapping windows. A number that swings between 8 and
        20 month to month is not a risk limit, it is a random variable.

      A 50-name book at $N_{\text{eff}} = 12$ is plausible for a diversified multi-sector portfolio.
      It would be surprising for a single-sector one.
  - q: Why does diversification collapse precisely when you need it?
    difficulty: intermediate
    tags: [stress, correlation, crowding, tail-risk]
    a: |
      Because the mechanism that causes losses is the same one that destroys independence.

      1. **Correlations rise.** In a sell-off a single factor — deleveraging, liquidity demand,
         risk-off flow — dominates return variance. Idiosyncratic share shrinks and measured
         correlation rises towards 1.
      2. **$\lambda_1$ absorbs the spectrum.** Mechanically, $N_{\text{eff}} \to 1/\rho^2 \to 1$.
         The other directions do not disappear; they are simply swamped.
      3. **Liquidity synchronises the selling.** Forced sellers liquidate what they *can* sell, not
         what they want to sell, which correlates assets that have no economic relationship.
      4. **Crowding turns other people's books into your factor.** If many funds hold a similar
         portfolio, their deleveraging is a common shock that is entirely absent from your
         estimation window. The August 2007 quant quake is the canonical case: factor-neutral
         market-neutral books lost together because they *were* each other's risk factor.

      The consequence for risk management is concrete. Diversification benefit computed in calm
      markets is exactly the quantity that fails in stress, so **it must never be what sets the
      leverage limit.** Size to the stressed $N_{\text{eff}}$ — recompute the spectrum with
      correlations shocked towards 1 and see what leverage survives.
---

## Intuition

Holding fifty tickers is not the same as taking fifty bets. If AAPL, MSFT, NVDA and AVGO all load
on the same "US large-cap technology" driver, then owning all four is closer to owning one position
four times than to owning four independent things. The count of line items is an accounting fact;
the count of *independent risks* is an economic one, and only the second determines what happens to
your P&L.

The way to make this precise is to stop looking at assets and start looking at directions.
[[pca-and-eigenportfolios|Rotate the covariance matrix into its eigenbasis]] and you get a set of
uncorrelated principal portfolios whose variances are the eigenvalues. Now two questions become
answerable:

1. **How many directions does the market actually have?** If the eigenvalues are all equal, there
   are $N$ genuinely distinct risks. If one eigenvalue dwarfs the rest, there is effectively one.
   This is the *effective dimension*, $N_{\text{eff}}$.
2. **How many of them is this portfolio betting on?** A portfolio spreads its variance across those
   directions. If 95% of its risk sits in one direction, it has taken one bet regardless of how
   many names it holds. This is the *effective number of bets*, ENB.

Both are answered the same way: take the distribution of risk shares, and ask how *spread out* it
is. That is a question entropy was invented to answer.

:::insight
Both measures are the **exponential of an entropy** of the same kind of object — a set of
non-negative shares summing to one.

$$N_{\text{eff}} = \exp\big(H_2(p)\big) = \frac{1}{\sum_i p_i^2}, \qquad
\text{ENB} = \exp\big(H_1(p)\big) = \exp\Big({-}\sum_i p_i \log p_i\Big)$$

where $H_2$ is the Rényi entropy of order 2 and $H_1$ the Shannon entropy. Both equal $N$ when the
shares are uniform and 1 when a single share is 1 — they are *perplexities*, "the number of equally
likely alternatives this distribution is worth". The two genuine differences are which shares you
feed in (eigenvalue shares for $N_{\text{eff}}$, the portfolio's risk contributions for ENB) and
which entropy order you use. Since Rényi entropy decreases in its order, $\exp(H_1) \ge \exp(H_2)$
on the same shares: the entropy version is always the more generous count.
:::

## Mathematical Formulation

Start from the eigendecomposition $\Sigma = Q\Lambda Q^\top$ with $\lambda_1 \ge \cdots \ge
\lambda_N \ge 0$.

### The effective dimension of the covariance structure

:::formula {name="Effective dimension (participation ratio)" note="A property of the covariance matrix alone — no portfolio required." used-in="Risk Management, Regime Monitoring, Systemic Risk"}
N_{\text{eff}} = \frac{\big(\sum_i \lambda_i\big)^2}{\sum_i \lambda_i^2}
:::

Writing $s_i = \lambda_i / \sum_j \lambda_j$ for the variance-explained shares, this is exactly
$1/\sum_i s_i^2$ — the inverse Herfindahl index of the spectrum. It is bounded:
$1 \le N_{\text{eff}} \le N$, hitting $N$ when all eigenvalues are equal and 1 when a single
eigenvalue carries everything.

### The effective number of bets

Now bring in a portfolio $w$. Its loadings on the principal portfolios are $\tilde v = Q^\top w$,
and because the principal portfolios are uncorrelated, variance decomposes with no cross terms:

:::formula {name="Risk contribution of each independent direction" used-in="Risk Attribution, Diversification"}
\sigma_p^2 = \sum_{i=1}^{N} \tilde v_i^2\, \lambda_i,
\qquad
p_i = \frac{\tilde v_i^2\, \lambda_i}{\sigma_p^2}, \qquad p_i \ge 0, \ \ \sum_i p_i = 1
:::

The $p_i$ are a genuine probability distribution — non-negative and summing to one — which is what
licenses the entropy.

:::formula {name="Effective Number of Bets (Meucci, 2009)" note="Perplexity of the portfolio's risk distribution across uncorrelated factors. Equals N under uniform spreading and 1 under total concentration." used-in="Risk Management, Portfolio Construction, Risk Budgeting"}
\text{ENB} = \exp\Big({-}\sum_{i=1}^{N} p_i \log p_i\Big) \in [1, N]
:::

### Two relatives you should be able to name

:::formula {name="Diversification ratio (Choueifaty & Coignard, 2008)" note="Weighted-average volatility over portfolio volatility. Its square is another effective-N measure: it equals N for equally weighted uncorrelated assets." used-in="Portfolio Construction, Maximum Diversification"}
\text{DR} = \frac{\sum_i |w_i| \sigma_i}{\sqrt{w^\top \Sigma w}}
:::

:::formula {name="Absorption ratio (Kritzman, Page & Turkington, 2011)" note="Share of total variance carried by the top k principal portfolios. Spikes ahead of drawdowns." used-in="Systemic Risk, Regime Detection"}
\text{AR}_k = \frac{\sum_{i=1}^{k} \lambda_i}{\sum_{i=1}^{N} \lambda_i}
:::

The simplest and most-used of the family is the $k=1$ absorption ratio, $\lambda_1 /
\operatorname{tr}(\Sigma)$ — the share of all risk sitting in the single largest direction.

## Derivation

:::derivation Where the participation ratio comes from, and why it is the "right" count
Suppose the risk were spread evenly over exactly $m$ directions and zero elsewhere: $\lambda_i =
c$ for $i \le m$, zero after. Then

$$\frac{\big(\sum_i \lambda_i\big)^2}{\sum_i \lambda_i^2} = \frac{(mc)^2}{mc^2} = m$$

So the formula returns $m$ on the case where the answer is unambiguous. That is the defining
property we want: **a count that agrees with counting when counting is possible**, and interpolates
smoothly otherwise. Every effective-dimension measure is built to satisfy exactly this.

In terms of shares $s_i = \lambda_i/\sum\lambda_j$, $N_{\text{eff}} = 1/\sum_i s_i^2$, the inverse
Herfindahl. And in terms of the coefficient of variation of the eigenvalues,

$$N_{\text{eff}} = \frac{N\,\overline\lambda^2}{\overline{\lambda^2}}
= \frac{N}{1 + \mathrm{CV}^2(\lambda)}$$

which is the most useful form for reasoning about estimation error: **any mechanism that spreads
the eigenvalues, including pure sampling noise, reduces the measured effective dimension.**
:::

:::derivation The equicorrelation case, end to end
Unit variances, all pairwise correlations $\rho$. From [[pca-and-eigenportfolios]] the spectrum is
$\lambda_1 = 1+(N-1)\rho$ once and $1-\rho$ with multiplicity $N-1$. Then

$$\sum_i \lambda_i = N, \qquad
\sum_i \lambda_i^2 = \big[1+(N-1)\rho\big]^2 + (N-1)(1-\rho)^2$$

$$\boxed{\ N_{\text{eff}} = \frac{N^2}{\big[1+(N-1)\rho\big]^2 + (N-1)(1-\rho)^2}\ }$$

Now take $N \to \infty$ with $\rho > 0$ fixed. The leading terms are $\big[(N-1)\rho\big]^2 \approx
N^2\rho^2$ in the first piece and $N(1-\rho)^2$ in the second, so

$$N_{\text{eff}} \approx \frac{N^2}{N^2\rho^2 + N(1-\rho)^2} \ \longrightarrow\ \frac{1}{\rho^2}$$

**The ceiling on diversification is $1/\rho^2$, and no amount of breadth raises it.** At
$\rho = 0.2$ that is 25 bets; at $\rho = 0.5$ it is 4; at $\rho = 0.7$ it is 2. This single result
is why "we hold 400 names" is not an answer to a risk question.
:::

:::derivation Why the equally weighted portfolio has ENB = 1
The first eigenvector of the equicorrelation matrix is $q_1 = \1/\sqrt N$, and every other
eigenvector is orthogonal to $\1$. The equally weighted portfolio $w = \1/N$ is therefore parallel
to $q_1$, so

$$\tilde v_1 = q_1^\top w = \frac 1{\sqrt N}, \qquad \tilde v_i = q_i^\top w = 0 \quad (i \ge 2)$$

Every risk contribution but the first is zero, so $p_1 = 1$ and

$$\text{ENB} = \exp(-1\cdot\log 1) = 1$$

Exactly one bet, for every $N$ and every $\rho > 0$, while $N_{\text{eff}}$ for the same matrix can
be 9 or 30. The market offers dimensions; the portfolio declines to use them.

In a real universe with unequal volatilities and correlations, $w = \1/N$ is not exactly parallel to
$q_1$ and ENB comes out a little above 1 — but "a little above 1" is still the answer, and it is
nowhere near $N$.
:::

## Assumptions & Edge Cases

:::assumption
- **Second moments only.** Both measures are functions of $\Sigma$. Two portfolios with identical
  covariance and wildly different tail behaviour score the same.
- **A fixed covariance matrix.** $\Sigma$ is treated as known and constant. It is neither. Every
  number here is conditional on a regime.
- **ENB depends on the choice of uncorrelated basis.** PCA, Cholesky (in some asset order) and
  minimum-torsion all give different answers. $N_{\text{eff}}$ does not have this problem — it uses
  only the eigenvalues, which are rotation-invariant.
- **Near-degenerate eigenvalues make the PCA basis unstable,** so PCA-based ENB inherits that
  instability. This is the argument for minimum-torsion in production reporting.
- **Covariance or correlation?** Computing $N_{\text{eff}}$ from $\Sigma$ lets high-volatility
  names dominate; from the correlation matrix it measures co-movement structure only. Both are
  defensible; state which you used, and never compare across the two.
- **Estimation noise biases $N_{\text{eff}}$ downwards,** roughly $N \mapsto N/(1+N/T)$ for an
  uncorrelated truth. Denoise before you set a limit on it.
:::

:::warning
**ENB is a concentration measure, not a quality measure.** Nothing in it references expected return.
Maximising ENB will hand you the portfolio that spreads risk most evenly across statistical
directions, which is generally *not* the portfolio with the best Sharpe ratio — it systematically
overweights low-variance directions, which are also the worst-estimated ones. Use ENB as a
diagnostic and a constraint, never as an objective on its own.
:::

## Worked Example

Fifty equicorrelated names, unit volatility, equally weighted. Everything below follows from the
closed forms above.

| $\rho$ | $\lambda_1$ | $\lambda_1$ share | $N_{\text{eff}}$ | $\text{DR}^2$ | ENB |
|---|---|---|---|---|---|
| 0.0 | 1.0 | 2.0% | 50.0 | 50.0 | n/a* |
| 0.1 | 5.9 | 11.8% | 33.6 | 8.5 | 1.0 |
| 0.2 | 10.8 | 21.6% | 16.9 | 4.6 | 1.0 |
| 0.3 | 15.7 | 31.4% | 9.2 | 3.2 | 1.0 |
| 0.4 | 20.6 | 41.2% | 5.7 | 2.4 | 1.0 |
| 0.5 | 25.5 | 51.0% | 3.8 | 2.0 | 1.0 |
| 0.6 | 30.4 | 60.8% | 2.7 | 1.6 | 1.0 |
| 0.8 | 40.2 | 80.4% | 1.5 | 1.2 | 1.0 |

Read the row at $\rho = 0.6$: fifty positions, and the covariance structure supports only 2.7
independent directions. **That is where "50 stocks, 3 bets" comes from** — it is not rhetoric, it is
the participation ratio at an ordinary crisis correlation.

Three things in this table are worth more than the rest:

- $\text{DR}^2 = N/\big[1+(N-1)\rho\big] = 1/\text{(the } \lambda_1 \text{ share)}$ here, because
  the equally weighted portfolio *is* the first eigenportfolio. It answers "how much variance did
  combining these names save me", which is a different question again.
- **The ENB column is 1.0 for every $\rho > 0$,** no matter how many names are held: the
  equally weighted portfolio *is* the first eigenportfolio, so all of its risk sits in one
  direction. \*The $\rho = 0$ row is marked n/a deliberately — with $\Sigma = I$ every eigenvalue
  is identical, the eigenbasis is completely arbitrary, and ENB can be made anything from 1 to 50 by
  choosing a rotation. That is not a defect of the table; it is the basis-dependence problem in its
  purest form, and the reason production systems report a minimum-torsion ENB rather than a PCA one.
- The three columns disagree by an order of magnitude at $\rho = 0.3$: 9.2 versus 3.2 versus 1.0.
  They are not competing estimates of one quantity. They answer three different questions, and
  quoting one without saying which is how risk reports mislead.

:::module diversification-lab
{ "sectors": 5, "perSector": 10, "rhoMarket": 0.25, "rhoSector": 0.2, "portfolio": "equal" }
:::

Things worth doing in the module above:

- Push **market correlation** from 0.25 to 0.7 and watch $N_{\text{eff}}$ collapse while the number
  of holdings never changes. That is panel 04 of the story: stress does not change your positions,
  it changes what they mean.
- Switch **portfolio** from equal-weight to market-neutral. The fifty holdings are identical; ENB
  goes from about 1.1 to about 28, because the weights are now orthogonal to the dominant
  eigenvector and the risk has nowhere to concentrate.
- Note that the module gives each name its own volatility rather than the unit variances the table
  assumes, so equal weight scores ENB $\approx 1.07$ rather than exactly 1. That is the realistic
  version of the same result.
- Set **sectors** to 5 with a high extra within-sector correlation and look at the second tier of
  eigenvalues — one market direction, four sector directions, then the idiosyncratic bulk.

## Why It Matters in Quant Finance

- **Position limits are the wrong control.** A limit of "no more than 3% per name" allows a
  portfolio with ENB of 1. Constraints must be written on factor exposure or on risk contributions,
  not on holdings.
- **Capital allocation across PMs.** A multi-strategy fund allocating to twelve teams whose books
  all load on the same carry factor has funded one bet twelve times. The ENB of the *combined*
  book, computed across PM return streams, is the number the CIO actually needs.
- **Leverage.** Kelly-style sizing (see [[kelly-criterion]]) scales with the number of independent
  bets. Levering a book as though it holds $N$ independent positions when it holds one is the
  standard route to a terminal drawdown.
- **Sharpe ratio standard errors.** The uncertainty in a measured [[sharpe-ratio]] depends on the
  number of *independent* observations. A book with ENB near 1 has far fewer effective independent
  bets per period than its holding count suggests, so its track record means proportionally less.
- **Systemic risk monitoring.** The absorption ratio — the market-wide version of this
  calculation — rises before drawdowns. It is a regime indicator computed from prices alone, with
  no portfolio and no model of returns.
- **Risk parity and its failure mode.** Equalising *volatility* contributions is not equalising
  *independent* risk contributions. Classic risk parity can hold assets in equal vol terms and still
  have most of its ENB in a single duration bet, which is exactly what 2022 exposed.

## Trading & Research Application

:::desk
**Report the pair, never one alone.** $N_{\text{eff}}$ tells you what the regime offers; ENB tells
you what the PM took. $N_{\text{eff}} = 25$ with ENB $= 1.3$ is a portfolio construction problem.
$N_{\text{eff}} = 2$ with ENB $= 1.9$ is a *market* problem, and no rebalancing will fix it — only
lower gross will.

**Track $\lambda_1/\operatorname{tr}(\Sigma)$ daily.** It is the cheapest early warning available:
one eigenvalue, no portfolio, no return model. When the top-eigenvalue share is trending up, every
diversification assumption in the book is degrading in the background, and the trade is to cut
leverage before the correlation shows up in realised P&L rather than after.

**Compute the stressed version, and size to that.** Recompute $N_{\text{eff}}$ and ENB with
correlations shocked towards 1 (a simple, defensible shock: $\rho \mapsto \rho + (1-\rho)\kappa$
for $\kappa \approx 0.5$). The gap between the calm and stressed numbers is the diversification
you are borrowing against and will not have when you need it.

**Look outside your own book.** Crowding means other funds' positioning is a risk factor that does
not appear in your covariance matrix at all, because it has not moved yet. Proxy it with days-to-
liquidate, short interest, and the correlation of your P&L to peer-fund indices. The 2007 quant
quake was a factor that no risk model contained on the Friday and every risk model contained by
the following Wednesday.

**Do not maximise it.** Maximum-diversification and maximum-ENB portfolios load on the smallest,
worst-estimated eigenvalues. Use ENB as a floor in a constraint set — "ENB $\ge 3$ at the target
risk level" — alongside an objective that references expected return.
:::

## Implementation Notes

```python
import numpy as np

def effective_dimension(cov: np.ndarray) -> float:
    """N_eff: how many independent risk directions the market offers.
    Property of the covariance matrix alone -- no portfolio involved.
    Equivalently 1 / sum(share_i^2), the inverse Herfindahl of the spectrum."""
    lam = np.linalg.eigvalsh((cov + cov.T) / 2)
    lam = np.clip(lam, 0.0, None)
    return float(lam.sum() ** 2 / (lam ** 2).sum())

def effective_number_of_bets(weights: np.ndarray, cov: np.ndarray) -> float:
    """ENB: how many of those directions the portfolio actually bets on.

    Basis-dependent by construction -- this uses the PCA (eigenvector) basis.
    For production reporting prefer a minimum-torsion basis, which is unique
    and stable when eigenvalues are close together."""
    lam, vecs = np.linalg.eigh((cov + cov.T) / 2)
    lam = np.clip(lam, 0.0, None)
    loadings = vecs.T @ weights                      # v~ = Q^T w
    contrib = (loadings ** 2) * lam                  # variance per direction
    total = contrib.sum()
    if total <= 0:
        return 1.0
    p = contrib / total
    p = p[p > 1e-12]                                 # 0 log 0 := 0
    return float(np.exp(-(p * np.log(p)).sum()))

def absorption_ratio(cov: np.ndarray, k: int = 1) -> float:
    """Share of total variance in the top k directions. k=1 is the single most
    useful live risk indicator: it needs no portfolio and no return model."""
    lam = np.sort(np.linalg.eigvalsh((cov + cov.T) / 2))[::-1]
    return float(lam[:k].sum() / lam.sum())

def stress(cov: np.ndarray, kappa: float = 0.5) -> np.ndarray:
    """Push every correlation a fraction kappa of the way to 1, holding
    volatilities fixed. Size to the metrics computed on THIS matrix, not on
    the calm one."""
    sd = np.sqrt(np.diag(cov))
    corr = cov / np.outer(sd, sd)
    stressed = corr + (1.0 - corr) * kappa
    np.fill_diagonal(stressed, 1.0)
    return stressed * np.outer(sd, sd)
```

## Common Mistakes

:::pitfall
- **Counting holdings.** The headline error. Fifty names at $\rho = 0.6$ is under three bets.
- **Quoting ENB without the basis.** PCA, Cholesky and minimum-torsion give different numbers on
  the same portfolio. A number without its convention is not comparable to anything.
- **Confusing $N_{\text{eff}}$ with ENB.** One is a property of the market, the other of the
  portfolio. They routinely differ by 10×, and the difference is the finding.
- **Maximising ENB.** It loads on the smallest, noisiest eigenvalues and ignores expected return
  entirely. Constrain it; do not optimise it.
- **Using a calm-market $\Sigma$ to justify leverage.** The diversification you are levering
  against is precisely the quantity that disappears in the drawdown.
- **Trusting a raw sample estimate.** Noise spreads the spectrum and biases $N_{\text{eff}}$ down,
  by roughly a factor $1/(1+N/T)$. Clip or shrink first.
- **Assuming risk parity implies many bets.** Equal *volatility* contributions are not equal
  *independent* risk contributions; a classic risk-parity book can have most of its ENB in one
  duration factor.
- **Ignoring crowding.** Your covariance matrix contains no information about who else holds your
  book, and in a liquidation that is the only factor that matters.
:::

## 30-Second Revision

- Diversification is the number of independent risks borne, not the number of assets held.
- $N_{\text{eff}} = (\sum\lambda_i)^2/\sum\lambda_i^2$ — a property of $\Sigma$ alone, the inverse
  Herfindahl of the eigenvalue shares, in $[1, N]$.
- $\text{ENB} = \exp(-\sum p_i\log p_i)$ with $p_i = \tilde v_i^2\lambda_i/\sigma_p^2$ and
  $\tilde v = Q^\top w$ — depends on the portfolio **and** on the chosen uncorrelated basis.
- Equicorrelation: $N_{\text{eff}} \to 1/\rho^2$. At $\rho = 0.6$, fifty names is 2.7 bets.
- Equally weighted on an equicorrelated universe: ENB $= 1$ exactly, because $w \parallel q_1$.
- Both are exponentials of an entropy — Rényi-2 for $N_{\text{eff}}$, Shannon for ENB.
- Sampling noise biases $N_{\text{eff}}$ down by about $1/(1+N/T)$; denoise before setting limits.
- Monitor $\lambda_1/\operatorname{tr}(\Sigma)$, the effective rank, factor risk contributions and
  crowding. ENB is a constraint, never an objective.
