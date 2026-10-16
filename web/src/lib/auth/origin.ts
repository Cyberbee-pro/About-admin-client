import { NextRequest } from "next/server";

/**
 * Normalizes a URL/host string by ensuring it has a valid http/https protocol prefix.
 */
function normalizeUrl(urlOrHost: string, defaultProtocol = "https"): string {
  const trimmed = urlOrHost.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `${defaultProtocol}://${trimmed}`;
}

/**
 * Extracts and sanitizes the primary host from a potentially comma-separated header value.
 */
function extractFirstHeaderValue(headerVal: string | null | undefined): string | null {
  if (!headerVal) return null;
  const first = headerVal.split(",")[0].trim();
  return first.length > 0 ? first : null;
}

/**
 * Dynamically resolves the canonical application origin based on:
 * 1. Request headers (x-forwarded-host, x-forwarded-proto, host)
 * 2. Fallback environment variables (NEXT_PUBLIC_APP_URL, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL)
 * 3. Request URL / nextUrl origin
 * 4. Default fallback: http://localhost:3000
 */
export function getAppOrigin(request?: NextRequest | Request): string {
  // 1. Dynamic resolution from request headers (adapting to reverse proxies and live Vercel domains)
  if (request) {
    const forwardedProto = extractFirstHeaderValue(request.headers.get("x-forwarded-proto"));
    const forwardedHost = extractFirstHeaderValue(request.headers.get("x-forwarded-host"));
    const host = forwardedHost || extractFirstHeaderValue(request.headers.get("host"));

    if (host) {
      const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
      const proto = forwardedProto || (isLocal ? "http" : "https");
      return `${proto}://${host}`;
    }

    if ("nextUrl" in request && request.nextUrl?.origin) {
      return request.nextUrl.origin;
    }

    if (request.url) {
      try {
        return new URL(request.url).origin;
      } catch {
        // Continue to fallback environment variables
      }
    }
  }

  // 2. Explicit environment variable override
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== "") {
    return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  }

  // 3. Vercel deployment variables
  if (
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL.trim() !== ""
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`;
  }

  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== "") {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }

  // 4. Default fallback for local development
  return "http://localhost:3000";
}

/**
 * Computes the GitHub OAuth callback URL.
 * Prioritizes GITHUB_REDIRECT_URI from environment, then dynamic origin + path.
 */
export function getGitHubCallbackUrl(request?: NextRequest | Request): string {
  const envRedirect = process.env.GITHUB_REDIRECT_URI?.trim();
  if (envRedirect) {
    return normalizeUrl(envRedirect);
  }

  const origin = getAppOrigin(request);
  return `${origin}/api/auth/github/callback`;
}
