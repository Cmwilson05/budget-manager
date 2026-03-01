# Creating Pull Requests from Pushed Branches

## Using the GitHub Compare URL

When you push a branch to GitHub, you can open a PR directly in the browser using a URL like this:

```
https://github.com/{owner}/{repo}/compare/main...{branch-name}
```

For example:

```
https://github.com/Cmwilson05/budget-manager/compare/main...claude/review-codebase-XRcia
```

GitHub loads a diff view with a big green **"Create pull request"** button. You fill in a title/description and click — done.

**This works for any of your repos.** The pattern is always:

```
https://github.com/{owner}/{repo}/compare/{base}...{branch}
```

- `{base}` = the branch you want to merge **into** (usually `main`)
- `{branch}` = the branch with your changes

### Recommended workflow for Claude Code sessions

1. Ask Claude to make changes, commit, and push
2. Claude pushes to the branch
3. Open the compare URL in your browser
4. Click "Create pull request"

This skips the `gh` CLI entirely and avoids API auth issues. It takes about 10 seconds.

---

## Using the GitHub.com UI

### Option 1: The Banner (fastest)

After a branch is pushed, you'll usually see a banner at the top of the repo page:

> **"[branch-name] had recent pushes — Compare & pull request"**

Click that button and you're taken straight to the PR creation form.

### Option 2: From the Branch

If the banner isn't showing (it disappears after a while):

1. Go to your repo page on GitHub
2. Click the **"Branches"** dropdown (it says `main` by default)
3. Find your branch in the list
4. Click on it
5. You'll see a message like **"This branch is X commits ahead of main"**
6. Click **"Contribute"** → **"Open pull request"**

### Option 3: From the Pull Requests Tab

1. Go to the **"Pull requests"** tab
2. Click the green **"New pull request"** button
3. Set **base** to `main` and **compare** to your branch
4. Click **"Create pull request"**

All three paths end up at the same PR creation form. The banner method is the fastest when it's available.
