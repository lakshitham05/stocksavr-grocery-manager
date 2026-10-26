import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HeartHandshake, BadgePercent, ShieldCheck, Check } from "lucide-react";
import { Layout, Card } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useStore, isRescueEligible, rescueDiscount, rescueImpact, markRescue, daysUntil, inr } from "@/lib/store";

export const Route = createFileRoute("/food-rescue")({
  head: () => ({ meta: [
    { title: "Food Rescue — StockSavr" },
    { name: "description", content: "Reduce food waste with near-expiry discount offers and donation marks in StockSavr." },
    { property: "og:title", content: "Food Rescue — StockSavr" },
    { property: "og:description", content: "Manage safe near-expiry food, suggested discounts and rescue actions." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: FoodRescue,
});

function FoodRescue() {
  const { products, rescueActions, ready } = useStore();
  const [message, setMessage] = useState("");
  const eligible = products.filter(isRescueEligible).sort((a, b) => a.expiry.localeCompare(b.expiry));
  const impact = rescueImpact(products, rescueActions);
  const stats = [
    ["Eligible products", impact.eligibleProducts],
    ["Units saved*", impact.unitsSaved],
    ["Discount offers created", impact.discountOffers],
    ["Donations marked", impact.donations],
  ] as const;

  return (
    <Layout title="Food Rescue">
      <div className="mb-5 flex items-start gap-3 border-l-4 border-primary bg-secondary p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p><strong>Expired food cannot be sold or donated.</strong><br />Check packaging, storage and food condition before discounting or donating.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value]) => <Card key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{ready ? value : "—"}</p></Card>)}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">*Units in rescue actions for currently eligible stock, counted once. Not confirmed sales or completed donations.</p>
      {message && <p role="status" className="mt-4 text-sm font-medium text-primary">{message}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {eligible.map((p) => {
          const days = daysUntil(p.expiry);
          const discount = rescueDiscount(days) ?? 0;
          const action = rescueActions.find((a) => a.productId === p.id && a.expiry === p.expiry);
          const selectAction = (kind: "discountOffer" | "donation") => {
            const error = markRescue(p.id, kind);
            setMessage(error ?? `${p.name}: ${kind === "discountOffer" ? "discount offer created" : "marked for donation"}.`);
          };
          return <Card key={p.id} className="min-w-0 border-t-4 border-t-accent">
            <div className="flex items-start justify-between gap-2">
              <h2 className="min-w-0 break-words font-semibold">{p.name}</h2>
              <span className="badge-near shrink-0">{days === 0 ? "Expires today" : `${days} day${days === 1 ? "" : "s"} left`}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{p.category}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Current stock</dt><dd className="font-medium">{p.quantity} units</dd>
              <dt className="text-muted-foreground">Expiry date</dt><dd>{p.expiry}</dd>
              <dt className="text-muted-foreground">Selling price</dt><dd>{inr(p.sellPrice)}</dd>
            </dl>
            <div className="mt-4 border-t pt-3 text-sm">
              <p className="font-semibold text-primary">Suggested action: {discount}% discount</p>
              <p className="mt-1 text-muted-foreground">Offer price: {inr(Math.round(p.sellPrice * (100 - discount)) / 100)} per unit</p>
            </div>
            <div className="mt-3 flex min-h-6 flex-wrap gap-2" aria-live="polite">
              {action?.discountOffer && <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Check className="h-3 w-3" />Discount offer created</span>}
              {action?.donation && <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Check className="h-3 w-3" />Marked for donation</span>}
              {p.quantity === 0 && <span className="text-xs text-muted-foreground">Out of stock</span>}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Button disabled={p.quantity <= 0 || action?.discountOffer} onClick={() => selectAction("discountOffer")}><BadgePercent />Create Discount Offer</Button>
              <Button variant="outline" disabled={p.quantity <= 0 || action?.donation} onClick={() => selectAction("donation")}><HeartHandshake />Mark for Donation</Button>
            </div>
          </Card>;
        })}
      </div>
      {!ready && <p className="mt-6 text-muted-foreground">Loading food rescue…</p>}
      {ready && eligible.length === 0 && <p className="border-t py-8 text-center text-muted-foreground">No food products expire within the next 7 days.</p>}
    </Layout>
  );
}