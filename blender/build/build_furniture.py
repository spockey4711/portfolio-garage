import bpy, bmesh
from math import radians, pi, cos, sin
from mathutils import Matrix, Vector

exec(open(LIB).read())  # LIB: absolute path to garage_lib.py, set by the caller

M = {m.name: m for m in bpy.data.materials}
M["Stahl"] = material("Stahl", "#4a4f57", roughness=0.45, metallic=0.5)
M["Kunststoff"] = material("Kunststoff", "#1a1b1d", roughness=0.5)
M["Alu_Dunkel"] = material("Alu_Dunkel", "#5c6066", roughness=0.35, metallic=0.7)
M["Papier"] = material("Papier", "#f2efe8", roughness=0.9)
M["Klebeband"] = material("Klebeband", "#d8c38f", roughness=0.6)


def multi(name, build, mats, bevel=None):
    """build(bm) fills the bmesh using material indices into `mats`."""
    bm = bmesh.new()
    build(bm)
    obj = multi_mesh_object(name, bm, mats)
    if bevel:
        add_bevel(obj, bevel)
    return obj


# ---------------------------------------------------------------- Werkbank
# steel frame, 5 cm beech top, lower shelf, one drawer block, a vice on the left
BX0, BX1, BY0, BY1, BZ = -2.9, -0.9, 1.4, 2.0, 0.90
box("Werkbank_Platte", (2.0, 0.6, 0.05), ((BX0 + BX1) / 2, (BY0 + BY1) / 2, BZ - 0.025), M["Holz"], bevel=0.006)
for n in ("Werkbank_Bein_L", "Werkbank_Bein_R"):
    remove(n)


def werkbank_gestell(bm):
    for x in (BX0 + 0.05, BX1 - 0.05):
        for y in (BY0 + 0.05, BY1 - 0.05):
            bm_box(bm, (0.05, 0.05, 0.85), (x, y, 0.425), 0)
    # rails under the top and around the lower shelf
    for y in (BY0 + 0.05, BY1 - 0.05):
        bm_box(bm, (1.9, 0.05, 0.05), ((BX0 + BX1) / 2, y, 0.825), 0)
        bm_box(bm, (1.9, 0.05, 0.04), ((BX0 + BX1) / 2, y, 0.20), 0)
    for x in (BX0 + 0.05, BX1 - 0.05):
        bm_box(bm, (0.05, 0.5, 0.05), (x, (BY0 + BY1) / 2, 0.825), 0)
        bm_box(bm, (0.05, 0.5, 0.04), (x, (BY0 + BY1) / 2, 0.20), 0)
    # lower shelf
    bm_box(bm, (1.9, 0.5, 0.025), ((BX0 + BX1) / 2, (BY0 + BY1) / 2, 0.2325), 1)


multi("Werkbank_Gestell", werkbank_gestell, [M["Metall_Dunkel"], M["Holz_Dunkel"]])


def werkbank_schublade(bm):
    bm_box(bm, (0.6, 0.5, 0.16), (BX1 - 0.40, (BY0 + BY1) / 2, 0.72), 0)
    bm_box(bm, (0.62, 0.02, 0.17), (BX1 - 0.40, BY0 + 0.04, 0.72), 0)  # front
    bm_box(bm, (0.20, 0.02, 0.02), (BX1 - 0.40, BY0 + 0.02, 0.72), 1)  # handle


multi("Werkbank_Schublade", werkbank_schublade, [M["Stahl"], M["Metall_Hell"]], bevel=0.004)


def schraubstock(bm):
    x, y = BX0 + 0.16, BY0 + 0.10
    bm_box(bm, (0.12, 0.16, 0.03), (x, y + 0.04, BZ + 0.015), 0)  # base
    bm_box(bm, (0.12, 0.05, 0.09), (x, y + 0.09, BZ + 0.075), 0)  # fixed jaw body
    bm_box(bm, (0.12, 0.05, 0.09), (x, y - 0.01, BZ + 0.075), 0)  # moving jaw body
    bm_box(bm, (0.12, 0.012, 0.03), (x, y + 0.058, BZ + 0.105), 1)  # jaw plates
    bm_box(bm, (0.12, 0.012, 0.03), (x, y + 0.021, BZ + 0.105), 1)
    bm_cyl(bm, 0.012, 0.16, (x, y + 0.04, BZ + 0.06), "y", 8, mat_index=1)  # spindle
    bm_cyl(bm, 0.006, 0.18, (x, y - 0.035, BZ + 0.06), "x", 6, mat_index=1)  # handle


multi("Schraubstock", schraubstock, [M["Metall_Dunkel"], M["Metall_Hell"]])

# ---------------------------------------------------------------- Schrank
# steel workshop cabinet against the left wall, doors face into the room (+x).
# It stands towards the gate so that from Cam_Ruhe its door edge (x -2.5,
# y -0.75) clears the bench's left end (x -2.9, y 1.4) and the pegboard.
SX0, SX1, SY0, SY1, SH = -3.0, -2.5, -0.75, 0.25, 2.0


def schrank(bm):
    bm_box(bm, (SX1 - SX0 - 0.02, SY1 - SY0, SH - 0.08), ((SX0 + SX1) / 2 - 0.01, (SY0 + SY1) / 2, 0.08 + (SH - 0.08) / 2), 0)
    bm_box(bm, (SX1 - SX0 - 0.06, SY1 - SY0 - 0.04, 0.08), ((SX0 + SX1) / 2 - 0.03, (SY0 + SY1) / 2, 0.04), 1)  # plinth
    bm_box(bm, (SX1 - SX0, SY1 - SY0 + 0.01, 0.02), ((SX0 + SX1) / 2, (SY0 + SY1) / 2, SH - 0.01), 0)  # top


multi("Schrank", schrank, [M["Stahl"], M["Sockel"]], bevel=0.004)
for n, yc in (("Schrank_Tuer_L", (SY0 + SY1) / 2 + 0.25), ("Schrank_Tuer_R", (SY0 + SY1) / 2 - 0.25)):
    def door(bm, yc=yc):
        bm_box(bm, (0.02, 0.485, SH - 0.08 - 0.06), (SX1 - 0.01, yc, 0.11 + (SH - 0.08 - 0.06) / 2), 0)
        for k in range(3):  # ventilation louvres at the top
            bm_box(bm, (0.006, 0.30, 0.010), (SX1 + 0.002, yc, SH - 0.20 + k * 0.03), 1)
    multi(n, door, [M["Stahl"], M["Sockel"]], bevel=0.004)


def griffe(bm):
    for y in ((SY0 + SY1) / 2 + 0.035, (SY0 + SY1) / 2 - 0.035):
        bm_box(bm, (0.025, 0.018, 0.14), (SX1 + 0.012, y, 1.05), 0)
        bm_box(bm, (0.012, 0.018, 0.02), (SX1 + 0.006, y, 1.11), 0)
        bm_box(bm, (0.012, 0.018, 0.02), (SX1 + 0.006, y, 0.99), 0)


multi("Schrank_Griffe", griffe, [M["Metall_Hell"]])

# ---------------------------------------------------------------- Regal
# heavy-duty rack under the window, rear right corner; 0.60 wide so its
# front post stays right of the cork board from Cam_Ruhe
RX0, RX1, RY0, RY1, RH = 2.35, 2.95, 1.58, 1.98, 1.75


def regal(bm):
    for x in (RX0 + 0.015, RX1 - 0.015):
        for y in (RY0 + 0.015, RY1 - 0.015):
            bm_box(bm, (0.03, 0.03, RH), (x, y, RH / 2), 0)
    for z in (0.12, 0.60, 1.08, 1.56):
        bm_box(bm, (RX1 - RX0, RY1 - RY0, 0.03), ((RX0 + RX1) / 2, (RY0 + RY1) / 2, z + 0.015), 0)  # steel lip
        bm_box(bm, (RX1 - RX0 - 0.06, RY1 - RY0 - 0.06, 0.018), ((RX0 + RX1) / 2, (RY0 + RY1) / 2, z + 0.039), 1)  # board


multi("Regal", regal, [M["Metall_Dunkel"], M["Holz_Dunkel"]])

# ---------------------------------------------------------------- Rollentrainer
# direct-drive trainer against the right wall
TX, TY = 2.55, 0.3


def rollentrainer(bm):
    # two folding legs, an A on each side
    for sgn in (-1, 1):
        bm_box(bm, (0.04, 0.62, 0.03), (TX + sgn * 0.02, TY, 0.015), 0)
    bm_box(bm, (0.08, 0.04, 0.03), (TX, TY + 0.29, 0.015), 0)
    bm_box(bm, (0.08, 0.04, 0.03), (TX, TY - 0.29, 0.015), 0)
    bm_box(bm, (0.16, 0.24, 0.32), (TX, TY, 0.20), 0)  # body
    bm_cyl(bm, 0.17, 0.05, (TX - 0.11, TY, 0.28), "x", 16, mat_index=1)  # flywheel
    bm_cyl(bm, 0.055, 0.045, (TX + 0.11, TY, 0.28), "x", 12, mat_index=2)  # cassette
    bm_cyl(bm, 0.02, 0.09, (TX + 0.13, TY, 0.28), "x", 8, mat_index=1)  # axle
    bm_box(bm, (0.16, 0.05, 0.16), (TX, TY - 0.10, 0.40), 0)  # top with the axle cradle


multi("Rollentrainer", rollentrainer, [M["Kunststoff"], M["Metall_Dunkel"], M["Metall_Hell"]], bevel=0.005)

# ---------------------------------------------------------------- Kartons
def karton(name, size, center, rot_z):
    sx, sy, sz = size
    def build(bm):
        bm_box(bm, size, (0, 0, 0), 0)
        bm_box(bm, (0.05, sy + 0.004, 0.006), (0, 0, sz / 2), 1)  # tape across the top seam
        bm_box(bm, (sx + 0.004, 0.003, sz * 0.5), (0, 0, sz * 0.25), 2)  # edge line: flap fold
    obj = multi(name, build, [M["Karton"], M["Klebeband"], M["Fuge"]], bevel=0.004)
    obj.location = center
    obj.rotation_euler = (0, 0, rot_z)
    return obj


karton("Karton_1", (0.6, 0.4, 0.4), (2.55, 1.15, 0.2), radians(4))
karton("Karton_2", (0.5, 0.36, 0.36), (2.55, 1.15, 0.58), radians(-14))

# ---------------------------------------------------------------- Pinnwand
# cork board, x 1.30..2.20, z 1.20..1.80, 3 cm frame in dark wood
PX, PZ, PW, PH = 1.75, 1.5, 0.9, 0.6


def pinnwand(bm):
    f = 0.03
    bm_box(bm, (PW, 0.025, f), (PX, 1.9875, PZ + PH / 2 - f / 2), 0)
    bm_box(bm, (PW, 0.025, f), (PX, 1.9875, PZ - PH / 2 + f / 2), 0)
    bm_box(bm, (f, 0.025, PH - 2 * f), (PX - PW / 2 + f / 2, 1.9875, PZ), 0)
    bm_box(bm, (f, 0.025, PH - 2 * f), (PX + PW / 2 - f / 2, 1.9875, PZ), 0)
    bm_box(bm, (PW - 2 * f, 0.015, PH - 2 * f), (PX, 1.9925, PZ), 1)


multi("Pinnwand", pinnwand, [M["Holz_Dunkel"], M["Kork"]])


def zettel(bm):
    y = 1.984
    for (dx, dz, w, h, rot) in ((-0.28, 0.12, 0.15, 0.21, 3), (-0.05, 0.14, 0.10, 0.15, -6), (0.20, 0.10, 0.18, 0.13, 2), (-0.20, -0.14, 0.21, 0.15, -2), (0.15, -0.12, 0.13, 0.18, 5)):
        m = Matrix.Translation((PX + dx, y, PZ + dz)) @ Matrix.Rotation(radians(rot), 4, "Y") @ Matrix.Diagonal((w, 0.002, h, 1))
        geom = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
        for v in geom["verts"]:
            for fc in v.link_faces:
                fc.material_index = 0
        # pin
        bm_cyl(bm, 0.005, 0.006, (PX + dx, y - 0.003, PZ + dz + h / 2 - 0.015), "y", 6, mat_index=1)


multi("Pinnwand_Zettel", zettel, [M["Papier"], M["Akzent"]])

# ---------------------------------------------------------------- Whiteboard
WX, WZ, WW, WH = 0.4, 1.5, 1.2, 0.9


def whiteboard(bm):
    f = 0.02
    bm_box(bm, (WW, 0.02, f), (WX, 1.99, WZ + WH / 2 - f / 2), 0)
    bm_box(bm, (WW, 0.02, f), (WX, 1.99, WZ - WH / 2 + f / 2), 0)
    bm_box(bm, (f, 0.02, WH - 2 * f), (WX - WW / 2 + f / 2, 1.99, WZ), 0)
    bm_box(bm, (f, 0.02, WH - 2 * f), (WX + WW / 2 - f / 2, 1.99, WZ), 0)
    bm_box(bm, (WW - 2 * f, 0.012, WH - 2 * f), (WX, 1.994, WZ), 1)
    bm_box(bm, (0.5, 0.06, 0.015), (WX, 1.96, WZ - WH / 2 + 0.0075), 0)  # pen tray
    bm_box(bm, (0.5, 0.008, 0.03), (WX, 1.934, WZ - WH / 2 + 0.022), 0)


multi("Whiteboard", whiteboard, [M["Metall_Hell"], M["Whiteboard"]])

# ---------------------------------------------------------------- Werkzeugwand
# pegboard with steel rails, x -2.95..-1.75, z 1.00..2.20
TWX, TWZ, TWS = -2.35, 1.6, 1.2


def werkzeugwand(bm):
    bm_box(bm, (TWS, 0.012, TWS), (TWX, 1.994, TWZ), 0)
    for z in (TWZ + TWS / 2 - 0.03, TWZ - TWS / 2 + 0.03):
        bm_box(bm, (TWS + 0.04, 0.03, 0.05), (TWX, 1.975, z), 1)


multi("Werkzeugwand", werkzeugwand, [M["Holz_Dunkel"], M["Metall_Dunkel"]])

# ---------------------------------------------------------------- Leuchte
for n in ("Leuchte_Arm", "Leuchte_Kopf"):
    remove(n)
LX = -1.0
j0 = Vector((LX, BY1 - 0.03, BZ + 0.03))  # clamp on the back edge of the bench
j1 = Vector((LX - 0.05, BY1 - 0.20, 1.38))
j2 = Vector((LX - 0.12, BY1 - 0.42, 1.52))


def leuchte(bm):
    bm_box(bm, (0.06, 0.08, 0.10), (LX, BY1 - 0.03, BZ), 0)  # clamp
    bm_box(bm, (0.06, 0.03, 0.02), (LX, BY1 - 0.03, BZ - 0.06), 0)
    bm_cyl(bm, 0.015, 0.04, (j0.x, j0.y, j0.z), "x", 8, mat_index=0)
    bm_tube(bm, j0, j1, 0.008, 8, 0)
    bm_cyl(bm, 0.015, 0.04, j1, "x", 8, mat_index=0)
    bm_tube(bm, j1, j2, 0.008, 8, 0)
    bm_cyl(bm, 0.015, 0.04, j2, "x", 8, mat_index=0)
    # head: a cone pointing down towards the laptop
    d = Vector((-0.15, -0.45, -1.0)).normalized()
    rot = d.to_track_quat("-Z", "Y").to_matrix().to_4x4()
    m = Matrix.Translation(j2 + d * 0.08) @ rot
    geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=12, radius1=0.02, radius2=0.075, depth=0.14, matrix=m)
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = 1
    geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=12, radius1=0.04, radius2=0.04, depth=0.01, matrix=Matrix.Translation(j2 + d * 0.13) @ rot)
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = 2


multi("Leuchte", leuchte, [M["Metall_Dunkel"], M["Akzent"], M["Whiteboard"]])

# ---------------------------------------------------------------- Radio
RXc, RYc = -1.3, 1.85


def radio(bm):
    bm_box(bm, (0.25, 0.12, 0.15), (RXc, RYc, BZ + 0.075), 0)
    bm_cyl(bm, 0.05, 0.006, (RXc - 0.06, RYc - 0.06, BZ + 0.075), "y", 12, mat_index=1)  # speaker
    bm_box(bm, (0.08, 0.006, 0.03), (RXc + 0.06, RYc - 0.06, BZ + 0.105), 2)  # display
    bm_cyl(bm, 0.012, 0.012, (RXc + 0.04, RYc - 0.064, BZ + 0.05), "y", 8, mat_index=3)  # knobs
    bm_cyl(bm, 0.012, 0.012, (RXc + 0.085, RYc - 0.064, BZ + 0.05), "y", 8, mat_index=3)
    bm_tube(bm, (RXc + 0.10, RYc + 0.04, BZ + 0.15), (RXc + 0.18, RYc + 0.06, BZ + 0.40), 0.004, 6, 3)  # antenna
    bm_box(bm, (0.14, 0.03, 0.02), (RXc, RYc, BZ + 0.16), 0)  # handle


multi("Radio", radio, [M["Kunststoff"], M["Fuge"], M["Display"], M["Metall_Hell"]], bevel=0.004)

# ---------------------------------------------------------------- Laptop
lap = bpy.data.objects["Laptop"]
LXc, LYc = -1.8, 1.5
tilt = -0.175


def laptop_basis(bm):
    bm_box(bm, (0.32, 0.22, 0.016), (LXc, LYc, BZ + 0.008), 0)
    bm_box(bm, (0.28, 0.11, 0.003), (LXc, LYc + 0.04, BZ + 0.016), 1)  # keyboard
    bm_box(bm, (0.11, 0.065, 0.002), (LXc, LYc - 0.065, BZ + 0.016), 1)  # touchpad
    for x in (LXc - 0.12, LXc + 0.12):
        bm_cyl(bm, 0.007, 0.05, (x, LYc + 0.113, BZ + 0.014), "x", 8, mat_index=1)  # hinges


b = multi("Laptop_Basis", laptop_basis, [M["Alu_Dunkel"], M["Kunststoff"]], bevel=0.003)
parent_to(b, lap)

# display face: 0.30 x 0.19 panel centred where Ziel_Laptop points, lid 4 mm behind it
disp_c = Vector((LXc, 1.628, 1.013))
rot = Matrix.Rotation(tilt, 4, "X")
n = rot @ Vector((0, -1, 0))


def cube_at(bm, center, size, rotm, mi):
    m = Matrix.Translation(center) @ rotm @ Matrix.Diagonal((size[0], size[1], size[2], 1))
    geom = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = mi


bm = bmesh.new()
cube_at(bm, disp_c, (0.30, 0.004, 0.19), rot, 0)
d = multi_mesh_object("Laptop_Display", bm, [M["Display"]])
parent_to(d, lap)


def laptop_deckel(bm):
    cube_at(bm, disp_c - n * 0.004, (0.325, 0.006, 0.215), rot, 0)
    cube_at(bm, disp_c - n * 0.0005, (0.318, 0.001, 0.208), rot, 1)  # bezel ring around the panel


dk = multi("Laptop_Deckel", laptop_deckel, [M["Alu_Dunkel"], M["Kunststoff"]], bevel=0.003)
parent_to(dk, lap)

result = {"objects": sorted(o.name for o in collection().objects)}
