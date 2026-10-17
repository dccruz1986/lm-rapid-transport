import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function formatMoney(cents: number, locale: "es" | "en" = "es") {
  return new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
