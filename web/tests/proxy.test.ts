import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { createAdminSessionToken, COOKIE_ADMIN_SESSION } from "@/lib/auth/session";

describe("Next.js 16 Proxy Route Protection", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ADMIN_SESSION_SECRET: "mock-session-secret-key-abcdef1234567890",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("redirects unauthenticated request to /dashboard to /login?returnTo=/dashboard", () => {
    const req = new NextRequest("http://localhost:3000/dashboard");
    const res = proxy(req);

    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location");
    assert.ok(location);
    assert.ok(location.includes("/login?returnTo=%2Fdashboard"));
  });

  test("allows authenticated request with valid admin_session to /dashboard", () => {
    const sessionToken = createAdminSessionToken("Cyberbee-pro");
    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: `${COOKIE_ADMIN_SESSION}=${sessionToken}`,
      },
    });

    const res = proxy(req);
    // NextResponse.next() returns a 200 response with x-middleware-next header
    assert.strictEqual(res.status, 200);
    assert.ok(!res.headers.get("location"));
  });

  test("returns 401 JSON for unauthenticated request to /api/admin/*", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/settings");
    const res = proxy(req);

    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.status, 401);
    assert.strictEqual(json.title, "Unauthorized");
  });

  test("allows public routes like / or /login without redirection", () => {
    const req = new NextRequest("http://localhost:3000/login");
    const res = proxy(req);

    assert.strictEqual(res.status, 200);
    assert.ok(!res.headers.get("location"));
  });
});
