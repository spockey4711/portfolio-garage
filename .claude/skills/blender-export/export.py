"""Headless build of blender/garage-blockout.blend, run by export.sh.

Writes, relative to <out> (the first argument after "--"):
  public/models/garage.glb              collection "Blockout", object names kept, modifiers
                                        applied, two UV sets: "Textur" (TEXCOORD_0, world
                                        metres for the tiling photo textures, which travel
                                        inside the GLB as WebP) and "Lightmap" (TEXCOORD_1)
  public/models/garage-lightmap-tag.webp daylight baked with Cycles into the Lightmap set:
                                        diffuse direct + indirect light without colour, so
                                        the web multiplies it with the material colour or
                                        texture (KONZEPT §5)
  lib/garage/hotspots.generated.json    Cam_*/Ziel_* empties of collection "Hotspots",
                                        Blender Z-up converted to three.js Y-up
  public/models/garage-ruhe-tag-quer.webp
  public/models/garage-ruhe-tag-hoch.webp
                                        the rest view as the web draws it, for the static
                                        fallback (KONZEPT §5): landscape for desktops,
                                        portrait for phones
  lib/garage/still.generated.json       size of both stills and, per hotspot, where it is
                                        in the landscape one, in its pixels

"--skip-bake" as second argument leaves the lightmap and the stills alone (both need
Cycles, and the stills need a lightmap that fits the geometry). The UV layout is recomputed
either way, so the old lightmap only fits if no geometry changed.

The .blend is never saved: everything here happens in the session and is thrown away.
"""

import json
import os
import sys
import time
from math import radians

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1 :]
out_root = args[0]
skip_bake = "--skip-bake" in args[1:]
glb_path = os.path.join(out_root, "public", "models", "garage.glb")
lightmap_path = os.path.join(out_root, "public", "models", "garage-lightmap-tag.webp")
hotspots_path = os.path.join(out_root, "lib", "garage", "hotspots.generated.json")
still_paths = {
    "wide": os.path.join(out_root, "public", "models", "garage-ruhe-tag-quer.webp"),
    "portrait": os.path.join(out_root, "public", "models", "garage-ruhe-tag-hoch.webp"),
}
still_json_path = os.path.join(out_root, "lib", "garage", "still.generated.json")

LIGHTMAP_SIZE = 2048
BAKE_SAMPLES = 128
TEXTURE_UV = "Textur"  # the tiling textures' UV set, laid by blender/build/garage_lib.py
LIGHTMAP_UV = "Lightmap"
TEXTURE_QUALITY = 90  # WebP inside the GLB
# Overlapping lightmap islands, as a fraction of the atlas, above which the export fails.
# The floor patch that motivated the check covered 0.009; bevel slivers stay far below.
MAX_OVERLAP = 0.001
LIGHTMAP_QUALITY = 90  # lossy WebP: 0.5 MB instead of 3.5 MB as PNG, no visible difference
# Sunlit surfaces exceed 1.0; the PNG stores the bake darkened by this many stops and
# lib/garage/lightmap.ts (LIGHTMAP_EXPOSURE_STOPS) brightens it back in the shader.
EXPOSURE_STOPS = -1.5

# Daylight rig "Tag" (docs/ATMOSPHAERE.md §2). Colours are linear RGB.
SUN_COLOR = (1.0, 0.86, 0.68)  # about 4000 K, afternoon
# The facade faces the sun almost squarely (cos 25° cos 30° = 0.79) and the lightmap clips
# at 2^1.5 = 2.83 irradiance (EXPOSURE_STOPS), so the sun's red channel may not exceed
# about 3.2 with the sky on top. The floor streak then gets sin 25° of it, 1.3.
SUN_ENERGY = 3.0
SUN_ELEVATION_DEG = 25  # low enough that the streak through the gate reaches the bench
# From the front right, so the streak runs towards the bench on the left and the right
# pillar's shadow cuts a diagonal across the floor to the rear wall: light on the bench
# and the bike, shade on the shelf and the boxes.
SUN_AZIMUTH_DEG = 35
SKY_COLOR = (0.62, 0.70, 0.80)  # a hazy sky, barely blue: the fill must not cool the shadows
# The sky enters over the whole gate and lights the floor from a third of the hemisphere,
# the low sun only with sin 25°. At strength 1.0 the shade was half as bright as the
# streak and the streak went flat; the streak needs about four times the shade.
SKY_STRENGTH = 0.4
LAMP_COLOR = (1.0, 0.62, 0.30)  # 2700 K
LAMP_ENERGY = 10.0  # watts: a pool on the bench top 60 cm below the bulb, about the streak's level

# A camera closer than this to a face's plane keeps the face, so parallax and small
# camera moves never uncover a hole (CameraRig lerps positions, so the endpoints suffice).
CULL_MARGIN = 0.5

# The stills: the rest view as the canvas shows it, so the canvas can take over from the
# image without a visible cut. The view is named like its empties, the field of view is
# vertical and the same for every aspect ratio (three.js keeps the vertical one), so a
# viewport narrower than a still shows exactly the still's centre with `object-fit: cover`.
REST_VIEW = "ruhe"
REST_FOV_DEG = 55  # same as REST_FOV in lib/garage/hotspots.ts
STILL_SIZES = {
    "wide": (2400, 1000),  # 12:5, wider than a 21:9 desktop, so cover never crops the height
    "portrait": (1200, 2400),  # 1:2, a phone held upright
}
STILL_SAMPLES = 32  # emission only: samples are antialiasing, there is no light to converge
STILL_QUALITY = 90
MIN_HIT_SIZE_M = 0.35  # same as MIN_HIT_SIZE_M in components/garage/Hotspot.tsx
SOFT_CLIP_KNEE = 0.8  # same as SOFT_CLIP_KNEE in lib/garage/softclip.ts

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
hotspot_empties = {}  # view -> {"camera": empty, "target": empty}, Blender space, for the stills
hotspot_names = {}  # view -> the object it opens: the suffix of Cam_<Name> as written
for obj in bpy.data.collections["Hotspots"].objects:
    prefix, _, name = obj.name.partition("_")
    key = {"Cam": "camera", "Ziel": "target"}.get(prefix)
    if key is None:
        sys.exit(f"ERROR unexpected object in Hotspots: {obj.name} (expected Cam_* or Ziel_*)")
    view = name.lower()
    hotspots.setdefault(view, {})[key] = to_yup(obj.matrix_world.translation)
    hotspot_empties.setdefault(view, {})[key] = obj
    hotspot_names[view] = name

incomplete = sorted(v for v, d in hotspots.items() if set(d) != {"camera", "target"})
if incomplete:
    sys.exit(f"ERROR views without a Cam_/Ziel_ pair: {incomplete}")
if REST_VIEW not in hotspots:
    sys.exit(f"ERROR no Cam_Ruhe/Ziel_Ruhe pair, the stills need the rest view")
# The still's click areas wrap the object named like the view, as Hotspot.tsx does in 3D.
missing = sorted(n for v, n in hotspot_names.items() if v != REST_VIEW and n not in bpy.data.objects)
if missing:
    sys.exit(f"ERROR Cam_<Name> without an object <Name> to click on: {missing}")

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
    # the same two UV sets in the same order on every object: TEXCOORD_0 is the
    # textures' (empty where nothing is textured, the web reads it anyway), TEXCOORD_1
    # the atlas. The bake proxy below joins them by name, so the order must not vary.
    for layer in list(o.data.uv_layers):
        if layer.name != TEXTURE_UV:
            o.data.uv_layers.remove(layer)
    if TEXTURE_UV not in o.data.uv_layers:
        o.data.uv_layers.new(name=TEXTURE_UV)
    lightmap_uv = o.data.uv_layers.new(name=LIGHTMAP_UV)
    o.data.uv_layers.active = lightmap_uv
    lightmap_uv.active_render = True

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
# smart_project's own packing has put long, thin islands (the threshold's sides) on top
# of the floor's island; the dedicated packer does not overlap.
bpy.ops.uv.select_all(action="SELECT")
bpy.ops.uv.pack_islands(
    udim_source="ORIGINAL_AABB", rotate=True, scale=True, margin_method="SCALED", margin=0.0015, shape_method="AABB"
)
# Overlapping islands bake one face's light onto another (a black patch on the floor,
# once). Blender's own overlap test selects the culprits (UV selection is the mesh
# selection since 5.0). Bevel slivers inside boxes-in-boxes (cartons, laptop, doors)
# always trip it over a few texels, so the export refuses only a visible area.
bpy.ops.mesh.select_all(action="DESELECT")
bpy.ops.uv.select_overlap()
overlap_area = {}
for o in meshes:
    bm = bmesh.from_edit_mesh(o.data)
    uv_layer = bm.loops.layers.uv[LIGHTMAP_UV]
    area = 0.0
    for f in bm.faces:
        if f.select:
            points = [loop[uv_layer].uv for loop in f.loops]
            area += abs(sum(points[i].cross(points[(i + 1) % len(points)]) for i in range(len(points)))) / 2
    if area > 0:
        overlap_area[o.name] = area
bpy.ops.object.mode_set(mode="OBJECT")
overlap_total = sum(overlap_area.values())
if overlap_total > MAX_OVERLAP:
    worst = sorted(overlap_area, key=overlap_area.get, reverse=True)[:5]
    sys.exit(f"ERROR overlapping lightmap islands cover {overlap_total:.4f} of the atlas, worst: {worst}")

# Single-sided like three.js renders them; the culling above assumed it. Glass keeps both.
for mat in bpy.data.materials:
    mat.use_backface_culling = mat.surface_render_method != "BLENDED"

# ---------------------------------------------------------------- lightmap
if not skip_bake:
    # The file's own lights (collection Review_Licht: a 6.0 sun and a 150 W area light
    # for viewport reviews) must not reach the bake. They did until now: every earlier
    # lightmap was lit by them, the rig below only added a little on top.
    for o in [o for o in bpy.data.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(o)

    # Daylight rig "Tag" (docs/ATMOSPHAERE.md §2): late afternoon, not noon. A warm, low
    # sun from the front right lays one long streak through the gate across the floor to
    # the workbench; the sky is a dim fill so the shadows read warm from the brick bounce,
    # not blue. The night rig comes in phase 3.
    world = bpy.data.worlds.new("Bake_Tag")
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (*SKY_COLOR, 1.0)
    background.inputs["Strength"].default_value = SKY_STRENGTH
    scene.world = world
    sun_data = bpy.data.lights.new("Sonne", "SUN")
    sun_data.energy = SUN_ENERGY
    sun_data.color = SUN_COLOR
    sun_data.angle = radians(3)
    sun = bpy.data.objects.new("Sonne", sun_data)
    scene.collection.objects.link(sun)
    # Blender's sun shines down its local -Z; tilting by (90 - elevation) about X sends it
    # into the room (+Y, away from the gate), the Z turn swings it towards the bench.
    sun.rotation_euler = (radians(90 - SUN_ELEVATION_DEG), 0.0, radians(SUN_AZIMUTH_DEG))

    # The bench lamp burns in daylight too: a warm pool on the bench top is the sign that
    # someone works here. The bulb sits just in front of the lamp's diffuser disc (the
    # largest face in the head's third material slot, see build_furniture.py) so the disc
    # itself bakes bright and the lamp head shades everything above.
    lamp = bpy.data.objects["Leuchte"]
    disc = max(
        (p for p in lamp.data.polygons if p.material_index == 2 and p.normal.z < 0), key=lambda p: p.area
    )
    bulb_data = bpy.data.lights.new("Leuchte_Birne", "POINT")
    bulb_data.energy = LAMP_ENERGY
    bulb_data.color = LAMP_COLOR
    bulb_data.shadow_soft_size = 0.03
    bulb = bpy.data.objects.new("Leuchte_Birne", bulb_data)
    scene.collection.objects.link(bulb)
    bulb.location = lamp.matrix_world @ (disc.center + disc.normal * 0.02)

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
    proxy.data.uv_layers.active = proxy.data.uv_layers[LIGHTMAP_UV]
    proxy.data.uv_layers[LIGHTMAP_UV].active_render = True
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
# The normal maps have done their work in the bake; the web lights nothing, so only the
# colour textures go into the GLB, as WebP (EXT_texture_webp), with the Mapping node's
# tile scale as KHR_texture_transform.
for mat in bpy.data.materials:
    if not mat.use_nodes:
        continue
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        for link in list(bsdf.inputs["Normal"].links):
            mat.node_tree.links.remove(link)
select_only(list(bpy.data.collections["Blockout"].all_objects))
os.makedirs(os.path.dirname(glb_path), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_image_format="WEBP",
    export_image_quality=TEXTURE_QUALITY,
)

os.makedirs(os.path.dirname(hotspots_path), exist_ok=True)
with open(hotspots_path, "w", encoding="utf-8") as f:
    json.dump(hotspots, f, indent=2)
    f.write("\n")

# ---------------------------------------------------------------- stills
# The static fallback (KONZEPT §5) is the rest view exactly as Scene.tsx draws it: every
# material becomes colour (or texture) times lightmap, lifted by the exposure the file took out
# (lib/garage/lightmap.ts), the sky is the bake's sky, and the compositor applies the
# highlight roll-off of SoftClipEffect. Emission needs no light, so Cycles only
# antialiases. This runs after the GLB export because it rewires the materials.
if not skip_bake:
    t_still = time.time()
    lightmap_image = bpy.data.images.load(lightmap_path)  # sRGB, decoded like the web does
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        nodes, node_links = mat.node_tree.nodes, mat.node_tree.links
        bsdf = nodes.get("Principled BSDF")
        output = next((n for n in nodes if n.type == "OUTPUT_MATERIAL"), None)
        if bsdf is None or output is None:
            continue
        alpha = bsdf.inputs["Alpha"].default_value
        atlas_uv = nodes.new("ShaderNodeUVMap")
        atlas_uv.uv_map = LIGHTMAP_UV
        atlas = nodes.new("ShaderNodeTexImage")
        atlas.image = lightmap_image
        node_links.new(atlas_uv.outputs["UV"], atlas.inputs["Vector"])
        lit = nodes.new("ShaderNodeVectorMath")
        lit.operation = "MULTIPLY"
        base = bsdf.inputs["Base Color"]
        if base.links:
            node_links.new(base.links[0].from_socket, lit.inputs[0])
        else:
            lit.inputs[0].default_value = tuple(base.default_value)[:3]
        node_links.new(atlas.outputs["Color"], lit.inputs[1])
        emission = nodes.new("ShaderNodeEmission")
        emission.inputs["Strength"].default_value = 2**-EXPOSURE_STOPS
        node_links.new(lit.outputs["Vector"], emission.inputs["Color"])
        surface = emission.outputs["Emission"]
        if alpha < 1.0:
            # Glass: MeshBasicMaterial blends it by its opacity, so does this mix.
            mix = nodes.new("ShaderNodeMixShader")
            mix.inputs["Fac"].default_value = alpha
            node_links.new(nodes.new("ShaderNodeBsdfTransparent").outputs["BSDF"], mix.inputs[1])
            node_links.new(surface, mix.inputs[2])
            surface = mix.outputs["Shader"]
        node_links.new(surface, output.inputs["Surface"])
    for blocker in blockers:
        blocker.hide_render = True

    rest_camera = hotspot_empties[REST_VIEW]["camera"].matrix_world.translation
    rest_target = hotspot_empties[REST_VIEW]["target"].matrix_world.translation
    still_camera_data = bpy.data.cameras.new("Still_Camera")
    still_camera_data.sensor_fit = "VERTICAL"
    still_camera_data.angle_y = radians(REST_FOV_DEG)
    still_camera_data.clip_start = 0.05
    still_camera_data.clip_end = 30
    still_camera = bpy.data.objects.new("Still_Camera", still_camera_data)
    scene.collection.objects.link(still_camera)
    still_camera.location = rest_camera
    # -Z along the view, Y towards the ceiling: lookAt with world up, like CameraRig at rest.
    still_camera.rotation_euler = (rest_target - rest_camera).to_track_quat("-Z", "Y").to_euler()
    scene.camera = still_camera
    view_layer.update()

    def math(tree, operation, a, b=None):
        node = tree.nodes.new("ShaderNodeMath")
        node.operation = operation
        for socket, value in zip(node.inputs, (a, b)):
            if isinstance(value, (int, float)):
                socket.default_value = value
            elif value is not None:
                tree.links.new(value, socket)
        return node.outputs[0]

    def soft_clip(tree, value):
        """SoftClipEffect per channel: min(c, knee) + room * (1 - exp(-max(c - knee, 0) / room))."""
        room = 1.0 - SOFT_CLIP_KNEE
        over = math(tree, "MAXIMUM", math(tree, "SUBTRACT", value, SOFT_CLIP_KNEE), 0.0)
        decay = math(tree, "EXPONENT", math(tree, "MULTIPLY", over, -1.0 / room))
        tail = math(tree, "MULTIPLY", math(tree, "SUBTRACT", 1.0, decay), room)
        return math(tree, "ADD", math(tree, "MINIMUM", value, SOFT_CLIP_KNEE), tail)

    tree = bpy.data.node_groups.new("Still_SoftClip", "CompositorNodeTree")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    layers = tree.nodes.new("CompositorNodeRLayers")
    layers.scene = scene
    split = tree.nodes.new("CompositorNodeSeparateColor")
    split.mode = "RGB"
    join = tree.nodes.new("CompositorNodeCombineColor")
    join.mode = "RGB"
    tree.links.new(layers.outputs["Image"], split.inputs["Image"])
    for channel in ("Red", "Green", "Blue"):
        tree.links.new(soft_clip(tree, split.outputs[channel]), join.inputs[channel])
    tree.links.new(split.outputs["Alpha"], join.inputs["Alpha"])
    tree.links.new(join.outputs["Image"], tree.nodes.new("NodeGroupOutput").inputs["Image"])
    scene.compositing_node_group = tree

    scene.cycles.samples = STILL_SAMPLES
    scene.cycles.use_adaptive_sampling = False
    scene.cycles.use_denoising = False
    scene.view_settings.exposure = 0.0
    scene.render.image_settings.quality = STILL_QUALITY
    for kind, (width, height) in STILL_SIZES.items():
        scene.render.resolution_x, scene.render.resolution_y = width, height
        scene.render.filepath = still_paths[kind]
        bpy.ops.render.render(write_still=True)

    # Where each hotspot is in the wide still: the world box of its object, padded to the
    # same minimum as the 3D click box, projected corner by corner. Pixels, origin top left.
    scene.render.resolution_x, scene.render.resolution_y = STILL_SIZES["wide"]
    areas = {}
    for view, name in hotspot_names.items():
        if view == REST_VIEW:
            continue
        parts = [o for o in (bpy.data.objects[name], *bpy.data.objects[name].children_recursive) if o.type == "MESH"]
        if not parts:
            sys.exit(f"ERROR {name} has no mesh to project for the still")
        corners = [o.matrix_world @ Vector(c) for o in parts for c in o.bound_box]
        lo = Vector([min(c[i] for c in corners) for i in range(3)])
        hi = Vector([max(c[i] for c in corners) for i in range(3)])
        for i in range(3):
            pad = (MIN_HIT_SIZE_M - (hi[i] - lo[i])) / 2
            if pad > 0:
                lo[i] -= pad
                hi[i] += pad
        box = [Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]
        projected = [world_to_camera_view(scene, still_camera, p) for p in box]
        xs = [p.x * scene.render.resolution_x for p in projected]
        ys = [(1 - p.y) * scene.render.resolution_y for p in projected]
        areas[view] = [round(min(xs)), round(min(ys)), round(max(xs) - min(xs)), round(max(ys) - min(ys))]

    with open(still_json_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "fov": REST_FOV_DEG,
                **{kind: {"width": w, "height": h} for kind, (w, h) in STILL_SIZES.items()},
                "areas": areas,
            },
            f,
            indent=2,
        )
        f.write("\n")
    still_seconds = time.time() - t_still

lightmap_note = (
    "lightmap=skipped stills=skipped"
    if skip_bake
    else (
        f"lightmap={lightmap_path} ({os.path.getsize(lightmap_path) // 1024} KB, bake {bake_seconds:.0f}s) "
        f"stills={' '.join(f'{p} ({os.path.getsize(p) // 1024} KB)' for p in still_paths.values())} "
        f"({len(areas)} areas, {still_seconds:.0f}s)"
    )
)
print(
    f"OK glb={glb_path} ({os.path.getsize(glb_path) // 1024} KB, {faces} faces, {culled} culled, "
    f"uv overlap {overlap_total:.5f}) "
    f"{lightmap_note} hotspots={hotspots_path} ({len(hotspots)} views) total {time.time() - t_start:.0f}s"
)
