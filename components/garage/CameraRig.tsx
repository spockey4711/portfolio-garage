"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { REST_VIEW, views } from "@/lib/garage/hotspots";

/** How far the idle camera turns towards the pointer, in degrees per axis. */
const PARALLAX_DEG = 3;

/** Damping factor for the parallax; higher settles faster. */
const PARALLAX_LAMBDA = 6;

const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);

// Week 0: the camera sits in the rest position and follows the pointer by a
// few degrees. The drives into the hotspots come with the state machine in
// week 1 (docs/PLAN.md); this component is where they will live.
export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const pointer = useThree((state) => state.pointer);

  const rest = views[REST_VIEW];

  // The orientation the camera has when it looks straight at the rest target.
  const restQuaternion = useMemo(() => {
    const matrix = new Matrix4().lookAt(
      new Vector3(...rest.camera),
      new Vector3(...rest.target),
      Y_AXIS,
    );
    return new Quaternion().setFromRotationMatrix(matrix);
  }, [rest]);

  // Per-frame state, allocated once so the render loop does not churn.
  const rigRef = useRef({
    yaw: 0,
    pitch: 0,
    yawQ: new Quaternion(),
    pitchQ: new Quaternion(),
  });

  useLayoutEffect(() => {
    camera.position.set(...rest.camera);
    camera.quaternion.copy(restQuaternion);
  }, [camera, rest, restQuaternion]);

  useFrame((_, delta) => {
    const rig = rigRef.current;
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
