# Project Plan: Budget Workbench App

## 1. High-Level Concept
A "Forecasting Workbench" application that mimics a spreadsheet/Notion workflow. It allows the user to manage current account balances and model future cash flow by toggling items between a "Staged" state (BAL) and an "Active Calculation" state (CALC).

**Key Constraint:** The app must be deployed to GitHub Pages (Static Host) but persist data to a cloud database (Supabase) to allow access from multiple devices (Desktop/Mobile) with Authentication.

## 2. User Flow & Core Logic
1.  **Authentication:** User logs in (Email/Password) via Supabase Auth.
2.  **Dashboard (The Workbench):**
    * **Top Section (Accounts):** Displays "Hard" accounts (Banks/Credit Cards). User manually updates current balances here.
    * **Main Section (Transaction List):** The list of all expenses/incomes.
        * **Logic:** Each row has a `BAL` column (Amount) and a `CALC` toggle.
        * **Calculation:** If `in_calc` is TRUE, the amount contributes to the "Remaining Balance" header. If FALSE, it sits in staging.
    * **Sidebar/Drawer (Bill Library):** A list of recurring templates (Netflix, Mortgage).
        * **Action:** Clicking a template instantiates a new copy of that item into the Main Transaction List.

## 3. Tech Stack
* **Frontend:** React (Vite) + TypeScript.
* **Styling:** Tailwind CSS (Shadcn/UI components recommended for tables/inputs).
* **State Management:** React Query (TanStack Query) for syncing with DB.
* **Backend/Database:** Supabase (PostgreSQL).
* **Authentication:** Supabase Auth.
* **Deployment:** GitHub Pages (via GitHub Actions).

## 4. Data Model (Supabase Schema)

### Table: `accounts`
*Represents the "Hard" assets shown at the top (e.g., Checking, Venmo).*
* `id`: UUID
* `user_id`: UUID (FK)
* `name`: Text (e.g., "CEFCU Checking")
* `current_balance`: Numeric (The 'BAL' value)
* `is_liability`: Boolean (True for Credit Cards)

### Table: `transactions`
*Represents the rows in the workbench.*
* `id`: UUID
* `user_id`: UUID (FK)
* `description`: Text
* `amount`: Numeric (Negative for cost, positive for income)
* `status`: Text ('paid', 'pending', 'planning')
* `is_in_calc`: Boolean (The critical switch. If TRUE, this number is summed into the Workbench total)
* `due_date`: Date (Optional)

### Table: `bill_templates`
*Represents the "Menu" of recurring bills.*
* `id`: UUID
* `user_id`: UUID (FK)
* `name`: Text
* `default_amount`: Numeric
* `frequency`: Text ('monthly', 'yearly')

## 5. Feature Checklist (MVP)
- [ ] **Setup:** Initialize Vite React project + Supabase Client.
- [ ] **Auth:** Create Login/Sign-up page.
- [ ] **Accounts Component:** View and edit list of Bank Accounts (CRUD).
- [ ] **Workbench Component:**
    - [ ] Display list of `transactions`.
    - [ ] "Toggle Calc" button per row (Moves value from inactive to active sum).
    - [ ] Live "Resulting Balance" header (Sum of Accounts + Sum of Active Transactions).
- [ ] **Bill Library:** Click-to-add functionality for recurring bills.
- [ ] **Deployment:** GitHub Action workflow to build and deploy to gh-pages branch.

## 6. Implementation Notes for Agent
* **Calculations:** The "Top Line" number is dynamic. Formula: `Sum(Accounts.current_balance) + Sum(Transactions.amount WHERE is_in_calc = true)`.
* **UI/UX:** Use a dense table layout similar to Notion. Avoid excessive padding.
* **Supabase RLS:** Ensure Row Level Security (RLS) policies are enabled so users can only see their own data.