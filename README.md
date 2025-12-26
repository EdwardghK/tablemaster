# TableMaster

TableMaster is a restaurant table, guest, and menu workflow app built with React + Vite. It keeps FOH/BOH in sync with Supabase-backed menus and local persistence for tables, guests, orders, and dark-mode preferences.

## Features
- Table dashboard: create/edit tables with status, section, and guest counts; search/filter; shows order/allergen badges; quick add.
- Seat & order view: per-table guest roster with allergens/notes, course assignment per item, add/duplicate/edit/delete orders, menu filtering by category and pre-fixed menus, per-item notes, multi-guest support.
- Menu management: fetch/add/edit menu items stored in Supabase `menu_items`/`menu_categories`/`menu_prices`, with allergens, descriptions, categories, and price helpers.
- Pre-fixed menus: build multi-course menus from existing items and persist to Supabase `prefixed_menus`; load them in Table Details for service.
- Expo & floor tools: expo view for table status with guest/order counts and allergen flags; floor map with drag/drop table positions, section filter, and quick create/edit.
- Offline-friendly: tables/guests/orders and dark-mode preference persist in `localStorage`; menus seed with sample data if Supabase is empty.

## Stack
React 18 + Vite 7, React Router, Tailwind + shadcn/ui primitives, React Query, Supabase JS, lucide-react icons.

## Getting started
1) Prereqs: Node 18+ and npm.
2) Install: `npm install`.
3) Environment: create `.env` in the project root with:
```
VITE_SUPABASE_URL=<your_supabase_project_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
```
4) Dev server: `npm run dev` (Vite dev server with hot reload).
5) Lint/build: `npm run lint`, `npm run build`, `npm run preview`.

## Deploying to Cloudflare
- Build output is `dist` (Vite default).
- Pages (recommended): run `npm run build` then `npx wrangler pages deploy dist --project-name tablemaster`. In the Pages UI set root/path to `/` and output/build directory to `dist`. No deploy command needed.
- Workers (if you need workers.dev or routes): `wrangler.toml` already points to `_worker.js` and `assets = { directory = "dist" }`. Run `npm run build` then `npx wrangler deploy` to serve `dist` with SPA fallback.

## Supabase data model (minimum)
- `menu_categories`: `id`, `slug` (unique), `name`, `sort_order`.
- `menu_items`: `id`, `category_id` FK ? `menu_categories.id`, `name`, `description`, `origin`, `notes`, `allergens` (array/text[]), `created_at`.
- `menu_prices`: `id`, `item_id` FK ? `menu_items.id` or `option_id` FK ? `menu_item_options.id`, `price` (numeric), `currency` (text).
- `menu_item_options`: `id`, `item_id` FK, `option_name`, `option_group`, `sort_order`.
- `menu_addons` (optional): `id`, `item_id` FK, `name`, `description`; prices stored in `menu_prices`.
- `menu_item_variants` (optional, for size-based menus): `label`, `size_oz`, `size_g`, `portion`, `price`, `currency`, `sort_order`.
- `prefixed_menus`: `id`, `name`, `courses` (jsonb array of `{ course, items: [{ id, name }] }`), `created_at`.

The UI assumes category slugs match the constants in `src/Pages/Menu.jsx` (e.g., `appetizers`, `salads`, `steaks`, `sides`, etc.).

## Routes (useful during testing)
- `/` – table list/dashboard.
- `/TableDetails?id=<tableId>` – seat & order workflow for a table.
- `/expo` and `/expo/table?id=<tableId>` – expo view.
- `/menu` – manage menu items.
- `/menu-builder` – create/update pre-fixed menus.
- `/floormap` – drag/drop floor map layout.

## Data persistence notes
- Local keys: `tablemaster_tables`, `tablemaster_guests`, `tablemaster_orders`, `tablemaster_order_items`, `darkMode`.
- Removing those keys in dev resets local data; Supabase data remains remote.

