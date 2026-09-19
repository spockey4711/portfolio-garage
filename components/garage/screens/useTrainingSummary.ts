"use client";

import { useEffect, useState } from "react";
import type { TrainingSummary } from "@/lib/strava/summary";

// The training data behind the bike computer, from /api/activity (the cache
// on the server, nothing private). Null until it arrives and when the request
// fails: the screen then keeps its empty fields, a device without a sensor
// does the same. One request per mount; the route's max-age lets the browser
// answer a remount from its cache.
export function useTrainingSummary(): TrainingSummary | null {
  const [summary, setSummary] = useState<TrainingSummary | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/activity", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`/api/activity ${response.status}`);
        return response.json() as Promise<TrainingSummary>;
      })
      .then(setSummary)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn("Bike computer stays empty:", error);
      });
    return () => controller.abort();
  }, []);

  return summary;
}
