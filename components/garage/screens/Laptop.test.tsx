import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getProjects } from "@/content/projects";
import { defaultLocale } from "@/lib/i18n";
import { Laptop } from "./Laptop";

// The window lists exactly the projects of content/projects/index.ts, in
// that order, and every row is the link to the project's page: the list on
// the laptop and the one on the start page must never drift apart.

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<Laptop />);
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("Laptop", () => {
  it("lists the projects of content/projects in order, each a link to its page", () => {
    const projects = getProjects(defaultLocale);
    const links = Array.from(container.querySelectorAll("li a"));
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      projects.map((project) => `/projekte/${project.slug}`),
    );
    for (const [i, project] of projects.entries()) {
      expect(links[i].textContent).toContain(project.name);
      expect(links[i].textContent).toContain(project.tagline);
    }
  });

  it("tags the first row as the featured project and no other", () => {
    const rows = Array.from(container.querySelectorAll("li"));
    expect(rows[0].textContent).toContain("Leitprojekt");
    for (const row of rows.slice(1)) {
      expect(row.textContent).not.toContain("Leitprojekt");
    }
  });

  it("is a section named after its window title", () => {
    const section = container.querySelector("section")!;
    const heading = container.querySelector("h2")!;
    expect(section.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(heading.textContent).toBe("Projekte");
  });
});
