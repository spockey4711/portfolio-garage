import { beforeEach, describe, expect, it } from "vitest";
import { REST_VIEW } from "./hotspots";
import { isDriving, useGarageStore } from "./store";

const initial = useGarageStore.getInitialState();
const store = useGarageStore;

beforeEach(() => {
  store.setState(initial, true);
});

describe("focus", () => {
  it("starts a drive from idle", () => {
    store.getState().focus("radcomputer");
    expect(store.getState()).toMatchObject({
      phase: "focusing",
      view: "radcomputer",
    });
  });

  it("retargets a running drive to another hotspot", () => {
    store.getState().focus("radcomputer");
    store.getState().focus("laptop");
    expect(store.getState()).toMatchObject({
      phase: "focusing",
      view: "laptop",
    });
  });

  it("does nothing when already at or driving to that hotspot", () => {
    store.getState().focus("laptop");
    const driving = store.getState();
    store.getState().focus("laptop");
    expect(store.getState()).toBe(driving);

    store.getState().arrive();
    const focused = store.getState();
    store.getState().focus("laptop");
    expect(store.getState()).toBe(focused);
  });

  it("treats the rest view as leave", () => {
    store.getState().focus("laptop");
    store.getState().arrive();
    store.getState().focus(REST_VIEW);
    expect(store.getState()).toMatchObject({
      phase: "leaving",
      view: REST_VIEW,
    });
  });

  it("clears the hover so no label sticks during the drive", () => {
    store.getState().hover("laptop");
    store.getState().focus("laptop");
    expect(store.getState().hovered).toBeNull();
  });
});

describe("leave", () => {
  it("is a no-op in idle", () => {
    const idle = store.getState();
    store.getState().leave();
    expect(store.getState()).toBe(idle);
  });

  it("turns a drive around before it arrives", () => {
    store.getState().focus("pinnwand");
    store.getState().leave();
    expect(store.getState()).toMatchObject({
      phase: "leaving",
      view: REST_VIEW,
    });
  });

  it("leaves a focused hotspot", () => {
    store.getState().focus("pinnwand");
    store.getState().arrive();
    store.getState().leave();
    expect(store.getState().phase).toBe("leaving");
  });
});

describe("arrive", () => {
  it("settles focusing into focused and leaving into idle", () => {
    store.getState().focus("whiteboard");
    store.getState().arrive();
    expect(store.getState().phase).toBe("focused");
    store.getState().leave();
    store.getState().arrive();
    expect(store.getState()).toMatchObject({ phase: "idle", view: REST_VIEW });
  });

  it("does nothing while resting or focused", () => {
    const idle = store.getState();
    store.getState().arrive();
    expect(store.getState()).toBe(idle);
  });
});

describe("isDriving", () => {
  it("is true only while the camera moves", () => {
    expect(isDriving("idle")).toBe(false);
    expect(isDriving("focused")).toBe(false);
    expect(isDriving("focusing")).toBe(true);
    expect(isDriving("leaving")).toBe(true);
  });
});
