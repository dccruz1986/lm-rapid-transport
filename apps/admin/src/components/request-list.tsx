"use client";
import { requestStatuses } from "@lm/types";
import { Button, EmptyState, useLanguage } from "@lm/ui";
import { displayName } from "@lm/validation";
import { DateText, PageHeading, Pagination, StatusBadge, statusLabels } from "./record-ui";
export type RequestListRow = {
  id: string;
  request_number: string;
  full_name?: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  moving_date: string | null;
  status: string;
  created_at: string;
  origin: { street: string | null; city: string | null; input?: string | null; postal_code?: string | null };
  destination: {
    street: string | null;
    city: string | null;
    input?: string | null;
    postal_code?: string | null;
  };
};
export function RequestTable({ rows }: { rows: RequestListRow[] }) {
  const { t } = useLanguage();
  if (!rows.length) return <EmptyState />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {[
              ["Solicitud", "Request"],
              ["Cliente", "Customer"],
              ["Teléfono", "Phone"],
              ["Origen", "Origin"],
              ["Destino", "Destination"],
              ["Fecha deseada", "Preferred date"],
              ["Estado", "Status"],
              ["Creación", "Created"],
            ].map(([es, en]) => (
              <th key={es}>{t(es ?? "", en ?? "")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <a className="record-link" href={`/requests/${r.id}`}>
                  {r.request_number}
                </a>
              </td>
              <td>{displayName(r)}</td>
              <td>
                <a href={`tel:${r.phone}`}>{r.phone}</a>
              </td>
              <td>
                {r.origin.city ?? r.origin.postal_code ?? t("Por verificar", "Needs verification")}
                <small className="cell-secondary">{r.origin.street ?? r.origin.input}</small>
              </td>
              <td>
                {r.destination.city ?? r.destination.postal_code ?? t("Por verificar", "Needs verification")}
                <small className="cell-secondary">{r.destination.street ?? r.destination.input}</small>
              </td>
              <td>
                <DateText value={r.moving_date} />
              </td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              <td>
                <DateText value={r.created_at} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function RequestList({
  rows,
  total,
  page,
  filters,
}: {
  rows: RequestListRow[];
  total: number;
  page: number;
  filters: { q: string; status: string; from: string; to: string };
}) {
  const { t } = useLanguage();
  return (
    <div className="stack">
      <PageHeading
        es="Solicitudes"
        en="Requests"
        subtitle={[
          "Cada próximo comienzo, organizado en un solo lugar.",
          "Every next beginning, organized in one place.",
        ]}
      />
      <form className="filter-bar">
        <label className="field">
          {t("Buscar", "Search")}
          <input
            name="q"
            defaultValue={filters.q}
            placeholder={t("Número, nombre o teléfono", "Number, name or phone")}
          />
        </label>
        <label className="field">
          {t("Estado", "Status")}
          <select name="status" defaultValue={filters.status}>
            <option value="">{t("Todos", "All")}</option>
            {requestStatuses.map((s) => (
              <option key={s} value={s}>
                {t(...(statusLabels[s] ?? [s, s]))}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {t("Desde", "From")}
          <input name="from" type="date" defaultValue={filters.from} />
        </label>
        <label className="field">
          {t("Hasta", "To")}
          <input name="to" type="date" defaultValue={filters.to} />
        </label>
        <Button>{t("Filtrar", "Filter")}</Button>
        <a href="/requests">{t("Limpiar", "Clear")}</a>
      </form>
      <RequestTable rows={rows} />
      <Pagination page={page} total={total} path="/requests" params={filters} />
    </div>
  );
}
