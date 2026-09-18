"use client";

import dynamic from "next/dynamic";

// three.js needs a window, so the canvas is loaded on the client only, after
// the page has painted. Until then the hero shows the same dark surface the
// canvas clears to, so nothing flashes when it mounts.
const Garage = dynamic(
  () => import("./Garage").then((module) => module.Garage),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-[#1a1a1a]" />,
  },
);

export function GarageHero() {
  return (
    <section
      aria-label="3D-Garage"
      className="relative h-svh w-full bg-[#1a1a1a]"
    >
      <Garage />
    </section>
  );
}
