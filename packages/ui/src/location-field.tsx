"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { loadPlaces, withLocationTimeout } from "./google-places";
import { useLanguage } from "./language";

type Suggestion = { id: string; label: string; prediction: google.maps.places.PlacePrediction };
export type LocationValue = { input: string; resolution_token: string | null };
export type SelectedLocation = { label: string; street: string; city: string; postal_code: string };
export function LocationField({
  label,
  value,
  onChange,
  invalid,
  disabled,
  onPlaceSelect,
}: {
  label: string;
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  onPlaceSelect?: (position: google.maps.LatLngLiteral, address: SelectedLocation) => void;
  invalid: boolean;
  disabled: boolean;
}) {
  const { locale } = useLanguage();
  const t = useCallback((es: string, en: string) => (locale === "es" ? es : en), [locale]);
  const id = useId();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const session = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const sequence = useRef(0);
  const [selectedInput, setSelectedInput] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [editedInput, setEditedInput] = useState<string | null>(null);

  useEffect(() => {
    void retry;
    const seq = ++sequence.current;
    setItems([]);
    setActive(-1);
    setLoading(false);
    if (
      editedInput !== value.input ||
      value.input.trim().length < 3 ||
      value.resolution_token ||
      selectedInput === value.input ||
      disabled
    )
      return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const places = await withLocationTimeout(loadPlaces());
        if (controller.signal.aborted) return;
        session.current ??= new places.AutocompleteSessionToken();
        const data = await withLocationTimeout(
          places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value.input,
            sessionToken: session.current,
            language: locale,
            region: "us",
            includedRegionCodes: ["us"],
            locationBias: { west: -87.64, east: -80.03, south: 24.39, north: 31.01 },
            ...(/^\d{5}$/.test(value.input.trim()) ? { includedPrimaryTypes: ["postal_code"] } : {}),
          }),
        );
        if (seq !== sequence.current || controller.signal.aborted) return;
        const suggestions = data.suggestions.flatMap(({ placePrediction }) =>
          placePrediction
            ? [
                {
                  id: placePrediction.placeId,
                  label: placePrediction.text.toString(),
                  prediction: placePrediction,
                },
              ]
            : [],
        );
        setItems(suggestions);
        setMessage(
          suggestions.length
            ? ""
            : t(
                "Sin sugerencias. Puedes continuar; verificaremos la ubicación.",
                "No suggestions. You can continue; we'll verify the location.",
              ),
        );
      } catch {
        if (seq === sequence.current && !controller.signal.aborted)
          setMessage(
            t(
              "Búsqueda no disponible. Puedes continuar con tu ZIP o dirección; lo verificaremos contigo.",
              "Search unavailable. Continue with your ZIP or address; we'll verify it with you.",
            ),
          );
      } finally {
        if (seq === sequence.current) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value.input, value.resolution_token, disabled, locale, t, retry, selectedInput, editedInput]);
  async function select(item: Suggestion) {
    const seq = ++sequence.current;
    setLoading(true);
    setItems([]);
    try {
      // Complete the browser autocomplete session. Server verification remains
      // authoritative and never trusts county or pricing supplied by the client.
      const place = item.prediction.toPlace();
      await withLocationTimeout(
        place.fetchFields({
          fields: onPlaceSelect ? ["addressComponents", "location"] : ["addressComponents"],
        }),
      );
      if (seq !== sequence.current) return;
      session.current = null;
      if (onPlaceSelect) {
        const components = place.addressComponents ?? [];
        if (
          !components.some((c) => c.types.includes("country") && c.shortText === "US") ||
          !components.some((c) => c.types.includes("administrative_area_level_1") && c.shortText === "FL") ||
          !place.location
        ) {
          setMessage(
            t(
              "Selecciona una ubicación válida dentro de Florida.",
              "Select a valid location within Florida.",
            ),
          );
          return;
        }
        setSelectedInput(value.input);
        const component = (type: string) => components.find((c) => c.types.includes(type))?.longText ?? "";
        onPlaceSelect(place.location.toJSON(), {
          label: item.label,
          street: [component("street_number"), component("route")].filter(Boolean).join(" "),
          city: component("locality") || component("sublocality_level_1"),
          postal_code: component("postal_code"),
        });
        setMessage(item.label);
        return;
      }
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          input: value.input,
          id: item.id,
          session: crypto.randomUUID(),
          language: locale.startsWith("es") ? "es" : "en",
        }),
      });
      const data = await response.json();
      if (seq !== sequence.current) return;
      if (!response.ok) {
        setMessage(
          data.error === "OUTSIDE_FL"
            ? t(
                "Solo atendemos Florida. Cambia esta ubicación.",
                "We serve Florida only. Change this location.",
              )
            : t(
                "No pudimos verificarla. Puedes continuar para revisión manual.",
                "We couldn't verify this location. You can continue for manual review.",
              ),
        );
        if (data.error === "OUTSIDE_FL") onChange({ input: "", resolution_token: null });
        return;
      }
      onChange({ ...value, resolution_token: data.token });
      session.current = null;
      setMessage(
        `${item.label} · ${t("La dirección completa se confirmará contigo.", "We'll confirm the full address with you.")}`,
      );
    } catch {
      if (seq === sequence.current)
        setMessage(
          t("No disponible. Continúa para revisión manual.", "Unavailable. Continue for manual review."),
        );
    } finally {
      if (seq === sequence.current) setLoading(false);
    }
  }
  return (
    <div className="location-field">
      <label className="field" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={items.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
        aria-describedby={`${id}-status`}
        aria-invalid={invalid}
        autoComplete="off"
        value={value.input}
        disabled={disabled}
        placeholder={t("Código postal o dirección", "ZIP code or address")}
        onChange={(e) => {
          sequence.current++;
          setEditedInput(e.target.value);
          setSelectedInput(null);
          setMessage("");
          onChange({ input: e.target.value, resolution_token: null });
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && items.length) {
            e.preventDefault();
            setActive((i) => (i + 1) % items.length);
          }
          if (e.key === "ArrowUp" && items.length) {
            e.preventDefault();
            setActive((i) => (i - 1 + items.length) % items.length);
          }
          if (e.key === "Enter" && active >= 0 && items[active]) {
            e.preventDefault();
            void select(items[active]);
          }
          if (e.key === "Escape") {
            setItems([]);
            setActive(-1);
          }
        }}
      />
      {items.length > 0 && (
        <div className="location-suggestions">
          <div id={`${id}-list`} role="listbox" aria-label={label}>
            {items.map((item, i) => (
              <div id={`${id}-${i}`} role="option" tabIndex={-1} aria-selected={active === i} key={item.id}>
                <button type="button" onClick={() => void select(item)}>
                  {item.label}
                </button>
              </div>
            ))}
          </div>
          <span className="small">Google Maps</span>
        </div>
      )}
      <p id={`${id}-status`} className={invalid ? "field-error" : "small muted"} role="status">
        {invalid
          ? t("Introduce un ZIP o una dirección.", "Enter a ZIP code or address.")
          : loading
            ? t("Buscando…", "Searching…")
            : message}
      </p>
      {!loading && !value.resolution_token && selectedInput !== value.input && message && (
        <button type="button" className="text-link" onClick={() => setRetry((v) => v + 1)}>
          {t("Reintentar búsqueda", "Retry search")}
        </button>
      )}
    </div>
  );
}
