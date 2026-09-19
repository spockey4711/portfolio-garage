# ADR-0008: Der Radcomputer zeigt Fuelivo, die Wände tauschen About und Blog

- Status: Akzeptiert
- Datum: 2026-09-19
- Weicht ab von: `docs/KONZEPT.md` §2 (Funktion der Hotspots), §3 (UI-Typ je Hotspot, "Der
  Radcomputer"), §5 (`Laptop.tsx` mit Fuelivo-Mini) und §7 (Phase 2); `docs/PLAN.md` Woche 3
  bis 6

## Kontext

Das Konzept gab dem Radcomputer die letzte Einheit, die laufende Woche und eine Über-Seite,
dem Laptop die Projektliste plus einen Fuelivo-Mini-Rechner, der Pinnwand About und dem
Whiteboard den Blog. Beim Blick auf den fertigen Edge-Screen fiel auf: eine Einheit mit
Dauer, km und Herzfrequenz sagt "ich fahre Rad", nicht "ich baue Software". Der wichtigste
Hotspot der Szene erzählte Nebensache. Gleichzeitig ist die These aus §1 richtig: echte
Trainingsdaten auf dem Radcomputer kann niemand kopieren, und die Strava-Anbindung steht.

Fuelivo, das Leitprojekt, rechnet aus Dauer, Intensität, Sportart und Temperatur einen
Verpflegungsplan und begründet jeden Schritt. Sein Output sind Zahlen pro Stunde, genau das,
was ein Edge-Display anzeigen kann. Ein Showcase im Sinne von Web-App-Screens passt auf
8 x 10 cm nicht, Datenfelder in der Sprache des Geräts schon.

## Entscheidung

- **Der Radcomputer zeigt Fuelivo auf der letzten echten Einheit.** Die Einheit ist die
  Demo-Eingabe, nicht das Thema. Die Über-Seite entfällt. Weitere Seiten pro Projekt, das
  mit Sportdaten arbeitet (GarminDB, trainingbuilder), sind der Erweiterungspfad des
  Computers. Seiten wie am Gerät, Pfeiltasten wechseln:
  1. "Fahrt": die letzte Einheit aus Strava (Dauer, km, Höhenmeter, HF, Temperatur).
  2. "Plan": was Fuelivo für diese Fahrt sagt, g KH/h, ml/h, mg Na/h, Totale.
  3. "Warum": die Begründung, Fuelivos Kernidee, dass jeder Rechenschritt seinen Grund
     mitschreibt. Warnungen stehen hier.
- **Die Rechnung macht fuelivo.de, nicht die Garage.** `POST https://fuelivo.de/calculate`
  ist öffentlich, ohne Login, Schema `CalculationRequest` und `CalculationResponse` aus
  `app/schemas/fueling.py` im Fuelivo-Repo. Ein Port des Matrix-Modells würde beim nächsten
  Modellwechsel lügen. Der Aufruf passiert serverseitig beim Sync einer neuen Aktivität
  (`lib/strava/sync.ts`), das Ergebnis liegt neben der Aktivität im Cache: ein Request pro
  Einheit, nicht pro Besucher, und die Seite bleibt schnell, wenn fuelivo.de langsam ist.
  Der Free-Tarif liefert die Stundenwerte, Timing und Begründung, aber nicht `what_to_fuel`
  (Produkte), Vor- und Nachbereitung. Das reicht für drei Seiten. Ein Pro-Token für den
  Server-Aufruf kann später eine Produkt-Seite freischalten, ist aber kein Muss. Abbildung
  Strava auf `CalculationRequest`:
  - `duration_hours` aus `movingTime`, `sport_type` aus `sport` (Ride und Varianten heißen
    `bike`, Run `running`, Swim `swimming`, alles andere bekommt keinen Plan),
  - `intensity` aus HF relativ zur Maximal-HF, ohne HF aus `relativeEffort` pro Stunde,
  - `temperature_c` aus `average_temp` der Aktivität, fehlt es, bleibt der Default 20,
  - `session_type: "training"`, Rest Default.
- **Der Laptop ist die Projektliste, Fuelivo eingeschlossen.** Wer zuerst auf den Laptop
  klickt, sieht das Leitprojekt oben. Der Fuelivo-Mini-Rechner am Laptop entfällt, der
  Computer ist die Live-Demo, der Laptop die Code-Seite.
- **Pinnwand und Whiteboard tauschen.** Die Pinnwand zeigt den Blog, jeder Post ein
  angepinnter Zettel: diskrete Items, und mit drei Posts sieht Kork noch natürlich aus.
  Startnummern und Fotos bleiben Deko. Das Whiteboard zeigt Über mich: wer, wo, was gerade
  läuft, wohin. Es ist die größte Fläche der Szene in der Raummitte, das gehört dem
  wichtigeren Inhalt, und ein Whiteboard ist zum Denken da, "was ich gerade baue" wirkt
  lebendiger als eine Bio.
- **Die Werkzeugwand ist der Stack**, wie im Konzept, mit einer Schärfung: jedes Werkzeug ist
  ein Tool, das in einem Projekt tatsächlich benutzt wird, der Hover nennt das Projekt. Keine
  Logo-Wand.

## Konsequenzen

- `COMPUTER_PAGES` in `lib/garage/computer.ts` wird `["ride", "plan", "why"]`, die Über-Seite
  fliegt raus. `BikeComputer.tsx` bekommt die Fuelivo-Werte aus `/api/activity`.
- `lib/strava/activity.ts` cached zusätzlich `average_temp`. Die bereits gecachten
  Aktivitäten haben das Feld nicht, ein Sync holt es nach oder der Plan rechnet mit 20 °C.
- Der Fuelivo-Plan ist Teil des Caches, den nur `sync.ts` schreibt (CLAUDE.md, Strava).
  `summary.ts` reicht ihn durch und lässt Privates weiter weg. Der Aufruf nach fuelivo.de
  darf den Sync nicht scheitern lassen: ohne Plan zeigt der Computer nur die Fahrt.
- `lib/fuelivo/model.ts`, `FuelivoMini.tsx` und `content/fuelivo.ts` aus `docs/PLAN.md`
  werden nicht gebaut. Die 2D-Seite `/projekte/fuelivo` zeigt statt eines Mini-Rechners
  denselben Plan zur letzten Fahrt als Karte, damit der Inhalt auch in 2D existiert.
- Die Slugs in `hotspots.ts` folgen dem Inhalt, nicht dem Möbel: Pinnwand `/?view=blog`,
  Whiteboard `/?view=about`. `plan` wäre für Über mich irreführend und ist jetzt der Name
  einer Computerseite. Das Go-live steht aus, es gibt keine Links zu brechen. Die
  Hotspot-Namen in Blender und die Hotspot-IDs ändern sich nicht.
- `StillView.tsx` zeigt ohne Canvas dieselben Inhalte als Karten, die Karte des Computers
  ist der Plan.
- Die Pinnwand aus PR #22 (Startnummern, Fotos, Zettel nach `/ueber`) ist vor dieser
  Entscheidung entstanden. Ihre Mechanik bleibt (Screen auf der Korkfläche, Layout in
  `lib/garage/pinboard.json`, Attrappen im GLB), nur die Zettel werden Blogposts und die
  Startnummern verlieren ihren Link. Der Umbau steht in `docs/PLAN.md`.
