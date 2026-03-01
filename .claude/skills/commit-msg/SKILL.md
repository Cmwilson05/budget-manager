# Commit Message Generator

Drafts a git commit title and description by analyzing unstaged and staged changes in the current repository.

## When to Use

Trigger when the user asks for a commit message, wants to document what's changed, or says something like "write me a commit message", "what should I commit?", or "create a commit message."

## Process

1. Run `git status --short` to see all changed, deleted, and untracked files
2. Run `git diff --stat HEAD` to see line-level change counts
3. Filter out noise — ignore these automatically:
   - `.DS_Store`, `.obsidian/workspace.json`, `.obsidian/workspace-mobile.json`
   - `*.sync-conflict-*` files
   - Binary files (images, fonts, `.skill`, `.gz`, etc.)
4. Group remaining changes by theme (new content, deletions/cleanup, config updates, etc.)
5. Identify the dominant story — what is this commit actually about?
6. **Suggest which files make sense to stage** — if the changes span unrelated concerns, call that out and recommend staging them separately
7. Output the commit message

## Output Format

```
<Title: imperative mood, ≤72 chars>

<Description: 1–3 sentences of concise prose. Say what changed and why,
not just what files moved. No bullet points.>
```

## Style Notes

- Title uses imperative mood: "Add", "Remove", "Fix", "Update", "Consolidate" — not "Added" or "Adding"
- Description is prose, not a list — write it like a brief summary a teammate would read
- Don't mention `.DS_Store`, workspace files, or sync conflicts in the output
- If there's truly only one thing changed, the description can be a single sentence
- If scope is ambiguous, note it briefly and suggest how to split the commit

## Example Output

```
Remove awesome-claude-skills repo; add learnerflow and context-compacter skills

Removed the entire 1. Projects/SKILLS/awesome-claude-skills/ community
repository (500+ files) to reduce repo size. Added boris-tane-learnerflow
and context-compacter to .claude/skills/, and scaffolded a new skills-repo
project folder.
```
