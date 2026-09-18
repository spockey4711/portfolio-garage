import { getGarageContent } from "@/content/garage";
import { defaultLocale } from "@/lib/i18n";

// Placeholder for the laptop of docs/KONZEPT.md §3: a desktop with one
// window. Phase 2 puts the project list and the Fuelivo mini in here.
export function Laptop() {
  const content = getGarageContent(defaultLocale).screens.laptop;

  return (
    <div
      role="img"
      aria-label={content.label}
      className="flex h-full w-full flex-col bg-zinc-800 p-8 font-sans text-zinc-100 select-none"
    >
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-zinc-900 shadow-2xl">
        <header className="flex items-center gap-2 border-b border-zinc-700 px-4 py-3">
          <span aria-hidden="true" className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
          </span>
          <span className="ml-2 text-[20px] font-medium">
            {content.projects}
          </span>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <p className="text-[20px] text-zinc-400">{content.comingSoon}</p>
          <ul aria-hidden="true" className="flex flex-col gap-3">
            {[0.7, 0.55, 0.6].map((width) => (
              <li
                key={width}
                className="h-[28px] rounded bg-zinc-800"
                style={{ width: `${width * 100}%` }}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
