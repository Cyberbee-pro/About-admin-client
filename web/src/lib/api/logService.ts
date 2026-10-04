import { apiClient } from "./client";
import { LogEntry, LogLevel, ApiPaginatedResponse } from "./types";
import { ServiceAuthOption } from "./projectService";

export interface LogFilterParams {
  date?: string; // YYYY-MM-DD
  month?: string; // YYYY-MM
  year?: string; // YYYY
  level?: LogLevel;
  page?: number;
  limit?: number;
}

/**
 * Browses persisted request logs with pagination, date, and level filters.
 * Limit is clamped between 1 and 500 per backend specification.
 * Requires admin authentication.
 */
export async function getLogs(
  params?: LogFilterParams,
  options?: ServiceAuthOption
): Promise<ApiPaginatedResponse<LogEntry>> {
  let clampedLimit: number | undefined;
  if (params?.limit !== undefined) {
    clampedLimit = Math.max(1, Math.min(500, params.limit));
  }

  return apiClient<ApiPaginatedResponse<LogEntry>>("/api/v1/admin/logs", {
    method: "GET",
    params: {
      date: params?.date,
      month: params?.month,
      year: params?.year,
      level: params?.level,
      page: params?.page,
      limit: clampedLimit,
    },
    auth: options?.adminToken || true,
  });
}
