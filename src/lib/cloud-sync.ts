import { supabase } from "@/integrations/supabase/client";
import {
  getProducts, getRescueActions, getSales, hasLocalProducts, replaceAll, sampleProducts, setChangeHook,
  type Change, type Product, type RescueAction, type Sale,
} from "@/lib/store";

const OWNER_KEY = "stocksavr.cloudOwner"; // which account the local cache belongs to

const toProductRow = (p: Product, user_id: string) => ({
  user_id, id: p.id, name: p.name, category: p.category, quantity: p.quantity, low_stock: p.lowStock,
  sell_price: p.sellPrice, buy_price: p.buyPrice, expiry: p.expiry, is_food: p.isFood !== false,
  updated_at: new Date().toISOString(),
});
const toSaleRow = (s: Sale, user_id: string) => ({
  user_id, id: s.id, product_id: s.productId, product_name: s.productName, quantity: s.quantity,
  unit_price: s.unitPrice, total: s.total, sold_at: s.at,
});
const toRescueRow = (a: RescueAction, user_id: string) => ({
  user_id, product_id: a.productId, expiry: a.expiry, discount_offer: a.discountOffer, donation: a.donation,
});

async function check<T extends { error: { message: string } | null }>(p: PromiseLike<T>) {
  const r = await p;
  if (r.error) throw new Error(r.error.message);
  return r;
}

async function uploadAll(userId: string, products: Product[], sales: Sale[], actions: RescueAction[]) {
  if (products.length) await check(supabase.from("products").upsert(products.map((p) => toProductRow(p, userId))));
  if (sales.length) await check(supabase.from("sales").upsert(sales.map((s) => toSaleRow(s, userId))));
  if (actions.length) await check(supabase.from("rescue_actions").upsert(actions.map((a) => toRescueRow(a, userId))));
}

export async function pullFromCloud(userId: string) {
  const [pr, sr, rr] = await Promise.all([
    check(supabase.from("products").select("*").order("updated_at", { ascending: false })),
    check(supabase.from("sales").select("*").order("sold_at", { ascending: false })),
    check(supabase.from("rescue_actions").select("*")),
  ]);
  if (!pr.data.length && !sr.data.length) {
    // First sign-in: move this browser's existing records to the cloud (once), otherwise start with samples.
    const owner = localStorage.getItem(OWNER_KEY);
    if (!owner && hasLocalProducts()) await uploadAll(userId, getProducts(), getSales(), getRescueActions());
    else await uploadAll(userId, sampleProducts(), [], []);
    localStorage.setItem(OWNER_KEY, userId);
    return pullFromCloud(userId);
  }
  localStorage.setItem(OWNER_KEY, userId);
  replaceAll(
    pr.data.map((r) => ({
      id: r.id, name: r.name, category: r.category, quantity: r.quantity, lowStock: r.low_stock,
      sellPrice: Number(r.sell_price), buyPrice: Number(r.buy_price), expiry: r.expiry, isFood: r.is_food,
    })),
    sr.data.map((r) => ({
      id: r.id, productId: r.product_id, productName: r.product_name, quantity: r.quantity,
      unitPrice: Number(r.unit_price), total: Number(r.total), at: r.sold_at,
    })),
    rr.data.map((r) => ({ productId: r.product_id, expiry: r.expiry, discountOffer: r.discount_offer, donation: r.donation })),
  );
}

async function push(userId: string, c: Change) {
  if (c.kind === "product") await check(supabase.from("products").upsert(toProductRow(c.product, userId)));
  else if (c.kind === "deleteProduct") await check(supabase.from("products").delete().eq("user_id", userId).eq("id", c.id));
  else if (c.kind === "sale") {
    await check(supabase.from("sales").insert(toSaleRow(c.sale, userId)));
    await check(supabase.from("products").upsert(toProductRow(c.product, userId)));
  } else await check(supabase.from("rescue_actions").upsert(toRescueRow(c.action, userId)));
}

/** Start syncing for a signed-in user. Returns a stop function. */
export function startSync(userId: string, onError: (msg: string) => void, onReady: () => void) {
  let timer: number | undefined;
  const refresh = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => pullFromCloud(userId).catch((e) => onError(e.message)), 400);
  };
  setChangeHook((c) => push(userId, c).catch((e) => onError(`Could not save to cloud: ${e.message}`)));
  pullFromCloud(userId).then(onReady, (e) => { onError(e.message); onReady(); });
  const channel = supabase.channel(`stocksavr-${userId}`);
  for (const table of ["products", "sales", "rescue_actions"] as const) {
    channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` }, refresh);
  }
  channel.subscribe();
  window.addEventListener("focus", refresh);
  return () => {
    setChangeHook(null);
    window.clearTimeout(timer);
    window.removeEventListener("focus", refresh);
    void supabase.removeChannel(channel);
  };
}
