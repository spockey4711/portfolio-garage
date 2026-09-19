import { expect, test } from "@playwright/test";
import { getColophonContent } from "@/content/bauweise";
import { getSiteContent } from "@/content/site";

// The colophon of docs/KONZEPT.md §10: reachable from the footer of every
// page, one labelled section per decision, the repository at the foot.

const colophon = getColophonContent("de");
const site = getSiteContent("de");

test("the footer leads to the colophon, which shows every section", async ({
  page,
}) => {
  await page.goto("/ueber");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: site.footer.colophon.label })
    .click();
  await expect(page).toHaveURL(/\/bauweise$/);
  await expect(
    page.getByRole("heading", { level: 1, name: colophon.title }),
  ).toBeVisible();

  for (const section of colophon.sections) {
    await expect(
      page.getByRole("heading", { level: 2, name: section.title }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: colophon.source.link.label }),
  ).toHaveAttribute("href", colophon.source.link.href);
});
