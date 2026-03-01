# Research: How I Use Claude Code — Deep Analysis

**Source**: Boris Tane | boristane.com | Published 2026-02-10

---

## Executive Summary

This article presents a sophisticated, disciplined workflow for using Claude Code (an agentic coding tool) that fundamentally **separates thinking from execution**. The author has refined this approach over 9 months and prioritizes intentional human judgment over autonomous implementation. The core principle is simple but powerful: **never let Claude write code until you've reviewed and approved a detailed written plan**. This workflow consists of three phases—Research, Planning, and Implementation—with an iterative "annotation cycle" as the most distinctive contribution.

---

## Phase 1: Research — The Foundation for Everything

### Purpose & Philosophy
The research phase is the critical first step that prevents the most dangerous failure mode in AI-assisted coding: **implementations that work in isolation but break the surrounding system**.

**Key Insight**: Surface-level understanding is the enemy. The author explicitly signals to Claude that skimming is unacceptable through deliberate language choices.

### Execution Pattern
The author uses a consistent directive structure:
```
"read this [folder/system/component] in depth, understand how it works
deeply, what it does and all its specificities. when that's done, write
a detailed report of your learnings and findings in research.md"
```

### Critical Language Patterns
The article emphasizes that word choice matters enormously:
- **"deeply"** — signals depth is required, not a summary
- **"in great details"** — explicitly requests comprehensive coverage
- **"intricacies"** — demands exploration of subtle, non-obvious behaviors
- **"go through everything"** — prevents premature truncation

**The author's explicit claim**: Without this language, Claude will skim, read function signatures, and move on without real understanding.

### Why Written Output Matters
Creating a persistent `research.md` artifact is non-negotiable for several reasons:

1. **Review surface for human verification**: The artifact is *for the developer*, not homework for Claude. It allows the developer to:
   - Verify Claude actually understood the system
   - Identify misunderstandings before they cascade
   - Correct conceptual errors at the source

2. **Prevents garbage-in-garbage-out failures**: Wrong research → wrong plan → wrong implementation. This is the single most expensive failure mode.

3. **Specific examples of prevented failures**:
   - A function that ignores an existing caching layer
   - A database migration that doesn't account for the ORM's conventions
   - An API endpoint that duplicates logic that already exists elsewhere
   - A new component that violates existing architectural patterns

The research phase directly prevents all of these by establishing a shared, verified understanding of the system before any changes are proposed.

---

## Phase 2: Planning — Specification Without Implementation

### Planning Request Pattern
Once research has been reviewed and validated, the developer asks for a detailed plan:
```
"I want to build a new feature <name and description> that extends the
system to perform <business outcome>. write a detailed plan.md document
outlining how to implement this. include code snippets"
```

Or for modifications to existing features:
```
"the list endpoint should support cursor-based pagination instead of
offset. write a detailed plan.md for how to achieve this. read source
files before suggesting changes, base the plan on the actual codebase"
```

### Plan Document Contents
The resulting plan always includes:
- Detailed explanation of the approach
- Concrete code snippets showing actual changes
- Specific file paths that will be modified
- Considerations and trade-offs

### Why Markdown Plans Over Built-in Plan Mode
The author explicitly rejects Claude Code's built-in plan mode in favor of custom markdown files because:
1. **Full control** — The developer can edit the plan in their preferred editor
2. **Persistence** — It exists as a real artifact in the project, not trapped in a tool
3. **Editability** — Can add inline notes, annotations, corrections
4. **Clarity** — A structured markdown document is easier to review holistically than chat messages

### Reference Implementation Strategy
For well-contained features, the author uses a powerful tactic:
> "If I've seen a good implementation in an open source repo, I share that code as a reference alongside the plan request."

**Example approach**:
> "this is how they do sortable IDs, write a plan.md explaining how we can adopt a similar approach"

**Why this works**: Claude dramatically outperforms when given a concrete reference implementation rather than designing from scratch. It's significantly more effective than abstract requirements.

---

## Phase 2.5: The Annotation Cycle — The Most Distinctive Element

This is where the author adds the most value and demonstrates the deepest understanding of how to effectively work with AI.

### The Annotation Cycle Flow
```
Claude writes plan.md
    ↓
Developer reviews in editor & adds inline notes
    ↓
Developer sends Claude back: "I added notes, address all notes and update"
    ↓
Claude updates plan
    ↓
Satisfied? → Yes: Request todo list | No: Repeat cycle
```

The cycle typically repeats **1 to 6 times**.

### Annotation Mechanics
The developer opens the plan in their editor and adds inline notes directly into the markdown file. These notes:
- Correct assumptions
- Reject approaches
- Add constraints
- Provide domain knowledge Claude doesn't have
- Vary widely in length (from 2 words to full paragraphs)

### Real Examples from the Article
1. **Domain knowledge**: `"use drizzle:generate for migrations, not raw SQL"`
2. **Correcting assumptions**: `"no — this should be a PATCH, not a PUT"`
3. **Rejecting approaches**: `"remove this section entirely, we don't need caching here"`
4. **Explaining context**: `"the queue consumer already handles retries, so this retry logic is redundant. remove it and just let it fail"`
5. **Structural corrections**: `"this is wrong, the visibility field needs to be on the list itself, not on individual items...restructure the schema section accordingly"`

### The Critical Guard: "Don't Implement Yet"
After each update request, the developer adds an explicit guard:
```
"I added notes, address all notes and update the document. don't implement yet"
```

**Why this is essential**: Without this explicit statement, Claude will jump to code the moment it thinks the plan is adequate. The guard ensures Claude only updates the plan, not implementations.

### Why This Works So Well

The markdown plan acts as **shared mutable state** between developer and AI:
- Developer can think at their own pace
- Annotations point to exact spots where issues exist
- Context doesn't require scrolling through chat history
- The plan becomes a structured, complete specification

**Key distinction from chat-based steering**:
- Chat conversations are sequential and must be scrolled to reconstruct
- Plan documents are spatial, holistic, and reviewable at a glance
- Plan documents serve as persistent reference throughout implementation

### Outcome
Three rounds of annotation can transform a generic, technically-sound plan into one that:
- Fits perfectly into the existing system
- Respects existing interfaces and patterns
- Incorporates product priorities
- Reflects user pain points
- Makes appropriate engineering trade-offs

**The dynamic**: Claude excels at understanding code, proposing solutions, and writing implementations. It *cannot* know product priorities, user context, or engineering culture. The annotation cycle is the mechanism for injecting that judgment.

### The Todo List Refinement
Before implementation, the developer requests a granular task breakdown:
```
"add a detailed todo list to the plan, with all the phases and individual
tasks necessary to complete the plan - don't implement yet"
```

This creates a checklist that:
- Serves as a progress tracker during implementation
- Claude marks items as completed as it goes
- Developer can glance at the plan and see current status
- Especially valuable in long sessions (multiple hours)

---

## Phase 3: Implementation — Mechanical Execution

### The Implementation Command
Once the plan is final, the developer uses a standard, reusable prompt:

```

"implement it all. when you're done with a task or phase, mark it as
completed in the plan document. do not stop until all tasks and phases
are completed. do not add unnecessary comments or jsdocs, do not use
any or unknown types. continuously run typecheck to make sure you're
not introducing new issues."
```

### What This Phrasing Encodes
Each phrase serves a specific purpose:

1. **"implement it all"** — Execute everything in the plan, no cherry-picking
2. **"mark it as completed in the plan document"** — The plan remains the source of truth for progress
3. **"do not stop until all tasks and phases are completed"** — No pausing for mid-flow confirmation
4. **"do not add unnecessary comments or jsdocs"** — Keep code clean and readable
5. **"do not use any or unknown types"** — Maintain strict typing (prevents sloppy type usage)
6. **"continuously run typecheck"** — Catch problems early, not at the end

### Design Philosophy: Implementation Should Be Boring
> "I want implementation to be boring. The creative work happened in the annotation cycles.
> Once the plan is right, execution should be straightforward."

By the time "implement it all" is issued:
- Every architectural decision has been made
- Every edge case has been considered
- Every trade-off has been validated
- Implementation becomes mechanical, not creative

### The Problem This Solves
Without a thorough planning phase, Claude typically:
1. Makes a reasonable-but-wrong assumption early
2. Builds on top of that assumption for 15+ minutes
3. Developer has to unwind a chain of cascading changes

**The solution**: The "don't implement yet" guard + annotation cycle eliminates this entirely.

---

## Feedback During Implementation

### The Role Shift
Once Claude is executing, the developer's role shifts from architect to supervisor. Prompts become dramatically shorter and more terse.

### Feedback Pattern
```
Claude implements
    ↓
Developer reviews / tests
    ↓
Correct?
    → Yes: More tasks?
            → Yes: Continue | No: Done
    → No: Send terse correction → Claude implements correction
```

### Correction Style Evolution
- **Planning phase**: Paragraph-length notes with context
- **Implementation phase**: Single-sentence corrections

**Examples of implementation-phase feedback**:
- `"You didn't implement the deduplicateByTitle function."`
- `"You built the settings page in the main app when it should be in the admin app, move it."`

**Why terse feedback works**: Claude has full context of the plan and ongoing session, so brevity is sufficient.

### Frontend-Specific Iteration
Frontend work is the most iterative part. The developer tests in the browser and fires off rapid corrections:
- `"wider"`
- `"still cropped"`
- `"there's a 2px gap"`

For visual issues, screenshots are attached—they communicate the problem faster than description.

### Pattern-Based Guidance
The developer constantly references existing code:
> "this table should look exactly like the users table, same header, same pagination, same row density"

**Why this works**: Most features in mature codebases are variations on existing patterns. Pointing to a reference implementation communicates all implicit requirements without spelling them out.

### Scope Reset Strategy
When something goes in a wrong direction, the developer doesn't try to patch it incrementally:

```
"I reverted everything. Now all I want is to make the list view
more minimal — nothing else."
```

**Why this works better than incremental fixes**: Narrowing scope after a revert almost always produces better results than trying to fix a bad approach incrementally.

---

## Staying in the Driver's Seat: Selective Autonomy

Even though implementation is delegated to Claude, the developer maintains control over *what gets built*.

### The Decision Framework
```
Claude proposes changes
    ↓
Developer evaluates each item
    ↓
Decision: Accept as-is | Modify | Skip | Override technical choice
    ↓
Refined implementation scope
```

### Control Mechanisms

#### 1. Cherry-Picking from Proposals
When Claude identifies multiple issues, the developer evaluates each one:
```
"for the first one, just use Promise.all, don't make it overly
complicated; for the third one, extract it into a separate function
for readability; ignore the fourth and fifth ones, they're not
worth the complexity"
```

**Principle**: Item-level decisions based on broader project knowledge.

#### 2. Trimming Scope
The developer actively cuts nice-to-haves:
```
"remove the download feature from the plan, I don't want to
implement this now"
```

**Prevents scope creep** while maintaining momentum.

#### 3. Protecting Existing Interfaces
Hard constraints are set when certain interfaces shouldn't change:
```
"the signatures of these three functions should not change,
the caller should adapt, not the library"
```

**Rationale**: Changing function signatures could break dependent code elsewhere.

#### 4. Overriding Technical Choices
When the developer has a specific preference or constraint Claude wouldn't know:
```
"use this model instead of that one"
"use this library's built-in method instead of writing a custom one"
```

**Speed and specificity**: Direct overrides are faster than explaining reasoning.

### The Judgment Distribution
- **Claude handles**: Mechanical execution, code writing, system understanding
- **Developer handles**: Judgment calls, product priorities, engineering culture, trade-offs

The plan captures big decisions upfront. Selective guidance handles smaller ones that emerge during implementation.

---

## Single Long Sessions vs. Multiple Sessions

### The Author's Approach
Research, planning, and implementation happen in a **single continuous session** rather than split across separate sessions.

**Example flow**: Deep-read a folder → 3 rounds of plan annotation → Full implementation, all in one conversation.

### Performance Claims
The author claims **not experiencing** the performance degradation others report at ~50% context window usage:

> "I am not seeing the performance degradation everyone talks about after
> 50% context window"

**Reasons given**:
1. By the time "implement it all" is issued, Claude has spent the entire session building understanding
2. Reading files during research builds understanding
3. Refining the mental model during annotation cycles deepens comprehension
4. Absorbing domain knowledge corrections further improves context

### Context Window Management
- When the context window fills up, Claude's auto-compaction maintains enough context to continue
- **Critical**: The plan document (persistent artifact) survives compaction in full fidelity
- Developer can point Claude back to the plan at any time for reference

---

## Core Principles & Philosophy

### The Fundamental Insight
The workflow is built on **separating thinking from typing**:
- Research → understand the system deeply
- Planning → design the approach thoroughly
- Annotation → validate the plan matches reality
- Implementation → execute what's already been decided

### Why This Matters
Without this discipline, here's what happens:
1. Developer provides a prompt
2. Claude writes code immediately (partially informed)
3. Code has subtle bugs or breaks existing patterns
4. Developer has to debug and re-work
5. Significant wasted tokens and time

**With this discipline**:
1. Deep research prevents ignorant changes
2. Detailed plan prevents wrong changes
3. Annotation cycle injects human judgment
4. Implementation becomes mechanical, straightforward execution

### The Compact Version
> "Read deeply, write a plan, annotate the plan until it's right, then let
> Claude execute the whole thing without stopping, checking types along the way."

---

## Specificity & Effectiveness Insights

### What Makes Directives Effective
Language matters enormously. The author shows that:
- Generic requests produce skimming
- Specific, demanding language produces depth
- Words like "deeply," "intricacies," "thoroughly" signal that surface-level understanding is insufficient

### The Power of Persistent Artifacts
Using markdown files instead of chat messages provides:
1. A review surface for the developer to verify understanding
2. A shared mutable state between developer and Claude
3. A persistent reference that survives context window compression
4. A document that can be edited, annotated, and evolved

### The Value of Reference Implementations
Providing Claude with a concrete example of good code in a similar domain produces dramatically better results than abstract requirements or designing from scratch.

### The Annotation Cycle's Unique Value
The cycle:
- Allows developer to think at their own pace
- Points to exact problem locations
- Injects domain knowledge iteratively
- Converts a generic plan into a system-specific plan
- Repeats 1-6 times until the plan is truly ready

---

## Failure Modes Prevented

The workflow is specifically designed to prevent these expensive failure modes:

### 1. **Ignorant Implementations** (Prevented by Research)
Problem: Claude doesn't understand how the system works, writes code that ignores caching layers, ORM conventions, existing patterns.

Solution: Deep research phase with verification artifact ensures understanding before any changes are proposed.

### 2. **Wrong-Direction Implementations** (Prevented by Planning + Annotation)
Problem: Claude proposes technically correct but architecturally wrong approach.

Solution: Detailed plan + annotation cycle ensures approach matches system design and product priorities.

### 3. **Mid-Flow Assumption Cascades** (Prevented by "Don't Implement Yet" Guard)
Problem: Claude makes a wrong assumption early, builds on it for 15 minutes, creates cascading changes that must be unwound.

Solution: Explicit "don't implement yet" guard keeps Claude in planning mode until every decision is validated.

### 4. **Context Loss** (Prevented by Persistent Artifacts)
Problem: Developer loses decision context across long sessions or when revisiting code.

Solution: Plan document persists, survives context window compression, serves as reference at any time.

### 5. **Scope Creep** (Prevented by Selective Rejection)
Problem: Claude adds nice-to-haves that expand scope unnecessarily.

Solution: Developer actively cherry-picks and removes items, explicitly trimming scope.

---

## Practical Applicability

### Prerequisites for This Workflow
1. Understand your codebase reasonably well
2. Have clear product/engineering priorities
3. Be willing to invest time in the planning phase upfront
4. Can articulate trade-offs and constraints
5. Have a development environment for testing

### When This Workflow Shines
- **Medium to large features** (small bug fixes don't need this rigor)
- **Features touching multiple files** or systems
- **Features with existing patterns** to reference
- **Long implementation sessions** (multiple hours)
- **Mature codebases** with established conventions

### Investment Trade-offs
- **Upfront time**: Higher investment in research + planning + annotation
- **Implementation time**: Lower (mechanical execution is faster than creative problem-solving)
- **Debugging time**: Dramatically lower (prevents cascading errors)
- **Overall time**: Author claims it's faster than jumping to code, despite higher upfront time

---

## Technical Patterns & Preferences

### Code Quality Standards Mentioned
1. **No unnecessary comments or jsdocs** — Keep code readable but concise
2. **Strict typing** — No `any` types, maintain type safety
3. **Continuous typechecking** — Run typecheck during implementation
4. **Match existing patterns** — New code should follow codebase conventions

### Tool Preferences Mentioned
1. **Custom markdown plans over Claude Code's built-in plan mode** — More control, persistence
2. **Drizzle for migrations** (ORM-specific) — Over raw SQL
3. **Reference implementations from open source** — Better than abstract requirements
4. **Screenshots for visual feedback** — Faster than textual descriptions

---

## Key Takeaways for Claude Code Users

### 1. Planning is not optional; it's foundational
The research → plan → annotate → implement pipeline works because it respects the reality that **human judgment is irreplaceable**.

### 2. The annotation cycle is the innovation
Moving from chat-based back-and-forth to a persistent markdown file with inline notes fundamentally changes the dynamic. This is the highest-leverage part of the workflow.

### 3. Language precision signals rigor
Using words like "deeply," "intricacies," and "thoroughly" actually changes Claude's output quality. It's not fluff—it's a signal that surface-level understanding is unacceptable.

### 4. Persistent artifacts are critical
Plans, research documents, and todo lists need to be real files that survive the session. They're not just outputs; they're tools for steering subsequent work.

### 5. Implementation should be boring
If implementation is creative and uncertain, the planning phase wasn't thorough enough. By the time code is written, the important decisions should already be made.

### 6. Reference implementations are more effective than abstract requirements
"Use this library's approach" beats "write a cache layer" every time.

### 7. Cherry-picking is a feature, not a bug
The developer is not obligated to implement everything Claude suggests. Selective rejection and scope trimming are expected parts of the workflow.

---

## Conclusion

This article describes a mature, disciplined approach to AI-assisted coding. The core insight—separating thinking from typing—is elegant and powerful. The workflow prevents expensive failure modes by inserting human judgment at three critical points: research verification, plan annotation, and selective implementation feedback.

The most distinctive contribution is the **annotation cycle**: a simple idea (add notes to a markdown document, have Claude update the document accordingly) that in practice produces dramatically better results than trying to steer implementation through chat messages.

The workflow is not magical; it requires discipline and up-front investment. But the author's claim—that this approach prevents costly mistakes and produces better implementations with lower token usage—is well-reasoned and supported by concrete examples throughout the article.

For developers working with Claude Code on substantial features in mature codebases, this workflow represents a significant productivity improvement over the typical "prompt → code → fix → repeat" cycle.