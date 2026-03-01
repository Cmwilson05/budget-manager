---
name: boris-tane-workflow
description: "Use this skill when you want to follow Boris Tane's research-plan-implement workflow for AI-assisted coding. Trigger when: (1) you're building a feature in an existing codebase; (2) you want to use Claude Code/Claude with a structured approach; (3) you're struggling with AI implementations that don't fit your system; (4) you want to reduce token usage while improving code quality; (5) you want to maintain control while delegating implementation. Also trigger when the user mentions 'annotation cycle', 'Boris Tane', 'plan-first coding', 'research-plan-implement', or asks how to work effectively with Claude for coding tasks."
---

# Boris Tane's Research-Plan-Implement Workflow

## Quick Start

**One-sentence summary**: Never let Claude write code until you've reviewed and approved a detailed written plan that's been iteratively refined through an annotation cycle.

**Three-step entry point**:
1. **Read deeply** — Understand the existing code/system thoroughly, write findings into a persistent research document
2. **Write and annotate a plan** — Get Claude to draft a detailed plan, then add inline notes until it's perfect (1–6 iteration cycles)
3. **Implement mechanically** — Once the plan is approved, let Claude execute the entire implementation without interruption, marking progress in the plan document

## Why This Workflow Exists

The most expensive failure mode with AI-assisted coding is not syntax errors or logic bugs. It's implementations that work in isolation but break the surrounding system:
- A function that ignores an existing caching layer
- A database migration that doesn't account for the ORM's conventions
- An API endpoint that duplicates logic that already exists elsewhere
- A new component that violates existing architectural patterns

This workflow prevents all of these by separating **thinking** from **typing**:
- **Research** prevents ignorant implementations (Claude doesn't understand the system)
- **Planning** prevents wrong-direction implementations (technically correct but architecturally wrong)
- **Annotation cycle** injects human judgment into every decision
- **Implementation** becomes mechanical execution of a validated plan

## Core Principle: Separating Thinking from Typing

The workflow is built on one insight: **human judgment and AI execution are not the same thing.**

Claude excels at:
- Understanding existing code
- Proposing solutions
- Writing implementations
- Following detailed instructions

Claude *cannot* know:
- Your product priorities
- Your users' pain points
- Your engineering culture
- The trade-offs you're willing to make
- Why a particular architectural decision matters

This workflow inserts human judgment at three critical points: research verification, plan annotation, and selective implementation feedback. It lets Claude handle the mechanical execution while you make the important decisions.

---

# Phase 1: Research — The Foundation for Everything

## Purpose

Before any planning happens, you must deeply understand the relevant part of the codebase or system. This understanding goes far beyond reading function signatures and summaries—it's about understanding *how the system works, what it does, and why it was designed that way*.

The research phase produces a persistent artifact (a markdown file) that serves as your review surface. You verify that Claude actually understood the system before moving forward. If the research is wrong, the plan will be wrong, and the implementation will be wrong.

## Execution Pattern

Use this directive to signal to Claude that skimming is unacceptable:

```
"read this [folder/system/component] in depth, understand how it works
deeply, what it does and all its specificities. when that's done, write
a detailed report of your learnings and findings in research.md"
```

## Critical Language: Signal Depth is Required

The specific words you use matter enormously. Without deliberate language, Claude will skim, read function signatures, and move on without real understanding.

**Use these words deliberately:**
- **"deeply"** — Signal that surface-level reading is not acceptable
- **"in great details"** — Demand comprehensive coverage
- **"intricacies"** — Request exploration of subtle, non-obvious behaviors
- **"go through everything"** — Prevent premature truncation
- **"understand how it works"** — Not just what it does, but why

**Example directives that work:**
```
"study the notification system in great details, understand the
intricacies of it and write a detailed research.md document with
everything there is to know about how notifications work"

"go through the task scheduling flow, understand it deeply and look
for potential bugs. keep researching the flow until you find all the
bugs, don't stop until all the bugs are found. when you're done,
write a detailed report of your findings in research.md"
```

## Why Written Output is Essential

Creating a persistent `research.md` artifact serves multiple purposes:

1. **Review surface for verification** — You can read it and verify Claude actually understood the system, correct misunderstandings before they cascade
2. **Prevents garbage-in-garbage-out failures** — Wrong research → wrong plan → wrong implementation
3. **Establishes shared understanding** — Both you and Claude have the same mental model of the system

## What the Research Document Should Cover

A good research document includes:
- How the system works (architecture, data flow, key components)
- What it does (purpose, primary and secondary responsibilities)
- Why it was designed this way (design decisions, trade-offs)
- Edge cases and failure modes
- Existing patterns and conventions
- Integration points with other parts of the system

## Red Flags: When Research is Insufficient

- Function names and signatures are described but not *why* they exist
- Only the happy path is documented; edge cases are missing
- The document reads like API documentation, not system understanding
- Questions like "why would this cache exist?" or "what breaks if this field changes?" go unanswered

---

# Phase 2: Planning — Specification Without Implementation

## Purpose

Once research has been reviewed and validated, you request a detailed implementation plan in a separate markdown file. This plan is not pseudocode—it's a detailed specification that includes the approach, code snippets, file paths, and considerations.

## Planning Request Patterns

**For new features:**
```
"I want to build a new feature <name and description> that extends
the system to perform <business outcome>. write a detailed plan.md
document outlining how to implement this. include code snippets"
```

**For modifications to existing features:**
```
"the list endpoint should support cursor-based pagination instead of
offset. write a detailed plan.md for how to achieve this. read source
files before suggesting changes, base the plan on the actual codebase"
```

## Plan Document Structure

The resulting plan should always include:
- **Approach** — Detailed explanation of the strategy
- **Code snippets** — Actual code showing what will change
- **File paths** — Specific files that will be modified
- **Considerations** — Trade-offs, edge cases, potential issues
- **Todo list** — Granular task breakdown (added later, before implementation)

## Why Custom Markdown Plans Over Built-in Plan Mode

Use markdown files instead of your tool's built-in plan mode because:

1. **Full control** — Edit the plan in your preferred editor
2. **Persistence** — It exists as a real artifact in the project, not trapped in a tool
3. **Editability** — Add inline notes, corrections, annotations
4. **Clarity** — A structured markdown document is easier to review holistically than chat messages

## Using Reference Implementations

For well-contained features where you've seen a good implementation in an open source repo, share that code alongside the plan request:

```
"this is how they do sortable IDs, write a plan.md explaining how
we can adopt a similar approach"
```

**Why this works**: Claude dramatically outperforms when given a concrete reference implementation rather than designing from scratch.

---

# Phase 2.5: The Annotation Cycle — The Most Distinctive Element

This is the most innovative part of the workflow and where you add the most value.

## The Annotation Cycle Flow

```
Claude writes plan.md
    ↓
You review in your editor & add inline notes
    ↓
You send Claude back: "I added notes, address all notes and update"
    ↓
Claude updates plan.md
    ↓
Satisfied? → Yes: Request todo list | No: Repeat cycle
```

The cycle typically repeats **1 to 6 times**.

## How It Works

After Claude writes the plan, you open it in your editor and add inline notes directly into the markdown file. These notes correct assumptions, reject approaches, add constraints, or provide domain knowledge Claude doesn't have.

**Types of annotations you might write:**

1. **Domain knowledge** — `"use drizzle:generate for migrations, not raw SQL"`
2. **Correcting assumptions** — `"no — this should be a PATCH, not a PUT"`
3. **Rejecting approaches** — `"remove this section entirely, we don't need caching here"`
4. **Explaining context** — `"the queue consumer already handles retries, so this retry logic is redundant. remove it and just let it fail"`
5. **Structural corrections** — `"this is wrong, the visibility field needs to be on the list itself, not on individual items. when a list is public, all items are public. restructure the schema section accordingly"`

**Example annotation:**
```markdown
### Current Plan Section
The API should support both read and write caching with
a 5-minute TTL and a maximum of 1000 entries.

[ANNOTATION: no — cache reads only. writes should
bypass the cache entirely. reads are 90% of traffic,
writes are 10%. the complexity of write-through
caching isn't worth 10% of traffic.]
```

## The Critical Guard: "Don't Implement Yet"

After each update request, always add an explicit guard:

```
"I added notes, address all notes and update the document. don't implement yet"
```

**Why this is essential**: Without this explicit statement, Claude will jump to code the moment it thinks the plan is adequate. The guard ensures Claude stays in planning mode.

## Why This Works So Well

The markdown plan acts as **shared mutable state** between you and Claude:
- You can think at your own pace
- Annotations point to exact spots in the document where issues exist
- Context persists without scrolling through chat history
- The plan becomes a structured, complete specification

**Contrast with chat-based steering**: Chat conversations are sequential and require scrolling to reconstruct decisions. Plan documents are spatial and reviewable at a glance.

## Iteration Until Ready

Three rounds of annotation can transform a generic, technically-sound plan into one that:
- Fits perfectly into the existing system
- Respects existing interfaces and patterns
- Incorporates product priorities
- Reflects user pain points
- Makes appropriate engineering trade-offs

## Creating the Todo List

Before implementation starts, request a granular task breakdown:

```
"add a detailed todo list to the plan, with all the phases and
individual tasks necessary to complete the plan - don't implement yet"
```

This creates a checklist that:
- Serves as a progress tracker during implementation
- Claude marks items as completed as it goes
- You can glance at the plan and see current status
- Especially valuable in long sessions (multiple hours)

---

# Phase 3: Implementation — Mechanical Execution

## When Implementation Should Be Boring

By the time you issue the implementation command, every architectural decision has been made and validated. Implementation becomes mechanical, not creative. This is deliberate and important.

**If implementation is uncertain or creative, the planning phase wasn't thorough enough.**

## The Implementation Command

Once the plan is final and approved, use this standard prompt:

```
"implement it all. when you're done with a task or phase, mark it as
completed in the plan document. do not stop until all tasks and phases
are completed. do not add unnecessary comments or jsdocs, do not use
any or unknown types. continuously run typecheck to make sure you're
not introducing new issues."
```

## What Each Phrase Encodes

| Phrase | Purpose |
|--------|---------|
| `"implement it all"` | Execute everything in the plan, no cherry-picking |
| `"mark it as completed in the plan document"` | The plan remains the source of truth for progress |
| `"do not stop until all tasks and phases are completed"` | No pausing for mid-flow confirmation |
| `"do not add unnecessary comments or jsdocs"` | Keep code clean and readable |
| `"do not use any or unknown types"` | Maintain strict typing (prevents sloppy type usage) |
| `"continuously run typecheck"` | Catch problems early, not at the end |

## Why This Works

Without a thorough planning phase, Claude typically:
1. Makes a reasonable-but-wrong assumption early on
2. Builds on top of that assumption for 15+ minutes
3. You have to unwind a chain of cascading changes

**The solution**: The "don't implement yet" guard + annotation cycle eliminates this entirely by ensuring every decision is validated before coding begins.

---

# Phase 3 Feedback: Supervision, Not Direction

Once Claude is executing, your role shifts from architect to supervisor. Prompts become dramatically shorter and more terse.

## Feedback Pattern

```
Claude implements
    ↓
You review / test
    ↓
Correct?
    → Yes: More tasks?
            → Yes: Continue | No: Done
    → No: Send terse correction → Claude implements correction
```

## Feedback Style

- **Planning phase**: Paragraph-length notes with context
- **Implementation phase**: Single-sentence corrections

**Examples of implementation-phase feedback:**
- `"You didn't implement the deduplicateByTitle function."`
- `"You built the settings page in the main app when it should be in the admin app, move it."`

**Why terse feedback works**: Claude has full context of the plan and ongoing session, so brevity is sufficient.

## Frontend-Specific Iteration

Frontend work is the most iterative. Test in the browser and fire off rapid corrections:
- `"wider"`
- `"still cropped"`
- `"there's a 2px gap"`

For visual issues, attach screenshots—they communicate the problem faster than description.

## Pattern-Based Guidance

Reference existing code constantly:
```
"this table should look exactly like the users table, same header,
same pagination, same row density"
```

**Why**: Most features in mature codebases are variations on existing patterns. Pointing to a reference implementation communicates all implicit requirements without spelling them out.

## Scope Reset Strategy

When something goes in a wrong direction, don't try to patch it incrementally:

```
"I reverted everything. Now all I want is to make the list view
more minimal — nothing else."
```

**Why this works better than incremental fixes**: Narrowing scope after a revert almost always produces better results than trying to fix a bad approach incrementally.

---

# Staying in the Driver's Seat: Selective Autonomy

Even though implementation is delegated to Claude, you maintain control over *what gets built*.

## The Decision Framework

```
Claude proposes changes
    ↓
You evaluate each item
    ↓
Decision: Accept as-is | Modify | Skip | Override technical choice
    ↓
Refined implementation scope
```

## Control Mechanisms

### Cherry-Picking from Proposals

When Claude identifies multiple issues, evaluate each one:

```
"for the first one, just use Promise.all, don't make it overly
complicated; for the third one, extract it into a separate function
for readability; ignore the fourth and fifth ones, they're not
worth the complexity"
```

**Principle**: Item-level decisions based on broader project knowledge.

### Trimming Scope

Actively cut nice-to-haves:
```
"remove the download feature from the plan, I don't want to
implement this now"
```

**Prevents scope creep** while maintaining momentum.

### Protecting Existing Interfaces

Set hard constraints when interfaces shouldn't change:
```
"the signatures of these three functions should not change,
the caller should adapt, not the library"
```

**Rationale**: Changing function signatures could break dependent code elsewhere.

### Overriding Technical Choices

When you have specific preferences Claude wouldn't know:
```
"use this model instead of that one"
"use this library's built-in method instead of writing a custom one"
```

**Speed and specificity**: Direct overrides are faster than explaining reasoning.

## The Judgment Distribution

- **Claude handles**: Mechanical execution, code writing, system understanding
- **You handle**: Judgment calls, product priorities, engineering culture, trade-offs

---

# Single Long Sessions vs. Multiple Sessions

## The Recommended Approach

Run research, planning, and implementation in a **single continuous session** rather than split across separate sessions.

**Example flow**: Deep-read a folder → 3 rounds of plan annotation → Full implementation, all in one conversation.

## Why Single Sessions Work

By the time you say "implement it all," Claude has spent the entire session building understanding:
- Reading files during research
- Refining its mental model during annotation cycles
- Absorbing your domain knowledge corrections

This accumulated context produces significantly better implementations than starting fresh in a new session.

## Context Window Management

When the context window fills up, Claude's auto-compaction maintains enough context to continue. **Critical**: The plan document (persistent artifact) survives compaction in full fidelity. You can point Claude back to it at any time for reference.

---

# Common Failure Modes: What This Workflow Prevents

| Failure Mode | What Goes Wrong | How This Workflow Prevents It |
|--------------|-----------------|-------------------------------|
| **Ignorant implementations** | Claude doesn't understand the system, writes code that ignores caching, ORM conventions, existing patterns | **Research phase** with verification artifact ensures understanding before changes |
| **Wrong-direction implementations** | Claude proposes technically correct but architecturally wrong approach | **Plan + annotation cycle** ensures approach matches system design and priorities |
| **Cascading assumptions** | Claude makes a wrong assumption early, builds on it for 15 minutes, requires unwinding | **"Don't implement yet" guard** keeps Claude in planning mode until every decision is validated |
| **Context loss** | Decisions made early in session are forgotten or reconstructed incorrectly | **Persistent plan artifact** survives context window compression, serves as reference at any time |
| **Scope creep** | Claude adds nice-to-haves that expand scope unnecessarily | **Selective cherry-picking & scope trimming** lets you actively remove items |

---

# FAQ: When to Use This Workflow (and When to Skip It)

## ✅ Use This Workflow When

- Building a medium-to-large feature (small bug fixes don't need this rigor)
- Feature touches multiple files or systems
- Existing patterns in the codebase to reference
- Long implementation session (multiple hours)
- Mature codebase with established conventions
- You want lower token usage overall (upfront planning saves debugging later)
- You care deeply about maintaining control over the architecture

## ⏭️ Skip This Workflow When

- **Trivial changes** — Single-line bug fix, obvious typo, simple rename
- **Exploring unknown territory** — Prototyping to figure out if something is possible (use this after you know what you want)
- **You don't understand the codebase yet** — Research phase comes first; use it to gain understanding
- **No existing patterns** — Brand new system with no established conventions (plan is still useful; research phase is shorter)

## ❓ Common Questions

**Q: Doesn't the research phase take too long?**
A: It front-loads effort where it matters most. Yes, it takes longer upfront. But you save that time 10x over in not debugging cascading mistakes. The total time is lower.

**Q: What if the plan is wrong after I start implementing?**
A: That's the whole point of the annotation cycles. You catch it *before* implementation. If something comes up during implementation, it's a small issue, not a cascading problem.

**Q: Can I do research and planning in separate sessions?**
A: You can, but single sessions produce better results. Claude builds understanding cumulatively. If you split sessions, you lose some context richness.

**Q: What if I don't have time for the full workflow?**
A: At minimum, do research + one planning iteration. Even a quick plan prevents the most expensive mistakes.

---

# How This Skill Was Built

This skill was created using the exact workflow it teaches. The approach was:

1. **Research phase** — Deep reading of Boris Tane's "How I Use Claude Code" article, extraction of findings into a research document
2. **Planning phase** — Design of the skill structure, content, and supporting documents
3. **Annotation cycle** — Review and refinement of the plan before implementation
4. **Implementation** — Creation of all skill files with references to the research document
5. **Showboat documentation** — The entire process was documented with a showboat document showing every step and command

This meta-application demonstrates that the workflow actually works. The skill is proof of its own methodology.

---

# Reference Materials

This skill references several supporting documents and the original research:

- **research-checklist.md** — Practical checklist for the research phase
- **plan-template.md** — Template for writing a plan document
- **annotation-guide.md** — Guidance on writing effective annotations
- **The original article** — "How I Use Claude Code" by Boris Tane (boristane.com, published 2026-02-10)
- **Research document** — Comprehensive analysis of the workflow (research.md)

For complete context on the workflow, including detailed examples and failure mode analysis, refer to the accompanying research document.