export type Mode = "" | "LOCAL" | "PER_MILE";
type Quantity = { value: string; source: "empty" | "suggested" | "manual" | "saved"; key?: string };
export type QuoteDraft = {
  mode: Mode;
  modeManual: boolean;
  rate: string;
  rateManual: boolean;
  saved: boolean;
  LOCAL: Quantity;
  PER_MILE: Quantity;
};
export function initialQuoteDraft(mode: Mode, rate: string, quantity?: number): QuoteDraft {
  const saved = quantity !== undefined;
  return {
    mode,
    rate,
    saved,
    modeManual: false,
    rateManual: false,
    LOCAL: {
      value: saved && mode === "LOCAL" ? String(quantity) : "3",
      source: saved && mode === "LOCAL" ? "saved" : "empty",
    },
    PER_MILE: {
      value: saved && mode === "PER_MILE" ? String(quantity) : "",
      source: saved && mode === "PER_MILE" ? "saved" : "empty",
    },
  };
}
export function reconcileQuote(
  draft: QuoteDraft,
  suggestion: { key: string; mode: Exclude<Mode, ""> | null; miles?: number },
  rateFor: (m: string) => string,
): QuoteDraft {
  let next = draft;
  const update = (patch: Partial<QuoteDraft>) => {
    next = { ...next, ...patch };
  };
  if (!draft.saved && !draft.modeManual && !draft.rateManual && suggestion.mode !== draft.mode) {
    const mode = suggestion.mode ?? "";
    if (mode !== draft.mode) update({ mode, rate: mode ? rateFor(mode) : "" });
  }
  if (next.PER_MILE.source === "suggested" && next.PER_MILE.key !== suggestion.key)
    update({ PER_MILE: { value: "", source: "empty" } });
  if (
    !next.saved &&
    next.mode === "PER_MILE" &&
    (next.PER_MILE.source === "empty" || next.PER_MILE.source === "suggested") &&
    suggestion.miles !== undefined
  ) {
    const value = suggestion.miles.toFixed(1);
    if (next.PER_MILE.value !== value || next.PER_MILE.key !== suggestion.key)
      update({ PER_MILE: { value, source: "suggested", key: suggestion.key } });
  }
  return next;
}
