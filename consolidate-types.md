# Consolidating Duplicate Type Definitions in Budget Manager

*2026-03-01T12:26:57Z by Showboat 0.6.1*
<!-- showboat-id: e74c7fca-1375-4901-9abd-4fce6448bbe8 -->

The Budget Manager codebase has a type duplication problem: the same interfaces are defined independently in multiple component files. When interfaces drift apart, TypeScript can't catch the mismatch — and the Workbench version of `BillTemplate` is *already* missing fields that the canonical BillSchedule version has.

This document walks through finding the duplicates, creating a single source of truth, and updating every import — with a passing build at the end to prove nothing broke.

## Step 1: Find every duplicate `Account` interface

Let's grep the codebase for `interface Account` to see exactly how many copies exist and where.

```bash
grep -rn 'interface Account' src/
```

```output
src/App.tsx:13:interface Account {
src/components/Accounts.tsx:23:interface Account {
src/components/Accounts.tsx:33:interface AccountsProps {
src/components/Captures.tsx:14:interface Account {
src/components/Workbench.tsx:35:interface Account {
```

Four separate `Account` definitions in four files. The `AccountsProps` hit is a different interface — that's fine. But the `Account` shape is defined independently in App.tsx, Accounts.tsx, Captures.tsx, and Workbench.tsx.

Now let's check `BillTemplate`:

```bash
grep -rn 'interface BillTemplate' src/
```

```output
src/components/BillSchedule.tsx:7:export interface BillTemplate {
src/components/Workbench.tsx:43:interface BillTemplate {
```

Two copies of `BillTemplate`. Critically, these have **already diverged** — the BillSchedule version has `next_due_date` and `last_advanced_at`, but the Workbench version doesn't. This is exactly the kind of silent bug that type duplication causes.

Let's also check for the `Transaction` interface and the `Frequency` type while we're at it:

```bash
grep -rn 'interface Transaction\|type Frequency' src/
```

```output
src/components/BillSchedule.tsx:5:export type Frequency = 'bi-weekly' | 'monthly' | 'quarterly' | 'annually'
src/components/Workbench.tsx:24:interface Transaction {
```

Good — `Transaction` only lives in Workbench.tsx and `Frequency` only lives in BillSchedule.tsx (already exported). Those aren't duplicated yet, but they should still live in a shared types file so other components can use them without cross-importing from sibling components.

## Step 2: Create `src/types/index.ts` — the single source of truth

We'll take the *most complete* version of each interface:
- **Account**: from Accounts.tsx (it has `include_in_workbench` as an optional computed field)
- **BillTemplate**: from BillSchedule.tsx (it has `next_due_date` and `last_advanced_at`)
- **Transaction**: from Workbench.tsx (the only copy)
- **Frequency**: from BillSchedule.tsx (the only copy)

```bash
cat src/types/index.ts
```

```output
export interface Account {
  id: string
  name: string
  current_balance: number
  is_liability: boolean
  sort_order: number
  color_index?: number
  include_in_workbench?: boolean
}

export type Frequency = 'bi-weekly' | 'monthly' | 'quarterly' | 'annually'

export interface BillTemplate {
  id: string
  name: string
  default_amount: number
  frequency: Frequency
  next_due_date: string | null
  last_advanced_at: string | null
}

export interface Transaction {
  id: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'planning'
  is_in_calc: boolean
  due_date?: string
  sort_order: number
  tag?: string
}
```

Every domain type in one place. Note that `Account` has the superset of all properties from every file — `sort_order` (which Workbench was missing) and `include_in_workbench` (which only Accounts used, as a computed field). `BillTemplate` now always includes `next_due_date` and `last_advanced_at`.

## Step 3: Update every file to import from the shared types

We need to:
1. **App.tsx** — remove local `Account`, import from `./types`. It already imports `BillTemplate` from BillSchedule, so we'll redirect that too.
2. **Workbench.tsx** — remove local `Account`, `BillTemplate`, and `Transaction`. Import all from `../types`.
3. **Accounts.tsx** — remove local `Account`. Import from `../types`.
4. **Captures.tsx** — remove local `Account`. Import from `../types`.
5. **BillSchedule.tsx** — remove local `Frequency` and `BillTemplate` definitions. Import from `../types` and re-export for backwards compatibility (since App.tsx currently imports `BillTemplate` from here).

```bash
grep -n 'import.*types' src/App.tsx src/components/Workbench.tsx src/components/Accounts.tsx src/components/Captures.tsx src/components/BillSchedule.tsx
```

```output
src/App.tsx:11:import type { Account, BillTemplate } from './types'
src/components/Workbench.tsx:23:import type { Account, BillTemplate, Transaction } from '../types'
src/components/Accounts.tsx:22:import type { Account } from '../types'
src/components/Captures.tsx:5:import type { Account } from '../types'
src/components/BillSchedule.tsx:4:import type { Frequency, BillTemplate } from '../types'
```

Every component now imports from `../types` (or `./types` for App.tsx at the root). BillSchedule re-exports its types so that the existing `import { type BillTemplate } from './components/BillSchedule'` pattern in App.tsx could still work — but we went ahead and pointed App.tsx directly at the types module, which is cleaner.

## Step 4: Verify no duplicate definitions remain

```bash
grep -rn 'interface Account {' src/
```

```output
src/types/index.ts:1:export interface Account {
```

```bash
grep -rn 'interface BillTemplate {' src/
```

```output
src/types/index.ts:13:export interface BillTemplate {
```

```bash
grep -rn 'interface Transaction {' src/
```

```output
src/types/index.ts:22:export interface Transaction {
```

One definition each, all in `src/types/index.ts`. The duplicates are gone.

## Step 5: Build the project to confirm nothing broke

This is the real test — if any import is wrong or any type shape changed in a way that breaks a consumer, TypeScript will catch it.

```bash
npx tsc --noEmit 2>&1
```

```output
npm notice
npm notice New major version of npm available! 10.9.4 -> 11.11.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.11.0
npm notice To update run: npm install -g npm@11.11.0
npm notice
```

Clean — no TypeScript errors. The type checker confirms that every import resolves and every usage is compatible with the canonical definitions.

Let's also run the full Vite build to make sure bundling works:

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
✓ built in 2.32s
```

Build succeeds — `tsc -b` (TypeScript) and `vite build` (bundler) both pass cleanly. The type consolidation didn't break anything.

## Step 6: What changed — the diff

Here's the full diff showing every file touched:

```bash
git diff --stat
```

```output
 src/App.tsx                     | 13 ++-----------
 src/components/Accounts.tsx     | 11 +----------
 src/components/BillSchedule.tsx | 12 ++----------
 src/components/Captures.tsx     | 10 +---------
 src/components/Workbench.tsx    | 27 +--------------------------
 5 files changed, 7 insertions(+), 66 deletions(-)
```

7 lines added (the new imports), 66 lines removed (the duplicate definitions). Net reduction of 59 lines of duplicated type code.

## Summary

**Problem**: The `Account` interface was defined 4 times and `BillTemplate` was defined 2 times across the codebase — and the copies had already diverged (Workbench's `BillTemplate` was missing `next_due_date` and `last_advanced_at`; Workbench's `Account` was missing `sort_order`).

**Fix**: Created `src/types/index.ts` as the single source of truth. Each component now imports from there. BillSchedule re-exports for backwards compatibility.

**Result**: 
- 59 lines of duplicate code removed
- All 4 domain types (`Account`, `BillTemplate`, `Transaction`, `Frequency`) centralized
- Type divergence is no longer possible — any change to a type is immediately visible everywhere
- TypeScript check and Vite build both pass clean

You can verify this document yourself by running `showboat verify consolidate-types.md`.
