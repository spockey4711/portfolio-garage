import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getLegalContent } from "@/content/legal";
import { defaultLocale } from "@/lib/i18n";

const { privacy } = getLegalContent(defaultLocale);

export const metadata: Metadata = {
  title: privacy.title,
  description: privacy.description,
};

export default function Datenschutz() {
  return <LegalPage page={privacy} />;
}
