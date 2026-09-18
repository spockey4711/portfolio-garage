// The site is German only, but every string lives behind get<Thing>(locale)
// so a second language is an addition, not a rebuild (docs/adr/0003).
export type Locale = "de";

export const defaultLocale: Locale = "de";
