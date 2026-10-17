"use client";
import { useLanguage } from "./language";
export function LoadingState() {
  const { t } = useLanguage();
  return (
    <div className="state" role="status">
      <span className="loading-dot" />
      {t("Cargando…", "Loading…")}
    </div>
  );
}
export function EmptyState({ message }: { message?: string }) {
  const { t } = useLanguage();
  return <div className="state">{message ?? t("Todavía no hay registros.", "No records yet.")}</div>;
}
