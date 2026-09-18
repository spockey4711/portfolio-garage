import bpy, bmesh
from math import radians, pi, cos, sin
from mathutils import Matrix, Vector

exec(open(LIB).read())  # LIB: absolute path to garage_lib.py, set by the caller

# ---------------------------------------------------------------- palette
P = {
    "Beton_Boden": material("Beton_Boden", "#7a7671", roughness=0.9),
    "Fuge": material("Fuge", "#3a3835", roughness=1.0),
    "Putz": material("Putz", "#b7b2aa", roughness=0.95),
    "Decke": material("Decke", "#c4c0b9", roughness=0.95),
    "Sockel": material("Sockel", "#4c4a47", roughness=0.9),
    "Tor": material("Tor", "#dedcd6", roughness=0.55),
    "Gummi": material("Gummi", "#2a2a2a", roughness=0.9),
    "Metall_Dunkel": material("Metall_Dunkel", "#35373b", roughness=0.5, metallic=0.6),
    "Metall_Hell": material("Metall_Hell", "#cfd0cc", roughness=0.45, metallic=0.5),
    "Glas": material("Glas", "#bcdde6", roughness=0.1, alpha=0.35),
    "Holz": material("Holz", "#b5844e", roughness=0.7),
    "Holz_Dunkel": material("Holz_Dunkel", "#6f4a2c", roughness=0.75),
    "Akzent": material("Akzent", "#1cb5a3", roughness=0.5),  # teal, same value as --accent in app/globals.css
    "Display": material("Display", "#0b0c0f", roughness=0.3),
    "Kork": material("Kork", "#c69a5e", roughness=0.95),
    "Whiteboard": material("Whiteboard", "#f5f5f2", roughness=0.3),
    "Karton": material("Karton", "#c6a06c", roughness=0.9),
    "Asphalt": material("Asphalt", "#4e4c49", roughness=1.0),
}

# ---------------------------------------------------------------- floor
# 2 x 2 m slabs with 15 mm expansion joints, a dark underlayer shows in the joints.
gap, depth = 0.015, 0.012
slabs = []
for ix in range(3):
    for iy in range(2):
        cx = -3 + 1 + ix * 2
        cy = -2 + 1 + iy * 2
        slabs.append(((2 - gap, 2 - gap, 0.05), (cx, cy, -0.025)))
boxes("Boden", slabs, P["Beton_Boden"], bevel=0.004)
# the underlayer's top sits `depth` below the slab top
box("Boden_Fugen", (6.0, 4.0, 0.03), (0, 0, -depth - 0.015), P["Fuge"])

# driveway outside the gate, flush with the slabs and running under the pillars so the
# threshold has no gap to the sky; the rest camera stands on it
box("Vorplatz", (9.0, 4.24, 0.05), (0, -4.12, -0.025), P["Asphalt"])

# ---------------------------------------------------------------- shell
box("Decke", (6.48, 4.48, 0.24), (0, 0, 2.92), P["Decke"])
box("Wand_Links", (0.24, 4.0, 2.8), (-3.12, 0, 1.4), P["Putz"])
box("Wand_Rechts", (0.24, 4.0, 2.8), (3.12, 0, 1.4), P["Putz"])

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
    P["Putz"],
)

# gate wall: pillars and lintel, opening 5.00 x 2.25
box("Pfeiler_L", (0.74, 0.24, 2.25), (-2.87, -2.12, 1.125), P["Putz"])
box("Pfeiler_R", (0.74, 0.24, 2.25), (2.87, -2.12, 1.125), P["Putz"])
box("Sturz", (6.48, 0.24, 0.55), (0, -2.12, 2.525), P["Putz"])

# skirting along the three walls and the inner pillar faces
boxes(
    "Sockelleiste",
    [
        ((0.02, 4.0, 0.10), (-2.99, 0, 0.05)),
        ((0.02, 4.0, 0.10), (2.99, 0, 0.05)),
        ((6.0, 0.02, 0.10), (0, 1.99, 0.05)),
        ((0.5, 0.02, 0.10), (-2.75, -1.99, 0.05)),
        ((0.5, 0.02, 0.10), (2.75, -1.99, 0.05)),
    ],
    P["Sockel"],
)

# ---------------------------------------------------------------- gate
# Sectional door, 5.10 wide behind the pillars. The lowest panel hangs in the
# opening (bottom edge 1.85), the rest lies under the ceiling on two tracks.
GW = 5.10
panel_t = 0.045



# hanging panel: outer face at y = -1.925
box("Tor_Segment", (GW, panel_t, 0.40), (0, -1.9, 2.05), P["Tor"], bevel=0.006)
# two embossed lines across the outer face and a rubber seal at the bottom
boxes(
    "Tor_Segment_Rippen",
    [
        ((GW, 0.006, 0.012), (0, -1.9 - panel_t / 2, 2.05 + 0.09)),
        ((GW, 0.006, 0.012), (0, -1.9 - panel_t / 2, 2.05 - 0.09)),
    ],
    P["Tor"],
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
box("Fensterbank", (wx1 - wx0 + 0.10, 0.10, 0.03), ((wx0 + wx1) / 2, 1.96, wz0 - 0.015), P["Putz"], bevel=0.004)

result = {"objects": sorted(o.name for o in collection().objects)}
