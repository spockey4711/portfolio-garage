/** Where the gradient starts to darken, in percent of the distance to the corner. */
const VIGNETTE_START = 40;
/**
 * What the corners are multiplied with: about a fifth darker and warmer, as a
 * lens with a warm filter would draw them. White in the centre means no change.
 */
const VIGNETTE_CORNER = "#d8c4ae";

// The vignette and warm tint of docs/ATMOSPHAERE.md §2. It is not a composer
// pass on purpose: the still is the first paint and the canvas fades in over
// it, and the two have to stay the same picture (lib/garage/lightmap.ts
// matches the sky for that). One multiply layer over both, in CSS, keeps them
// identical without a second render of the stills, and costs one composited
// gradient. It sits under HotspotNav and the still's card, so the UI stays
// crisp; the DOM screens inside the canvas are under it like the glass they
// sit on. Multiply rather than a translucent dark layer so black stays black
// and nothing goes grey.
export function Vignette() {
  return (
    <div
      aria-hidden="true"
      data-vignette=""
      className="pointer-events-none absolute inset-0 mix-blend-multiply"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, #ffffff ${VIGNETTE_START}%, ${VIGNETTE_CORNER} 100%)`,
      }}
    />
  );
}
