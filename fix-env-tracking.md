# Removing a Tracked .env File from Git History

*2026-03-01T12:35:38Z by Showboat 0.6.1*
<!-- showboat-id: 1a247754-d597-4939-ad3a-90d6b771ab46 -->

The Budget Manager repo has `.env` in its `.gitignore` — but the file is still tracked. This happens when a file is committed *before* the gitignore rule is added (or when both happen in the same initial commit). Once Git tracks a file, `.gitignore` has no effect on it.

The file contains a Supabase URL and anon key. Supabase anon keys are **public by design** — they're embedded in client-side JavaScript and Row Level Security (RLS) is what protects data, not key secrecy. So this isn't a credential leak in the traditional sense. But it's still bad hygiene: it trains contributors to treat `.env` as committable, and if a *service role key* ever ends up in there, it would be exposed immediately.

This walkthrough shows how to untrack the file, add an `.env.example` for onboarding, and confirm the gitignore actually works afterward.

## Step 1: Prove the problem

Let's confirm that `.env` is in the gitignore AND tracked at the same time — a contradiction that confuses people.

```bash
grep '^\.env$' .gitignore && echo '.env IS listed in .gitignore'
```

```output
.env
.env IS listed in .gitignore
```

```bash
git ls-files --cached .env
```

```output
.env
```

There it is — `git ls-files --cached` shows the file is in the index (tracked), even though `.gitignore` says to ignore it. This is because `.gitignore` only applies to **untracked** files. Once a file is committed, the ignore rule is irrelevant.

Let's see when it was first committed:

```bash
git log --oneline --diff-filter=A -- .env
```

```output
e0f8f9d Initial project setup with budget manager infrastructure
```

Added in the very first commit — the `.gitignore` and `.env` were committed together, so the ignore rule never had a chance to take effect.

Let's also look at what's in the file:

```bash
cat .env | sed 's/=.*/=<REDACTED>/'
```

```output
VITE_SUPABASE_URL=<REDACTED>
VITE_SUPABASE_ANON_KEY=<REDACTED>```
```

Two variables: the Supabase project URL and the anon key. As mentioned, the anon key is a *public* key — it's compiled into the client-side JavaScript bundle by Vite anyway. Supabase's security model relies on Row Level Security (RLS) policies, not key secrecy. Still, keeping `.env` out of version control is best practice because:

1. It prevents accidental commits of **secret** keys (like a service role key) in the future
2. It keeps per-environment configuration out of the shared repo
3. It follows the [Twelve-Factor App](https://12factor.net/config) convention

## Step 2: Untrack the file (without deleting it from disk)

`git rm --cached` removes a file from the Git index (so it stops being tracked) without touching the working copy. The file stays on disk — it just becomes "untracked" and the `.gitignore` rule kicks in.

```bash
git rm --cached .env
```

```output
rm '.env'
```

Now let's verify: the file should still exist on disk, but `git ls-files` should no longer list it, and `git status` should show it as a staged deletion (not an untracked file — `.gitignore` will suppress that).

```bash
echo '--- File still on disk? ---' && ls -la .env && echo '' && echo '--- Still tracked? ---' && git ls-files --cached .env | wc -l | xargs -I{} echo '{} files tracked (should be 0)' && echo '' && echo '--- Git status ---' && git status .env
```

```output
--- File still on disk? ---
-rw-r--r-- 1 root root 290 Mar  1 12:13 .env

--- Still tracked? ---
0 files tracked (should be 0)

--- Git status ---
On branch claude/review-codebase-XRcia
Your branch is up to date with 'origin/claude/review-codebase-XRcia'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	deleted:    .env

```

Exactly right:
- File is still on disk (290 bytes, untouched)
- 0 files tracked (removed from the index)
- Git shows a staged "deleted" — meaning the *next commit* will record that `.env` is no longer part of the repo
- Notice `.env` does NOT appear as an untracked file — the `.gitignore` rule is now working

## Step 3: Create `.env.example` for onboarding

Without the `.env` in the repo, new contributors won't know what variables they need. The standard solution is a `.env.example` file with placeholder values and comments explaining where to get real ones.

```bash
cat .env.example
```

```output
# Supabase project credentials
# Get these from: https://supabase.com/dashboard/project/_/settings/api
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

This gets committed in place of the real `.env`. A new contributor copies it:

```
cp .env.example .env
```

Then fills in their own Supabase project credentials. The real `.env` stays local and ignored.

## Step 4: Demonstrate why this matters — what happens if you DON'T untrack

To make this concrete, let's show what happens when a tracked file is in `.gitignore`: modifications to it **still show up in `git diff`**. The ignore rule is completely inert.

```bash
# Before our 'git rm --cached', .env changes would show up in git diff.
# We can verify the .gitignore rule works NOW by checking git status:
echo '--- Is .env visible to git anymore? ---'
git status --short .env
echo '(empty = gitignore is working)'
echo ''
echo '--- What about a brand new .env.secret file? ---'
echo 'test' > .env.secret
git status --short .env.secret
echo '(also empty — .gitignore wildcard would catch it if we had one)'
rm -f .env.secret
```

```output
--- Is .env visible to git anymore? ---
D  .env
(empty = gitignore is working)

--- What about a brand new .env.secret file? ---
?? .env.secret
(also empty — .gitignore wildcard would catch it if we had one)
```

The `D  .env` line is the staged deletion from our `git rm --cached` — that's expected and will go away after we commit. The key point: the *file on disk* is no longer visible to git as modified/untracked. The `.gitignore` rule is finally doing its job.

We also see that `.env.secret` *would* show as untracked — the `.gitignore` only covers the exact name `.env`, not variants. That's fine for this project, but worth knowing.

## Step 5: A note on the key that's already in git history

Untracking the file going forward is necessary, but the anon key is **already in the commit history** (commit `e0f8f9d`). Anyone who clones the repo can see it. For this project, that's acceptable because:

1. Supabase anon keys are **public** — they're compiled into the client-side JS bundle and visible in browser DevTools to anyone using the app
2. The key grants zero access without passing RLS policies, which enforce per-user auth
3. Rewriting git history (`git filter-branch` or BFG Repo Cleaner) is disruptive for collaborators and not warranted for a public key

If this were a *service role key*, a database password, or an API secret, you'd need to:
- Rotate the credential immediately (assume it's compromised)
- Rewrite history with `git filter-repo` or BFG
- Force-push the cleaned history

## Step 6: Verify the build still works

The app reads from `.env` at build time via Vite's `import.meta.env`. Since we only removed the file from Git tracking (not from disk), the build should be unaffected.

```bash
npm run build 2>&1
```

```output

> budget-manager@0.0.0 build
> tsc -b && vite build

vite v7.3.1 building client environment for production...
transforming...
✓ 82 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.51 kB │ gzip:   0.31 kB
dist/assets/index-CgVQ3ngv.css   37.37 kB │ gzip:   7.51 kB
dist/assets/index-Cuz31hfF.js   484.62 kB │ gzip: 139.27 kB
✓ built in 2.35s
```

Build passes. The `.env` file is still on disk, Vite still reads it, and the app is unaffected. The only change is that git no longer tracks it.

## Summary

| Before | After |
|--------|-------|
| `.env` tracked by git despite `.gitignore` rule | `.env` untracked; `.gitignore` rule is now effective |
| Supabase credentials visible in every clone | Credentials remain in git history (acceptable for anon key) but won't appear in future commits |
| New contributors must guess which env vars are needed | `.env.example` documents required variables with setup instructions |

**What we did:**
1. `git rm --cached .env` — untrack without deleting from disk
2. Created `.env.example` with placeholder values and a link to Supabase dashboard
3. Verified the build still works (Vite reads from disk, not from git)

**Key takeaway:** `.gitignore` only prevents *untracked* files from being staged. If a file was committed before the ignore rule existed (or in the same commit), you must explicitly `git rm --cached` it to make the rule take effect.

You can verify this document by running `showboat verify fix-env-tracking.md`.
