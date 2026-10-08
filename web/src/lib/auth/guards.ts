import { cookies } from "next/headers";
import {
  COOKIE_ADMIN_SESSION,
  AdminSessionPayload,
  verifyAdminSessionToken,
  parseCookieValue,
} from "./session";

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Unauthorized: Admin session required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Validates the admin session from Next.js server component cookies.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_ADMIN_SESSION)?.value;
  return verifyAdminSessionToken(token);
}

/**
 * Validates the admin session from an incoming Request or Cookie header.
 */
export function getAdminSessionFromHeader(cookieHeader: string | null | undefined): AdminSessionPayload | null {
  const token = parseCookieValue(cookieHeader, COOKIE_ADMIN_SESSION);
  return verifyAdminSessionToken(token);
}

/**
 * Strict guard for server actions and route handlers: throws an UnauthorizedError if no valid session is present.
 */
export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}
