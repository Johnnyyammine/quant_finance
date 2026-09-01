# Roadmap

The foundation is built. What follows is ordered by *value per unit of work*, not by ambition.

Nothing here requires re-architecting: every item is either content, a new file in an existing
extension point, or a contained change to one module. That was the point of the first milestone.

---

## Now — the only thing that matters

### Content

The system is proven; the corpus is not. Nine concepts exist to demonstrate that navigation, search,
the graph, prerequisites, interview mode, progress and modules work end to end. Twenty subjects are
empty.

**No feature on this page is worth more than the next fifty concepts.** Suggested order, chosen so
each new page has somewhere to attach in the graph:

1. **Finish Probability** — random variables, distributions, LLN, CLT, conditional expectation,
   moment generating functions. This is the base of every prerequisite chain.
2. **Finish Statistics** — estimators, bias–variance, hypothesis testing, confidence intervals,
   maximum likelihood, multiple testing. The last one earns its place immediately.
3. **Linear Algebra** — eigendecomposition, SVD, PCA, positive definiteness, matrix calculus.
   PCA and PSD are already referenced from Covariance & Correlation and currently dangle.
4. **Stochastic Processes** — Itô's lemma, Markov chains, Ornstein–Uhlenbeck, Girsanov, the
   Feynman–Kac link. Brownian Motion and Martingales already point at these.
5. **Derivatives & Options** — no-arbitrage, replication, Black–Scholes, the Greeks, implied
   volatility, the smile, put–call parity.
6. **Time Series** — stationarity, ARMA, GARCH, cointegration, unit roots.
7. **Portfolio Construction & Risk** — mean–variance, Kelly, risk parity, VaR, expected shortfall,
   drawdown, Black–Litterman.
8. **Market Microstructure & Execution** — order books, adverse selection, price impact,
   implementation shortfall, Almgren–Chriss.
9. **Mental Math & Brainteasers** — the highest interview-ROI subject and the cheapest to write,
   since each entry is mostly `questions:`.

Use `npm run check` to see what is thin, orphaned, or missing questions.

### Small fixes that pay for themselves immediately

- **Incremental build** — hash each concept file and skip unchanged ones. At 1,000 concepts a full
  rebuild is ~10 s, which makes `npm run watch` unpleasant.
- **`npm run check --fix-links`** — list every dangling `[[link]]` with the `npm run new` command
  that would create it.

---

## Next — features that compound with the content

### Spaced repetition

The largest single win for interview preparation, and the store is already shaped for it:
`state.drills[questionId] = { seen, right, wrong, last }` is recorded today but only displayed.

Add an SM-2-style scheduler over that data, a `due` queue in interview mode, and a "review N due"
entry point on the dashboard. No content changes, no schema changes — one new module plus a queue
view. The reason this is *next* rather than *now* is that spaced repetition over 43 questions is not
worth much; over 500 it is transformative.

### Personal notes and annotations

`state.notes` exists in the store and is unused. Add a per-concept notes panel and per-section
margin notes, saved locally, exportable with `KB.exportState()`. Notes should never be written back
into `content/` — the separation between authored content and personal state is load-bearing.

### Learning paths

`KB.learningPath(id)` already returns a topologically ordered prerequisite chain. Surface it: "what
do I need to learn before Black–Scholes?" as an ordered checklist with progress, on the concept page
and as a standalone view. This is derived data that already exists and is currently invisible.

### Weak-concept detection

The pieces are there — drill history, status, interview relevance. Combine into an explicit "your
gaps" view: concepts you have marked learned but keep failing questions on, high-relevance concepts
you have never opened, prerequisites of things you are studying that you skipped.

### More interactive modules

Highest value per hour, each one file in `assets/js/modules/`:

| Module | Attaches to |
|---|---|
| `option-payoff` | payoff and P&L diagrams with adjustable strikes |
| `black-scholes-greeks` | Greeks against spot, time and volatility |
| `efficient-frontier` | two/three-asset frontier as correlation moves |
| `kelly-sizing` | wealth paths at fractions of Kelly, showing the drawdown cost |
| `pca-explorer` | eigenvalue spectrum of a correlation matrix, Marchenko–Pastur cut |
| `orderbook-sim` | queue position, adverse selection, spread capture |
| `var-backtest` | VaR breaches versus expectation, Kupiec test |
| `drawdown-explorer` | drawdown distribution for a given Sharpe and horizon |

### Print / PDF export

`@media print` rules exist. Finish them: a "print this subject" view that concatenates its concepts
with derivations and answers expanded, for offline revision.

---

## Later — worth doing, not urgent

**Quiz mode.** Timed multiple-choice generated from the question bank, with a score history. Distinct
from the drill: drilling is for recall, quizzing is for calibration under time pressure.

**Formula sheet generator.** A single printable page of every `:::formula` for a chosen track. The
formula index already exists; this is a view over it.

**Concept versioning.** Keep a changelog per concept so you can see how your understanding changed.
Cheap version: the `updated:` field plus git history. Expensive version: structured diffs in the UI.

**Full-text search over `raw/`.** Sometimes the conversation has a detail the page dropped. Would
need a second index and a clear visual separation from published content.

**Confidence tracking, separate from status.** "I know this" and "I could explain this at a
whiteboard" are different claims, and the second is the one interviews test.

**Multi-device sync.** The state blob is already a portable JSON document. A file-based sync (export
to a synced folder, import on the other machine) is a day's work and needs no server. Anything
fancier does need one, which would break the local-first promise for a marginal gain.

**Company-specific tracks.** Tracks are pure data; a `jane-street`, `citadel` or `two-sigma` track is
a JSON object with the right subjects, tags and relevance floor. Worth doing once the corpus is large
enough for the filtering to be meaningful.

**Code playground.** Pyodide would put runnable Python on concept pages — genuinely useful for
numerical methods. It is a ~10 MB download that must be vendored to preserve offline use, so it
belongs behind an explicit opt-in, and only once several concepts would use it.

---

## Explicitly not planned

**A backend.** The local-first guarantee is the most valuable property of this repository. Anything
that requires a server to read your own notes is a downgrade.

**A framework rewrite.** See [ARCHITECTURE.md §2](ARCHITECTURE.md#2-why-no-framework). If the client
ever genuinely needs one, the content in `content/` is framework-agnostic and would survive the
rewrite untouched — which is the actual insurance policy.

**Cloud AI features at runtime.** Generating summaries or questions with Claude is valuable, but it
belongs in the *authoring* step (`raw/` → `content/`, documented in
[CONTRIBUTING.md](CONTRIBUTING.md#6-claude-conversation--knowledge-base)), not in the runtime. A
knowledge base that needs network access to display a page is not a knowledge base.

**Public publishing.** This is a personal study tool. Everything works over `file://`, and it would
work behind a static host unchanged — but that is a deployment decision, not a feature.

---

## How to decide what to do next

The honest test, in order:

1. Would fifty more concepts help more than this feature? Usually yes. Write the concepts.
2. Does it need application code, or is it content or configuration? Prefer the latter.
3. Does it break the local-first guarantee? Then it needs a much better reason than convenience.
4. Will it still work in five years with no `npm install`? If not, reconsider.
