import { NextResponse } from "next/server";
import { getGitHubClientId, toEnvErrorResponse } from "@/lib/env";
import { generateRandomToken } from "@/lib/auth/crypto";
import { COOKIE_OAUTH_STATE, OAUTH_STATE_EXPIRY_SECONDS, setHttpOnlyCookie } from "@/lib/auth/session";

export async function GET() {
  try {
    const clientId = getGitHubClientId();
    const state = generateRandomToken();

    const redirectUrl = new URL("https://github.com/login/oauth/authorize");
    redirectUrl.searchParams.set("client_id", clientId);
    redirectUrl.searchParams.set("scope", "read:user");
    redirectUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(redirectUrl.toString());
    setHttpOnlyCookie(response, COOKIE_OAUTH_STATE, state, OAUTH_STATE_EXPIRY_SECONDS);

    return response;
  } catch (error) {
    const envResponse = toEnvErrorResponse(error);
    if (envResponse) return envResponse;

    return NextResponse.json(
      {
        title: "Internal Server Error",
        status: 500,
        detail: error instanceof Error ? error.message : "Failed to initiate GitHub OAuth flow.",
      },
      { status: 500 }
    );
  }
}
