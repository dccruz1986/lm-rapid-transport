export const roles = ["ADMIN", "MANAGER", "DISPATCHER"] as const;
export type Role = (typeof roles)[number];
export type Locale = "es" | "en";
export const requestStatuses = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "PENDING_REVIEW",
] as const;
export type RequestStatus = (typeof requestStatuses)[number];
export const moveStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "PENDING_REVIEW"] as const;
export type MoveStatus = (typeof moveStatuses)[number];
export type PricingMode = "LOCAL" | "PER_MILE";
export type ActionResult = { ok: boolean; message?: string };
