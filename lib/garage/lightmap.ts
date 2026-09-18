import {
  Color,
  Material,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  SRGBColorSpace,
  type Texture,
} from "three";
import generated from "./still.generated.json";

// Light is baked in Blender (docs/KONZEPT.md §5): the export bakes diffuse
// direct + indirect light without colour into one atlas over the GLB's second
// UV set, and the web multiplies it with the material colour or its tiling
// texture (first UV set, world metres). No real-time lights, so the PBR
// materials from the GLB become unlit ones here.

export const LIGHTMAP_URL = "/models/garage-lightmap-tag.webp";

/**
 * The export darkens the bake by this many stops so sunlit surfaces above 1.0
 * survive the 8-bit file; the shader brightens it back. Same value as
 * EXPOSURE_STOPS in .claude/skills/blender-export/export.py.
 */
export const LIGHTMAP_EXPOSURE_STOPS = -1.5;
/**
 * MeshBasicMaterial treats the lightmap as irradiance and multiplies it by
 * 1/π (meshbasic.glsl.js, RECIPROCAL_PI); the atlas already holds outgoing
 * light, so π cancels that and the rest undoes the export's exposure.
 */
export const LIGHTMAP_INTENSITY = Math.PI * 2 ** -LIGHTMAP_EXPOSURE_STOPS;

/**
 * Sky the bake used, what shows behind the gate: the export writes it as the
 * stills show it, so the canvas background and the still cannot drift apart.
 */
export const SKY_COLOR: string = generated.sky;

/** The GLB's UV set the atlas is laid over (TEXCOORD_1); TEXCOORD_0 tiles the textures. */
export const LIGHTMAP_UV_CHANNEL = 1;

/** A lightmap as the export wrote it: sRGB, image rows top-down like glTF UVs. */
export function prepareLightmap(texture: Texture, anisotropy: number): Texture {
  texture.flipY = false;
  texture.colorSpace = SRGBColorSpace;
  texture.channel = LIGHTMAP_UV_CHANNEL;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Unlit stand-in for a GLB material: its colour, its texture and its
 * transparency, lit by the atlas. The texture keeps what GLTFLoader set on it
 * (colour space, repeat from KHR_texture_transform) and takes the atlas's
 * anisotropy, because brick seen along a wall is the grazing case.
 */
export function lightmapMaterial(
  source: Material,
  lightMap: Texture,
): MeshBasicMaterial {
  const map = hasMap(source) ? source.map : null;
  if (map) map.anisotropy = lightMap.anisotropy;
  const material = new MeshBasicMaterial({
    map,
    lightMap,
    lightMapIntensity: LIGHTMAP_INTENSITY,
    transparent: source.transparent,
    opacity: source.opacity,
    side: source.side,
    depthWrite: source.depthWrite,
  });
  if (hasColor(source)) material.color.copy(source.color);
  material.name = source.name;
  return material;
}

function hasLightmap(material: Material, lightMap: Texture): boolean {
  return (
    material instanceof MeshBasicMaterial && material.lightMap === lightMap
  );
}

function hasColor(material: Material): material is Material & { color: Color } {
  return "color" in material && material.color instanceof Color;
}

function hasMap(
  material: Material,
): material is Material & { map: Texture | null } {
  return "map" in material;
}

/**
 * Swaps every mesh material under `root` for its lightmapped stand-in. Safe to
 * call again on the same tree: meshes already carrying the atlas are skipped.
 */
export function applyLightmap(root: Object3D, lightMap: Texture): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials: Material[] = Array.isArray(object.material)
      ? object.material
      : [object.material];
    if (materials.every((material) => hasLightmap(material, lightMap))) return;
    const swapped = materials.map((material) =>
      hasLightmap(material, lightMap)
        ? material
        : lightmapMaterial(material, lightMap),
    );
    object.material = Array.isArray(object.material) ? swapped : swapped[0];
  });
}
