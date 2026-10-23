import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  GET,
  POST,
  PUT,
  DELETE,
} from "@/app/api/admin/[[...path]]/route";
import {
  createAdminSessionToken,
  COOKIE_ADMIN_SESSION,
} from "@/lib/auth/session";

describe("Admin Proxy Route Handler (/api/admin/[[...path]])", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "https://backend.example.com",
      ADMIN_SECRET: "server-side-super-secret-12345",
      ADMIN_SESSION_SECRET: "mock-session-secret-key-abcdef1234567890",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  test("rejects unauthenticated request with 401 Unauthorized", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/api/v1/config");
    const res = await GET(req, { params: Promise.resolve({ path: ["api", "v1", "config"] }) });

    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.status, 401);
    assert.strictEqual(json.title, "Unauthorized");
  });

  test("rejects tampered or non-admin session with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/api/v1/config", {
      headers: {
        cookie: `${COOKIE_ADMIN_SESSION}=invalid-token-tampered`,
      },
    });
    const res = await GET(req, { params: Promise.resolve({ path: ["api", "v1", "config"] }) });

    assert.strictEqual(res.status, 401);
  });

  test("proxies authenticated GET request with query params and injects ADMIN_SECRET", async () => {
    const sessionToken = createAdminSessionToken("Cyberbee-pro");
    let upstreamUrl = "";
    const upstreamHeaders: Record<string, string> = {};

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      upstreamUrl = String(input);
      const h = init?.headers;
      if (h instanceof Headers) {
        h.forEach((v, k) => {
          upstreamHeaders[k] = v;
        });
      }
      return new Response(JSON.stringify({ success: true, count: 1, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const req = new NextRequest("http://localhost:3000/api/admin/api/v1/admin/logs?page=2&limit=50", {
      headers: {
        cookie: `${COOKIE_ADMIN_SESSION}=${sessionToken}`,
      },
    });

    const res = await GET(req, {
      params: Promise.resolve({ path: ["api", "v1", "admin", "logs"] }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(
      upstreamUrl,
      "https://backend.example.com/api/v1/admin/logs?page=2&limit=50"
    );
    assert.strictEqual(
      upstreamHeaders["authorization"],
      "Bearer server-side-super-secret-12345"
    );
    const json = await res.json();
    assert.strictEqual(json.success, true);
  });

  test("proxies authenticated PUT request with JSON body", async () => {
    const sessionToken = createAdminSessionToken("Cyberbee-pro");
    let upstreamUrl = "";
    const upstreamHeaders: Record<string, string> = {};
    let upstreamBody: string = "";

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      upstreamUrl = String(input);
      const h = init?.headers;
      if (h instanceof Headers) {
        h.forEach((v, k) => {
          upstreamHeaders[k] = v;
        });
      }
      if (init?.body instanceof ArrayBuffer) {
        upstreamBody = Buffer.from(init.body).toString("utf-8");
      }
      return new Response(JSON.stringify({ success: true, message: "Updated" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const req = new NextRequest("http://localhost:3000/api/admin/api/v1/config", {
      method: "PUT",
      headers: {
        cookie: `${COOKIE_ADMIN_SESSION}=${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Updated Name" }),
    });

    const res = await PUT(req, {
      params: Promise.resolve({ path: ["api", "v1", "config"] }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(upstreamUrl, "https://backend.example.com/api/v1/config");
    assert.strictEqual(
      upstreamHeaders["authorization"],
      "Bearer server-side-super-secret-12345"
    );
    assert.strictEqual(upstreamHeaders["content-type"], "application/json");
    assert.ok(upstreamBody.includes("Updated Name"));
  });

  test("proxies authenticated POST request with multipart form data", async () => {
    const sessionToken = createAdminSessionToken("Cyberbee-pro");
    let upstreamUrl = "";
    const upstreamHeaders: Record<string, string> = {};
    let upstreamBodyLength = 0;

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      upstreamUrl = String(input);
      const h = init?.headers;
      if (h instanceof Headers) {
        h.forEach((v, k) => {
          upstreamHeaders[k] = v;
        });
      }
      if (init?.body instanceof ArrayBuffer) {
        upstreamBodyLength = init.body.byteLength;
      }
      return new Response(JSON.stringify({ success: true, data: { resumeUrl: "https://pdf.example.com" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const fakeMultipart = "----Boundary123\r\nContent-Disposition: form-data; name=\"resume\"; filename=\"test.pdf\"\r\n\r\nPDF_BYTES\r\n----Boundary123--\r\n";
    const req = new NextRequest("http://localhost:3000/api/admin/api/v1/config/resume", {
      method: "POST",
      headers: {
        cookie: `${COOKIE_ADMIN_SESSION}=${sessionToken}`,
        "Content-Type": "multipart/form-data; boundary=--Boundary123",
      },
      body: fakeMultipart,
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["api", "v1", "config", "resume"] }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(upstreamUrl, "https://backend.example.com/api/v1/config/resume");
    assert.strictEqual(
      upstreamHeaders["authorization"],
      "Bearer server-side-super-secret-12345"
    );
    assert.ok(upstreamHeaders["content-type"].includes("multipart/form-data"));
    assert.ok(upstreamBodyLength > 0);
  });

  test("proxies authenticated DELETE request", async () => {
    const sessionToken = createAdminSessionToken("Cyberbee-pro");
    let upstreamMethod = "";

    global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      upstreamMethod = init?.method || "";
      return new Response(JSON.stringify({ success: true, data: { id: "123" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const req = new NextRequest("http://localhost:3000/api/admin/api/v1/projects/123", {
      method: "DELETE",
      headers: {
        cookie: `${COOKIE_ADMIN_SESSION}=${sessionToken}`,
      },
    });

    const res = await DELETE(req, {
      params: Promise.resolve({ path: ["api", "v1", "projects", "123"] }),
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(upstreamMethod, "DELETE");
  });

  test("returns 500 when ADMIN_SECRET is missing", async () => {
    delete process.env.ADMIN_SECRET;
    const sessionToken = createAdminSessionToken("Cyberbee-pro");

    const req = new NextRequest("http://localhost:3000/api/admin/api/v1/config", {
      headers: {
        cookie: `${COOKIE_ADMIN_SESSION}=${sessionToken}`,
      },
    });

    const res = await GET(req, {
      params: Promise.resolve({ path: ["api", "v1", "config"] }),
    });

    assert.strictEqual(res.status, 500);
    const json = await res.json();
    assert.strictEqual(json.code, "ERR_ENV_MISSING_ADMIN_SECRET");
  });

  test("returns 502 Bad Gateway when upstream fetch fails", async () => {
    const sessionToken = createAdminSessionToken("Cyberbee-pro");

    global.fetch = (async () => {
      throw new Error("Connection refused to backend");
    }) as typeof fetch;

    const req = new NextRequest("http://localhost:3000/api/admin/api/v1/config", {
      headers: {
        cookie: `${COOKIE_ADMIN_SESSION}=${sessionToken}`,
      },
    });

    const res = await GET(req, {
      params: Promise.resolve({ path: ["api", "v1", "config"] }),
    });

    assert.strictEqual(res.status, 502);
    const json = await res.json();
    assert.strictEqual(json.status, 502);
    assert.ok(json.detail.includes("Connection refused"));
  });
});
