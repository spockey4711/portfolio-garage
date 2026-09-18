import { BoxGeometry, Group, Mesh, Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { views } from "./hotspots";
import { screenPlaneFor } from "./screen";

// The two display meshes as the blockout GLB carries them (node transforms
// and bounds read from public/models/garage.glb). If the Blender model
// changes, these fixtures describe the old one; the rule under test does not.

function deviceMesh(
  size: [number, number, number],
  position: [number, number, number],
  rotation: Quaternion,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(...size));
  mesh.position.set(...position);
  mesh.quaternion.copy(rotation);
  new Group().add(mesh);
  return mesh;
}

const DEG = Math.PI / 180;

function expectClose(actual: Vector3, expected: [number, number, number]) {
  expect(actual.x).toBeCloseTo(expected[0], 2);
  expect(actual.y).toBeCloseTo(expected[1], 2);
  expect(actual.z).toBeCloseTo(expected[2], 2);
}

describe("screenPlaneFor", () => {
  it("puts the bike computer's screen on its tilted top face, up along the bike", () => {
    // 9 x 2 x 6 cm, pitched 20 degrees about z so the face leans to the rider.
    const mesh = deviceMesh(
      [0.09, 0.02, 0.06],
      [0.58, 1.07, 0],
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), 20 * DEG),
    );
    const plane = screenPlaneFor(mesh, views.radcomputer.camera);

    const normal = new Vector3(0, 0, 1).applyQuaternion(plane.quaternion);
    const up = new Vector3(0, 1, 0).applyQuaternion(plane.quaternion);
    expectClose(normal, [-Math.sin(20 * DEG), Math.cos(20 * DEG), 0]);
    expectClose(up, [Math.cos(20 * DEG), Math.sin(20 * DEG), 0]);
    // Portrait: the 6 cm edge runs across, the 9 cm edge runs up.
    expect(plane.width).toBeCloseTo(0.06);
    expect(plane.height).toBeCloseTo(0.09);
    // 1 cm above the device centre along the normal, on the face itself.
    const expected = new Vector3(0.58, 1.07, 0).addScaledVector(normal, 0.01);
    expectClose(plane.position, [expected.x, expected.y, expected.z]);
  });

  it("puts the laptop's screen on the lid face that leans back into the room", () => {
    // 32 x 21 x 0.5 cm lid, opened 100 degrees, so tilted -10 degrees about x.
    const mesh = deviceMesh(
      [0.32, 0.21, 0.005],
      [-1.8, 1.013, -1.628],
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -10 * DEG),
    );
    const plane = screenPlaneFor(mesh, views.laptop.camera);

    const normal = new Vector3(0, 0, 1).applyQuaternion(plane.quaternion);
    const up = new Vector3(0, 1, 0).applyQuaternion(plane.quaternion);
    expectClose(normal, [0, Math.sin(10 * DEG), Math.cos(10 * DEG)]);
    expectClose(up, [0, Math.cos(10 * DEG), -Math.sin(10 * DEG)]);
    expect(plane.width).toBeCloseTo(0.32);
    expect(plane.height).toBeCloseTo(0.21);
    expect(plane.position.z).toBeGreaterThan(-1.628);
  });

  it("picks the other side when the camera is behind the device", () => {
    const mesh = deviceMesh([0.32, 0.21, 0.005], [0, 1, 0], new Quaternion());
    const front = screenPlaneFor(mesh, [0, 1, 2]);
    const back = screenPlaneFor(mesh, [0, 1, -2]);
    expect(front.position.z).toBeCloseTo(0.0025);
    expect(back.position.z).toBeCloseTo(-0.0025);
    // Up stays up on both sides; the basis stays right-handed.
    const upFront = new Vector3(0, 1, 0).applyQuaternion(front.quaternion);
    const upBack = new Vector3(0, 1, 0).applyQuaternion(back.quaternion);
    expectClose(upFront, [0, 1, 0]);
    expectClose(upBack, [0, 1, 0]);
  });

  it("refuses a mesh without geometry", () => {
    const mesh = new Mesh();
    mesh.name = "Leer";
    expect(() => screenPlaneFor(mesh, [0, 0, 1])).toThrow(/Leer/);
  });
});
