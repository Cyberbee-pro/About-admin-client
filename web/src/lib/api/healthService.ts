import { apiClient } from "./client";
import { HealthResponse } from "./types";

/**
 * Fetches server telemetry and database connectivity status.
 * Public endpoint.
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>("/api/v1/health", {
    method: "GET",
  });
}
