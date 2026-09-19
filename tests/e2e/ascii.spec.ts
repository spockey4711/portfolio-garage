import { expect, test } from "@playwright/test";

// "curl yannikwuenker.de" (docs/KONZEPT.md §10): the start page answers a
// terminal client with the text card and everyone else with HTML. Through
// the real server, so the proxy, the rewrite and the route handler are all
// on the path; the card itself is checked in lib/terminal/card.test.ts.

test("curl gets the text card on the start page", async ({ request }) => {
  const response = await request.get("/", {
    headers: { "user-agent": "curl/8.7.1", accept: "*/*" },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("text/plain; charset=utf-8");
  const text = await response.text();
  expect(text).toContain("Yannik Wünker");
  expect(text).toContain("/projekte/fuelivo");
  expect(text).not.toContain("<html");
});

test("curl asking for HTML and a browser get the page", async ({ request }) => {
  for (const headers of [
    { "user-agent": "curl/8.7.1", accept: "text/html" },
    { "user-agent": "Mozilla/5.0", accept: "text/html,*/*;q=0.8" },
  ]) {
    const response = await request.get("/", { headers });
    expect(response.headers()["content-type"], headers.accept).toContain(
      "text/html",
    );
  }
});

test("the deep pages stay HTML for curl", async ({ request }) => {
  const response = await request.get("/ueber", {
    headers: { "user-agent": "curl/8.7.1", accept: "*/*" },
  });
  expect(response.headers()["content-type"]).toContain("text/html");
});
