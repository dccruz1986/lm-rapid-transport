import type { PricingMode } from "@lm/types";
export function calculateTotal(mode: PricingMode, quantity: number, rateCents: number, minimumHours = 3) {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10000) throw new Error("INVALID_QUANTITY");
  if (!Number.isSafeInteger(rateCents) || rateCents < 1 || rateCents > 10000000)
    throw new Error("INVALID_RATE");
  if (!Number.isInteger(minimumHours) || minimumHours < 1 || minimumHours > 24)
    throw new Error("INVALID_MINIMUM");
  if (mode !== "LOCAL" && mode !== "PER_MILE") throw new Error("INVALID_MODE");
  const billable = mode === "LOCAL" ? Math.max(minimumHours, Math.ceil(quantity)) : Math.ceil(quantity);
  return { billable, totalCents: billable * rateCents };
}
export function elapsedHours(start: string, end: string) {
  const milliseconds = Date.parse(end) - Date.parse(start);
  if (!Number.isFinite(milliseconds) || milliseconds <= 0 || milliseconds > 168 * 3600000)
    throw new Error("INVALID_DURATION");
  return milliseconds / 3600000;
}
