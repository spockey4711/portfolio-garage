"""Helpers for building the garage in Blender via the MCP bridge.

Blender coordinates: x right, y into the room (-y = towards the gate), z up.
Sizes are (sx, sy, sz), positions are centres unless stated otherwise.
"""
import bpy
import bmesh
from math import radians
from mathutils import Vector, Matrix

COLL = "Blockout"


def srgb(hexstr, alpha=1.0):
    h = hexstr.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))

    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin(r), lin(g), lin(b), alpha)


def material(name, hexstr, roughness=0.8, metallic=0.0, alpha=1.0, emission=None):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    col = srgb(hexstr, alpha)
    bsdf.inputs["Base Color"].default_value = col
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Alpha"].default_value = alpha
    if emission:
        bsdf.inputs["Emission Color"].default_value = srgb(emission[0])
        bsdf.inputs["Emission Strength"].default_value = emission[1]
    mat.diffuse_color = col
    mat.roughness = roughness
    mat.metallic = metallic
    if alpha < 1.0:
        mat.surface_render_method = "BLENDED"
    return mat


TEXTURE_UV = "Textur"  # UV set 0: world metres, box-projected, tiled by the material's Mapping node


def _texture_image(folder, kind, colorspace):
    """Load blender/textures/<folder>/<kind>.jpg once, stored relative to the .blend."""
    abs_path = bpy.path.abspath(f"//textures/{folder}/{kind}.jpg")
    for img in bpy.data.images:
        if img.filepath and bpy.path.abspath(img.filepath) == abs_path:
            return img
    img = bpy.data.images.load(abs_path)
    img.name = f"{folder}_{kind}"  # the exporter names the GLB texture after it
    img.filepath = bpy.path.relpath(abs_path)
    img.colorspace_settings.name = colorspace
    return img


def textured_material(name, folder, tile_m, roughness=0.9, normal_strength=1.0, tint=None):
    """A tiling photo texture (blender/textures/<folder>/color.jpg + normal.jpg) on a
    Principled BSDF. The mesh's TEXTURE_UV set holds world metres, so `tile_m` is the
    physical size of the image. The node chain UV Map -> Mapping -> Image Texture is
    the one the glTF exporter turns into KHR_texture_transform; the normal map only
    feeds the bake, export.py unlinks it before the GLB.

    `tint` (hex) multiplies the photo before the BSDF, through a Mix node with factor 1,
    which the exporter folds into `baseColorFactor`; MeshBasicMaterial multiplies its
    `color` with the map the same way, so bake, GLB and stills agree without touching
    the source image."""
    mat = material(name, tint or "#ffffff", roughness=roughness)
    mat["textured"] = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    for n in [n for n in nodes if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL")]:
        nodes.remove(n)
    bsdf = nodes["Principled BSDF"]
    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = TEXTURE_UV
    mapping = nodes.new("ShaderNodeMapping")
    mapping.vector_type = "POINT"
    mapping.inputs["Scale"].default_value = (1 / tile_m, 1 / tile_m, 1.0)
    links.new(uv.outputs["UV"], mapping.inputs["Vector"])
    color = nodes.new("ShaderNodeTexImage")
    color.image = _texture_image(folder, "color", "sRGB")
    links.new(mapping.outputs["Vector"], color.inputs["Vector"])
    base_color = color.outputs["Color"]
    if tint:
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        # The node has one A/B/Result socket per data type, only the identifier is unique.
        socket = lambda sockets, ident: next(s for s in sockets if s.identifier == ident)
        socket(mix.inputs, "Factor_Float").default_value = 1.0
        socket(mix.inputs, "B_Color").default_value = srgb(tint)
        links.new(base_color, socket(mix.inputs, "A_Color"))
        base_color = socket(mix.outputs, "Result_Color")
    links.new(base_color, bsdf.inputs["Base Color"])
    normal = nodes.new("ShaderNodeTexImage")
    normal.image = _texture_image(folder, "normal", "Non-Color")
    links.new(mapping.outputs["Vector"], normal.inputs["Vector"])
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.uv_map = TEXTURE_UV
    normal_map.inputs["Strength"].default_value = normal_strength
    links.new(normal.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def box_project_uvs(obj):
    """TEXTURE_UV in world metres: every face takes the two world axes across its
    dominant normal, so a tiling texture keeps one physical size on every object and
    runs straight across box edges. Meshes here are built in world space."""
    me = obj.data
    layer = me.uv_layers.get(TEXTURE_UV) or me.uv_layers.new(name=TEXTURE_UV)
    mw = obj.matrix_world
    for poly in me.polygons:
        n = (mw.to_3x3() @ poly.normal).normalized()
        axis = max(range(3), key=lambda i: abs(n[i]))
        u_axis, v_axis = {0: (1, 2), 1: (0, 2), 2: (0, 1)}[axis]
        for li in poly.loop_indices:
            p = mw @ me.vertices[me.loops[li].vertex_index].co
            layer.data[li].uv = (p[u_axis], p[v_axis])


def collection(name=COLL):
    return bpy.data.collections[name]


def remove(name):
    o = bpy.data.objects.get(name)
    if o is None:
        return
    data = o.data if o.type in ("MESH", "CURVE") else None
    bpy.data.objects.remove(o)
    if data is not None and data.users == 0:
        (bpy.data.meshes if isinstance(data, bpy.types.Mesh) else bpy.data.curves).remove(data)


def mesh_object(name, bm, mat=None, coll=COLL, keep_transform=None):
    """Replace or create object `name` with the bmesh contents (world space)."""
    old = bpy.data.objects.get(name)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if old is not None and old.type == "MESH":
        old_me = old.data
        old.data = me
        if old_me.users == 0:
            bpy.data.meshes.remove(old_me)
        obj = old
        obj.parent = None
        obj.matrix_world = Matrix.Identity(4)
        for c in list(obj.users_collection):
            if c.name != coll:
                c.objects.unlink(obj)
        if obj.name not in collection(coll).objects:
            collection(coll).objects.link(obj)
    else:
        if old is not None:
            remove(name)
        obj = bpy.data.objects.new(name, me)
        collection(coll).objects.link(obj)
    # `me` is new and has no slots; materials.clear() would also reset every
    # polygon's material_index, so never call it here
    if mat is not None:
        me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = False
    if mat is not None and mat.get("textured"):
        box_project_uvs(obj)
    return obj


def bm_box(bm, size, center, mat_index=0):
    sx, sy, sz = size
    cx, cy, cz = center
    m = Matrix.Translation((cx, cy, cz)) @ Matrix.Diagonal((sx, sy, sz, 1))
    geom = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = mat_index
    return geom["verts"]


def box(name, size, center, mat, bevel=None):
    bm = bmesh.new()
    bm_box(bm, size, center)
    obj = mesh_object(name, bm, mat)
    if bevel:
        add_bevel(obj, bevel)
    return obj


def boxes(name, parts, mat, bevel=None):
    """One object out of several boxes: parts = [(size, center), ...]."""
    bm = bmesh.new()
    for size, center in parts:
        bm_box(bm, size, center)
    obj = mesh_object(name, bm, mat)
    if bevel:
        add_bevel(obj, bevel)
    return obj


def add_bevel(obj, width, segments=1):
    for m in list(obj.modifiers):
        if m.type == "BEVEL":
            obj.modifiers.remove(m)
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = radians(60)
    mod.harden_normals = False
    return mod


def set_parent(child, parent):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def set_object_color(obj, hexstr):
    obj.color = srgb(hexstr)


def bm_cyl(bm, radius, depth, center, axis="z", segs=8, r2=None, mat_index=0):
    """Cylinder (or cone with r2) with its axis along x, y or z."""
    rot = {"z": Matrix.Identity(4), "x": Matrix.Rotation(radians(90), 4, "Y"), "y": Matrix.Rotation(radians(-90), 4, "X")}[axis]
    m = Matrix.Translation(center) @ rot
    geom = bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segs, radius1=radius, radius2=radius if r2 is None else r2, depth=depth, matrix=m
    )
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = mat_index
    return geom["verts"]


def bm_tube(bm, p0, p1, radius, segs=8, mat_index=0):
    """Cylinder from p0 to p1."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    length = d.length
    rot = d.normalized().to_track_quat("Z", "Y").to_matrix().to_4x4()
    m = Matrix.Translation((p0 + p1) / 2) @ rot
    geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=radius, radius2=radius, depth=length, matrix=m)
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = mat_index
    return geom["verts"]


def bm_torus(bm, major, minor, center, axis="z", segs_major=24, segs_minor=6, mat_index=0):
    """Low-poly torus, axis along x, y or z."""
    from math import cos, sin, pi
    rot = {"z": Matrix.Identity(4), "x": Matrix.Rotation(radians(90), 4, "Y"), "y": Matrix.Rotation(radians(-90), 4, "X")}[axis]
    m = Matrix.Translation(center) @ rot
    rings = []
    for i in range(segs_major):
        a = 2 * pi * i / segs_major
        ring = []
        for j in range(segs_minor):
            b = 2 * pi * j / segs_minor
            r = major + minor * cos(b)
            ring.append(bm.verts.new(m @ Vector((r * cos(a), r * sin(a), minor * sin(b)))))
        rings.append(ring)
    faces = []
    for i in range(segs_major):
        r0, r1 = rings[i], rings[(i + 1) % segs_major]
        for j in range(segs_minor):
            f = bm.faces.new((r0[j], r1[j], r1[(j + 1) % segs_minor], r0[(j + 1) % segs_minor]))
            f.material_index = mat_index
            faces.append(f)
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return faces


def bm_ring(bm, r_in, r_out, width, center, axis="z", segs=24, mat_index=0):
    """Ring with a rectangular cross-section (a rim, a lid), axis along x, y or z."""
    from math import cos, sin, pi
    rot = {"z": Matrix.Identity(4), "x": Matrix.Rotation(radians(90), 4, "Y"), "y": Matrix.Rotation(radians(-90), 4, "X")}[axis]
    m = Matrix.Translation(center) @ rot
    rings = []
    for r, z in ((r_in, -width / 2), (r_out, -width / 2), (r_out, width / 2), (r_in, width / 2)):
        rings.append([bm.verts.new(m @ Vector((r * cos(2 * pi * i / segs), r * sin(2 * pi * i / segs), z))) for i in range(segs)])
    faces = []
    for k in range(4):
        a, b = rings[k], rings[(k + 1) % 4]
        for i in range(segs):
            f = bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i]))
            f.material_index = mat_index
            faces.append(f)
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return faces


def bm_dome(bm, center, size, cut, mat_index=0, inner_index=None, subdivisions=3):
    """An icosphere scaled to `size` (full diameters) and cut by the plane through
    `center + cut` with normal `cut`, keeping the half the normal points away from;
    the cut is closed with a flat face in `inner_index`. A helmet, a bowl, a cap."""
    m = Matrix.Translation(center) @ Matrix.Diagonal((size[0] / 2, size[1] / 2, size[2] / 2, 1))
    geom = bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=1.0, matrix=m)
    verts = geom["verts"]
    faces = {f for v in verts for f in v.link_faces}
    edges = {e for v in verts for e in v.link_edges}
    cut = Vector(cut)
    res = bmesh.ops.bisect_plane(bm, geom=list(verts) + list(edges) + list(faces), plane_co=Vector(center) + cut, plane_no=cut, clear_outer=True)
    cut_edges = [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
    fill = bmesh.ops.holes_fill(bm, edges=cut_edges, sides=0)
    for f in fill["faces"]:
        f.material_index = mat_index if inner_index is None else inner_index
    shell = [f for f in res["geom"] if isinstance(f, bmesh.types.BMFace) and f not in fill["faces"]]
    for f in shell:
        f.material_index = mat_index
    return shell


def bm_placed(bm, matrix, build):
    """build(bm) draws in its own frame, everything it adds is then moved by `matrix`:
    a turned box keeps its tape and latch where they belong."""
    before = set(bm.verts)
    build(bm)
    bmesh.ops.transform(bm, matrix=matrix, verts=[v for v in bm.verts if v not in before])


def shade_smooth(obj, mat_indices):
    """Smooth shading for every face in the given material slots: domes and tyres
    should bake as a gradient, not as facets. Everything else stays flat."""
    for p in obj.data.polygons:
        if p.material_index in mat_indices:
            p.use_smooth = True


def multi_mesh_object(name, bm, mats, coll=COLL):
    """Like mesh_object but with a material slot list; faces keep their material_index."""
    obj = mesh_object(name, bm, None, coll)
    for m in mats:
        obj.data.materials.append(m)
    if any(m.get("textured") for m in mats):
        box_project_uvs(obj)
    return obj


def empty(name, location, coll=COLL):
    o = bpy.data.objects.get(name)
    if o is None:
        o = bpy.data.objects.new(name, None)
        collection(coll).objects.link(o)
    o.empty_display_type = "PLAIN_AXES"
    o.empty_display_size = 0.1
    o.location = location
    return o


def parent_to(obj, parent):
    """Parent keeping the current world transform."""
    mw = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()
    obj.matrix_world = mw


def curve(name, points, radius, mat, segs=6, resolution=8, coll=COLL):
    """Replace or create the Bezier curve `name` through `points` (world space) as a
    tube of `radius` (bevel depth, closed ends). Handles are AUTO, so the tube runs
    smoothly through every point: a hanging cable is start, low point, end. `segs` is
    the profile's side count (4 + 2 * bevel_resolution), `resolution` the subdivisions
    per Bezier segment. The tube is shaded smooth: unlike a box it has no edge that
    should read as one, and the bake turns the facets into a round gradient. The
    export converts it to a mesh, as it applies every modifier."""
    old = bpy.data.objects.get(name)
    if old is not None and old.type != "CURVE":
        remove(name)
        old = None
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_mode = "ROUND"
    cu.bevel_depth = radius
    cu.bevel_resolution = max(0, (segs - 4) // 2)
    cu.resolution_u = resolution
    cu.use_fill_caps = True
    spline = cu.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for bp, p in zip(spline.bezier_points, points):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    spline.use_smooth = True
    cu.materials.append(mat)
    if old is not None:
        old_cu = old.data
        old.data = cu
        if old_cu.users == 0:
            bpy.data.curves.remove(old_cu)
        obj = old
        obj.parent = None
        obj.matrix_world = Matrix.Identity(4)
        for c in list(obj.users_collection):
            if c.name != coll:
                c.objects.unlink(obj)
        if obj.name not in collection(coll).objects:
            collection(coll).objects.link(obj)
    else:
        obj = bpy.data.objects.new(name, cu)
        collection(coll).objects.link(obj)
    return obj
