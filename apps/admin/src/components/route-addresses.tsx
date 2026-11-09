"use client";
import type { SelectedLocation } from "@lm/ui/location-field";
import {
  type LocationStatus,
  locationKey,
  locationResolver,
  type SavedLocation,
} from "@lm/ui/resolve-location";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { RequestRecord } from "./record-forms";
import { countyTerritory, type Territory } from "./route-estimate";
import { useRouteEstimate } from "./use-route-estimate";

function saved(request: RequestRecord): SavedLocation[] {
  return [request.origin, request.destination].map((a) => ({
    input: a.street
      ? [a.street, a.city, a.postal_code].filter(Boolean).join(", ")
      : a.input || a.postal_code || "",
    street: a.street ?? "",
    city: a.city ?? "",
    postal_code: a.postal_code ?? "",
    place_id: a.place_id,
    precision: a.precision,
  }));
}
function useDraft(request: RequestRecord) {
  const [addresses, setAddresses] = useState(() => saved(request));
  const [positions, setPositions] = useState<(google.maps.LatLngLiteral | null)[]>([null, null]);
  const [statuses, setStatuses] = useState<LocationStatus[]>(["pending", "pending"]);
  const [territories, setTerritories] = useState<Territory[]>(["UNKNOWN", "UNKNOWN"]);
  const [resolvedKeys, setResolvedKeys] = useState<string[]>(["", ""]);
  const edits = useRef([0, 0]);
  const previous = useRef(saved(request));
  const hydrated = useRef(new Set<string>());
  const resolver = useRef<ReturnType<typeof locationResolver> | null>(null);
  resolver.current ??= locationResolver();
  const [retry, setRetry] = useState(0);
  const sourceKey = JSON.stringify(saved(request));
  useEffect(() => {
    const next: SavedLocation[] = JSON.parse(sourceKey);
    const old = previous.current;
    setAddresses((values) =>
      values.map((a, i) => {
        const before = old[i];
        if (!before || !next[i] || locationKey(before) === locationKey(next[i])) return a;
        return edits.current[i] === 0 || locationKey(a) === locationKey(before) ? next[i] : a;
      }),
    );
    previous.current = next;
  }, [sourceKey]);
  const keys = JSON.stringify(addresses.map(locationKey));
  // biome-ignore lint/correctness/useExhaustiveDependencies: keys describe the location values; locale and callback identity must not trigger lookups.
  useEffect(() => {
    let active = true;
    const versions = [...edits.current];
    addresses.forEach((address, i) => {
      if (
        edits.current[i] !== 0 ||
        hydrated.current.has(`${i}:${locationKey(address)}`) ||
        (!address.input && !address.place_id)
      )
        return;
      setStatuses((values) => values.map((s, n) => (n === i ? "loading" : s)));
      setPositions((values) => values.map((p, n) => (n === i ? null : p)));
      setTerritories((values) => values.map((v, n) => (n === i ? "UNKNOWN" : v)));
      void resolver
        .current?.(address)
        .then((result) => {
          if (!active || edits.current[i] !== versions[i]) return;
          const complete = result?.details
            ? { ...address, ...result.details, precision: result.precision }
            : address;
          setResolvedKeys((values) => values.map((v, n) => (n === i ? locationKey(complete) : v)));
          if (result?.details) {
            hydrated.current.add(`${i}:${locationKey(complete)}`);
            setAddresses((values) => values.map((a, n) => (n === i ? complete : a)));
          }
          setPositions((values) => values.map((p, n) => (n === i ? (result?.position ?? null) : p)));
          setTerritories((values) => values.map((v, n) => (n === i ? countyTerritory(result?.county) : v)));
          setStatuses((values) =>
            values.map((s, n) =>
              n === i ? (result ? (result.precision === "POSTAL_CODE" ? "postal" : "address") : "error") : s,
            ),
          );
        })
        .catch(() => {
          if (active && edits.current[i] === versions[i])
            setStatuses((values) => values.map((s, n) => (n === i ? "error" : s)));
        });
    });
    return () => {
      active = false;
    };
  }, [keys, retry]);
  function edit(index: number, input: string) {
    edits.current[index] = (edits.current[index] ?? 0) + 1;
    setAddresses((values) =>
      values.map((a, i) =>
        i === index
          ? {
              ...a,
              input,
              street: /^\d{5}$/.test(input.trim()) ? "" : input,
              city: "",
              postal_code: /^\d{5}$/.test(input.trim()) ? input.trim() : "",
              place_id: null,
              precision: "MANUAL",
            }
          : a,
      ),
    );
    setPositions((values) => values.map((p, i) => (i === index ? null : p)));
    setTerritories((values) => values.map((v, i) => (i === index ? "UNKNOWN" : v)));
    setStatuses((values) => values.map((s, i) => (i === index ? "pending" : s)));
  }
  function select(
    index: number,
    position: google.maps.LatLngLiteral,
    address: SelectedLocation,
    county?: string,
  ) {
    edits.current[index] = (edits.current[index] ?? 0) + 1;
    setAddresses((values) => values.map((a, i) => (i === index ? { ...address, input: address.label } : a)));
    setResolvedKeys((values) =>
      values.map((v, i) => (i === index ? locationKey({ ...address, input: address.label }) : v)),
    );
    setPositions((values) => values.map((p, i) => (i === index ? position : p)));
    setTerritories((values) => values.map((v, i) => (i === index ? countyTerritory(county) : v)));
    setStatuses((values) =>
      values.map((s, i) => (i === index ? (address.precision === "POSTAL_CODE" ? "postal" : "address") : s)),
    );
  }
  function retryLocations() {
    resolver.current = locationResolver();
    hydrated.current.clear();
    setRetry((v) => v + 1);
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: keys describe address identity without rerender-driven array changes.
  const currentPositions = useMemo(
    () => positions.map((p, i) => (addresses[i] && resolvedKeys[i] === locationKey(addresses[i]) ? p : null)),
    [positions, resolvedKeys, keys],
  );
  const currentTerritories = territories.map((v, i) => (currentPositions[i] ? v : "UNKNOWN"));
  const estimate = useRouteEstimate(
    JSON.stringify([keys, currentPositions, currentTerritories, edits.current]),
    currentPositions,
    currentTerritories,
  );
  return {
    addresses,
    positions: currentPositions,
    statuses,
    territories: currentTerritories,
    estimate,
    edits,
    edit,
    select,
    retryLocations,
  };
}
const Context = createContext<ReturnType<typeof useDraft> | null>(null);
export function RouteAddressesProvider({
  request,
  children,
}: {
  request: RequestRecord;
  children: ReactNode;
}) {
  return <Context value={useDraft(request)}>{children}</Context>;
}
export function useRouteAddresses() {
  const value = useContext(Context);
  if (!value) throw new Error("RouteAddressesProvider is required");
  return value;
}
