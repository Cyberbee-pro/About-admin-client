import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getAchievements,
  getAchievementById,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "@/lib/api/achievementService";

describe("Achievement API Service Module", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "https://api.about.example.com",
      ADMIN_SECRET: "mock-backend-secret",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  test("getAchievements calls GET /api/v1/achievements", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method || "GET";
      return new Response(
        JSON.stringify({
          success: true,
          count: 1,
          data: [
            {
              _id: "ach1",
              title: "NERV Pilot Hackathon Winner",
              date: "10/2026",
              detail: "First place in Evangelion sync optimization",
              weight: 10,
              featured: true,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await getAchievements();
    assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/achievements");
    assert.strictEqual(capturedMethod, "GET");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.length, 1);
    assert.strictEqual(res.data[0].title, "NERV Pilot Hackathon Winner");
  });

  test("getAchievementById calls GET /api/v1/achievements/:id", async () => {
    let capturedUrl = "";

    global.fetch = (async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            _id: "ach123",
            title: "MAGI Core Contributor",
            date: "05/2025",
            detail: "Architected decentralized sync protocols",
            weight: 8,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await getAchievementById("ach123");
    assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/achievements/ach123");
    assert.strictEqual(res.data._id, "ach123");
    assert.strictEqual(res.data.title, "MAGI Core Contributor");
  });

  test("createAchievement sends POST with JSON payload and auth", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody = "";

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method || "";
      capturedBody = String(init?.body || "");
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            _id: "new-ach",
            title: "Defense Initiative",
            date: "08/2026",
            detail: "Spearheaded perimeter sensor system",
            weight: 5,
            featured: false,
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await createAchievement({
      title: "Defense Initiative",
      date: "08/2026",
      detail: "Spearheaded perimeter sensor system",
      weight: 5,
      featured: false,
    });

    assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/achievements");
    assert.strictEqual(capturedMethod, "POST");
    const parsedBody = JSON.parse(capturedBody);
    assert.strictEqual(parsedBody.title, "Defense Initiative");
    assert.strictEqual(parsedBody.date, "08/2026");
    assert.strictEqual(parsedBody.detail, "Spearheaded perimeter sensor system");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data._id, "new-ach");
  });

  test("updateAchievement sends PUT to /api/v1/achievements/:id", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody = "";

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method || "";
      capturedBody = String(init?.body || "");
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            _id: "ach-up",
            title: "Updated Title",
            date: "11/2026",
            detail: "Updated detail",
            weight: 7,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await updateAchievement("ach-up", {
      title: "Updated Title",
      date: "11/2026",
      detail: "Updated detail",
      weight: 7,
    });

    assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/achievements/ach-up");
    assert.strictEqual(capturedMethod, "PUT");
    const parsed = JSON.parse(capturedBody);
    assert.strictEqual(parsed.title, "Updated Title");
    assert.strictEqual(res.success, true);
  });

  test("deleteAchievement sends DELETE to /api/v1/achievements/:id", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method || "";
      return new Response(
        JSON.stringify({
          success: true,
          message: "Achievement deleted successfully",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await deleteAchievement("ach-del");
    assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/achievements/ach-del");
    assert.strictEqual(capturedMethod, "DELETE");
    assert.strictEqual(res.success, true);
  });
});
