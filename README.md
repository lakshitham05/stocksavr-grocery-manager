# StockSavr

A simple stock and sales tracker for small grocery and food shops (Version 1).

## Features
- **Dashboard** – total products, stock units, low-stock count, near-expiry count, expired count, today's sales (₹).
- **Products** – add, edit, delete, search, filter by category and status. Fields: name, category, quantity, low-stock limit, selling price, purchase price, expiry date. Sample grocery products load on first visit.
- **Record Sale** – pick a product and quantity; stock reduces automatically, overselling is blocked, and each sale is saved with date, time, product, quantity and total.
- **Alerts** – expired (red), expiring within 7 days (orange), low stock (yellow).
- **Food Rescue** – non-expired food expiring within 7 days, with stock, expiry, days remaining and selling price. Suggested markdowns: 40% for 1–2 days (also expiry day), 25% for 3–4 days, and 10% for 5–7 days. Create a discount offer or mark for donation; both statuses persist after refresh. The summary counts eligible products, unique units in selected rescue actions, offers and donation marks for currently eligible stock. These are planned units, not confirmed saved food; marking an action does not reduce stock or change sale prices. New expiry dates represent a new batch and do not inherit old actions. Uncheck “Food product” when adding or editing non-food items; existing grocery records default to food.
- **Food safety** – expired items never appear in Food Rescue and cannot be sold, including through the sale-saving guard. Expired food cannot be sold or donated. Check condition and storage before offering or donating non-expired food.
- **Reports** – today's sales, total sales, units sold, 7-day sales chart and recent sales history.

All data is stored in the browser's localStorage, so it stays after refresh. No login, database or API keys needed. To reset, clear the site's data in your browser.

## Run locally
```bash
bun install   # or npm install
bun run dev   # or npm run dev
```
Then open the URL shown in the terminal (usually http://localhost:8080).
