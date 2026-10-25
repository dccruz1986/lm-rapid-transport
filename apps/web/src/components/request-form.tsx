"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, useLanguage } from "@lm/ui";
import { LocationField } from "@lm/ui/location-field";
import {
  moveSizes,
  type IntakeV2 as RequestInput,
  intakeV2Schema as requestSchema,
  validFileMetadata,
} from "@lm/validation";
import { ArrowRight, Check, CheckCircle2, FileImage } from "lucide-react";
import { useRef, useState } from "react";
import { type FieldPath, useForm } from "react-hook-form";

type Photo = { id: string; file: File; status: "pending" | "uploaded" | "failed" };
export function RequestForm({ phone }: { phone: string }) {
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
      version: 2,
      full_name: "",
      phone: "",
      email: "",
      origin: { input: "", resolution_token: null },
      destination: { input: "", resolution_token: null },
      moving_date: null,
      comments: "",
      workers: null,
      property_size: null,
      size_unit: null,
      property_type: null,
      origin_floor: null,
      destination_floor: null,
      origin_elevator: null,
      destination_elevator: null,
      origin_unit: null,
      destination_unit: null,
    },
  });
  const { errors } = form.formState;
  void errors;
  form.watch(["origin", "destination"]);
  const hasSize = form.watch("property_size") !== null;
  const errorsText: Record<string, [string, string]> = {
    SPAM_CHECK: [
      "El autocompletado pudo rellenar un campo oculto. Recarga la página con las extensiones de autocompletado desactivadas e inténtalo de nuevo.",
      "Autofill may have filled a hidden field. Reload with autofill extensions disabled and try again.",
    ],
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
            setValueAs:
              type === "number"
                ? (v) => (v === "" || v == null ? null : Number(v))
                : type === "date"
                  ? (v) => v || null
                  : undefined,
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
        ? ["origin", "destination"]
        : [
            "moving_date",
            "move_size",
            "property_type",
            "property_size",
            "size_unit",
            "origin_floor",
            "destination_floor",
            "origin_elevator",
            "destination_elevator",
            "workers",
            "comments",
            "origin_unit",
            "destination_unit",
          ];
    if (await form.trigger(keys, { shouldFocus: true })) {
      setStep(step + 1);
      setError("");
      setTimeout(() => heading.current?.focus(), 0);
    } else setError("INVALID_INPUT");
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
    if (!response.ok) {
      if (data.error === "INVALID_INPUT" && data.fields?.includes("website")) throw new Error("SPAM_CHECK");
      throw new Error(data.error ?? "UNAVAILABLE");
    }
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
          ["Ubicación", "Location"],
          ["Detalles", "Details"],
          ["Contacto", "Contact"],
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
            ? t("¿De dónde a dónde?", "Where are you moving?")
            : step === 1
              ? t("Cuéntanos lo básico.", "A few move details.")
              : t("Recibe tu cotización.", "Get your quote.")}
        </h2>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input
              ref={website}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              readOnly
              onFocus={(event) => {
                event.currentTarget.readOnly = false;
              }}
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
            />
          </label>
        </div>
        <fieldset disabled={busy || begun} className="simple-form-fields">
          {step === 0 && (
            <div className="stack">
              {(["origin", "destination"] as const).map((side) => (
                <LocationField
                  key={side}
                  label={side === "origin" ? t("Origen", "Pickup") : t("Destino", "Destination")}
                  value={form.getValues(side)}
                  onChange={(value) => form.setValue(side, value, { shouldValidate: true })}
                  invalid={!!form.getFieldState(side).error}
                  disabled={busy || begun}
                />
              ))}
              <p className="small muted">
                {t(
                  "Servicio dentro de Florida. Ambos extremos en Miami-Dade: por hora; fuera del condado: por milla. Confirmaremos el recorrido contigo.",
                  "Service within Florida. Both locations in Miami-Dade: hourly; outside the county: per mile. We'll confirm the route with you.",
                )}
              </p>
              <p className="small muted">
                {t("La búsqueda usa Google Maps.", "Search uses Google Maps.")}{" "}
                <a href="/privacy">{t("Privacidad", "Privacy")}</a> ·{" "}
                <a href="/terms">{t("Condiciones", "Terms")}</a>
              </p>
            </div>
          )}
          {step === 1 && (
            <div className="stack">
              {field("moving_date", "Fecha deseada", "Preferred move date", {
                type: "date",
                optional: true,
              })}
              <p className="small muted">
                {t(
                  "Sin fecha definida: deja vacío. Desde mañana, lunes a sábado.",
                  "No date yet: leave blank. Tomorrow or later, Monday–Saturday.",
                )}
              </p>
              <label className="field">
                {t("Tamaño de la mudanza", "Move size")}
                <select
                  {...form.register("move_size")}
                  aria-invalid={!!form.getFieldState("move_size").error}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t("Selecciona el tamaño", "Select move size")}
                  </option>
                  {moveSizes.map((size) => (
                    <option key={size} value={size}>
                      {size === "STUDIO"
                        ? t("Estudio", "Studio")
                        : size === "OFFICE"
                          ? t("Oficina", "Office")
                          : size === "COMMERCIAL"
                            ? t("Comercial", "Commercial")
                            : size === "BEDROOMS_5_PLUS"
                              ? t("5+ dormitorios", "5+ bedrooms")
                              : size === "BEDROOMS_1"
                                ? t("1 dormitorio", "1 bedroom")
                                : size.slice(-1) + " " + t("dormitorios", "bedrooms")}
                    </option>
                  ))}
                </select>
                {form.getFieldState("move_size").error && (
                  <span className="field-error">{t("Selecciona el tamaño.", "Select a move size.")}</span>
                )}
              </label>
              <details>
                <summary>{t("Más detalles (opcional)", "More details (optional)")}</summary>
                <div className="stack" style={{ marginTop: 20 }}>
                  <label className="field">
                    {t("Tipo de propiedad", "Property type")}
                    <select {...form.register("property_type", { setValueAs: (v) => v || null })}>
                      <option value="">{t("Por definir", "Not specified")}</option>
                      <option value="HOUSE">{t("Casa", "House")}</option>
                      <option value="APARTMENT">{t("Apartamento", "Apartment")}</option>
                      <option value="OFFICE">{t("Oficina", "Office")}</option>
                      <option value="COMMERCIAL">{t("Comercial", "Commercial")}</option>
                    </select>
                  </label>
                  {(["origin", "destination"] as const).map((side) => (
                    <div key={side} className="stack">
                      <h3>{side === "origin" ? t("Origen", "Pickup") : t("Destino", "Destination")}</h3>
                      {field(
                        (side + "_unit") as FieldPath<RequestInput>,
                        "Unidad (opcional)",
                        "Unit (optional)",
                        { optional: true },
                      )}
                      {field(
                        (side + "_floor") as FieldPath<RequestInput>,
                        "Piso (opcional)",
                        "Floor (optional)",
                        { type: "number", optional: true, min: -5, max: 150 },
                      )}
                      <label className="field">
                        {t("Elevador", "Elevator")}
                        <select
                          {...form.register(
                            (side + "_elevator") as "origin_elevator" | "destination_elevator",
                            { setValueAs: (v) => (v === "" || v == null ? null : v === "true") },
                          )}
                        >
                          <option value="">{t("No indicado", "Not specified")}</option>
                          <option value="true">{t("Sí", "Yes")}</option>
                          <option value="false">No</option>
                        </select>
                      </label>
                    </div>
                  ))}
                  <label className="field">
                    {t("Superficie aproximada", "Approximate size")}
                    <input
                      type="number"
                      min="1"
                      max="1000000"
                      {...form.register("property_size", { setValueAs: (v) => (v ? Number(v) : null) })}
                      onChange={(e) => {
                        const n = e.target.value ? Number(e.target.value) : null;
                        form.setValue("property_size", n);
                        form.setValue("size_unit", n ? (form.getValues("size_unit") ?? "SQFT") : null);
                      }}
                    />
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
                    {t("Equipo", "Crew")}
                    <select {...form.register("workers", { setValueAs: (v) => (v ? Number(v) : null) })}>
                      <option value="">{t("Necesito asesoría", "I need guidance")}</option>
                      {[2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n} {t("trabajadores + camión", "movers + truck")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    {t("Comentarios", "Comments")}
                    <textarea rows={3} {...form.register("comments")} />
                  </label>
                </div>
              </details>
            </div>
          )}
          {step === 2 && (
            <div className="stack">
              {field("full_name", "Nombre completo", "Full name", { autoComplete: "name" })}
              {field("email", "Correo electrónico", "Email address", {
                type: "email",
                optional: true,
                autoComplete: "email",
              })}
              {field("phone", "Teléfono de EE. UU.", "US phone number", { type: "tel", autoComplete: "tel" })}
              <p className="notice">
                {t(
                  "Esta solicitud no confirma una reserva ni un precio. Te contactaremos para completar los detalles.",
                  "This request does not confirm a booking or price. We'll contact you to complete the details.",
                )}
              </p>
            </div>
          )}
        </fieldset>
        {(step === 1 || (step === 2 && begun && photos.length > 0)) && (
          <details>
            <summary>{t("Fotografías opcionales", "Optional photos")}</summary>{" "}
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
          </details>
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
                  : t("Solicitar cotización", "Get my quote")}
            </Button>
          )}
        </div>
        <p className="quote-phone">
          {t("O habla directamente con nosotros:", "Or speak with us directly:")}
          <br />
          <a href={`tel:${phone}`}>{phone}</a>
        </p>
      </form>
    </section>
  );
}
