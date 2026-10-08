import { NextResponse } from "next/server";
import { getAdminSessionSecret } from "../env";
import { signHmacSha256, verifyHmacSha256 } from "./crypto";

export const COOKIE_AUTH_STAGE = "admin_auth_stage";
export const COOKIE_ADMIN_SESSION = "admin_session";
export const COOKIE_OAUTH_STATE = "admin_oauth_state";

export const STAGE_EXPIRY_SECONDS = 15 * 60; // 15 minutes
export const SESSION_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours
export const OAUTH_STATE_EXPIRY_SECONDS = 10 * 60; // 10 minutes

export interface AuthStagePayload {
  stage: "github_verified";
  username: "Cyberbee-pro";
  iat: number;
  exp: number;
}

export interface AdminSessionPayload {
  role: "admin";
  username: "Cyberbee-pro";
  iat: number;
  exp: number;
}

/**
 * Encodes a JSON payload and appends an HMAC-SHA256 signature in the format: <base64url-payload>.<signature>
 */
export function createSignedToken<T extends object>(payload: T, secret: string): string {
  const jsonStr = JSON.stringify(payload);
  const data = Buffer.from(jsonStr, "utf8").toString("base64url");
  const signature = signHmacSha256(data, secret);
  return `${data}.${signature}`;
}

/**
 * Verifies and parses a signed token. Returns null if invalid, expired, or tampered.
 */
export function verifySignedToken<T extends { exp?: number }>(
  token: string | null | undefined,
  secret: string
): T | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [data, signature] = parts;
  if (!data || !signature) {
    return null;
  }

  if (!verifyHmacSha256(data, signature, secret)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr) as T;

    if (payload.exp && typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (now > payload.exp) {
        return null; // Expired
      }
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Creates a signed token for the intermediate GitHub-verified stage.
 */
export function createAuthStageToken(username: "Cyberbee-pro"): string {
  const secret = getAdminSessionSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthStagePayload = {
    stage: "github_verified",
    username,
    iat: now,
    exp: now + STAGE_EXPIRY_SECONDS,
  };
  return createSignedToken(payload, secret);
}

/**
 * Verifies an intermediate auth stage token.
 */
export function verifyAuthStageToken(token: string | null | undefined): AuthStagePayload | null {
  const secret = getAdminSessionSecret();
  return verifySignedToken<AuthStagePayload>(token, secret);
}

/**
 * Creates a full signed admin session token.
 */
export function createAdminSessionToken(username: "Cyberbee-pro"): string {
  const secret = getAdminSessionSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    role: "admin",
    username,
    iat: now,
    exp: now + SESSION_EXPIRY_SECONDS,
  };
  return createSignedToken(payload, secret);
}

/**
 * Verifies a full admin session token.
 */
export function verifyAdminSessionToken(token: string | null | undefined): AdminSessionPayload | null {
  const secret = getAdminSessionSecret();
  return verifySignedToken<AdminSessionPayload>(token, secret);
}

/**
 * Helper to parse a specific cookie value from a Cookie header string.
 */
export function parseCookieValue(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Sets an HTTP-only secure cookie on a Next.js response.
 */
export function setHttpOnlyCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number
): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name,
    value,
    maxAge,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Clears a cookie on a Next.js response.
 */
export function clearHttpOnlyCookie(response: NextResponse, name: string): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name,
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}
