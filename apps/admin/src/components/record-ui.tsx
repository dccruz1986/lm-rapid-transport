"use client";
import { Button, useLanguage } from "@lm/ui";
export const statusLabels: Record<string, [string, string]> = {
  NEW: ["Nueva", "New"],
  CONTACTED: ["Contactada", "Contacted"],
  QUOTED: ["Cotizada", "Quoted"],
  CONFIRMED: ["Confirmada", "Confirmed"],
  IN_PROGRESS: ["En progreso", "In progress"],
  COMPLETED: ["Completada", "Completed"],
  CANCELLED: ["Cancelada", "Cancelled"],
  PENDING_REVIEW: ["Pendiente de revisión", "Pending review"],
  SCHEDULED: ["Programada", "Scheduled"],
  ESTIMATED: ["Borrador", "Draft"],
  ACCEPTED: ["Aprobada", "Approved"],
};
export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = statusLabels[status];
  return (
    <span className="badge" data-status={status}>
      {label ? t(...label) : status}
    </span>
  );
}
export function DateText({ value, time = false }: { value: string | null; time?: boolean }) {
  const { locale, t } = useLanguage();
  if (!value) return <>{t("Sin fecha definida", "Date not set")}</>;
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return (
    <>
      {new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
        dateStyle: "medium",
        ...(time ? { timeStyle: "short" as const } : {}),
        timeZone: "America/New_York",
      }).format(date)}
    </>
  );
}
export function PageHeading({ es, en, subtitle }: { es: string; en: string; subtitle?: [string, string] }) {
  const { t } = useLanguage();
  return (
    <div className="page-heading">
      <span className="eyebrow">LM RAPID TRANSPORT</span>
      <h1>{t(es, en)}</h1>
      {subtitle && <p className="muted">{t(...subtitle)}</p>}
    </div>
  );
}
export type FormResult = { error: string; success: boolean };
export const initialResult: FormResult = { error: "", success: false };
export function ResultNotice({ result }: { result: FormResult }) {
  const { t } = useLanguage();
  const messages: Record<string, [string, string]> = {
    CONFLICT: [
      "Otra persona cambió este registro. Recarga la página y revisa sus cambios antes de guardar.",
      "Someone changed this record. Reload the page and review their changes before saving.",
    ],
    PHONE_CONFLICT: [
      "Ese teléfono pertenece a otro cliente. Revisa el número; no se fusionaron las fichas.",
      "That phone belongs to another customer. Check it; no records were merged.",
    ],
    REVIEW_QUOTE_FIRST: [
      "Reabre la cotización para revisar la modalidad antes de cambiar las direcciones acordadas.",
      "Reopen the quote to review its pricing mode before changing the agreed addresses.",
    ],
    FORBIDDEN: ["No tienes permiso para esta operación.", "You don't have permission for this operation."],
    INVALID_TRANSITION: [
      "El estado actual no permite esta operación.",
      "The current status does not allow this operation.",
    ],
    INVALID_INPUT: [
      "Revisa los campos y sus límites antes de guardar.",
      "Check the fields and their limits before saving.",
    ],
  };
  if (result.error)
    return (
      <p className="notice error" role="alert">
        {t(
          ...(messages[result.error] ?? [
            "No se pudo guardar. Inténtalo de nuevo.",
            "Unable to save. Please try again.",
          ]),
        )}
      </p>
    );
  if (result.success)
    return (
      <p className="notice" role="status">
        {t("Cambios guardados.", "Changes saved.")}
      </p>
    );
  return null;
}
export function Pagination({
  page,
  total,
  path,
  params,
}: {
  page: number;
  total: number;
  path: string;
  params: Record<string, string>;
}) {
  const { t } = useLanguage();
  const pages = Math.max(1, Math.ceil(total / 20));
  const link = (p: number) => `${path}?${new URLSearchParams({ ...params, page: String(p) })}`;
  return (
    <div className="pagination">
      <span className="small muted">
        {total} {t("registros", "records")} · {t("Página", "Page")} {page} / {pages}
      </span>
      <div className="row">
        {page > 1 && (
          <Button asChild variant="outline" size="sm">
            <a href={link(page - 1)}>{t("Anterior", "Previous")}</a>
          </Button>
        )}
        {page < pages && (
          <Button asChild variant="outline" size="sm">
            <a href={link(page + 1)}>{t("Siguiente", "Next")}</a>
          </Button>
        )}
      </div>
    </div>
  );
}
