import { NextResponse } from "next/server";
import {
  COOKIE_ADMIN_SESSION,
  COOKIE_AUTH_STAGE,
  clearHttpOnlyCookie,
} from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  clearHttpOnlyCookie(response, COOKIE_ADMIN_SESSION);
  clearHttpOnlyCookie(response, COOKIE_AUTH_STAGE);
  return response;
}
