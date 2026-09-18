import type { ComputerPage } from "@/lib/garage/computer";
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
  /** The line under the hero: what is happening, then what to do (GarageStatus.tsx). */
  readonly status: {
    /** While the canvas is still fetching the model behind the still. */
    readonly loading: string;
    /** Once the scene is ready to be clicked, until the first hotspot opens. */
    readonly hint: string;
  };
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
      /** How to switch pages; announced to assistive tech. */
      readonly keys: string;
      /** Titles of the three data pages (docs/KONZEPT.md §3), in device order. */
      readonly pages: Readonly<Record<ComputerPage, string>>;
      /** Label of the wide field on page 1. */
      readonly latest: string;
      /** Value of that field while the cache holds no visible activity. */
      readonly noActivity: string;
      /** The day of an activity relative to today; older days show the date. */
      readonly day: { readonly today: string; readonly yesterday: string };
      readonly fields: {
        readonly duration: string;
        readonly distance: string;
        readonly heartRate: string;
        readonly load: string;
        readonly elevation: string;
        /** Activities in the week, singular and plural. */
        readonly count: { readonly one: string; readonly other: string };
      };
      readonly units: {
        readonly km: string;
        readonly bpm: string;
        readonly m: string;
      };
      /** German names for Strava's sport types; an unknown type shows as is. */
      readonly sports: Readonly<Record<string, string>>;
      /** Monday first, like the week on the device. */
      readonly weekdays: readonly [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ];
      /** Page 3: the one field about the rider (KONZEPT §3). */
      readonly about: {
        readonly field: string;
        readonly name: string;
        readonly place: string;
        readonly claim: string;
        /** Link text to the 2D page, which is the source of truth. */
        readonly more: string;
      };
      /** Shown in a field whose value is missing or still loading. */
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
  status: {
    loading: "Werkstatt wird geladen",
    hint: "Durch die Werkstatt klicken, um mehr zu erfahren.",
  },
  still: {
    alt: "Blick von vorn in die Garage: ein Rennrad auf dem Montageständer, dahinter die Werkbank mit Laptop, Werkzeugwand, Whiteboard und Pinnwand.",
    comingSoon: "Inhalt folgt in Phase 2.",
  },
  screens: {
    radcomputer: {
      label: "Radcomputer-Display",
      keys: "Pfeiltasten wechseln die Seite",
      pages: { today: "Heute", week: "Woche", about: "Über" },
      latest: "Letzte Einheit",
      noActivity: "Keine Einheit",
      day: { today: "Heute", yesterday: "Gestern" },
      fields: {
        duration: "Zeit",
        distance: "Distanz",
        heartRate: "HF Ø",
        load: "TSS",
        elevation: "Anstieg",
        count: { one: "Einheit", other: "Einheiten" },
      },
      units: { km: "km", bpm: "bpm", m: "m" },
      sports: {
        Ride: "Rad",
        VirtualRide: "Rolle",
        GravelRide: "Gravel",
        MountainBikeRide: "MTB",
        EBikeRide: "E-Bike",
        Run: "Laufen",
        TrailRun: "Trail",
        VirtualRun: "Laufband",
        Walk: "Gehen",
        Hike: "Wandern",
        Swim: "Schwimmen",
        WeightTraining: "Kraft",
        Workout: "Workout",
        Yoga: "Yoga",
      },
      weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      about: {
        field: "Fahrer",
        name: "Yannik",
        place: "Köln",
        claim: "Baut Software für Ausdauersportler.",
        more: "Mehr über mich",
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
