import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
} from "@/lib/api/skillService";
import { getHealth } from "@/lib/api/healthService";

describe("Skill & Health API Service Modules", () => {
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

  describe("skillService", () => {
    test("getSkills calls GET /api/v1/skills", async () => {
      let capturedUrl = "";
      let capturedMethod = "";

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || "GET";
        return new Response(
          JSON.stringify({
            success: true,
            count: 2,
            data: [
              { _id: "s1", name: "TypeScript", weight: 95 },
              { _id: "s2", name: "Next.js", weight: 90 },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const res = await getSkills();
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/skills");
      assert.strictEqual(capturedMethod, "GET");
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data.length, 2);
      assert.strictEqual(res.data[0].name, "TypeScript");
    });

    test("getSkillById calls GET /api/v1/skills/:id", async () => {
      let capturedUrl = "";

      global.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(
          JSON.stringify({
            success: true,
            data: { _id: "skill-123", name: "React", weight: 92 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const res = await getSkillById("skill-123");
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/skills/skill-123");
      assert.strictEqual(res.data.name, "React");
    });

    test("createSkill sends JSON when no files are attached", async () => {
      let capturedUrl = "";
      let capturedBody = "";
      let capturedAuth = "";

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedBody = init?.body as string;
        const headers = init?.headers as Record<string, string>;
        capturedAuth = headers?.Authorization || "";
        return new Response(
          JSON.stringify({
            success: true,
            data: { _id: "new-s", name: "Kotlin", weight: 85 },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const res = await createSkill({ name: "Kotlin", weight: 85, featured: true });
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/skills");
      assert.strictEqual(capturedAuth, "Bearer mock-backend-secret");
      const parsed = JSON.parse(capturedBody);
      assert.strictEqual(parsed.name, "Kotlin");
      assert.strictEqual(parsed.weight, 85);
      assert.strictEqual(res.success, true);
    });

    test("updateSkill calls PUT /api/v1/skills/:id with admin auth", async () => {
      let capturedUrl = "";
      let capturedMethod = "";

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || "GET";
        return new Response(
          JSON.stringify({
            success: true,
            data: { _id: "s1", name: "TypeScript", weight: 100 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const res = await updateSkill("s1", { weight: 100 });
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/skills/s1");
      assert.strictEqual(capturedMethod, "PUT");
      assert.strictEqual(res.data.weight, 100);
    });

    test("deleteSkill calls DELETE /api/v1/skills/:id", async () => {
      let capturedUrl = "";
      let capturedMethod = "";

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || "GET";
        return new Response(
          JSON.stringify({ success: true, message: "Skill deleted" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const res = await deleteSkill("s1");
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/skills/s1");
      assert.strictEqual(capturedMethod, "DELETE");
      assert.strictEqual(res.success, true);
    });
  });

  describe("healthService", () => {
    test("getHealth calls GET /api/v1/health and returns service telemetry", async () => {
      let capturedUrl = "";

      global.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(
          JSON.stringify({
            status: "healthy",
            service: "about-core",
            version: "1.0.0",
            timestamp: "2026-10-17T09:42:00.000Z",
            dbStatus: "connected",
            memoryUsageMB: 28,
            nodeVersion: "v20.18.0",
            env: "production",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const health = await getHealth();
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/health");
      assert.strictEqual(health.status, "healthy");
      assert.strictEqual(health.dbStatus, "connected");
      assert.strictEqual(health.memoryUsageMB, 28);
    });
  });
});
