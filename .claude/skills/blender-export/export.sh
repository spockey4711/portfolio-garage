#!/bin/bash
# Export blender/garage-blockout.blend headless: GLB + hotspot coordinates,
# then shrink the GLB for the web (scripts/optimize-glb.mts).
# Usage: export.sh [out-dir] [--skip-bake]   (default out-dir: repo root)
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
out=$root
if [[ $# -gt 0 && $1 != --* ]]; then
  out=$1
  shift
fi
blender=/Applications/Blender.app/Contents/MacOS/Blender

# --factory-startup: a user addon (trailprint3d) throws in load_post and would abort the run.
# The grep keeps Blender's exit status out of the pipeline; the OK line below is the check.
"$blender" -b --factory-startup "$root/blender/garage-blockout.blend" \
  --python "$here/export.py" -- "$out" "$@" 2>&1 \
  | grep -v -E '^ *(ArchWarn:|Function: Arch_|File: .*assumptions\.cpp|Line: 140)|^[0-9:]{8} \| INFO:' \
  | tee "${TMPDIR:-/tmp}/garage-export.log"
grep -q '^OK glb=' "${TMPDIR:-/tmp}/garage-export.log"

glb="$out/public/models/garage.glb"
before=$(stat -f %z "$glb")
node "$root/scripts/optimize-glb.mts" "$glb" > /dev/null
echo "OK optimized glb=$glb ($((before / 1024)) KB -> $(($(stat -f %z "$glb") / 1024)) KB)"
