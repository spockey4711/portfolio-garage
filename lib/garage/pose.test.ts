import { BoxGeometry, Group, Mesh, Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { views } from "./hotspots";
import { cameraUp, lookAtQuaternion, viewQuaternion } from "./pose";

const DEG = Math.PI / 180;

// The bike computer as it sits in the blockout: on a bike turned 30 degrees
// about y, the 9 x 2 x 6 cm box pitched 20 degrees so the face leans to the
// rider. Sized and placed like the fixture in screen.test.ts.
function bikeComputerScene(turnDeg: number) {
  const scene = new Group();
  const bike = new Group();
  bike.name = "Rad";
  bike.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), turnDeg * DEG);
  const display = new Mesh(new BoxGeometry(0.09, 0.02, 0.06));
  display.name = "Radcomputer";
  display.position.set(0.58, 1.07, 0);
  display.quaternion.setFromAxisAngle(new Vector3(0, 0, 1), 20 * DEG);
  bike.add(display);
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
  it("is world y for a view without a screen", () => {
    expect(cameraUp(views.pinnwand, new Group())).toEqual(new Vector3(0, 1, 0));
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
    // The point of the roll: the same view with world y as up leaves the
    // display's vertical edge leaning on screen.
    const scene = bikeComputerScene(30);
    const view = views.radcomputer;
    const level = lookAtQuaternion(view.camera, view.target);
    const rolled = viewQuaternion(view, scene);
    expect(Math.abs(rollDeg(rolled) - rollDeg(level))).toBeGreaterThan(1);
  });
});
