import type { Intensity, NoPlanReason } from "@/lib/fuelivo/request";
import type { ComputerPage } from "@/lib/garage/computer";
import type { FocusViewId } from "@/lib/garage/hotspots";
import type { PinboardItemId } from "@/lib/garage/pinboard";
import type { Locale } from "@/lib/i18n";
import { getSiteContent } from "./site";

/**
 * What is printed on one item of the cork board. A note has no content here:
 * it prints the blog post lib/garage/pinboard.json names for it (content/blog).
 */
export type PinboardItemContent =
  | {
      readonly kind: "startnummer";
      readonly event: string;
      readonly number: string;
    }
  | {
      readonly kind: "foto";
      /** Written under the print; also the image's alt text. */
      readonly caption: string;
      /** Path under public/; without one the print shows a drawn stand-in. */
      readonly src?: string;
    }
  | { readonly kind: "zettel" };

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
      /** Titles of the three data pages (docs/adr/0008), in device order. */
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
        readonly elevation: string;
        readonly heartRate: string;
        readonly temperature: string;
        /** Strava's relative effort. */
        readonly effort: string;
        readonly carbs: string;
        readonly fluid: string;
        readonly sodium: string;
      };
      readonly units: {
        readonly km: string;
        readonly m: string;
        readonly bpm: string;
        readonly celsius: string;
        readonly hours: string;
        readonly g: string;
        readonly ml: string;
        readonly mg: string;
        /** Suffix that turns a unit into a rate, "g" to "g/h". */
        readonly perHour: string;
      };
      /** German names for Strava's sport types; an unknown type shows as is. */
      readonly sports: Readonly<Record<string, string>>;
      /** Monday first, for the date on page 1. */
      readonly weekdays: readonly [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ];
      /** Page 2: the plan fuelivo.de calculated for the ride on page 1. */
      readonly plan: {
        /** Label of the wide field that names the input. */
        readonly field: string;
        /** The intensity the plan was calculated with, as the input line says it. */
        readonly intensity: Readonly<Record<Intensity, string>>;
        /** Left column: per hour. Right column: for the whole ride. */
        readonly perHour: string;
        readonly total: string;
        /** Link text to the project page, which is the source of truth. */
        readonly more: string;
      };
      /** Page 3: Fuelivo's rationale and warnings. */
      readonly why: {
        readonly rationale: string;
        readonly warnings: string;
      };
      /** Why page 2 and 3 are empty: no plan for this activity, or none yet. */
      readonly noPlan: Readonly<Record<NoPlanReason | "pending", string>>;
      /** Shown in a field whose value is missing or still loading. */
      readonly noData: string;
    };
    /** The project list of docs/adr/0008: one window, the projects of content/projects. */
    readonly laptop: {
      /** Title of the window, also the heading of the list. */
      readonly title: string;
      /** One line above the list: what it is and what a click does. */
      readonly intro: string;
      /** Tag on the first row, the featured project of content/projects/index.ts. */
      readonly featured: string;
    };
    readonly pinnwand: {
      /** Accessible name of the board. */
      readonly label: string;
      /** Read out before the notes: what they are and where they lead. */
      readonly hint: string;
      /** One entry per item of lib/garage/pinboard.json, same kind as there. */
      readonly items: Readonly<Record<PinboardItemId, PinboardItemContent>>;
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
      pages: { ride: "Fahrt", plan: "Plan", why: "Warum" },
      latest: "Letzte Einheit",
      noActivity: "Keine Einheit",
      day: { today: "Heute", yesterday: "Gestern" },
      fields: {
        duration: "Zeit",
        distance: "Distanz",
        elevation: "Anstieg",
        heartRate: "HF Ø",
        temperature: "Temp.",
        effort: "Belastung",
        carbs: "KH",
        fluid: "Flüssigkeit",
        sodium: "Natrium",
      },
      units: {
        km: "km",
        m: "m",
        bpm: "bpm",
        celsius: "°C",
        hours: "h",
        g: "g",
        ml: "ml",
        mg: "mg",
        perHour: "/h",
      },
      sports: getSiteContent("de").project.plan.sports,
      weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      plan: {
        field: "Plan von fuelivo",
        intensity: getSiteContent("de").project.plan.intensity,
        perHour: "pro Stunde",
        total: "gesamt",
        more: "Mehr zu fuelivo",
      },
      why: {
        rationale: "Begründung",
        warnings: "Warnungen",
      },
      noPlan: {
        sport: "Kein Plan für diese Sportart",
        duration: "Kein Plan unter 30 Minuten",
        pending: "Plan folgt nach dem nächsten Sync",
      },
      noData: "--",
    },
    laptop: {
      title: "Projekte",
      intro: "Was ich gebaut habe. Jede Zeile führt zur Projektseite.",
      featured: "Leitprojekt",
    },
    pinnwand: {
      label: "Pinnwand",
      hint: "Die Zettel sind Blogbeiträge, jeder führt zum Beitrag.",
      items: {
        "startnummer-1": {
          kind: "startnummer",
          event: "Radmarathon",
          number: "1247",
        },
        "foto-1": {
          kind: "foto",
          caption: "Ausfahrt",
        },
        "zettel-1": { kind: "zettel" },
        "zettel-2": { kind: "zettel" },
        "foto-2": {
          kind: "foto",
          caption: "Hockey",
        },
        "startnummer-2": {
          kind: "startnummer",
          event: "Halbmarathon",
          number: "2306",
        },
      },
    },
  },
};

const content: Readonly<Record<Locale, GarageContent>> = { de };

export function getGarageContent(locale: Locale): GarageContent {
  return content[locale];
}
