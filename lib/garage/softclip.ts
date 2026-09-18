import { Effect } from "postprocessing";
import { Uniform } from "three";

/**
 * Highlight roll-off for the composer, in place of a tone mapper.
 *
 * The lightmap shows the sunlit facade and the bounce-lit room in one frame
 * (docs/KONZEPT.md §2 "Dach und Tor"). Below the knee the image stays exactly
 * what Cycles rendered; only what would clip to white (the gate in the sun) is
 * compressed. A regular tone mapper (ACES, AgX, Khronos Neutral) also bends the
 * mid-tones or crushes the shadows, and the room lives in the shadows.
 */
export const SOFT_CLIP_KNEE = 0.8;

const fragmentShader = /* glsl */ `
  uniform float knee;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 color = inputColor.rgb;
    float room = 1.0 - knee;
    vec3 over = max(color - knee, vec3(0.0));
    vec3 clipped = min(color, vec3(knee)) + room * (1.0 - exp(-over / room));
    outputColor = vec4(clipped, inputColor.a);
  }
`;

export class SoftClipEffect extends Effect {
  constructor(knee = SOFT_CLIP_KNEE) {
    super("SoftClipEffect", fragmentShader, {
      uniforms: new Map([["knee", new Uniform(knee)]]),
    });
  }
}

/** The curve the shader applies, for tests and for reasoning about exposure. */
export function softClip(value: number, knee = SOFT_CLIP_KNEE): number {
  const room = 1 - knee;
  const over = Math.max(value - knee, 0);
  return Math.min(value, knee) + room * (1 - Math.exp(-over / room));
}
