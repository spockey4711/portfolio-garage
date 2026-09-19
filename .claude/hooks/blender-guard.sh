#!/usr/bin/env bash
# blender-guard.sh - PreToolUse hook: never start a second Blender job.
#
# A Cycles bake takes every core and most of the RAM; two at once (two sessions, two
# worktrees) freeze the Mac. This hook refuses a tool call that would start a Blender job
# while any Blender process is still busy.
#
# A tool call "starts a Blender job" when it is
#   - a Bash command that runs the Blender binary, export.sh, `pnpm export:blender` or
#     the blender-export skill, or
#   - one of the heavy Blender MCP tools (execute_blender_code, render_*).
#
# Blender is "busy" when a headless process (-b / --background) is running, or any Blender
# process is above BUSY_CPU percent CPU, which is a render or bake in the GUI instance. An
# idle GUI Blender sits well below that and does not block.
#
# Everything else passes through untouched. Output on deny: permissionDecision JSON, so the
# refusal and its reason reach Claude in every permission mode.
set -euo pipefail

BUSY_CPU=50

input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')

starts_blender=0
case "$tool" in
  Bash)
    cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
    if printf '%s' "$cmd" | grep -qE 'MacOS/Blender|blender-export/export\.sh|export:blender|(^|[^[:alnum:]_/.-])blender([[:space:]].*)?( -b|--background)'; then
      starts_blender=1
    fi
    ;;
  mcp__blender__execute_blender_code|mcp__blender__execute_blender_code_for_cli|\
  mcp__blender__render_viewport_to_path|mcp__blender__render_thumbnail_to_path)
    starts_blender=1
    ;;
esac
[ "$starts_blender" -eq 1 ] || exit 0

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# pid, %cpu and the full command line of every Blender main process. Without a process
# table there is no way to know, so fail closed.
procs=$(ps -axo pid=,%cpu=,command= 2>/dev/null) \
  || deny "blender-guard: cannot read the process table (ps failed), refusing to start Blender blind."
busy=$(printf '%s\n' "$procs" | awk -v limit="$BUSY_CPU" '
  $3 ~ /Blender\.app\/Contents\/MacOS\/Blender$/ || $3 ~ /\/blender$/ {
    headless = 0
    for (i = 4; i <= NF; i++) if ($i == "-b" || $i == "--background") headless = 1
    if (headless) printf "  pid %s: headless Blender (%s%% CPU)\n", $1, $2
    else if ($2 + 0 > limit) printf "  pid %s: Blender GUI rendering or baking (%s%% CPU)\n", $1, $2
  }')
[ -n "$busy" ] || exit 0

deny "Blender is busy, a second Blender job would freeze the Mac. Wait until it is done (check with: ps -axo pid,%cpu,command | grep MacOS/Blender), then retry.
$busy"
