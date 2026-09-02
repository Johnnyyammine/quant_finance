# Adding to the Knowledge Base

Everything here optimises for one thing: **adding a concept should be writing one file.**

---

## The 60-second version

```bash
npm run new -- "Itô's Lemma" --subject stochastic-processes
# ... write the content in content/concepts/ito-lemma.md ...
npm run build
open concepts/ito-lemma.html
```

That's the whole workflow. You never touch application code, never register the page anywhere, never
update an index. The build discovers the file, extracts its metadata, formulas, questions and links,
and wires it into the dashboard, search, the graph, the library and interview mode.

---

## 1. Scaffold

```bash
npm run new -- "Concept Title" --subject <subject-id> [options]
```

| Flag | Meaning |
|---|---|
| `-s, --subject` | **Required.** Subject id from `content/subjects.json`. Run `npm run new` with no arguments to list them. |
| `-d, --difficulty` | `foundational` · `intermediate` · `advanced` · `research` |
| `-r, --relevance` | Interview relevance, 0–5. Drives interview mode and the ★ display. |
| `-t, --tags` | `comma,separated` |
| `-p, --prereqs` | `comma,separated` concept ids you should learn first |
| `--related` | `comma,separated` sibling concepts |
| `-m, --minutes` | Estimated reading time; defaults to 12 |
| `--id` | Override the generated id |
| `--from <file>` | Seed the body from a file — see the Claude workflow below |
| `--force` | Overwrite an existing file |

Everything can also be changed later by editing the frontmatter. Nothing is baked in.

You can equally just copy `templates/concept.template.md` to `content/concepts/<id>.md` by hand —
the CLI is convenience, not ceremony.

---

## 2. Frontmatter reference

The block between the `---` fences. Only `subject` is required.

```yaml
---
id: ito-lemma                 # stable identifier; defaults to the filename.
                              # NEVER change it after other pages link to it.
title: Itô's Lemma
subject: stochastic-processes # must match content/subjects.json (an unknown one
                              # still builds — the build stubs it and warns)
summary: >                    # ONE sentence. Shown under the title, in search
  The chain rule for stochastic processes...   # results, and on every card.

difficulty: advanced          # foundational | intermediate | advanced | research
interview_relevance: 4        # 0-5 → ★ rating, interview-mode ranking

tags: [stochastic-calculus, derivatives, pricing]
prerequisites: [brownian-motion]      # directed edge; reverse is AUTOMATIC
related: [martingales]                # symmetric; declare on either side
tracks: []                            # usually unnecessary — see below
aliases: [Ito lemma, stochastic chain rule]   # extra search terms
minutes: 15
updated: 2026-01-14

references:
  - title: "Shreve, *Stochastic Calculus for Finance II*, ch. 4"
    url: ""

questions:                            # the interview bank lives HERE
  - q: Why does the second-order term survive in Itô's lemma?
    difficulty: advanced
    tags: [quadratic-variation]
    hint: What is the order of (dW)² ?
    a: |
      Because $(\d W)^2 = \d t$ rather than $O(\d t^2)$...
      Markdown and $maths$ both work in answers.
---
```

### Things that are derived, so you never write them twice

| You write | The build derives |
|---|---|
| `prerequisites: [brownian-motion]` | "Builds towards: Itô's Lemma" on the Brownian Motion page, and a directed graph edge |
| `related: [martingales]` | The relation appears on **both** pages |
| `[[some-concept]]` in prose | A link, a graph edge, and a related-concept entry |
| `:::formula` blocks | The Key Formulas section, the sidebar list, and formula search |
| `questions:` | Interview mode's drill, the question search index, and the page's Q&A section |
| `## Headings` | The table of contents and the scroll-spy |
| Nothing | Prev/next navigation, ordered by prerequisite depth then difficulty |

### About tracks

You rarely need `tracks:`. Interview tracks in `content/tracks.json` pick concepts up automatically
by subject and tag, filtered by a minimum relevance. Use `tracks:` only to force a concept into a
track it wouldn't otherwise match.

---

## 3. Writing the body

Standard Markdown, plus five additions.

### Mathematics

```markdown
Inline $\E[X \mid Y]$ and display:

$$\d S_t = \mu S_t\,\d t + \sigma S_t\,\d W_t$$
```

Rendered by KaTeX, vendored locally — no network. `$5 billion` is safely *not* treated as maths,
`_` / `*` inside `$...$` are never mistaken for emphasis, and an inline formula may wrap across a
line — prose here is hard-wrapped, so formulas near the margin routinely straddle a newline.

Shorthand macros are predefined: `\E` `\Var` `\Cov` `\Corr` `\P` `\R` `\d` `\1` `\argmin`
`\argmax`. Add more in `assets/js/math.js`.

### Key formula boxes

```markdown
:::formula {name="Variance" used-in="Risk, Portfolio Theory" note="Optional one-liner."}
\Var(X) = \E[X^2] - \E[X]^2
:::
```

Renders as a boxed formula **and** registers it in the formula index, so searching `variance`
returns the formula itself, not just the page.

### Concept links

```markdown
See [[bayes-theorem]] for the inversion, or [[variance|the second moment]].
```

Resolved at build time against real concept ids. A link to a concept that doesn't exist yet renders
in red with a build warning telling you which id is missing — a deliberate to-do marker, not an error.
**Wiki links also create graph edges**, so the knowledge graph reflects what you actually wrote.

Answers and prose are written as several paragraphs, and blank lines inside a `|` block are
preserved — separate a paragraph with a blank line and you get a paragraph.

### Callouts and collapsible derivations

```markdown
:::derivation Step-by-step proof
Long working goes here, collapsed by default so the page stays scannable.
:::

:::insight     ← green   :::warning / :::pitfall  ← red
:::assumption  ← purple  :::desk                  ← amber ("on the desk")
:::note :::tip :::proof :::example :::intuition
```

### Interactive modules

```markdown
:::module random-walk
{"paths": 40, "sigma": 0.2}
:::
```

The build finds `assets/js/modules/random-walk.js`, adds the script tag, and mounts the module with
that config. If the file doesn't exist you get a build warning. Available today: `random-walk`,
`bayes-explorer`, `regression-lab`, `distribution-explorer`, `diversification-lab`. Writing a new one is documented in
[ARCHITECTURE.md](ARCHITECTURE.md#interactive-modules).

### Jargon tooltips

```markdown
The ?[carry](return earned from holding a position, absent price change) is negative here.
```

---

## 4. Section structure

Use `##` headings from this list. The build maps them to stable ids, builds the table of contents,
and warns if a recommended one is missing. Natural variants are accepted (`Quick Revision`,
`TL;DR` and `30-Second Revision` all map to the same section).

| Heading | Recommended | What belongs there |
|---|:---:|---|
| `## Intuition` | ● | The mechanism, in plain English. No formulas. |
| `## Mathematical Formulation` | ● | Precise statement; define every symbol. |
| `## Derivation` | | Working, usually inside `:::derivation`. |
| `## Assumptions & Edge Cases` | | What must hold, and what breaks first with real data. |
| `## Worked Example` | ● | Actual numbers, arithmetic shown. |
| `## Why It Matters in Quant Finance` | ● | The link from mathematics to the domain. |
| `## Trading & Research Application` | ● | Where it shows up on a desk. |
| `## Implementation Notes` | | Short, correct, runnable code. |
| `## Common Mistakes` | ● | What candidates get wrong. |
| `## 30-Second Revision` | ● | Bullets you can review before a call. |

You never write **Key Formulas**, **Interview Questions** or **Connections** — those are generated.

Extra headings outside the list are fine and appear in document order.

---

## 5. Build and check

```bash
npm run build     # or: npm run watch, which rebuilds as you save
npm run check     # coverage, gaps, thin pages, orphans, missing questions
```

`npm run check` is the useful one before a study session. It reports:

- concept counts per subject and per interview track
- **orphans** — concepts with no prerequisites, relations or inbound links
- **thin pages** under 250 words
- interview-relevant concepts (4★+) with **no questions**
- maths concepts with no `:::formula` block
- every build warning

Errors (a missing subject, a duplicate id, unparseable frontmatter) fail the build and name the
file. Warnings never block you — a half-written page still builds and is still navigable.

---

## 6. Claude conversation → knowledge base

This repository is designed for the loop: *learn something with Claude → decide it's worth keeping →
turn it into a page.*

```
long Claude conversation
        │  save it verbatim
        ▼
raw/claude-conversations/2026-01-14-kelly-criterion.md      (never published)
        │  npm run new -- "Kelly Criterion" -s portfolio-construction \
        │                 --from raw/claude-conversations/2026-01-14-kelly-criterion.md
        ▼
content/concepts/kelly-criterion.md                          (template + raw material)
        │  rewrite into the template — this is the step that matters
        ▼
npm run build  →  indexed, linked, searchable, graphed, drillable
```

### Step by step

**1. Save the raw conversation.** Drop it in `raw/claude-conversations/` with a dated filename.
That directory is source material — the build ignores it entirely and nothing there is ever
published.

**2. Scaffold with `--from`.** The raw text is inserted into the template as a block quote under
*Intuition*, clearly marked as material to rewrite:

```bash
npm run new -- "Kelly Criterion" \
  --subject portfolio-construction \
  --relevance 5 \
  --prereqs expectation,variance \
  --tags sizing,leverage,compounding \
  --from raw/claude-conversations/2026-01-14-kelly-criterion.md
```

**3. Rewrite — do not paste.** A conversation is a transcript; a concept page is a reference. The
work is compression:

- Turn the explanation into `## Intuition`, in your own words. If you can't, you haven't learned it.
- Extract the formulas that mattered into `:::formula` blocks.
- Keep one worked example with real numbers; drop the rest.
- Turn the questions you got wrong into `questions:` entries — those are the highest-value
  content in the whole system, because they mark your actual gaps.
- Add `prerequisites:` and `[[links]]` to concepts you already have. This is what turns a pile of
  pages into a graph.
- Write the 30-second revision last, and make it genuinely 30 seconds.

**4. Build, then check it looks right** at `concepts/kelly-criterion.html`, in the graph, and in
interview mode.

### A prompt that works

When you want Claude to do the first-draft conversion, paste the concept template and ask for the
target format explicitly:

> Convert our conversation into a page for my quant knowledge base. Use exactly this template
> [paste `templates/concept.template.md`]. Rules: (1) `summary` is one sentence; (2) every `:::formula`
> block holds a formula I should be able to write from memory; (3) the worked example uses concrete
> numbers with the arithmetic shown; (4) include 3–5 `questions:` an interviewer would actually ask,
> with full model answers; (5) `## Common Mistakes` covers what candidates get wrong, not what
> beginners get wrong; (6) link related concepts as `[[concept-id]]` — the ids that exist are:
> [paste the output of `node -e "console.log(require('./data/kb.json').concepts.map(c=>c.id).join(', '))"`].

Then read what comes back critically and edit it. The knowledge base is only as good as the
scepticism applied at this step.

---

## 7. Adding a subject

Append to `content/subjects.json`:

```json
{
  "id": "credit",
  "name": "Credit",
  "group": "markets",
  "color": "#c07f3e",
  "order": 335,
  "description": "Default risk, spreads, structural and reduced-form models, CDS mechanics."
}
```

`group` buckets it on the dashboard (`mathematics`, `modelling`, `strategy`, `markets`, `craft`);
`order` sets position. A subject page is generated for it immediately, empty until concepts point at
it.

You can also skip this entirely: give a concept `subject: credit` and the build generates a stub
subject with a warning telling you to declare it properly. Nothing blocks.

## 8. Adding an interview track

Append to `content/tracks.json`:

```json
{
  "id": "commodities",
  "name": "Commodities Quant",
  "order": 90,
  "min_relevance": 3,
  "description": "Storage, seasonality, curve dynamics, and physical-versus-financial constraints.",
  "subjects": ["time-series", "derivatives", "risk-management"],
  "tags": ["seasonality", "carry"]
}
```

It appears in interview mode on the next build, populated with every concept matching those subjects
or tags at or above `min_relevance`. No code changes.

---

## Conventions

- **Ids are permanent.** Other pages link to them. Renaming an id breaks those links (the build will
  warn you, but fixing it is manual).
- **British or American spelling** — pick one and be consistent; search stems both `-s` and `-ies`
  but not `-ise`/`-ize`.
- **Depth over breadth.** A page that treats one concept properly — assumptions, edge cases, what
  breaks in practice — is worth ten summaries. The pages in this repository are meant as the
  standard, not the ceiling.
- **Write the failure modes.** For interview preparation, "here is where this goes wrong in
  practice" is more valuable than another restatement of the definition. It is also what
  distinguishes a candidate who has used a technique from one who has read about it.
- **Commit `data/` and the generated HTML.** They are build output, but committing them keeps the
  repository double-clickable straight from a fresh clone.
