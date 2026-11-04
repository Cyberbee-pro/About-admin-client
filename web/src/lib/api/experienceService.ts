import { apiClient } from "./client";
import {
  Experience,
  CreateExperienceInput,
  UpdateExperienceInput,
  CreatePositionInput,
  ApiResponse,
  ApiListResponse,
  ExperienceFiles,
} from "./types";
import { ServiceAuthOption } from "./projectService";

export type { ExperienceFiles };

/**
 * Lists all experience organizations sorted by weight and organization.
 * Public endpoint.
 */
export async function getExperiences(): Promise<ApiListResponse<Experience>> {
  return apiClient<ApiListResponse<Experience>>("/api/v1/experiences", {
    method: "GET",
  });
}

/**
 * Fetches a single experience by MongoDB ObjectId.
 * Public endpoint.
 */
export async function getExperienceById(id: string): Promise<ApiResponse<Experience>> {
  return apiClient<ApiResponse<Experience>>(`/api/v1/experiences/${id}`, {
    method: "GET",
  });
}

/**
 * Creates a new experience organization with an initial position.
 * Requires admin authentication. Supports multipart uploads for iconUrl, mediaUrls, and certificateUrls.
 */
export async function createExperience(
  data: CreateExperienceInput,
  files?: ExperienceFiles,
  options?: ServiceAuthOption
): Promise<ApiResponse<Experience>> {
  const hasFiles = Boolean(
    files?.iconUrl ||
      (files?.mediaUrls && files.mediaUrls.length > 0) ||
      (files?.certificateUrls && files.certificateUrls.length > 0)
  );

  if (hasFiles) {
    const formData = new FormData();
    formData.append("organization", data.organization.trim());
    if (data.tag !== undefined) formData.append("tag", data.tag);
    if (data.type !== undefined) formData.append("type", data.type);
    if (data.weight !== undefined) formData.append("weight", String(data.weight));
    if (data.skills !== undefined) {
      formData.append("skills", JSON.stringify(data.skills));
    }
    if (data.positions !== undefined) {
      formData.append("positions", JSON.stringify(data.positions));
    }
    if (files?.iconUrl) {
      formData.append("iconUrl", files.iconUrl);
    } else if (data.iconUrl !== undefined) {
      formData.append("iconUrl", data.iconUrl);
    }
    if (files?.mediaUrls) {
      for (const file of files.mediaUrls) {
        formData.append("mediaUrls", file);
      }
    }
    if (files?.certificateUrls) {
      for (const file of files.certificateUrls) {
        formData.append("certificateUrls", file);
      }
    }

    return apiClient<ApiResponse<Experience>>("/api/v1/experiences", {
      method: "POST",
      body: formData,
      auth: options?.adminToken || true,
    });
  }

  return apiClient<ApiResponse<Experience>>("/api/v1/experiences", {
    method: "POST",
    body: {
      ...data,
      organization: data.organization.trim(),
    },
    auth: options?.adminToken || true,
  });
}

/**
 * Updates an experience organization by MongoDB ObjectId.
 * Requires admin authentication. Supports multipart uploads.
 * Note: PUT replaces the whole positions array, and backend attaches uploaded files only to positions[0].
 */
export async function updateExperience(
  id: string,
  data: UpdateExperienceInput,
  files?: ExperienceFiles,
  options?: ServiceAuthOption
): Promise<ApiResponse<Experience>> {
  const hasFiles = Boolean(
    files?.iconUrl ||
      (files?.mediaUrls && files.mediaUrls.length > 0) ||
      (files?.certificateUrls && files.certificateUrls.length > 0)
  );

  if (hasFiles) {
    const formData = new FormData();
    if (data.organization !== undefined) {
      formData.append("organization", data.organization.trim());
    }
    if (data.tag !== undefined) formData.append("tag", data.tag);
    if (data.type !== undefined) formData.append("type", data.type);
    if (data.weight !== undefined) formData.append("weight", String(data.weight));
    if (data.skills !== undefined) {
      formData.append("skills", JSON.stringify(data.skills));
    }
    if (data.positions !== undefined) {
      formData.append("positions", JSON.stringify(data.positions));
    }
    if (files?.iconUrl) {
      formData.append("iconUrl", files.iconUrl);
    } else if (data.iconUrl !== undefined) {
      formData.append("iconUrl", data.iconUrl);
    }
    if (files?.mediaUrls) {
      for (const file of files.mediaUrls) {
        formData.append("mediaUrls", file);
      }
    }
    if (files?.certificateUrls) {
      for (const file of files.certificateUrls) {
        formData.append("certificateUrls", file);
      }
    }

    return apiClient<ApiResponse<Experience>>(`/api/v1/experiences/${id}`, {
      method: "PUT",
      body: formData,
      auth: options?.adminToken || true,
    });
  }

  return apiClient<ApiResponse<Experience>>(`/api/v1/experiences/${id}`, {
    method: "PUT",
    body: data,
    auth: options?.adminToken || true,
  });
}

/**
 * Appends a new position to an existing experience organization.
 * Path parameter :organization is URL-encoded.
 * Requires admin authentication. Supports mediaUrls and certificateUrls uploads for this new position.
 */
export async function addExperiencePosition(
  organization: string,
  position: CreatePositionInput,
  files?: { mediaUrls?: (File | Blob)[]; certificateUrls?: (File | Blob)[] },
  options?: ServiceAuthOption
): Promise<ApiResponse<Experience>> {
  const encodedOrg = encodeURIComponent(organization.trim());
  const hasFiles = Boolean(
    (files?.mediaUrls && files.mediaUrls.length > 0) ||
      (files?.certificateUrls && files.certificateUrls.length > 0)
  );

  if (hasFiles) {
    const formData = new FormData();
    formData.append("position", JSON.stringify(position));
    if (files?.mediaUrls) {
      for (const file of files.mediaUrls) {
        formData.append("mediaUrls", file);
      }
    }
    if (files?.certificateUrls) {
      for (const file of files.certificateUrls) {
        formData.append("certificateUrls", file);
      }
    }

    return apiClient<ApiResponse<Experience>>(
      `/api/v1/experiences/${encodedOrg}/positions`,
      {
        method: "POST",
        body: formData,
        auth: options?.adminToken || true,
      }
    );
  }

  return apiClient<ApiResponse<Experience>>(
    `/api/v1/experiences/${encodedOrg}/positions`,
    {
      method: "POST",
      body: { position },
      auth: options?.adminToken || true,
    }
  );
}

/**
 * Deletes an experience by MongoDB ObjectId.
 * Requires admin authentication.
 */
export async function deleteExperience(
  id: string,
  options?: ServiceAuthOption
): Promise<ApiResponse<Experience>> {
  return apiClient<ApiResponse<Experience>>(`/api/v1/experiences/${id}`, {
    method: "DELETE",
    auth: options?.adminToken || true,
  });
}
