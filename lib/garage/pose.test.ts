import { BoxGeometry, Group, Mesh, Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { views } from "./hotspots";
import { cameraUp, lookAtQuaternion, viewQuaternion } from "./pose";

const DEG = Math.PI / 180;

// The bike computer as it sits in the GLB: on a bike turned 30 degrees about
// y, the computer group pitched 20 degrees so the face leans to the rider,
// its 7.4 x 0.2 x 4.6 cm display panel on top. Placed like the fixture in
// screen.test.ts.
function bikeComputerScene(turnDeg: number) {
  const scene = new Group();
  const bike = new Group();
  bike.name = "Rad";
  bike.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), turnDeg * DEG);
  const computer = new Group();
  computer.name = "Radcomputer";
  computer.position.set(0.5, 1.075, 0);
  computer.quaternion.setFromAxisAngle(new Vector3(0, 0, 1), 20 * DEG);
  const display = new Mesh(new BoxGeometry(0.074, 0.002, 0.046));
  display.name = "Radcomputer_Display";
  display.position.set(0, 0.0075, 0);
  computer.add(display);
  bike.add(computer);
  scene.add(bike);
  return scene;
}

/** The camera's own y axis in world space. */
function upOf(quaternion: Quaternion): Vector3 {
  return new Vector3(0, 1, 0).applyQuaternion(quaternion);
}

/** Signed roll of the camera about its view axis relative to world y. */
function rollDeg(quaternion: Quaternion): number {
  const right = new Vector3(1, 0, 0).applyQuaternion(quaternion);
  return Math.atan2(right.y, Math.hypot(right.x, right.z)) / DEG;
}

describe("cameraUp", () => {
  it("is world y for the rest view, which has no screen", () => {
    expect(cameraUp(views.ruhe, new Group())).toEqual(new Vector3(0, 1, 0));
  });

  it("follows the display's up on a turned bike", () => {
    const up = cameraUp(views.radcomputer, bikeComputerScene(30));
    // Along the bike, 20 degrees up, turned 30 degrees out of the x axis.
    expect(up.x).toBeCloseTo(Math.cos(20 * DEG) * Math.cos(30 * DEG), 2);
    expect(up.y).toBeCloseTo(Math.sin(20 * DEG), 2);
    expect(up.z).toBeCloseTo(-Math.cos(20 * DEG) * Math.sin(30 * DEG), 2);
  });
});

describe("lookAtQuaternion", () => {
  it("looks along -z from the camera to the target", () => {
    const q = lookAtQuaternion([0, 1, 4], [0, 1, 0]);
    const forward = new Vector3(0, 0, -1).applyQuaternion(q);
    expect(forward.x).toBeCloseTo(0);
    expect(forward.y).toBeCloseTo(0);
    expect(forward.z).toBeCloseTo(-1);
    expect(rollDeg(q)).toBeCloseTo(0);
  });

  it("rolls with the up vector it is given", () => {
    // Up leaning 5 degrees to the left lifts the camera's right by 5.
    const tilted = new Vector3(-Math.sin(5 * DEG), Math.cos(5 * DEG), 0);
    const q = lookAtQuaternion([0, 1, 4], [0, 1, 0], tilted);
    expect(rollDeg(q)).toBeCloseTo(5);
  });
});

describe("viewQuaternion", () => {
  it("keeps the rest view level", () => {
    expect(rollDeg(viewQuaternion(views.ruhe, new Group()))).toBeCloseTo(0);
  });

  it("keeps the display's vertical edge vertical on the viewer's screen", () => {
    const scene = bikeComputerScene(30);
    const q = viewQuaternion(views.radcomputer, scene);
    const displayUp = cameraUp(views.radcomputer, scene);
    const forward = new Vector3(0, 0, -1).applyQuaternion(q);
    // Project the display's up onto the image plane: it must be the camera's
    // own up, i.e. have no component along the camera's right.
    const projected = displayUp
      .clone()
      .addScaledVector(forward, -displayUp.dot(forward))
      .normalize();
    expect(projected.dot(upOf(q))).toBeCloseTo(1, 4);
  });

  it("would sit askew with world y as up", () => {
    // The point of the roll: a camera beside the bike's centre plane with
    // world y as up leaves the display's vertical edge leaning on screen.
    // (The real camera sits in that plane, over the bar, where both agree.)
    const scene = bikeComputerScene(30);
    const real = views.radcomputer;
    const side = new Vector3(0.5, 0, -0.866).multiplyScalar(0.05);
    const view = {
      ...real,
      camera: [
        real.camera[0] + side.x,
        real.camera[1],
        real.camera[2] + side.z,
      ] as const,
    };
    const level = lookAtQuaternion(view.camera, view.target);
    const rolled = viewQuaternion(view, scene);
    expect(Math.abs(rollDeg(rolled) - rollDeg(level))).toBeGreaterThan(1);
  });
});
