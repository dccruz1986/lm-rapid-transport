/// <reference types="google.maps" />
"use client";
import { importLibrary } from "@googlemaps/js-api-loader";
import { Button, useLanguage } from "@lm/ui";
import { configureGoogleMaps, loadPlaces, withLocationTimeout } from "@lm/ui/google-places";
import { LocationField } from "@lm/ui/location-field";
import { useEffect, useRef, useState } from "react";

import { useRouteAddresses } from "./route-addresses";

const MIAMI = { lat: 25.7617, lng: -80.1918 };

// Preview only: a ZIP centroid never confirms an address or county.
async function locateZip(zip: string) {
  if (!/^\d{5}$/.test(zip)) return null;
  const places = await loadPlaces();
  const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: zip,
    includedPrimaryTypes: ["postal_code"],
    includedRegionCodes: ["us"],
  });
  const prediction = suggestions[0]?.placePrediction;
  if (!prediction) return null;
  const place = prediction.toPlace();
  await place.fetchFields({ fields: ["addressComponents", "location"] });
  const matches = (type: string, value: string) =>
    (place.addressComponents ?? []).some((c) => c.types.includes(type) && c.shortText === value);
  return matches("postal_code", zip) &&
    matches("country", "US") &&
    matches("administrative_area_level_1", "FL") &&
    place.location
    ? place.location.toJSON()
    : null;
}

export function RouteMap({
  originZip,
  destinationZip,
}: {
  origin: string;
  destination: string;
  originZip?: string | null;
  destinationZip?: string | null;
}) {
  const { t, locale } = useLanguage();
  const { addresses, positions, setPositions, edits, edit, select } = useRouteAddresses();
  const inputs = addresses.map((address) => address.input);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [retry, setRetry] = useState(0);
  const element = useRef<HTMLElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Share pending lookups across React Strict Mode effect replays.
  const zipLookups = useRef(new Map<string, Promise<google.maps.LatLngLiteral | null>>());

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry explicitly restarts failed Google requests.
  useEffect(() => {
    let active = true;
    setFailed(false);
    async function initialize() {
      try {
        configureGoogleMaps();
        const [maps] = await withLocationTimeout(
          Promise.all([importLibrary("maps"), importLibrary("marker")]),
        );
        if (!active || !element.current) return;
        map.current = new maps.Map(element.current, {
          center: MIAMI,
          zoom: 10,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
          streetViewControl: false,
          mapTypeControl: false,
        });
        setReady(true);
      } catch {
        if (active) setFailed(true);
      }
    }
    void initialize();
    return () => {
      active = false;
      for (const marker of markers.current) marker.map = null;
      markers.current = [];
      map.current = null;
      setReady(false);
    };
  }, [retry]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry explicitly restarts failed Google requests.
  useEffect(() => {
    let active = true;
    const versions = [...edits.current];
    setSearching(true);
    void Promise.allSettled(
      [originZip, destinationZip].map(async (zip, i) => {
        if (!zip || edits.current[i] !== 0) return;
        const normalizedZip = zip.trim();
        let lookup = zipLookups.current.get(normalizedZip);
        if (!lookup) {
          lookup = withLocationTimeout(locateZip(normalizedZip));
          zipLookups.current.set(normalizedZip, lookup);
          void lookup.catch(() => zipLookups.current.delete(normalizedZip));
        }
        const position = await lookup;
        if (active && versions[i] === edits.current[i])
          setPositions((values) => values.map((old, n) => (n === i ? position : old)));
      }),
    ).finally(() => {
      if (active) setSearching(false);
    });
    return () => {
      active = false;
    };
  }, [originZip, destinationZip, retry]);

  useEffect(() => {
    if (!ready || !map.current) return;
    for (const marker of markers.current) marker.map = null;
    markers.current = [];
    const bounds = new google.maps.LatLngBounds();
    positions.forEach((position, i) => {
      if (!position) return;
      const pin = document.createElement("span");
      pin.textContent = i === 0 ? "A" : "B";
      pin.style.cssText =
        "background:#d75523;color:white;border:2px solid white;border-radius:50%;padding:8px 13px;font-weight:bold";
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: map.current,
        position,
        title:
          i === 0 ? (locale === "es" ? "Origen" : "Origin") : locale === "es" ? "Destino" : "Destination",
      });
      marker.append(pin);
      markers.current.push(marker);
      bounds.extend(position);
    });
    if (markers.current.length === 2) {
      map.current.fitBounds(bounds, 60);
      const idle = map.current.addListener("idle", () => {
        if (map.current && (map.current.getZoom() ?? 0) > 14) map.current.setZoom(14);
        idle.remove();
      });
      return () => {
        idle.remove();
      };
    }
    map.current.setCenter(markers.current.length ? bounds.getCenter() : MIAMI);
    map.current.setZoom(markers.current.length ? 12 : 10);
  }, [positions, ready, locale]);

  return (
    <section className="card stack">
      <h2>{t("Mapa del recorrido", "Route map")}</h2>
      <div className="form-grid">
        {inputs.map((input, i) => (
          <LocationField
            key={i === 0 ? "origin" : "destination"}
            label={
              i === 0
                ? t("A · Dirección o ZIP de origen", "A · Pickup address or ZIP")
                : t("B · Dirección o ZIP de destino", "B · Destination address or ZIP")
            }
            value={{ input, resolution_token: null }}
            invalid={false}
            disabled={false}
            onChange={(value) => edit(i, value.input)}
            onPlaceSelect={(position, address) => select(i, position, address)}
          />
        ))}
      </div>
      <p className="small muted">
        {t(
          "El mapa muestra Miami por defecto. Los ZIP de la solicitud se ubican automáticamente como puntos aproximados; selecciona una sugerencia para precisar cada ubicación. A: origen · B: destino.",
          "The map defaults to Miami. Request ZIP codes are located automatically as approximate points; select a suggestion to refine each location. A: origin · B: destination.",
        )}
      </p>
      <p className="small muted">
        {t(
          "Vista de consulta. Para guardar cambios utiliza el paso 1: Datos del cliente y direcciones. El mapa no calcula el precio ni confirma el condado o la dirección exacta.",
          "Preview only. Save changes using step 1: Customer details and addresses. The map does not calculate pricing or verify the county or exact address.",
        )}
      </p>
      <p role="status">
        {failed
          ? t(
              "No se pudo cargar Google Maps. Revisa la clave pública y sus permisos.",
              "Google Maps could not load. Check the public key and its permissions.",
            )
          : searching
            ? t("Ubicando los ZIP…", "Locating ZIP codes…")
            : positions.every(Boolean)
              ? t(
                  "Los dos puntos están visibles. Las ubicaciones por ZIP son aproximadas.",
                  "Both points are visible. ZIP locations are approximate.",
                )
              : t(
                  "Selecciona las ubicaciones pendientes en las sugerencias. Sin puntos, se muestra Miami.",
                  "Select missing locations from the suggestions. Without points, Miami is shown.",
                )}
      </p>
      {failed && (
        <Button type="button" onClick={() => setRetry((value) => value + 1)}>
          {t("Reintentar", "Retry")}
        </Button>
      )}
      <section
        ref={element}
        aria-label={t("Mapa de origen y destino", "Origin and destination map")}
        style={{ height: 360, width: "100%", borderRadius: 12, background: "#f3f4f6" }}
      />
    </section>
  );
}
