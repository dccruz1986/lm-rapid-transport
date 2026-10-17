import type { MoveStatus, RequestStatus } from "@lm/types";

const requests: Record<RequestStatus, readonly RequestStatus[]> = {
  NEW: ["CONTACTED", "QUOTED", "CANCELLED"],
  CONTACTED: ["QUOTED", "CANCELLED"],
  QUOTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["QUOTED", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["CONTACTED", "QUOTED", "CONFIRMED", "CANCELLED"],
};
const moves: Record<MoveStatus, readonly MoveStatus[]> = {
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["SCHEDULED", "CANCELLED"],
};
export function canTransitionRequest(from: RequestStatus, to: RequestStatus) {
  return requests[from].includes(to);
}
export function canTransitionMove(from: MoveStatus, to: MoveStatus) {
  return moves[from].includes(to);
}
