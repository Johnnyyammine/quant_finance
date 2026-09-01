# Raw conversations

Source material, not content. **Nothing in this directory is ever published or indexed** — the build
ignores `raw/` entirely.

## Why keep them

A long conversation with Claude contains more than the page you distil from it: the wrong turns, the
question you couldn't answer, the follow-up that cracked it. The page keeps the conclusion; this
directory keeps the working.

## Convention

```
raw/claude-conversations/YYYY-MM-DD-topic.md
```

Include enough front matter to find it later:

```markdown
# Kelly Criterion — why maximise log wealth?
Date: 2026-01-14
Became: content/concepts/kelly-criterion.md
Status: distilled            (or: partial / not yet)
```

## The workflow

```bash
# 1. save the conversation here, verbatim
# 2. scaffold a concept seeded from it
npm run new -- "Kelly Criterion" \
  --subject portfolio-construction \
  --relevance 5 \
  --prereqs expectation,variance \
  --tags sizing,leverage,compounding \
  --from raw/claude-conversations/2026-01-14-kelly-criterion.md

# 3. rewrite the seeded block quote into the template. This is the step that matters.
# 4. npm run build
```

Full guidance, including a prompt that produces a good first draft, is in
[CONTRIBUTING.md §6](../../CONTRIBUTING.md#6-claude-conversation--knowledge-base).

## The one rule

**Rewrite, don't paste.** A transcript is a record of thinking; a concept page is a reference you
will read under time pressure the night before an interview. The compression from one to the other
*is* the learning. If you cannot write the intuition section in your own words, the conversation
hasn't finished doing its job yet.
