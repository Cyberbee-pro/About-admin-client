import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  createSignedToken,
  verifySignedToken,
  createAuthStageToken,
  verifyAuthStageToken,
  createAdminSessionToken,
  verifyAdminSessionToken,
  parseCookieValue,
  COOKIE_ADMIN_SESSION,
} from "@/lib/auth/session";

describe("Session Management & Signed Tokens", () => {
  const secret = "test-session-secret-key-1234567890";
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, ADMIN_SESSION_SECRET: secret };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("createSignedToken and verifySignedToken round-trip correctly", () => {
    const payload = { role: "admin", username: "Cyberbee-pro", exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = createSignedToken(payload, secret);

    assert.ok(token.includes("."));
    const decoded = verifySignedToken<typeof payload>(token, secret);
    assert.deepStrictEqual(decoded, payload);
  });

  test("verifySignedToken rejects tampered token payload", () => {
    const payload = { role: "admin", username: "Cyberbee-pro", exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = createSignedToken(payload, secret);
    const [, signature] = token.split(".");

    // Alter the payload data
    const tamperedData = Buffer.from(JSON.stringify({ role: "admin", username: "imposter", exp: payload.exp })).toString("base64url");
    const tamperedToken = `${tamperedData}.${signature}`;

    const decoded = verifySignedToken(tamperedToken, secret);
    assert.strictEqual(decoded, null);
  });

  test("verifySignedToken rejects expired token", () => {
    const expiredPayload = { role: "admin", username: "Cyberbee-pro", exp: Math.floor(Date.now() / 1000) - 100 };
    const token = createSignedToken(expiredPayload, secret);

    const decoded = verifySignedToken(token, secret);
    assert.strictEqual(decoded, null);
  });

  test("createAuthStageToken and verifyAuthStageToken work for Cyberbee-pro", () => {
    const token = createAuthStageToken("Cyberbee-pro");
    const payload = verifyAuthStageToken(token);

    assert.ok(payload);
    assert.strictEqual(payload?.stage, "github_verified");
    assert.strictEqual(payload?.username, "Cyberbee-pro");
    assert.ok(payload?.exp && payload.exp > Math.floor(Date.now() / 1000));
  });

  test("createAdminSessionToken and verifyAdminSessionToken work for Cyberbee-pro", () => {
    const token = createAdminSessionToken("Cyberbee-pro");
    const payload = verifyAdminSessionToken(token);

    assert.ok(payload);
    assert.strictEqual(payload?.role, "admin");
    assert.strictEqual(payload?.username, "Cyberbee-pro");
    assert.ok(payload?.exp && payload.exp > Math.floor(Date.now() / 1000));
  });

  test("parseCookieValue extracts cookie correctly from Cookie header", () => {
    const header = "other=123; admin_session=my-session-token; theme=dark";
    const value = parseCookieValue(header, COOKIE_ADMIN_SESSION);
    assert.strictEqual(value, "my-session-token");

    const missing = parseCookieValue(header, "nonexistent");
    assert.strictEqual(missing, null);
  });
});
