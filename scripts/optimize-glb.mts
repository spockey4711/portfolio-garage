import { fileURLToPath } from "node:url";
import { type Document, NodeIO } from "@gltf-transform/core";
import {
  EXTMeshoptCompression,
  KHRMeshQuantization,
} from "@gltf-transform/extensions";
import {
  dedup,
  meshopt,
  prune,
  quantize,
  reorder,
  weld,
} from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

// The last step of the blender-export skill: Blender writes the GLB with
// float32 attributes and no compression, this rewrites it in place for the
// web. What the web relies on stays untouched: the object names (the only
// link between a view and its geometry, lib/garage/glb.ts), the node tree
// (Laptop is a group), TEXCOORD_0 (the lightmap UV, lib/garage/lightmap.ts)
// and the world-space bounds of every mesh (click boxes, screen planes).
// Nothing here joins or flattens meshes for that reason.

/** Bits per position coordinate, relative to the mesh's own bounds. */
const POSITION_BITS = 14;
/** The lightmap atlas is 2k; 16 bits keep the islands off their neighbours. */
const TEXCOORD_BITS = 16;

/**
 * Nothing in the web reads normals: every material becomes MeshBasicMaterial
 * with the baked lightmap, and neither raycasts nor the outline need them.
 */
function stripNormals(document: Document): void {
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      primitive.setAttribute("NORMAL", null);
    }
  }
}

export async function optimizeGarage(document: Document): Promise<void> {
  await MeshoptEncoder.ready;
  await document.transform(
    stripNormals,
    dedup(),
    // keepAttributes: without it prune drops TEXCOORD_0 because no material
    // has a texture; the lightmap is applied at runtime, so the UV is needed.
    prune({ keepAttributes: true }),
    weld(),
    quantize({
      quantizePosition: POSITION_BITS,
      quantizeTexcoord: TEXCOORD_BITS,
    }),
    reorder({ encoder: MeshoptEncoder }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  );
}

/** An IO that reads and writes the optimised GLB; the decoder is WASM, so it is awaited. */
export async function garageIO(): Promise<NodeIO> {
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
  return new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({
      "meshopt.encoder": MeshoptEncoder,
      "meshopt.decoder": MeshoptDecoder,
    });
}

async function main(path: string | undefined): Promise<void> {
  if (!path) {
    throw new Error("usage: node scripts/optimize-glb.mts <file.glb>");
  }
  const io = await garageIO();
  const document = await io.read(path);
  await optimizeGarage(document);
  await io.write(path, document);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main(process.argv[2]);
}
