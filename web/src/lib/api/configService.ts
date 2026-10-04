import { apiClient } from "./client";
import { SiteConfig, UpdateConfigInput, ApiResponse } from "./types";
import { ServiceAuthOption } from "./projectService";

/**
 * Fetches site-wide settings (resume link, status message, bio summary).
 * Public endpoint.
 */
export async function getConfig(): Promise<ApiResponse<SiteConfig>> {
  return apiClient<ApiResponse<SiteConfig>>("/api/v1/config", {
    method: "GET",
  });
}

/**
 * Updates site-wide settings.
 * Requires admin authentication.
 */
export async function updateConfig(
  data: UpdateConfigInput,
  options?: ServiceAuthOption
): Promise<ApiResponse<SiteConfig>> {
  return apiClient<ApiResponse<SiteConfig>>("/api/v1/config", {
    method: "PUT",
    body: data,
    auth: options?.adminToken || true,
  });
}
