"use client";
import type { Database } from "@lm/types/database";
import { useLanguage } from "@lm/ui";
import Image from "next/image";
import { NoteEditor, RequestActions, RequestEditor, type RequestRecord } from "./record-forms";
import { DateText, StatusBadge } from "./record-ui";

type Note = Database["public"]["Tables"]["notes"]["Row"];
export function RequestDetail({
  request,
  notes,
  photos,
  permissions,
  moveId,
  children,
}: {
  request: RequestRecord;
  notes: Note[];
  photos: { id: string; name: string; url: string }[];
  permissions: string[];
  moveId: string | null;
  children?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const properties: Record<string, [string, string]> = {
    HOUSE: ["Casa", "House"],
    APARTMENT: ["Apartamento", "Apartment"],
    OFFICE: ["Oficina", "Office"],
    COMMERCIAL: ["Comercio", "Business"],
  };
  return (
    <div className="stack">
      <div className="page-heading">
        <a href="/requests" className="small">
          ← {t("Solicitudes", "Requests")}
        </a>
        <div className="section-title">
          <h1>{request.request_number}</h1>
          <StatusBadge status={request.status} />
        </div>
        <p className="muted">
          {t("Recibida", "Received")} <DateText value={request.created_at} time />
        </p>
      </div>
      <div className="detail-grid">
        <section className="card">
          <h2>
            {request.first_name} {request.last_name}
          </h2>
          <p>
            <a href={`tel:${request.phone}`}>{request.phone}</a>
            {request.email && (
              <>
                <br />
                <a href={`mailto:${request.email}`}>{request.email}</a>
              </>
            )}
          </p>
          <a className="record-link" href={`/customers/${request.customer_id}`}>
            {t("Ver ficha del cliente", "View customer profile")} →
          </a>
          <dl className="review-grid">
            <div>
              <dt>{t("Fecha deseada", "Preferred date")}</dt>
              <dd>
                <DateText value={request.moving_date} />
              </dd>
            </div>
            <div>
              <dt>{t("Equipo solicitado", "Requested crew")}</dt>
              <dd>{request.workers ?? t("Necesita asesoría", "Needs guidance")}</dd>
            </div>
            <div>
              <dt>{t("Propiedad", "Property")}</dt>
              <dd>
                {t(...(properties[request.property_type] ?? [request.property_type, request.property_type]))}
                {request.bedrooms !== null && ` · ${request.bedrooms} ${t("dormitorios", "bedrooms")}`}
              </dd>
            </div>
            <div>
              <dt>{t("Superficie", "Size")}</dt>
              <dd>
                {request.property_size
                  ? `${request.property_size} ${request.size_unit === "SQFT" ? "ft²" : "m²"}`
                  : t("No indicada", "Not provided")}
              </dd>
            </div>
          </dl>
        </section>
        <section className="card">
          <h2>{t("Recorrido", "Route")}</h2>
          {(["origin", "destination"] as const).map((side) => (
            <div className="route-detail" key={side}>
              <h3>{side === "origin" ? t("Origen", "Origin") : t("Destino", "Destination")}</h3>
              <p>
                {request[side].street} {request[side].unit}
                <br />
                {request[side].city}, FL {request[side].postal_code}
              </p>
              <p className="small muted">
                {t("Piso", "Floor")} {request[`${side}_floor`]} ·{" "}
                {request[`${side}_elevator`]
                  ? t("Con elevador", "Elevator available")
                  : t("Sin elevador", "No elevator")}
              </p>
            </div>
          ))}
        </section>
      </div>
      {request.comments && (
        <section className="card">
          <h2>{t("Comentarios del cliente", "Customer comments")}</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{request.comments}</p>
        </section>
      )}
      <section className="card">
        <h2>{t("Fotografías", "Photos")}</h2>
        {photos.length ? (
          <>
            <div className="attachment-grid">
              {photos.map((photo) => (
                <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                  <Image src={photo.url} alt={photo.name} width={280} height={200} unoptimized />
                  <span className="small">{photo.name}</span>
                </a>
              ))}
            </div>
            <p className="small muted">
              {t(
                "Los enlaces vencen en cinco minutos. Recarga para renovarlos.",
                "Links expire in five minutes. Reload to refresh them.",
              )}
            </p>
          </>
        ) : (
          <p className="muted">{t("No se adjuntaron fotos.", "No photos attached.")}</p>
        )}
      </section>
      {children}
      {moveId && (
        <a className="card record-link" href={`/moves/${moveId}`}>
          {t("Ver mudanza asociada", "View associated move")} →
        </a>
      )}
      {permissions.includes("requests.edit") && <RequestEditor request={request} />}
      <RequestActions request={request} permissions={permissions} />
      {request.cancelled_at && (
        <p className="small muted">
          {t("Última cancelación", "Last cancellation")}: <DateText value={request.cancelled_at} time />{" "}
          {request.cancellation_reason}
        </p>
      )}
      <section className="card stack">
        <h2>{t("Notas internas", "Internal notes")}</h2>
        {permissions.includes("notes.manage") ? (
          <>
            {notes.map((note) => (
              <NoteEditor key={note.id} note={note} requestId={request.id} />
            ))}
            <NoteEditor requestId={request.id} />
          </>
        ) : (
          notes.map((note) => <p key={note.id}>{note.body}</p>)
        )}
      </section>
    </div>
  );
}
