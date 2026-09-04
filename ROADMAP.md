# Roadmap

The foundation is built. What follows is ordered by *value per unit of work*, not by ambition.

Nothing here requires re-architecting: every item is either content, a new file in an existing
extension point, or a contained change to one module. That was the point of the first milestone.

---

## Now — the only thing that matters

### Content

The system is proven; the corpus is not. Twenty concepts exist to demonstrate that navigation,
search, the graph, prerequisites, interview mode and modules work end to end. Sixteen subjects are
still empty.

**No feature on this page is worth more than the next fifty concepts.** Suggested order, chosen so
each new page has somewhere to attach in the graph:

1. **Finish Probability** — random variables, distributions, LLN, CLT, conditional expectation,
   moment generating functions. This is the base of every prerequisite chain.
2. **Finish Statistics** — estimators, bias–variance, hypothesis testing, confidence intervals,
   maximum likelihood, multiple testing. The last one earns its place immediately.
3. **Linear Algebra** — SVD, positive definiteness, matrix calculus. PCA & Eigenportfolios is
   written; the rest of the subject is one concept deep and every other page that wants to lean on
   it has nothing to point at.
4. **Stochastic Processes** — Markov chains, Ornstein–Uhlenbeck, Girsanov, SDE solution methods.
   Itô's Lemma is written; Brownian Motion and Martingales point at the rest.
5. **Derivatives & Options** — the European vanilla chain is written (forwards, parity, the
   Black–Scholes equation and formula, the Greeks, vanilla structures and the smile). Next:
   American exercise and binomial trees, then exotics — digitals, barriers, Asians — and variance
   swaps. Each has somewhere to attach now.
6. **Time Series** — stationarity, ARMA, GARCH, cointegration, unit roots.
7. **Portfolio Construction & Risk** — mean–variance, Kelly, risk parity, VaR, expected shortfall,
   drawdown, Black–Litterman.
8. **Market Microstructure & Execution** — order books, adverse selection, price impact,
   implementation shortfall, Almgren–Chriss.
9. **Mental Math & Brainteasers** — the highest interview-ROI subject and the cheapest to write,
   since each entry is mostly `questions:`.

Use `npm run check` to see what is orphaned, unsummarised, or missing questions.

### Small fixes that pay for themselves immediately

- **Incremental build** — hash each concept file and skip unchanged ones. The build is ~170 ms for
  twenty concepts and linear, so ~9 s at 1,000, which makes `npm run watch` unpleasant.
- **`npm run check --fix-links`** — list every dangling `[[link]]` with the `npm run new` command
  that would create it.

---

## Next — features that compound with the content

### Spaced repetition

The largest single win for interview preparation, and the store is already shaped for it:
`state.drills[questionId] = { seen, right, wrong, last }` is recorded today but only displayed.

Add an SM-2-style scheduler over that data, a `due` queue in interview mode, and a "review N due"
entry point on the dashboard. No content changes, no schema changes — one new module plus a queue
view. The reason this is *next* rather than *now* is that spaced repetition over 62 questions is not
worth much; over 500 it is transformative.

### Personal notes and annotations

`state.notes` exists in the store and is unused. Add a per-concept notes panel and per-section
margin notes, saved locally, exportable with `KB.exportState()`. Notes should never be written back
into `content/` — the separation between authored content and personal state is load-bearing.

### Learning paths

`KB.learningPath(id)` already returns a topologically ordered prerequisite chain. Surface it: "what
do I need to learn before Black–Scholes?" as an ordered checklist, on the concept page and as a
standalone view. This is derived data that already exists and is currently invisible.

### Weak-concept detection, from evidence rather than self-report

Per-concept reading status was removed: self-reported "learned" is a number nobody acts on, and it
cost real interface. Drill history is different — it is evidence. A "your gaps" view built only on
questions you keep missing, weighted by interview relevance, would earn its place; a percentage
complete would not.

### More interactive modules

Highest value per hour, each one file in `assets/js/modules/`:

| Module | Attaches to |
|---|---|
| `option-payoff` | payoff and P&L diagrams with adjustable strikes |
| `black-scholes-greeks` | Greeks against spot, time and volatility |
| `efficient-frontier` | two/three-asset frontier as correlation moves |
| `kelly-sizing` | wealth paths at fractions of Kelly, showing the drawdown cost |
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

**Confidence tracking, earned rather than declared.** "I know this" and "I could explain this at a
whiteboard" are different claims, and the second is the one interviews test — so it should be
inferred from drill answers, not from a dropdown.

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

**A publishing pipeline.** The site is already static and is deployed to GitHub Pages (see the
README), but that works precisely because it needed no feature: committed HTML, no absolute paths,
no build on the host. Anything that makes publishing a *mode* — draft/published states, per-page
visibility, a CMS — is a downgrade of the one-file-per-concept model.

---

## How to decide what to do next

The honest test, in order:

1. Would fifty more concepts help more than this feature? Usually yes. Write the concepts.
2. Does it need application code, or is it content or configuration? Prefer the latter.
3. Does it break the local-first guarantee? Then it needs a much better reason than convenience.
4. Will it still work in five years with no `npm install`? If not, reconsider.
