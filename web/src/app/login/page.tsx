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

export function getSafeReturnTo(raw: string | undefined): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  // Must start with a single slash, not double slash or backslash
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw;
  }
  return "/dashboard";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_ADMIN_SESSION)?.value;
  const stageCookie = cookieStore.get(COOKIE_AUTH_STAGE)?.value;
  const params = await searchParams;

  const safeReturnTo = getSafeReturnTo(params.returnTo);

  // If already authenticated with full admin session, redirect to dashboard or returnTo
  if (sessionCookie) {
    const session = verifyAdminSessionToken(sessionCookie);
    if (session && session.role === "admin" && session.username === "Cyberbee-pro") {
      redirect(safeReturnTo);
    }
  }

  // Check if intermediate GitHub OAuth verification has completed
  const stagePayload = verifyAuthStageToken(stageCookie);
  const isGithubVerified =
    stagePayload?.stage === "github_verified" &&
    stagePayload?.username === "Cyberbee-pro";

  // Strict Zero-Fallback Policy: Ensures NEXT_PUBLIC_PORTFOLIO_URL is defined
  const portfolioUrl = getPortfolioUrl();

  return (
    <LoginClient
      initialGithubVerified={Boolean(isGithubVerified)}
      portfolioUrl={portfolioUrl}
      returnTo={safeReturnTo}
    />
  );
}
