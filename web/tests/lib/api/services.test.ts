import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getProjects,
  getCategories,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  appendProjectVersion,
} from "@/lib/api/projectService";
import { getConfig, updateConfig } from "@/lib/api/configService";
import { getLogs } from "@/lib/api/logService";

describe("API Service Modules", () => {
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

  describe("projectService", () => {
    test("getProjects calls /api/v1/projects with query filters", async () => {
      let capturedUrl = "";

      global.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(JSON.stringify({ success: true, count: 1, data: [{ slug: "test-slug" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const res = await getProjects({ category: "mobile", featured: false, tag: "android" });
      assert.strictEqual(
        capturedUrl,
        "https://api.about.example.com/api/v1/projects?category=mobile&featured=false&tag=android"
      );
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.count, 1);
    });

    test("getCategories calls /api/v1/projects/categories", async () => {
      let capturedUrl = "";

      global.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(JSON.stringify({ success: true, count: 2, data: ["web", "mobile"] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const res = await getCategories();
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/projects/categories");
      assert.deepStrictEqual(res.data, ["web", "mobile"]);
    });

    test("getProjectBySlug calls /api/v1/projects/:slug with optional admin auth", async () => {
      let capturedUrl = "";
      let capturedHeaders: Record<string, string> = {};

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedHeaders = (init?.headers || {}) as Record<string, string>;
        return new Response(JSON.stringify({ success: true, data: { slug: "my-project" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const res = await getProjectBySlug("my-project", { admin: true });
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/projects/my-project");
      assert.strictEqual(capturedHeaders["Authorization"], "Bearer mock-backend-secret");
      assert.strictEqual(res.data.slug, "my-project");
    });

    test("createProject sends JSON when no files are provided", async () => {
      let capturedBody: unknown;
      let capturedHeaders: Record<string, string> = {};

      global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedHeaders = (init?.headers || {}) as Record<string, string>;
        capturedBody = JSON.parse(init?.body as string);
        return new Response(JSON.stringify({ success: true, data: { _id: "123", title: "Test" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const res = await createProject({
        title: "Test",
        category: "web",
        description: "Desc",
      });

      assert.strictEqual(capturedHeaders["Content-Type"], "application/json");
      assert.strictEqual(capturedHeaders["Authorization"], "Bearer mock-backend-secret");
      assert.deepStrictEqual(capturedBody, { title: "Test", category: "web", description: "Desc" });
      assert.strictEqual(res.data.title, "Test");
    });

    test("createProject constructs FormData when media files are attached", async () => {
      let capturedInit: RequestInit | undefined;

      global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedInit = init;
        return new Response(JSON.stringify({ success: true, data: { _id: "123", title: "With Media" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const mockFile = new Blob(["dummy-image-bytes"], { type: "image/png" });

      await createProject(
        {
          title: "With Media",
          category: "web",
          description: "Desc",
          contributors: [{ name: "Cyberbee", profilePicUrl: "https://example.com/pic.png" }],
        },
        { image: mockFile }
      );

      assert.ok(capturedInit?.body instanceof FormData);
      assert.strictEqual((capturedInit?.headers as Record<string, string>)["Content-Type"], undefined);
    });

    test("updateProject calls PUT /api/v1/projects/:id with admin auth", async () => {
      let capturedUrl = "";
      let capturedMethod = "";

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || "";
        return new Response(JSON.stringify({ success: true, data: { _id: "mongo-id-123", title: "Updated" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const res = await updateProject("mongo-id-123", { title: "Updated" });
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/projects/mongo-id-123");
      assert.strictEqual(capturedMethod, "PUT");
      assert.strictEqual(res.data.title, "Updated");
    });

    test("deleteProject calls DELETE /api/v1/projects/:id with admin auth", async () => {
      let capturedMethod = "";
      let capturedUrl = "";

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || "";
        return new Response(JSON.stringify({ success: true, data: { id: "mongo-id-123" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      await deleteProject("mongo-id-123");
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/projects/mongo-id-123");
      assert.strictEqual(capturedMethod, "DELETE");
    });

    test("appendProjectVersion calls POST /api/v1/projects/:slug/versions", async () => {
      let capturedUrl = "";

      global.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(JSON.stringify({ success: true, message: "Version added", data: { slug: "my-project" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      await appendProjectVersion("my-project", {
        versionTag: "v1.0.0",
        changelog: ["Initial release"],
      });

      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/projects/my-project/versions");
    });
  });

  describe("configService", () => {
    test("getConfig calls GET /api/v1/config", async () => {
      let capturedUrl = "";

      global.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(
          JSON.stringify({
            success: true,
            data: { resumeDriveUrl: "https://drive.google.com/...", statusMessage: "Available", bioSummary: "Bio" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const res = await getConfig();
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/config");
      assert.strictEqual(res.data.statusMessage, "Available");
    });

    test("updateConfig calls PUT /api/v1/config with admin auth", async () => {
      let capturedUrl = "";
      let capturedMethod = "";
      let capturedHeaders: Record<string, string> = {};

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || "";
        capturedHeaders = (init?.headers || {}) as Record<string, string>;
        return new Response(JSON.stringify({ success: true, message: "Config updated", data: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      await updateConfig({ statusMessage: "Busy" });
      assert.strictEqual(capturedUrl, "https://api.about.example.com/api/v1/config");
      assert.strictEqual(capturedMethod, "PUT");
      assert.strictEqual(capturedHeaders["Authorization"], "Bearer mock-backend-secret");
    });
  });

  describe("logService", () => {
    test("getLogs calls GET /api/v1/admin/logs with clamped limit and filters", async () => {
      let capturedUrl = "";
      let capturedHeaders: Record<string, string> = {};

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedHeaders = (init?.headers || {}) as Record<string, string>;
        return new Response(
          JSON.stringify({
            success: true,
            count: 1,
            total: 10,
            page: 1,
            totalPages: 1,
            data: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      await getLogs({
        date: "2026-10-05",
        level: "ERROR",
        page: 2,
        limit: 1000, // Clamped to 500
      });

      assert.strictEqual(
        capturedUrl,
        "https://api.about.example.com/api/v1/admin/logs?date=2026-10-05&level=ERROR&page=2&limit=500"
      );
      assert.strictEqual(capturedHeaders["Authorization"], "Bearer mock-backend-secret");
    });
  });
});
