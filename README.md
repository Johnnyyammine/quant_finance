# Quant Finance Knowledge Base

A local-first, interactive knowledge base for quantitative finance — built for hedge-fund quant
interview preparation, and for keeping what you learn afterwards.

**Open `index.html` in a browser.** No server, no install, no network.

```
content/concepts/variance.md ──┐
content/subjects.json          ├─ npm run build ─▶  data/*.js  concepts/*.html  subjects/*.html
content/tracks.json          ──┘                    dashboard · search · graph · library ·
                                                    interview bank · prerequisite chains
```

One markdown file per concept; everything else is derived. Adding the thousandth concept is
exactly as much work as adding the first.

## Quick start

```bash
node --version   # 16 or newer — there are no other prerequisites
npm run build    # regenerate data/ and the HTML pages
open index.html  # or just double-click it
```

There are **no dependencies**. `npm install` does nothing: everything runs on Node built-ins, and
KaTeX is vendored so mathematics renders offline.

| Command | What it does |
|---|---|
| `npm run build` | Regenerate all indexes and pages |
| `npm run watch` | Rebuild as you edit `content/` |
| `npm run new -- "Title" -s subject` | Scaffold a concept from the template |
| `npm run check` | Health report: coverage, gaps, orphans |
| `npm test` | 57 self-tests over the parser, model and build |
| `npm run serve` | Optional local HTTP server (not needed for normal use) |

## Adding a concept

```bash
npm run new -- "Itô's Lemma" --subject stochastic-processes --relevance 5 --prereqs brownian-motion
# write the content, then:
npm run build
```

You edited **one file**. It now appears in the dashboard, its subject page, global search, the
graph, the library table and the interview bank — all of those are derived from it.

Details, including the Claude-conversation → concept-page workflow, are in
**[CONTRIBUTING.md](CONTRIBUTING.md)**.

## What's in it

- **Dashboard** (`index.html`) — corpus figures, a "start here" row picked by interview value and
  ordered by prerequisite depth, the 24-subject taxonomy with unwritten subjects shown greyed
  rather than hidden, and the eight interview tracks.
- **Search** (`/` anywhere) — one prefix-matching index over concepts, formulas, questions and
  subjects. `brown` finds *Brownian Motion*, *Geometric Brownian motion* and the questions about
  them. Scope with Tab.
- **Graph** (`graph.html`) — force-directed map. Solid edges are prerequisites, dashed are related,
  colour is subject, size is connectedness. Focus a concept for its n-hop neighbourhood.
- **Library** (`library.html`) — full table, faceted filters, sortable columns, filter state in the
  URL so any view is shareable.
- **Interview mode** (`interview.html`) — pick a track, get a cram sheet ranked by relevance, drill
  the question bank with keyboard reveal/score.
- **Concept pages** — ten authored sections plus three the build generates (Key Formulas,
  Interview Questions, Connections), collapsible derivations, a local graph minimap, a 30-second
  revision card, and interactive modules where a picture beats a paragraph. A sticky rail carries
  the page's own contents and formulas; it folds under the article below 900px.

## Architecture in one page

Full detail in **[ARCHITECTURE.md](ARCHITECTURE.md)**. Three decisions shape everything:

**1. There is a build step, because `file://` forbids `fetch()`.** Opening `index.html` from disk
gives the page an opaque origin. So the build emits `data/kb.data.js` containing
`window.KB_DATA = {…}`, loaded with a plain `<script src>` — which works fine over `file://`. That
one constraint is the entire reason for the build, and it buys genuine offline use.

**2. Content is markdown; the application never contains content.** `assets/js/` and `tools/` know
about *shapes* (a concept has a subject, prerequisites, formulas) and nothing about quant finance.
You will never edit application code to add knowledge.

**3. Metadata is co-located with prose, and indexes are derived.** Questions, formulas, tags and
relationships live in the same file as the explanation. Reverse edges, symmetric relations, subject
rollups and prev/next order are computed, never authored twice.

```
index.html  graph.html  library.html  interview.html   application shells
content/                                               ← YOU EDIT THIS
  concepts/<id>.md · subjects.json · tracks.json
templates/concept.template.md                          the authoring template
tools/            zero-dependency Node build
  build.js  new-concept.js  check.js  test.js  serve.js
  lib/  yaml.js  markdown.js  model.js  page.js  search.js
assets/
  css/     app.css (design system) · views.css (per-view)
  js/      kb-core.js · kb-ui.js · one file per view · modules/
  fonts/   Source Serif 4 · Figtree · JetBrains Mono (249 KB)
  vendor/katex/                                        offline maths (302 KB)
data/       GENERATED  kb.data.js · search.index.js · kb.json
concepts/ subjects/    GENERATED  one HTML page each
raw/claude-conversations/   source material, never published
```

**Why no framework.** React/Vue/Vite would each add a toolchain, a `node_modules/`, and a runtime
dependency, to solve problems this project does not have: no shared mutable client state worth a
store, no routing beyond real files, no component tree deep enough for a virtual DOM. The real
counter-argument — hand-rolled Markdown and YAML parsers — is answered by `npm test`, which covers
exactly the parsing behaviour that would silently corrupt content. What it buys: a double-click
still works in five years, pages are readable with JavaScript off, and there is no supply chain.

KaTeX ships only to the pages that actually contain maths, which is the concept pages. It is a
third of a page's weight, and the dashboard, library, graph, interview mode and subject indexes
render none.

## Offline behaviour

Everything works from `file://`: search, filters, the graph, interview mode, mathematics, the
interactive modules, and bookmarks. `npm run serve` exists only for future modules that want
`fetch()`; nothing shipped today needs it.

Personal state — bookmarks, drill history, theme — lives in `localStorage` under `qfkb:v1`,
separate from generated content, so rebuilding never destroys it. Export with `KB.exportState()`.

There is deliberately **no reading-progress tracking**. This is a reference you dip into, not a
course you finish, and progress bars spend interface on a number nobody acts on.

## Keyboard shortcuts

Press `?` for the full list.

| | |
|---|---|
| `/` or `⌘K` | Search everything |
| `H` `G` `I` `L` | Dashboard · Graph · Interview · Library |
| `←` `→` · `U` | Previous / next concept · up to the subject |
| `E` `A` | Expand all derivations / reveal all answers |
| `B` `R` `T` | Bookmark · revision card · light/dark |

In interview mode: `space` reveal/next, `1` got it, `2` missed it, `n` skip.

## Putting it on the web

Every page is committed HTML with no absolute paths, so it works from any domain, any
subdirectory, and from `file://` unchanged.

**GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`. Live at
`https://<user>.github.io/<repo>/` in about a minute. `.nojekyll` is what stops Jekyll skipping
underscore-prefixed directories and rewriting paths.

Because `data/` and the generated HTML are committed, there is no build to configure — but you
**must run `npm run build` and commit the result** before pushing, or the deployed pages will lag
`content/`. CI fails the build if you forget. Netlify, Cloudflare Pages, S3 or a USB stick work
just as well.

Two things before you share the link: a public repository means a public site (use Netlify or
Cloudflare Pages with access control for a private one), and `localStorage` is per-browser, so
your phone and laptop keep separate bookmarks and anyone opening your link starts clean.

## Current content

**18 worked concepts** across 8 of the 24 declared subjects — deliberately few. The point of this
milestone is the system, not the corpus; these exist to prove navigation, search, the graph,
prerequisites, interview mode, formulas and interactive modules all work end to end.

```
Probability             Expectation · Conditional Probability · Bayes' Theorem
Statistics              Variance · Covariance & Correlation · Linear Regression
Linear Algebra          PCA & Eigenportfolios
Stochastic Processes    Martingales · Brownian Motion · Itô's Lemma
Options                 Put–Call Parity · Black–Scholes Equation · Black–Scholes Formula ·
                        Option Greeks
Derivatives             Forwards & Futures
Portfolio Construction  Sharpe Ratio · Kelly Criterion
Risk Management         Effective Number of Bets
```

They form real prerequisite chains (Expectation → Variance → Covariance → Linear Regression;
Expectation → Martingales → Brownian Motion → Itô's Lemma → Black–Scholes) and carry 82 indexed
formulas, 102 interview questions and 6 interactive modules. See **[ROADMAP.md](ROADMAP.md)** for
what comes next.

## Documentation

| | |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Adding a concept, the frontmatter schema, authoring syntax, the Claude workflow |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Design decisions, data model, build pipeline, writing an interactive module |
| [ROADMAP.md](ROADMAP.md) | Planned features, in the order that makes sense |
| [templates/concept.template.md](templates/concept.template.md) | The concept template, annotated |

## Licence

MIT for the code. Vendored KaTeX is MIT (`assets/vendor/katex/LICENSE`).
