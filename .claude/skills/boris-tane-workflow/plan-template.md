# Implementation Plan Template

Use this template when requesting a plan from Claude. Replace `<...>` with your specifics. This structure ensures the plan includes everything needed for the annotation cycle and implementation.

---

## [Feature/Change Name]

**Objective**: [One sentence describing what this feature accomplishes and why]

---

## Approach

[Detailed explanation of the strategy. Why this approach? What are the alternatives and why did we choose this one? 2-4 paragraphs.]

---

## Key Changes

### Database/Schema Changes
[If applicable, describe any schema migrations, new tables, new fields, etc.]

### API Endpoints
[If applicable, list endpoints that are added, modified, or removed]

### Core Logic Changes
[Describe the main logic changes, data flow modifications, new functions, etc.]

### UI/Frontend Changes
[If applicable, describe UI components, pages, or interactions that change]

---

## File Modifications

| File | Change | Rationale |
|------|--------|-----------|
| `src/module/core.ts` | Add `validateInput()` function | Input validation for new feature |
| `src/api/routes.ts` | Modify GET /api/data endpoint | Add pagination support |
| `src/ui/components/List.tsx` | New component | Display paginated results |

---

## Code Snippets

### Before (if modifying existing code):
```javascript
// Current implementation
function fetchData(query) {
  return database.query(query);
}
```

### After (what will replace it):
```javascript
// New implementation with pagination
function fetchData(query, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return database.query(query)
    .limit(limit)
    .offset(offset);
}
```

---

## Considerations & Trade-offs

### Performance
[Any performance implications? Caching considerations? Load impact?]

### Backwards Compatibility
[Will this break existing code? Do we need migrations or deprecations?]

### Edge Cases
[What are the edge cases? How do we handle them?]

### Testing
[What needs to be tested? New test cases or modified existing tests?]

### Dependencies
[Any new dependencies introduced? Conflicts with existing code?]

---

## Potential Issues

[What could go wrong? What should we watch out for? Known limitations?]

---

## Implementation Order

1. [First step - usually setup or foundational changes]
2. [Second step - core logic]
3. [Third step - integration points]
4. [Fourth step - UI/presentation]
5. [Fifth step - testing and validation]

---

## Questions for Annotation

[Add placeholder questions here that you want feedback on. These will be addressed during the annotation cycle.]

- What about caching strategy? Should this be cached at the function level or the database level?
- Is the error handling sufficient or too complex?
- Should we add monitoring/logging for this feature?

---

# Example: Before and After Annotation Cycle

## Example: First Draft Plan (Before Annotations)

```markdown
## Approach

We'll add pagination to the user list endpoint by implementing
a cursor-based pagination system with a page parameter.

## Code Snippets

### Current Code:
function getUsers() {
  return database.query('SELECT * FROM users');
}

### New Code:
function getUsers(page = 1) {
  const limit = 20;
  const offset = (page - 1) * limit;
  return database.query('SELECT * FROM users LIMIT ? OFFSET ?',
                       [limit, offset]);
}
```

## Example: After First Annotation Cycle

Notice how annotations make the plan more specific and better aligned with the actual system:

```markdown
## Approach

[ANNOTATION: cursor-based pagination is better than offset. offset
breaks when rows are deleted between requests. use keyset
pagination instead.]

We'll add pagination to the user list endpoint by implementing
a cursor-based pagination system with a page parameter.

[ANNOTATION: what cursor? userid? updated_at? be specific here.]

## Code Snippets

### Current Code:
function getUsers() {
  return database.query('SELECT * FROM users');
}

[ANNOTATION: this already has a cache layer — check cache.get()
first. don't repeat that pattern.]

### New Code:
function getUsers(page = 1) {
  const limit = 20;
  const offset = (page - 1) * limit;
  return database.query('SELECT * FROM users LIMIT ? OFFSET ?',
                       [limit, offset]);
}

[ANNOTATION: use cursor instead of offset. pass cursor=last_user_id
from previous response. order by id ascending.]
```

Then you send: "I added notes, address all notes and update the document. don't implement yet"

Claude responds with an updated plan incorporating your feedback.

---

# Tips for Getting Good Plans

## Before Requesting a Plan

1. **Have done research** — The plan request assumes you understand the system
2. **Provide context** — "We're in a mature codebase with a cache layer" vs "new system"
3. **Be specific** — "Add pagination to the user list endpoint" vs "make the list faster"
4. **Have reference implementations** — If possible, link to similar features or external examples

## Directing Claude's Plan

**Good plan request:**
```
"the user list endpoint should support cursor-based pagination
instead of offset pagination. we already have a caching layer at the
database.query level, so don't add another one. read src/api/endpoints/users.ts
and src/db/cache.ts before writing the plan. write a detailed plan.md
including code snippets and explaining how we'll use the existing cache."
```

**Weak plan request:**
```
"add pagination"
```

The difference: The good request has context, examples, and constraints. Claude will write better plans with better input.

## During the Annotation Cycle

1. **Be specific** — "not optional" is better than "maybe optional"
2. **Explain the why** — "we don't cache writes because 90% of traffic is reads"
3. **Reference existing code** — "use the pattern from src/api/middleware/auth.ts"
4. **Identify conflicts** — "this conflicts with the current rate limiting logic"

---

# Quick Checklist for Plan Quality

Before you start annotating, check that the plan includes:

- [ ] Clear objective statement (one sentence, business outcome)
- [ ] Approach section explaining the strategy
- [ ] Specific file paths for every change
- [ ] Code snippets showing before/after (where applicable)
- [ ] Integration points documented
- [ ] Edge cases and error handling addressed
- [ ] Backward compatibility considerations
- [ ] Testing strategy outlined
- [ ] Clear implementation order

If any of these are missing, ask Claude to add them before starting the annotation cycle.