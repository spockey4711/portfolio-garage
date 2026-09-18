#!/bin/bash
# Export blender/garage-blockout.blend headless: GLB + hotspot coordinates.
# Usage: export.sh [out-dir]   (default: repo root)
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
out=${1:-$root}
blender=/Applications/Blender.app/Contents/MacOS/Blender

# --factory-startup: a user addon (trailprint3d) throws in load_post and would abort the run.
"$blender" -b --factory-startup "$root/blender/garage-blockout.blend" \
  --python "$here/export.py" -- "$out" 2>&1 \
  | grep -v -E '^ *(ArchWarn:|Function: Arch_|File: .*assumptions\.cpp|Line: 140)|^[0-9:]{8} \| INFO:'
