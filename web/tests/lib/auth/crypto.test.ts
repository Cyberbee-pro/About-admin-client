import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  timingSafeCompare,
  generateRandomToken,
  signHmacSha256,
  verifyHmacSha256,
} from "@/lib/auth/crypto";

describe("Cryptographic Utilities", () => {
  test("timingSafeCompare returns true for identical strings", () => {
    assert.strictEqual(timingSafeCompare("super-secret-password-123", "super-secret-password-123"), true);
  });

  test("timingSafeCompare returns false for different strings with same length", () => {
    assert.strictEqual(timingSafeCompare("passwordA", "passwordB"), false);
  });

  test("timingSafeCompare returns false for strings of different length without throwing", () => {
    assert.strictEqual(timingSafeCompare("short", "much-longer-string"), false);
    assert.strictEqual(timingSafeCompare("", "nonempty"), false);
  });

  test("generateRandomToken generates distinct cryptographically random hex strings", () => {
    const token1 = generateRandomToken(32);
    const token2 = generateRandomToken(32);
    assert.strictEqual(typeof token1, "string");
    assert.strictEqual(token1.length, 64); // 32 bytes in hex = 64 characters
    assert.notStrictEqual(token1, token2);
  });

  test("signHmacSha256 and verifyHmacSha256 work correctly", () => {
    const secret = "test-secret-key-456";
    const data = "payload-data-to-sign";
    const signature = signHmacSha256(data, secret);

    assert.ok(signature.length > 0);
    assert.strictEqual(verifyHmacSha256(data, signature, secret), true);
    assert.strictEqual(verifyHmacSha256(data, "tampered-sig", secret), false);
    assert.strictEqual(verifyHmacSha256("different-data", signature, secret), false);
    assert.strictEqual(verifyHmacSha256(data, signature, "wrong-secret"), false);
  });
});
