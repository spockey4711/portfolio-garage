import { GarageHero } from "@/components/garage/GarageHero";

// Start page: the garage as hero, the 2D content below it. The 2D page is the
// source of truth, the garage only links into it (docs/KONZEPT.md §5).
export default function Home() {
  return (
    <>
      <GarageHero />
      <main className="mx-auto w-full max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-semibold tracking-tight">Yannik Wünker</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Baut Software für Ausdauersportler. Köln.
        </p>
        <p className="mt-12 text-sm text-zinc-500">
          Platzhalter: Projekte, Über und Blog folgen als 2D-Seiten.
        </p>
      </main>
    </>
  );
}
