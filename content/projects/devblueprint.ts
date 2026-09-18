import type { Project } from "./types";

export const devblueprint: Project = {
  slug: "devblueprint",
  name: "DevBlueprint",
  tagline:
    "Engineering-Setup für neue Projekte: Git-Workflow, Quality Gate und KI-Leitplanken ab Commit eins, ohne Lock-in.",
  status: "live",
  kind: "cli",
  year: 2026,
  problem:
    "Jedes neue Projekt fängt ohne Prozess an, gerade solo: Branch-Workflow, Quality Gate und Konventionen werden jedes Mal neu erfunden oder weggelassen. Mit mehreren parallelen KI-Sessions kommt dazu, dass sich die Chats gegenseitig den Branch wegziehen. Fertige Frameworks und Template-Repos lösen das nur gegen dauerhafte Bindung.",
  approach: {
    intro:
      "DevBlueprint trennt einen stack-agnostischen Kern von dünnen Stack-Overlays. core/ hält Git-Workflow, Standards, Konventionen und die CLAUDE.md-Vorlagen, neun Varianten ergänzen nur Gate-Befehle, CI und Setup für den jeweiligen Stack. Eine Bash-CLI scaffoldet, prüft und aktualisiert. Die Ausgabe sind reine Dateien im Zielprojekt: DevBlueprint danach löschen, und nichts bricht.",
    points: [
      "Zwei Branches und ein Worktree pro Task über ein einziges wt-Skript, damit parallele KI-Sessions nie denselben Branch anfassen.",
      "Quality Gate aus lint, typecheck, test und build, lokal im Pre-commit und in GitHub Actions erzwungen.",
      "init überschreibt ohne --force keine Datei und lässt sich auf ein bestehendes Repo anwenden; update zieht nur die Kern-Dateien nach und fasst CLAUDE.md, CI und Code nie an.",
      "Von einem Agenten bedienbar: --json-Ausgabe, plan als Dry-Run von init über dieselbe Code-Bahn, und ein Setup-Skill, der erst nach Bestätigung schreibt.",
    ],
  },
  result:
    "Neun Stack-Varianten von Next.js über Swift und Kotlin bis Go und Rust, sieben CLI-Befehle, rund 1.500 Zeilen Shell mit 13 bats-Test-Dateien. Aus einem echten Produktiv-Codebase extrahiert und auf sich selbst angewendet.",
  stack: ["Bash", "bats", "GitHub Actions", "Markdown"],
  learnings: [
    "Ein wiederverwendbares Setup darf kein Framework sein. Reine Dateien und kein Runtime schlagen jedes Template-Repo, weil das Projekt Eigentümer bleibt.",
    "Damit ein Agent ein Werkzeug bedienen kann, braucht es maschinenlesbaren Zustand und einen Dry-Run. Erst dann kann er vor dem Schreiben verlässlich bestätigen.",
    "Das eigene Setup auf sich selbst anzuwenden hat die Lücken am schnellsten gezeigt.",
  ],
  links: [
    { kind: "repo", href: "https://github.com/spockey4711/DevBlueprint" },
  ],
};
