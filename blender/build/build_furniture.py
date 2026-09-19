import bpy, bmesh
import json
import os
from math import radians, pi, cos, sin
from mathutils import Matrix, Vector

exec(open(LIB).read())  # LIB: absolute path to garage_lib.py, set by the caller

M = {m.name: m for m in bpy.data.materials}
M["Kunststoff"] = material("Kunststoff", "#1a1b1d", roughness=0.5)
M["Alu_Dunkel"] = material("Alu_Dunkel", "#5c6066", roughness=0.35, metallic=0.7)
M["Papier"] = material("Papier", "#f2efe8", roughness=0.9)
M["Klebeband"] = material("Klebeband", "#d8c38f", roughness=0.6)
M["Kunststoff_Hell"] = material("Kunststoff_Hell", "#e9e5dc", roughness=0.55)


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


multi("Werkbank_Schublade", werkbank_schublade, [M["Lack_Gruen"], M["Metall_Hell"]], bevel=0.004)


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


multi("Schrank", schrank, [M["Lack_Gruen"], M["Sockel"]], bevel=0.004)
for n, yc in (("Schrank_Tuer_L", (SY0 + SY1) / 2 + 0.25), ("Schrank_Tuer_R", (SY0 + SY1) / 2 - 0.25)):
    def door(bm, yc=yc):
        bm_box(bm, (0.02, 0.485, SH - 0.08 - 0.06), (SX1 - 0.01, yc, 0.11 + (SH - 0.08 - 0.06) / 2), 0)
        for k in range(3):  # ventilation louvres at the top
            bm_box(bm, (0.006, 0.30, 0.010), (SX1 + 0.002, yc, SH - 0.20 + k * 0.03), 1)
    multi(n, door, [M["Lack_Gruen"], M["Sockel"]], bevel=0.004)


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
# cork board centred at x 1.75, z 1.50, a 3 cm frame in dark wood around the cork
# face. The face and what hangs on it come from lib/garage/pinboard.json, which
# Pinboard.tsx reads too: the web lays its DOM (race numbers, photos, notes as
# links) on the cork, item for item over the paper stand-ins built here, so the
# still and the far view show the same board as the close-up.
with open(os.path.join(os.path.dirname(LIB), "..", "..", "lib", "garage", "pinboard.json")) as f:
    PINBOARD = json.load(f)
PX, PZ = 1.75, 1.5
PF = 0.03
PW, PH = PINBOARD["cork"]["width"] + 2 * PF, PINBOARD["cork"]["height"] + 2 * PF
M["Foto"] = material("Foto", "#8d9694", roughness=0.4)  # a print seen from across the room


def pinnwand_rahmen(bm):
    bm_box(bm, (PW, 0.025, PF), (PX, 1.9875, PZ + PH / 2 - PF / 2), 0)
    bm_box(bm, (PW, 0.025, PF), (PX, 1.9875, PZ - PH / 2 + PF / 2), 0)
    bm_box(bm, (PF, 0.025, PH - 2 * PF), (PX - PW / 2 + PF / 2, 1.9875, PZ), 0)
    bm_box(bm, (PF, 0.025, PH - 2 * PF), (PX + PW / 2 - PF / 2, 1.9875, PZ), 0)


# one single-material mesh each: the web wants the cork as one mesh to put its
# DOM on (lib/garage/hotspots.ts, display), and a multi-material object would
# come out of the GLB as a group of one mesh per material
board = multi("Pinnwand", pinnwand_rahmen, [M["Holz_Dunkel"]])


def pinnwand_kork(bm):
    bm_box(bm, (PW - 2 * PF, 0.015, PH - 2 * PF), (PX, 1.9925, PZ), 0)


parent_to(multi("Pinnwand_Kork", pinnwand_kork, [M["Kork"]]), board)

PIN_MATERIAL = {"startnummer": 0, "foto": 2, "zettel": 0}


def zettel(bm):
    y = 1.984
    for item in PINBOARD["items"].values():
        dx, dz, w, h, rot = item["x"], item["y"], item["width"], item["height"], item["rotation"]
        # rotation about +Y: clockwise as seen from the room, like CSS rotate()
        m = Matrix.Translation((PX + dx, y, PZ + dz)) @ Matrix.Rotation(radians(rot), 4, "Y") @ Matrix.Diagonal((w, 0.002, h, 1))
        geom = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
        for v in geom["verts"]:
            for fc in v.link_faces:
                fc.material_index = PIN_MATERIAL[item["kind"]]
        # pin, at the top centre of the item, before the rotation tilts it
        pin = m @ Vector((0, 0, 0.5 - PINBOARD["cork"]["pinInset"] / h))
        bm_cyl(bm, 0.005, 0.006, (pin.x, y - 0.003, pin.z), "y", 6, mat_index=1)


parent_to(multi("Pinnwand_Zettel", zettel, [M["Papier"], M["Akzent"], M["Foto"]]), board)

# ---------------------------------------------------------------- Whiteboard
# aluminium frame with pen tray, the white face its own single-material mesh:
# the web lays the handwriting (Whiteboard.tsx, transparent DOM) on that face
# (lib/garage/hotspots.ts, display), same split as the pinboard's cork
WX, WZ, WW, WH = 0.4, 1.5, 1.2, 0.9
WF = 0.02


def whiteboard_rahmen(bm):
    bm_box(bm, (WW, 0.02, WF), (WX, 1.99, WZ + WH / 2 - WF / 2), 0)
    bm_box(bm, (WW, 0.02, WF), (WX, 1.99, WZ - WH / 2 + WF / 2), 0)
    bm_box(bm, (WF, 0.02, WH - 2 * WF), (WX - WW / 2 + WF / 2, 1.99, WZ), 0)
    bm_box(bm, (WF, 0.02, WH - 2 * WF), (WX + WW / 2 - WF / 2, 1.99, WZ), 0)
    bm_box(bm, (0.5, 0.06, 0.015), (WX, 1.96, WZ - WH / 2 + 0.0075), 0)  # pen tray
    bm_box(bm, (0.5, 0.008, 0.03), (WX, 1.934, WZ - WH / 2 + 0.022), 0)


wb = multi("Whiteboard", whiteboard_rahmen, [M["Metall_Hell"]])


def whiteboard_flaeche(bm):
    bm_box(bm, (WW - 2 * WF, 0.012, WH - 2 * WF), (WX, 1.994, WZ), 0)


parent_to(multi("Whiteboard_Flaeche", whiteboard_flaeche, [M["Whiteboard"]]), wb)

# ---------------------------------------------------------------- Werkzeugwand
# shadow board with steel rails, x -2.95..-1.75, z 1.00..2.20. The plate is
# its own single-material mesh: the web lays its DOM (ToolWall.tsx, the tape
# label above every hook, the projects on hover) on that face
# (lib/garage/hotspots.ts, display), same split as the pinboard's cork. What
# hangs on it comes from lib/garage/tools.json, which ToolWall.tsx reads too:
# every entry is one tool, drawn from a few primitives inside its box, with a
# hook above it and its silhouette painted on the plate, so the still and the
# far view show the board full and the web's hover boxes lie on the tools.
with open(os.path.join(os.path.dirname(LIB), "..", "..", "lib", "garage", "tools.json")) as f:
    TOOLS = json.load(f)
TWX, TWZ = -2.35, 1.6
TWW, TWH = TOOLS["board"]["width"], TOOLS["board"]["height"]
TW_FACE = 1.988  # front of the plate
TW_GAP = 0.004  # a tool hangs this far off the plate
TW_SHADOW = 0.008  # the painted silhouette reaches this far past the tool
M["Griff"] = material("Griff", "#b0352c", roughness=0.7)
M["Schatten"] = material("Schatten", "#b39b76", roughness=0.9)  # faded paint on the dark plate


def werkzeugwand(bm):
    for z in (TWZ + TWH / 2 - 0.03, TWZ - TWH / 2 + 0.03):
        bm_box(bm, (TWW + 0.04, 0.03, 0.05), (TWX, 1.975, z), 0)


tw = multi("Werkzeugwand", werkzeugwand, [M["Metall_Dunkel"]])


def werkzeugwand_platte(bm):
    bm_box(bm, (TWW, 0.012, TWH), (TWX, 1.994, TWZ), 0)


parent_to(multi("Werkzeugwand_Platte", werkzeugwand_platte, [M["Holz_Dunkel"]]), tw)

# A tool is a list of primitives in its own space: u to the right, v up, in
# metres from the centre of its box; the same list draws the tool and,
# flattened and grown by TW_SHADOW, its silhouette. Rotation is about the
# plate's normal, clockwise as seen from the room, like CSS rotate().
#   ("box", u, v, width, height, depth, rot, mat)
#   ("rod", u, v, radius, length, rot, mat)   a cylinder along v
#   ("disc", u, v, radius, depth, mat)        a cylinder along the normal
MET, PLA, GRIP, SHADOW, HOOK, WOOD, LEVER = range(7)


def drehmomentschluessel(w, h):
    return [
        ("rod", 0, h * 0.1, 0.009, h * 0.55, 0, MET),
        ("rod", 0, -h / 2 + h * 0.15, w * 0.45, h * 0.3, 0, GRIP),
        ("disc", 0, h / 2 - w / 2, w / 2, 0.014, MET),
        ("box", 0, -h * 0.12, 0.018, 0.045, 0.02, 0, PLA),
    ]


def maulschluessel(w, h):
    prims = [("box", 0, 0, 0.02, h * 0.72, 0.006, 0, MET)]
    for s in (1, -1):
        prims.append(("box", 0, s * (h / 2 - w * 0.55), w, w * 0.25, 0.006, 0, MET))
        for side in (1, -1):
            prims.append(("box", side * (w / 2 - w * 0.11), s * (h / 2 - w * 0.275), w * 0.22, w * 0.55, 0.006, 0, MET))
    return prims


def ringschluessel(w, h):
    prims = [("box", 0, 0, 0.018, h - w, 0.006, 0, MET)]
    for s in (1, -1):
        prims.append(("disc", 0, s * (h / 2 - w / 2), w / 2, 0.008, MET))
        prims.append(("disc", 0, s * (h / 2 - w / 2), w * 0.2, 0.0095, PLA))  # reads as the hole
    return prims


def hammer(w, h):
    return [
        ("box", 0, -0.0225, 0.026, h - 0.045, 0.026, 0, WOOD),
        ("box", 0, h / 2 - 0.0225, w, 0.045, 0.03, 0, MET),
    ]


def schraubendreher(w, h):
    return [
        ("rod", 0, -h / 2 + h * 0.21, w / 2, h * 0.42, 0, GRIP),
        ("rod", 0, h / 2 - h * 0.3, 0.004, h * 0.6, 0, MET),
        ("box", 0, h / 2 - 0.006, 0.007, 0.012, 0.002, 0, MET),
    ]


def zange(w, h):
    return [
        ("box", -0.008, h * 0.32, 0.014, h * 0.36, 0.008, -5, MET),
        ("box", 0.008, h * 0.32, 0.014, h * 0.36, 0.008, 5, MET),
        ("disc", 0, h * 0.12, 0.016, 0.012, MET),
        ("box", -w * 0.28, -h * 0.2, 0.016, h * 0.6, 0.012, 14, GRIP),
        ("box", w * 0.28, -h * 0.2, 0.016, h * 0.6, 0.012, -14, GRIP),
    ]


def saege(w, h):
    return [
        ("box", -w / 2 + 0.02, h * 0.05, 0.016, h * 0.75, 0.01, 0, MET),
        ("box", 0, h / 2 - 0.03, w - 0.02, 0.016, 0.01, 0, MET),
        ("box", 0, -h / 2 + 0.08, w - 0.02, 0.016, 0.01, 0, MET),
        ("box", w / 2 - 0.01, 0.025, 0.003, h - 0.11, 0.012, 0, MET),
        ("box", -w / 2 + 0.025, -h / 2 + 0.045, 0.03, 0.09, 0.02, 10, PLA),
    ]


def inbus(w, h):
    prims = []
    for i in range(3):
        s = 1 - 0.2 * i
        u, r = -w / 2 + w * (0.2 + 0.3 * i), 0.004 * s
        long, short = h * 0.8 * s, 0.04 * s
        prims.append(("box", u, h / 2 - long / 2, 2 * r, long, 2 * r, 0, MET))
        prims.append(("box", u + short / 2, h / 2 - r, short, 2 * r, 2 * r, 0, MET))
    return prims


def kettenpeitsche(w, h):
    return [
        ("box", 0, -h * 0.1, 0.022, h * 0.7, 0.006, 0, MET),
        ("box", 0, -h / 2 + h * 0.14, 0.03, h * 0.28, 0.014, 0, GRIP),
        ("box", -0.02, h / 2 - 0.045, 0.008, 0.05, 0.006, -25, MET),
        ("box", 0.02, h / 2 - 0.045, 0.008, 0.05, 0.006, 25, MET),
        ("box", 0, h / 2 - 0.006, w * 0.7, 0.008, 0.006, 0, MET),
    ]


def kassettenabzieher(w, h):
    return [
        ("disc", 0, h / 2 - w / 2, w / 2, 0.02, MET),
        ("disc", 0, h / 2 - w / 2, w * 0.3, 0.026, HOOK),
        ("box", 0, -w / 2, 0.016, h - w, 0.008, 0, MET),
    ]


def reifenheber(w, h):
    prims = []
    for u in (-w / 4, w / 4):
        prims.append(("box", u, -h * 0.05, w * 0.36, h * 0.9, 0.006, 0, LEVER))
        prims.append(("box", u, h / 2 - 0.0075, w * 0.44, 0.015, 0.008, 0, LEVER))
    return prims


def kettennieter(w, h):
    return [
        ("box", 0, h / 2 - 0.015, w, 0.03, 0.03, 0, MET),
        ("box", 0, -0.015, 0.012, h - 0.03, 0.012, 0, MET),
        ("disc", 0, -h / 2 + 0.014, 0.014, 0.016, PLA),
    ]


SHAPES = {f.__name__: f for f in (
    drehmomentschluessel, maulschluessel, ringschluessel, hammer, schraubendreher, zange,
    saege, inbus, kettenpeitsche, kassettenabzieher, reifenheber, kettennieter,
)}


def _paint(geom, mat):
    for v in geom["verts"]:
        for fc in v.link_faces:
            fc.material_index = mat


def _place(bm, prim, cx, cz, shadow):
    """One primitive in world space, or its silhouette on the plate when `shadow`."""
    kind, u, v = prim[0], prim[1], prim[2]
    at = Matrix.Translation((cx + u, 0, cz + v))
    if kind == "disc":
        _, _, _, r, depth, mat = prim
        r, depth, mat = (r + TW_SHADOW, 0.001, SHADOW) if shadow else (r, depth, mat)
        m = at @ Matrix.Translation((0, TW_FACE - depth / 2, 0)) @ Matrix.Rotation(radians(-90), 4, "X")
        _paint(bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=12, radius1=r, radius2=r, depth=depth, matrix=m), mat)
        return
    if kind == "rod":
        _, _, _, r, length, rot, mat = prim
        if not shadow:
            m = at @ Matrix.Translation((0, TW_FACE - TW_GAP - r, 0)) @ Matrix.Rotation(radians(rot), 4, "Y")
            _paint(bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8, radius1=r, radius2=r, depth=length, matrix=m), mat)
            return
        prim = ("box", u, v, 2 * r, length, 2 * r, rot, mat)
    _, _, _, w, h, depth, rot, mat = prim
    if shadow:
        w, h, depth, mat = w + TW_SHADOW, h + TW_SHADOW, 0.001, SHADOW
    m = at @ Matrix.Translation((0, TW_FACE - (0 if shadow else TW_GAP) - depth / 2, 0)) @ Matrix.Rotation(radians(rot), 4, "Y") @ Matrix.Diagonal((w, depth, h, 1))
    _paint(bmesh.ops.create_cube(bm, size=1.0, matrix=m), mat)


def werkzeuge(bm):
    for name, item in TOOLS["tools"].items():
        cx, cz, w, h = TWX + item["x"], TWZ + item["y"], item["width"], item["height"]
        prims = SHAPES[item["shape"]](w, h)
        for prim in prims:
            _place(bm, prim, cx, cz, shadow=True)
        for prim in prims:
            _place(bm, prim, cx, cz, shadow=False)
        # the hook: a peg out of the plate just under the top of the box, with its plate
        hz = cz + h / 2 - 0.012
        bm_cyl(bm, 0.004, 0.03, (cx, TW_FACE - 0.015, hz), "y", 6, mat_index=HOOK)
        bm_cyl(bm, 0.009, 0.003, (cx, TW_FACE - 0.0015, hz), "y", 8, mat_index=HOOK)


parent_to(
    multi("Werkzeugwand_Werkzeuge", werkzeuge, [M["Metall_Hell"], M["Kunststoff"], M["Griff"], M["Schatten"], M["Metall_Dunkel"], M["Holz_Dunkel"], M["Akzent"]]),
    tw,
)

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
    bm_tube(bm, (RXc - 0.10, RYc + 0.04, BZ + 0.15), (RXc - 0.20, RYc + 0.06, BZ + 0.37), 0.004, 6, 3)  # antenna, left: the lamp cable hangs on the right
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

# ---------------------------------------------------------------- Steckdosenleiste
# on the back wall over the right end of the bench, between the pegboard and the lamp;
# the lamp plugs in on the right, the laptop's power brick on the left. Cables are
# curves (ATMOSPHAERE §3): one sagging loop says "used" more than any box.
LSX, LSZ, LSW, LSD = -1.48, 1.30, 0.28, 0.04
LS_FRONT = 2.0 - LSD
SOCKETS = [LSX + dx for dx in (-0.09, -0.03, 0.03, 0.09)]
PLUGGED = (SOCKETS[3], SOCKETS[0])  # lamp, power brick


def steckdosenleiste(bm):
    bm_box(bm, (LSW, LSD, 0.055), (LSX, 2.0 - LSD / 2, LSZ), 0)
    for x in SOCKETS:
        bm_cyl(bm, 0.0175, 0.004, (x, LS_FRONT + 0.001, LSZ), "y", 12, mat_index=1)  # socket well
    bm_box(bm, (0.02, 0.008, 0.012), (LSX + LSW / 2 - 0.025, LS_FRONT - 0.004, LSZ), 2)  # switch
    for x in PLUGGED:
        bm_cyl(bm, 0.017, 0.022, (x, LS_FRONT - 0.011, LSZ), "y", 12, mat_index=3)  # Schuko plug


multi("Steckdosenleiste", steckdosenleiste, [M["Kunststoff_Hell"], M["Fuge"], M["Akzent"], M["Kunststoff"]], bevel=0.003)


def plug_end(x, dz=0.0):
    """Two points that bring a cable into the plug at socket x from the front."""
    return [(x + 0.02, LS_FRONT - 0.06, LSZ - 0.015 + dz), (x, LS_FRONT - 0.024, LSZ)]


# lamp cable: out of the elbow joint, one loop down the wall, into the right plug
curve(
    "Leuchte_Kabel",
    [(j1.x, j1.y + 0.012, j1.z - 0.005), (-1.12, 1.90, 1.24), (-1.22, 1.93, 1.12), (-1.32, 1.92, 1.16), *plug_end(PLUGGED[0])],
    0.003,
    M["Kunststoff"],
)
# the strip's own cord: down the wall and out of sight behind the radio
curve(
    "Steckdosenleiste_Kabel",
    [(LSX + LSW / 2 + 0.004, 1.98, LSZ - 0.01), (-1.32, 1.987, 1.20), (-1.30, 1.987, 1.05), (-1.28, 1.987, 0.91), (-1.25, 1.95, 0.906), (-1.25, 1.88, 0.906)],
    0.003,
    M["Kunststoff"],
)

# ---------------------------------------------------------------- Netzteil
# power brick at the back of the bench, USB-C lead in a lazy S to the laptop's left
# side, mains cord along the wall and up into the strip's left socket
NX, NY, NROT = -2.36, 1.82, radians(12)


def netzteil(bm):
    rot = Matrix.Rotation(NROT, 4, "Z")
    cube_at(bm, (NX, NY, BZ + 0.014), (0.11, 0.05, 0.028), rot, 0)
    cube_at(bm, (NX + 0.03, NY + 0.006 - 0.025, BZ + 0.024), (0.006, 0.002, 0.003), rot, 1)  # LED


multi("Netzteil", netzteil, [M["Kunststoff"], M["Akzent"]], bevel=0.003)
n_axis = Vector((cos(NROT), sin(NROT), 0))
n_in = Vector((NX, NY, BZ + 0.012)) + n_axis * 0.055
n_out = Vector((NX, NY, BZ + 0.012)) - n_axis * 0.055
curve(
    "Laptop_Kabel",
    [(LXc - 0.155, LYc + 0.02, BZ + 0.008), (-2.00, 1.52, 0.906), (-2.12, 1.49, 0.903), (-2.24, 1.56, 0.902), (-2.28, 1.70, 0.902), n_in],
    0.002,
    M["Kunststoff"],
)
curve(
    "Netzteil_Kabel",
    [n_out, (-2.48, 1.88, 0.906), (-2.40, 1.975, 0.905), (-2.00, 1.985, 0.905), (-1.70, 1.985, 0.92), (-1.62, 1.97, 1.12), *plug_end(PLUGGED[1], dz=0.01)],
    0.003,
    M["Kunststoff"],
)

# ---------------------------------------------------------------- Standpumpe
# floor pump against the left wall on the gate side of the cabinet, hose in a loop on
# the floor with the chuck at its end
SPX, SPY = -2.84, -1.10


def standpumpe(bm):
    bm_box(bm, (0.26, 0.07, 0.018), (SPX, SPY, 0.009), 0)  # foot
    bm_cyl(bm, 0.019, 0.60, (SPX, SPY, 0.018 + 0.30), "z", 12, mat_index=0)  # barrel
    bm_cyl(bm, 0.008, 0.10, (SPX, SPY, 0.618 + 0.05), "z", 8, mat_index=1)  # piston rod
    bm_box(bm, (0.30, 0.03, 0.028), (SPX, SPY, 0.71), 2)  # handle
    bm_cyl(bm, 0.032, 0.014, (SPX, SPY - 0.03, 0.14), "y", 16, mat_index=0)  # gauge housing
    bm_cyl(bm, 0.026, 0.004, (SPX, SPY - 0.038, 0.14), "y", 16, mat_index=3)  # gauge face
    bm_cyl(bm, 0.008, 0.03, (SPX + 0.01, SPY - 0.025, 0.05), "y", 8, mat_index=1)  # hose fitting
    # chuck on the hose end, its long side along the hose's last tangent (0.6, 0.8)
    chuck = Matrix.Rotation(radians(53 - 90), 4, "Z")
    cube_at(bm, (-2.685, -1.380, 0.011), (0.022, 0.05, 0.022), chuck, 2)
    cube_at(bm, (-2.676, -1.368, 0.028), (0.008, 0.02, 0.014), chuck, 1)  # its lever


multi("Standpumpe", standpumpe, [M["Metall_Dunkel"], M["Metall_Hell"], M["Kunststoff"], M["Whiteboard"]], bevel=0.003)
curve(
    "Luftschlauch",
    [(SPX + 0.01, SPY - 0.04, 0.05), (-2.72, -1.22, 0.015), (-2.58, -1.36, 0.005), (-2.56, -1.52, 0.005), (-2.68, -1.58, 0.005), (-2.76, -1.48, 0.005), (-2.70, -1.40, 0.005)],
    0.004,
    M["Kunststoff"],
    segs=8,
)

# ---------------------------------------------------------------- Kleinkram
# The thirty small things that make the room lived-in (ATMOSPHAERE §2): what is
# a box, a cylinder or a curve comes from here, cloth and organic shapes are
# assets (ADR-0007). Nothing stands straight: every loose thing is turned a few
# degrees. Each group is one mesh, one drawcall.
M["Kunststoff_Grau"] = material("Kunststoff_Grau", "#585b5e", roughness=0.6)
M["Keramik"] = material("Keramik", "#efe9dd", roughness=0.35)
M["Kaffee"] = material("Kaffee", "#2b1a10", roughness=0.4)
M["Lack_Rot"] = material("Lack_Rot", "#a8352c", roughness=0.45)
M["Reifen"] = material("Reifen", "#232324", roughness=0.95)  # same values as build_bike.py
M["Felge"] = material("Felge", "#0f0f11", roughness=0.4)
M["Carbon_Matt"] = material("Carbon_Matt", "#1c1d20", roughness=0.7)


def turned(center, deg):
    """Placement for a loose thing: its centre, turned `deg` about z."""
    return Matrix.Translation(center) @ Matrix.Rotation(radians(deg), 4, "Z")


def bottle(bm, center, r, h, body, cap, cap_r=None, cap_h=0.025, band=None):
    """A bottle standing on `center`: body cylinder, cap on top, optional label band."""
    x, y, z = center
    bm_cyl(bm, r, h, (x, y, z + h / 2), "z", 12, mat_index=body)
    bm_cyl(bm, cap_r or r * 0.6, cap_h, (x, y, z + h + cap_h / 2), "z", 12, mat_index=cap)
    if band is not None:
        bm_cyl(bm, r + 0.0005, h * 0.35, (x, y, z + h * 0.45), "z", 12, mat_index=band)


def carton(bm, size, tape):
    """A closed cardboard box standing on the origin, tape across the top seam."""
    sx, sy, sz = size
    bm_box(bm, size, (0, 0, sz / 2), 0)
    bm_box(bm, (0.05, sy + 0.004, 0.004), (0, 0, sz), tape)


# -- on the bench: coffee mug by the radio, chain lube and a spare tube by the vice
def werkbank_kleinkram(bm):
    mx, my = -1.12, 1.56  # mug, front right where a hand rests
    bm_cyl(bm, 0.041, 0.095, (mx, my, BZ + 0.0475), "z", 16, mat_index=0)
    bm_cyl(bm, 0.036, 0.004, (mx, my, BZ + 0.085), "z", 16, mat_index=1)  # coffee
    bm_torus(bm, 0.024, 0.006, (mx + 0.046, my, BZ + 0.05), "y", 16, 6, 0)  # handle
    bottle(bm, (-2.22, 1.56, BZ), 0.021, 0.10, 2, 3, cap_r=0.012, cap_h=0.03, band=4)  # chain lube
    bm_cyl(bm, 0.004, 0.02, (-2.22, 1.56, BZ + 0.14), "z", 8, r2=0.0015, mat_index=3)  # its nozzle
    # inner tube, loosely coiled, at the back between the brick and the laptop
    coil = Matrix.Translation((-2.10, 1.83, BZ + 0.012)) @ Matrix.Rotation(radians(6), 4, "X")
    bm_placed(bm, coil, lambda bm: bm_torus(bm, 0.075, 0.012, (0, 0, 0), "z", 24, 6, 5))


wk = multi("Werkbank_Kleinkram", werkbank_kleinkram, [M["Keramik"], M["Kaffee"], M["Kunststoff_Hell"], M["Lack_Rot"], M["Akzent"], M["Gummi"]], bevel=0.002)
shade_smooth(wk, {0, 5})


# -- under the bench: toolbox and a crate on the lower shelf
def werkzeugkoffer(bm):
    bm_box(bm, (0.46, 0.22, 0.20), (0, 0, 0.10), 0)
    bm_box(bm, (0.47, 0.23, 0.012), (0, 0, 0.205), 0)  # lid
    bm_box(bm, (0.14, 0.03, 0.03), (0, 0, 0.23), 1)  # handle
    bm_box(bm, (0.05, 0.008, 0.03), (0, -0.115, 0.19), 1)  # latch


def kiste(bm, size, body, slot):
    sx, sy, sz = size
    bm_box(bm, size, (0, 0, sz / 2), body)
    bm_box(bm, (sx * 0.75, 0.012, 0.03), (0, -sy / 2, sz * 0.35), slot)  # grip slot, painted dark


def werkbank_ablage(bm):
    z = 0.245
    bm_placed(bm, turned((-2.35, 1.68, z), -4), werkzeugkoffer)
    bm_placed(bm, turned((-1.55, 1.72, z), 7), lambda bm: kiste(bm, (0.40, 0.30, 0.28), 2, 3))


multi("Werkbank_Ablage", werkbank_ablage, [M["Lack_Gruen"], M["Metall_Dunkel"], M["Kunststoff_Grau"], M["Fuge"]], bevel=0.004)

# -- the rack: crate and rolled tyre at the bottom, cans, folders, bottles above
RB = [0.168, 0.648, 1.128, 1.608]  # board tops
RGX, RGY = (RX0 + RX1) / 2, (RY0 + RY1) / 2


def regal_inhalt(bm):
    z = RB[0]
    bm_placed(bm, turned((RGX - 0.08, RGY + 0.02, z), -3), lambda bm: kiste(bm, (0.38, 0.28, 0.22), 0, 1))
    tyre = Matrix.Translation((RGX + 0.16, RGY - 0.02, z + 0.014)) @ Matrix.Rotation(radians(4), 4, "Y")
    bm_placed(bm, tyre, lambda bm: bm_torus(bm, 0.115, 0.014, (0, 0, 0), "z", 24, 6, 2))  # rolled tyre
    z = RB[1]
    for i, (dx, dy) in enumerate(((-0.20, 0.08), (-0.12, 0.09), (-0.05, 0.05))):  # spray cans
        bm_cyl(bm, 0.033, 0.19, (RGX + dx, RGY + dy, z + 0.095), "z", 12, mat_index=3)
        bm_cyl(bm, 0.030, 0.03, (RGX + dx, RGY + dy, z + 0.205), "z", 12, mat_index=4 if i else 5)
        bm_cyl(bm, 0.0335, 0.07, (RGX + dx, RGY + dy, z + 0.10), "z", 12, mat_index=(6, 5, 4)[i])  # label
    bm_placed(bm, turned((RGX + 0.14, RGY + 0.02, z), 6), lambda bm: carton(bm, (0.24, 0.18, 0.12), 8))
    z = RB[2]
    for dx, col, lean in ((-0.22, 9, 0), (-0.185, 7, 0), (-0.15, 0, 0), (-0.11, 6, 9)):  # folders, the last one leaning
        m = Matrix.Translation((RGX + dx, RGY + 0.03, z + 0.15)) @ Matrix.Rotation(radians(lean), 4, "Y")
        cube_at(bm, (0, 0, 0), (0.03, 0.26, 0.30), m, col)
    bottle(bm, (RGX + 0.10, RGY - 0.04, z), 0.037, 0.19, 4, 5, cap_r=0.02, cap_h=0.03)  # bidons
    bottle(bm, (RGX + 0.20, RGY + 0.06, z), 0.037, 0.19, 6, 5, cap_r=0.02, cap_h=0.03, band=4)
    z = RB[3]
    bm_placed(bm, turned((RGX + 0.05, RGY + 0.03, z), -5), lambda bm: carton(bm, (0.36, 0.26, 0.22), 8))
    bm_cyl(bm, 0.045, 0.12, (RGX - 0.20, RGY - 0.06, z + 0.06), "z", 12, mat_index=10)  # jar of bolts
    bm_cyl(bm, 0.046, 0.015, (RGX - 0.20, RGY - 0.06, z + 0.1275), "z", 12, mat_index=1)


ri = multi(
    "Regal_Inhalt",
    regal_inhalt,
    [M["Kunststoff_Grau"], M["Fuge"], M["Reifen"], M["Metall_Hell"], M["Akzent"], M["Kunststoff"], M["Lack_Rot"], M["Karton"], M["Klebeband"], M["Lack_Gruen"], M["Metall_Dunkel"]],
    bevel=0.003,
)
shade_smooth(ri, {2})

# -- the right wall from the gate inwards: spare wheel on a hook, helmet, a chain,
# the calendar over the trainer. The wall's inner face is x = 3.0; from Cam_Ruhe
# it is the one big empty surface in the sun.
WR = 3.0
R_WHEEL = 0.34


def ersatzlaufrad(bm):
    y, z = -1.08, 1.36
    c = Vector((WR - 0.075, y, z))
    bm_tube(bm, (WR, y, z + 0.30), (WR - 0.15, y, z + 0.30), 0.008, 8, 4)  # hook through the rim
    bm_tube(bm, (WR - 0.15, y, z + 0.30), (WR - 0.15, y, z + 0.36), 0.008, 8, 4)  # its lip, in front of the tyre
    bm_torus(bm, R_WHEEL - 0.014, 0.014, c, "x", 36, 8, 0)  # tyre
    bm_ring(bm, R_WHEEL - 0.078, R_WHEEL - 0.026, 0.027, c, "x", 36, 1)  # rim
    bm_ring(bm, R_WHEEL - 0.026, R_WHEEL - 0.014, 0.022, c, "x", 36, 1)
    bm_cyl(bm, 0.022, 0.10, c, "x", 12, mat_index=2)  # hub
    for i in range(20):
        a = 2 * pi * i / 20
        side = 0.032 if i % 2 else -0.032
        hub = c + Vector((side, 0.02 * cos(a + radians(25)), 0.02 * sin(a + radians(25))))
        rim = c + Vector((0, (R_WHEEL - 0.078) * cos(a), (R_WHEEL - 0.078) * sin(a)))
        bm_tube(bm, hub, rim, 0.0015, 4, 2)
    bm_ring(bm, 0.045, 0.08, 0.002, c + Vector((-0.058, 0, 0)), "x", 24, 3)  # rotor, room side
    bm_cyl(bm, 0.03, 0.004, c + Vector((-0.058, 0, 0)), "x", 12, mat_index=2)


el = multi("Ersatzlaufrad", ersatzlaufrad, [M["Reifen"], M["Felge"], M["Carbon_Matt"], M["Metall_Hell"], M["Metall_Dunkel"]])
shade_smooth(el, {0, 1})

# the helmet hangs by its strap, tipped back the way a helmet hangs: crown up and
# into the room, the opening down towards the wall. Built with the crown along
# -x and the front along +z, then tipped about y and moved onto its hook.
HY, HZ = -0.50, 1.72
HELM_M = Matrix.Translation((WR - 0.085, HY + 0.005, HZ - 0.15)) @ Matrix.Rotation(radians(65), 4, "Y")


def helm(bm):
    bm_tube(bm, (WR, HY, HZ), (WR - 0.05, HY, HZ), 0.005, 8, 3)  # hook
    bm_tube(bm, (WR - 0.05, HY, HZ), (WR - 0.05, HY, HZ + 0.025), 0.005, 8, 3)
    before = set(bm.verts)
    bm_dome(bm, (0, 0, 0), (0.17, 0.21, 0.27), (0.035, 0, -0.012), 0, 1)  # the rim sits lower at the back
    for k in (-0.075, -0.04, -0.005, 0.03, 0.065):  # vents: dark slots sunk into the crown
        cube_at(bm, (-0.074, k * 0.25, k), (0.012, 0.05, 0.008), Matrix.Rotation(radians(-12), 4, "X"), 1)
    bmesh.ops.transform(bm, matrix=HELM_M, verts=[v for v in bm.verts if v not in before])


hm = multi("Helm", helm, [M["Keramik"], M["Kunststoff"], M["Kunststoff"], M["Metall_Dunkel"]])
shade_smooth(hm, {0})
strap = [HELM_M @ Vector(p) for p in ((0.02, -0.03, -0.06), (0.02, -0.02, 0.0), (0.02, 0.02, 0.0), (0.02, 0.03, -0.06))]
curve("Helm_Riemen", [*strap[:2], (WR - 0.052, HY - 0.012, HZ + 0.012), (WR - 0.048, HY, HZ + 0.013), (WR - 0.052, HY + 0.012, HZ + 0.012), *strap[2:]], 0.0025, M["Kunststoff"], segs=4)

# a chain over a hook, both strands turned a little so the loop does not hang flat
bm = bmesh.new()
KY = -0.28
bm_tube(bm, (WR, KY, 1.50), (WR - 0.05, KY, 1.50), 0.005, 8, 0)
bm_tube(bm, (WR - 0.05, KY, 1.50), (WR - 0.05, KY, 1.525), 0.005, 8, 0)
multi_mesh_object("Ketten_Haken", bm, [M["Metall_Dunkel"]])
curve("Kette", [(WR - 0.03, KY - 0.02, 1.505), (WR - 0.045, KY - 0.05, 1.33), (WR - 0.04, KY - 0.015, 1.20), (WR - 0.03, KY + 0.03, 1.33), (WR - 0.03, KY + 0.02, 1.505)], 0.0055, M["Metall_Dunkel"], segs=6)


# a bucket on the floor in the sun by the wall, handle dropped to one side
EX, EY = 2.72, -1.42


def eimer(bm):
    bm_cyl(bm, 0.12, 0.27, (EX, EY, 0.135), "z", 16, r2=0.145, mat_index=0)
    bm_ring(bm, 0.14, 0.152, 0.012, (EX, EY, 0.264), "z", 16, 0)  # lip
    bm_cyl(bm, 0.135, 0.004, (EX, EY, 0.06), "z", 16, mat_index=1)  # something dark at the bottom
    for sgn in (-1, 1):
        bm_cyl(bm, 0.008, 0.008, (EX + sgn * 0.148, EY, 0.22), "x", 6, mat_index=2)  # handle lugs


em = multi("Eimer", eimer, [M["Kunststoff_Grau"], M["Fuge"], M["Metall_Hell"]])
shade_smooth(em, {0})
curve("Eimer_Henkel", [(EX - 0.15, EY, 0.22), (EX - 0.10, EY - 0.17, 0.12), (EX, EY - 0.20, 0.06), (EX + 0.10, EY - 0.17, 0.12), (EX + 0.15, EY, 0.22)], 0.003, M["Metall_Hell"], segs=6)


def kalender(bm):
    bm_box(bm, (0.004, 0.30, 0.42), (0, 0, 0), 0)  # paper block
    bm_box(bm, (0.002, 0.26, 0.18), (-0.0025, 0, 0.09), 1)  # the month's photo
    for k in range(5):  # week rows
        bm_box(bm, (0.001, 0.26, 0.002), (-0.0025, 0, -0.05 - k * 0.03), 2)
    bm_box(bm, (0.006, 0.30, 0.012), (-0.003, 0, 0.205), 3)  # binding strip
    bm_cyl(bm, 0.003, 0.02, (-0.002, 0, 0.215), "x", 6, mat_index=3)  # nail


def kalender_platziert(bm):
    # hangs a hair off plumb on its nail
    bm_placed(bm, Matrix.Translation((WR - 0.003, 0.12, 1.55)) @ Matrix.Rotation(radians(2), 4, "X"), kalender)


multi("Kalender", kalender_platziert, [M["Papier"], M["Foto"], M["Fuge"], M["Metall_Hell"]], bevel=0.001)

result = {"objects": sorted(o.name for o in collection().objects)}
