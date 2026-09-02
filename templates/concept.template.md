---
# ─────────────────────────────────────────────────────────────────────────────
#  CONCEPT TEMPLATE — copy me to content/concepts/<id>.md
#  Or don't copy anything: run  npm run new -- "Itô's Lemma" -s stochastic-processes
#  Every field below is optional except `subject`. Delete what you don't need.
# ─────────────────────────────────────────────────────────────────────────────

# Stable identifier. Defaults to the filename. Never change it after you have
# linked to it — other pages reference this id.
id: concept-id

title: Concept Title

# Must match an id in content/subjects.json. An unknown subject still builds:
# the build generates a stub subject and warns you.
subject: probability

# One sentence. Shown under the title, in search results and on cards.
# This is the "if you remember nothing else" line.
summary: A single sentence that defines the concept precisely.

# foundational | intermediate | advanced | research
difficulty: intermediate

# 0–5. Drives Interview Mode ranking and the ★ display.
interview_relevance: 3

# Free-form. Tags are indexed, filterable and cross-subject.
tags: [tag-one, tag-two]

# Ids of concepts you should understand BEFORE this one. Creates directed
# graph edges and the "Prerequisites" block. The reverse edge ("Builds
# towards") is generated automatically on the other page — never write it twice.
prerequisites: []

# Sibling concepts worth reading alongside. Symmetric: declaring it here also
# shows this concept on the other page.
related: []

# Optional: force membership of an interview track (content/tracks.json).
# Usually unnecessary — tracks pick concepts up by subject and tag.
tracks: []

# Alternative names people search for ("vol", "stdev", "sigma").
aliases: []

# Roughly how long a focused read takes, in minutes.
minutes: 12

updated: 2026-01-01

references:
  - title: "Author, *Book Title*, ch. 4"
    url: ""

# Interview questions live WITH the concept — one file, no separate question
# bank to keep in sync. They are extracted into Interview Mode and search.
questions:
  - q: A crisp question an interviewer would actually ask.
    difficulty: intermediate
    tags: [brainteaser]
    hint: One nudge, not the answer.
    a: |
      The model answer, in markdown. Math works here too: $E[X] = \mu$.

      Explain the reasoning, not just the result — that is what gets graded.
---

<!--
  BODY. Use `## ` headings from the canonical list below; the build maps them
  to stable section ids, builds the table of contents, and warns if a
  recommended one is missing. Extra headings are allowed and kept in order.

    Intuition · Mathematical Formulation · Derivation · Assumptions & Edge Cases
    Worked Example · Why It Matters in Quant Finance · Trading & Research
    Application · Implementation Notes · Common Mistakes · 30-Second Revision

  You do NOT write these sections — they are generated: Key Formulas (from
  ::: formula blocks), Interview Questions (from frontmatter), Connections
  (from prerequisites/related/links).

  Authoring extras:
    $x^2$ and $$\int_0^T ...$$   inline / display maths (KaTeX, offline)
    [[concept-id]]               link to another concept (also creates a graph edge)
    [[concept-id|custom text]]   ...with your own label
    ?[term](definition)          hover tooltip for jargon
    ::: formula / derivation / note / warning / insight / pitfall /
        assumption / example / desk / module / grid
-->

## Intuition

Explain it the way you would to a smart colleague who has not seen it before.
No formulas yet. What is the *mechanism*? What would go wrong without it?

## Mathematical Formulation

State it precisely. Define every symbol.

:::formula {name="The central result" used-in="Risk, Portfolio Construction"}
f(x) = \int_{-\infty}^{\infty} g(t)\,e^{-itx}\,dt
:::

## Derivation

:::derivation Step-by-step derivation
Long derivations go inside a collapsible block so the page stays scannable.

1. Start from the definition.
2. Apply the key trick.
3. Simplify.
:::

## Assumptions & Edge Cases

:::assumption
- Assumption one, and what breaks when it fails.
- Assumption two — usually the one that fails first with real market data.
:::

## Worked Example

A concrete numerical example with actual numbers. Show the arithmetic.

## Why It Matters in Quant Finance

Connect the mathematics to the domain. Be specific.

## Trading & Research Application

:::desk
Where this shows up in a real research or trading workflow — which model,
which decision, which failure mode it prevents.
:::

## Implementation Notes

```python
import numpy as np

def example(x: np.ndarray) -> float:
    """Keep snippets short, correct and runnable."""
    return float(np.mean(x))
```

## Common Mistakes

:::pitfall
- The mistake almost every candidate makes.
- The subtler one that separates good from great.
:::

## 30-Second Revision

- Three to five bullets.
- The formula you must be able to write from memory.
- The one assumption that matters most.
