import type { Post } from "./types";

export const warumEineWerkstatt: Post = {
  slug: "warum-eine-werkstatt",
  title: "Warum eine Werkstatt und kein Hero-Bild",
  date: "2026-09-18",
  summary:
    "Die alte Seite war ein handgebauter One-Pager. Die neue ist eine Fahrrad-Werkstatt in 3D. Was gleich geblieben ist, was sich geändert hat und welche Regel verhindert, dass daraus ein Spielzeug wird.",
  body: [
    {
      kind: "p",
      text: "Mein erstes Portfolio habe ich von Hand gebaut, statt einen Baukasten zu nehmen, weil die Seite selbst das erste Projekt sein sollte, das ich zeige. Daran hat sich nichts geändert. Geändert hat sich, was oben steht: statt eines Hero-Bildes eine Garage, in der ein Rennrad auf dem Montageständer hängt, dahinter Werkbank, Werkzeugwand, Whiteboard und Pinnwand.",
    },
    { kind: "h2", text: "Warum ausgerechnet eine Werkstatt" },
    {
      kind: "p",
      text: "Neben dem Studium mache ich viel Sport, und das prägt, wie ich arbeite: ein Plan, saubere Ausführung, Dinge zu Ende bringen. Eine Werkstatt ist der Ort, an dem genau das passiert. Sie ist außerdem ehrlicher als ein Foto von mir vor einer Ziegelwand, weil jedes Möbelstück etwas zeigt, das es wirklich gibt. Der Radcomputer am Lenker rechnet den Verpflegungsplan zu meiner letzten Strava-Einheit, mit fuelivo, meinem größten Projekt. Der Laptop auf der Werkbank listet die Projekte. An der Pinnwand hängen diese Beiträge.",
    },
    { kind: "h2", text: "Die Regel, die alles zusammenhält" },
    {
      kind: "p",
      text: "Eine 3D-Szene als Startseite ist die größte Spielerei, die ich mir bisher erlaubt habe. Damit sie kein Spielzeug wird, gilt eine Regel: Die 2D-Seite ist die Quelle der Wahrheit, die Garage ist nur eine Schicht darüber. Jeder Inhalt existiert auch ohne Canvas, jeder Hotspot führt auf eine normale, schnelle Seite.",
    },
    {
      kind: "ul",
      items: [
        "Der erste Paint ist immer ein Standbild, gerendert mit derselben Kamera und demselben Licht wie die Szene. Das Canvas legt sich erst darüber, wenn der Browser es tragen kann.",
        "Wer Bewegung reduziert hat, ein kleines Display oder eine schwache GPU, bekommt das Standbild mit klickbaren Flächen und sieht denselben Inhalt als Karte.",
        "Die URL ist die Quelle der Wahrheit für den offenen Hotspot. Ein Klick schreibt ?view=, der Zurück-Button des Browsers fährt die Kamera zurück, und jeder Link in die Garage ist teilbar.",
      ],
    },
    {
      kind: "quote",
      text: "Wenn der Inhalt nur im 3D existiert, ist er nicht fertig.",
    },
    { kind: "h2", text: "Was ich mitgenommen habe" },
    {
      kind: "p",
      text: "Vom Vorgänger stammen die Texte als Rohmaterial, die Stimme und ein paar Entscheidungen: erste Person, konkret, Belege statt Behauptungen, nur der einfache Bindestrich. Code und Design habe ich nicht übernommen. Farben, Typografie und Komponenten entstehen aus der Garage heraus, nicht aus dem alten Layout. Das kostet Zeit, aber ein Portfolio, das man sich selbst zusammenstückelt, zeigt genau die Entscheidungen, um die es geht.",
    },
    {
      kind: "p",
      text: "Wie die Szene ohne eine einzige Lichtquelle im Browser beleuchtet ist, steht im nächsten Beitrag.",
    },
  ],
};
