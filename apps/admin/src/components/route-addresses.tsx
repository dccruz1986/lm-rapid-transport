"use client";
import type { SelectedLocation } from "@lm/ui/location-field";
import { createContext, type ReactNode, useContext, useRef, useState } from "react";
import type { RequestRecord } from "./record-forms";

function useDraft(request: RequestRecord) {
  const [addresses, setAddresses] = useState(() =>
    [request.origin, request.destination].map((a) => ({
      input: [a.street ?? a.input, a.city, a.postal_code].filter(Boolean).join(", "),
      street: a.street ?? "",
      city: a.city ?? "",
      postal_code: a.postal_code ?? "",
    })),
  );
  const [positions, setPositions] = useState<(google.maps.LatLngLiteral | null)[]>([null, null]);
  const edits = useRef<[number, number]>([0, 0]);
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
            }
          : a,
      ),
    );
    setPositions((values) => values.map((p, i) => (i === index ? null : p)));
  }
  function select(index: number, position: google.maps.LatLngLiteral, address: SelectedLocation) {
    edits.current[index] = (edits.current[index] ?? 0) + 1;
    setAddresses((values) => values.map((a, i) => (i === index ? { ...address, input: address.label } : a)));
    setPositions((values) => values.map((p, i) => (i === index ? position : p)));
  }
  function update(index: number, field: "street" | "city" | "postal_code", value: string) {
    edits.current[index] = (edits.current[index] ?? 0) + 1;
    setAddresses((values) =>
      values.map((a, i) => {
        if (i !== index) return a;
        const next = { ...a, [field]: value };
        return { ...next, input: [next.street, next.city, next.postal_code].filter(Boolean).join(", ") };
      }),
    );
    setPositions((values) => values.map((p, i) => (i === index ? null : p)));
  }
  return { addresses, positions, setPositions, edits, edit, select, update };
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
