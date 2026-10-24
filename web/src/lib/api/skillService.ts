import { apiClient } from "./client";
import {
  Skill,
  CreateSkillInput,
  UpdateSkillInput,
  GetSkillsParams,
  ApiResponse,
  ApiListResponse,
  SkillFiles,
} from "./types";
import { ServiceAuthOption } from "./projectService";

export type { SkillFiles };

/**
 * Lists all skills sorted by weight and name.
 * Supports optional type filtering ("tool" | "language" | "framework").
 * Public endpoint.
 */
export async function getSkills(params?: GetSkillsParams): Promise<ApiListResponse<Skill>> {
  const query = params?.type ? `?type=${encodeURIComponent(params.type)}` : "";
  return apiClient<ApiListResponse<Skill>>(`/api/v1/skills${query}`, {
    method: "GET",
  });
}

/**
 * Fetches a single skill by MongoDB ObjectId.
 * Public endpoint.
 */
export async function getSkillById(id: string): Promise<ApiResponse<Skill>> {
  return apiClient<ApiResponse<Skill>>(`/api/v1/skills/${id}`, {
    method: "GET",
  });
}

/**
 * Creates a new skill.
 * Requires admin authentication. Supports logo image upload.
 */
export async function createSkill(
  data: CreateSkillInput,
  files?: SkillFiles,
  options?: ServiceAuthOption
): Promise<ApiResponse<Skill>> {
  if (files?.logoUrl) {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.type !== undefined) formData.append("type", data.type);
    if (data.weight !== undefined) formData.append("weight", String(data.weight));
    if (data.featured !== undefined) formData.append("featured", String(data.featured));
    formData.append("logoUrl", files.logoUrl);

    return apiClient<ApiResponse<Skill>>("/api/v1/skills", {
      method: "POST",
      body: formData,
      auth: options?.adminToken || true,
    });
  }

  return apiClient<ApiResponse<Skill>>("/api/v1/skills", {
    method: "POST",
    body: data,
    auth: options?.adminToken || true,
  });
}

/**
 * Updates an existing skill.
 * Requires admin authentication. Supports logo image upload.
 */
export async function updateSkill(
  id: string,
  data: UpdateSkillInput,
  files?: SkillFiles,
  options?: ServiceAuthOption
): Promise<ApiResponse<Skill>> {
  if (files?.logoUrl) {
    const formData = new FormData();
    if (data.name !== undefined) formData.append("name", data.name);
    if (data.type !== undefined) formData.append("type", data.type);
    if (data.weight !== undefined) formData.append("weight", String(data.weight));
    if (data.featured !== undefined) formData.append("featured", String(data.featured));
    formData.append("logoUrl", files.logoUrl);

    return apiClient<ApiResponse<Skill>>(`/api/v1/skills/${id}`, {
      method: "PUT",
      body: formData,
      auth: options?.adminToken || true,
    });
  }

  return apiClient<ApiResponse<Skill>>(`/api/v1/skills/${id}`, {
    method: "PUT",
    body: data,
    auth: options?.adminToken || true,
  });
}

/**
 * Deletes a skill by MongoDB ObjectId.
 * Requires admin authentication.
 */
export async function deleteSkill(
  id: string,
  options?: ServiceAuthOption
): Promise<ApiResponse<void>> {
  return apiClient<ApiResponse<void>>(`/api/v1/skills/${id}`, {
    method: "DELETE",
    auth: options?.adminToken || true,
  });
}
