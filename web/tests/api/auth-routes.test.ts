import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as getGithubAuth } from "@/app/api/auth/github/route";
import { GET as getGithubCallback } from "@/app/api/auth/github/callback/route";
import { POST as postPassword } from "@/app/api/auth/password/route";
import { GET as getSession } from "@/app/api/auth/session/route";
import { POST as postLogout } from "@/app/api/auth/logout/route";
import {
  COOKIE_OAUTH_STATE,
  COOKIE_AUTH_STAGE,
  COOKIE_ADMIN_SESSION,
  createAuthStageToken,
  createAdminSessionToken,
} from "@/lib/auth/session";

describe("Authentication Routes & Security Guards", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "https://api.about.example.com",
      ADMIN_SECRET: "mock-backend-admin-secret",
      GITHUB_CLIENT_ID: "mock-github-client-id",
      GITHUB_CLIENT_SECRET: "mock-github-client-secret",
      ADMIN_PASSWORD: "CorrectSuperAdminPassword42!",
      ADMIN_SESSION_SECRET: "mock-session-secret-key-abcdef1234567890",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  describe("GET /api/auth/github", () => {
    test("returns 500 configuration error if GITHUB_CLIENT_ID is missing", async () => {
      delete process.env.GITHUB_CLIENT_ID;

      const res = await getGithubAuth();

      assert.strictEqual(res.status, 500);
      const json = await res.json();
      assert.strictEqual(json.code, "ERR_ENV_MISSING_GITHUB_CLIENT_ID");
      assert.strictEqual(json.title, "Internal Configuration Error");
    });

    test("redirects to GitHub with client_id, scope, and sets oauth_state cookie", async () => {
      const res = await getGithubAuth();

      assert.strictEqual(res.status, 307); // NextResponse.redirect default
      const location = res.headers.get("location");
      assert.ok(location);
      assert.ok(location.includes("https://github.com/login/oauth/authorize"));
      assert.ok(location.includes("client_id=mock-github-client-id"));
      assert.ok(location.includes("scope=read%3Auser"));

      // Check cookie
      const setCookie = res.headers.get("set-cookie");
      assert.ok(setCookie);
      assert.ok(setCookie.includes(COOKIE_OAUTH_STATE));
    });
  });

  describe("GET /api/auth/github/callback", () => {
    test("rejects invalid or missing OAuth state with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/github/callback?code=abc&state=wrong-state", {
        headers: {
          cookie: `${COOKIE_OAUTH_STATE}=expected-state`,
        },
      });

      const res = await getGithubCallback(req);
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.detail, "Invalid or expired OAuth state parameter.");
    });

    test("Strict Identity Guard: rejects users other than 'Cyberbee-pro' with 401", async () => {
      const state = "valid-matching-state";

      // Mock GitHub token exchange and user API
      global.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("access_token")) {
          return new Response(JSON.stringify({ access_token: "mock-gh-token" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (urlStr.includes("api.github.com/user")) {
          return new Response(JSON.stringify({ login: "some-intruder", id: 99999 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not found", { status: 404 });
      }) as typeof fetch;

      const req = new NextRequest(`http://localhost:3000/api/auth/github/callback?code=valid-code&state=${state}`, {
        headers: {
          cookie: `${COOKIE_OAUTH_STATE}=${state}`,
        },
      });

      const res = await getGithubCallback(req);
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.detail, "Access denied: Unauthorized GitHub account.");
    });

    test("Strict Identity Guard: accepts 'Cyberbee-pro' and issues auth_stage cookie", async () => {
      const state = "valid-matching-state";

      global.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("access_token")) {
          return new Response(JSON.stringify({ access_token: "mock-gh-token" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (urlStr.includes("api.github.com/user")) {
          return new Response(JSON.stringify({ login: "Cyberbee-pro", id: 12345 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not found", { status: 404 });
      }) as typeof fetch;

      const req = new NextRequest(`http://localhost:3000/api/auth/github/callback?code=valid-code&state=${state}`, {
        headers: {
          cookie: `${COOKIE_OAUTH_STATE}=${state}`,
        },
      });

      const res = await getGithubCallback(req);
      assert.strictEqual(res.status, 307);
      const location = res.headers.get("location");
      assert.ok(location);
      assert.ok(location.includes("/login?stage=password"));

      const setCookie = res.headers.get("set-cookie");
      assert.ok(setCookie);
      assert.ok(setCookie.includes(COOKIE_AUTH_STAGE));
    });
  });

  describe("POST /api/auth/password", () => {
    test("rejects password submission if Factor 1 (GitHub auth stage) is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "CorrectSuperAdminPassword42!" }),
      });

      const res = await postPassword(req);
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.detail, "GitHub authentication required before password verification.");
    });

    test("rejects incorrect password with 401", async () => {
      const stageToken = createAuthStageToken("Cyberbee-pro");

      const req = new NextRequest("http://localhost:3000/api/auth/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${COOKIE_AUTH_STAGE}=${stageToken}`,
        },
        body: JSON.stringify({ password: "wrong-password" }),
      });

      const res = await postPassword(req);
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.detail, "Invalid administrative password.");
    });

    test("accepts correct password, issues admin_session cookie, and clears auth_stage", async () => {
      const stageToken = createAuthStageToken("Cyberbee-pro");

      const req = new NextRequest("http://localhost:3000/api/auth/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${COOKIE_AUTH_STAGE}=${stageToken}`,
        },
        body: JSON.stringify({ password: "CorrectSuperAdminPassword42!" }),
      });

      const res = await postPassword(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.redirect, "/dashboard");

      const setCookie = res.headers.get("set-cookie");
      assert.ok(setCookie);
      assert.ok(setCookie.includes(COOKIE_ADMIN_SESSION));
    });
  });

  describe("GET /api/auth/session & POST /api/auth/logout", () => {
    test("session returns unauthenticated when no cookies are provided", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/session");
      const res = await getSession(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.deepStrictEqual(json, {
        authenticated: false,
        stage: "unauthenticated",
        username: null,
      });
    });

    test("session returns stage: github_verified when stage cookie is provided", async () => {
      const stageToken = createAuthStageToken("Cyberbee-pro");
      const req = new NextRequest("http://localhost:3000/api/auth/session", {
        headers: { cookie: `${COOKIE_AUTH_STAGE}=${stageToken}` },
      });
      const res = await getSession(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.authenticated, false);
      assert.strictEqual(json.stage, "github_verified");
      assert.strictEqual(json.username, "Cyberbee-pro");
    });

    test("session returns stage: admin when admin_session cookie is provided", async () => {
      const sessionToken = createAdminSessionToken("Cyberbee-pro");
      const req = new NextRequest("http://localhost:3000/api/auth/session", {
        headers: { cookie: `${COOKIE_ADMIN_SESSION}=${sessionToken}` },
      });
      const res = await getSession(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.authenticated, true);
      assert.strictEqual(json.stage, "admin");
      assert.strictEqual(json.username, "Cyberbee-pro");
    });

    test("logout clears session cookies", async () => {
      const res = await postLogout();
      assert.strictEqual(res.status, 200);
      const setCookie = res.headers.get("set-cookie");
      assert.ok(setCookie);
      assert.ok(setCookie.includes("admin_session="));
      assert.ok(setCookie.includes("admin_auth_stage="));
    });
  });
});
