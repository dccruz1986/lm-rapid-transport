"use client";
import type { FormOutcome } from "@lm/types";
import { Button, useLanguage } from "@lm/ui";
import { LocationField, type SelectedLocation } from "@lm/ui/location-field";
import { FieldError, ValidatedForm } from "@lm/ui/validated-form";
import {
  adminRequestSchema,
  moveSizes,
  newRequestAliases,
  newRequestFields,
  validationFailure,
} from "@lm/validation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createRequest } from "@/app/(staff)/requests/new/actions";
import { PageHeading } from "./record-ui";

const sizes: Record<string, [string, string]> = {
  STUDIO: ["Estudio", "Studio"],
  BEDROOMS_1: ["1 dormitorio", "1 bedroom"],
  BEDROOMS_2: ["2 dormitorios", "2 bedrooms"],
  BEDROOMS_3: ["3 dormitorios", "3 bedrooms"],
  BEDROOMS_4: ["4 dormitorios", "4 bedrooms"],
  BEDROOMS_5_PLUS: ["5+ dormitorios", "5+ bedrooms"],
  OFFICE: ["Oficina", "Office"],
  COMMERCIAL: ["Comercial", "Commercial"],
};
export function NewRequestForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const lock = useRef(false);
  const operation = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<FormOutcome>({ error: "", success: false });
  const [unknownDate, setUnknownDate] = useState(false);
  const [locations, setLocations] = useState({ origin: "", destination: "" });
  const [selected, setSelected] = useState<{
    origin: SelectedLocation | null;
    destination: SelectedLocation | null;
  }>({ origin: null, destination: null });
  const [invalidPlaces, setInvalidPlaces] = useState({ origin: false, destination: false });
  return (
    <div className="stack">
      <PageHeading
        es="Nueva solicitud"
        en="New request"
        subtitle={[
          "Registra una mudanza recibida por teléfono o en persona.",
          "Record a move received by phone or in person.",
        ]}
      />
      <ValidatedForm
        result={feedback}
        className="panel stack"
        onSubmit={async (event) => {
          event.preventDefault();
          if (lock.current) return;
          const form = new FormData(event.currentTarget);
          operation.current ??= crypto.randomUUID();
          const input = {
            key: operation.current,
            full_name: form.get("full_name"),
            phone: form.get("phone"),
            email: form.get("email"),
            ...locations,
            origin_location: selected.origin,
            destination_location: selected.destination,
            move_size: form.get("move_size"),
            moving_date: unknownDate ? null : form.get("moving_date"),
            comments: form.get("comments"),
          };
          const parsed = adminRequestSchema.safeParse(input);
          if (!parsed.success || invalidPlaces.origin || invalidPlaces.destination) {
            const failed = !parsed.success
              ? validationFailure(parsed.error, newRequestFields, newRequestAliases)
              : { error: "", success: false, fieldErrors: {} };
            failed.fieldErrors ??= {};
            for (const side of ["origin", "destination"] as const)
              if (invalidPlaces[side]) failed.fieldErrors[side] = { code: "LOCATION" };
            setFeedback(failed);
            setError(failed.error);
            return;
          }
          lock.current = true;
          setBusy(true);
          setError("");
          try {
            const result = await createRequest(parsed.data);
            if (result.error || ("fieldErrors" in result && Object.keys(result.fieldErrors ?? {}).length)) {
              setError(result.error);
              setFeedback({
                error: result.error,
                success: false,
                fieldErrors: "fieldErrors" in result ? result.fieldErrors : undefined,
              });
            } else if ("id" in result && result.id) {
              router.push(`/requests/${result.id}`);
              router.refresh();
              return;
            }
          } catch {
            setError("UNAVAILABLE");
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        <fieldset className="stack" disabled={busy}>
          <legend>{t("Contacto", "Contact")}</legend>
          <label className="field">
            {t("Nombre completo", "Full name")}
            <input name="full_name" autoComplete="name" required maxLength={160} />
            <FieldError name="full_name" />
          </label>
          <label className="field">
            {t("Teléfono de Estados Unidos", "US phone number")}
            <input name="phone" type="tel" autoComplete="tel" required maxLength={40} />
            <FieldError name="phone" />
          </label>
          <label className="field">
            {t("Correo electrónico (opcional)", "Email (optional)")}
            <input name="email" type="email" autoComplete="email" maxLength={254} />
            <FieldError name="email" />
          </label>
        </fieldset>
        <fieldset className="stack" disabled={busy}>
          <legend>{t("Ubicaciones", "Locations")}</legend>
          {(["origin", "destination"] as const).map((side) => (
            <LocationField
              name={side}
              key={side}
              label={side === "origin" ? t("Origen", "Pickup") : t("Destino", "Destination")}
              value={{ input: locations[side], resolution_token: null }}
              invalid={invalidPlaces[side]}
              disabled={busy}
              onChange={(value) => {
                setSelected((previous) => ({ ...previous, [side]: null }));
                setLocations((previous) => ({ ...previous, [side]: value.input }));
                setInvalidPlaces((previous) => ({ ...previous, [side]: false }));
              }}
              onPlaceInvalid={() => setInvalidPlaces((previous) => ({ ...previous, [side]: true }))}
              onPlaceSelect={(_position, address) => {
                setSelected((previous) => ({ ...previous, [side]: address }));
                setLocations((previous) => ({ ...previous, [side]: address.label }));
                setInvalidPlaces((previous) => ({ ...previous, [side]: false }));
              }}
            />
          ))}
          <p className="muted">
            {t(
              "Puedes introducir un ZIP o una dirección. Las ubicaciones y la modalidad se revisarán antes de confirmar la mudanza.",
              "Enter a ZIP or address. Locations and pricing mode will be reviewed before confirming the move.",
            )}
          </p>
        </fieldset>
        <fieldset className="stack" disabled={busy}>
          <legend>{t("Detalles de la mudanza", "Move details")}</legend>
          <label className="field">
            {t("Tamaño", "Move size")}
            <select name="move_size" required defaultValue="">
              <option value="">{t("Selecciona el tamaño", "Select move size")}</option>
              {moveSizes.map((size) => (
                <option key={size} value={size}>
                  {t(...(sizes[size] ?? [size, size]))}
                </option>
              ))}
            </select>
            <FieldError name="move_size" />
          </label>
          <label>
            <input type="checkbox" checked={unknownDate} onChange={(e) => setUnknownDate(e.target.checked)} />{" "}
            {t("Fecha por definir", "Date to be determined")}
          </label>
          <label className="field">
            {t("Fecha deseada", "Preferred date")}
            <input name="moving_date" type="date" required={!unknownDate} disabled={unknownDate} />
            <FieldError name="moving_date" />
            <small>
              {t("Una fecha futura, de lunes a sábado.", "A future date, Monday through Saturday.")}
            </small>
          </label>
          <label className="field">
            {t("Comentarios (opcional)", "Comments (optional)")}
            <textarea name="comments" maxLength={4000} rows={3} />
            <FieldError name="comments" />
          </label>
        </fieldset>
        {error && (
          <p role="alert">
            {error === "CONFLICT"
              ? t(
                  "Esta operación ya fue guardada con otros datos. Revisa la lista antes de iniciar otra solicitud.",
                  "This operation was already saved with different details. Check the list before starting another request.",
                )
              : error === "UNAVAILABLE"
                ? t(
                    "No se pudo confirmar el guardado. Reintenta con los mismos datos.",
                    "Could not confirm the save. Retry with the same details.",
                  )
                : t(
                    "Revisa los campos. La fecha debe ser futura y no puede ser domingo.",
                    "Check the fields. The date must be in the future and cannot be Sunday.",
                  )}
          </p>
        )}
        <div className="actions">
          <Button type="submit" disabled={busy}>
            {busy ? t("Guardando…", "Saving…") : t("Crear solicitud", "Create request")}
          </Button>
          {!busy && (
            <Button asChild variant="outline">
              <Link href="/requests">{t("Cancelar", "Cancel")}</Link>
            </Button>
          )}
        </div>
      </ValidatedForm>
    </div>
  );
}
