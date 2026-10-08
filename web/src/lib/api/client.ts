import { getApiUrl, getAdminSecret } from "../env";
import { ApiErrorResponse } from "./types";

export class ApiClientError extends Error {
  readonly status: number;
  readonly errors?: Record<string, unknown> | string[];

  constructor(status: number, message: string, errors?: Record<string, unknown> | string[]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /**
   * If true, automatically injects the server-side ADMIN_SECRET into the Authorization Bearer header.
   * Can also be a custom bearer token string.
   */
  auth?: boolean | string;
  /**
   * Request timeout in milliseconds. Defaults to 10000 (10 seconds).
   */
  timeoutMs?: number;
  /**
   * Optional custom AbortSignal.
   */
  signal?: AbortSignal;
}

/**
 * Normalizes query parameters into a URL query string, omitting undefined or null values.
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return "";
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

/**
 * Core HTTP fetch wrapper for communicating with the about-core backend.
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const queryString = buildQueryString(options.params);
  const fullUrl = `${baseUrl.replace(/\/+$/, "")}${cleanEndpoint}${queryString}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  // Auth header injection
  if (options.auth) {
    if (typeof options.auth === "string") {
      headers["Authorization"] = `Bearer ${options.auth}`;
    } else {
      const adminSecret = getAdminSecret();
      headers["Authorization"] = `Bearer ${adminSecret}`;
    }
  }

  let requestBody: BodyInit | undefined;

  if (options.body !== undefined && options.body !== null) {
    if (typeof FormData !== "undefined" && options.body instanceof FormData) {
      // Allow the runtime/browser to set the multipart boundary automatically
      requestBody = options.body;
      delete headers["Content-Type"];
    } else if (typeof options.body === "string") {
      requestBody = options.body;
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    } else {
      requestBody = JSON.stringify(options.body);
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
  }

  const timeoutMs = options.timeoutMs ?? 10000;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = options.signal
    ? (typeof AbortSignal.any === "function"
        ? AbortSignal.any([options.signal, timeoutSignal])
        : options.signal)
    : timeoutSignal;

  const response = await fetch(fullUrl, {
    method: options.method || "GET",
    headers,
    body: requestBody,
    signal,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    let errors: Record<string, unknown> | string[] | undefined;

    if (isJson) {
      try {
        const errorData = (await response.json()) as ApiErrorResponse;
        errorMessage = errorData.message || errorMessage;
        errors = errorData.errors;
      } catch {
        // Fall back to default message if JSON parsing fails
      }
    } else {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Fall back to default message
      }
    }

    throw new ApiClientError(response.status, errorMessage, errors);
  }

  if (isJson) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}
