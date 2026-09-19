"""Cube Agree C:62 Pro (blackline) as a low-poly road bike, hanging in the repair stand.

Built in the bike's local frame: x forward, y left, z up, origin on the floor
below the wheelbase centre. The `Rad` empty places it in the room
(docs/KONZEPT.md §2, ADR-0004). Frame numbers are Cube's size 56 (Agree C:62
2025, via bikeinsights.com): 700x28c, wheelbase 1.007, chainstay 0.412 (0.406
horizontal), BB drop 0.071, stack 0.572, reach 0.391, seat angle 73.5, head
angle 72.5, head tube 0.157, seat tube 0.50, fork rake 0.05. Saddle and
cockpit heights are measured off the product photo, aligned by the axles.
"""
import bpy, bmesh
from math import radians, pi, cos, sin
from mathutils import Matrix, Vector

exec(open(LIB).read())  # LIB: absolute path to garage_lib.py, set by the caller

M = {m.name: m for m in bpy.data.materials}
M["Carbon"] = material("Carbon", "#141416", roughness=0.35)
M["Carbon_Matt"] = material("Carbon_Matt", "#1c1d20", roughness=0.7)
M["Reifen"] = material("Reifen", "#232324", roughness=0.95)
M["Felge"] = material("Felge", "#0f0f11", roughness=0.4)

rad = bpy.data.objects["Rad"]
# 0.9 m in front of the room centre, front 30 deg towards the camera (KONZEPT §2): further
# back the bike sat deep in the room from the rest camera
rad.location = (-0.2, -0.9, 0)
rad.rotation_euler = (0, 0, radians(30))
for o in list(rad.children):
    if o.name != "Radcomputer":
        remove(o.name)
for n in ("Staender_Arm", "Staender_Fuss_1", "Staender_Fuss_2", "Staender_Fuss_3", "Staender_Saeule"):
    remove(n)

# ---------------------------------------------------------------- geometry
R_WHEEL = 0.34
Z_AXLE = 0.20 + R_WHEEL  # tyres 20 cm above the floor, the bike hangs in the stand
WHEELBASE = 1.007
REAR = Vector((-WHEELBASE / 2, 0, Z_AXLE))
FRONT = Vector((WHEELBASE / 2, 0, Z_AXLE))
BB = REAR + Vector((0.406, 0, -0.071))
ST_DIR = Vector((-cos(radians(73.5)), 0, sin(radians(73.5))))  # up the seat tube, leaning back
ST_TOP = BB + ST_DIR * 0.50
HT_TOP = BB + Vector((0.391, 0, 0.572))
HT_DIR = Vector((cos(radians(-72.5)), 0, sin(radians(-72.5))))  # down the steering axis
HT_BOT = HT_TOP + HT_DIR * 0.157
SEAT = BB + ST_DIR * 0.65  # rail height, saddle top ends up 0.69 above the BB
SPACERS = 0.035
BAR = Vector((0.41, 0, 1.09))  # bar tops 5 cm above the head tube, 110 mm stem
DT_DIR = (HT_BOT - BB).normalized()
Y = Vector((0, 1, 0))


def tube(bm, p0, p1, r, flat=1.0, segs=10, mi=0, extend=0.0):
    """Tube p0 -> p1, cross-section scaled by `flat` across the frame plane (aero)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = (p1 - p0).normalized()
    p0, p1 = p0 - d * extend, p1 + d * extend
    rot = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    m = Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((1, flat, 1, 1))
    geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r, radius2=r, depth=(p1 - p0).length, matrix=m)
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = mi
            f.smooth = True


def cyl(bm, r, depth, center, axis="y", segs=12, r2=None, mi=0, smooth=True):
    verts = bm_cyl(bm, r, depth, center, axis, segs, r2, mi)
    for v in verts:
        for f in v.link_faces:
            f.smooth = smooth


def cube(bm, center, size, rotm=None, mi=0):
    m = Matrix.Translation(center) @ (rotm or Matrix.Identity(4)) @ Matrix.Diagonal((size[0], size[1], size[2], 1))
    geom = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = mi


def ring(bm, r_in, r_out, width, center, segs=24, mi=0, smooth=True):
    """Ring with rectangular cross-section, axis along y (rims, rotors)."""
    c = Vector(center)
    rings = []
    for (r, y) in ((r_in, -width / 2), (r_out, -width / 2), (r_out, width / 2), (r_in, width / 2)):
        rings.append([bm.verts.new(c + Vector((r * cos(2 * pi * i / segs), y, r * sin(2 * pi * i / segs)))) for i in range(segs)])
    faces = []
    for k in range(4):
        a, b = rings[k], rings[(k + 1) % 4]
        for i in range(segs):
            f = bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i]))
            f.material_index = mi
            f.smooth = smooth and k in (1, 3)
            faces.append(f)
    bmesh.ops.recalc_face_normals(bm, faces=faces)


def part(name, build, mats, bevel=None, smooth_angle=None):
    bm = bmesh.new()
    build(bm)
    obj = multi_mesh_object(name, bm, mats)
    if bevel:
        add_bevel(obj, bevel)
    obj.parent = rad  # built in the bike's local frame
    obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_basis = Matrix.Identity(4)
    return obj


def smooth_by_angle(obj, angle=35):
    for m in list(obj.modifiers):
        if m.name == "Smooth by Angle":
            obj.modifiers.remove(m)
    for p in obj.data.polygons:
        p.use_smooth = True
    op = getattr(bpy.ops.object, "shade_smooth_by_angle", None) or bpy.ops.object.shade_auto_smooth
    with bpy.context.temp_override(object=obj, selected_objects=[obj], selected_editable_objects=[obj], active_object=obj):
        op(angle=radians(angle))


# ---------------------------------------------------------------- wheels
def wheel(name, center, drive):
    def build(bm):
        bm_torus(bm, R_WHEEL - 0.014, 0.014, center, "y", 36, 8, 0)
        ring(bm, R_WHEEL - 0.078, R_WHEEL - 0.026, 0.027, center, 36, 1)  # 50 mm deep rim
        ring(bm, R_WHEEL - 0.026, R_WHEEL - 0.014, 0.022, center, 36, 1)  # brake track edge
        cyl(bm, 0.022, 0.10, center, "y", 12, mi=2)  # hub
        cyl(bm, 0.008, 0.14, center, "y", 8, mi=3)  # thru axle ends
        for i in range(20):
            a = 2 * pi * i / 20
            side = 0.032 if i % 2 else -0.032
            # two-cross lacing: the spoke leaves the hub 25 degrees off the radial line
            hub = center + Vector((0.02 * cos(a + radians(25)), side, 0.02 * sin(a + radians(25))))
            rim = center + Vector(((R_WHEEL - 0.078) * cos(a), 0, (R_WHEEL - 0.078) * sin(a)))
            tube(bm, hub, rim, 0.0015, 1, 4, 2)
        ring(bm, 0.045, 0.08, 0.002, center + Vector((0, 0.058, 0)), 24, 3)  # 160 mm rotor, left side
        cyl(bm, 0.03, 0.004, center + Vector((0, 0.058, 0)), "y", 12, mi=2)
        if drive:
            cyl(bm, 0.058, 0.045, center + Vector((0, -0.062, 0)), "y", 16, r2=0.030, mi=3)  # cassette

    obj = part(name, build, [M["Reifen"], M["Felge"], M["Carbon_Matt"], M["Metall_Hell"]])
    smooth_by_angle(obj, 40)
    return obj


wheel("Rad_Hinterrad", REAR, True)
wheel("Rad_Vorderrad", FRONT, False)


# ---------------------------------------------------------------- frame and fork
def frame(bm):
    tube(bm, BB, ST_TOP, 0.019, 0.7, 12, 0, 0.0)  # seat tube
    tube(bm, ST_TOP - ST_DIR * 0.03, HT_TOP - HT_DIR * 0.005, 0.021, 0.75, 12, 0)  # top tube
    tube(bm, HT_BOT + HT_DIR * 0.0, BB, 0.031, 0.6, 12, 0)  # down tube, deep aero section
    tube(bm, HT_TOP - HT_DIR * 0.015, HT_BOT + HT_DIR * 0.03, 0.03, 0.85, 12, 0)  # head tube
    cyl(bm, 0.038, 0.086, BB, "y", 14, mi=0)  # bottom bracket shell
    # dropped seat stays and chain stays
    st_join = BB + ST_DIR * 0.40
    for y in (-1, 1):
        tube(bm, st_join + Y * (y * 0.012), REAR + Y * (y * 0.062), 0.009, 0.8, 8, 0, 0.01)
        tube(bm, BB + Y * (y * 0.036), REAR + Y * (y * 0.062), 0.012, 0.9, 8, 0, 0.01)
        cube(bm, REAR + Y * (y * 0.068), (0.05, 0.012, 0.045), None, 0)  # dropouts
    # fork: crown under the head tube, blades down the steering axis, then raked forward
    crown = HT_BOT + HT_DIR * 0.045
    cube(bm, crown, (0.045, 0.11, 0.045), HT_DIR.to_track_quat("-Z", "Y").to_matrix().to_4x4(), 0)
    for y in (-1, 1):
        a = crown + Y * (y * 0.045)
        b = a + HT_DIR * 0.20
        c = FRONT + Y * (y * 0.055)
        tube(bm, a, b, 0.013, 0.7, 8, 0, 0.005)
        tube(bm, b, c, 0.011, 0.7, 8, 0, 0.005)
        cube(bm, c, (0.04, 0.012, 0.04), None, 0)
    # seat post and stem (matt), aero tops
    tube(bm, ST_TOP, SEAT, 0.013, 0.7, 10, 1)
    tube(bm, HT_TOP, HT_TOP - HT_DIR * SPACERS, 0.028, 0.85, 12, 1)  # spacer stack under the stem
    tube(bm, HT_TOP - HT_DIR * (SPACERS - 0.01), BAR, 0.015, 0.8, 8, 1, 0.01)
    cube(bm, BAR, (0.045, 0.40, 0.018), Matrix.Rotation(radians(-8), 4, "Y"), 1)
    # drops and hoods: 85 reach, 140 drop, hoods 4 cm above the tops
    for y in (-0.20, 0.20):
        rel = [(0, 0), (0.05, -0.005), (0.085, -0.045), (0.075, -0.105), (0.03, -0.14), (-0.04, -0.14)]
        pts = [BAR + Vector((dx, y, dz)) for dx, dz in rel]
        for a, b in zip(pts, pts[1:]):
            tube(bm, a, b, 0.0115, 1, 8, 1, 0.004)
        cube(bm, BAR + Vector((0.085, y, 0.02)), (0.09, 0.03, 0.04), Matrix.Rotation(radians(-20), 4, "Y"), 1)
    # front derailleur just above the big ring, brake calipers (left side, flat mount)
    cube(bm, BB + Vector((0.0, -0.045, 0.135)), (0.03, 0.03, 0.05), None, 1)
    cube(bm, REAR + Vector((-0.02, 0.078, 0.04)), (0.075, 0.03, 0.028), None, 1)
    cube(bm, FRONT + Vector((-0.045, 0.078, 0.06)), (0.075, 0.03, 0.028), None, 1)


part("Rad_Rahmen", frame, [M["Carbon"], M["Carbon_Matt"]])
smooth_by_angle(bpy.data.objects["Rad_Rahmen"], 35)


# ---------------------------------------------------------------- saddle
def saddle(bm):
    outline = [(0.13, 0.012), (0.13, -0.012), (0.06, -0.02), (-0.02, -0.05), (-0.09, -0.07), (-0.12, -0.06), (-0.12, 0.06), (-0.09, 0.07), (-0.02, 0.05), (0.06, 0.02)]
    c = SEAT + Vector((0.0, 0, 0.045))
    bottom = [bm.verts.new(c + Vector((x, y, -0.012))) for x, y in outline]
    top = [bm.verts.new(c + Vector((x, y, 0.012 + (0.006 if x < 0 else 0)))) for x, y in outline]
    bm.faces.new(bottom)
    bm.faces.new(list(reversed(top)))
    n = len(outline)
    for i in range(n):
        bm.faces.new((bottom[i], bottom[(i + 1) % n], top[(i + 1) % n], top[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for f in bm.faces:
        f.material_index = 0
    # rails
    for y in (-0.022, 0.022):
        tube(bm, SEAT + Vector((0.07, y, 0.028)), SEAT + Vector((-0.09, y, 0.028)), 0.004, 1, 6, 1)
    cube(bm, SEAT + Vector((0.0, 0, 0.02)), (0.05, 0.03, 0.02), None, 1)  # clamp


part("Rad_Sattel", saddle, [M["Carbon_Matt"], M["Metall_Hell"]], bevel=0.006)


# ---------------------------------------------------------------- drivetrain (drive side is -y)
def drivetrain(bm):
    cyl(bm, 0.105, 0.003, BB + Y * -0.052, "y", 28, mi=2)  # 52 t, Ultegra rings are dark
    cyl(bm, 0.072, 0.003, BB + Y * -0.060, "y", 24, mi=2)  # 36 t
    cyl(bm, 0.03, 0.02, BB + Y * -0.052, "y", 12, mi=0)  # spider / crank axle
    ang = radians(-10)  # drive side crank points forward, a touch down
    for y, sgn in ((-0.078, 1), (0.078, -1)):
        tip = BB + Vector((sgn * 0.1725 * cos(ang), y, sgn * 0.1725 * sin(ang)))
        rot = (tip - (BB + Y * y)).normalized().to_track_quat("X", "Y").to_matrix().to_4x4()
        cube(bm, (BB + Y * y + tip) / 2, (0.1725, 0.014, 0.03), rot, 0)  # crank arm
        cube(bm, tip + Y * (sgn * -0.045), (0.10, 0.07, 0.014), None, 0)  # pedal
        tube(bm, tip, tip + Y * (sgn * -0.08), 0.007, 1, 6, 1)  # pedal spindle
    # rear derailleur with two pulleys
    rd = REAR + Vector((0.0, -0.085, -0.02))
    cube(bm, rd + Vector((0.02, 0, 0.0)), (0.05, 0.022, 0.07), None, 0)
    p1 = rd + Vector((0.0, 0, -0.06))
    p2 = rd + Vector((0.035, 0, -0.115))
    cube(bm, (p1 + p2) / 2, (0.02, 0.008, 0.095), Matrix.Rotation(radians(-32), 4, "Y"), 0)  # cage
    cyl(bm, 0.013, 0.006, p1, "y", 10, mi=1)
    cyl(bm, 0.016, 0.006, p2, "y", 10, mi=1)
    # chain: big ring to the cassette top, cassette bottom through the pulleys back to the ring
    cy = -0.052
    top_a = BB + Vector((0, cy, 0.105))
    top_b = REAR + Vector((0, cy - 0.005, 0.045))
    cas_bot = REAR + Vector((0.02, cy - 0.005, -0.04))
    ring_bot = BB + Vector((0, cy, -0.105))
    for a, b in ((top_a, top_b), (cas_bot, p1), (p1, p2), (p2, ring_bot)):
        tube(bm, a, b, 0.004, 0.5, 4, 2, 0.004)


part("Rad_Antrieb", drivetrain, [M["Carbon_Matt"], M["Metall_Hell"], M["Metall_Dunkel"]])


# ---------------------------------------------------------------- bottle and cages
def flaschen(bm):
    perp_dt = Vector((-DT_DIR.z, 0, DT_DIR.x))  # up from the down tube
    perp_st = Vector((ST_DIR.z, 0, -ST_DIR.x))  # forward from the seat tube
    # bottle on the down tube
    c = BB + DT_DIR * 0.20 + perp_dt * (0.028 + 0.036)
    rot = DT_DIR.to_track_quat("Z", "Y").to_matrix().to_4x4()
    geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=12, radius1=0.036, radius2=0.036, depth=0.19, matrix=Matrix.Translation(c) @ rot)
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = 0
            f.smooth = True
    geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=12, radius1=0.022, radius2=0.012, depth=0.035, matrix=Matrix.Translation(c + DT_DIR * 0.11) @ rot)
    for v in geom["verts"]:
        for f in v.link_faces:
            f.material_index = 1
    # cages: a base plate on the tube and two thin hoops
    for base, dirn, perp in ((BB + DT_DIR * 0.20, DT_DIR, perp_dt), (BB + ST_DIR * 0.36, ST_DIR, perp_st)):
        cube(bm, base + perp * 0.026, (0.02, 0.03, 0.10), dirn.to_track_quat("Z", "Y").to_matrix().to_4x4(), 2)
        for t in (-0.045, 0.045):
            p = base + dirn * t + perp * 0.026
            for side in (-1, 1):
                q = p + perp * 0.05 + Y * (side * 0.038)
                tube(bm, p, q, 0.0025, 1, 6, 2)
                tube(bm, q, p + perp * 0.085 + Y * (side * 0.02), 0.0025, 1, 6, 2)


part("Rad_Flasche", flaschen, [M["Akzent"], M["Kunststoff"], M["Carbon_Matt"]])


# ---------------------------------------------------------------- Radcomputer
# Garmin Edge 540 on an out-front mount, 10 cm ahead of the bar, tilted 20 deg towards
# the rider. Local frame: x up the device (portrait), y across, z out of the glass.
# Measured in the display's own pixels (the Edge's 246 x 322 panel is 0.163 mm/px)
# and built a third larger than life, so the screen reads from the rider's eye. The
# glass lens is the mesh the DOM sits on (Screen.tsx), so its outline in pixels is
# what BikeComputer.tsx lays out: display 246 x 322, bezel 46 above, 40 beside, 68
# below with the wordmark. Change one side only together with the other.
RC_PX = 0.000163 * 1.35
RC_LENS = (436 * RC_PX, 326 * RC_PX)  # (x, y): 322 + 46 + 68 by 246 + 2 * 40 px
RC_RIM = 0.0025 * 1.35  # plastic around the glass
RC_BODY = (RC_LENS[0] + 2 * RC_RIM, RC_LENS[1] + 2 * RC_RIM, 0.026)
RC_LENS_T = 0.0012  # the glass stands proud of the body
RC_FACE = RC_BODY[2] / 2 + RC_LENS_T  # z of the glass surface

rc = bpy.data.objects.get("Radcomputer")
if rc is not None and rc.type != "EMPTY":
    remove("Radcomputer")
    rc = None
if rc is None:
    rc = bpy.data.objects.new("Radcomputer", None)
    collection().objects.link(rc)
rc.empty_display_type = "PLAIN_AXES"
rc.empty_display_size = 0.05
rc.parent = rad
rc.matrix_parent_inverse = Matrix.Identity(4)
rc.location = BAR + Vector((0.10, 0, 0.02))
rc.rotation_euler = (0, radians(-20), 0)
rc.scale = (1, 1, 1)


def rc_child(name, build, mats, bevel=None, smooth=None):
    bm = bmesh.new()
    build(bm)
    obj = multi_mesh_object(name, bm, mats)
    if bevel:
        add_bevel(obj, bevel)
    if smooth:
        smooth_by_angle(obj, smooth)
    obj.parent = rc
    obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_basis = Matrix.Identity(4)
    return obj


def rounded_prism(bm, center, size, radius, thick, segs=6, mi=0):
    """Rounded rectangle (sx, sy) in the xy plane, extruded `thick` along z."""
    cx, cy, cz = center
    sx, sy = size
    profile = []
    for k, (ex, ey) in enumerate(((1, 1), (-1, 1), (-1, -1), (1, -1))):
        ax, ay = cx + ex * (sx / 2 - radius), cy + ey * (sy / 2 - radius)
        for i in range(segs + 1):
            a = k * pi / 2 + (pi / 2) * i / segs
            profile.append((ax + radius * cos(a), ay + radius * sin(a)))
    bottom = [bm.verts.new((x, y, cz - thick / 2)) for x, y in profile]
    top = [bm.verts.new((x, y, cz + thick / 2)) for x, y in profile]
    faces = [bm.faces.new(bottom[::-1]), bm.faces.new(top)]
    n = len(profile)
    for i in range(n):
        f = bm.faces.new((bottom[i], bottom[(i + 1) % n], top[(i + 1) % n], top[i]))
        f.smooth = True
        faces.append(f)
    for f in faces:
        f.material_index = mi
    bmesh.ops.recalc_face_normals(bm, faces=faces)


def gehaeuse(bm):
    rounded_prism(bm, (0, 0, 0), RC_BODY[:2], 60 * RC_PX, RC_BODY[2])


def lens(bm):
    rounded_prism(bm, (0, 0, RC_BODY[2] / 2 + RC_LENS_T / 2), RC_LENS, 45 * RC_PX, RC_LENS_T, segs=4)


def tasten(bm):
    """Power and Back on the left, Up and Down on the right, Lap and Start along the bottom."""
    hx, hy, hz = (s / 2 for s in RC_BODY)
    proud, height = 0.0035, 0.010
    for x, length in ((hx - 0.020, 0.010), (-0.004, 0.018)):
        cube(bm, (x, hy, 0), (length, 2 * proud, height))
    for x in (0.014, -0.010):
        cube(bm, (x, -hy, 0), (0.016, 2 * proud, height))
    for y in (0.022, -0.022):
        cube(bm, (-hx, y, 0), (2 * proud, 0.016, height))


def halter(bm):
    plate_z = RC_BODY[2] / 2 + 0.002
    cube(bm, (-0.055, 0, -plate_z), (0.11, 0.02, 0.008), Matrix.Rotation(radians(20), 4, "Y"))
    cube(bm, (-0.10, 0, -0.035), (0.04, 0.05, 0.03))  # clamp around the bar


rc_child("Radcomputer_Gehaeuse", gehaeuse, [M["Kunststoff"]], bevel=0.003, smooth=40)
rc_child("Radcomputer_Display", lens, [M["Display"]])
rc_child("Radcomputer_Tasten", tasten, [M["Kunststoff"]], bevel=0.0012)
rc_child("Radcomputer_Halter", halter, [M["Kunststoff"]])

# hotspot empties follow the display: target on the glass, camera 14.5 cm out, 8 degrees
# steeper than the panel normal, i.e. from the rider's eye above the bar (pose.ts rolls
# the camera so the panel's vertical edge stays vertical on screen)
bpy.context.view_layer.update()
disp_w = rc.matrix_world @ Vector((0, 0, RC_FACE))
cam_dir = (rad.matrix_world.to_3x3() @ Vector((-sin(radians(28)), 0, cos(radians(28))))).normalized()
bpy.data.objects["Ziel_Radcomputer"].location = disp_w
bpy.data.objects["Cam_Radcomputer"].location = disp_w + cam_dir * 0.145

# ---------------------------------------------------------------- Montageständer
# clamps the seat post; column 42 cm to the bike's left (away from the camera) and a
# little behind the post, built in world space because the tripod stands on the floor
post_l = ST_TOP + ST_DIR * 0.07
post_w = rad.matrix_world @ post_l
col = rad.matrix_world @ Vector((post_l.x - 0.10, 0.42, 0))
col.z = 0
arm_z = post_w.z


def staender(bm):
    cyl(bm, 0.022, 1.0, (col.x, col.y, 0.50), "z", 12, mi=0)
    cyl(bm, 0.017, arm_z - 0.98, (col.x, col.y, 0.98 + (arm_z - 0.98) / 2), "z", 12, mi=1)
    cyl(bm, 0.03, 0.05, (col.x, col.y, 0.985), "z", 12, mi=1)  # collar
    for k in range(3):  # tripod
        a = radians(90 + k * 120)
        foot = col + Vector((0.45 * cos(a), 0.45 * sin(a), 0.015))
        tube(bm, col + Vector((0, 0, 0.06)), foot, 0.014, 1, 8, 0)
        cube(bm, foot, (0.05, 0.05, 0.03), None, 2)
    top = Vector((col.x, col.y, arm_z))
    tube(bm, top, Vector((post_w.x, post_w.y, arm_z)), 0.016, 1, 10, 0)
    d = (Vector((post_w.x, post_w.y, 0)) - Vector((col.x, col.y, 0))).normalized()
    rot = d.to_track_quat("X", "Z").to_matrix().to_4x4()
    cube(bm, (post_w.x, post_w.y, arm_z), (0.10, 0.06, 0.07), rot, 0)  # clamp head
    cyl(bm, 0.014, 0.05, (post_w.x - d.x * 0.03, post_w.y - d.y * 0.03, arm_z - 0.055), "z", 8, mi=3)  # knob, the accent


bm = bmesh.new()
staender(bm)
st = multi_mesh_object("Staender", bm, [M["Metall_Dunkel"], M["Metall_Hell"], M["Kunststoff"], M["Akzent"]])
smooth_by_angle(st, 40)

result = {"post_w": [round(v, 3) for v in post_w], "children": sorted(o.name for o in rad.children), "ziel": [round(v, 3) for v in disp_w]}
