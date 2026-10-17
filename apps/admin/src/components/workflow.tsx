"use client";
import type { Database } from "@lm/types/database";
import { Button, useLanguage } from "@lm/ui";
import { calculateTotal, dollarsToCents, miamiLocalTime, miamiOffset } from "@lm/validation";
import { useActionState, useState } from "react";
import {
  communicateQuote,
  quoteAction,
  recordMove,
  saveQuote,
  scheduleMove,
} from "@/app/(staff)/workflow-actions";
import { ConfirmedForm } from "./confirmed-form";
import { DateText, initialResult, ResultNotice, StatusBadge } from "./record-ui";

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
type Props = {
  request: Row<"moving_requests">;
  quote: Row<"quotes"> | null;
  move: Row<"moves"> | null;
  settings: Row<"pricing_settings">;
  communications: Row<"quote_communications">[];
  history: Row<"pricing_change_history">[];
  permissions: string[];
  now: string;
  actors: Record<string, string>;
};
function Identity({ request, version }: { request: string; version: number }) {
  return (
    <>
      <input type="hidden" name="request" value={request} />
      <input type="hidden" name="version" value={version} />
    </>
  );
}
function Money({ cents }: { cents: number }) {
  const { locale } = useLanguage();
  return (
    <>
      {new Intl.NumberFormat(locale, { style: "currency", currency: "USD", currencyDisplay: "code" }).format(
        cents / 100,
      )}
    </>
  );
}
function Terms({ value }: { value: Row<"quotes">["confirmed_terms"] }) {
  const { t } = useLanguage();
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return (
    <p>
      {value.mode === "LOCAL"
        ? t("Local por hora", "Local hourly")
        : t("Por milla de ida", "Per one-way mile")}{" "}
      · {String(value.workers)} {t("trabajadores", "movers")} · <Money cents={Number(value.rate_cents)} />
      {value.mode === "LOCAL" && (
        <>
          {" "}
          · {t("Mínimo", "Minimum")}: {String(value.minimum_hours)} h
        </>
      )}
      {value.estimated_total_cents !== undefined && (
        <>
          {" "}
          · {t("Estimación", "Estimate")}: <Money cents={Number(value.estimated_total_cents)} />
        </>
      )}
    </p>
  );
}
function TimeField({
  name,
  label,
  value,
  required = true,
}: {
  name: string;
  label: string;
  value: string;
  required?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="form-grid">
      <label className="field">
        {label}
        <input
          type="datetime-local"
          name={name}
          required={required}
          defaultValue={value ? miamiLocalTime(value) : ""}
        />
      </label>
      <label className="field">
        {t("Zona de Miami", "Miami time zone")}
        <select name={`${name}_offset`} defaultValue={value ? miamiOffset(value) : "-04:00"}>
          <option value="-04:00">EDT (UTC−04:00)</option>
          <option value="-05:00">EST (UTC−05:00)</option>
        </select>
      </label>
    </div>
  );
}
function QuoteEditor({ request, quote, settings }: Pick<Props, "request" | "quote" | "settings">) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(saveQuote, initialResult);
  const [mode, setMode] = useState<"LOCAL" | "PER_MILE">(quote?.mode === "PER_MILE" ? "PER_MILE" : "LOCAL");
  const [workers, setWorkers] = useState(quote?.workers ?? request.workers ?? 2);
  const rateFor = (m: string, w: number) =>
    m === "PER_MILE"
      ? settings.per_mile
      : w === 2
        ? settings.hourly_two
        : w === 3
          ? settings.hourly_three
          : settings.hourly_four;
  const [rate, setRate] = useState(((quote?.rate_cents ?? rateFor(mode, workers)) / 100).toFixed(2));
  const [quantity, setQuantity] = useState(String(quote?.estimated_quantity ?? 3));
  let preview: number | null = null;
  try {
    preview = calculateTotal(
      mode,
      Number(quantity),
      dollarsToCents(rate),
      quote?.minimum_hours ?? settings.minimum_hours,
    ).totalCents;
  } catch {}
  return (
    <form action={action} className="stack">
      <Identity request={request.id} version={quote?.version ?? 0} />
      <p className="muted">
        {t(
          "Confirma los límites municipales: LOCAL solo si ambos extremos están en la ciudad de Miami. El nombre postal no basta.",
          "Verify city boundaries: LOCAL only when both addresses are within the City of Miami. A Miami postal address is not enough.",
        )}
      </p>
      <div className="form-grid">
        <label className="field">
          {t("Modalidad", "Pricing mode")}
          <select
            name="mode"
            value={mode}
            onChange={(e) => {
              const m = e.target.value as "LOCAL" | "PER_MILE";
              setMode(m);
              if (!quote) setRate((rateFor(m, workers) / 100).toFixed(2));
            }}
          >
            <option value="LOCAL">{t("Local — ciudad de Miami", "Local — City of Miami")}</option>
            <option value="PER_MILE">{t("Por millas — Florida", "Per mile — Florida")}</option>
          </select>
        </label>
        <label className="field">
          {t("Trabajadores + camión", "Movers + truck")}
          <select
            name="workers"
            value={workers}
            onChange={(e) => {
              const w = Number(e.target.value);
              setWorkers(w);
              if (!quote) setRate((rateFor(mode, w) / 100).toFixed(2));
            }}
          >
            {[2, 3, 4].map((w) => (
              <option value={w} key={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {mode === "LOCAL"
            ? t("Tarifa del equipo (USD/h)", "Crew rate (USD/h)")
            : t("Tarifa (USD/milla)", "Rate (USD/mile)")}
          <input
            type="number"
            name="rate"
            min="0.01"
            max="100000"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
          />
        </label>
        <label className="field">
          {mode === "LOCAL"
            ? t("Horas estimadas", "Estimated hours")
            : t("Millas estimadas de ida", "Estimated one-way miles")}
          <input
            type="number"
            name="quantity"
            min="0.0001"
            max={mode === "LOCAL" ? 168 : 10000}
            step="0.0001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
      </div>
      {mode === "LOCAL" && (
        <p>
          {t("Mínimo copiado", "Copied minimum")}: {quote?.minimum_hours ?? settings.minimum_hours} h
        </p>
      )}
      <p aria-live="polite">
        {t("Vista previa", "Preview")}: {preview === null ? "—" : <Money cents={preview} />}
      </p>
      <ResultNotice result={state} />
      <Button disabled={pending}>{t("Guardar cotización", "Save quote")}</Button>
    </form>
  );
}
function QuoteApproval({
  request,
  quote,
  permissions,
}: {
  request: string;
  quote: Row<"quotes">;
  permissions: string[];
}) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(quoteAction, initialResult);
  return (
    <form action={action} className="stack">
      <Identity request={request} version={quote.version} />
      <div className="row">
        {quote.status === "ESTIMATED" && permissions.includes("quotes.approve") && (
          <Button name="action" value="approve" disabled={pending}>
            {t("Aprobar internamente", "Approve internally")}
          </Button>
        )}
        {["ACCEPTED", "CONFIRMED"].includes(quote.status) && permissions.includes("quotes.edit") && (
          <Button name="action" value="reopen" variant="outline" disabled={pending}>
            {t("Reabrir para revisar condiciones", "Reopen to review terms")}
          </Button>
        )}
      </div>
      <ResultNotice result={state} />
    </form>
  );
}
function CommunicationForm({ request, quote, now }: { request: string; quote: Row<"quotes">; now: string }) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(communicateQuote, initialResult);
  return (
    <form action={action} className="stack">
      <Identity request={request} version={quote.version} />
      <h3>{t("Registrar comunicación manual", "Record manual communication")}</h3>
      <TimeField
        name="at"
        label={t("Fecha y hora de comunicación", "Communication date and time")}
        value={now}
      />
      <label className="field">
        {t("Medio", "Channel")}
        <select name="medium">
          <option value="PHONE">{t("Teléfono", "Phone")}</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="EMAIL">Email</option>
        </select>
      </label>
      <label className="field">
        {t("Respuesta del cliente", "Customer response")}
        <textarea name="response" maxLength={2000} rows={3} />
      </label>
      <label className="row">
        <input type="checkbox" name="confirm" />
        {t(
          "El cliente aceptó expresamente estas tarifas y condiciones; el total depende de las cantidades reales.",
          "The customer explicitly accepted these rates and terms; the total depends on actual quantities.",
        )}
      </label>
      <ResultNotice result={state} />
      <Button disabled={pending}>{t("Registrar comunicación", "Record communication")}</Button>
    </form>
  );
}
function ScheduleForm({ request, move, now }: { request: string; move: Row<"moves"> | null; now: string }) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(scheduleMove, initialResult);
  return (
    <form action={action} className="stack">
      <Identity request={request} version={move?.version ?? 0} />
      <h3>{t("Programación", "Scheduling")}</h3>
      <p className="muted">
        {t(
          "Lunes a sábado, hora de Miami. Se permiten reservas simultáneas.",
          "Monday–Saturday, Miami time. Overlapping bookings are allowed.",
        )}
      </p>
      <TimeField
        name="at"
        label={t("Fecha y hora acordadas", "Agreed date and time")}
        value={move?.scheduled_at ?? now}
      />
      <label className="field">
        {t("Duración estimada (minutos)", "Estimated duration (minutes)")}
        <input
          type="number"
          name="duration"
          min="1"
          max="10080"
          required
          defaultValue={move?.estimated_duration_minutes ?? 180}
        />
      </label>
      <label className="field">
        {t("Notas operativas", "Operational notes")}
        <textarea name="notes" maxLength={4000} defaultValue={move?.notes ?? ""} />
      </label>
      <ResultNotice result={state} />
      <Button disabled={pending}>{t("Guardar programación", "Save schedule")}</Button>
    </form>
  );
}
function Measurements({
  request,
  quote,
  move,
  now,
}: {
  request: string;
  quote: Row<"quotes">;
  move: Row<"moves">;
  now: string;
}) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(recordMove, initialResult);
  return (
    <ConfirmedForm
      action={action}
      className="stack"
      values={["complete", "correct"]}
      question={t(
        "¿Guardar estas mediciones y calcular el importe final?",
        "Save these measurements and calculate the final amount?",
      )}
    >
      <Identity request={request} version={move.version} />
      <h3>{t("Mediciones reales", "Actual measurements")}</h3>
      <p className="muted">
        {t(
          "Desde la llegada al origen hasta finalizar la descarga, incluyendo pausas y trayecto entre viviendas. No incluye viaje desde/hacia base.",
          "From arrival at origin through completed unloading, including breaks and travel between homes. Excludes travel to/from base.",
        )}
      </p>
      <TimeField
        name="start"
        label={t("Llegada al origen", "Arrival at origin")}
        value={move.started_at ?? now}
      />
      {move.status !== "SCHEDULED" && (
        <>
          <TimeField
            name="end"
            label={t("Descarga finalizada", "Unloading completed")}
            value={move.finished_at ?? ""}
            required={move.status === "COMPLETED"}
          />
          {quote.mode === "PER_MILE" && (
            <label className="field">
              {t("Millas reales de ida", "Actual one-way miles")}
              <input
                type="number"
                name="miles"
                min="0.0001"
                max="10000"
                step="0.0001"
                defaultValue={move.actual_miles ?? ""}
              />
            </label>
          )}
        </>
      )}
      <ResultNotice result={state} />
      <div className="row">
        {move.status === "SCHEDULED" ? (
          <Button name="action" value="start" disabled={pending}>
            {t("Iniciar mudanza", "Start move")}
          </Button>
        ) : move.status === "COMPLETED" ? (
          <Button name="action" value="correct" disabled={pending}>
            {t("Corregir mediciones", "Correct measurements")}
          </Button>
        ) : (
          <>
            <Button name="action" value="save" variant="outline" disabled={pending}>
              {t("Guardar mediciones", "Save measurements")}
            </Button>
            <Button name="action" value="complete" disabled={pending || quote.status !== "CONFIRMED"}>
              {t("Completar mudanza", "Complete move")}
            </Button>
          </>
        )}
      </div>
    </ConfirmedForm>
  );
}
export function Workflow(props: Props) {
  const { request, quote, move, settings, permissions, communications, history, now, actors } = props;
  const { t } = useLanguage();
  const editable =
    request.status !== "CANCELLED" && (move?.status !== "COMPLETED" || permissions.includes("moves.correct"));
  const fields: Record<string, [string, string]> = {
    rate_cents: ["Tarifa (centavos USD)", "Rate (USD cents)"],
    estimated_quantity: ["Cantidad estimada", "Estimated quantity"],
    started_at: ["Llegada", "Arrival"],
    finished_at: ["Finalización", "Finish"],
    actual_miles: ["Millas reales", "Actual miles"],
    estimated_duration_minutes: ["Duración estimada (min)", "Estimated duration (min)"],
  };
  return (
    <>
      <section className="card stack">
        <h2>{t("Cotización", "Quote")}</h2>
        <p className="notice">
          {t(
            "Precio aproximado, sujeto a las horas o millas reales. Camión e impuestos incluidos. La confirmación corresponde a las tarifas y condiciones, no a un total fijo.",
            "Approximate price, subject to actual hours or miles. Truck and taxes included. Confirmation covers rates and terms, not a fixed total.",
          )}
        </p>
        {quote && (
          <>
            <div className="row">
              <StatusBadge status={quote.status} />
              <span>
                {t("Versión de condiciones", "Terms version")} {quote.terms_version}
              </span>
            </div>
            <p>
              {t("Estimación guardada", "Saved estimate")}: <Money cents={quote.estimated_total_cents} />
            </p>
            {quote.status !== "CONFIRMED" && quote.confirmed_terms && (
              <p className="notice">
                {t(
                  "Hay condiciones anteriores aceptadas. Las condiciones actuales requieren nueva confirmación.",
                  "Previously accepted terms exist. Current terms require new confirmation.",
                )}
              </p>
            )}
          </>
        )}
        {editable && permissions.includes("quotes.edit") && (
          <QuoteEditor key={quote?.version ?? 0} request={request} quote={quote} settings={settings} />
        )}
        {editable && quote && <QuoteApproval request={request.id} quote={quote} permissions={permissions} />}
        {editable &&
          quote &&
          ["ACCEPTED", "CONFIRMED"].includes(quote.status) &&
          permissions.includes("quotes.confirm") && (
            <CommunicationForm
              key={`communication-${quote.version}`}
              request={request.id}
              quote={quote}
              now={now}
            />
          )}
        <details>
          <summary>
            {t("Comunicaciones registradas", "Recorded communications")} ({communications.length})
          </summary>
          {communications.map((c) => (
            <div className="route-detail" key={c.id}>
              <p>
                <DateText value={c.communicated_at} time /> · {c.medium} · {actors[c.actor_id] ?? c.actor_id}{" "}
                · v{c.terms_version}
              </p>
              <p>
                {c.response} ·{" "}
                {c.confirmed_at
                  ? t("Aceptada por cliente", "Customer accepted")
                  : t("Sin aceptación registrada", "No acceptance recorded")}
              </p>
              <Terms value={c.terms} />
            </div>
          ))}
        </details>
      </section>
      <section className="card stack">
        <h2>{t("Mudanza", "Move")}</h2>
        {move ? (
          <>
            <StatusBadge status={move.status} />
            <p>
              {t("Programada", "Scheduled")}: <DateText value={move.scheduled_at} time />
            </p>
            <p>{move.notes}</p>
            {move.final_total_cents !== null && (
              <p>
                {t("Importe final con condiciones aceptadas", "Final amount under accepted terms")}:{" "}
                <Money cents={move.final_total_cents} />
              </p>
            )}
            {move.revised_total_cents !== null && (
              <p className="notice">
                {t("Importe revisado pendiente de aceptación", "Revised amount awaiting acceptance")}:{" "}
                <Money cents={move.revised_total_cents} />
              </p>
            )}
            {move.started_at && (
              <p>
                {t("Llegada", "Arrival")}: <DateText value={move.started_at} time />
                {move.finished_at && (
                  <>
                    {" "}
                    · {t("Finalización", "Finish")}: <DateText value={move.finished_at} time />
                  </>
                )}
              </p>
            )}
            {move.actual_miles !== null && (
              <p>
                {t("Millas reales de ida", "Actual one-way miles")}: {move.actual_miles}
              </p>
            )}
          </>
        ) : (
          <p className="muted">
            {t(
              "Confirma la cotización y acuerda fecha/hora para programar.",
              "Confirm the quote and agree on a date/time to schedule.",
            )}
          </p>
        )}
        {request.status === "CONFIRMED" &&
          quote?.status === "CONFIRMED" &&
          (!move || ["SCHEDULED", "PENDING_REVIEW"].includes(move.status)) &&
          permissions.includes("moves.schedule") && (
            <ScheduleForm key={`schedule-${move?.version ?? 0}`} request={request.id} move={move} now={now} />
          )}
        {move &&
          quote &&
          permissions.includes("moves.operate") &&
          ((move.status === "SCHEDULED" && quote.status === "CONFIRMED") ||
            move.status === "IN_PROGRESS" ||
            (move.status === "COMPLETED" && permissions.includes("moves.correct"))) && (
            <Measurements
              key={`measure-${move.version}`}
              request={request.id}
              quote={quote}
              move={move}
              now={now}
            />
          )}
        {move?.status === "SCHEDULED" && quote?.status !== "CONFIRMED" && (
          <p className="notice">
            {t(
              "La reserva se conserva. Confirma las nuevas condiciones antes de iniciar.",
              "The booking is retained. Confirm revised terms before starting.",
            )}
          </p>
        )}
      </section>
      <section className="card stack">
        <h2>{t("Historial de cantidades y tarifas", "Quantity and rate history")}</h2>
        {history.length ? (
          history.map((h) => (
            <p key={h.id}>
              {t(...(fields[h.field] ?? [h.field, h.field]))}: {String(h.old_value ?? "—")} →{" "}
              {String(h.new_value ?? "—")} · <DateText value={h.created_at} time /> ·{" "}
              {actors[h.actor_id ?? ""] ?? h.actor_id}
            </p>
          ))
        ) : (
          <p className="muted">{t("Sin cambios registrados.", "No changes recorded.")}</p>
        )}
      </section>
    </>
  );
}
