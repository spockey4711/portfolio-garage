import { describe, expect, it } from "vitest";
import { API_URL } from "./api";
import { fakeFetch, json } from "./fixtures";
import {
  challengeResponse,
  createSubscription,
  deleteSubscription,
  eventFromBody,
  listSubscriptions,
} from "./webhook";

const app = { clientId: "42", clientSecret: "s3cret" };

describe("eventFromBody", () => {
  it("reads Strava's event", () => {
    expect(
      eventFromBody({
        aspect_type: "update",
        event_time: 1758190000,
        object_id: 1234567890,
        object_type: "activity",
        owner_id: 4711,
        subscription_id: 1,
        updates: { title: "Renamed" },
      }),
    ).toEqual({
      objectType: "activity",
      objectId: 1234567890,
      aspect: "update",
      ownerId: 4711,
    });
  });

  it("rejects anything else", () => {
    expect(eventFromBody(null)).toBeNull();
    expect(eventFromBody("x")).toBeNull();
    expect(eventFromBody({})).toBeNull();
    expect(
      eventFromBody({
        aspect_type: "create",
        object_id: "1",
        object_type: "activity",
        owner_id: 4711,
      }),
    ).toBeNull();
    expect(
      eventFromBody({
        aspect_type: "rename",
        object_id: 1,
        object_type: "activity",
        owner_id: 4711,
      }),
    ).toBeNull();
  });
});

describe("challengeResponse", () => {
  const query = (verify: string, mode = "subscribe") =>
    new URLSearchParams({
      "hub.mode": mode,
      "hub.verify_token": verify,
      "hub.challenge": "15f7d1a91c1f40f8a748fd134752feb3",
    });

  it("echoes the challenge for the right verify token", () => {
    expect(challengeResponse(query("geheim"), "geheim")).toEqual({
      "hub.challenge": "15f7d1a91c1f40f8a748fd134752feb3",
    });
  });

  it("refuses a wrong token, a wrong mode or no challenge", () => {
    expect(challengeResponse(query("falsch"), "geheim")).toBeNull();
    expect(
      challengeResponse(query("geheim", "unsubscribe"), "geheim"),
    ).toBeNull();
    expect(
      challengeResponse(
        new URLSearchParams({
          "hub.mode": "subscribe",
          "hub.verify_token": "geheim",
        }),
        "geheim",
      ),
    ).toBeNull();
  });
});

describe("subscriptions", () => {
  const url = `${API_URL}/push_subscriptions`;

  it("lists with the app credentials in the query", async () => {
    const { fetchFn, calls } = fakeFetch({
      [url]: () =>
        json([{ id: 7, callback_url: "https://g.example/api/strava/webhook" }]),
    });
    expect(await listSubscriptions(app, fetchFn)).toEqual([
      { id: 7, callbackUrl: "https://g.example/api/strava/webhook" },
    ]);
    expect(calls[0].searchParams.get("client_secret")).toBe("s3cret");
  });

  it("creates with a form body and returns the id", async () => {
    let body: URLSearchParams | undefined;
    const { fetchFn } = fakeFetch({
      [url]: (_url, init) => {
        body = init?.body as URLSearchParams;
        return json({ id: 8 }, 201);
      },
    });
    expect(
      await createSubscription(
        app,
        "https://g.example/api/strava/webhook",
        "geheim",
        fetchFn,
      ),
    ).toBe(8);
    expect(body?.get("callback_url")).toBe(
      "https://g.example/api/strava/webhook",
    );
    expect(body?.get("verify_token")).toBe("geheim");
  });

  it("deletes by id and reports a refusal", async () => {
    const { fetchFn, calls } = fakeFetch({
      [`${url}/8`]: () => new Response(null, { status: 204 }),
      [`${url}/9`]: () => json({ message: "Forbidden" }, 403),
    });
    await deleteSubscription(app, 8, fetchFn);
    expect(calls[0].pathname).toBe("/api/v3/push_subscriptions/8");
    await expect(deleteSubscription(app, 9, fetchFn)).rejects.toThrow("403");
  });
});
