import { SiteHeader } from "@/components/site/SiteHeader";

// The deep pages (/projekte/<slug>, /ueber): plain 2D, header at the top,
// the same column as the start page below its hero.
export default function SeitenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pb-24">{children}</main>
    </>
  );
}
