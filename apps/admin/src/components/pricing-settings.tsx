"use client";
import type { Database } from "@lm/types/database";
import { Button, useLanguage } from "@lm/ui";
import { useActionState } from "react";
import { savePricing } from "@/app/(staff)/settings/actions";
import { DateText, initialResult, PageHeading, ResultNotice } from "./record-ui";

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
const fields = [
  ["hourly_two", "Dos trabajadores + camión (USD/h)", "Two movers + truck (USD/h)"],
  ["hourly_three", "Tres trabajadores + camión (USD/h)", "Three movers + truck (USD/h)"],
  ["hourly_four", "Cuatro trabajadores + camión (USD/h)", "Four movers + truck (USD/h)"],
  ["per_mile", "Tarifa por milla de ida (USD)", "One-way mileage rate (USD)"],
] as const;
export function PricingSettings({
  settings,
  history,
}: {
  settings: Row<"pricing_settings">;
  history: Row<"pricing_change_history">[];
}) {
  const { t, locale } = useLanguage();
  const [state, action, pending] = useActionState(savePricing, initialResult);
  const label = (field: string) => {
    const item = fields.find(([name]) => name === field);
    return item ? t(item[1], item[2]) : t("Mínimo de horas", "Minimum hours");
  };
  const value = (field: string, v: unknown) =>
    field === "minimum_hours"
      ? String(v)
      : new Intl.NumberFormat(locale, { style: "currency", currency: "USD", currencyDisplay: "code" }).format(
          Number(v) / 100,
        );
  return (
    <div className="stack">
      <PageHeading
        es="Tarifas generales"
        en="General pricing"
        subtitle={[
          "Los cambios se aplican a nuevas cotizaciones. Las existentes conservan sus condiciones.",
          "Changes apply to new quotes. Existing quotes keep their terms.",
        ]}
      />
      <form action={action} className="card stack">
        <input type="hidden" name="version" value={settings.version} />
        <p>
          {t(
            "Camión e impuestos incluidos. La tarifa local es por equipo, no por trabajador.",
            "Truck and taxes included. The local rate is per crew, not per mover.",
          )}
        </p>
        <div className="form-grid">
          {fields.map(([key, es, en]) => (
            <label className="field" key={key}>
              {t(es, en)}
              <input
                key={`${key}-${settings.version}`}
                type="number"
                name={key}
                min="0.01"
                max="100000"
                step="0.01"
                required
                defaultValue={(settings[key] / 100).toFixed(2)}
              />
            </label>
          ))}
          <label className="field">
            {t("Mínimo local (horas)", "Local minimum (hours)")}
            <input
              key={settings.version}
              type="number"
              name="minimum_hours"
              min="1"
              max="24"
              step="1"
              required
              defaultValue={settings.minimum_hours}
            />
          </label>
        </div>
        <ResultNotice result={state} />
        <Button disabled={pending}>
          {pending ? t("Guardando…", "Saving…") : t("Guardar tarifas", "Save pricing")}
        </Button>
      </form>
      <section className="card stack">
        <h2>{t("Últimos cambios de tarifas", "Recent pricing changes")}</h2>
        {history.length ? (
          history.map((h) => (
            <p key={h.id}>
              {label(h.field)}: {value(h.field, h.old_value)} → {value(h.field, h.new_value)} ·{" "}
              <DateText value={h.created_at} time /> · {h.actor_id}
            </p>
          ))
        ) : (
          <p className="muted">{t("Todavía no hay cambios.", "No changes yet.")}</p>
        )}
      </section>
    </div>
  );
}
