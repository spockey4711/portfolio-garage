// Whether a device gets the canvas or keeps the still (docs/KONZEPT.md §5):
// prefers-reduced-motion, a viewport under 768 px or a weak GPU all mean the
// still. The rule is a pure function of what the browser reports, so it is
// testable; probeCanvasEnvironment() gathers the report on the client.

/** Below this viewport width the still stands in for the canvas. */
export const CANVAS_MIN_WIDTH_PX = 768;

/** Devices reporting this much memory or less get the still. */
export const LOW_MEMORY_GB = 2;

export interface CanvasEnvironment {
  readonly reducedMotion: boolean;
  readonly viewportWidth: number;
  readonly webgl2: boolean;
  /** WEBGL_debug_renderer_info's renderer string, null when the browser hides it. */
  readonly renderer: string | null;
  /** navigator.deviceMemory in GB, null where the browser has none (Safari, Firefox). */
  readonly deviceMemoryGb: number | null;
}

export type StillReason =
  | "reduced-motion"
  | "narrow"
  | "no-webgl2"
  | "software-renderer"
  | "low-memory";

/** Renderers that draw WebGL on the CPU: headless browsers, VMs, drivers gone wrong. */
const SOFTWARE_RENDERER =
  /swiftshader|llvmpipe|softpipe|software|basic render/i;

/** Why this environment keeps the still, or null when it can run the canvas. */
export function stillReason(env: CanvasEnvironment): StillReason | null {
  if (env.reducedMotion) return "reduced-motion";
  if (env.viewportWidth < CANVAS_MIN_WIDTH_PX) return "narrow";
  if (!env.webgl2) return "no-webgl2";
  if (env.renderer !== null && SOFTWARE_RENDERER.test(env.renderer)) {
    return "software-renderer";
  }
  if (env.deviceMemoryGb !== null && env.deviceMemoryGb <= LOW_MEMORY_GB) {
    return "low-memory";
  }
  return null;
}

/** Reads the environment off the live browser; call it after the first paint. */
export function probeCanvasEnvironment(): CanvasEnvironment {
  const { webgl2, renderer } = probeWebgl();
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    viewportWidth: window.innerWidth,
    webgl2,
    renderer,
    deviceMemoryGb: typeof deviceMemory === "number" ? deviceMemory : null,
  };
}

function probeWebgl(): Pick<CanvasEnvironment, "webgl2" | "renderer"> {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (gl === null) return { webgl2: false, renderer: null };
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer =
      info === null
        ? null
        : String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
    // Browsers cap the number of live contexts; give this one back at once.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { webgl2: true, renderer };
  } catch {
    return { webgl2: false, renderer: null };
  }
}
