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
  LIGHTMAP_UV_CHANNEL,
  applyLightmap,
  lightmapMaterial,
  prepareLightmap,
} from "./lightmap";

// A GLB as GLTFLoader hands it over: PBR materials, the wall with a tiling
// texture, one of them transparent glass, one mesh with two material slots.
// Typed as plain Mesh, like the loader's objects, so the swapped materials
// type-check.
function gltfScene() {
  const scene = new Group();
  const brick = new Texture();
  brick.repeat.set(1 / 1.05, 1 / 1.05);
  const wall: Mesh = new Mesh(
    new BoxGeometry(),
    new MeshStandardMaterial({ map: brick, name: "Backstein" }),
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
  return { scene, wall, glass, box, brick };
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

  it("keeps the tiling texture as the loader set it up, with the atlas's anisotropy", () => {
    const { wall, brick } = gltfScene();
    const atlas = prepareLightmap(new Texture(), 16);
    const material = lightmapMaterial(wall.material as Material, atlas);

    expect(material.map).toBe(brick);
    expect(brick.repeat.x).toBeCloseTo(1 / 1.05);
    expect(brick.channel).toBe(0);
    expect(brick.anisotropy).toBe(16);
    expect(material.color.getHexString()).toBe("ffffff");
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
    expect((wall.material as MeshBasicMaterial).name).toBe("Backstein");
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
  it("reads the atlas like glTF UVs expect it, sRGB, top-down, second UV set", () => {
    const texture = prepareLightmap(new Texture(), 8);

    expect(texture.flipY).toBe(false);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.channel).toBe(LIGHTMAP_UV_CHANNEL);
    expect(LIGHTMAP_UV_CHANNEL).toBe(1);
    expect(texture.anisotropy).toBe(8);
  });
});
