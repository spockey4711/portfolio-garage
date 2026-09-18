import { describe, expect, it } from "vitest";
import {
  type CanvasEnvironment,
  CANVAS_MIN_WIDTH_PX,
  LOW_MEMORY_GB,
  stillReason,
} from "./capability";

// A laptop that can run the canvas; each test breaks one thing.
const capable: CanvasEnvironment = {
  reducedMotion: false,
  viewportWidth: 1280,
  webgl2: true,
  renderer:
    "ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)",
  deviceMemoryGb: 8,
};

describe("stillReason", () => {
  it("lets a capable device have the canvas", () => {
    expect(stillReason(capable)).toBeNull();
  });

  it("respects prefers-reduced-motion before anything else", () => {
    expect(stillReason({ ...capable, reducedMotion: true })).toBe(
      "reduced-motion",
    );
  });

  it("keeps the still under 768 px, from 768 px on the canvas", () => {
    expect(
      stillReason({ ...capable, viewportWidth: CANVAS_MIN_WIDTH_PX - 1 }),
    ).toBe("narrow");
    expect(
      stillReason({ ...capable, viewportWidth: CANVAS_MIN_WIDTH_PX }),
    ).toBeNull();
  });

  it("needs WebGL2", () => {
    expect(stillReason({ ...capable, webgl2: false })).toBe("no-webgl2");
  });

  it("treats a CPU renderer as a weak GPU", () => {
    for (const renderer of [
      "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
      "llvmpipe (LLVM 15.0.7, 256 bits)",
      "ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0)",
    ]) {
      expect(stillReason({ ...capable, renderer }), renderer).toBe(
        "software-renderer",
      );
    }
  });

  it("does not mistake a Mesa hardware driver for software", () => {
    expect(
      stillReason({ ...capable, renderer: "Mesa Intel(R) UHD Graphics 620" }),
    ).toBeNull();
  });

  it("tolerates a hidden renderer string", () => {
    expect(stillReason({ ...capable, renderer: null })).toBeNull();
  });

  it("keeps the still on low-memory devices and ignores browsers that do not say", () => {
    expect(stillReason({ ...capable, deviceMemoryGb: LOW_MEMORY_GB })).toBe(
      "low-memory",
    );
    expect(stillReason({ ...capable, deviceMemoryGb: 4 })).toBeNull();
    expect(stillReason({ ...capable, deviceMemoryGb: null })).toBeNull();
  });
});
