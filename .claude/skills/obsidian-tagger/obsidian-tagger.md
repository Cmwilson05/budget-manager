---
name: obsidian-tagger
description: >
  Apply a workflow-oriented PKM tagging strategy to Obsidian notes using status, context,
  and output tag dimensions. Use this skill whenever the user wants to: tag a note or
  group of notes, add workflow tags, apply the PKM tagging strategy, suggest tags for new
  notes, bulk-tag a folder, create or update a Meta/Tags reference page, or review whether
  existing tags are consistent. Trigger on phrases like: "tag my notes", "add tags",
  "apply tagging", "what tags should this have", "tag this note", "tag the ReadItLater
  folder", "create a tag system", "workflow tags", "status tags", or any mention of the
  PKM tagging guide. Also trigger when the user pastes a note and asks how to organize
  or categorize it — tagging is likely what they need.
---

# Obsidian PKM Tagger

## Core Philosophy

Tags answer **"what will I do with this?"** — not "what is this about?"

PARA folders (Projects, Areas, Resources, Archive) handle subject-matter organization.
Tags create cross-cutting workflow visibility. Keep them minimal: **2–5 tags per note max**.

---

## Tag Taxonomy

### Status Tags — always apply at least one

| Tag | When to use |
|-----|------------|
| `status/capture` | Just added, hasn't been processed yet |
| `status/active` | Currently being worked on or referenced regularly |
| `status/review` | Needs re-evaluation, updating, or revision |
| `status/complete` | Done; ready to archive or leave as reference |
| `status/reference` | Stable, completed reference material (won't change) |

**Rule of thumb**: If in doubt, `status/capture` is always safe. Refine at weekly review.

### Output Tags — what will this note produce?

| Tag | When to use |
|-----|------------|
| `output/documentation` | Will become user/technical documentation |
| `output/guide` | Will become a how-to or procedural guide |
| `output/script` | Will become code or automation |
| `output/training` | Will become training material |
| `output/report` | Will become a report or analysis |

Only apply if the note has a clear deliverable. Many notes won't need an output tag.

### Context Tags — where/how can you act on it?

| Tag | When to use |
|-----|------------|
| `context/computer` | Requires a computer to act on |
| `context/terminal` | Requires command-line access |
| `context/research` | Requires dedicated focus/research time |
| `context/meeting` | Relevant for meetings or discussions |
| `context/quick` | Can be acted on in under 15 minutes |

Context tags are optional. Use them when filtering by situation would be genuinely useful.

### Temporal Tags — time-sensitive items

| Tag | When to use |
|-----|------------|
| `@today` | Needs attention today |
| `@this-week` | Needs attention this week |
| `@this-month` | Needs attention this month |
| `@waiting-for` | Blocked pending something external |
| `@someday-maybe` | Not urgent, worth revisiting later |

Temporal tags are the most volatile — add and remove them freely. Don't let them go stale.

---

## Decision Logic

When analyzing a note, work through these questions in order:

1. **Lifecycle stage?** → Pick one `status/*` tag. This is required.
2. **Will this produce something?** → Add `output/*` tag if a deliverable is expected.
3. **What do I need to work on it?** → Add `context/*` if filtering by situation is useful.
4. **Is it time-sensitive?** → Add temporal tag only if there's genuine urgency.

**Common patterns:**
- Stable how-to notes → `status/reference` + `output/guide` + `context/computer`
- Article saved for later reading → `status/capture`
- Work-in-progress doc → `status/active` + `output/documentation` + `context/computer`
- Home repair record → `status/reference`
- Ideas/someday list → `status/capture` + `@someday-maybe`

---

## Implementation in Obsidian

Tags belong in the frontmatter `tags:` property as a YAML list:

```yaml
tags:
  - status/reference
  - output/guide
  - context/terminal
```

**Critical rules:**
- Preserve existing content tags — only add workflow tags, never remove what's there
- YAML list format only — never comma-separated strings
- Use exact tag names from the taxonomy — no variations or abbreviations

**Where content tags already exist** (e.g. ReadItLater notes with topic tags like `ai`, `productivity`), simply append workflow tags to the existing list:

```yaml
# Before
tags:
  - ai
  - productivity

# After
tags:
  - ai
  - productivity
  - status/capture
```

---

## Vault-Specific Context

This vault uses the PARA structure. Tagging applies to general notes — not to database records:

| Folder | Type | Tag? |
|--------|------|------|
| `Task Manager/` | Database (Obsidian Bases) | No — uses priority/status/category properties |
| `Collaborstation/` | Database (Obsidian Bases) | No — uses type/frequency/due_date properties |
| `Exercise Database/` | Database | No — uses Equipment/Muscle/Status properties |
| `3. Resources/ReadItLater/` | General notes | **Yes** — add workflow tags |
| `2. Areas/` | General notes | **Yes** — add workflow tags |
| `1. Projects/` | General notes | **Yes** — add workflow tags |
| `3. Resources/` | General notes | **Yes** — add workflow tags |

---

## Workflows

### Tagging a Single Note

1. Read the note's frontmatter and first ~200 words of content
2. Apply the decision logic above to determine 2–4 appropriate tags
3. Explain your reasoning briefly (one sentence per tag is enough)
4. Ask for confirmation before applying, or apply directly if the user said to proceed
5. Edit the frontmatter `tags:` list, preserving any existing tags

### Bulk Tagging a Folder

When the user asks to tag an entire folder:

1. List all `.md` files in the folder (exclude Index/Template notes tagged `index`)
2. For each file: read frontmatter + first 150 words
3. Determine 1–3 tags — lean conservative for bulk operations, `status/capture` if uncertain
4. Apply to frontmatter
5. Output a summary table showing what was tagged and why

For very large folders (50+ files), process in batches and confirm with the user after each batch.

### Creating the Meta/Tags Reference Page

If the user doesn't have one yet, create `3. Resources/PKM Operating Docs/Meta - Tag System.md` with:
- The full taxonomy in a readable format
- A definition + example for each tag
- The workflow guide (when to tag, weekly review routine)
- Maintenance reminders (weekly 5 min, monthly 15 min, quarterly 30 min)

Use Obsidian callout syntax for tips and warnings.

---

## Common Pitfalls to Avoid

- **Don't create subject tags** — `#python`, `#networking`, `#cooking` belong in PARA folders, not tags
- **Don't go beyond 5 tags** — if you're adding more, step back and consolidate
- **Don't remove existing tags** — always append, never overwrite unless explicitly asked
- **Don't apply output tags speculatively** — only if there's a real deliverable expected
- **Don't let temporal tags go stale** — flag for the user to review if old `@today` tags exist
