export const BUSINESS_TIMEZONE = "America/New_York";
export * from "./admin-request";
export * from "./intake-v2";
export * from "./measurements";
export * from "./operational-time";
export * from "./pricing";
export * from "./schemas";
export * from "./transitions";
export function miamiDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export * from "./form-errors";
