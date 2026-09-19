import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getLegalContent } from "@/content/legal";
import { defaultLocale } from "@/lib/i18n";

const { imprint } = getLegalContent(defaultLocale);

export const metadata: Metadata = {
  title: imprint.title,
  description: imprint.description,
};

export default function Impressum() {
  return <LegalPage page={imprint} />;
}
