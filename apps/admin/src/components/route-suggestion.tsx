"use client";
import { Button, useLanguage } from "@lm/ui";
import { useRouteAddresses } from "./route-addresses";

export function RouteSuggestion() {
  const { t } = useLanguage();
  const { estimate, statuses } = useRouteAddresses();
  return (
    <div className="notice stack" aria-live="polite">
      <p>
        {estimate.mode === "LOCAL"
          ? t(
              "Sugerencia: local por hora; ambos puntos están en Miami-Dade.",
              "Suggestion: local hourly pricing; both points are in Miami-Dade.",
            )
          : estimate.mode === "PER_MILE"
            ? t(
                "Sugerencia: por millas; al menos un punto está fuera de Miami-Dade, dentro de Florida.",
                "Suggestion: per mile; at least one point is outside Miami-Dade, within Florida.",
              )
            : estimate.possiblePerMile
              ? t(
                  "Posible mudanza por millas. Falta resolver el otro punto y comprobar cobertura.",
                  "Possibly per mile. Resolve the other point and check coverage.",
                )
              : t(
                  "Modalidad pendiente: resuelve ambos puntos y revisa sus condados.",
                  "Pricing mode pending: resolve both points and review their counties.",
                )}
      </p>
      {estimate.status === "loading" && (
        <p>{t("Calculando millas por carretera…", "Calculating road miles…")}</p>
      )}
      {estimate.miles !== undefined && (
        <p>
          <strong>
            {estimate.miles.toFixed(1)} {t("millas aproximadas de ida", "approximate one-way miles")}
          </strong>{" "}
          ·{" "}
          <span
            translate="no"
            style={{ fontWeight: 400, fontSize: 14, color: "#1f1f1f", whiteSpace: "nowrap" }}
          >
            Google Maps
          </span>
        </p>
      )}
      {statuses.includes("postal") && (
        <p>
          {t(
            "Estimación provisional entre puntos ZIP; no confirma direcciones exactas ni límites del condado.",
            "Provisional estimate using ZIP points; it does not confirm exact addresses or county boundaries.",
          )}
        </p>
      )}
      {estimate.status === "error" && (
        <>
          <p>
            {estimate.error === "authorization"
              ? t(
                  "Google no autoriza esta consulta de rutas.",
                  "Google has not authorized this route request.",
                )
              : estimate.error === "sdk"
                ? t("La biblioteca de rutas no está disponible.", "The routes library is unavailable.")
                : estimate.error === "timeout"
                  ? t("La consulta superó el tiempo de espera.", "The request timed out.")
                  : estimate.error === "no-route"
                    ? t("Google no devolvió una distancia válida.", "Google did not return a valid distance.")
                    : t(
                        "El servicio de rutas no respondió correctamente.",
                        "The routes service did not respond successfully.",
                      )}
          </p>
          <p>
            {t(
              "No hay distancia disponible. Revisa Routes API y los permisos de la clave, reintenta o introduce las millas manualmente.",
              "Distance unavailable. Check Routes API and key permissions, retry or enter miles manually.",
            )}
          </p>
          <Button type="button" onClick={estimate.retry}>
            {t("Reintentar distancia", "Retry distance")}
          </Button>
        </>
      )}
      <p className="small">
        {t(
          "Sugerencia sin verificación territorial. Revisa los condados antes de aprobar; las millas reales se registran al finalizar.",
          "Territory is not verified by this suggestion. Review counties before approval; actual miles are recorded at completion.",
        )}
      </p>
    </div>
  );
}
