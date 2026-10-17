"use client";
import type { Database } from "@lm/types/database";
import { Button, EmptyState, useLanguage } from "@lm/ui";
import { CustomerEditor } from "./record-forms";
import { DateText, PageHeading, Pagination, StatusBadge } from "./record-ui";
import { type RequestListRow, RequestTable } from "./request-list";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Move = Database["public"]["Tables"]["moves"]["Row"];
export function CustomerList({
  rows,
  total,
  page,
  q,
}: {
  rows: Customer[];
  total: number;
  page: number;
  q: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="stack">
      <PageHeading es="Clientes" en="Customers" />
      <form className="filter-bar">
        <label className="field">
          {t("Buscar nombre, teléfono o correo", "Search name, phone or email")}
          <input name="q" defaultValue={q} />
        </label>
        <Button>{t("Buscar", "Search")}</Button>
        <a href="/customers">{t("Limpiar", "Clear")}</a>
      </form>
      {rows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Cliente", "Customer")}</th>
                <th>{t("Teléfono", "Phone")}</th>
                <th>{t("Correo", "Email")}</th>
                <th>{t("Creación", "Created")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <a className="record-link" href={`/customers/${c.id}`}>
                      {c.first_name} {c.last_name}
                    </a>
                  </td>
                  <td>{c.phone}</td>
                  <td>{c.email ?? "—"}</td>
                  <td>
                    <DateText value={c.created_at} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState />
      )}
      <Pagination page={page} total={total} path="/customers" params={{ q }} />
    </div>
  );
}
export function CustomerDetail({
  customer,
  requests,
  moves,
  canEdit,
}: {
  customer: Customer;
  requests: RequestListRow[];
  moves: Move[];
  canEdit: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="stack">
      <a href="/customers">← {t("Clientes", "Customers")}</a>
      <PageHeading
        es={`${customer.first_name} ${customer.last_name}`}
        en={`${customer.first_name} ${customer.last_name}`}
      />
      {canEdit ? (
        <CustomerEditor customer={customer} />
      ) : (
        <p>
          {customer.phone} · {customer.email}
        </p>
      )}
      <h2>{t("Solicitudes anteriores", "Previous requests")}</h2>
      <RequestTable rows={requests} />
      <h2>{t("Mudanzas anteriores", "Previous moves")}</h2>
      {moves.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Programación", "Schedule")}</th>
                <th>{t("Estado", "Status")}</th>
                <th>{t("Detalle", "Details")}</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id}>
                  <td>
                    <DateText value={m.scheduled_at} time />
                  </td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td>
                    <a className="record-link" href={`/moves/${m.id}`}>
                      {t("Abrir mudanza", "Open move")} →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
