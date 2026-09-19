import type { Post } from "./types";

export const lichtAusDemOfen: Post = {
  slug: "licht-aus-dem-ofen",
  title: "Licht aus dem Ofen: warum in der Garage nichts leuchtet",
  date: "2026-09-19",
  summary:
    "Im Browser gibt es in der Garage keine einzige Lichtquelle. Das Tageslicht kommt fertig gebacken aus Blender, als eine Textur über der ganzen Szene. Warum das die richtige Entscheidung war und was sie kostet.",
  body: [
    {
      kind: "p",
      text: "Die Szene lebt davon, dass Licht durch das halb offene Tor in einen dunklen Kasten fällt: eine sonnige Fassade, ein Raum, der nur vom Streulicht lebt, ein kleines Fenster als zweite Quelle. Das in Echtzeit zu rechnen, mit Schatten und indirektem Licht, würde auf einem Laptop den Lüfter anwerfen und auf einem schwachen Rechner ruckeln. Also rechne ich es genau einmal, in Blender, und der Browser zeigt nur noch das Ergebnis.",
    },
    { kind: "h2", text: "Was gebacken wird" },
    {
      kind: "p",
      text: "Cycles backt das direkte und das indirekte Tageslicht ohne Farbe in eine einzige Textur, eine Lightmap über einem zweiten UV-Satz der gesamten Szene. Im Web bekommt jedes Objekt ein Material ohne Beleuchtung, das diese Lightmap mit seiner eigenen Farbe oder Fototextur multipliziert. Backstein, Asphalt und Holz sind Fotos, alles andere ist Flächenfarbe. Es gibt keine Lichtquelle, keinen Schattenwurf, kein PBR zur Laufzeit. Die Grafikkarte zeichnet Dreiecke mit Texturen, mehr nicht.",
    },
    {
      kind: "ul",
      items: [
        "Die Lightmap ist eine WebP-Datei mit 2048 Pixeln Kantenlänge und etwa 0,3 MB. Die vier Fototexturen wiegen mit 2,45 MB fast das Zehnfache.",
        "Geometrie ist praktisch kostenlos: die Szene hat rund 10.000 Dreiecke, ohne Echtzeitlicht wären 200.000 kein Problem.",
        "Der Export dunkelt die Lightmap um anderthalb Blendenstufen ab, damit die sonnigen Flächen über Weiß in die 8 Bit der Datei passen. Der Shader hellt sie um denselben Wert wieder auf.",
      ],
    },
    { kind: "h2", text: "Der Teil, der mich am meisten Zeit gekostet hat" },
    {
      kind: "p",
      text: "Das Bild im Browser sollte exakt so aussehen wie das Render in Blender, sonst stimmen Standbild und Szene nicht überein. Die Falle ist das Tonemapping: jeder gängige Tone Mapper biegt die Mitteltöne oder drückt die Schatten, und der Raum lebt in den Schatten. Also umgeht der Composer das Tonemapping des Renderers komplett. Nur was über Weiß liegen würde, das Tor in der Sonne, wird oberhalb einer Kniestelle von 0,8 weich komprimiert. Darunter bleibt jeder Pixel das, was Cycles gerechnet hat. Das habe ich nicht angenommen, sondern gemessen.",
    },
    {
      kind: "quote",
      text: "Belichtung der Datei und Intensität im Shader sind eine Zahl an zwei Orten. Wer eine ändert, ändert beide.",
    },
    { kind: "h2", text: "Was es kostet" },
    {
      kind: "p",
      text: "Nichts bewegt sich. Ein Licht anders zu setzen heißt: Export-Skript ändern, neu backen, neu exportieren, Standbilder neu rendern. Das dauert Minuten statt Millisekunden. Dafür läuft die Szene mit 60 Bildern pro Sekunde auf jedem Laptop, und sie sieht auf jedem Gerät gleich aus, weil nichts von der GPU abhängt außer dem Zeichnen selbst.",
    },
    {
      kind: "p",
      text: "Tag und Nacht kommen trotzdem: als zweite Lightmap, die nach der echten Kölner Uhrzeit mit der ersten überblendet wird. Dann geht die Werkbankleuchte an. Auch das ist gebacken, nur eben zweimal.",
    },
  ],
};
