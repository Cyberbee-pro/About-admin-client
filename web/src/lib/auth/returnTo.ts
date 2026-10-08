/**
 * Sanitizes a returnTo query parameter to prevent open redirect vulnerabilities.
 * Normalizes input using WHATWG URL parser against a controlled dummy origin
 * to neutralize protocol-relative attacks, Windows backslash bypasses, and
 * ASCII control character injections (e.g. tabs or newlines).
 */
export function getSafeReturnTo(raw: string | undefined): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  try {
    // Parse against a controlled base to neutralize absolute URLs, protocol-relative attacks,
    // and hidden control characters (tabs, newlines)
    const parsed = new URL(raw, "http://local");
    if (parsed.origin === "http://local") {
      const candidate = parsed.pathname + parsed.search + parsed.hash;
      if (candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.startsWith("/\\")) {
        return candidate;
      }
    }
  } catch {
    // Fall back to default on malformed URL parsing error
  }
  return "/dashboard";
}
