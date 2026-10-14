# Yordyan Fashion — Financial Management System (FMS)

A simple, offline-first financial management tool for **Yordyan Fashion**, a traditional
Habesha Kemis (Ethiopian dress) business. It records customer orders, payments, production
costs, everyday expenses, cash movement, supplier debts, inventory and tax obligations, and
turns them into clear profit, cash and tax summaries.

It is bilingual (**English + አማርኛ**), works entirely in the browser, and needs no server
account. All data is stored locally on this device (IndexedDB) with one-click JSON / CSV backup.

---

## Quick start

```powershell
npm install      # install dependencies (once)
npm run dev      # start the app at http://localhost:5173
```

Then open the printed `http://localhost:5173/` address in a browser.

Other commands:

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Run the app for daily use (development server)      |
| `npm run build`   | Type-check + build a production bundle into `dist/` |
| `npm run preview` | Serve the built `dist/` bundle locally              |
| `npm run lint`    | Run the linter (`oxlint`)                           |

To use the built version, run `npm run build` then `npm run preview`.

---

## Getting started (first time)

1. Open **Business Profile** and fill in what you know (name, start date, legal form, whether
   you are VAT-registered, rough monthly sales/orders). Anything you don't know can be left
   blank or marked **"I don't know"** — it can be estimated later.
2. Open **Settings** and set opening balances (money you already had in cash / bank / mobile
   money), your expense categories, and a tax basis/rate.
3. Start recording **orders**, **payments**, **production costs** and **expenses** as they happen.
4. Optionally turn on **Show sample data** in the top bar to explore how a filled-in system
   looks. Sample rows are marked `SAMPLE`, are illustrative only, and never count toward your
   real reports.

### Amharic quick guide (አማርኛ)

- መጀመሪያ **የንግድ መረጃ (Business Profile)** ይሙሉ።
- **ማስተካከያዎች (Settings)** ውስጥ የመነሻ ቀሪ ገንዘብዎን ያስገቡ።
- ትዕዛዞችን፣ ክፍያዎችን፣ የምርት ወጪዎችን እና ወጪዎችን በየቀኑ ይመዝግቡ።
- ቋንቋውን በላይኛው አሞሌ መቀየር ይችላሉ (English / አማርኛ)።
- ውሂብዎ በራስዎ መሣሪያ ላይ ብቻ ይቀመጣል። **ማስተካከያዎች → ምትኬ ላክ (JSON)** በመጠቀም በየጊዜው ምትኬ ያድርጉ።

---

## The pages

**Overview**

- **Dashboard** — this month vs last month: sales booked, cash collected, orders
  received/delivered/in production, customer balances owed, direct costs, operating expenses,
  estimated profit, cash & bank balances, supplier payables, and an estimated tax set-aside.
  Includes a 6-month sales-vs-costs trend and an expense breakdown by category.
- **Monthly Summary** — a month-by-month profit & loss: sales, direct production costs, gross
  profit, operating expenses, net profit before tax, estimated tax, profit after tax, cash
  collected, owner contributions and withdrawals.
- **Routine** — a simple daily / weekly / monthly checklist so the books stay up to date.

**Sales & Orders**

- **Customer Orders** — one row per dress order: order no., customer, order date, dress type,
  fabric, size, specs, agreed price, expected/actual completion, delivery status. Shows paid,
  balance, direct cost, order profit and margin. Delivery status: open / in production / ready /
  delivered / cancelled.
- **Customer Payments** — money received against an order: advance, instalment, final payment or
  refund, with method (cash / bank / mobile / other) and account.
- **Production Costs** — order-linked costs: material/fabric, tailor fee, designer fee,
  accessories, delivery, packaging, other. Marks whether each is paid.

**Money & Costs**

- **Daily Cashbook** — automatically generated from performed transactions; shows opening/closing
  balance, money in, money out, owner contributions/withdrawals and transfers between your own
  accounts, per account and in total.
- **Expenses** — record any business expense at any time (rent, shopkeeper salary, electricity,
  water, internet, transport, packaging, marketing, bank fees, admin, equipment, small daily
  costs, other), with paid/unpaid tracking, categories and quick recurring templates.
- **Suppliers & Payables** — suppliers and everything you still owe, across both production
  costs and expenses, with one-click "mark paid".
- **Inventory** — fabrics/items: qty purchased, unit cost, qty used, qty sold, damaged/wasted and
  remaining.

**Planning & Taxes**

- **Pricing Calculator** — suggests a selling price from materials, tailor/designer fees, other
  direct costs and an overhead share, for a desired profit **margin** (and shows **markup**, which
  is different).
- **Tax Tracker** — records tax obligations (estimated vs paid, deadlines, notes) and includes a
  category-aware estimate helper plus researched notes and source links. See the tax section below.

**Setup**

- **Business Profile** — the business details questionnaire.
- **Settings** — language, currency, opening balances, expense categories, tax basis/rate, and
  backup / restore / CSV export / erase-all.

---

## How the numbers are calculated (important rules)

The system is careful not to double-count or mislabel money:

- An **advance payment is part of the agreed price**, never additional sales. Selling price is
  booked once, when the order is received; payments only affect the customer balance.
- **Order-linked production payments are direct costs**, and are not counted again as operating
  expenses.
- **Owner withdrawals are not expenses** and **owner contributions are not sales**.
- **Transfers between your own accounts** (e.g. cash → bank) are neither income nor expense.
- If an order has **no selling price**, no profit or margin is shown.
- **Sample rows** (`SAMPLE`) are excluded from real reports unless you deliberately show them.

Definitions: **margin = profit ÷ selling price**; **markup = profit ÷ cost**. They are not the same.

---

## Tax Tracker — research notes

> **This is indicative guidance, not tax advice.** Live rates and thresholds change. Confirm your
> category, activity band and rate with the **Ministry of Revenues** or a licensed tax professional
> before paying. Never rely on the in-app estimate for a real filing.

Summary of the rules encoded in the app's research panel (sources below):

- **Law in force:** Income Tax (Amendment) **Proclamation No. 1395/2017** (enacted ~17 July 2025,
  gazetted 1 Sept 2025), amending the Federal Income Tax Proclamation No. 979/2016. Replaces the
  old Category C and lump-sum turnover regime.
- **Categories:** **Category A** = bodies, or non-bodies with turnover **≥ ETB 2,000,000**;
  **Category B** = non-bodies with turnover **< ETB 2,000,000**.
- **Business income tax — individuals (graduated):** 0–24,000 = 0%; 24,001–48,000 = 15%;
  48,001–84,000 = 20%; 84,001–120,000 = 25%; 120,001–168,000 = 30%; over 168,000 = 35%.
- **Category B:** presumptive tax of **2%–9% of annual gross sales** (band depends on activity;
  professionals and VAT-registered persons excluded).
- **Minimum Alternate Tax (MAT):** if tax payable is less than **2.5% of turnover**, MAT of 2.5%
  of turnover applies. Does **not** apply to Category B; excess carry-forward up to 5 years.
- **VAT:** **15%**, threshold around **ETB 2,000,000** (Directive No. 1104/2025, Sept 2025; older
  references cite ETB 1,000,000 — confirm).
- **Withholding:** **3%** on goods over ETB 20,000 and services over ETB 10,000.
- **Employment income tax (PAYE, effective 7 July 2025):** 0–2,000 = 0%; 2,001–4,000 = 15%;
  4,001–7,000 = 20%; 7,001–10,000 = 25%; 10,001–14,000 = 30%; over 14,000 = 35%. (A 5,000 ETB
  monthly salary ⇒ roughly 500 ETB/month.)
- **Tax year:** approximately **8 July – 7 July**. Indicative filing windows: Category A within 4
  months, Category B within 2 months of year-end; monthly VAT/withholding by the 30th of the
  following month. **Deadlines are unconfirmed — verify.**

Sources:

- Federal Ministry of Justice — taxation & revenue: <https://justice.gov.et/am/sector/taxation-revenue/>
- Ministry of Finance — tax directives: <https://www.mofed.gov.et/mof-directive/tax-directive/>
- Ministry of Revenues: <https://mor.gov.et/>
- EY — Ethiopia issues a new income tax proclamation:
  <https://taxnews.ey.com/news/2025-2542-ethiopia-issues-a-new-income-tax-proclamation>
- PwC — Ethiopia individual significant developments:
  <https://taxsummaries.pwc.com/ethiopia/individual/significant-developments>
- IMF Selected Issues Paper 2025/108:
  <https://www.imf.org/-/media/files/publications/selected-issues-papers/2025/english/sipea2025108a.pdf>

---

## Your data, backup and privacy

- All records are stored **on this device only**, in the browser's local database (IndexedDB,
  database name `yordyan-fms`). Nothing is sent anywhere.
- The language preference and the "show sample data" switch are remembered in the browser.
- Because there is no server, **back up regularly**. Go to **Settings → Backup & restore**:
  - **Export backup (JSON)** — a full copy you can re-import later or move to another device.
  - **Import backup (JSON)** — merge a previous backup back in.
  - **Export tables as CSV** — open your data in Excel / Google Sheets.
  - **Erase all data** — permanently deletes everything (requires typing `ERASE`).
- Clearing your browser's site data / storage will delete your records, so keep a JSON backup off
  the device (e.g. in cloud storage) as well.

---

## Hosting on Vercel (free)

This app is a static site, so it hosts for free on Vercel's Hobby plan. **The data is not hosted** —
it stays in each visitor's own browser (IndexedDB, "database name `yordyan-fms`"). Hosting the app
online does not move or share your data; use **Settings → Export backup (JSON)** to move records
between devices. Anyone with the URL can open the app, but they will only see their own device's
data.

A `vercel.json` is included (framework `vite`, build `npm run build`, output `dist`), so Vercel
needs no manual build settings.

### One-time deploy via GitHub

1. Create an empty repository on GitHub (no README/.gitignore), e.g. `yordyan-fms`.
2. In this project folder, run:

   ```powershell
   git init
   git add -A
   git config user.name "Your Name"
   git config user.email "you@example.com"
   git commit -m "Yordyan Fashion FMS"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/yordyan-fms.git
   git push -u origin main
   ```

3. Go to <https://vercel.com/new>, sign in (GitHub login is easiest), and **Import** the
   `yordyan-fms` repository.
4. Vercel auto-detects Vite. Leave the defaults (Build Command `npm run build`, Output Directory
   `dist`) and click **Deploy**. You get a public URL like `https://yordyan-fms.vercel.app`.

Every future `git push` to `main` redeploys automatically.

### Note on a shared/cloud database

If you later want data shared and synced **across devices and people** (a real online database),
that requires adding a backend (e.g. Supabase, Neon or Turso free tier) plus login/auth and a
rewrite of the local data layer. The current design is deliberately offline-first and private.

## Technology

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router (hash routing) · Recharts ·
Dexie (IndexedDB) · `ethiopian-date` for Ethiopian ⇄ Gregorian calendar conversion.
Currency is ETB. Dates can be entered in Gregorian (G.C.) or Ethiopian (ዓ.ም) and are stored
consistently in the background.

## Known limitations / next steps

- Business figures still to confirm with the owner: shop rent and shopkeeper pay **frequency**,
  total turnover (needed to choose Category A vs B), and VAT registration status.
- Tax rates/bands are indicative and must be confirmed (see above).
- Lint currently reports 0 errors and a handful of non-blocking React-Compiler warnings.
