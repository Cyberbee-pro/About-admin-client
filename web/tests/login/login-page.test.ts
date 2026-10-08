import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getPortfolioUrl,
  isConfigurationError,
} from "@/lib/env";
import {
  createAuthStageToken,
  verifyAuthStageToken,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/auth/session";
import { getSafeReturnTo } from "@/lib/auth/returnTo";

describe("Login Page & Portfolio URL Validation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ADMIN_SESSION_SECRET = "super-secret-key-for-testing-purposes-1234567890";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getPortfolioUrl Accessor", () => {
    test("throws ConfigurationError when NEXT_PUBLIC_PORTFOLIO_URL is missing", () => {
      delete process.env.NEXT_PUBLIC_PORTFOLIO_URL;

      assert.throws(
        () => getPortfolioUrl(),
        (error: unknown) => {
          return (
            isConfigurationError(error) &&
            error.status === 500 &&
            error.code === "ERR_ENV_MISSING_NEXT_PUBLIC_PORTFOLIO_URL"
          );
        }
      );
    });

    test("throws ConfigurationError when NEXT_PUBLIC_PORTFOLIO_URL is empty whitespace", () => {
      process.env.NEXT_PUBLIC_PORTFOLIO_URL = "   \t  \n ";

      assert.throws(
        () => getPortfolioUrl(),
        (error: unknown) => {
          return (
            isConfigurationError(error) &&
            error.status === 500 &&
            error.code === "ERR_ENV_MISSING_NEXT_PUBLIC_PORTFOLIO_URL"
          );
        }
      );
    });

    test("returns trimmed URL when NEXT_PUBLIC_PORTFOLIO_URL is valid", () => {
      process.env.NEXT_PUBLIC_PORTFOLIO_URL = "  https://cyberbee.io  ";
      const result = getPortfolioUrl();
      assert.strictEqual(result, "https://cyberbee.io");
    });
  });

  describe("Login Authentication State Transitions", () => {
    test("validates intermediate GitHub stage token", () => {
      const stageToken = createAuthStageToken("Cyberbee-pro");
      assert.ok(stageToken);

      const verified = verifyAuthStageToken(stageToken);
      assert.ok(verified);
      assert.strictEqual(verified.stage, "github_verified");
      assert.strictEqual(verified.username, "Cyberbee-pro");
      assert.strictEqual(typeof verified.iat, "number");
      assert.strictEqual(typeof verified.exp, "number");
    });

    test("rejects invalid or tampered stage token", () => {
      const stageToken = createAuthStageToken("Cyberbee-pro");
      const tampered = stageToken + "tampered";
      assert.strictEqual(verifyAuthStageToken(tampered), null);
      assert.strictEqual(verifyAuthStageToken(""), null);
      assert.strictEqual(verifyAuthStageToken(undefined), null);
    });

    test("validates full admin session token for dashboard access", () => {
      const sessionToken = createAdminSessionToken("Cyberbee-pro");
      assert.ok(sessionToken);

      const verified = verifyAdminSessionToken(sessionToken);
      assert.ok(verified);
      assert.strictEqual(verified.role, "admin");
      assert.strictEqual(verified.username, "Cyberbee-pro");
    });
  });

  describe("getSafeReturnTo Open Redirect Guard", () => {
    test("defaults to /dashboard when input is undefined or empty", () => {
      assert.strictEqual(getSafeReturnTo(undefined), "/dashboard");
      assert.strictEqual(getSafeReturnTo(""), "/dashboard");
      assert.strictEqual(getSafeReturnTo(null as unknown as string), "/dashboard");
    });

    test("allows valid relative same-origin paths", () => {
      assert.strictEqual(getSafeReturnTo("/dashboard"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("/dashboard/projects"), "/dashboard/projects");
      assert.strictEqual(getSafeReturnTo("/admin/logs?limit=50"), "/admin/logs?limit=50");
    });

    test("neutralizes protocol-relative URLs (//attacker.com)", () => {
      assert.strictEqual(getSafeReturnTo("//attacker.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("//evil.com/phish"), "/dashboard");
    });

    test("neutralizes Windows backslash path bypasses (/\\attacker.com)", () => {
      assert.strictEqual(getSafeReturnTo("/\\attacker.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("/\\evil.com/path"), "/dashboard");
    });

    test("neutralizes absolute external URLs", () => {
      assert.strictEqual(getSafeReturnTo("https://attacker.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("http://attacker.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("javascript:alert(1)"), "/dashboard");
    });
  });
});
