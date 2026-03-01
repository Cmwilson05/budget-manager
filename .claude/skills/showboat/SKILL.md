---
name: showboat
description: >
  Use this skill to produce showboat documents: markdown files that weave narrative
  commentary with shell commands that are actually executed and their output captured
  live. The showboat CLI tool builds these — every code block runs for real and its
  output is recorded alongside it, making the document both readable and independently
  verifiable. Trigger when the user: (1) mentions "showboat" anywhere in their request;
  (2) wants an executable or runnable tutorial/walkthrough where commands actually run;
  (3) asks for proof that something works, backed by real terminal output; (4) wants a
  document someone else can re-run to confirm the results match. Skip for plain
  tutorials, READMEs, in-chat explanations, scripts, codebase docs, or summaries —
  anything where commands don't need to be executed and captured.
---

# Showboat: Proof-of-Work Demo Documents

Showboat is a CLI tool that builds markdown documents combining commentary, executable
code blocks, and captured output. The result is both human-readable documentation and
reproducible proof of work — a verifier can re-run every code block and confirm the
outputs still match.

Your job is to use the `showboat` CLI to create these demo documents after (or during)
completing a task for the user. Think of it like a lab notebook: you narrate what you're
doing, run the commands, and the tool captures everything into a clean markdown file.

## Step 0: Resolve the showboat command

Claude Code's Bash tool runs in a non-interactive shell that may not source `~/.zshrc`,
so `~/.local/bin` (where showboat is typically installed) is often not on PATH.

**Always resolve the command this way first:**

```bash
SHOWBOAT=$(command -v ./showboat || command -v showboat || echo "")
```

- `./showboat` — a symlink in the project root; works regardless of PATH and is the
  preferred invocation in this vault
- `showboat` — falls back to whatever is on PATH

If neither resolves, install showboat:

```bash
# Fastest: uvx runs it without a permanent install
uvx showboat --help

# Or install permanently via pip
pip install showboat --break-system-packages
```

Once you have a working command, confirm it:

```bash
$SHOWBOAT --version
```

Then use `$SHOWBOAT` (or `./showboat` directly) for all subsequent commands in this
session instead of bare `showboat`.

## Step 1: Plan the demo structure

Before touching the CLI, think about what story the demo document should tell. A good
demo document has:

1. **A clear title** that describes what was accomplished
2. **Narrative flow** — commentary that explains *why* each step matters, not just *what* it does
3. **Executable code blocks** that actually run and produce output
4. **A logical progression** from setup through execution to result

Sketch this structure mentally before starting. The user is going to read this document,
so it should feel like a well-written tutorial, not a raw terminal log.

### Calibrate depth to topic type

Not all demos need the same amount of material. Use this as a rough guide:

**Workflow demos** (installing a tool, setting up a project, running a pipeline): the
story is inherently sequential and bounded. 6–10 exec blocks is usually enough. The
narrative is about *what you did and why*.

**Conceptual/explainer demos** (how file permissions work, what a venv actually does,
how TCP handshakes happen): the reader is trying to build a mental model, not follow a
recipe. These need more. Aim for 10+ exec blocks and make sure you cover:
- The concept from first principles (what is it, why does it exist)
- The most common use (the easy case)
- Variations and edge cases (what changes when you tweak parameters)
- **At least one deliberate failure** — show what goes wrong when something is
  misconfigured or misused, then show the fix. This cements understanding far better
  than showing only the happy path.
- Directory or system behavior, not just file behavior (e.g. permissions on dirs vs files)

## Step 2: Initialize the document

```bash
showboat init <filename>.md "<Title of the Demo>"
```

Choose a descriptive filename and title. The title appears as an H1 heading and a
timestamp is added automatically.

Save the demo file in the current working directory unless the user specifies otherwise.

## Step 3: Build the document incrementally

Use these commands to build the document step by step:

### Add commentary
```bash
showboat note <file> "Your explanation of what's about to happen or what just happened."
```

Commentary is plain markdown text. Use it to:
- Explain the purpose of the next command
- Summarize what a result means
- Provide context the reader needs

You can also pipe longer text via stdin:
```bash
echo "Multi-line commentary goes here.

It can span paragraphs." | showboat note <file>
```

### Run commands and capture output
```bash
showboat exec <file> <language> "<code>"
```

The `exec` command:
- Runs the code in the specified interpreter (bash, python3, etc.)
- Captures stdout/stderr
- Appends both the code block and output block to the document
- Prints the output to stdout so you can see what happened
- Returns the same exit code as the executed command

Examples:
```bash
showboat exec demo.md bash "ls -la"
showboat exec demo.md python3 "print('Hello from Python')"
showboat exec demo.md bash "curl -s https://api.example.com/status | jq ."
```

You can pipe code via stdin too:
```bash
cat script.py | showboat exec demo.md python3
```

### Add images
```bash
showboat image <file> screenshot.png
showboat image <file> '![Description of the image](screenshot.png)'
```

The image is copied alongside the document with a generated filename. Use the second
form to include meaningful alt text.

### Fix mistakes
```bash
showboat pop <file>
```

Removes the most recent entry (code block + output, or commentary). Use this when a
command errors out or produces junk you don't want in the final document.

## Step 4: Compose the narrative

The difference between a great demo document and a mediocre one is the narrative.
Follow these principles:

- **Lead with context.** Before each exec block, add a note explaining what you're about
  to do and why. The reader shouldn't have to reverse-engineer your intent from the code.
- **Celebrate results.** After important exec blocks, add a note highlighting what the
  output shows. Don't just run commands silently.
- **Group related steps.** Several related commands can share a single introductory note
  rather than each having its own.
- **Keep it honest.** If something fails and you fix it, you can `pop` the failure, but
  consider leaving it in with a note — real debugging is interesting and proves the work
  is genuine.

### Self-check before wrapping up

Before writing the summary and calling the document done, pause and re-read what you've
built so far. Ask yourself:

> *What would a curious beginner still be confused about after reading this?*

Common things that get skipped on a first pass:
- A concept was named but never demonstrated (e.g. "octal notation" mentioned but only
  one example shown)
- The happy path was shown but never the failure mode
- A closely related concept was left out that readers will immediately wonder about
  (e.g. covering `chmod` without touching `chown`, or covering `>` without `>>`)
- The progression jumped steps that felt obvious to you but wouldn't to a beginner

If you spot any of these gaps, add the missing exec blocks and notes before moving on.
For conceptual topics especially, this pass almost always surfaces at least one thing
worth adding.

## Step 5: Optional verification

After completing the document, you can verify that all code blocks are reproducible:

```bash
showboat verify <file>
```

This re-runs every code block and diffs the output against what's recorded. If everything
matches, it exits 0. If outputs have changed, it shows the diffs and exits 1.

Mention to the user that they can run `showboat verify` themselves to confirm the results.
Don't run verify automatically — some demos involve one-time operations (creating files,
installing packages) that may produce different output on re-run. Let the user decide.

## Step 6: Present the result

When done, tell the user where the demo document is and what it covers. If the document
includes images, mention that those are saved alongside the markdown file.

## CLI Quick Reference

| Command | What it does |
|---------|-------------|
| `showboat init <file> <title>` | Create a new demo document |
| `showboat note <file> [text]` | Add commentary (text or stdin) |
| `showboat exec <file> <lang> [code]` | Run code, capture output |
| `showboat image <file> <path>` | Add an image |
| `showboat pop <file>` | Remove the last entry |
| `showboat verify <file>` | Re-run all blocks, check outputs match |
| `showboat extract <file>` | Emit commands to recreate the document |

## Resulting Markdown Format

The generated markdown looks like this:

```markdown
# Title

*2026-02-22T15:30:00Z*

Commentary explaining what's happening.

\`\`\`bash
echo "hello world"
\`\`\`

\`\`\`output
hello world
\`\`\`

More commentary about the result.
```

Each code block is paired with an `output` block containing the captured stdout/stderr.
Images appear as standard markdown image references.

## Workdir Flag

If the commands need to run in a specific directory (e.g., inside a project repo), use:

```bash
showboat exec demo.md bash "ls" --workdir /path/to/project
```

Or set it globally:
```bash
showboat --workdir /path/to/project exec demo.md bash "ls"
```

## Common Patterns

**Demonstrating a tool installation + usage:**
1. `init` with a title like "Getting Started with [Tool]"
2. `note` explaining what the tool does
3. `exec` the installation command
4. `note` explaining a basic use case
5. `exec` the basic usage
6. `note` wrapping up with what was accomplished

**Documenting a debugging session:**
1. `init` with a title like "Debugging [Issue]"
2. `note` describing the problem
3. `exec` commands that reproduce or investigate the issue
4. `note` explaining what you found
5. `exec` the fix
6. `exec` confirmation that it works

**Recording a data pipeline:**
1. `init` with the pipeline name
2. For each stage: `note` the purpose, `exec` the transformation, `note` the result
3. Final `note` summarizing the end-to-end flow
