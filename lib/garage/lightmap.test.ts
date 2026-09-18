import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Texture,
} from "three";
import { describe, expect, it } from "vitest";
import {
  LIGHTMAP_EXPOSURE_STOPS,
  LIGHTMAP_INTENSITY,
  applyLightmap,
  lightmapMaterial,
  prepareLightmap,
} from "./lightmap";

// A GLB as GLTFLoader hands it over: PBR materials, one of them transparent
// glass, one mesh with two material slots. Typed as plain Mesh, like the
// loader's objects, so the swapped materials type-check.
function gltfScene() {
  const scene = new Group();
  const wall: Mesh = new Mesh(
    new BoxGeometry(),
    new MeshStandardMaterial({ color: "#b7b2aa", name: "Putz" }),
  );
  wall.name = "Wand";
  const glass: Mesh = new Mesh(
    new BoxGeometry(),
    new MeshStandardMaterial({
      color: "#bcdde6",
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  glass.name = "Glas";
  const box: Mesh = new Mesh(new BoxGeometry(), [
    new MeshStandardMaterial({ color: "#c6a06c" }),
    new MeshStandardMaterial({ color: "#3a3835" }),
  ]);
  box.name = "Karton";
  scene.add(wall, glass, box);
  return { scene, wall, glass, box };
}

describe("lightmapMaterial", () => {
  it("keeps colour and transparency, drops the lighting model", () => {
    const { glass } = gltfScene();
    const atlas = new Texture();
    const material = lightmapMaterial(glass.material as Material, atlas);

    expect(material).toBeInstanceOf(MeshBasicMaterial);
    expect(material.color.getHexString()).toBe(
      new Color("#bcdde6").getHexString(),
    );
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBe(0.35);
    expect(material.depthWrite).toBe(false);
    expect(material.side).toBe(DoubleSide);
    expect(material.lightMap).toBe(atlas);
    expect(material.lightMapIntensity).toBe(LIGHTMAP_INTENSITY);
  });

  it("undoes the export's exposure and MeshBasicMaterial's 1/pi", () => {
    expect(LIGHTMAP_INTENSITY).toBeCloseTo(
      Math.PI * 2 ** -LIGHTMAP_EXPOSURE_STOPS,
    );
  });
});

describe("applyLightmap", () => {
  it("swaps every material in the tree, slot by slot", () => {
    const { scene, wall, box } = gltfScene();
    const atlas = new Texture();
    applyLightmap(scene, atlas);

    expect(wall.material).toBeInstanceOf(MeshBasicMaterial);
    expect((wall.material as MeshBasicMaterial).name).toBe("Putz");
    const slots = box.material as MeshBasicMaterial[];
    expect(slots).toHaveLength(2);
    expect(slots.every((m) => m.lightMap === atlas)).toBe(true);
    expect(slots[1].color.getHexString()).toBe(
      new Color("#3a3835").getHexString(),
    );
  });

  it("is idempotent, so a cached scene keeps its materials on remount", () => {
    const { scene, wall, box } = gltfScene();
    const atlas = new Texture();
    applyLightmap(scene, atlas);
    const first = wall.material;
    const firstSlots = box.material;
    applyLightmap(scene, atlas);

    expect(wall.material).toBe(first);
    expect(box.material).toBe(firstSlots);
  });
});

describe("prepareLightmap", () => {
  it("reads the atlas like glTF UVs expect it, sRGB and top-down", () => {
    const texture = prepareLightmap(new Texture(), 8);

    expect(texture.flipY).toBe(false);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.channel).toBe(0);
    expect(texture.anisotropy).toBe(8);
  });
});
