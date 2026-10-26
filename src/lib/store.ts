import { useEffect, useState } from "react";

export type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  lowStock: number;
  sellPrice: number;
  buyPrice: number;
  expiry: string; // YYYY-MM-DD
};
export type Sale = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  at: string; // ISO
};

const PK = "stocksavr.products";
const SK = "stocksavr.sales";
const listeners = new Set<() => void>();

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function ymd(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
};

function seed(): Product[] {
  const rows: [string, string, number, number, number, number, number][] = [
    ["Basmati Rice 5kg", "Grains", 24, 5, 650, 560, 240],
    ["Toor Dal 1kg", "Pulses", 18, 6, 160, 135, 150],
    ["Amul Milk 500ml", "Dairy", 12, 10, 30, 26, 2],
    ["Amul Butter 100g", "Dairy", 8, 5, 58, 50, 20],
    ["Britannia Bread", "Bakery", 6, 5, 45, 38, -1],
    ["Aashirvaad Atta 5kg", "Grains", 4, 5, 285, 250, 120],
    ["Tata Salt 1kg", "Essentials", 40, 10, 28, 22, 365],
    ["Fortune Sunflower Oil 1L", "Oils", 15, 5, 165, 145, 180],
    ["Parle-G Biscuits", "Snacks", 60, 20, 10, 8, 90],
    ["Maggi Noodles", "Snacks", 3, 12, 14, 12, 60],
    ["Paneer 200g", "Dairy", 5, 4, 90, 75, 5],
    ["Curd 400g", "Dairy", 7, 5, 40, 34, -3],
    ["Sugar 1kg", "Essentials", 30, 8, 48, 42, 300],
    ["Red Label Tea 250g", "Beverages", 10, 4, 145, 125, 200],
  ];
  return rows.map(([name, category, quantity, lowStock, sellPrice, buyPrice, d]) => ({
    id: uid(), name, category, quantity, lowStock, sellPrice, buyPrice, expiry: addDays(d),
  }));
}

function read<T>(k: string): T | null {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function getProducts(): Product[] {
  let p = read<Product[]>(PK);
  if (!p) {
    p = seed();
    localStorage.setItem(PK, JSON.stringify(p));
  }
  return p;
}
export const getSales = (): Sale[] => read<Sale[]>(SK) ?? [];

function save(products: Product[], sales?: Sale[]) {
  localStorage.setItem(PK, JSON.stringify(products));
  if (sales) localStorage.setItem(SK, JSON.stringify(sales));
  listeners.forEach((l) => l());
}

export function upsertProduct(p: Product) {
  const all = getProducts();
  const i = all.findIndex((x) => x.id === p.id);
  if (i >= 0) all[i] = p;
  else all.unshift(p);
  save(all);
}
export function deleteProduct(id: string) {
  save(getProducts().filter((p) => p.id !== id));
}

export function recordSale(productId: string, qty: number): string | null {
  const all = getProducts();
  const p = all.find((x) => x.id === productId);
  if (!p) return "Please choose a product.";
  if (!Number.isInteger(qty) || qty <= 0) return "Quantity must be a whole number above 0.";
  if (qty > p.quantity) return `Only ${p.quantity} units of ${p.name} available.`;
  p.quantity -= qty;
  const sale: Sale = {
    id: uid(), productId, productName: p.name, quantity: qty,
    unitPrice: p.sellPrice, total: qty * p.sellPrice, at: new Date().toISOString(),
  };
  save(all, [sale, ...getSales()]);
  return null;
}

export function daysUntil(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d).getTime() - t.getTime()) / 86400000);
}
export const isExpired = (p: Product) => daysUntil(p.expiry) < 0;
export const isNearExpiry = (p: Product) => { const d = daysUntil(p.expiry); return d >= 0 && d <= 7; };
export const isLowStock = (p: Product) => p.quantity <= p.lowStock;
export const isToday = (iso: string) => ymd(new Date(iso)) === ymd(new Date());
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export function useStore() {
  const [state, setState] = useState<{ products: Product[]; sales: Sale[]; ready: boolean }>({
    products: [], sales: [], ready: false,
  });
  useEffect(() => {
    const load = () => setState({ products: getProducts(), sales: getSales(), ready: true });
    load();
    listeners.add(load);
    window.addEventListener("storage", load);
    return () => { listeners.delete(load); window.removeEventListener("storage", load); };
  }, []);
  return state;
}
