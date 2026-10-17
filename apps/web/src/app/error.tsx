"use client";
import { Button, useLanguage } from "@lm/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLanguage();
  return (
    <main className="container section">
      <h1>{t("No pudimos cargar esta página", "We couldn't load this page")}</h1>
      <p>
        {t(
          "Inténtalo de nuevo. Si continúa, contacta al equipo.",
          "Please retry. If this continues, contact the team.",
        )}
      </p>
      <Button onClick={reset}>{t("Reintentar", "Retry")}</Button>
    </main>
  );
}
