import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { daysUntil, getProducts, getSales, getRescueActions, isRescueEligible, markRescue, recordSale, rescueDiscount, rescueImpact, upsertProduct, type Product } from "@/lib/store";

const product = (id: string, expiry: string, extra: Partial<Product> = {}): Product => ({ id, expiry, name: id, category: "Dairy", quantity: 12, lowStock: 2, sellPrice: 100, buyPrice: 70, ...extra });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 26, 12));
  localStorage.clear();
  localStorage.setItem("stocksavr.products", "[]");
});
afterEach(() => vi.useRealTimers());

describe("Food Rescue rules", () => {
  it("excludes expired food even when an action was previously saved", () => {
    expect(isRescueEligible(product("expired", "2026-10-25"))).toBe(false);
    upsertProduct(product("expired", "2026-10-25"));
    expect(markRescue("expired", "donation")).not.toBeNull();
    expect(getRescueActions()).toEqual([]);
  });
  it("includes the next seven days but excludes eight days away", () => {
    for (let day = 26; day <= 31; day++) expect(isRescueEligible(product("food", `2026-10-${day}`))).toBe(true);
    expect(isRescueEligible(product("food", "2026-11-01"))).toBe(true);
    expect(isRescueEligible(product("food", "2026-11-02"))).toBe(true);
    expect(isRescueEligible(product("food", "2026-11-03"))).toBe(false);
    expect(daysUntil("2026-11-02")).toBe(7);
  });
  it("excludes non-food products", () => expect(isRescueEligible(product("soap", "2026-10-28", { isFood: false }))).toBe(false));
  it("suggests 40% discount for one and two days", () => {
    expect(rescueDiscount(1)).toBe(40); expect(rescueDiscount(2)).toBe(40);
  });
  it("suggests 25% discount for three and four days", () => {
    expect(rescueDiscount(3)).toBe(25); expect(rescueDiscount(4)).toBe(25);
  });
  it("suggests 10% discount for five through seven days", () => {
    for (const day of [5, 6, 7]) expect(rescueDiscount(day)).toBe(10);
  });
  it("treats expiry day as urgent and gives no discount outside eligibility", () => {
    expect(rescueDiscount(0)).toBe(40); expect(rescueDiscount(-1)).toBeNull(); expect(rescueDiscount(8)).toBeNull();
  });
  it("persists both actions without double-counting units or repeating offers", () => {
    upsertProduct(product("milk", "2026-10-28"));
    expect(markRescue("milk", "discountOffer")).toBeNull();
    expect(markRescue("milk", "discountOffer")).toBeNull();
    expect(markRescue("milk", "donation")).toBeNull();
    expect(getRescueActions()).toEqual([{ productId: "milk", expiry: "2026-10-28", discountOffer: true, donation: true }]);
    expect(rescueImpact(getProducts(), getRescueActions())).toEqual({ eligibleProducts: 1, unitsSaved: 12, discountOffers: 1, donations: 1 });
    expect(getProducts()[0]?.quantity).toBe(12);
  });
  it("does not carry rescue marks into a new expiry batch", () => {
    upsertProduct(product("milk", "2026-10-28")); markRescue("milk", "donation");
    upsertProduct(product("milk", "2026-10-30"));
    expect(rescueImpact(getProducts(), getRescueActions()).donations).toBe(0);
  });
  it("blocks expired sales without changing stock or sales history", () => {
    upsertProduct(product("expired", "2026-10-25"));
    expect(recordSale("expired", 1)).not.toBeNull();
    expect(getProducts()[0]?.quantity).toBe(12); expect(getSales()).toEqual([]);
  });
  it("allows non-expired sales and still prevents overselling", () => {
    upsertProduct(product("milk", "2026-10-28"));
    expect(recordSale("milk", 13)).not.toBeNull(); expect(recordSale("milk", 2)).toBeNull();
    expect(getProducts()[0]?.quantity).toBe(10); expect(getSales()[0]?.total).toBe(200);
  });
});