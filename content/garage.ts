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
  /** The static fallback (KONZEPT §5): the rendered rest view and its 2D stand-in for an open hotspot. */
  readonly still: {
    /** Alt text of the rendered rest view. */
    readonly alt: string;
    /** Body of the stand-in for a hotspot that has no 2D content yet. */
    readonly comingSoon: string;
  };
  readonly screens: {
    readonly radcomputer: {
      /** Accessible name of the device screen. */
      readonly label: string;
      /** Title of the first data page. */
      readonly today: string;
      readonly fields: {
        readonly duration: string;
        readonly distance: string;
        readonly heartRate: string;
        readonly load: string;
      };
      /** Shown in every field until real data arrives (Phase 2). */
      readonly noData: string;
    };
    readonly laptop: {
      readonly label: string;
      /** Title of the window on the laptop. */
      readonly projects: string;
      /** Placeholder line until the project list arrives (Phase 2). */
      readonly comingSoon: string;
    };
  };
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
  still: {
    alt: "Blick von vorn in die Garage: ein Rennrad auf dem Montageständer, dahinter die Werkbank mit Laptop, Werkzeugwand, Whiteboard und Pinnwand.",
    comingSoon: "Inhalt folgt in Phase 2.",
  },
  screens: {
    radcomputer: {
      label: "Radcomputer-Display",
      today: "Heute",
      fields: {
        duration: "Dauer",
        distance: "Distanz",
        heartRate: "HF Ø",
        load: "TSS",
      },
      noData: "--",
    },
    laptop: {
      label: "Laptop-Display",
      projects: "Projekte",
      comingSoon: "Projektliste folgt in Phase 2.",
    },
  },
};

const content: Readonly<Record<Locale, GarageContent>> = { de };

export function getGarageContent(locale: Locale): GarageContent {
  return content[locale];
}
