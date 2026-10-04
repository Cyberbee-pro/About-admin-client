import { apiClient } from "./client";
import {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  CreateVersionInput,
  ProjectFiles,
  VersionFiles,
  ApiResponse,
  ApiListResponse,
} from "./types";

export interface ProjectListQuery {
  category?: string;
  featured?: boolean | "true" | "false";
  tag?: string;
}

export interface ServiceAuthOption {
  adminToken?: string;
}

/**
 * Builds a FormData payload from project inputs and optional media files.
 * Complex objects (contributors, socialLinks, tags, threeDModel, versions) are JSON-stringified
 * according to backend specifications in .agents/api-handoff.md.
 */
function buildProjectFormData(
  data: CreateProjectInput | UpdateProjectInput,
  files?: ProjectFiles
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (
      key === "contributors" ||
      key === "socialLinks" ||
      key === "versions" ||
      key === "threeDModel"
    ) {
      formData.append(key, JSON.stringify(value));
    } else if (key === "tags") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  }

  if (files) {
    if (files.image) formData.append("image", files.image);
    if (files.videoDemo) formData.append("videoDemo", files.videoDemo);
    if (files.threeDModel) formData.append("threeDModel", files.threeDModel);
  }

  return formData;
}

/**
 * Fetches visible projects with optional filtering by category, featured status, or tag.
 */
export async function getProjects(
  query?: ProjectListQuery
): Promise<ApiListResponse<Project>> {
  return apiClient<ApiListResponse<Project>>("/api/v1/projects", {
    method: "GET",
    params: {
      category: query?.category,
      featured: query?.featured !== undefined ? String(query.featured) : undefined,
      tag: query?.tag,
    },
  });
}

/**
 * Fetches distinct categories from visible projects.
 */
export async function getCategories(): Promise<ApiListResponse<string>> {
  return apiClient<ApiListResponse<string>>("/api/v1/projects/categories", {
    method: "GET",
  });
}

/**
 * Fetches a single project by its slug.
 * If admin authentication is supplied, invisible projects can also be viewed.
 */
export async function getProjectBySlug(
  slug: string,
  options?: { admin?: boolean; adminToken?: string }
): Promise<ApiResponse<Project>> {
  return apiClient<ApiResponse<Project>>(`/api/v1/projects/${encodeURIComponent(slug)}`, {
    method: "GET",
    auth: options?.adminToken ? options.adminToken : options?.admin ? true : undefined,
  });
}

/**
 * Creates a new project. Accepts optional media file uploads via multipart/form-data.
 */
export async function createProject(
  data: CreateProjectInput,
  files?: ProjectFiles,
  options?: ServiceAuthOption
): Promise<ApiResponse<Project>> {
  const hasFiles = files && (files.image || files.videoDemo || files.threeDModel);
  const body = hasFiles ? buildProjectFormData(data, files) : data;

  return apiClient<ApiResponse<Project>>("/api/v1/projects", {
    method: "POST",
    body,
    auth: options?.adminToken || true,
  });
}

/**
 * Updates an existing project by MongoDB ObjectId.
 */
export async function updateProject(
  id: string,
  data: UpdateProjectInput,
  files?: ProjectFiles,
  options?: ServiceAuthOption
): Promise<ApiResponse<Project>> {
  const hasFiles = files && (files.image || files.videoDemo || files.threeDModel);
  const body = hasFiles ? buildProjectFormData(data, files) : data;

  return apiClient<ApiResponse<Project>>(`/api/v1/projects/${encodeURIComponent(id)}`, {
    method: "PUT",
    body,
    auth: options?.adminToken || true,
  });
}

/**
 * Deletes a project by its MongoDB ObjectId.
 */
export async function deleteProject(
  id: string,
  options?: ServiceAuthOption
): Promise<ApiResponse<{ id: string }>> {
  return apiClient<ApiResponse<{ id: string }>>(`/api/v1/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: options?.adminToken || true,
  });
}

/**
 * Appends a new version to a project identified by slug.
 */
export async function appendProjectVersion(
  slug: string,
  versionData: CreateVersionInput,
  files?: VersionFiles,
  options?: ServiceAuthOption
): Promise<ApiResponse<Project>> {
  const hasFiles = files && (files.image || files.videoDemo || files.threeDModel);
  let body: FormData | CreateVersionInput = versionData;

  if (hasFiles) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(versionData)) {
      if (value === undefined) continue;
      if (key === "changelog" || key === "threeDModel") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
    if (files.image) formData.append("image", files.image);
    if (files.videoDemo) formData.append("videoDemo", files.videoDemo);
    if (files.threeDModel) formData.append("threeDModel", files.threeDModel);
    body = formData;
  }

  return apiClient<ApiResponse<Project>>(
    `/api/v1/projects/${encodeURIComponent(slug)}/versions`,
    {
      method: "POST",
      body,
      auth: options?.adminToken || true,
    }
  );
}
