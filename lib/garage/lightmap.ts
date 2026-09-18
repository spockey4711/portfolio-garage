import {
  Color,
  Material,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  SRGBColorSpace,
  type Texture,
} from "three";

// Light is baked in Blender (docs/KONZEPT.md §5): the export bakes diffuse
// direct + indirect light without colour into one atlas over the GLB's only
// UV set, and the web multiplies it with the material colour. No real-time
// lights, so the PBR materials from the GLB become unlit ones here.

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

/** Sky the bake used, what shows through the window and behind the gate. */
export const SKY_COLOR = "#bcd3ee";

/** A lightmap as the export wrote it: sRGB, image rows top-down like glTF UVs. */
export function prepareLightmap(texture: Texture, anisotropy: number): Texture {
  texture.flipY = false;
  texture.colorSpace = SRGBColorSpace;
  texture.channel = 0;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

/** Unlit stand-in for a GLB material: its colour and transparency, lit by the atlas. */
export function lightmapMaterial(
  source: Material,
  lightMap: Texture,
): MeshBasicMaterial {
  const material = new MeshBasicMaterial({
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
