"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { driveDuration, easeInOut } from "@/lib/garage/camera";
import { REST_VIEW, type Vec3, views } from "@/lib/garage/hotspots";
import { isDriving, useGarageStore } from "@/lib/garage/store";

/** How far the idle camera turns towards the pointer, in degrees per axis. */
const PARALLAX_DEG = 3;

/** Damping factor for the parallax; higher settles faster. */
const PARALLAX_LAMBDA = 6;

/** Longest frame the drive advances by; a tab coming back does not skip it. */
const MAX_DELTA_S = 0.1;

const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);

/** The orientation a camera at `position` has when it looks at `target`. */
function lookAtQuaternion(position: Vec3, target: Vec3): Quaternion {
  const matrix = new Matrix4().lookAt(
    new Vector3(...position),
    new Vector3(...target),
    Y_AXIS,
  );
  return new Quaternion().setFromRotationMatrix(matrix);
}

/** One camera drive, from wherever the camera is to a view's position. */
interface Drive {
  readonly fromPosition: Vector3;
  readonly fromQuaternion: Quaternion;
  readonly toPosition: Vector3;
  readonly toQuaternion: Quaternion;
  readonly duration: number;
  elapsed: number;
}

// The camera is never free (docs/KONZEPT.md §3). It rests at the rest view
// with a few degrees of pointer parallax, and the store's phase starts a drive
// to whichever view is set: focusing drives in, leaving drives back. A drive
// always starts from the camera's current pose, so retargeting mid-flight
// (Escape during a drive, a second hotspot) needs no special case.
export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const pointer = useThree((state) => state.pointer);
  const phase = useGarageStore((state) => state.phase);
  const view = useGarageStore((state) => state.view);

  const rest = views[REST_VIEW];
  const restQuaternion = useMemo(
    () => lookAtQuaternion(rest.camera, rest.target),
    [rest],
  );

  // Per-frame state, allocated once so the render loop does not churn.
  const rigRef = useRef({
    yaw: 0,
    pitch: 0,
    yawQ: new Quaternion(),
    pitchQ: new Quaternion(),
    drive: null as Drive | null,
  });

  useLayoutEffect(() => {
    camera.position.set(...rest.camera);
    camera.quaternion.copy(restQuaternion);
  }, [camera, rest, restQuaternion]);

  useEffect(() => {
    if (!isDriving(phase)) return;
    const target = views[view];
    const toPosition = new Vector3(...target.camera);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const rig = rigRef.current;
    rig.drive = {
      fromPosition: camera.position.clone(),
      fromQuaternion: camera.quaternion.clone(),
      toPosition,
      toQuaternion: lookAtQuaternion(target.camera, target.target),
      duration: reducedMotion
        ? 0
        : driveDuration(camera.position.distanceTo(toPosition)),
      elapsed: 0,
    };
    // The parallax restarts from straight ahead when the camera is back.
    rig.yaw = 0;
    rig.pitch = 0;
  }, [camera, phase, view]);

  useFrame((_, rawDelta) => {
    const rig = rigRef.current;
    const delta = Math.min(rawDelta, MAX_DELTA_S);

    if (rig.drive) {
      const drive = rig.drive;
      drive.elapsed += delta;
      const t = drive.duration === 0 ? 1 : drive.elapsed / drive.duration;
      const eased = easeInOut(t);
      camera.position.lerpVectors(drive.fromPosition, drive.toPosition, eased);
      camera.quaternion.slerpQuaternions(
        drive.fromQuaternion,
        drive.toQuaternion,
        eased,
      );
      if (t >= 1) {
        rig.drive = null;
        useGarageStore.getState().arrive();
      }
      return;
    }

    // Parallax only at rest; a focused camera holds still (KONZEPT §4).
    if (useGarageStore.getState().phase !== "idle") return;

    // pointer is -1..1 on both axes; turn towards it, not away from it.
    const targetYaw = -pointer.x * MathUtils.degToRad(PARALLAX_DEG);
    const targetPitch = pointer.y * MathUtils.degToRad(PARALLAX_DEG);
    rig.yaw = MathUtils.damp(rig.yaw, targetYaw, PARALLAX_LAMBDA, delta);
    rig.pitch = MathUtils.damp(rig.pitch, targetPitch, PARALLAX_LAMBDA, delta);
    rig.yawQ.setFromAxisAngle(Y_AXIS, rig.yaw);
    rig.pitchQ.setFromAxisAngle(X_AXIS, rig.pitch);
    camera.quaternion
      .copy(restQuaternion)
      .multiply(rig.yawQ)
      .multiply(rig.pitchQ);
  });

  return null;
}
