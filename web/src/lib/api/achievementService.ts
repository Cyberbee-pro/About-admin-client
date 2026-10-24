import { apiClient } from "./client";
import {
  Achievement,
  CreateAchievementInput,
  UpdateAchievementInput,
  ApiResponse,
  ApiListResponse,
} from "./types";
import { ServiceAuthOption } from "./projectService";

/**
 * Lists all achievements sorted by weight and title.
 * Public endpoint.
 */
export async function getAchievements(): Promise<ApiListResponse<Achievement>> {
  return apiClient<ApiListResponse<Achievement>>("/api/v1/achievements", {
    method: "GET",
  });
}

/**
 * Fetches a single achievement by MongoDB ObjectId.
 * Public endpoint.
 */
export async function getAchievementById(id: string): Promise<ApiResponse<Achievement>> {
  return apiClient<ApiResponse<Achievement>>(`/api/v1/achievements/${id}`, {
    method: "GET",
  });
}

/**
 * Creates a new achievement.
 * Requires admin authentication. Unique title.
 */
export async function createAchievement(
  data: CreateAchievementInput,
  options?: ServiceAuthOption
): Promise<ApiResponse<Achievement>> {
  return apiClient<ApiResponse<Achievement>>("/api/v1/achievements", {
    method: "POST",
    body: data,
    auth: options?.adminToken || true,
  });
}

/**
 * Updates an existing achievement by MongoDB ObjectId.
 * Requires admin authentication.
 */
export async function updateAchievement(
  id: string,
  data: UpdateAchievementInput,
  options?: ServiceAuthOption
): Promise<ApiResponse<Achievement>> {
  return apiClient<ApiResponse<Achievement>>(`/api/v1/achievements/${id}`, {
    method: "PUT",
    body: data,
    auth: options?.adminToken || true,
  });
}

/**
 * Deletes an achievement by MongoDB ObjectId.
 * Requires admin authentication.
 */
export async function deleteAchievement(
  id: string,
  options?: ServiceAuthOption
): Promise<ApiResponse<void>> {
  return apiClient<ApiResponse<void>>(`/api/v1/achievements/${id}`, {
    method: "DELETE",
    auth: options?.adminToken || true,
  });
}
