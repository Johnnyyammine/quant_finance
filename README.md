# Quant Finance Knowledge Base

A local-first, interactive knowledge base for quantitative finance — built for preparing for
hedge-fund quant research / trading / developer interviews, and for keeping what you learn.

**Open `index.html` in a browser.** That's it. No server, no install, no network.

```
┌─ You author ────────────┐      ┌─ The build derives ─────────────────────────┐
│                         │      │                                             │
│  content/concepts/      │      │  data/kb.data.js       dashboard, filters   │
│      variance.md   ─────┼─────▶│  data/search.index.js  global search        │
│                         │ npm  │  concepts/*.html       reading pages        │
│  content/subjects.json  │ run  │  subjects/*.html       subject indexes      │
│  content/tracks.json    │build │                                             │
│                         │      │  + knowledge graph, formula index,          │
│                         │      │    interview bank, prerequisite chains,     │
│                         │      │    progress rollups, prev/next navigation   │
└─────────────────────────┘      └─────────────────────────────────────────────┘
```

One markdown file per concept. Everything else is generated. Adding the thousandth concept is
exactly as much work as adding the first.

---

## Quick start

```bash
node --version          # 16 or newer; there are no other prerequisites
npm run build           # regenerate data/ and the HTML pages
open index.html         # or double-click it
```

There are **no dependencies**. `npm install` does nothing because `package.json` has an empty
dependency list — everything runs on Node built-ins, and KaTeX is vendored into
`assets/vendor/katex/` so mathematics renders with no network access.

| Command | What it does |
|---|---|
| `npm run build` | Regenerate all indexes and pages |
| `npm run watch` | Rebuild automatically as you edit `content/` |
| `npm run new -- "Title" -s subject` | Scaffold a new concept from the template, then build |
| `npm run check` | Health report: coverage, gaps, thin pages, orphans |
| `npm test` | 28 self-tests over the parser, model and build |
| `npm run serve` | Optional local HTTP server (not needed for normal use) |

---

## Adding a concept

```bash
npm run new -- "Itô's Lemma" --subject stochastic-processes --relevance 5 --prereqs brownian-motion
# → creates content/concepts/ito-lemma.md and rebuilds

# write the content, then:
npm run build
open concepts/ito-lemma.html
```

You edited **one file**. The concept now appears in the dashboard, the subject page, global search,
the knowledge graph, the library table, the interview question bank and the progress bars — because
all of those are derived from the file you just wrote.

Full details, including the Claude-conversation → concept-page workflow, are in
**[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## What's in the box

**Dashboard** (`index.html`) — coverage by subject, interview gaps, a "continue where you left off"
queue ranked by interview value against your own progress, and the subject grid grouped by domain.

**Global search** (`/` anywhere) — one index over concepts, formulas, interview questions and
subjects. Prefix matching, so `brown` finds *Brownian Motion*, *Geometric Brownian motion* (a
formula) and the questions that mention it. Scope with Tab.

**Knowledge graph** (`graph.html`) — force-directed map of the whole base. Solid edges are
prerequisites, dashed edges are related concepts, node colour is subject, and hollow nodes are
things you haven't started, so the graph doubles as a progress map. Focus on any concept to see its
n-hop neighbourhood.

**Library** (`library.html`) — the full table with faceted filters (subject, difficulty, status,
interview relevance, tags, bookmarks) and sortable columns. Filter state lives in the URL, so any
view is shareable and bookmarkable.

**Interview mode** (`interview.html`) — pick a track (Quant Researcher, Quant Trader, Market Making,
Stat Arb, …), get a cram sheet ranked by *value at risk* — interview relevance × how little you know
it — and drill the question bank with keyboard-driven reveal/score.

**Concept pages** — a consistent 12-section template, key-formula boxes, collapsible derivations,
tooltips, prerequisite/related navigation, a local graph minimap, a 30-second revision card, and
interactive modules where a picture beats a paragraph.

---

## Architecture in one page

Full detail in **[ARCHITECTURE.md](ARCHITECTURE.md)**. The three decisions that shape everything:

**1. There is a build step, because `file://` forbids `fetch()`.**
Opening `index.html` from disk gives the page an opaque origin, so it cannot `fetch()` a JSON file.
The build therefore emits `data/kb.data.js` containing `window.KB_DATA = {...}`, loaded with a plain
`<script src>` — which works fine over `file://`. This one constraint is why the project has a build
step at all, and it buys genuine offline use in exchange.

**2. Content is markdown; the application never contains content.**
`assets/js/` and `tools/` know about *shapes* (a concept has a subject, prerequisites, formulas) and
nothing about *quant finance*. Every subject name, formula, question and relationship lives in
`content/`. You will never edit application code to add knowledge.

**3. Metadata is co-located with prose, and indexes are derived.**
A concept's interview questions, formulas, tags and relationships live in the same file as its
explanation. There is no separate question bank or formula list to keep in sync — the build extracts
them. Reverse edges ("builds towards"), symmetric relations, subject rollups and prev/next order are
all computed, never authored twice.

```
quant_finance/
├── index.html  graph.html  library.html  interview.html   application shells
├── content/                                               ← YOU EDIT THIS
│   ├── concepts/<id>.md                                     one file per concept
│   ├── subjects.json                                        24 subject definitions
│   └── tracks.json                                          interview tracks
├── templates/concept.template.md                          the authoring template
├── tools/                                                 zero-dependency Node build
│   ├── build.js  new-concept.js  check.js  test.js  serve.js
│   └── lib/  yaml.js  markdown.js  model.js  page.js  search.js
├── assets/
│   ├── css/     app.css (design system) · views.css (per-view)
│   ├── js/      kb-core.js (data+search+state) · kb-ui.js (chrome)
│   │            dashboard.js · library.js · graph.js · interview.js
│   │            concept.js · subject.js · math.js · lib/plot.js
│   │            modules/    interactive modules, one file each
│   └── vendor/katex/                                      offline maths (608 KB)
├── data/            GENERATED  kb.data.js · search.index.js · kb.json
├── concepts/        GENERATED  one HTML page per concept
├── subjects/        GENERATED  one HTML page per subject
└── raw/claude-conversations/   raw source material, never published
```

### Why no framework

React/Vue/Vite would each add a build toolchain, a `node_modules/`, and a runtime dependency, in
exchange for solving problems this project does not have: there is no shared mutable client state
worth a store, no routing beyond real files, and no component tree deep enough to need a virtual
DOM. The counter-argument — hand-rolled Markdown and YAML parsers — is real, and is answered by
`npm test`, which covers exactly the parsing behaviour that would silently corrupt content.

What the plain-script approach buys: the repository works from a double-click in five years with no
`npm install`, generated pages are readable with JavaScript disabled, and there is no supply chain.

---

## Offline behaviour

Everything works from `file://`: search, filters, the graph, interview mode, mathematics, the
interactive modules, and your saved progress (in `localStorage`).

The only thing that needs a server is `npm run serve`, provided for future modules that want
`fetch()`. Nothing shipped today requires it.

Personal state — learning status overrides, bookmarks, drill history, theme — lives in `localStorage`
under the key `qfkb:v1`, separate from the generated content, so rebuilding never destroys it. Export
it from the console with `KB.exportState()`.

---

## Keyboard shortcuts

Press `?` anywhere for the full list.

| | |
|---|---|
| `/` or `⌘K` | Search everything |
| `H` `G` `I` `L` | Dashboard · Graph · Interview · Library |
| `←` `→` | Previous / next concept |
| `U` | Up to the subject |
| `E` `A` | Expand all derivations / reveal all answers |
| `B` `R` | Bookmark · revision card |
| `T` | Toggle light/dark |
| `Esc` | Close |

In interview mode: `space` reveal/next, `1` got it, `2` missed it, `n` skip.

---

## Current content

The repository ships **nine worked concepts** — deliberately few. The point of this milestone is the
system, not the corpus; these exist to prove that navigation, search, the graph, prerequisites,
interview mode, progress, formulas and interactive modules all work end to end.

```
Probability            Expectation · Conditional Probability · Bayes' Theorem
Statistics             Variance · Covariance & Correlation · Linear Regression
Stochastic Processes   Martingales · Brownian Motion
Portfolio Construction Sharpe Ratio
```

They form a real prerequisite chain (Expectation → Variance → Covariance → Linear Regression;
Expectation → Martingales → Brownian Motion) and carry 36 indexed formulas, 43 interview questions
and 4 interactive modules between them. The other 20 subjects are declared and empty, waiting for
content.

See **[ROADMAP.md](ROADMAP.md)** for what comes next.

## Documentation

| | |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to add a concept, the frontmatter schema, authoring syntax, the Claude → knowledge base workflow |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Design decisions, the data model, the build pipeline, how to write an interactive module, how to extend the system |
| [ROADMAP.md](ROADMAP.md) | Planned features and the order that makes sense |
| [templates/concept.template.md](templates/concept.template.md) | The concept template, fully annotated |

## Licence

MIT for the code. Vendored KaTeX is MIT (see `assets/vendor/katex/LICENSE`).
