import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Layout, Card } from "@/components/Layout";
import { useStore, isToday, inr, ymd } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — StockSavr" },
      { name: "description", content: "Simple sales reports for your shop." },
      { property: "og:title", content: "Reports — StockSavr" },
      { property: "og:description", content: "Daily and total sales at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { sales, ready } = useStore();
  const today = sales.filter((s) => isToday(s.at)).reduce((a, s) => a + s.total, 0);
  const total = sales.reduce((a, s) => a + s.total, 0);
  const units = sales.reduce((a, s) => a + s.quantity, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = ymd(d);
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      amount: sales.filter((s) => ymd(new Date(s.at)) === key).reduce((a, s) => a + s.total, 0),
    };
  });
  return (
    <Layout title="Reports">
      <div className="grid grid-cols-3 gap-3">
        {[["Today's sales", inr(today)], ["Total sales", inr(total)], ["Units sold", units]].map(([l, v]) => (
          <Card key={l as string}><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-xl font-bold sm:text-2xl">{v}</p></Card>
        ))}
      </div>
      <Card className="mt-4">
        <h2 className="mb-3 font-semibold">Sales — last 7 days</h2>
        <div className="h-64">
          {ready && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
      <Card className="mt-4 overflow-x-auto">
        <h2 className="mb-2 font-semibold">Recent sales</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="py-2">Date & time</th><th>Product</th><th className="text-right">Qty</th><th className="text-right">Amount</th></tr></thead>
          <tbody className="divide-y">
            {sales.slice(0, 30).map((s) => (
              <tr key={s.id}><td className="py-2">{new Date(s.at).toLocaleString("en-IN")}</td><td>{s.productName}</td><td className="text-right">{s.quantity}</td><td className="text-right font-medium">{inr(s.total)}</td></tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={4} className="py-3 text-muted-foreground">No sales recorded yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </Layout>
  );
}
