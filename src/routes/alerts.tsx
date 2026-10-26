import { createFileRoute } from "@tanstack/react-router";
import { Layout, Card } from "@/components/Layout";
import { useStore, isExpired, isNearExpiry, isLowStock, daysUntil, type Product } from "@/lib/store";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — StockSavr" },
      { name: "description", content: "Expired, near-expiry and low-stock products." },
      { property: "og:title", content: "Alerts — StockSavr" },
      { property: "og:description", content: "See what needs attention in your shop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Alerts,
});

function Section({ title, items, cls, info }: { title: string; items: Product[]; cls: string; info: (p: Product) => string }) {
  return (
    <Card className={`border-l-4 ${cls}`}>
      <h2 className="mb-2 font-semibold">{title} ({items.length})</h2>
      <ul className="divide-y text-sm">
        {items.map((p) => (
          <li key={p.id} className="flex justify-between gap-2 py-2"><span>{p.name}</span><span className="text-muted-foreground">{info(p)}</span></li>
        ))}
        {items.length === 0 && <li className="py-2 text-muted-foreground">Nothing here 🎉</li>}
      </ul>
    </Card>
  );
}

function Alerts() {
  const { products } = useStore();
  return (
    <Layout title="Alerts">
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Expired" cls="border-l-destructive bg-destructive/5" items={products.filter(isExpired)}
          info={(p) => `${-daysUntil(p.expiry)} day(s) ago`} />
        <Section title="Expiring within 7 days" cls="border-l-accent bg-accent/20" items={products.filter(isNearExpiry)}
          info={(p) => (daysUntil(p.expiry) === 0 ? "today" : `in ${daysUntil(p.expiry)} day(s)`)} />
        <Section title="Low stock" cls="border-l-warning bg-warning/15" items={products.filter(isLowStock)}
          info={(p) => `${p.quantity} left (limit ${p.lowStock})`} />
      </div>
    </Layout>
  );
}
