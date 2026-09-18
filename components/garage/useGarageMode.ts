"use client";

import { useEffect, useState } from "react";
import { probeCanvasEnvironment, stillReason } from "@/lib/garage/capability";

/**
 * What the hero shows on top of the still. Undecided on the server and until
 * the first paint, because only the browser knows its motion preference,
 * width and GPU; then still or canvas for the rest of the page's life. It is
 * decided once: swapping the canvas in later would find a store that the
 * still already moved to "focused" without a camera drive.
 */
export type GarageMode = "undecided" | "still" | "canvas";

export function useGarageMode(): GarageMode {
  const [mode, setMode] = useState<GarageMode>("undecided");

  // Probed in a frame callback from an effect: the still has painted before
  // three.js is even requested (KONZEPT §5: the canvas loads after the first
  // paint), and creating the probe's WebGL context never delays that paint.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMode(
        stillReason(probeCanvasEnvironment()) === null ? "canvas" : "still",
      );
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return mode;
}
