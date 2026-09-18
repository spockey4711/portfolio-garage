import bpy, bmesh
from math import radians, pi, cos, sin
from mathutils import Matrix, Vector

exec(open(LIB).read())  # LIB: absolute path to garage_lib.py, set by the caller

# ---------------------------------------------------------------- palette
# Red brick garage (docs/adr/0006): walls and floor are tiling photo textures from
# blender/textures (ambientCG, CC0), tile sizes are the physical size ambientCG lists.
# Everything else stays a flat colour.
for stale in ("Putz", "Beton_Boden"):
    if stale in bpy.data.materials and bpy.data.materials[stale].users == 0:
        bpy.data.materials.remove(bpy.data.materials[stale])
P = {
    "Backstein": textured_material("Backstein", "backstein", 1.05, roughness=0.9),
    "Asphalt": textured_material("Asphalt", "asphalt", 2.5, roughness=1.0, normal_strength=0.6),
    "Holz": textured_material("Holz", "holz", 0.8, roughness=0.5, normal_strength=0.5),
    "Fuge": material("Fuge", "#3a3835", roughness=1.0),
    "Beton": material("Beton", "#9a968f", roughness=0.95),
    "Sockel": material("Sockel", "#4c4a47", roughness=0.9),
    "Decke": material("Decke", "#c4c0b9", roughness=0.95),
    "Tor": material("Tor", "#f0efe9", roughness=0.5),
    "Gummi": material("Gummi", "#2a2a2a", roughness=0.9),
    "Metall_Dunkel": material("Metall_Dunkel", "#35373b", roughness=0.5, metallic=0.6),
    "Metall_Hell": material("Metall_Hell", "#cfd0cc", roughness=0.45, metallic=0.5),
    "Glas": material("Glas", "#bcdde6", roughness=0.1, alpha=0.35),
    "Holz_Dunkel": material("Holz_Dunkel", "#6f4a2c", roughness=0.75),
    "Lack_Gruen": material("Lack_Gruen", "#3b4f47", roughness=0.4),  # cabinets, like the workshop reference
    "Akzent": material("Akzent", "#1cb5a3", roughness=0.5),  # teal, same value as --accent in app/globals.css
    "Display": material("Display", "#0b0c0f", roughness=0.3),
    "Kork": material("Kork", "#c69a5e", roughness=0.95),
    "Whiteboard": material("Whiteboard", "#f5f5f2", roughness=0.3),
    "Karton": material("Karton", "#c6a06c", roughness=0.9),
}

# ---------------------------------------------------------------- floor
# one asphalt slab inside and the driveway outside, flush, the same texture in world
# metres runs across the threshold; the driveway runs under the pillars so there is
# no gap to the sky, and the rest camera stands on it
for stale in ("Boden_Fugen", "Sockelleiste"):
    remove(stale)
box("Boden", (6.0, 4.0, 0.05), (0, 0, -0.025), P["Asphalt"])
box("Vorplatz", (9.0, 4.24, 0.05), (0, -4.12, -0.025), P["Asphalt"])

# ---------------------------------------------------------------- shell
box("Decke", (6.48, 4.48, 0.24), (0, 0, 2.92), P["Decke"])
box("Wand_Links", (0.24, 4.0, 2.8), (-3.12, 0, 1.4), P["Backstein"])
box("Wand_Rechts", (0.24, 4.0, 2.8), (3.12, 0, 1.4), P["Backstein"])

# rear wall with the window opening (x 2.15..2.95, z 1.90..2.40), one object
for n in ("Wand_Rueck_L", "Wand_Rueck_R", "Wand_Rueck_Oben", "Wand_Rueck_Unten"):
    remove(n)
wx0, wx1, wz0, wz1 = 2.15, 2.95, 1.90, 2.40
boxes(
    "Wand_Rueck",
    [
        ((wx0 + 3.24, 0.24, 2.8), ((wx0 - 3.24) / 2, 2.12, 1.4)),
        ((3.24 - wx1, 0.24, 2.8), ((wx1 + 3.24) / 2, 2.12, 1.4)),
        ((wx1 - wx0, 0.24, wz0), ((wx0 + wx1) / 2, 2.12, wz0 / 2)),
        ((wx1 - wx0, 0.24, 2.8 - wz1), ((wx0 + wx1) / 2, 2.12, (2.8 + wz1) / 2)),
    ],
    P["Backstein"],
)

# gate wall: pillars and lintel, opening 5.00 x 2.25
box("Pfeiler_L", (0.74, 0.24, 2.25), (-2.87, -2.12, 1.125), P["Backstein"])
box("Pfeiler_R", (0.74, 0.24, 2.25), (2.87, -2.12, 1.125), P["Backstein"])
box("Sturz", (6.48, 0.24, 0.55), (0, -2.12, 2.525), P["Backstein"])

# ---------------------------------------------------------------- gate
# Sectional door, 5.10 wide behind the pillars. The lowest panel hangs in the
# opening (bottom edge 1.85), the rest lies under the ceiling on two tracks.
GW = 5.10
panel_t = 0.045



# hanging panel: outer face at y = -1.925
box("Tor_Segment", (GW, panel_t, 0.40), (0, -1.9, 2.05), P["Tor"], bevel=0.006)
# raised panels on the outer face, eight across like a sectional door, and a
# rubber seal at the bottom
remove("Tor_Segment_Rippen")
pitch = GW / 8
boxes(
    "Tor_Segment_Kassetten",
    [((0.50, 0.012, 0.24), (-GW / 2 + pitch * (i + 0.5), -1.9 - panel_t / 2, 2.05)) for i in range(8)],
    P["Tor"],
    bevel=0.005,
)
box("Tor_Segment_Dichtung", (GW, panel_t + 0.01, 0.035), (0, -1.9, 1.85 + 0.0175), P["Gummi"])

# panels under the ceiling: 4 panels of 0.45 with 15 mm gaps, y from -1.85 to 0.0
parts = []
y0 = -1.85
for i in range(4):
    L = 0.45
    parts.append(((GW, L - 0.015, panel_t), (0, y0 + L / 2 + i * L, 2.55)))
boxes("Tor_Deckenlauf", parts, P["Tor"], bevel=0.006)

# tracks: vertical behind the pillars, a quarter arc, then horizontal under the ceiling
def track(name, sx_sign):
    x = sx_sign * (GW / 2 + 0.02)
    bm = bmesh.new()
    # vertical rail, inner side of the door (y = -1.86 .. -1.81)
    bm_box(bm, (0.035, 0.05, 2.215), (x, -1.835, 2.215 / 2))
    # horizontal rail on top of the panels, y from -1.50 to 0.05
    bm_box(bm, (0.035, 1.55, 0.05), (x, -0.725, 2.55))
    # quarter arc from the vertical rail top to the horizontal rail, r = 0.31..0.36
    r_in, r_out = 0.31, 0.36
    cy, cz = -1.50, 2.215
    segs = 6
    verts_prev = None
    for k in range(segs + 1):
        a = pi - k * (pi / 2) / segs  # from 180 deg (pointing -y) to 90 deg (pointing +z)
        dy, dz = cos(a), sin(a)
        ring = [
            bm.verts.new((x - 0.0175, cy + r_in * dy, cz + r_in * dz)),
            bm.verts.new((x + 0.0175, cy + r_in * dy, cz + r_in * dz)),
            bm.verts.new((x + 0.0175, cy + r_out * dy, cz + r_out * dz)),
            bm.verts.new((x - 0.0175, cy + r_out * dy, cz + r_out * dz)),
        ]
        if verts_prev:
            for i in range(4):
                bm.faces.new((verts_prev[i], verts_prev[(i + 1) % 4], ring[(i + 1) % 4], ring[i]))
        else:
            bm.faces.new(ring)
        verts_prev = ring
    bm.faces.new(list(reversed(verts_prev)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    mesh_object(name, bm, P["Metall_Dunkel"])


track("Tor_Schiene_L", -1)
track("Tor_Schiene_R", 1)

# ---------------------------------------------------------------- window
fw = 0.06  # frame width
fd = 0.08  # frame depth
fy = 2.10  # frame centre in the wall (wall y 2.00..2.24)
boxes(
    "Fenster_Rahmen",
    [
        ((wx1 - wx0, fd, fw), ((wx0 + wx1) / 2, fy, wz0 + fw / 2)),
        ((wx1 - wx0, fd, fw), ((wx0 + wx1) / 2, fy, wz1 - fw / 2)),
        ((fw, fd, wz1 - wz0 - 2 * fw), (wx0 + fw / 2, fy, (wz0 + wz1) / 2)),
        ((fw, fd, wz1 - wz0 - 2 * fw), (wx1 - fw / 2, fy, (wz0 + wz1) / 2)),
        # horizontal bar splits the pane, tilt windows open at the top
        ((wx1 - wx0 - 2 * fw, fd * 0.6, 0.03), ((wx0 + wx1) / 2, fy, (wz0 + wz1) / 2)),
    ],
    P["Metall_Hell"],
    bevel=0.004,
)
box("Fenster_Glas", (wx1 - wx0 - 2 * fw, 0.008, wz1 - wz0 - 2 * fw), ((wx0 + wx1) / 2, fy, (wz0 + wz1) / 2), P["Glas"])
box("Fensterbank", (wx1 - wx0 + 0.10, 0.10, 0.03), ((wx0 + wx1) / 2, 1.96, wz0 - 0.015), P["Beton"], bevel=0.004)

# ---------------------------------------------------------------- lanterns
# one wall lantern per pillar, outside next to the gate like the reference facade
def aussenleuchte(name, x):
    bm = bmesh.new()
    y = -2.24  # outer face of the gate wall
    bm_box(bm, (0.04, 0.04, 0.12), (x, y - 0.02, 2.0), 0)  # wall plate
    bm_box(bm, (0.025, 0.08, 0.025), (x, y - 0.08, 2.03), 0)  # arm
    bm_box(bm, (0.14, 0.14, 0.015), (x, y - 0.16, 2.10), 0)  # roof
    bm_box(bm, (0.09, 0.09, 0.015), (x, y - 0.16, 1.90), 0)  # base
    bm_box(bm, (0.10, 0.10, 0.19), (x, y - 0.16, 2.0), 1)  # glass body
    obj = multi_mesh_object(name, bm, [P["Metall_Dunkel"], P["Glas"]])
    add_bevel(obj, 0.003)


aussenleuchte("Aussenleuchte_L", -2.87)
aussenleuchte("Aussenleuchte_R", 2.87)

result = {"objects": sorted(o.name for o in collection().objects)}
