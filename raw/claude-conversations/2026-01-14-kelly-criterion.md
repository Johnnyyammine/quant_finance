# Kelly Criterion — why maximise log wealth?
Date: 2026-01-14
Became: content/concepts/kelly-criterion.md
Status: distilled

---

**Me:** Everyone says to maximise expected log wealth rather than expected wealth. Why? Maximising
expected wealth seems like the obviously correct objective.

**Claude:** Because wealth compounds multiplicatively, and expectation does not commute with
products the way it does with sums.

Consider a bet that doubles your money with probability 0.5 and loses 60% with probability 0.5, and
suppose you bet your whole stack each time. Expected wealth per round is
0.5(2.0) + 0.5(0.4) = 1.2 — a 20% expected gain, so maximising expected wealth says bet everything,
every time.

But the *typical* path is 2.0 × 0.4 = 0.8 per pair of rounds, a 20% loss. Over many rounds you go
broke almost surely while the expectation grows without bound, carried by an ever-shrinking set of
paths where you win every time.

**Me:** So expected wealth is dominated by paths that essentially never happen.

**Claude:** Exactly. The distribution of terminal wealth is extremely right-skewed. The mean sits
far above the median, and you live on the median.

Log wealth fixes this because log turns products into sums, and the law of large numbers applies to
sums:

  (1/n) Σ log(R_i) → E[log R]

So the growth rate you actually realise almost surely is exp(E[log R]), not E[R].

**Me:** And the optimal fraction?

**Claude:** For a bet paying b-to-1 with win probability p, maximise E[log(1 + fb - (1-f))] over f.
Differentiating and setting to zero gives f* = (pb - q)/b where q = 1-p, which is often written as
"edge over odds".

For continuous returns with drift μ and volatility σ, the analogue is f* = μ/σ², and the resulting
growth rate is μ²/(2σ²) — which is Sharpe²/2. That connection surprises people.

**Me:** Why does everyone say to bet less than Kelly then?

**Claude:** Several reasons, and they compound:

1. Kelly assumes you know p (or μ and σ). You don't — you estimated them, and an overestimate of
   edge causes you to overbet, which is much worse than underbetting because the growth-rate curve
   is asymmetric around f*.
2. Full Kelly produces brutal drawdowns. The probability of at some point halving your capital under
   full Kelly is around 50%. No allocator or human tolerates that.
3. The growth rate is flat near the optimum: half-Kelly gives you 75% of the growth for half the
   volatility. That trade is obviously worth taking.

**Me:** What does the curve look like exactly?

**Claude:** Growth as a function of the Kelly fraction k (where you bet k·f*) is proportional to
k(2 - k) times the full-Kelly growth rate. So k = 0.5 gives 0.5(1.5) = 0.75, k = 1 gives 1, and
k = 2 gives 0 — betting double Kelly has zero growth rate, and anything beyond it is negative
despite having positive expected value at every single bet.

**Me:** That last point is the one I want to remember.

---

## Notes for the page
- Lead with the "positive expectation, certain ruin" example — it's the whole idea in four numbers.
- Key formulas: f* = (pb-q)/b, f* = μ/σ², growth = μ²/2σ² = SR²/2, growth(k) ∝ k(2-k).
- Link to: expectation (Jensen), variance (volatility drag), sharpe-ratio (SR²/2 connection).
- Interview questions: the coin-flip example; why fractional Kelly; what happens at 2× Kelly;
  Kelly with estimation error.
- Common mistakes: maximising E[W] not E[log W]; treating estimated edge as known; ignoring
  the correlation between simultaneous bets.
