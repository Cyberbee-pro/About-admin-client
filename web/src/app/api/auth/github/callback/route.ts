import { NextRequest, NextResponse } from "next/server";
import {
  getGitHubClientId,
  getGitHubClientSecret,
  getAdminSessionSecret,
  toEnvErrorResponse,
} from "@/lib/env";
import {
  COOKIE_AUTH_STAGE,
  COOKIE_OAUTH_STATE,
  STAGE_EXPIRY_SECONDS,
  createAuthStageToken,
  setHttpOnlyCookie,
  clearHttpOnlyCookie,
} from "@/lib/auth/session";
import { timingSafeCompare } from "@/lib/auth/crypto";

export async function GET(request: NextRequest) {
  try {
    // Validate required environment variables first
    const clientId = getGitHubClientId();
    const clientSecret = getGitHubClientSecret();
    getAdminSessionSecret(); // Ensure session secret exists

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = request.cookies.get(COOKIE_OAUTH_STATE)?.value;

    // CSRF check
    if (!state || !savedState || !timingSafeCompare(state, savedState)) {
      return NextResponse.json(
        {
          title: "Bad Request",
          status: 400,
          detail: "Invalid or expired OAuth state parameter.",
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          title: "Bad Request",
          status: 400,
          detail: "Missing authorization code from GitHub callback.",
        },
        { status: 400 }
      );
    }

    // Exchange code for GitHub access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        {
          title: "Bad Gateway",
          status: 502,
          detail: "Failed to exchange authorization code with GitHub.",
        },
        { status: 502 }
      );
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          title: "Bad Gateway",
          status: 502,
          detail: tokenData.error_description || "GitHub token exchange returned no access token.",
        },
        { status: 502 }
      );
    }

    // Fetch user profile from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "About-Admin-Client",
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        {
          title: "Bad Gateway",
          status: 502,
          detail: "Failed to fetch user profile from GitHub.",
        },
        { status: 502 }
      );
    }

    const userData = await userResponse.json();

    // Strict Identity Guard: Must strictly match 'Cyberbee-pro'
    if (userData.login !== "Cyberbee-pro") {
      const response = NextResponse.json(
        {
          title: "Unauthorized",
          status: 401,
          detail: "Access denied: Unauthorized GitHub account.",
        },
        { status: 401 }
      );
      clearHttpOnlyCookie(response, COOKIE_OAUTH_STATE);
      return response;
    }

    // Issue intermediate auth_stage token and redirect to login terminal for password step
    const stageToken = createAuthStageToken("Cyberbee-pro");
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("stage", "password");

    const response = NextResponse.redirect(redirectUrl.toString());
    setHttpOnlyCookie(response, COOKIE_AUTH_STAGE, stageToken, STAGE_EXPIRY_SECONDS);
    clearHttpOnlyCookie(response, COOKIE_OAUTH_STATE);

    return response;
  } catch (error) {
    const envResponse = toEnvErrorResponse(error);
    if (envResponse) return envResponse;

    return NextResponse.json(
      {
        title: "Internal Server Error",
        status: 500,
        detail: error instanceof Error ? error.message : "GitHub OAuth callback failed.",
      },
      { status: 500 }
    );
  }
}
