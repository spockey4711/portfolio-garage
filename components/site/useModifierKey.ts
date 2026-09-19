import { useSyncExternalStore } from "react";

// The command key as it reads on the cap: the server does not know the
// platform, so it prints the Mac one and the client corrects it on
// hydration. Shared by the palette button and the shortcut overlay.
const modifierStore = {
  subscribe: () => () => {},
  get: () =>
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
      ? "⌘"
      : "Strg",
  getServer: () => "⌘",
};

export function useModifierKey(): string {
  return useSyncExternalStore(
    modifierStore.subscribe,
    modifierStore.get,
    modifierStore.getServer,
  );
}
