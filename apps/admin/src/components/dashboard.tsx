"use client";
import { useLanguage } from "@lm/ui";
import { CalendarDays, CheckCircle2, Clock3, Inbox, Truck } from "lucide-react";
import { PageHeading } from "./record-ui";
import { type RequestListRow, RequestTable } from "./request-list";
export function Dashboard({
  metrics,
  requests,
}: {
  metrics: Record<string, number>;
  requests: RequestListRow[];
}) {
  const { t } = useLanguage();
  const cards = [
    { key: "new_requests", es: "Nuevas solicitudes", en: "New requests", Icon: Inbox },
    { key: "quotes_pending", es: "Cotizaciones pendientes", en: "Quotes pending", Icon: Clock3 },
    { key: "confirmed_moves", es: "Mudanzas confirmadas", en: "Confirmed moves", Icon: Truck },
    { key: "moves_this_week", es: "Mudanzas esta semana", en: "Moves this week", Icon: CalendarDays },
    { key: "completed_moves", es: "Mudanzas completadas", en: "Completed moves", Icon: CheckCircle2 },
  ];
  return (
    <div className="stack">
      <PageHeading
        es="Resumen de operaciones"
        en="Operations overview"
        subtitle={[
          "Solicitudes por atender y mudanzas en marcha.",
          "Requests to review and moves in progress.",
        ]}
      />
      <div className="metrics">
        {cards.map(({ key, es, en, Icon }) => (
          <div className="card metric" key={key}>
            <div className="row">
              <Icon size={20} />
              <span>{t(es, en)}</span>
            </div>
            <strong>{metrics[key]}</strong>
          </div>
        ))}
      </div>
      <p className="small muted">
        {t(
          "Pendientes: cotizaciones comunicadas que esperan respuesta. Confirmadas: incluye solicitudes aún sin programar. Semana: lunes a domingo, hora de Miami.",
          "Pending: communicated quotes awaiting a response. Confirmed: includes requests not yet scheduled. Week: Monday–Sunday, Miami time.",
        )}
      </p>
      <div className="section-title">
        <h2>{t("Solicitudes recientes", "Recent requests")}</h2>
        <a href="/requests">{t("Ver todas", "View all")}</a>
      </div>
      <RequestTable rows={requests} />
    </div>
  );
}
