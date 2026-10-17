"use client";
import { moveStatuses } from "@lm/types";
import { Button, EmptyState, useLanguage } from "@lm/ui";
import { DateText, PageHeading, Pagination, StatusBadge, statusLabels } from "./record-ui";
export type MoveListRow = {
  id: string;
  status: string;
  scheduled_at: string;
  request: { request_number: string; first_name: string; last_name: string; phone: string };
  origin: { city: string };
  destination: { city: string };
};
export function MoveList({
  rows,
  total,
  page,
  status,
}: {
  rows: MoveListRow[];
  total: number;
  page: number;
  status: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="stack">
      <PageHeading
        es="Mudanzas"
        en="Moves"
        subtitle={[
          "Programación acordada, de lunes a sábado, hora de Miami.",
          "Agreed schedule, Monday–Saturday, Miami time.",
        ]}
      />
      <form className="filter-bar">
        <label className="field">
          {t("Estado", "Status")}
          <select name="status" defaultValue={status}>
            <option value="">{t("Todos", "All")}</option>
            {moveStatuses.map((s) => (
              <option key={s} value={s}>
                {t(...(statusLabels[s] ?? [s, s]))}
              </option>
            ))}
          </select>
        </label>
        <Button>{t("Filtrar", "Filter")}</Button>
      </form>
      {rows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  ["Solicitud", "Request"],
                  ["Cliente", "Customer"],
                  ["Recorrido", "Route"],
                  ["Programación", "Schedule"],
                  ["Estado", "Status"],
                ].map(([es, en]) => (
                  <th key={es}>{t(es ?? "", en ?? "")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    <a className="record-link" href={`/moves/${m.id}`}>
                      {m.request.request_number}
                    </a>
                  </td>
                  <td>
                    {m.request.first_name} {m.request.last_name}
                    <small className="cell-secondary">{m.request.phone}</small>
                  </td>
                  <td>
                    {m.origin.city} → {m.destination.city}
                  </td>
                  <td>
                    <DateText value={m.scheduled_at} time />
                  </td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState />
      )}
      <Pagination page={page} total={total} path="/moves" params={{ status }} />
    </div>
  );
}
