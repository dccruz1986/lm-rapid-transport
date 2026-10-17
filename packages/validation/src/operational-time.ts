// Explicit offset resolves the repeated hour at the autumn clock change.
export function miamiInstant(local: string, offset: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) || !["-04:00", "-05:00"].includes(offset))
    throw new Error("INVALID_INPUT");
  const date = new Date(`${local}:00${offset}`);
  if (!Number.isFinite(date.getTime())) throw new Error("INVALID_INPUT");
  if (miamiLocalTime(date.toISOString()) !== local) throw new Error("INVALID_INPUT");
  return date.toISOString();
}
export function miamiLocalTime(instant: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const p = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function miamiOffset(instant: string) {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" })
    .formatToParts(new Date(instant))
    .find((p) => p.type === "timeZoneName")?.value;
  return hour === "GMT-4" ? "-04:00" : "-05:00";
}
