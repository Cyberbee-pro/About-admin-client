import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  ConfigurationError,
  getRequiredEnv,
  createEnvErrorResponse,
  isConfigurationError,
  toEnvErrorResponse,
  getApiUrl,
} from "@/lib/env";

describe("Strict Environment Validation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("throws structured ConfigurationError when environment variable is missing", () => {
    delete process.env.TEST_REQUIRED_VAR;

    try {
      getRequiredEnv("TEST_REQUIRED_VAR");
      assert.fail("Should have thrown ConfigurationError");
    } catch (error) {
      assert.ok(isConfigurationError(error));
      assert.strictEqual(error.status, 500);
      assert.strictEqual(error.title, "Internal Configuration Error");
      assert.strictEqual(
        error.detail,
        "The required environment variable 'TEST_REQUIRED_VAR' is missing or not set."
      );
      assert.strictEqual(error.code, "ERR_ENV_MISSING_TEST_REQUIRED_VAR");
      assert.deepStrictEqual(error.toJSON(), {
        title: "Internal Configuration Error",
        status: 500,
        detail: "The required environment variable 'TEST_REQUIRED_VAR' is missing or not set.",
        code: "ERR_ENV_MISSING_TEST_REQUIRED_VAR",
      });
    }
  });

  test("throws structured ConfigurationError when environment variable is empty whitespace", () => {
    process.env.TEST_BLANK_VAR = "   ";

    assert.throws(
      () => getRequiredEnv("TEST_BLANK_VAR"),
      (error: unknown) => {
        return (
          isConfigurationError(error) &&
          error.code === "ERR_ENV_MISSING_TEST_BLANK_VAR" &&
          error.status === 500
        );
      }
    );
  });

  test("returns trimmed variable value when present without fallback defaults", () => {
    process.env.TEST_VALID_VAR = "  https://api.example.com  ";
    const value = getRequiredEnv("TEST_VALID_VAR");
    assert.strictEqual(value, "https://api.example.com");
  });

  test("createEnvErrorResponse creates 500 JSON response matching strict standard", async () => {
    const res = createEnvErrorResponse("NEXT_PUBLIC_API_URL");
    assert.strictEqual(res.status, 500);
    const json = await res.json();
    assert.deepStrictEqual(json, {
      title: "Internal Configuration Error",
      status: 500,
      detail: "The required environment variable 'NEXT_PUBLIC_API_URL' is missing or not set.",
      code: "ERR_ENV_MISSING_NEXT_PUBLIC_API_URL",
    });
  });

  test("toEnvErrorResponse converts ConfigurationError to 500 response", async () => {
    const err = new ConfigurationError("ADMIN_SECRET");
    const res = toEnvErrorResponse(err);
    assert.ok(res);
    assert.strictEqual(res.status, 500);
    const json = await res.json();
    assert.strictEqual(json.code, "ERR_ENV_MISSING_ADMIN_SECRET");
  });

  test("toEnvErrorResponse returns null for non-ConfigurationError", () => {
    const standardError = new Error("Regular failure");
    const res = toEnvErrorResponse(standardError);
    assert.strictEqual(res, null);
  });

  test("getApiUrl strictly throws ERR_ENV_MISSING_NEXT_PUBLIC_API_URL when unset", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    assert.throws(() => getApiUrl(), {
      name: "ConfigurationError",
      code: "ERR_ENV_MISSING_NEXT_PUBLIC_API_URL",
    });
  });
});
