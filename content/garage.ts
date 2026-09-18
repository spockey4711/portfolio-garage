import type { FocusViewId } from "@/lib/garage/hotspots";
import type { Locale } from "@/lib/i18n";

export interface GarageContent {
  /** Accessible name of the hero section that holds the canvas. */
  readonly heroLabel: string;
  /** Hover label and link text per hotspot. */
  readonly hotspots: Readonly<Record<FocusViewId, { readonly label: string }>>;
  /** Accessible name of the hotspot link list. */
  readonly navLabel: string;
  /** The button that leaves a focused hotspot. */
  readonly back: string;
}

const de: GarageContent = {
  heroLabel: "3D-Garage",
  hotspots: {
    radcomputer: { label: "Radcomputer" },
    laptop: { label: "Laptop" },
    pinnwand: { label: "Pinnwand" },
    whiteboard: { label: "Whiteboard" },
    werkzeugwand: { label: "Werkzeugwand" },
  },
  navLabel: "Hotspots der Garage",
  back: "Zurück",
};

const content: Readonly<Record<Locale, GarageContent>> = { de };

export function getGarageContent(locale: Locale): GarageContent {
  return content[locale];
}
