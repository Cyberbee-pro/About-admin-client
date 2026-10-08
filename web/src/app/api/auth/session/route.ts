import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ADMIN_SESSION,
  COOKIE_AUTH_STAGE,
  verifyAdminSessionToken,
  verifyAuthStageToken,
} from "@/lib/auth/session";
import { toEnvErrorResponse, getAdminSessionSecret } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    getAdminSessionSecret(); // Ensure session secret exists

    const sessionCookie = request.cookies.get(COOKIE_ADMIN_SESSION)?.value;
    const adminSession = verifyAdminSessionToken(sessionCookie);

    if (adminSession && adminSession.role === "admin" && adminSession.username === "Cyberbee-pro") {
      return NextResponse.json({
        authenticated: true,
        stage: "admin",
        username: "Cyberbee-pro",
      });
    }

    const stageCookie = request.cookies.get(COOKIE_AUTH_STAGE)?.value;
    const stagePayload = verifyAuthStageToken(stageCookie);

    if (stagePayload && stagePayload.stage === "github_verified" && stagePayload.username === "Cyberbee-pro") {
      return NextResponse.json({
        authenticated: false,
        stage: "github_verified",
        username: "Cyberbee-pro",
      });
    }

    return NextResponse.json({
      authenticated: false,
      stage: "unauthenticated",
      username: null,
    });
  } catch (error) {
    const envResponse = toEnvErrorResponse(error);
    if (envResponse) return envResponse;

    return NextResponse.json(
      {
        title: "Internal Server Error",
        status: 500,
        detail: error instanceof Error ? error.message : "Session inspection failed.",
      },
      { status: 500 }
    );
  }
}
