import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { getAppOrigin, getGitHubCallbackUrl } from "@/lib/auth/origin";

describe("Dynamic Application Origin & OAuth Callback Resolution", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
    delete process.env.GITHUB_REDIRECT_URI;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getAppOrigin", () => {
    test("resolves production origin from x-forwarded-host and x-forwarded-proto", () => {
      const req = new NextRequest("http://localhost:3000/api/auth/github", {
        headers: {
          "x-forwarded-host": "client.shibraj.dev",
          "x-forwarded-proto": "https",
        },
      });

      const origin = getAppOrigin(req);
      assert.strictEqual(origin, "https://client.shibraj.dev");
    });

    test("handles comma-separated proxy headers (takes first client host and proto)", () => {
      const req = new NextRequest("http://localhost:3000/api/auth/github", {
        headers: {
          "x-forwarded-host": "client.shibraj.dev, internal-proxy.net",
          "x-forwarded-proto": "https, http",
        },
      });

      const origin = getAppOrigin(req);
      assert.strictEqual(origin, "https://client.shibraj.dev");
    });

    test("resolves local dev origin from host header without proto (defaults to http for localhost)", () => {
      const req = new NextRequest("http://localhost:3000/api/auth/github", {
        headers: {
          host: "localhost:3000",
        },
      });

      const origin = getAppOrigin(req);
      assert.strictEqual(origin, "http://localhost:3000");
    });

    test("falls back to NEXT_PUBLIC_APP_URL when no request is provided", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://client.shibraj.dev";
      const origin = getAppOrigin();
      assert.strictEqual(origin, "https://client.shibraj.dev");
    });

    test("normalizes NEXT_PUBLIC_APP_URL when missing protocol", () => {
      process.env.NEXT_PUBLIC_APP_URL = "client.shibraj.dev";
      const origin = getAppOrigin();
      assert.strictEqual(origin, "https://client.shibraj.dev");
    });

    test("falls back to VERCEL_PROJECT_PRODUCTION_URL when no request is provided", () => {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "client.shibraj.dev";
      const origin = getAppOrigin();
      assert.strictEqual(origin, "https://client.shibraj.dev");
    });

    test("falls back to VERCEL_URL when no request is provided", () => {
      process.env.VERCEL_URL = "about-client-preview.vercel.app";
      const origin = getAppOrigin();
      assert.strictEqual(origin, "https://about-client-preview.vercel.app");
    });

    test("defaults to http://localhost:3000 when no headers or env variables are present", () => {
      const origin = getAppOrigin();
      assert.strictEqual(origin, "http://localhost:3000");
    });
  });

  describe("getGitHubCallbackUrl", () => {
    test("uses GITHUB_REDIRECT_URI environment variable when defined", () => {
      process.env.GITHUB_REDIRECT_URI = "https://client.shibraj.dev/custom/oauth/callback";
      const req = new NextRequest("http://localhost:3000/api/auth/github");

      const callbackUrl = getGitHubCallbackUrl(req);
      assert.strictEqual(callbackUrl, "https://client.shibraj.dev/custom/oauth/callback");
    });

    test("dynamically resolves callback URL from request headers when GITHUB_REDIRECT_URI is unset", () => {
      const req = new NextRequest("http://localhost:3000/api/auth/github", {
        headers: {
          "x-forwarded-host": "client.shibraj.dev",
          "x-forwarded-proto": "https",
        },
      });

      const callbackUrl = getGitHubCallbackUrl(req);
      assert.strictEqual(callbackUrl, "https://client.shibraj.dev/api/auth/github/callback");
    });

    test("falls back to localhost callback in local development environment", () => {
      const req = new NextRequest("http://localhost:3000/api/auth/github", {
        headers: {
          host: "localhost:3000",
        },
      });

      const callbackUrl = getGitHubCallbackUrl(req);
      assert.strictEqual(callbackUrl, "http://localhost:3000/api/auth/github/callback");
    });
  });
});
