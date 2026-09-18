import { getGarageContent } from "@/content/garage";
import { defaultLocale } from "@/lib/i18n";

// Placeholder for the Edge UI of docs/KONZEPT.md §3: the layout of page 1
// ("Heute") with empty fields. Phase 2 fills it from the Strava cache and
// adds the other pages and the arrow-key page switch.
export function BikeComputer() {
  const content = getGarageContent(defaultLocale).screens.radcomputer;
  const fields = [
    content.fields.duration,
    content.fields.distance,
    content.fields.heartRate,
    content.fields.load,
  ];

  return (
    <div
      role="img"
      aria-label={content.label}
      className="flex h-full w-full flex-col bg-black font-sans text-white select-none"
    >
      <header className="flex items-center justify-between border-b border-zinc-700 px-4 py-2 text-[18px] text-zinc-400">
        <span>{content.today}</span>
        <span aria-hidden="true" className="flex items-center gap-1">
          <span className="h-[10px] w-[16px] rounded-[2px] border border-zinc-400" />
        </span>
      </header>
      <div className="grid flex-1 grid-cols-2 grid-rows-2">
        {fields.map((label, index) => (
          <div
            key={label}
            className={[
              "flex flex-col justify-between p-4",
              index % 2 === 0 ? "border-r border-zinc-700" : "",
              index < 2 ? "border-b border-zinc-700" : "",
            ].join(" ")}
          >
            <span className="text-[18px] text-zinc-400">{label}</span>
            <span className="text-[56px] leading-none font-semibold text-zinc-500 tabular-nums">
              {content.noData}
            </span>
          </div>
        ))}
      </div>
      <footer
        aria-hidden="true"
        className="flex items-center justify-center gap-2 border-t border-zinc-700 py-3"
      >
        <span className="h-[8px] w-[8px] rounded-full bg-white" />
        <span className="h-[8px] w-[8px] rounded-full bg-zinc-600" />
        <span className="h-[8px] w-[8px] rounded-full bg-zinc-600" />
      </footer>
    </div>
  );
}
