"use client";
import type { Database } from "@lm/types/database";
import { Button, useLanguage } from "@lm/ui";
import { useActionState, useState } from "react";
import { changeRequest, editCustomer, editRequest, saveNote } from "@/app/(staff)/actions";
import { DateText, initialResult, ResultNotice } from "./record-ui";

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type RequestRecord = Row<"moving_requests"> & {
  origin: Row<"addresses">;
  destination: Row<"addresses">;
};
function ContactFields({
  value,
}: {
  value: { first_name: string; last_name: string; phone: string; email: string | null };
}) {
  const { t } = useLanguage();
  return (
    <>
      {[
        ["first_name", "Nombre", "First name"],
        ["last_name", "Apellido", "Last name"],
        ["phone", "Teléfono EE. UU.", "US phone"],
      ].map(([name, es, en]) => (
        <label className="field" key={name}>
          {t(es ?? "", en ?? "")}
          <input
            name={name}
            defaultValue={value[name as "first_name" | "last_name" | "phone"]}
            required
            maxLength={name === "phone" ? 40 : 80}
          />
        </label>
      ))}
      <label className="field">
        {t("Correo (opcional)", "Email (optional)")}
        <input name="email" type="email" defaultValue={value.email ?? ""} maxLength={254} />
      </label>
    </>
  );
}
export function CustomerEditor({ customer }: { customer: Row<"customers"> }) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(editCustomer, initialResult);
  return (
    <form action={action} className="card stack">
      <h2>{t("Información del cliente", "Customer information")}</h2>
      <input type="hidden" name="id" value={customer.id} />
      <input type="hidden" name="version" value={customer.version} />
      <div className="form-grid">
        <ContactFields value={customer} />
      </div>
      <ResultNotice result={state} />
      <Button disabled={pending}>{t("Guardar contacto", "Save contact")}</Button>
      <p className="small muted">
        {t(
          "Los datos enviados en solicitudes anteriores se conservan.",
          "Contact details submitted in previous requests are preserved.",
        )}
      </p>
    </form>
  );
}
export function RequestEditor({ request }: { request: RequestRecord }) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(editRequest, initialResult);
  const [property, setProperty] = useState(request.property_type);
  return (
    <details className="card">
      <summary>{t("Editar información de la solicitud", "Edit request information")}</summary>
      <form action={action} className="stack" style={{ marginTop: 24 }}>
        <input type="hidden" name="id" value={request.id} />
        <input type="hidden" name="version" value={request.version} />
        <div className="form-grid">
          <ContactFields value={request} />
        </div>
        {(["origin", "destination"] as const).map((side) => (
          <fieldset key={side} className="address-group">
            <legend>{side === "origin" ? t("Origen", "Origin") : t("Destino", "Destination")} · FL</legend>
            <div className="form-grid">
              {[
                ["street", "Dirección", "Street"],
                ["unit", "Unidad (opcional)", "Unit (optional)"],
                ["city", "Ciudad", "City"],
                ["postal_code", "Código postal", "ZIP code"],
              ].map(([name, es, en]) => (
                <label key={name} className="field">
                  {t(es ?? "", en ?? "")}
                  <input
                    name={`${side}.${name}`}
                    defaultValue={request[side][name as "street" | "unit" | "city" | "postal_code"]}
                    required={name !== "unit"}
                  />
                </label>
              ))}
              <label className="field">
                {t("Piso", "Floor")}
                <input
                  name={`${side}_floor`}
                  type="number"
                  defaultValue={request[`${side}_floor`]}
                  min={-5}
                  max={150}
                  required
                />
              </label>
              <label className="check-field">
                <input
                  name={`${side}_elevator`}
                  type="checkbox"
                  defaultChecked={request[`${side}_elevator`]}
                />
                {t("Elevador disponible", "Elevator available")}
              </label>
            </div>
          </fieldset>
        ))}
        <div className="form-grid">
          <label className="field">
            {t("Tipo de propiedad", "Property type")}
            <select name="property_type" value={property} onChange={(e) => setProperty(e.target.value)}>
              <option value="HOUSE">{t("Casa", "House")}</option>
              <option value="APARTMENT">{t("Apartamento", "Apartment")}</option>
              <option value="OFFICE">{t("Oficina", "Office")}</option>
              <option value="COMMERCIAL">{t("Comercio", "Business")}</option>
            </select>
          </label>
          {["HOUSE", "APARTMENT"].includes(property) && (
            <label className="field">
              {t("Dormitorios", "Bedrooms")}
              <input
                name="bedrooms"
                type="number"
                min={0}
                max={20}
                defaultValue={request.bedrooms ?? 0}
                required
              />
            </label>
          )}
          <label className="field">
            {t("Superficie (opcional)", "Size (optional)")}
            <input
              name="property_size"
              type="number"
              min={1}
              max={1000000}
              defaultValue={request.property_size ?? ""}
            />
          </label>
          <label className="field">
            {t("Unidad", "Unit")}
            <select name="size_unit" defaultValue={request.size_unit ?? "SQFT"}>
              <option value="SQFT">ft²</option>
              <option value="SQM">m²</option>
            </select>
          </label>
          <label className="field">
            {t("Trabajadores", "Movers")}
            <select name="workers" defaultValue={request.workers ?? ""}>
              <option value="">{t("Por definir", "To be determined")}</option>
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t("Fecha deseada (opcional)", "Preferred date (optional)")}
            <input name="moving_date" type="date" defaultValue={request.moving_date ?? ""} />
          </label>
          <label className="field full">
            {t("Comentarios", "Comments")}
            <textarea name="comments" defaultValue={request.comments} maxLength={4000} rows={3} />
          </label>
        </div>
        <ResultNotice result={state} />
        <Button disabled={pending}>{t("Guardar información", "Save information")}</Button>
      </form>
    </details>
  );
}
export function RequestActions({
  request,
  permissions,
}: {
  request: Row<"moving_requests">;
  permissions: string[];
}) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(changeRequest, initialResult);
  return (
    <form
      action={action}
      className="card stack"
      onSubmit={(e) => {
        const button = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (
          button?.value !== "contact" &&
          !window.confirm(t("¿Confirmar este cambio de estado?", "Confirm this status change?"))
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={request.id} />
      <input type="hidden" name="version" value={request.version} />
      <h2>{t("Seguimiento", "Follow-up")}</h2>
      {request.status !== "COMPLETED" &&
        request.status !== "CANCELLED" &&
        permissions.includes("records.cancel") && (
          <label className="field">
            {t("Motivo de cancelación (opcional)", "Cancellation reason (optional)")}
            <input name="reason" maxLength={1000} />
          </label>
        )}
      <div className="row">
        {["NEW", "PENDING_REVIEW"].includes(request.status) && permissions.includes("requests.edit") && (
          <Button name="action" value="contact" disabled={pending}>
            {t("Marcar contactada", "Mark contacted")}
          </Button>
        )}
        {request.status !== "COMPLETED" &&
          request.status !== "CANCELLED" &&
          permissions.includes("records.cancel") && (
            <Button name="action" value="cancel" variant="outline" disabled={pending}>
              {t("Cancelar solicitud", "Cancel request")}
            </Button>
          )}
        {request.status === "CANCELLED" && permissions.includes("records.reactivate") && (
          <Button name="action" value="reactivate" disabled={pending}>
            {t("Reactivar para revisión", "Reactivate for review")}
          </Button>
        )}
      </div>
      <ResultNotice result={state} />
    </form>
  );
}
export function NoteEditor({ requestId, note }: { requestId: string; note?: Row<"notes"> }) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(saveNote, initialResult);
  return (
    <form
      action={action}
      className="note-editor"
      onSubmit={(e) => {
        if (
          ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value === "delete" &&
          !window.confirm(t("¿Eliminar esta nota?", "Delete this note?"))
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="request" value={requestId} />
      <input type="hidden" name="id" value={note?.id ?? ""} />
      <label className="field">
        {note ? t("Nota interna", "Internal note") : t("Nueva nota interna", "New internal note")}
        <textarea name="body" defaultValue={note?.body ?? ""} maxLength={4000} rows={3} />
      </label>
      {note && (
        <p className="small muted">
          <DateText value={note.created_at} time />
        </p>
      )}
      <div className="row">
        <Button name="action" value="save" disabled={pending} size="sm">
          {t("Guardar nota", "Save note")}
        </Button>
        {note && (
          <Button name="action" value="delete" variant="ghost" disabled={pending} size="sm">
            {t("Eliminar", "Delete")}
          </Button>
        )}
      </div>
      <ResultNotice result={state} />
    </form>
  );
}
