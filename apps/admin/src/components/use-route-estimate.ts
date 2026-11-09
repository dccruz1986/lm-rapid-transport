"use client";
import { useEffect, useRef, useState } from "react";
import { routeEstimator, routeFailure, suggestedMode, type Territory } from "./route-estimate";

export function useRouteEstimate(
  key: string,
  positions: (google.maps.LatLngLiteral | null)[],
  territories: Territory[],
) {
  const mode = suggestedMode(territories);
  const eligible = mode === "PER_MILE" && positions.length === 2 && positions.every(Boolean);
  const estimator = useRef<ReturnType<typeof routeEstimator> | null>(null);
  estimator.current ??= routeEstimator();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    status: "loading" | "ready" | "error";
    miles?: number;
    error?: ReturnType<typeof routeFailure>;
  }>();
  // biome-ignore lint/correctness/useExhaustiveDependencies: key includes ordered positions, identities and revision; locale is deliberately excluded.
  useEffect(() => {
    if (!eligible || !positions[0] || !positions[1]) return;
    let active = true;
    setResult({ key, status: "loading" });
    void estimator.current?.(`${key}:${attempt}`, positions[0], positions[1]).then(
      (miles) => {
        if (active) setResult({ key, status: "ready", miles });
      },
      (error) => {
        if (active) setResult({ key, status: "error", error: routeFailure(error) });
      },
    );
    return () => {
      active = false;
    };
  }, [key, eligible, attempt]);
  // Never expose a prior route during the render before the effect cleanup runs.
  const current = eligible && result?.key === key ? result : undefined;
  return {
    key,
    mode,
    status: eligible ? (current?.status ?? "loading") : "idle",
    miles: current?.miles,
    error: current?.error,
    possiblePerMile: mode === null && territories.includes("OTHER_FL") && !territories.includes("OUTSIDE_FL"),
    retry: () => setAttempt((v) => v + 1),
  };
}
