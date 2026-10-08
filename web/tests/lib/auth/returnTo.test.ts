import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getSafeReturnTo } from "@/lib/auth/returnTo";

describe("returnTo URL Sanitization & Open Redirect Guard", () => {
  describe("Fallbacks for invalid and non-string inputs", () => {
    test("returns /dashboard for undefined, null, and non-string values", () => {
      assert.strictEqual(getSafeReturnTo(undefined), "/dashboard");
      assert.strictEqual(getSafeReturnTo(null as unknown as string), "/dashboard");
      assert.strictEqual(getSafeReturnTo(123 as unknown as string), "/dashboard");
      assert.strictEqual(getSafeReturnTo({} as unknown as string), "/dashboard");
      assert.strictEqual(getSafeReturnTo(""), "/dashboard");
    });
  });

  describe("Preserves legitimate relative paths", () => {
    test("allows standard pathname routes", () => {
      assert.strictEqual(getSafeReturnTo("/dashboard"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("/projects"), "/projects");
      assert.strictEqual(getSafeReturnTo("/dashboard/settings"), "/dashboard/settings");
    });

    test("preserves query strings and URL fragments", () => {
      assert.strictEqual(
        getSafeReturnTo("/dashboard/projects?status=active&sort=desc"),
        "/dashboard/projects?status=active&sort=desc"
      );
      assert.strictEqual(
        getSafeReturnTo("/admin/logs?limit=50#section-top"),
        "/admin/logs?limit=50#section-top"
      );
    });
  });

  describe("Neutralizes protocol-relative URL bypasses", () => {
    test("rejects standard protocol-relative URLs", () => {
      assert.strictEqual(getSafeReturnTo("//evil.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("//attacker.example.com/phish"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("///evil.com"), "/dashboard");
    });

    test("rejects dot-slash protocol-relative variants", () => {
      assert.strictEqual(getSafeReturnTo("/.//evil.com"), "/dashboard");
    });
  });

  describe("Neutralizes control character & tab-injection bypasses", () => {
    test("neutralizes ASCII tab injections in authority or path prefix", () => {
      assert.strictEqual(getSafeReturnTo("/\t/evil.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("/\\t/evil.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("\t//evil.com"), "/dashboard");
    });

    test("neutralizes newline and carriage return injections", () => {
      assert.strictEqual(getSafeReturnTo("/\n/evil.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("/\r/evil.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("/\r\n/evil.com"), "/dashboard");
    });
  });

  describe("Neutralizes backslash and Windows-style path separators", () => {
    test("rejects Windows backslash bypasses", () => {
      assert.strictEqual(getSafeReturnTo("/\\evil.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("/\\/evil.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("\\\\evil.com"), "/dashboard");
    });
  });

  describe("Neutralizes absolute and dangerous URI schemes", () => {
    test("rejects absolute HTTP/HTTPS URLs", () => {
      assert.strictEqual(getSafeReturnTo("https://evil.com"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("http://attacker.com/dashboard"), "/dashboard");
    });

    test("rejects javascript: and data: pseudo-schemes", () => {
      assert.strictEqual(getSafeReturnTo("javascript:alert(document.cookie)"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("data:text/html,<script>alert(1)</script>"), "/dashboard");
      assert.strictEqual(getSafeReturnTo("vbscript:msgbox(1)"), "/dashboard");
    });
  });
});
