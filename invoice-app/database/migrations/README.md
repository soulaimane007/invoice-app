# Invoice & Quotation Management System — Phase 1: Database & Models

This is the foundation layer: the MySQL schema, Laravel migrations, and
Eloquent models for `clients`, `articles`, `devis`, `devis_lignes`,
`facture`, `facture_lignes`, plus one addition explained below.
Controllers, API routes, Sanctum auth, PDF generation, and the React
frontend come in the phases that follow — see **Roadmap**.

## What's in this download

```
database/
  schema.sql              — full standalone SQL (tables, FKs, indexes, triggers, seed data)
  migrations/              — the same schema as Laravel migrations
app/Models/
  User.php                 — extended with Sanctum + relationships
  CompanySetting.php       — see "one addition" below
  Client.php
  Article.php
  Devis.php
  DevisLigne.php
  Facture.php
  FactureLigne.php
```

## One addition beyond your original 7 tables

`company_settings` — a single-row table holding the business identity
(name, address, ICE, logo, default TVA rate) printed on every PDF. It's
separate from `users` because in practice more than one staff login
issues documents under the same company identity, and the letterhead
shouldn't change depending on who's logged in. If you'd rather keep
exactly 7 tables, say so and I'll fold these fields into `users` instead.

## Key design decisions

- **Client info is snapshotted onto each devis/facture** (`client_name`,
  `client_address`, `client_ice`, etc., alongside `client_id`). A
  quotation/invoice is a legal document — it should keep showing the
  client's details exactly as they were the day it was issued.
- **Soft deletes** on `clients`, `articles`, `devis`, `facture` — "Delete"
  in a financial app should rarely be a hard delete; historical documents
  still need to reference the client/article that was actually used.
- **`quantity_sold` is not a stored column** — it's derived from
  `SUM(facture_lignes.quantity)` so it can't drift out of sync. Use
  `withSum()` when listing many articles to avoid N+1 queries.
- **"Overdue" isn't a stored status** — `payment_status` only tracks
  `unpaid` / `partial` / `paid`; overdue is computed from `due_date`
  wherever it's displayed, so nothing needs a background job.
- **Reference numbers (`DEV-2026-0001`, `FAC-2026-0001`) aren't generated
  in the model.** Numbering needs a transaction-safe lookup of "the last
  reference issued," which belongs in a service class — Phase 2.
- **`devis` and `facture` reference each other** (a devis links to the
  invoice it became; a facture optionally links back to its source
  devis). That circular FK is resolved by adding
  `devis.converted_to_facture_id` in a later migration, after `facture`
  exists.
- Every model explicitly declares `protected $table`, since Laravel's
  automatic table-name guessing doesn't reliably handle French
  singular/plural (`devis`, `facture`).
- Two MySQL triggers (`trg_articles_prevent_negative_stock_*`) are a
  defense-in-depth safety net — real stock logic lives in
  `ArticleService` (Phase 2), but the database itself should never
  accept negative stock even if that path is bypassed.

## Integrating this into a real Laravel project

```bash
composer create-project laravel/laravel invoice-app
cd invoice-app
composer require laravel/sanctum
php artisan install:api        # publishes Sanctum's migration, wires up api.php

# copy this delivery's files in:
#   database/migrations/*.php  → your database/migrations/
#   app/Models/*.php           → your app/Models/  (overwrite the default User.php)

cp .env.example .env
php artisan key:generate
# set DB_DATABASE, DB_USERNAME, DB_PASSWORD in .env, then:
php artisan migrate

# optional: load the sample data
mysql -u your_user -p your_database < database/schema.sql   # only if starting from a truly empty DB
# if you already ran `php artisan migrate`, run just the INSERT statements
# at the bottom of schema.sql instead — the tables already exist.
```

Two small prerequisites:
- **PHP's `bcmath` extension** (used for exact decimal math on money
  fields) — usually enabled by default; if not: `sudo apt install php8.3-bcmath`.
- No seed *user* is included — passwords must be hashed via Laravel's
  `Hash::make()`, not raw SQL. Create your first login with
  `php artisan tinker` once the app is running.

## Roadmap (the rest of your 24 deliverables)

1. ✅ Database schema, Laravel project structure, Models, Migrations, Relationships
2. Controllers, API Routes, Sanctum authentication, Services, Policies, Validation
3. PDF generation (devis + facture)
4. React project structure, pages, components, styling, dashboard
5. Clients / Articles / Quotations / Invoices modules, Convert-to-Invoice, search & filters, responsive layout
6. Final testing, deployment instructions

Ready for Phase 2 whenever you are — or flag any changes to the schema
above first, since the API layer builds directly on it.
