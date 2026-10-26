import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Layout, Card, btn, input } from "@/components/Layout";
import { useStore, recordSale, inr, isExpired } from "@/lib/store";

export const Route = createFileRoute("/sale")({
  head: () => ({
    meta: [
      { title: "Record Sale — StockSavr" },
      { name: "description", content: "Record a sale and update stock automatically." },
      { property: "og:title", content: "Record Sale — StockSavr" },
      { property: "og:description", content: "Quickly record shop sales in rupees." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalePage,
});

function SalePage() {
  const { products, sales } = useStore();
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState("1");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const p = products.find((x) => x.id === pid);
  const total = p ? p.sellPrice * (Number(qty) || 0) : 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = recordSale(pid, Number(qty));
    if (err) setMsg({ ok: false, text: err });
    else { setMsg({ ok: true, text: `Sale saved: ${qty} × ${p?.name} = ${inr(total)}` }); setQty("1"); }
  };

  return (
    <Layout title="Record Sale">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Product</span>
              <select aria-label="Product" className={input} value={pid} onChange={(e) => { setPid(e.target.value); setMsg(null); }}>
                <option value="">Choose a product…</option>
                {products.map((x) => (
                  <option key={x.id} value={x.id} disabled={x.quantity === 0 || isExpired(x)}>
                    {x.name} — {isExpired(x) ? "Expired — cannot be sold" : `${inr(x.sellPrice)} (${x.quantity} left)`}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-muted-foreground">Expired products cannot be sold. Expired food cannot be sold or donated.</p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Quantity sold</span>
              <input className={input} type="number" min={1} value={qty} onChange={(e) => { setQty(e.target.value); setMsg(null); }} />
            </label>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{inr(total)}</span>
            </div>
            {p && isExpired(p) && <p role="alert" className="text-sm text-destructive">{p.name} has expired and cannot be sold.</p>}
            <Button type="submit" className={`${btn} w-full`} disabled={!pid || (p && isExpired(p))}>Save sale</Button>
            {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p>}
          </form>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Latest sales</h2>
          <ul className="divide-y text-sm">
            {sales.slice(0, 6).map((s) => (
              <li key={s.id} className="flex justify-between py-2">
                <span>{s.quantity} × {s.productName}<br /><span className="text-xs text-muted-foreground">{new Date(s.at).toLocaleString("en-IN")}</span></span>
                <span className="font-semibold">{inr(s.total)}</span>
              </li>
            ))}
            {sales.length === 0 && <li className="py-2 text-muted-foreground">No sales yet.</li>}
          </ul>
        </Card>
      </div>
    </Layout>
  );
}
