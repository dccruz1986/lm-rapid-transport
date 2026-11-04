import { miamiInstant } from "./operational-time";

export function validateMeasurements(
  input: { start: string; start_offset: string; end: string; end_offset: string; miles: string },
  action: "start" | "save" | "complete" | "correct",
  mode: string,
  now = Date.now(),
) {
  const closing = action === "complete" || action === "correct";
  if (!input.start) return { error: "MOVE_START_REQUIRED" } as const;
  let start: string;
  let end: string | undefined;
  try {
    start = miamiInstant(input.start, input.start_offset);
  } catch {
    return { error: "MOVE_START_INVALID" } as const;
  }
  if (Date.parse(start) > now) return { error: "MOVE_START_INVALID" } as const;
  if (closing && !input.end) return { error: "MOVE_END_REQUIRED" } as const;
  if (input.end) {
    try {
      end = miamiInstant(input.end, input.end_offset);
    } catch {
      return { error: "MOVE_END_INVALID" } as const;
    }
    const duration = Date.parse(end) - Date.parse(start);
    if (Date.parse(end) > now || duration <= 0 || duration > 168 * 3600000)
      return { error: "MOVE_END_INVALID" } as const;
  }
  const miles = input.miles.trim() ? Number(input.miles) : undefined;
  if (closing && mode === "PER_MILE" && miles === undefined) return { error: "MOVE_MILES_REQUIRED" } as const;
  if (
    miles !== undefined &&
    (!Number.isFinite(miles) ||
      miles <= 0 ||
      miles > 10000 ||
      Math.abs(miles * 10000 - Math.round(miles * 10000)) > 0.00001 ||
      mode === "LOCAL")
  )
    return { error: "MOVE_MILES_INVALID" } as const;
  if (action === "start" && end) return { error: "MOVE_END_INVALID" } as const;
  return { error: "", start, end, miles } as const;
}
