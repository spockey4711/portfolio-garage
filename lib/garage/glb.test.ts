import { BoxGeometry, Group, Mesh } from "three";
import { describe, expect, it } from "vitest";
import { displayMesh, hotspotObject, meshesOf } from "./glb";
import { views } from "./hotspots";

// A stand-in for the GLB with the laptop as the export carries it: a group
// with the base and the lid as children (blender/garage-blockout.blend).
function laptopScene() {
  const scene = new Group();
  const laptop = new Group();
  laptop.name = "Laptop";
  const base = new Mesh(new BoxGeometry(0.32, 0.02, 0.22));
  base.name = "Laptop_Basis";
  const lid = new Mesh(new BoxGeometry(0.32, 0.21, 0.005));
  lid.name = "Laptop_Display";
  laptop.add(base, lid);
  scene.add(laptop);
  return { scene, laptop, base, lid };
}

describe("hotspotObject", () => {
  it("finds the laptop group, not just its lid", () => {
    const { scene, laptop } = laptopScene();
    expect(hotspotObject(views.laptop, scene)).toBe(laptop);
  });

  it("names the view and the object when the GLB lacks it", () => {
    expect(() => hotspotObject(views.laptop, new Group())).toThrow(
      "Hotspot laptop: Laptop not in the GLB",
    );
  });
});

describe("meshesOf", () => {
  it("collects the meshes under a group", () => {
    const { laptop, base, lid } = laptopScene();
    expect(meshesOf(laptop)).toEqual([base, lid]);
  });

  it("returns a mesh itself", () => {
    const { lid } = laptopScene();
    expect(meshesOf(lid)).toEqual([lid]);
  });
});

describe("displayMesh", () => {
  it("returns the lid for the laptop screen", () => {
    const { scene, lid } = laptopScene();
    expect(displayMesh(views.laptop, scene)).toBe(lid);
  });

  it("refuses a display that is not a mesh", () => {
    const { scene, laptop } = laptopScene();
    laptop.name = "Laptop_Display";
    expect(() => displayMesh(views.laptop, scene)).toThrow(
      "Screen laptop: Laptop_Display is not a mesh",
    );
  });
});
