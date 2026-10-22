import { NextResponse } from "next/server";

export interface ConfigurationErrorPayload {
  title: "Internal Configuration Error";
  status: 500;
  detail: string;
  code: string;
}

export class ConfigurationError extends Error {
  readonly title = "Internal Configuration Error" as const;
  readonly status = 500 as const;
  readonly detail: string;
  readonly code: string;
  readonly variableName: string;

  constructor(variableName: string) {
    const detail = `The required environment variable '${variableName}' is missing or not set.`;
    super(detail);
    this.name = "ConfigurationError";
    this.variableName = variableName;
    this.detail = detail;
    this.code = `ERR_ENV_MISSING_${variableName}`;
  }

  toJSON(): ConfigurationErrorPayload {
    return {
      title: this.title,
      status: this.status,
      detail: this.detail,
      code: this.code,
    };
  }
}

/**
 * Validates and retrieves an environment variable without fallbacks.
 * Throws a ConfigurationError if the variable is missing or empty.
 */
export function getRequiredEnv(name: string): string {
  // Use direct property access for public variables so bundlers (Turbopack/Webpack) inline them client-side
  let value: string | undefined;
  if (name === "NEXT_PUBLIC_API_URL") {
    value = process.env.NEXT_PUBLIC_API_URL;
  } else if (name === "NEXT_PUBLIC_PORTFOLIO_URL") {
    value = process.env.NEXT_PUBLIC_PORTFOLIO_URL;
  } else if (name === "NEXT_PUBLIC_APP_URL") {
    value = process.env.NEXT_PUBLIC_APP_URL;
  } else if (name === "ADMIN_SECRET") {
    value = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_SECRET;
  } else if (name === "NEXT_PUBLIC_ADMIN_SECRET") {
    value = process.env.NEXT_PUBLIC_ADMIN_SECRET || process.env.ADMIN_SECRET;
  } else {
    value = process.env[name];
  }

  if (!value || value.trim() === "") {
    throw new ConfigurationError(name);
  }
  return value.trim();
}

/**
 * Creates a Next.js JSON 500 response conforming to the exact configuration error standard.
 */
export function createEnvErrorResponse(variableName: string): NextResponse<ConfigurationErrorPayload> {
  const error = new ConfigurationError(variableName);
  return NextResponse.json(error.toJSON(), { status: 500 });
}

/**
 * Type guard for ConfigurationError.
 */
export function isConfigurationError(error: unknown): error is ConfigurationError {
  return error instanceof ConfigurationError;
}

/**
 * Converts a caught error to a Next.js NextResponse if it is a ConfigurationError.
 * Returns null if the error is not a ConfigurationError.
 */
export function toEnvErrorResponse(error: unknown): NextResponse<ConfigurationErrorPayload> | null {
  if (isConfigurationError(error)) {
    return NextResponse.json(error.toJSON(), { status: 500 });
  }
  return null;
}

// Strongly-typed accessors for required application environment variables
// Explicit direct property access for public variables ensures inlining in client bundles
export const getApiUrl = (): string => {
  const val = process.env.NEXT_PUBLIC_API_URL;
  if (!val || val.trim() === "") {
    throw new ConfigurationError("NEXT_PUBLIC_API_URL");
  }
  return val.trim();
};

export const getPortfolioUrl = (): string => {
  const val = process.env.NEXT_PUBLIC_PORTFOLIO_URL;
  if (!val || val.trim() === "") {
    throw new ConfigurationError("NEXT_PUBLIC_PORTFOLIO_URL");
  }
  return val.trim();
};

export const getAdminSecret = (): string => {
  const val = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_SECRET;
  if (!val || val.trim() === "") {
    throw new ConfigurationError("ADMIN_SECRET");
  }
  return val.trim();
};
export const getGitHubClientId = (): string => getRequiredEnv("GITHUB_CLIENT_ID");
export const getGitHubClientSecret = (): string => getRequiredEnv("GITHUB_CLIENT_SECRET");
export const getAdminPassword = (): string => getRequiredEnv("ADMIN_PASSWORD");
export const getAdminSessionSecret = (): string => getRequiredEnv("ADMIN_SESSION_SECRET");

// Optional application environment variable accessors
export const getGitHubRedirectUri = (): string | undefined => {
  const val = process.env.GITHUB_REDIRECT_URI;
  return val && val.trim() !== "" ? val.trim() : undefined;
};

export const getAppUrlEnv = (): string | undefined => {
  const val = process.env.NEXT_PUBLIC_APP_URL;
  return val && val.trim() !== "" ? val.trim() : undefined;
};

