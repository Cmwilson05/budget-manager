# Research Phase Checklist

Use this checklist before moving from Phase 1 (Research) to Phase 2 (Planning). A good research document answers all of these questions comprehensively.

## System Architecture & Design

- [ ] **Overall architecture**: Is the high-level structure clearly explained? (E.g., client-server, monolithic, microservices, data flow)
- [ ] **Key components**: Are the major building blocks identified and their responsibilities defined?
- [ ] **Integration points**: How does this system integrate with other parts of the codebase? What are the boundary conditions?
- [ ] **Design decisions**: Why was it designed this way? What trade-offs were made?
- [ ] **Existing patterns**: What conventions or patterns does this system follow? (E.g., naming, folder structure, error handling)

## Data & State

- [ ] **Data structures**: What are the primary data types/models? How are they structured?
- [ ] **State management**: How is state tracked and modified? Are there caching layers?
- [ ] **Persistence**: How is data persisted? (Database, filesystem, memory, cache)
- [ ] **Data flow**: How does data flow through the system? Input → Processing → Output?
- [ ] **Validation**: Where and how is data validated? What invariants must hold?

## Implementation Details

- [ ] **Key functions/methods**: What are the critical functions? What do they do and why do they exist?
- [ ] **Dependencies**: What does this system depend on? External services, libraries, other modules?
- [ ] **Error handling**: How are errors caught, logged, and propagated?
- [ ] **Concurrency**: Are there threading, async, or concurrent concerns?
- [ ] **Performance**: Are there performance optimizations or trade-offs documented?

## Edge Cases & Failure Modes

- [ ] **Empty/null cases**: What happens with empty inputs, missing data, or null values?
- [ ] **Boundary conditions**: What happens at limits? (Max connections, data size, time)
- [ ] **Failure recovery**: What happens when something breaks? How does the system recover?
- [ ] **Race conditions**: Are there race conditions or ordering dependencies?
- [ ] **Cascading failures**: If one component fails, what else breaks?

## Operations & Maintenance

- [ ] **Observability**: How is the system monitored? What logging exists?
- [ ] **Configuration**: What can be configured? How?
- [ ] **Deployment**: How is the system deployed or updated?
- [ ] **Scaling**: How does the system scale? What are the scaling bottlenecks?
- [ ] **Known issues**: Are there known bugs, quirks, or gotchas documented?

## Testing & Validation

- [ ] **How it's tested**: What tests exist? What coverage? (Unit, integration, E2E)
- [ ] **Critical paths**: What are the most critical code paths that *must* work?
- [ ] **Known failures**: Are there test cases that fail or are skipped?
- [ ] **Validation approach**: How is correct behavior validated?

---

## Red Flags: Your Research is Insufficient

If any of these apply, your research is not deep enough. Go back and explore further:

- [ ] ❌ You can only describe *what* the code does, not *why* it exists
- [ ] ❌ You have one or two examples but haven't explored edge cases
- [ ] ❌ You don't understand why a particular design decision was made
- [ ] ❌ You can't answer "what happens if [component X] fails?"
- [ ] ❌ You don't know how this system integrates with other systems
- [ ] ❌ The research reads like API documentation, not system understanding
- [ ] ❌ You found an existing similar feature but didn't compare/contrast with what you're building
- [ ] ❌ You can't explain the data flow end-to-end
- [ ] ❌ You haven't explored at least one piece of code in detail (reading 50+ lines)

---

## Self-Check Questions Before Moving Forward

Ask yourself these questions. If you can't answer all of them, your research is incomplete:

1. **System understanding**: "If I had to explain this system to someone new, could I do it in 5 minutes?"
2. **Integration**: "What breaks if I change [key component]?"
3. **Edge cases**: "What happens when [edge case]?"
4. **Existing patterns**: "How would the person who wrote this want me to extend it?"
5. **Trade-offs**: "Why did they choose [approach] instead of [alternative]?"
6. **Failure modes**: "What's the worst thing that could happen if I misunderstand this?"
7. **Scope**: "What's in scope for my changes, and what isn't?"

---

## How Deep is "Deep Enough"?

**For a new feature in familiar codebase**: 30-60 minutes of research
**For a feature touching unfamiliar systems**: 60-120 minutes of research
**For a complete system rewrite**: 120+ minutes, multiple passes

The goal is not to spend infinite time researching. It's to spend enough time that you can explain the system clearly and answer hard questions about it. When you're explaining the system and you realize you *can't* answer a question, that's a red flag to research more.

---

## Template Prompt for Research Phase

Use this prompt with Claude to initiate the research phase:

```
"read this [folder/system/component] in depth, understand how it
works deeply, what it does and all its specificities. answer these
questions in your research document:

1. What is the purpose of this [system]?
2. What are the key components and how do they interact?
3. What design decisions are reflected in the code?
4. What are the edge cases and failure modes?
5. What patterns and conventions does it follow?
6. How does this integrate with the rest of the codebase?
7. What would someone need to know to safely modify this?

when you're done, write a detailed research.md document with
everything there is to know about this system. be comprehensive.
don't skim."
```

The more specific you can be about what you need to understand, the better the research output.