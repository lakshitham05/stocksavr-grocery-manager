import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Layout, Card, btn, btnGhost, input } from "@/components/Layout";
import { useStore, upsertProduct, deleteProduct, uid, inr, isExpired, isNearExpiry, isLowStock, type Product } from "@/lib/store";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — StockSavr" },
      { name: "description", content: "Add, edit and search your shop's products." },
      { property: "og:title", content: "Products — StockSavr" },
      { property: "og:description", content: "Manage your grocery product list and stock." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Products,
});

const empty = { name: "", category: "", quantity: "", lowStock: "", sellPrice: "", buyPrice: "", expiry: "" };

function Products() {
  const { products } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<typeof empty | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [food, setFood] = useState(true);

  const cats = [...new Set(products.map((p) => p.category))].sort();
  const list = products.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) &&
    (cat === "all" || p.category === cat) &&
    (status === "all" || (status === "low" && isLowStock(p)) || (status === "near" && isNearExpiry(p)) || (status === "expired" && isExpired(p))));

  const open = (p?: Product) => {
    setErr("");
    setFood(p?.isFood !== false);
    setEditId(p?.id ?? null);
    setForm(p ? { ...p, quantity: String(p.quantity), lowStock: String(p.lowStock), sellPrice: String(p.sellPrice), buyPrice: String(p.buyPrice) } : empty);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const n = { quantity: +form.quantity, lowStock: +form.lowStock, sellPrice: +form.sellPrice, buyPrice: +form.buyPrice };
    if (!form.name.trim() || !form.category.trim() || !form.expiry) return setErr("Please fill in all fields.");
    if (Object.values(n).some((v) => isNaN(v) || v < 0) || form.quantity === "" || form.sellPrice === "") return setErr("Numbers must be 0 or more.");
    upsertProduct({ id: editId ?? uid(), name: form.name.trim(), category: form.category.trim(), expiry: form.expiry, isFood: food, ...n });
    setForm(null);
  };
  const f = (k: keyof typeof empty, label: string, type = "text") => (
    <label className="text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input className={input} type={type} min={type === "number" ? 0 : undefined} step={k.includes("Price") ? "0.01" : "1"}
        list={k === "category" ? "cats" : undefined}
        value={form?.[k] ?? ""} onChange={(e) => setForm((s) => s && { ...s, [k]: e.target.value })} />
    </label>
  );

  return (
    <Layout title="Products">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className={input} placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${input} sm:w-44`} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={`${input} sm:w-44`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="low">Low stock</option>
          <option value="near">Near expiry</option>
          <option value="expired">Expired</option>
        </select>
        <button className={btn} onClick={() => open()}><Plus className="h-4 w-4" />Add</button>
      </div>

      {form && (
        <Card className="mb-4">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
            {f("name", "Product name")}
            {f("category", "Category")}
            {f("quantity", "Available quantity", "number")}
            {f("lowStock", "Low-stock limit", "number")}
            {f("sellPrice", "Selling price (₹)", "number")}
            {f("buyPrice", "Purchase price (₹)", "number")}
            {f("expiry", "Expiry date", "date")}
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={food} onCheckedChange={(checked) => setFood(checked === true)} />Food product</label>
            <div className="flex items-end gap-2">
              <button type="submit" className={btn}>{editId ? "Save changes" : "Add product"}</button>
              <button type="button" className={btnGhost} onClick={() => setForm(null)}>Cancel</button>
            </div>
            {err && <p className="text-sm text-destructive sm:col-span-2 lg:col-span-4">{err}</p>}
          </form>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
              </div>
              <div className="flex gap-1">
                <button aria-label={`Edit ${p.name}`} className={btnGhost} onClick={() => open(p)}><Pencil className="h-4 w-4" /></button>
                <button aria-label={`Delete ${p.name}`} className={btnGhost} onClick={() => confirm(`Delete ${p.name}?`) && deleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
              <span className="text-muted-foreground">Stock</span><span className="font-medium">{p.quantity} (limit {p.lowStock})</span>
              <span className="text-muted-foreground">Sell / Buy</span><span>{inr(p.sellPrice)} / {inr(p.buyPrice)}</span>
              <span className="text-muted-foreground">Expiry</span><span>{p.expiry}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {isExpired(p) && <span className="badge-expired">Expired</span>}
              {isNearExpiry(p) && <span className="badge-near">Near expiry</span>}
              {isLowStock(p) && <span className="badge-low">Low stock</span>}
            </div>
          </Card>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">No products found.</p>}
      </div>
    </Layout>
  );
}
