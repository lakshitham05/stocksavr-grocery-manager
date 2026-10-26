import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, Card, btn, btnAccent } from "@/components/Layout";
import { useStore, isLowStock, isNearExpiry, isExpired, isToday, inr } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — StockSavr" },
      { name: "description", content: "StockSavr helps small grocery shops track stock, sales and expiry dates." },
      { property: "og:title", content: "StockSavr — Shop stock made simple" },
      { property: "og:description", content: "Track stock, sales and expiry dates for your grocery shop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { products, sales } = useStore();
  const stats = [
    { label: "Total products", value: products.length, cls: "border-l-primary" },
    { label: "Total stock units", value: products.reduce((s, p) => s + p.quantity, 0), cls: "border-l-primary" },
    { label: "Low stock", value: products.filter(isLowStock).length, cls: "border-l-warning" },
    { label: "Near expiry (7 days)", value: products.filter(isNearExpiry).length, cls: "border-l-accent" },
    { label: "Expired", value: products.filter(isExpired).length, cls: "border-l-destructive" },
    { label: "Today's sales", value: inr(sales.filter((s) => isToday(s.at)).reduce((a, s) => a + s.total, 0)), cls: "border-l-accent" },
  ];
  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.cls}`}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/sale" className={btn}>Record a sale</Link>
        <Link to="/products" className={btnAccent}>Manage products</Link>
        <Link to="/alerts" className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted">View alerts</Link>
      </div>
    </Layout>
  );
}
