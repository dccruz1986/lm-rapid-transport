"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, useLanguage } from "@lm/ui";
import { type RequestInput, requestSchema, validFileMetadata } from "@lm/validation";
import { ArrowRight, Check, CheckCircle2, FileImage } from "lucide-react";
import { useRef, useState } from "react";
import { type FieldPath, useForm } from "react-hook-form";

const address = {
  street: "",
  unit: "",
  city: "",
  state: "FL" as const,
  postal_code: "",
  country: "US" as const,
};
type Photo = { id: string; file: File; status: "pending" | "uploaded" | "failed" };
export function RequestForm() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [begun, setBegun] = useState(false);
  const session = useRef({ key: "", token: "" });
  const website = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useForm<RequestInput>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      origin: { ...address },
      destination: { ...address },
      moving_date: null,
      property_type: "HOUSE",
      bedrooms: 1,
      property_size: null,
      size_unit: null,
      origin_floor: 0,
      destination_floor: 0,
      origin_elevator: false,
      destination_elevator: false,
      workers: null,
      comments: "",
    },
  });
  const { errors } = form.formState;
  void errors;
  const property = form.watch("property_type");
  const hasSize = form.watch("property_size") !== null;
  const errorsText: Record<string, [string, string]> = {
    PHONE_US: ["Introduce un teléfono válido de EE. UU.", "Enter a valid US phone number."],
    DATE_TOMORROW: ["Elige mañana o una fecha posterior.", "Choose tomorrow or a later date."],
    DATE_SUNDAY: ["No realizamos mudanzas los domingos.", "We don't schedule moves on Sundays."],
    RATE_LIMIT: [
      "Se alcanzó el límite de intentos. Vuelve a intentarlo más tarde.",
      "Too many attempts. Please try again later.",
    ],
    INVALID_FILE: [
      "Usa imágenes JPG, PNG o WebP válidas, hasta 5 MB cada una.",
      "Use valid JPG, PNG or WebP images, up to 5 MB each.",
    ],
    FILE_LIMIT: ["Puedes adjuntar hasta ocho fotos.", "You can attach up to eight photos."],
    EXPIRED: [
      "La sesión venció. Recarga para comenzar una nueva solicitud.",
      "The session expired. Reload to start a new request.",
    ],
    INVALID_DATE: [
      "La fecha ya no está disponible. Inicia una nueva solicitud con otra fecha.",
      "The date is no longer available. Start a new request with another date.",
    ],
  };
  function message(code: string) {
    const m = errorsText[code];
    return m
      ? t(...m)
      : t(
          "No se completó el envío. Revisa los datos y vuelve a intentar; tu progreso se conserva.",
          "The request was not completed. Check the details and retry; your progress is preserved.",
        );
  }
  function field(
    name: FieldPath<RequestInput>,
    es: string,
    en: string,
    options: { type?: string; optional?: boolean; min?: number; max?: number; autoComplete?: string } = {},
  ) {
    const invalid = form.getFieldState(name).error;
    const type = options.type ?? "text";
    const errorId = `error-${name}`;
    return (
      <label className="field" key={name}>
        {t(es, en)}
        {options.optional && <span className="optional">{t("Opcional", "Optional")}</span>}
        <input
          type={type}
          autoComplete={options.autoComplete}
          min={options.min}
          max={options.max}
          aria-invalid={!!invalid}
          aria-describedby={invalid ? errorId : undefined}
          {...form.register(name, {
            setValueAs: type === "number" ? (v) => (v === "" || v == null ? null : Number(v)) : undefined,
          })}
        />
        {invalid && (
          <span className="field-error" id={errorId}>
            {errorsText[invalid.message ?? ""]
              ? message(invalid.message ?? "")
              : t("Revisa este campo.", "Check this field.")}
          </span>
        )}
      </label>
    );
  }
  async function advance() {
    const keys: FieldPath<RequestInput>[] =
      step === 0
        ? ["first_name", "last_name", "phone", "email"]
        : [
            "origin",
            "destination",
            "moving_date",
            "property_type",
            "bedrooms",
            "property_size",
            "size_unit",
            "origin_floor",
            "destination_floor",
            "origin_elevator",
            "destination_elevator",
            "workers",
            "comments",
          ];
    if (await form.trigger(keys, { shouldFocus: true })) {
      setStep(step + 1);
      setError("");
      setTimeout(() => heading.current?.focus(), 0);
    }
  }
  async function api(path: string, body?: unknown, file?: File) {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": file ? file.type : "application/json",
        ...(session.current.token ? { "x-intake-token": session.current.token } : {}),
      },
      body: file ?? (body ? JSON.stringify(body) : undefined),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "UNAVAILABLE");
    return data;
  }
  async function submit(data: RequestInput) {
    setBusy(true);
    setError("");
    try {
      if (!session.current.key) session.current.key = crypto.randomUUID();
      if (!session.current.token) {
        const started = await api("/api/intake", {
          key: session.current.key,
          data,
          website: website.current?.value ?? "",
        });
        session.current.token = started.token;
        setBegun(true);
      }
      for (const photo of photos) {
        if (photo.status === "uploaded") continue;
        try {
          await api(
            `/api/intake/files?id=${photo.id}&name=${encodeURIComponent(photo.file.name)}`,
            undefined,
            photo.file,
          );
          setPhotos((current) => current.map((p) => (p.id === photo.id ? { ...p, status: "uploaded" } : p)));
        } catch (error) {
          setPhotos((current) => current.map((p) => (p.id === photo.id ? { ...p, status: "failed" } : p)));
          throw error;
        }
      }
      const complete = await api("/api/intake/finalize");
      setResult(complete.request_number);
      setTimeout(() => heading.current?.focus(), 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : "UNAVAILABLE");
    } finally {
      setBusy(false);
    }
  }
  async function remove(photo: Photo) {
    if (!session.current.token) {
      setPhotos((current) => current.filter((p) => p.id !== photo.id));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/intake/files?id=${photo.id}`, {
        method: "DELETE",
        headers: { "x-intake-token": session.current.token },
      });
      if (!response.ok) throw new Error();
      setPhotos((current) => current.filter((p) => p.id !== photo.id));
      setError("");
    } catch {
      setError("UPLOAD_FAILED");
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <section className="section container narrow">
        <div className="card success-card">
          <CheckCircle2 size={56} aria-hidden="true" />
          <h1 ref={heading} tabIndex={-1}>
            {t("Recibimos tu solicitud.", "We received your request.")}
          </h1>
          <p>{t("Tu número de solicitud", "Your request number")}</p>
          <strong className="request-number">{result}</strong>
          <p>
            {t(
              "Guarda este número. Nuestro equipo revisará los detalles y se pondrá en contacto contigo para preparar una estimación y acordar los siguientes pasos.",
              "Keep this number. Our team will review the details and contact you to prepare an estimate and agree on the next steps.",
            )}
          </p>
          <Button asChild>
            <a href="/">{t("Volver al inicio", "Back to home")}</a>
          </Button>
        </div>
      </section>
    );
  const values = form.getValues();
  return (
    <section className="section container form-container">
      <div className="request-intro">
        <span className="eyebrow">{t("HAGAMOS EL PRIMER PASO", "LET'S TAKE THE FIRST STEP")}</span>
        <h1>{t("Cuéntanos de tu mudanza.", "Tell us about your move.")}</h1>
        <p className="lead">
          {t(
            "No necesitas tener todos los detalles resueltos. Completa lo que sabes y te ayudamos con el resto.",
            "You don't need to have every detail figured out. Share what you know and we'll help with the rest.",
          )}
        </p>
      </div>
      <ol className="form-steps">
        {[
          ["Sobre ti", "About you"],
          ["Tu mudanza", "Your move"],
          ["Revisar y enviar", "Review and send"],
        ].map(([es, en], i) => (
          <li key={es} aria-current={i === step ? "step" : undefined} className={i <= step ? "active" : ""}>
            <span>{i < step ? <Check size={18} /> : i + 1}</span>
            {t(es ?? "", en ?? "")}
          </li>
        ))}
      </ol>
      <form
        onSubmit={(event) => {
          if (step < 2) {
            event.preventDefault();
            void advance();
          } else {
            void form.handleSubmit(submit)(event);
          }
        }}
        noValidate
        className="card request-card"
      >
        <h2 ref={heading} tabIndex={-1}>
          {step === 0
            ? t("Empecemos por conocerte.", "Let's start with you.")
            : step === 1
              ? t("¿De dónde a dónde?", "Where are you moving?")
              : t("Todo listo para revisar.", "Ready for a final look.")}
        </h2>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input ref={website} tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {step === 0 && (
          <>
            <p className="muted">
              {t(
                "Usaremos tu teléfono para conversar sobre la solicitud.",
                "We'll use your phone number to discuss your request.",
              )}
            </p>
            <div className="form-grid">
              {field("first_name", "Nombre", "First name", { autoComplete: "given-name" })}
              {field("last_name", "Apellido", "Last name", { autoComplete: "family-name" })}
              {field("phone", "Teléfono de EE. UU.", "US phone number", { type: "tel", autoComplete: "tel" })}
              {field("email", "Correo electrónico", "Email", {
                type: "email",
                optional: true,
                autoComplete: "email",
              })}
            </div>
          </>
        )}
        {step === 1 && (
          <div className="stack">
            {(["origin", "destination"] as const).map((side) => (
              <fieldset className="address-group" key={side}>
                <legend>
                  {side === "origin" ? t("Origen", "Origin") : t("Destino", "Destination")} · Florida
                </legend>
                <div className="form-grid">
                  {field(`${side}.street`, "Dirección", "Street address")}
                  {field(`${side}.unit`, "Apartamento / unidad", "Apartment / unit", { optional: true })}
                  {field(`${side}.city`, "Ciudad", "City")}
                  {field(`${side}.postal_code`, "Código postal", "ZIP code")}
                  {field(`${side}_floor`, "Piso (0 = planta baja)", "Floor (0 = ground floor)", {
                    type: "number",
                    min: -5,
                    max: 150,
                  })}
                  <label className="check-field">
                    <input type="checkbox" {...form.register(`${side}_elevator`)} />
                    {t("Hay elevador disponible", "Elevator available")}
                  </label>
                </div>
              </fieldset>
            ))}
            <div className="form-grid">
              <label className="field">
                {t("Tipo de propiedad", "Property type")}
                <select
                  {...form.register("property_type")}
                  onChange={(e) => {
                    const value = e.target.value as RequestInput["property_type"];
                    form.setValue("property_type", value);
                    form.setValue("bedrooms", ["HOUSE", "APARTMENT"].includes(value) ? 1 : null);
                  }}
                >
                  <option value="HOUSE">{t("Casa", "House")}</option>
                  <option value="APARTMENT">{t("Apartamento", "Apartment")}</option>
                  <option value="OFFICE">{t("Oficina", "Office")}</option>
                  <option value="COMMERCIAL">{t("Local comercial", "Business premises")}</option>
                </select>
              </label>
              {["HOUSE", "APARTMENT"].includes(property) &&
                field("bedrooms", "Dormitorios (0 = estudio)", "Bedrooms (0 = studio)", {
                  type: "number",
                  min: 0,
                  max: 20,
                })}
              <label className="field">
                {t("Superficie aproximada (opcional)", "Approximate size (optional)")}
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  {...form.register("property_size", {
                    setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                  })}
                  onChange={(e) => {
                    const size = e.target.value ? Number(e.target.value) : null;
                    form.setValue("property_size", size);
                    form.setValue("size_unit", size ? (form.getValues("size_unit") ?? "SQFT") : null);
                  }}
                />
                {form.getFieldState("property_size").error && (
                  <span className="field-error">
                    {t("Revisa la superficie y unidad.", "Check the size and unit.")}
                  </span>
                )}
              </label>
              {hasSize && (
                <label className="field">
                  {t("Unidad", "Unit")}
                  <select {...form.register("size_unit")}>
                    <option value="SQFT">ft²</option>
                    <option value="SQM">m²</option>
                  </select>
                </label>
              )}
              <label className="field">
                {t("Equipo de trabajadores", "Moving crew")}
                <select
                  {...form.register("workers", {
                    setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                  })}
                >
                  <option value="">
                    {t("No estoy seguro, necesito asesoría", "I'm not sure, I need guidance")}
                  </option>
                  {[2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {t("trabajadores + camión", "movers + truck")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {t("Fecha deseada (opcional)", "Preferred date (optional)")}
                <input
                  type="date"
                  {...form.register("moving_date", { setValueAs: (v) => v || null })}
                  aria-invalid={!!form.getFieldState("moving_date").error}
                />
                {form.getFieldState("moving_date").error && (
                  <span className="field-error">
                    {message(form.getFieldState("moving_date").error?.message ?? "")}
                  </span>
                )}
                <span className="small muted">
                  {t(
                    "Sin fecha definida: deja vacío. Desde mañana, de lunes a sábado. La hora se acuerda después.",
                    "No date yet: leave blank. Tomorrow or later, Monday–Saturday. The time is agreed later.",
                  )}
                </span>
              </label>
              <label className="field full">
                {t("Comentarios adicionales (opcional)", "Additional comments (optional)")}
                <textarea rows={4} maxLength={4000} {...form.register("comments")} />
              </label>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="stack">
            <dl className="review-grid">
              <div>
                <dt>{t("Contacto", "Contact")}</dt>
                <dd>
                  {values.first_name} {values.last_name}
                  <br />
                  {values.phone}
                  {values.email && (
                    <>
                      <br />
                      {values.email}
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt>{t("Fecha y equipo", "Date and crew")}</dt>
                <dd>
                  {values.moving_date ?? t("Todavía no tengo fecha definida", "I don't have a date yet")}
                  <br />
                  {values.workers
                    ? `${values.workers} ${t("trabajadores + camión", "movers + truck")}`
                    : t("Necesito asesoría", "I need guidance")}
                </dd>
              </div>
              {(["origin", "destination"] as const).map((side) => (
                <div key={side}>
                  <dt>{side === "origin" ? t("Origen", "Origin") : t("Destino", "Destination")}</dt>
                  <dd>
                    {values[side].street} {values[side].unit}
                    <br />
                    {values[side].city}, FL {values[side].postal_code}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="upload-zone">
              <FileImage size={26} aria-hidden="true" />
              <h3>{t("Muéstranos tu espacio", "Show us your space")}</h3>
              <p>
                {t(
                  "Fotos opcionales. Hasta 8 imágenes JPG, PNG o WebP, 5 MB cada una.",
                  "Optional photos. Up to 8 JPG, PNG or WebP images, 5 MB each.",
                )}
              </p>
              <label className="field">
                {t("Seleccionar fotografías", "Choose photos")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={busy || begun}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (photos.length + files.length > 8) {
                      setError("FILE_LIMIT");
                      return;
                    }
                    if (files.some((f) => !validFileMetadata(f))) {
                      setError("INVALID_FILE");
                      return;
                    }
                    setPhotos((current) => [
                      ...current,
                      ...files.map((file) => ({ id: crypto.randomUUID(), file, status: "pending" as const })),
                    ]);
                    setError("");
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {photos.length > 0 && (
              <ul className="photo-list">
                {photos.map((photo) => (
                  <li key={photo.id}>
                    <span>
                      {photo.file.name}
                      <small>
                        {photo.status === "uploaded"
                          ? t("Lista", "Ready")
                          : photo.status === "failed"
                            ? t(
                                "No se cargó. Reintenta u omite esta foto.",
                                "Upload failed. Retry or omit this photo.",
                              )
                            : t("Pendiente", "Pending")}
                      </small>
                    </span>
                    <Button type="button" variant="ghost" disabled={busy} onClick={() => remove(photo)}>
                      {t("Omitir foto", "Omit photo")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="notice">
              {t(
                "Esta solicitud no confirma una reserva ni un precio. Revisaremos los detalles contigo antes de acordar una estimación y programación.",
                "This request does not confirm a booking or a price. We'll review the details with you before agreeing on an estimate and schedule.",
              )}
            </p>
          </div>
        )}
        {error && (
          <p className="notice error" role="alert">
            {message(error)}
          </p>
        )}
        <div className="form-actions">
          {step > 0 && !begun && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              {t("Atrás", "Back")}
            </Button>
          )}
          {step < 2 ? (
            <Button
              key="next-step"
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void advance();
              }}
            >
              {t("Continuar", "Continue")}
              <ArrowRight size={17} />
            </Button>
          ) : (
            <Button key="send-request" type="submit" disabled={busy}>
              {busy
                ? t("Enviando…", "Sending…")
                : error
                  ? t("Reintentar envío", "Retry submission")
                  : t("Enviar solicitud", "Send request")}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
