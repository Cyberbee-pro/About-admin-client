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
  data: UpdateConfigInput | FormData,
  options?: ServiceAuthOption
): Promise<ApiResponse<SiteConfig>> {
  return apiClient<ApiResponse<SiteConfig>>("/api/v1/config", {
    method: "PUT",
    body: data,
    auth: options?.adminToken || true,
  });
}

/**
 * Uploads a resume PDF file directly to /api/v1/config/resume.
 * Supports File or FormData (with field name 'resume', 'resumeFile', 'resumePdf', or 'pdf').
 * Requires admin authentication.
 */
export async function uploadResumeFile(
  file: File | FormData,
  options?: ServiceAuthOption
): Promise<ApiResponse<SiteConfig>> {
  let body: FormData;
  if (typeof FormData !== "undefined" && file instanceof FormData) {
    body = file;
  } else {
    body = new FormData();
    body.append("resume", file as File);
  }

  return apiClient<ApiResponse<SiteConfig>>("/api/v1/config/resume", {
    method: "POST",
    body,
    auth: options?.adminToken || true,
  });
}

export const uploadResume = uploadResumeFile;
