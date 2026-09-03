# Architecture

This document explains why the system is shaped the way it is, and how to extend it. If you only
want to add content, read [CONTRIBUTING.md](CONTRIBUTING.md) instead.

---

## 1. The constraint that determines everything

The requirement is: **double-click `index.html` and it works, offline, forever.**

Opening a file from disk gives the page an *opaque origin*. Consequences, all enforced by the
browser and none negotiable:

| Wanted | Over `file://` |
|---|---|
| `fetch('data/concepts.json')` | ❌ blocked by CORS |
| `import { x } from './mod.js'` | ❌ ES modules are CORS-checked |
| `<script src="data.js">` | ✅ works |
| `<link rel="stylesheet">` | ✅ works |
| `localStorage` | ✅ works (per-file-origin) |
| `@font-face` with a relative URL | ✅ works |
| Service workers | ❌ require a secure origin |

So the knowledge base cannot load its data at runtime as JSON, and cannot use ES modules. Two
options remain:

1. **Inline all data into every page.** Duplicates the entire index into every one of N pages.
   Unworkable past a few dozen concepts.
2. **Generate a JavaScript file that assigns the data to a global**, loaded with a plain
   `<script src>`, shared by every page and cached once.

Option 2 is what this project does:

```js
/* data/kb.data.js — GENERATED */
window.KB_DATA = { subjects: [...], concepts: [...], edges: [...], tracks: [...], stats: {...} };
```

**This single constraint is the reason there is a build step at all.** Everything else — static page
generation, the derived indexes, the search index — follows from having decided to run a build, and
is essentially free once you have one.

The same reasoning rules out ES modules, so all client scripts are classic `<script>` files using
IIFEs and a small number of globals (`KB`, `KBUI`, `KBPlot`, `KBMath`). This is not nostalgia; it is
the only module system that works from a `file://` origin.

---

## 2. Why no framework

React, Vue, Svelte and their build tools were considered and rejected. The honest accounting:

**What a framework would solve here:** essentially nothing. There is no shared mutable client state
worth a store — the data is immutable after build, and personal state is a single localStorage blob.
There is no routing to speak of: pages are real files, which is better for offline use, printing,
`grep` and deep links. There is no component tree deep enough to benefit from a virtual DOM; the
largest render is a table of a few thousand rows, which `innerHTML` handles in under 20 ms.

**What a framework would cost:** a `node_modules/` that must be reinstalled to build in five years'
time, a bundler in the loop between editing a file and seeing it, a runtime download, and pages that
are blank without JavaScript.

**The real cost of not using one:** hand-rolled Markdown and YAML parsers, roughly 720 lines
together (`markdown.js` 448, `yaml.js` 270). That is genuine risk — a parser bug corrupts content
silently, and this project has shipped several. It is mitigated by `npm test`, which covers the
failure modes that matter, each one added after it actually bit: `_` inside `$...$` becoming
emphasis, `$5 billion` parsed as maths, code fences leaking, an `<!--` in a code sample eating the
document, a block scalar losing its paragraph breaks, a link title never matching, HTML injection.

The trade is deliberate: **more code we own, less code we depend on.** For a repository intended to
be readable and buildable for years without maintenance, that is the right side of the trade.

KaTeX is the one exception — 608 KB vendored into `assets/vendor/katex/`. Typesetting mathematics
correctly is genuinely hard, and a CDN link would break the offline requirement. It is vendored, not
depended on: there is no package manager involved at build or run time.

---

## 3. Data model

Defined once, in `tools/lib/model.js`. Adding a field means editing that file and nothing else —
the build, the page templates and the client all read the same tables.

### Concept

The unit of knowledge. One markdown file, one record.

| Field | Type | Notes |
|---|---|---|
| `id` | slug | Stable, permanent. Defaults to the filename. |
| `title` | string | Display name. |
| `subject` | subject id | Unknown subjects are auto-stubbed with a warning, never fatal. |
| `summary` | string | One sentence. The lede, the search snippet, the card subtitle. |
| `difficulty` | enum | `foundational` · `intermediate` · `advanced` · `research` |
| `interviewRelevance` | 0–5 | Drives interview mode ranking and ★ display. |
| `tags` | slug[] | Cross-cutting, cross-subject. |
| `prerequisites` | id[] | **Directed.** Generates the reverse `builtOn` edge automatically. |
| `related` | id[] | **Symmetric.** Declaring on one side shows it on both. |
| `aliases` | string[] | Extra search terms only. |
| `tracks` | id[] | Force track membership; usually unnecessary. |
| `references`, `updated` | | Presentation metadata. |
| `questions` | Question[] | Co-located, not a separate bank. |
| `source` | path | The markdown file it came from, shown in the page footer. |
| **derived** | | `formulas`, `sections`, `builtOn`, `links`, `modules`, `path` |

There is no reading-status field. See §6.

### Subject, Track, Question, Formula

**Subject** — `id`, `name`, `description`, `icon`, `color`, `group`, `order`. Declared in
`content/subjects.json`. `path`, `conceptCount` and `interviewMax` are derived.

**Track** — an interview curriculum: `id`, `name`, `description`, `subjects[]`, `tags[]`,
`minRelevance`. Membership is *computed*: any concept whose subject or tags match, at or above the
relevance floor. That is why adding a track needs no code and no per-concept edits.

**Question** — `id`, `question`, `answer`, `hint`, `difficulty`, `tags`, plus back-references to its
concept and subject. Lives in the concept's frontmatter; extracted at build time.

**Formula** — `id`, `name`, `latex`, `usedIn[]`, `note`. Never authored separately: parsed out of
`:::formula` directives in the prose, so the formula index cannot drift from the pages.

### The derivation principle

Anything that can be computed is computed. Authored once, derived many times:

```
prerequisites  ──▶ reverse edges (builtOn) ──▶ "Builds towards" section
               ──▶ directed graph edges     ──▶ knowledge graph
               ──▶ topological depth        ──▶ prev/next order within a subject
               ──▶ subject concept map layers

:::formula     ──▶ formula index ──▶ search, sidebar, Key Formulas section
questions:     ──▶ question bank ──▶ interview drill, search
[[wiki links]] ──▶ related edges ──▶ graph, Connections section
## headings    ──▶ table of contents, scroll-spy, heading search field
```

This is the property that makes the system scale: adding a concept adds one file, and every view
updates because every view is a projection of the same records.

---

## 4. Build pipeline

`tools/build.js`, roughly 100 ms for the current corpus, linear in content size.

```
 1. read content/subjects.json, content/tracks.json          normalise, order
 2. walk content/concepts/**.md                              (files starting with _ are skipped)
 3. parse frontmatter                     tools/lib/yaml.js
 4. normalise + validate                  tools/lib/model.js  defaults, clamps, enums
 5. render markdown                       tools/lib/markdown.js
       ├─ protect $maths$ and `code` behind sentinels
       ├─ parse blocks, directives, tables, lists
       ├─ resolve [[wiki links]] against the concept registry
       └─ collect formulas, modules, links, headings, warnings
 6. derive indexes                        tools/lib/model.js
       reverse edges · symmetric relations · graph edges
       subject rollups · track membership · tag counts
 7. build the search index                tools/lib/search.js
 8. emit  data/kb.data.js · data/search.index.js · data/kb.json
 9. emit  concepts/<id>.html · subjects/<id>.html   tools/lib/page.js
10. prune generated pages whose source markdown is gone
11. report warnings, errors, statistics
```

### Design details worth knowing

**Write-if-changed.** Files are only rewritten when their content differs, so `git status` stays
clean and `npm run watch` doesn't churn the filesystem.

**Errors vs warnings.** An *error* (missing subject, duplicate id, unparseable frontmatter) skips
that concept and fails the build with a non-zero exit. A *warning* (missing recommended section,
dangling link, unknown module) never blocks — a half-written page still builds and is still
navigable, because a knowledge base you can't build is a knowledge base you stop using.
`--strict` promotes warnings to failures for CI.

**Pruning.** Deleting `content/concepts/x.md` deletes `concepts/x.html` on the next build. Generated
directories contain only generated files.

**Static generation, JavaScript as enhancement.** Concept and subject pages are complete HTML with
prose baked in. They are readable, printable and greppable with JavaScript disabled. JavaScript adds
search, filters, faceting and interactive modules — nothing load-bearing for reading.

### Math protection

The subtlest part of the renderer, and the one most worth understanding before touching it:

```
input:   The volatility $\sigma_1 * \sigma_2$ is high.
step 1:  code fences and `spans` → sentinel  \0C0\0
step 2:  <!-- authoring notes --> stripped
step 3:  $$...$$, \[...\], \(...\), $...$    → sentinel  \0M0\0
step 4:  parse blocks and inline markdown    (sentinels are inert)
step 5:  restore sentinels, HTML-escaping the LaTeX body
output:  The volatility <span class="math-inline">\(\sigma_1 * \sigma_2\)</span> is high.
```

Step 1 must come before step 2: comments used to be stripped first, so an `<!--` inside a code
sample deleted everything up to the next `-->`, across block boundaries.

Without step 2, `*` and `_` inside formulas become emphasis and every formula on the site breaks
subtly. The inline-maths regex also requires non-space immediately inside the delimiters and rejects
a following word character, which is what stops `$5 billion ... $10 billion` from being read as one
formula. `npm test` pins all of this.

---

## 5. Search

`tools/lib/search.js` builds it; `assets/js/kb-core.js` queries it.

**Structure** — a sorted term array plus a parallel postings array:

```js
window.KB_SEARCH = {
  docs:     [ {t, id, title, sub, path, ctx, ...}, ... ],   // t: concept|subject|formula|question
  terms:    ['annualise', 'annualisation', 'arbitrage', ...],        // sorted
  postings: [ [docId, score, docId, score, ...], ... ]               // parallel to terms
};
```

Every document carries `t`, `id`, `title`, `sub`, `path` and `ctx`; concepts add `sum`, `diff` and
`rel`, questions add `diff` and `rel`, and formulas add `latex`.

**Prefix query** — binary-search the lower bound of the prefix, then walk the run of matching terms:
`O(log n + matches)` per token. Typing `brown` finds *Brownian Motion*, the *Geometric Brownian
motion* formula and every question mentioning it, without a trie, a WASM blob, or a search library.

**Scoring** — field-weighted (title 12, id/alias 9, tag 6, subject 5, formula 5, summary 4,
question 3, heading 2, body 1) with saturating term frequency, an exact-over-prefix penalty
(`|query| / |term|`), a ×3 bonus for documents matching every query token, and a +40 override when
the title literally contains the query.

**What is indexed** — four document types: concepts, subjects, individual formulas (searchable by
name *and* by the words inside the LaTeX, so `\text{Sharpe}` is findable), and individual interview
questions. Searching `sharpe` returns the concept, its five formulas and its six questions as
separate, separately-navigable results.

**Scale** — the index is ~163 KB for 12 concepts (~14 KB each), dominated by body text.
Extrapolating to 1,000 concepts gives roughly 14 MB, which loads from disk in well under a second and stays instant to
query. If it ever becomes a problem, the fix is to cap indexed body length per document, or split
the index into a hot part (titles, formulas, questions) and a lazily-loaded body index. Neither is
needed yet, and the shape of the file already accommodates both.

---

## 6. Client architecture

```
data/kb.data.js         window.KB_DATA      generated content
data/search.index.js    window.KB_SEARCH    generated index
        ↓
assets/js/kb-core.js    window.KB           lookup · search · personal state · graph helpers
assets/js/kb-ui.js      window.KBUI         palette · shortcuts · theme · toasts · bookmarks
        ↓
per-view scripts        dashboard · library · graph · interview · concept · subject
assets/js/lib/plot.js   window.KBPlot       canvas plotting + statistics (modules only)
assets/js/math.js       window.KBMath       KaTeX bootstrap
```

`kb-core.js` and `kb-ui.js` load on every page, including generated concept pages, which is why
search and shortcuts work everywhere. Per-view scripts are added by the page template only where
needed. `plot.js` ships only to concept pages that actually mount a module.

### Personal state

All reader-owned state lives in one localStorage blob under `qfkb:v1`:

```js
{ bookmarks: {}, notes: {}, drills: {}, theme: null, prefs: {} }
```

The design point: **personal state is separate from content**, so rebuilding never destroys it and
the content files never carry anything reader-specific.

There is deliberately no per-concept reading status and no percentage complete. Self-reported
progress is a number nobody acts on, and the bars, dots and status controls that displayed it were
spending real interface on it. Drill history stays, because a question you keep missing is evidence
rather than self-report.

Every mutation emits an event (`KB.on(fn)`) so open views repaint. `KB.exportState()` and
`KB.importState(json)` make the state portable — the seam through which spaced repetition, notes and
sync will later plug in without touching the content pipeline.

Storage is wrapped in try/catch throughout: private-browsing modes and disabled storage degrade to
in-memory state for the session rather than throwing.

---

## 7. Interactive modules

The extension point for "this concept needs a picture you can move".

### The contract

**One file** in `assets/js/modules/<name>.js`:

```js
KB.modules.register('random-walk', {
  title: 'Random walk sample paths',
  subtitle: 'Scaling, dispersion and the √t law',
  height: 260,
  controls: [
    { id: 'paths', label: 'Paths', type: 'range', min: 1, max: 200, value: 40, format: 'int' },
    { id: 'sigma', label: 'Volatility σ', type: 'range', min: 0.02, max: 0.8, step: 0.01,
      value: 0.2, format: 'pct' },
    { id: 'dist', label: 'Population', type: 'select', value: 'uniform',
      options: [{ value: 'uniform', label: 'Uniform' }] },
    { id: 'show', label: 'Show envelope', type: 'checkbox', value: true },
  ],
  render: function (ctx) {
    var P = window.KBPlot;
    var plot = ctx.plot({ height: 260 });
    plot.domain(xs, ys).clear().grid().line(xs, ys, { color: P.palette[0] });
    ctx.stats([{ label: 'Mean', value: '0.0031' }]);
    ctx.note('Explanatory line, with $maths$ if useful.');
  },
});
```

**One directive** in any concept:

```markdown
:::module random-walk
{"paths": 40, "sigma": 0.2}
:::
```

That is the whole integration. The build sees the directive, verifies the script exists, emits the
`<script>` tag (plus `plot.js`) and a mount point carrying the JSON as `data-config`. At runtime
`concept.js` builds the control panel from `controls`, wires input events, and calls `render` on
every change inside a `requestAnimationFrame`. Config values override control defaults, so the same
module can be mounted on several pages with different parameters.

Three control types are supported: `range`, `select` and `checkbox`.

**`ctx` gives you:** `node` (the module frame), `canvas`, `values` (live control values), `config`,
`plot(opts)` → a `KBPlot` instance, `stats(items)` → the numeric strip, `note(html)` → an
explanatory line with maths support.

A render error is caught and displayed inside the module frame rather than breaking the page.

### KBPlot

`assets/js/lib/plot.js` — a small canvas plotting layer, purpose-built rather than imported.

- `Plot`: `domain` · `clear` · `grid` · `line` · `area` · `scatter` · `bars` · `hline` · `vline` ·
  `legend`. Handles device-pixel-ratio and reads theme colours, so plots follow light/dark.
- `rng(seed)`: mulberry32 + Box–Muller normals — deterministic, so an example is reproducible.
- `stat`: `mean` · `variance` · `std` · `quantile` · `corr` · `ols` · `normalCdf` · `histogram`.

A general charting library would be ~200 KB for the 10% used, would not read the theme tokens, and
would need a CDN. This is ~350 lines and does exactly what the modules need.

### Typography

Three vendored faces, split by what you do with the text rather than by where it
sits in the DOM:

| Face | Token | Used for | Why |
|---|---|---|---|
| Literata | `--font-read` | concept prose, question text and answers, the drill card, the at-a-glance summary, titles | KaTeX sets maths in a serif, so a serif body makes inline maths part of the sentence instead of an inclusion |
| Plus Jakarta Sans | `--font-ui` | nav, buttons, labels, facets, tables, cards, module controls | a geometric grotesque against the serif separates chrome from content at a glance |
| JetBrains Mono | `--font-mono` | figures, code, tags, formula ids | tabular by default |

`.kb-article` sets the reading face and everything under it inherits, so a single
rule in `app.css` lists the interface elements inside that subtree — buttons,
summaries, pills, table cells, captions — that go back to the sans. The test is
whether you *read* it or *scan* it.

Only the Literata roman carries the optical-size axis; the italic ships
weight-only. opsz is worth its 58 KB on a 31px title, where it gives a real
display cut rather than body text scaled up, and no heading in the corpus
contains an italic — italics appear only at 13–15.5px, where the two cuts are
indistinguishable.

---

### Shipped modules

| Module | Demonstrates |
|---|---|
| `random-walk` | √t dispersion, ±1σ/±2σ envelopes, sample vs theoretical SD |
| `bayes-explorer` | Posterior vs base rate; why a 99%-accurate test is usually wrong |
| `regression-lab` | OLS under noise; standard error shrinking as 1/√n |
| `distribution-explorer` | CLT convergence, and its failure for Cauchy draws |
| `diversification-lab` | Eigenvalue spectrum vs a portfolio's risk contributions; N_eff and ENB |
| `black-scholes-lab` | Price and each Greek across spot; gamma spiking at expiry, vega growing with it |

---

## 8. The knowledge graph

`assets/js/graph.js`. Canvas, not SVG: at a thousand nodes, per-frame SVG DOM mutation dominates the
frame budget, while a canvas redraw is one pass.

**Simulation** — a compact force-directed layout: inverse-square repulsion with a distance cutoff,
spring attraction along edges (prerequisites pull harder and shorter than related links), a weak
hierarchy term pushing prerequisites above their dependants, and weak centring so disconnected
islands stay on screen. Alpha decays geometrically, and the view auto-fits once the layout cools.

Repulsion is `O(n²)`. At ~1,500 nodes that is roughly 1M pair tests per frame — acceptable but near
the limit. Beyond that, the change is a Barnes–Hut quadtree in `step()`, which is self-contained;
nothing else in the file would need to move.

**Encoding** — node colour is subject and radius grows with degree and interview relevance, so the
picture reads as "which areas, and which concepts hold the structure together". Nodes were once
drawn hollow when unstarted; that went with the reading-progress feature (§6), and a uniform lit
sphere reads better besides — the mixed hollow/filled look was routinely mistaken for a rendering
artefact.

**Interaction** — pan, zoom, hover to highlight a neighbourhood, click to inspect in the panel,
double-click to open the concept, drag to reposition, focus on any node to see its n-hop
neighbourhood, filter by subject and edge type.

Two smaller graph views reuse the same edge data: the concept page's 2-hop **minimap**, and the
subject page's **layered concept map**, where horizontal position is the longest prerequisite chain
within the subject — so it reads left-to-right as a study order.

---

## 9. Extension points

| To add… | Do this | Application code changes |
|---|---|---|
| A concept | `npm run new`, write the file | none |
| A subject | append to `content/subjects.json` | none |
| An interview track | append to `content/tracks.json` | none |
| Interview questions | `questions:` in a concept's frontmatter | none |
| A formula | `:::formula` in prose | none |
| An interactive module | one file in `assets/js/modules/` + a `:::module` directive | none |
| A callout style | one entry in `CALLOUTS` in `markdown.js`, one CSS rule | 2 lines |
| A metadata field | one entry in `model.js`, then use it | 1 file |
| A difficulty level | one row in the `DIFFICULTY` table in `model.js` | 1 file |
| A canonical section | one row in `SECTIONS` in `model.js` (aliases included) | 1 file |
| A whole new view | an HTML shell + a script reading `KB` | new files only |

The test of the architecture is the first column: the things you do weekly cost nothing, and the
things that cost something are things you do once.

---

## 10. Known limits and what to do about them

**Search index size.** ~14 KB per concept. At 1,000 concepts the index is ~14 MB — fine from disk,
noticeable over a network. *Fix when it hurts:* cap indexed body length, or split hot (titles,
formulas, questions) from cold (body) and load the cold index lazily.

**Graph repulsion is O(n²).** Comfortable to ~1,500 nodes. *Fix:* Barnes–Hut quadtree in `step()`.

**`kb.data.js` is loaded whole on every page.** ~5 KB per concept, so ~5 MB at 1,000 concepts. Since
it is a local file this is a parse cost, not a transfer cost, but it is the first thing to split if
page loads slow: a lightweight index for navigation, a full record loaded per page.

**Hand-rolled parsers.** The YAML subset and Markdown renderer cover what this project uses and no
more. Unsupported YAML (anchors, aliases, multi-document) fails loudly rather than silently.
`npm test` guards the behaviour that matters.

**No incremental build.** Everything rebuilds every time. At ~100 ms for 12 concepts, extrapolating
to ~8 s for 1,000 — annoying under `watch`. *Fix:* hash inputs and skip unchanged concepts; the
write-if-changed logic already means unchanged output is free.

**No full-text search across raw conversations.** By design — `raw/` is source material, not content.

---

## 11. Testing

```bash
npm test     # 43 tests, no framework, ~1 second
```

Coverage is deliberately concentrated where a silent failure would corrupt content: the YAML subset
(scalars, nested maps, lists of maps, block scalars including their blank lines and `#` lines,
comments outside them), the markdown renderer (math protection, code fences, HTML comments,
directives and duplicate formula ids, wiki links, links with titles, tables and escaped pipes,
rules, blockquote continuation, nested lists, HTML escaping, sentinel leakage), the model
(normalisation, clamping, reverse edges, symmetric relations, dangling references, auto-stubbed
subjects), the search index shape, and five end-to-end invariants: the repository builds without
errors, the build is deterministic, every declared relationship resolves, the prerequisite graph is
acyclic, and no generated page leaks unrendered maths or progress markup.

Several of these tests exist because the bug shipped first. Each one was written to fail against the
code that had the bug, then pass — a test that has never been seen to fail is not yet evidence.

The last one matters more than it looks: a prerequisite cycle would make the graph layout and the
learning-path helper misbehave in ways that are tedious to debug from the symptom.
