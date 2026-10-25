import { apiClient } from "./client";
import {
  Certificate,
  CreateCertificateInput,
  UpdateCertificateInput,
  ApiResponse,
  ApiListResponse,
  CertificateFiles,
} from "./types";
import { ServiceAuthOption } from "./projectService";

export type { CertificateFiles };

/**
 * Lists all certificates sorted by weight and title.
 * Public endpoint.
 */
export async function getCertificates(): Promise<ApiListResponse<Certificate>> {
  return apiClient<ApiListResponse<Certificate>>("/api/v1/certificates", {
    method: "GET",
  });
}

/**
 * Fetches a single certificate by MongoDB ObjectId.
 * Public endpoint.
 */
export async function getCertificateById(id: string): Promise<ApiResponse<Certificate>> {
  return apiClient<ApiResponse<Certificate>>(`/api/v1/certificates/${id}`, {
    method: "GET",
  });
}

/**
 * Creates a new certificate.
 * Requires admin authentication. Supports media file upload on mediaUrl.
 */
export async function createCertificate(
  data: CreateCertificateInput,
  files?: CertificateFiles,
  options?: ServiceAuthOption
): Promise<ApiResponse<Certificate>> {
  if (files?.mediaUrl) {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.organization !== undefined) formData.append("organization", data.organization);
    if (data.description !== undefined) formData.append("description", data.description);
    if (data.link !== undefined) formData.append("link", data.link);
    if (data.weight !== undefined) formData.append("weight", String(data.weight));
    if (data.createdAt !== undefined) formData.append("createdAt", data.createdAt);
    formData.append("mediaUrl", files.mediaUrl);

    return apiClient<ApiResponse<Certificate>>("/api/v1/certificates", {
      method: "POST",
      body: formData,
      auth: options?.adminToken || true,
    });
  }

  return apiClient<ApiResponse<Certificate>>("/api/v1/certificates", {
    method: "POST",
    body: data,
    auth: options?.adminToken || true,
  });
}

/**
 * Updates an existing certificate by MongoDB ObjectId.
 * Requires admin authentication. Supports media file upload on mediaUrl.
 */
export async function updateCertificate(
  id: string,
  data: UpdateCertificateInput,
  files?: CertificateFiles,
  options?: ServiceAuthOption
): Promise<ApiResponse<Certificate>> {
  if (files?.mediaUrl) {
    const formData = new FormData();
    if (data.title !== undefined) formData.append("title", data.title);
    if (data.organization !== undefined) formData.append("organization", data.organization);
    if (data.description !== undefined) formData.append("description", data.description);
    if (data.link !== undefined) formData.append("link", data.link);
    if (data.weight !== undefined) formData.append("weight", String(data.weight));
    if (data.createdAt !== undefined) formData.append("createdAt", data.createdAt);
    formData.append("mediaUrl", files.mediaUrl);

    return apiClient<ApiResponse<Certificate>>(`/api/v1/certificates/${id}`, {
      method: "PUT",
      body: formData,
      auth: options?.adminToken || true,
    });
  }

  return apiClient<ApiResponse<Certificate>>(`/api/v1/certificates/${id}`, {
    method: "PUT",
    body: data,
    auth: options?.adminToken || true,
  });
}

/**
 * Deletes a certificate by MongoDB ObjectId.
 * Requires admin authentication.
 */
export async function deleteCertificate(
  id: string,
  options?: ServiceAuthOption
): Promise<ApiResponse<void>> {
  return apiClient<ApiResponse<void>>(`/api/v1/certificates/${id}`, {
    method: "DELETE",
    auth: options?.adminToken || true,
  });
}
