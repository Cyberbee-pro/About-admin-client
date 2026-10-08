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
  const value = process.env[name];
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
export const getApiUrl = (): string => getRequiredEnv("NEXT_PUBLIC_API_URL");
export const getAdminSecret = (): string => getRequiredEnv("ADMIN_SECRET");
export const getGitHubClientId = (): string => getRequiredEnv("GITHUB_CLIENT_ID");
export const getGitHubClientSecret = (): string => getRequiredEnv("GITHUB_CLIENT_SECRET");
export const getAdminPassword = (): string => getRequiredEnv("ADMIN_PASSWORD");
export const getAdminSessionSecret = (): string => getRequiredEnv("ADMIN_SESSION_SECRET");
export const getPortfolioUrl = (): string => getRequiredEnv("NEXT_PUBLIC_PORTFOLIO_URL");
