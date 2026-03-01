---
name: boris-tane-learnerflow
description: "Use this skill when the user wants to build something they don't fully understand yet, or wants to learn while coding rather than just get code written. Trigger when: (1) the user mentions being new to a technology or codebase ('I don't really know how X works but I want to build Y'); (2) the user asks to understand, not just get a result ('explain as we go', 'I want to learn this', 'walk me through it'); (3) the user is exploring an unfamiliar framework, codebase, or pattern for the first time; (4) the user is a self-described beginner, student, or learner. Also trigger on 'learnerflow', 'learn while building', 'guided coding session', 'boris-tane learner'. Use this instead of boris-tane-workflow when the user is the student rather than the expert — the annotation cycle becomes Socratic dialogue rather than expert correction."
---

# Boris Tane Learnerflow

## Quick Start

**One-sentence summary**: Same research-plan-implement structure as the Boris Tane Workflow — but the annotation cycle becomes Socratic dialogue. The user's job isn't to be right; it's to keep asking `[Q:]` until they understand.

**Three-step entry point**:
1. **Read as a learner** — Claude researches the system and writes for someone new; you read and mark every point of confusion with `[Q: ...]`
2. **Dialogue until you understand** — Claude answers inline with `[A: ...]`; you don't approve the plan until you can follow the reasoning
3. **Build with narration** — Claude implements and explains each significant move; a Showboat retrospective at the end captures the learning arc

## How This Differs from BTW

| Boris Tane Workflow | Learnerflow |
|---|---|
| User verifies Claude understood the system | User reads research and asks what they don't understand |
| User corrects the plan with expert judgment | User asks questions until the plan makes sense |
| Terse authoritative annotations | `[Q:] / [A:]` dialogue threads |
| Guard: "don't implement yet" | Guard: "answer all [Q:] first — wait for my 'approved'" |
| Implementation: mechanical execution | Implementation: narrated execution with Implementation Notes |
| Showboat: optional | Showboat: built-in learning retrospective |

**The core insight**: In BTW, the user is the architect reviewing Claude's work. In Learnerflow, the user is the student — and the document is where the teaching happens.

---

## The `[Q:] / [A:]` Dialogue Syntax

This is the core mechanic of the workflow. When you encounter something you don't understand — in the research doc, the plan, or mid-implementation — mark it inline:

```
[Q: why do we need a migration here? what is a migration?]
```

Claude responds directly below:

```
[A: a migration is a versioned script that changes the database's
structure — adds a column, renames a table, creates an index. you
need one here because your code expects a column that doesn't exist
yet in the database. without the migration, the column isn't there,
and the query crashes. the migration runs once when you deploy, adds
the column, and from that point the code and database match.]
```

**Rules for the dialogue**:
- Place `[Q:]` exactly where the confusion lives — spatial context matters
- Don't delete old `[Q:] / [A:]` threads — they accumulate and become source material for the Showboat retrospective
- Multiple questions at the same spot are fine: add a second `[Q:]` below the first
- The guard after every submission: `"answer all [Q:] items — don't implement yet"`

For annotated examples of effective vs. weak questions, see `references/dialogue-examples.md`.

---

# Phase 1: Research — Teachable, Not Technical

## Purpose

Claude reads the system deeply and writes a research document oriented toward someone new. Not a summary of what functions exist — an explanation of *how the system works, why it was designed that way*, and what a learner needs to understand before touching it.

## Directive Pattern

```
"read [folder/system/component] deeply. when you're done, write a
research.md that explains it to someone new to this codebase. include
not just what each piece does, but why it was designed this way, what
would break without it, and any key concepts a newcomer needs to
understand. go through everything — don't skim."
```

## Your Job: Read and Ask

After Claude writes `research.md`, read it top to bottom. Mark every point of confusion with `[Q:]`. Don't try to evaluate whether the research is correct — you're not there yet. Just identify what you don't understand.

Then send it back:

```
"I added questions — answer all [Q:] items inline. don't move forward yet."
```

Read the answers. If they create new questions, mark those too. Repeat until the research makes sense.

## Red Flags: Research That Isn't Teaching

- Describes what functions exist but not why they exist
- Uses terms without defining them for a newcomer
- Only covers the happy path — no mention of what breaks or why things fail
- Reads like a technical spec, not an explanation

---

# Phase 2: Planning — Explained, Not Just Specified

## Purpose

Once you've worked through the research, Claude writes a plan that includes not just *what* will change but *why* — the trade-offs considered, alternatives rejected, and what could go wrong. Each significant step gets a Learning Note.

## Planning Request Pattern

```
"I want to build [feature/change]. write a plan.md explaining how to
implement this. for each significant step, include a Learning Note:
why this approach, what alternatives were considered, what could go
wrong. include code snippets. don't implement yet."
```

## What a Learning Note Looks Like

```markdown
### Step 3: Add the `published_at` column

We'll add a nullable `published_at` timestamp to the posts table.

**Learning Note**: We use nullable (can be empty) because posts are
created before they're published. A non-nullable column would require
a value at creation time, which we don't have yet. When a post is
published, we set this to the current timestamp. When it's null, the
post is a draft. This pattern — using null to represent "not happened
yet" — is common for event-like fields (sent_at, archived_at, etc.).
```

The Learning Note makes the *why* explicit. Questions you still have go in as `[Q:]` below the note — not in place of it.

---

# Phase 2.5: Dialogue Cycle — The Heart of the Workflow

This phase is structurally identical to BTW's annotation cycle, but the goal shifts from *correcting the plan* to *understanding the plan*.

## The Cycle Flow

```
Claude writes plan.md with Learning Notes
    ↓
You read — mark every [Q:] you have
    ↓
"answer all [Q:] items inline — don't implement yet"
    ↓
Claude updates plan.md with [A:] responses
    ↓
Understand everything?
    → Yes: move to Comprehension Check
    → No:  keep asking [Q:]
```

Typical cycles: **2 to 4 rounds**. More than 4 usually means a Learning Note is missing from the plan, not that you're slow.

## The Comprehension Check

Before implementation starts, you must be able to explain the plan back. Claude will ask:

```
"Before we build: in a sentence or two, what are we going to do and why?
No right answer — just what you've understood so far."
```

This step surfaces gaps you didn't know you had. If your explanation misses something important, Claude corrects it before any code is written. If it's basically right, you move to implementation.

The check works precisely because you don't know where your gaps are. Skipping it risks approving a plan you only *thought* you understood.

## Approving the Plan

Once the comprehension check passes:

```
"approved — implement it"
```

This is the only signal Claude should accept to start writing code. Without it, stay in dialogue.

---

# Phase 3: Guided Implementation

## Purpose

Claude executes the plan and explains each significant move as it goes. Unlike BTW's mechanical execution, this phase leaves a paper trail of what happened and why.

## Implementation Directive

```
"implement it. for each significant change, add a brief Implementation
Note to the plan — what you did and why. mark tasks complete as you go.
pause if you hit something not covered in the plan."
```

## You Can Still Ask

Drop a `[Q:]` in chat at any point during implementation:

```
[Q: you just used a LEFT JOIN — why not an INNER JOIN here?]
```

Claude answers. These exchanges are in chat, not in the plan doc (the plan is in execution now, not dialogue phase). Note them mentally — they'll feed the Showboat retrospective.

## When Implementation Should Pause

Claude should stop and check with you if:
- A decision arises that wasn't covered in the plan
- Something in the codebase contradicts the plan's assumptions
- An error suggests the plan had a wrong assumption

Don't push through — surface it, decide together, then continue.

---

# Showboat: Learning Retrospective

At the end of the session, run the Showboat skill to generate a learning retrospective — a narrative document that captures the arc from "I wanted to build X and didn't understand Y" to "here's what I built and here's what I learned."

## Directive

```
"run showboat for this session as a learning narrative. use the [Q:]/[A:]
threads from research.md and plan.md as source material. the narrative
arc should be: what I wanted to build → what I didn't understand → the
questions I asked and answered → what I understand now → what I built."
```

## What the Retrospective Captures

- **Starting point** — What you set out to build, what you knew and didn't know going in
- **Key learning moments** — The `[Q:]/[A:]` threads that unlocked understanding, quoted and annotated
- **The comprehension check** — What you were able to explain before implementation, and any gaps it caught
- **What was built** — The implemented result, linked to the plan
- **What changed** — Concrete things you understand now that you didn't at the start

This document is the learning artifact — not just proof that the code works, but proof that you understand why it works.

---

# FAQ

## When to use Learnerflow vs. BTW

**Use Learnerflow when**:
- You're building in a codebase or technology you're still learning
- You want to understand what's happening, not just get it working
- You'd struggle to evaluate whether Claude's research or plan is correct
- You want the session to teach you, not just produce output

**Use BTW when**:
- You know the codebase and can verify Claude's research is accurate
- You can tell when the plan is architecturally wrong
- You want terse, efficient control over the implementation

## "What if I understand some parts but not others?"

Start with Learnerflow. Once the research and plan phase has brought you up to speed, you can shift to BTW-style terse corrections for parts you understand. The two aren't mutually exclusive — they sit on the same spectrum, and you can slide between them within a single session.

## "Can I skip the comprehension check?"

You can, but it's the most valuable step. The check works precisely because you don't know what gaps you have. Skipping it risks approving a plan you only *thought* you understood. If you're short on time, keep the check and abbreviate the implementation notes instead.

## "What if I can't explain the plan back?"

That's fine — that's why the check exists. Claude will identify what's unclear and run another dialogue cycle on just that piece. It doesn't mean starting over. It means one more round of `[Q:]/[A:]` on the specific section that didn't land.

---

# Reference Materials

- `references/dialogue-examples.md` — Annotated examples of effective and weak `[Q:]/[A:]` threads
- **boris-tane-workflow** (related skill) — The expert-facing version of this workflow
- **showboat** (related skill) — The tool used to generate the learning retrospective
