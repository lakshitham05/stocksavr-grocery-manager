# StockSavr

A simple stock and sales tracker for small grocery and food shops (Version 1).

## Features
- **Dashboard** – total products, stock units, low-stock count, near-expiry count, expired count, today's sales (₹).
- **Products** – add, edit, delete, search, filter by category and status. Fields: name, category, quantity, low-stock limit, selling price, purchase price, expiry date. Sample grocery products load on first visit.
- **Record Sale** – pick a product and quantity; stock reduces automatically, overselling is blocked, and each sale is saved with date, time, product, quantity and total.
- **Alerts** – expired (red), expiring within 7 days (orange), low stock (yellow).
- **Reports** – today's sales, total sales, units sold, 7-day sales chart and recent sales history.

All data is stored in the browser's localStorage, so it stays after refresh. No login, database or API keys needed. To reset, clear the site's data in your browser.

## Run locally
```bash
bun install   # or npm install
bun run dev   # or npm run dev
```
Then open the URL shown in the terminal (usually http://localhost:8080).
