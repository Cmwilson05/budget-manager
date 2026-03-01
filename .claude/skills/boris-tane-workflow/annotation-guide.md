# Annotation Guide: Writing Effective Plan Notes

The annotation cycle is where you inject your judgment into the plan. This guide explains how to write effective annotations that transform a generic plan into one that fits your system perfectly.

---

## What is an Annotation?

An annotation is an inline note you add directly to the plan document. It addresses a specific claim, approach, or statement in the plan. Annotations range from 2 words to 2 paragraphs, depending on the issue.

**Examples:**

```markdown
This approach uses a simple offset-based pagination system.

[ANNOTATION: no—offset breaks when rows are deleted. use keyset
pagination with the user id as cursor.]
```

```markdown
We'll add caching at the query layer with a 5-minute TTL.

[ANNOTATION: not optional. this system gets 10K req/min and our
database can't handle more than 5K. we've had outages before when
caching was disabled during deployments.]
```

```markdown
The API response includes user id, name, and email address.

[ANNOTATION: add created_at timestamp. dashboard needs it for
sorting the user list by signup date. and use camelCase for field
names to match our API conventions.]
```

---

## Annotation Types

### 1. Corrections — "This is wrong"

Use when the plan contains a factual error or misunderstanding about the system.

```markdown
The database uses PostgreSQL.

[ANNOTATION: no—we migrated to MySQL 6 months ago. update the
plan accordingly.]
```

**When to use**: Facts about the system, technology choices, APIs, or constraints are wrong.

---

### 2. Rejections — "Remove this approach"

Use when you want to discard an approach or feature the plan suggests.

```markdown
We'll add a caching layer with Redis for query results.

[ANNOTATION: remove this entirely. we're already at capacity with
infrastructure. don't add redis. if we need performance gains,
we optimize queries instead.]
```

**When to use**: You don't want the feature, don't have the infrastructure, or the approach contradicts your priorities.

---

### 3. Constraints — "Add this limitation"

Use when the plan doesn't account for an important limitation or requirement.

```markdown
The function will accept any string as input.

[ANNOTATION: constraint: user_id must be between 1 and 999999.
add validation and reject invalid ids with a 400 error.]
```

**When to use**: The plan misses a requirement, safety constraint, or business rule.

---

### 4. Clarifications — "This needs more detail"

Use when the plan is vague and needs specifics.

```markdown
We'll handle pagination.

[ANNOTATION: be specific. cursor-based pagination using the
`id` field. cursor comes from previous response's last item.
limit defaults to 20, max 100.]
```

**When to use**: The plan is too high-level and doesn't specify enough implementation detail.

---

### 5. Context — "Here's why"

Use when you want to explain the reasoning behind a decision.

```markdown
The API response will include user metadata.

[ANNOTATION: user metadata was added for the dashboard feature
in January. it's used by 90% of API clients now, so it's required.
leaving it out would break existing integrations.]
```

**When to use**: The decision has history or rationale Claude wouldn't know about.

---

### 6. References — "Look at this similar code"

Use when you want Claude to understand how something should be done by reference to existing code.

```markdown
We'll implement error handling for this new endpoint.

[ANNOTATION: use the same error handling pattern as
src/api/middleware/errorHandler.ts. it wraps errors with
status codes and logs to the monitoring service. don't
invent a new pattern.]
```

**When to use**: There's existing code that demonstrates the right way to do something.

---

### 7. Trade-off Decisions — "Choose this for this reason"

Use when multiple approaches exist and you want to make the decision explicit.

```markdown
We can use either GraphQL or REST for the API.

[ANNOTATION: use REST. we don't have GraphQL experience on the
team and our API is simple enough that REST is fine. GraphQL
would add complexity without benefit.]
```

**When to use**: The plan presents options and you want to document why you chose one.

---

## Annotation Best Practices

### Be Specific, Not Vague

❌ **Too vague:**
```markdown
This seems complicated.
```

✅ **Specific:**
```markdown
The validation logic here is too complex. It's doing input
validation, type coercion, and business rule checking all
at once. Split into three functions: validate, coerce, check.
Look at the pattern in src/validation/index.ts.
```

### Explain the Why, Not Just the What

❌ **What without why:**
```markdown
Use REST instead of GraphQL.
```

✅ **Why explained:**
```markdown
Use REST instead of GraphQL. We don't have GraphQL expertise
on the team, and for our use case (CRUD + simple queries),
REST is simpler and sufficient. GraphQL adds complexity here.
```

### Respect the Plan Structure

Add annotations *next to* the relevant section, not as separate notes at the end. This keeps feedback aligned with the content.

❌ **Wrong placement:**
```markdown
## Plan Content
...all the content...

## Annotations
- Fix the database schema
- Simplify the API
- Add error handling
```

✅ **Right placement:**
```markdown
## Database Changes

We'll add a new users_profile table...

[ANNOTATION: name this users_metadata instead to match our
naming convention. all similar tables are *_metadata not *_profile.]
```

### Distinguish Between "Required" and "Nice to Have"

Use language that makes the urgency clear:

**Required (firm decision):**
- "Must be..." or "Cannot be..."
- "Non-negotiable because..."
- "Will break if..."

**Nice to have (suggestion):**
- "Consider..." or "Could also..."
- "This would be better if..."
- "Optional but recommended because..."

### Keep Annotations Concise

**Too long:** Annotation > 1 paragraph (unless explaining complex context)

```markdown
[ANNOTATION: this is a very long annotation that explains many
things about why we need to do this and it goes on and on and on
and is really hard to read because it's so long]
```

**Better:** Split into multiple annotations or simplify:

```markdown
[ANNOTATION: we need to do this because of reason A.]

[ANNOTATION: we also need to account for reason B.]

[ANNOTATION: see src/example.ts for the pattern to follow.]
```

---

## The Annotation Cycle Workflow

### Step 1: Review the Plan
Read through Claude's plan completely once without annotations. Get a sense of the whole thing.

### Step 2: Identify Issues
On the second read, mark places where:
- Something is factually wrong (system behavior, API, constraints)
- You disagree with the approach
- More detail is needed
- Existing patterns should be followed
- Integration points are missing

### Step 3: Add Annotations
Go back and add inline annotations at each issue point. Use the types above to guide your format.

### Step 4: Re-read with Annotations
Read the plan again with all annotations. Does it make sense? Are there contradictions?

### Step 5: Send Back to Claude
Send a message like:

```
"I've added notes to the plan.md document. Address all the notes
and update the plan accordingly. Don't implement yet, just update
the plan based on the feedback."
```

### Step 6: Review Updated Plan
Claude updates the plan. Review again. If more changes needed, repeat cycle (usually 1-3 times).

### Step 7: Request Todo List
Once you're satisfied:

```
"The plan looks good now. Add a detailed todo list with all the
phases and individual tasks. Don't implement yet."
```

---

## Example Annotation Cycle

### Original Plan (First Draft)

```markdown
## Approach

The authentication system will support both OAuth and
username/password login. We'll use JWT tokens stored
in localStorage for session management.

## Database Changes

Create a new `tokens` table to store JWT tokens.

## Frontend Changes

Add a login form component and a logout button.
```

### With Annotations (Your Feedback)

```markdown
## Approach

The authentication system will support both OAuth and
username/password login. We'll use JWT tokens stored
in localStorage for session management.

[ANNOTATION: oauth only. we don't have username/password
authentication anymore. we switched 6 months ago. update this.]

[ANNOTATION: not localStorage. localStorage is exposed to XSS.
use httpOnly cookies instead. see src/auth/session.ts for the
current pattern.]

## Database Changes

Create a new `tokens` table to store JWT tokens.

[ANNOTATION: we don't store tokens in the database anymore.
that's the whole point of JWT—stateless. sessions are stored
in redis instead. remove this section and refer to the redis
session pattern in src/sessions/store.ts.]

## Frontend Changes

Add a login form component and a logout button.

[ANNOTATION: login form already exists in src/auth/LoginForm.tsx.
don't create a new one. reuse the existing component. all you
need to add is the logout button in src/layout/Header.tsx.]
```

### Claude's Updated Plan (After Cycle 1)

```markdown
## Approach

The authentication system will support OAuth login only (we migrated
from username/password 6 months ago). We'll use JWT tokens with
httpOnly cookies for session management, following the pattern
established in src/auth/session.ts. Sessions are stored in Redis
using the session store in src/sessions/store.ts.

## Session Management

We use Redis to store session data. The session key is the JWT token.
TTL is 24 hours (can be configured in src/config/auth.js).

## Frontend Changes

Add a logout button to src/layout/Header.tsx. Clicking it will call
src/auth/logout.ts which clears the session cookie and redirects to
the login page. We'll reuse the existing LoginForm component that's
already in src/auth/LoginForm.tsx.
```

**Result**: Plan is now specific, uses existing patterns, and aligns with your system. Ready for implementation.

---

## Anti-Patterns: What NOT to Do

### ❌ Don't Rewrite the Plan

```markdown
[ANNOTATION: this approach is bad. instead, we should do this
whole other thing that's different and better...]
```

**Instead**, point to the specific issue:

```markdown
[ANNOTATION: this approach uses REST when we should use gRPC
for internal services. see src/internal/services/ where we
already use gRPC for service-to-service communication.]
```

### ❌ Don't Make Decisions Claude Should Make

```markdown
[ANNOTATION: use variable name `x` instead of `result`.]
```

That's too low-level. Let Claude make style choices. Focus on architecture and constraints.

**Better:**
```markdown
[ANNOTATION: use the naming convention from our API style guide:
https://our-wiki.com/api-naming. (snake_case for fields, PascalCase
for types)]
```

### ❌ Don't Argue About Unknowns

```markdown
[ANNOTATION: this won't work because it's too slow.]
```

**Better**, if you know specifics:

```markdown
[ANNOTATION: performance is critical here. the list endpoint
handles 10K req/min. with this approach (no caching), we'll hit
the database 10K times. add caching or index optimization.]
```

### ❌ Don't Lose Sight of the Plan

Remember: the goal of annotations is to refine the plan, not to rewrite it from scratch. If you find yourself wanting to replace more than 30% of the plan, maybe the plan was wrong and you should ask for a new one.

---

## When to Stop Iterating

The plan is ready for implementation when:

1. ✅ All factual errors are corrected
2. ✅ All required constraints are included
3. ✅ Approach aligns with your system's patterns
4. ✅ Code snippets show the actual changes clearly
5. ✅ You understand how it integrates with the rest of the system
6. ✅ Edge cases are addressed
7. ✅ You're confident the implementation won't break existing code

Usually this takes 1-3 annotation cycles. If you're on cycle 6+, either:
- The plan was fundamentally misguided (request a new plan), or
- You and Claude have different understandings of the system (do more research)

---

## Quick Reference: Annotation Syntax

Keep annotations readable. Use this format:

```markdown
[ANNOTATION: Your comment here. Keep it focused. Multiple sentences
are fine for important decisions. End with a period.]
```

Use **bold** for emphasis on critical points:

```markdown
[ANNOTATION: **This is critical**. If we don't handle this edge case,
the system will data corruption when X happens.]
```

Reference code with backticks:

```markdown
[ANNOTATION: use `src/auth/validateToken()` instead of writing
new validation logic. it's already tested.]
```

Use lists for multiple points:

```markdown
[ANNOTATION: three changes needed here:
1. Use `camelCase` for field names
2. Add `status` field to track state
3. Follow the pattern in `src/models/User.ts`]
```