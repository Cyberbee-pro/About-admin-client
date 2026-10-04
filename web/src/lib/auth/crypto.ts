import crypto from "crypto";

/**
 * Performs a constant-time comparison between two strings to prevent timing attacks.
 * Uses SHA-256 digest hashing before comparing buffers with crypto.timingSafeEqual
 * to avoid timing leaks caused by length discrepancies and prevent buffer length mismatch errors.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Generates a cryptographically secure random token (e.g. for OAuth state).
 */
export function generateRandomToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

/**
 * Computes an HMAC-SHA256 signature encoded as base64url.
 */
export function signHmacSha256(data: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(data, "utf8")
    .digest("base64url");
}

/**
 * Verifies an HMAC-SHA256 signature in constant time.
 */
export function verifyHmacSha256(data: string, signature: string, secret: string): boolean {
  const expectedSignature = signHmacSha256(data, secret);
  return timingSafeCompare(signature, expectedSignature);
}
