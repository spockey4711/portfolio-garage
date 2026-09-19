import type { FocusViewId } from "@/lib/garage/hotspots";
import type { PinboardItemId } from "@/lib/garage/pinboard";
import type { Locale } from "@/lib/i18n";
import { getAboutContent } from "./about";

/** What is printed on one item of the cork board and where a click on it leads. */
export type PinboardItemContent = { readonly href: string } & (
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
  | {
      readonly kind: "zettel";
      readonly title: string;
      readonly lines: readonly string[];
    }
);

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
    readonly pinnwand: {
      /** Accessible name of the board. */
      readonly label: string;
      /** Read out before the items: where they all lead. */
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
    pinnwand: {
      label: "Pinnwand",
      hint: "Alles an der Pinnwand führt zur Seite Über mich.",
      items: {
        "startnummer-1": {
          kind: "startnummer",
          event: "Radmarathon",
          number: "1247",
          href: "/ueber",
        },
        "foto-1": {
          kind: "foto",
          caption: "Ausfahrt",
          href: "/ueber",
        },
        "zettel-1": {
          kind: "zettel",
          title: "Über mich",
          lines: [
            "Wirtschaftsinformatik",
            "Universität zu Köln",
            "Werkstudent am IW",
            "baut fuelivo",
          ],
          href: "/ueber#werdegang",
        },
        "zettel-2": {
          kind: "zettel",
          title: "Kontakt",
          lines: [getAboutContent("de").contact.email],
          href: "/ueber#kontakt",
        },
        "foto-2": {
          kind: "foto",
          caption: "Hockey",
          href: "/ueber",
        },
        "startnummer-2": {
          kind: "startnummer",
          event: "Halbmarathon",
          number: "2306",
          href: "/ueber",
        },
      },
    },
  },
};

const content: Readonly<Record<Locale, GarageContent>> = { de };

export function getGarageContent(locale: Locale): GarageContent {
  return content[locale];
}
