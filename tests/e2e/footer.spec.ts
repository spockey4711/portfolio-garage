import { expect, test } from "@playwright/test";
import { getSiteContent } from "@/content/site";
import { REPOSITORY_URL } from "@/lib/build/info";

// The transparency row of docs/KONZEPT.md §10: the commit this build is,
// as a link to GitHub, on every page. The JS figure exists only in a
// production build (lib/build/read.ts); this suite runs against next dev,
// where the row shows the commit alone rather than a stale or made-up size.

const site = getSiteContent("de");

for (const path of ["/", "/bauweise"]) {
  test(`the footer of ${path} names the commit it was built from`, async ({
    page,
  }) => {
    await page.goto(path);
    const stats = page.getByRole("contentinfo").locator("dl");
    await expect(stats).toHaveAttribute("aria-label", site.footer.stats.label);
    await expect(stats.locator("dt")).toHaveText([site.footer.stats.commit]);

    const commit = stats.getByRole("link");
    await expect(commit).toHaveText(/^[0-9a-f]{7}$/);
    const short = await commit.textContent();
    await expect(commit).toHaveAttribute(
      "href",
      new RegExp(`^${REPOSITORY_URL}/commit/${short}[0-9a-f]{33}$`),
    );
  });
}
