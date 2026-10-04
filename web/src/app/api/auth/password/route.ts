import { NextRequest, NextResponse } from "next/server";
import {
  getAdminPassword,
  getAdminSessionSecret,
  toEnvErrorResponse,
} from "@/lib/env";
import {
  COOKIE_AUTH_STAGE,
  COOKIE_ADMIN_SESSION,
  SESSION_EXPIRY_SECONDS,
  verifyAuthStageToken,
  createAdminSessionToken,
  setHttpOnlyCookie,
  clearHttpOnlyCookie,
} from "@/lib/auth/session";
import { timingSafeCompare } from "@/lib/auth/crypto";

export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables first
    const adminPassword = getAdminPassword();
    getAdminSessionSecret(); // Ensure session secret exists

    // Dual-Auth Requirement: Verify Factor 1 (GitHub OAuth verified as Cyberbee-pro)
    const stageCookie = request.cookies.get(COOKIE_AUTH_STAGE)?.value;
    const stagePayload = verifyAuthStageToken(stageCookie);

    if (!stagePayload || stagePayload.stage !== "github_verified" || stagePayload.username !== "Cyberbee-pro") {
      return NextResponse.json(
        {
          title: "Unauthorized",
          status: 401,
          detail: "GitHub authentication required before password verification.",
        },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          title: "Bad Request",
          status: 400,
          detail: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const { password } = (body as { password?: string }) || {};

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        {
          title: "Bad Request",
          status: 400,
          detail: "Missing or invalid password in request payload.",
        },
        { status: 400 }
      );
    }

    // Secure constant-time comparison against ADMIN_PASSWORD
    const isPasswordValid = timingSafeCompare(password, adminPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          title: "Unauthorized",
          status: 401,
          detail: "Invalid administrative password.",
        },
        { status: 401 }
      );
    }

    // Factor 2 succeeded: Issue full signed admin session cookie and clear auth_stage cookie
    const sessionToken = createAdminSessionToken("Cyberbee-pro");
    const response = NextResponse.json({
      success: true,
      redirect: "/dashboard",
    });

    setHttpOnlyCookie(response, COOKIE_ADMIN_SESSION, sessionToken, SESSION_EXPIRY_SECONDS);
    clearHttpOnlyCookie(response, COOKIE_AUTH_STAGE);

    return response;
  } catch (error) {
    const envResponse = toEnvErrorResponse(error);
    if (envResponse) return envResponse;

    return NextResponse.json(
      {
        title: "Internal Server Error",
        status: 500,
        detail: error instanceof Error ? error.message : "Password verification failed.",
      },
      { status: 500 }
    );
  }
}
