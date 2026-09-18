"""Headless build of blender/garage-blockout.blend, run by export.sh.

Writes, relative to <out> (the first argument after "--"):
  public/models/garage.glb              collection "Blockout", object names kept, modifiers
                                        applied, one UV set "Lightmap"
  public/models/garage-lightmap-tag.webp daylight baked with Cycles into that UV set: diffuse
                                        direct + indirect light without colour, so the web
                                        multiplies it with the material colour (KONZEPT §5)
  lib/garage/hotspots.generated.json    Cam_*/Ziel_* empties of collection "Hotspots",
                                        Blender Z-up converted to three.js Y-up

"--skip-bake" as second argument leaves the lightmap file alone. The UV layout is
recomputed either way, so the old lightmap only fits if no geometry changed.

The .blend is never saved: everything here happens in the session and is thrown away.
"""

import json
import os
import sys
import time
from math import radians

import bmesh
import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1 :]
out_root = args[0]
skip_bake = "--skip-bake" in args[1:]
glb_path = os.path.join(out_root, "public", "models", "garage.glb")
lightmap_path = os.path.join(out_root, "public", "models", "garage-lightmap-tag.webp")
hotspots_path = os.path.join(out_root, "lib", "garage", "hotspots.generated.json")

LIGHTMAP_SIZE = 2048
BAKE_SAMPLES = 128
LIGHTMAP_QUALITY = 90  # lossy WebP: 0.5 MB instead of 3.5 MB as PNG, no visible difference
# Sunlit surfaces exceed 1.0; the PNG stores the bake darkened by this many stops and
# lib/garage/lightmap.ts (LIGHTMAP_EXPOSURE_STOPS) brightens it back in the shader.
EXPOSURE_STOPS = -1.5
# A camera closer than this to a face's plane keeps the face, so parallax and small
# camera moves never uncover a hole (CameraRig lerps positions, so the endpoints suffice).
CULL_MARGIN = 0.5

t_start = time.time()
scene = bpy.context.scene
view_layer = bpy.context.view_layer


def to_yup(v):
    """Blender (x, y, z) -> three.js (x, z, -y), the same axis swap the glTF exporter applies."""
    return [round(v.x, 3) + 0.0, round(v.z, 3) + 0.0, round(-v.y, 3) + 0.0]


def select_only(objects, active=None):
    for o in bpy.data.objects:
        o.select_set(False)
    for o in objects:
        o.select_set(True)
    view_layer.objects.active = active or objects[0]


def is_opaque(obj):
    return all(m is not None and m.surface_render_method != "BLENDED" for m in obj.data.materials)


# ---------------------------------------------------------------- hotspots
hotspots = {}
for obj in bpy.data.collections["Hotspots"].objects:
    prefix, _, view = obj.name.partition("_")
    key = {"Cam": "camera", "Ziel": "target"}.get(prefix)
    if key is None:
        sys.exit(f"ERROR unexpected object in Hotspots: {obj.name} (expected Cam_* or Ziel_*)")
    hotspots.setdefault(view.lower(), {})[key] = to_yup(obj.matrix_world.translation)

incomplete = sorted(v for v, d in hotspots.items() if set(d) != {"camera", "target"})
if incomplete:
    sys.exit(f"ERROR views without a Cam_/Ziel_ pair: {incomplete}")

camera_positions = [
    o.matrix_world.translation.copy() for o in bpy.data.collections["Hotspots"].objects if o.name.startswith("Cam_")
]

# ---------------------------------------------------------------- meshes
meshes = [o for o in bpy.data.collections["Blockout"].all_objects if o.type == "MESH"]
for o in meshes:
    o.hide_set(False)
    o.hide_viewport = False
select_only(meshes)
bpy.ops.object.convert(target="MESH")  # applies the bevel modifiers, as export_apply would

# Faces no camera can ever see from the front are dead weight: walls' outsides, the
# ceiling's top, undersides of tables. Dropping them halves the atlas the shell needs.
# Transparent objects keep everything, their back faces show through the front.
# The dead faces still have to block light during the bake: without them the walls
# are open shells, and where an inner face runs into the next wall's volume (the
# room corners, the ceiling over the wall tops) its texels look straight out into
# the sky and bleed a bright seam into the corner. So they move into one blocker
# object per mesh that renders but is never baked or exported.
blockers = []
culled = 0
for o in meshes:
    if is_opaque(o):
        normal_matrix = o.matrix_world.to_3x3().inverted().transposed()
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bm.faces.ensure_lookup_table()
        dead = []
        for f in bm.faces:
            n = (normal_matrix @ f.normal).normalized()
            p = o.matrix_world @ f.calc_center_median()
            if all(n.dot(c - p) < -CULL_MARGIN for c in camera_positions):
                dead.append(f)
        if dead:
            culled += len(dead)
            dead_index = {f.index for f in dead}
            blocker_bm = bm.copy()
            blocker_bm.faces.ensure_lookup_table()
            live = [f for f in blocker_bm.faces if f.index not in dead_index]
            bmesh.ops.delete(blocker_bm, geom=live, context="FACES")
            blocker_me = bpy.data.meshes.new(f"{o.name}.Cull")
            for mat in o.data.materials:
                blocker_me.materials.append(mat)
            blocker_bm.to_mesh(blocker_me)
            blocker_bm.free()
            blocker = bpy.data.objects.new(blocker_me.name, blocker_me)
            blocker.matrix_world = o.matrix_world.copy()
            scene.collection.objects.link(blocker)
            blockers.append(blocker)
            bmesh.ops.delete(bm, geom=dead, context="FACES")
            bm.to_mesh(o.data)
        bm.free()
    # exactly one UV set, the same on every object, so the bake proxy below has one too
    while o.data.uv_layers:
        o.data.uv_layers.remove(o.data.uv_layers[0])
    o.data.uv_layers.new(name="Lightmap")

faces = sum(len(o.data.polygons) for o in meshes)

# One atlas for the whole collection: in multi-object edit mode smart project packs the
# islands of all objects into one UV space, texel density by 3D area. The margin scales
# with island size: walls and floor get a clear gap against bleeding, the hundreds of
# tiny bike tubes get almost none, which is fine because they are all dark. A fixed
# margin per island (pack_islands, FRACTION) would waste half the atlas on the bike.
select_only(meshes)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(
    angle_limit=radians(66), island_margin=0.0015, margin_method="SCALED", correct_aspect=True, scale_to_bounds=False
)
bpy.ops.object.mode_set(mode="OBJECT")

# Single-sided like three.js renders them; the culling above assumed it. Glass keeps both.
for mat in bpy.data.materials:
    mat.use_backface_culling = mat.surface_render_method != "BLENDED"

# ---------------------------------------------------------------- lightmap
if not skip_bake:
    # Daylight rig "Tag": sky through the gate and the window, sun from the front left
    # (docs/KONZEPT.md §2 "Dach und Tor"). The night rig comes in phase 3.
    world = bpy.data.worlds.new("Bake_Tag")
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.5, 0.65, 0.85, 1.0)
    background.inputs["Strength"].default_value = 1.0
    scene.world = world
    sun_data = bpy.data.lights.new("Sonne", "SUN")
    sun_data.energy = 3.0
    sun_data.angle = radians(3)
    sun = bpy.data.objects.new("Sonne", sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = (radians(50), 0.0, radians(-30))

    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.samples = BAKE_SAMPLES
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 6
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = EXPOSURE_STOPS
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.quality = LIGHTMAP_QUALITY

    # The bake writes into the active image node of every material. Metallic would
    # swallow the diffuse pass, and the web material has no metalness anyway.
    image = bpy.data.images.new("Lightmap", LIGHTMAP_SIZE, LIGHTMAP_SIZE, float_buffer=True)
    albedo = bpy.data.images.new("Lightmap_Albedo", LIGHTMAP_SIZE, LIGHTMAP_SIZE, float_buffer=True)
    normal = bpy.data.images.new("Lightmap_Normal", LIGHTMAP_SIZE, LIGHTMAP_SIZE, float_buffer=True)
    normal.colorspace_settings.name = "Non-Color"
    target_nodes = []
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf is not None:
            bsdf.inputs["Metallic"].default_value = 0.0
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = image
        mat.node_tree.nodes.active = node
        target_nodes.append(node)

    # Cycles bakes one object per pass; a joined copy of everything is one pass instead
    # of fifty. Duplicates share the UVs and materials, so the atlas comes out the same.
    # The originals must leave the render meanwhile: coincident faces would shadow the
    # proxy's surface points and bake half the scene black.
    select_only(meshes)
    bpy.ops.object.duplicate()
    bpy.ops.object.join()
    proxy = view_layer.objects.active
    proxy.name = "Bake_Proxy"
    for o in meshes:
        o.hide_render = True
    select_only([proxy])
    t_bake = time.time()
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=8, use_clear=True)
    # Albedo and normal guide the denoiser below. Without them Open Image Denoise
    # judges an island by its atlas neighbours: a dim, indirect-only wall next to a
    # sunlit exterior face keeps its grain, and every layout change moves the problem.
    # Neither pass traces light, one sample is exact.
    scene.cycles.samples = 1
    scene.cycles.use_adaptive_sampling = False
    for node in target_nodes:
        node.image = albedo
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, margin=8, use_clear=True)
    for node in target_nodes:
        node.image = normal
    bpy.ops.object.bake(type="NORMAL", normal_space="OBJECT", margin=8, use_clear=True)
    bake_seconds = time.time() - t_bake
    for o in meshes:
        o.hide_render = False
    proxy_mesh = proxy.data
    bpy.data.objects.remove(proxy)
    bpy.data.meshes.remove(proxy_mesh)

    # Bakes cannot denoise, so the compositor runs the baked image through Open Image
    # Denoise and writes the file. Without a Render Layers node in the tree the render
    # itself is skipped; the camera only satisfies the pipeline.
    tree = bpy.data.node_groups.new("Lightmap_Denoise", "CompositorNodeTree")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    denoise = tree.nodes.new("CompositorNodeDenoise")
    for socket, img in (("Image", image), ("Albedo", albedo), ("Normal", normal)):
        source = tree.nodes.new("CompositorNodeImage")
        source.image = img
        tree.links.new(source.outputs["Image"], denoise.inputs[socket])
    output = tree.nodes.new("NodeGroupOutput")
    tree.links.new(denoise.outputs["Image"], output.inputs["Image"])
    scene.compositing_node_group = tree
    scene.render.use_compositing = True
    scene.render.resolution_x = scene.render.resolution_y = LIGHTMAP_SIZE
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    camera = bpy.data.objects.new("Bake_Camera", bpy.data.cameras.new("Bake_Camera"))
    scene.collection.objects.link(camera)
    scene.camera = camera
    os.makedirs(os.path.dirname(lightmap_path), exist_ok=True)
    scene.render.filepath = lightmap_path
    t_denoise = time.time()
    bpy.ops.render.render(write_still=True)
    bake_seconds += time.time() - t_denoise

# ---------------------------------------------------------------- glb
# Everything in the collection, the group empties (Rad, Laptop, Radcomputer) included.
select_only(list(bpy.data.collections["Blockout"].all_objects))
os.makedirs(os.path.dirname(glb_path), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
)

os.makedirs(os.path.dirname(hotspots_path), exist_ok=True)
with open(hotspots_path, "w", encoding="utf-8") as f:
    json.dump(hotspots, f, indent=2)
    f.write("\n")

lightmap_note = (
    "lightmap=skipped"
    if skip_bake
    else f"lightmap={lightmap_path} ({os.path.getsize(lightmap_path) // 1024} KB, bake {bake_seconds:.0f}s)"
)
print(
    f"OK glb={glb_path} ({os.path.getsize(glb_path) // 1024} KB, {faces} faces, {culled} culled) "
    f"{lightmap_note} hotspots={hotspots_path} ({len(hotspots)} views) total {time.time() - t_start:.0f}s"
)
