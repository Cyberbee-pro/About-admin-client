import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  COOKIE_ADMIN_SESSION,
  COOKIE_AUTH_STAGE,
  verifyAdminSessionToken,
  verifyAuthStageToken,
} from "@/lib/auth/session";
import { getPortfolioUrl } from "@/lib/env";
import LoginClient from "./LoginClient";

interface LoginPageProps {
  searchParams: Promise<{ stage?: string; returnTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_ADMIN_SESSION)?.value;
  const stageCookie = cookieStore.get(COOKIE_AUTH_STAGE)?.value;
  const params = await searchParams;

  // If already authenticated with full admin session, redirect to dashboard or returnTo
  if (sessionCookie) {
    const session = verifyAdminSessionToken(sessionCookie);
    if (session && session.role === "admin" && session.username === "Cyberbee-pro") {
      redirect(params.returnTo || "/dashboard");
    }
  }

  // Check if intermediate GitHub OAuth verification has completed
  const stagePayload = verifyAuthStageToken(stageCookie);
  const isGithubVerified =
    (stagePayload?.stage === "github_verified" &&
      stagePayload?.username === "Cyberbee-pro") ||
    params.stage === "password";

  // Strict Zero-Fallback Policy: Ensures NEXT_PUBLIC_PORTFOLIO_URL is defined
  const portfolioUrl = getPortfolioUrl();

  return (
    <LoginClient
      initialGithubVerified={Boolean(isGithubVerified)}
      portfolioUrl={portfolioUrl}
      returnTo={params.returnTo}
    />
  );
}
