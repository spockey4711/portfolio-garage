import { Document, getBounds } from "@gltf-transform/core";
import { describe, expect, it } from "vitest";
import { garageIO, optimizeGarage } from "./optimize-glb.mjs";

// A stand-in for the export: the laptop as a group with its lid, the lid
// a box with the three attributes Blender writes, placed off the origin so
// that a lost node transform would show up in the bounds.
function laptopDocument(): Document {
  const document = new Document();
  const buffer = document.createBuffer();
  const [w, h, d] = [0.32, 0.21, 0.005];
  const corners: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  for (const x of [-w / 2, w / 2]) {
    for (const y of [-h / 2, h / 2]) {
      for (const z of [-d / 2, d / 2]) {
        corners.push(x, y, z);
        normals.push(0, 0, 1);
        uvs.push((x + w / 2) / w, (y + h / 2) / h);
      }
    }
  }
  const attribute = (type: "VEC2" | "VEC3", array: number[]) =>
    document
      .createAccessor()
      .setType(type)
      .setArray(new Float32Array(array))
      .setBuffer(buffer);
  const primitive = document
    .createPrimitive()
    .setAttribute("POSITION", attribute("VEC3", corners))
    .setAttribute("NORMAL", attribute("VEC3", normals))
    .setAttribute("TEXCOORD_0", attribute("VEC2", uvs))
    .setIndices(
      document
        .createAccessor()
        .setType("SCALAR")
        .setArray(new Uint16Array([0, 1, 3, 0, 3, 2, 4, 6, 7, 4, 7, 5]))
        .setBuffer(buffer),
    )
    .setMaterial(document.createMaterial("Display"));
  const lid = document
    .createNode("Laptop_Display")
    .setMesh(document.createMesh("Laptop_Display").addPrimitive(primitive))
    .setTranslation([0, 0.113, -0.128]);
  const laptop = document
    .createNode("Laptop")
    .setTranslation([-1.8, 0.9, -1.5])
    .addChild(lid);
  document.createScene().addChild(laptop);
  return document;
}

async function roundTrip(document: Document): Promise<Document> {
  const io = await garageIO();
  return io.readBinary(await io.writeBinary(document));
}

describe("optimizeGarage", () => {
  it("keeps the names, the node tree and the lightmap UV, drops the normals", async () => {
    const document = laptopDocument();
    await optimizeGarage(document);
    const root = (await roundTrip(document)).getRoot();

    const laptop = root.listNodes().find((n) => n.getName() === "Laptop");
    const lid = laptop
      ?.listChildren()
      .find((n) => n.getName() === "Laptop_Display");
    expect(lid).toBeDefined();
    const primitive = lid!.getMesh()!.listPrimitives()[0];
    expect(primitive.getAttribute("NORMAL")).toBeNull();
    expect(primitive.getAttribute("TEXCOORD_0")).not.toBeNull();
    expect(primitive.getAttribute("POSITION")!.getCount()).toBe(8);
  });

  it("compresses with meshopt and quantisation", async () => {
    const document = laptopDocument();
    await optimizeGarage(document);
    const extensions = document
      .getRoot()
      .listExtensionsUsed()
      .map((e) => e.extensionName);
    expect(extensions).toContain("EXT_meshopt_compression");
    expect(extensions).toContain("KHR_mesh_quantization");
  });

  it("leaves the world bounds where Blender put them", async () => {
    const document = laptopDocument();
    const before = getBounds(document.getRoot().listScenes()[0]);
    await optimizeGarage(document);
    const after = getBounds(
      (await roundTrip(document)).getRoot().listScenes()[0],
    );
    for (const axis of [0, 1, 2] as const) {
      expect(after.min[axis]).toBeCloseTo(before.min[axis], 3);
      expect(after.max[axis]).toBeCloseTo(before.max[axis], 3);
    }
  });
});
