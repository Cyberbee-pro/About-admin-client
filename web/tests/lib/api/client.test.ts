import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { apiClient, ApiClientError } from "@/lib/api/client";

describe("Shared API Client", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "https://api.about.example.com",
      ADMIN_SECRET: "mock-admin-secret-token",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  test("throws ConfigurationError when NEXT_PUBLIC_API_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    await assert.rejects(
      async () => {
        await apiClient("/api/v1/projects");
      },
      {
        name: "ConfigurationError",
        code: "ERR_ENV_MISSING_NEXT_PUBLIC_API_URL",
      }
    );
  });

  test("makes GET request to correct URL with params and headers", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedHeaders = (init?.headers || {}) as Record<string, string>;

      return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await apiClient<{ success: boolean; data: unknown[] }>("/api/v1/projects", {
      params: { category: "web", featured: true },
    });

    assert.strictEqual(
      capturedUrl,
      "https://api.about.example.com/api/v1/projects?category=web&featured=true"
    );
    assert.strictEqual(capturedHeaders["Accept"], "application/json");
    assert.strictEqual(result.success, true);
  });

  test("injects Authorization Bearer header when auth: true is specified", async () => {
    let capturedHeaders: Record<string, string> = {};

    global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = (init?.headers || {}) as Record<string, string>;
      return new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await apiClient("/api/v1/projects", {
      method: "POST",
      body: { title: "New Project" },
      auth: true,
    });

    assert.strictEqual(
      capturedHeaders["Authorization"],
      "Bearer mock-admin-secret-token"
    );
  });

  test("throws ApiClientError with backend message on non-200 responses", async () => {
    global.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Project with this slug already exists",
          errors: { slug: "duplicate" },
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await apiClient("/api/v1/projects", { method: "POST", body: {} });
      },
      (error: unknown) => {
        return (
          error instanceof ApiClientError &&
          error.status === 409 &&
          error.message === "Project with this slug already exists"
        );
      }
    );
  });

  test("passes default AbortSignal timeout to fetch", async () => {
    let capturedSignal: AbortSignal | undefined;

    global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal;
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await apiClient("/api/v1/projects");

    assert.ok(capturedSignal instanceof AbortSignal);
    assert.strictEqual(capturedSignal.aborted, false);
  });

  test("respects custom signal and timeoutMs options", async () => {
    let capturedSignal: AbortSignal | undefined;

    global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal;
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const controller = new AbortController();
    await apiClient("/api/v1/projects", {
      timeoutMs: 5000,
      signal: controller.signal,
    });

    assert.ok(capturedSignal instanceof AbortSignal);
    assert.strictEqual(capturedSignal.aborted, false);
  });
});
