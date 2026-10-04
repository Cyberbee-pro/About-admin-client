/**
 * Authoritative API Types & Data Transfer Objects (DTOs)
 * Based directly on .agents/api-handoff.md for backend 'about-core'.
 * 
 * Kotlin Client Mapping Note:
 * Each interface here maps 1:1 to Kotlin kotlinx.serialization data classes:
 * - string -> String
 * - number -> Int / Double / Long
 * - boolean -> Boolean
 * - Array<T> -> List<T>
 * - [number, number, number] -> List<Double> (size 3)
 */

export type ProjectStatus =
  | "invisible"
  | "planning"
  | "work_in_progress"
  | "delay_hold"
  | "active";

export interface Contributor {
  name: string;
  profilePicUrl: string;
  profileLink?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface ThreeDModelConfig {
  fileUrl: string;
  initialRotation: [number, number, number];
  enableExplodedView: boolean;
}

export interface ProjectVersion {
  versionTag: string;
  releaseDate?: string;
  changelog: string[];
  image?: string;
  videoDemo?: string;
  demoUrl?: string;
  threeDFileUrl?: string;
  isLatest?: boolean;
}

export interface Project {
  _id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  image: string;
  featured: boolean;
  tags: string[];
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  contributors: Contributor[];
  socialLinks: SocialLink[];
  videoDemo?: string;
  deployedLink?: string;
  githubLink?: string;
  threeDModel?: ThreeDModelConfig;
  versions: ProjectVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  title: string;
  slug?: string;
  category: string;
  description: string;
  image?: string;
  featured?: boolean;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  contributors?: Contributor[];
  socialLinks?: SocialLink[];
  videoDemo?: string;
  deployedLink?: string;
  githubLink?: string;
  threeDModel?: Partial<ThreeDModelConfig>;
  versions?: ProjectVersion[];
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface CreateVersionInput {
  versionTag: string;
  releaseDate?: string;
  changelog?: string[];
  image?: string;
  videoDemo?: string;
  demoUrl?: string;
  threeDFileUrl?: string;
  isLatest?: boolean;
  threeDModel?: {
    fileUrl?: string;
  };
}

export interface ProjectFiles {
  image?: File | Blob;
  videoDemo?: File | Blob;
  threeDModel?: File | Blob;
}

export interface VersionFiles {
  image?: File | Blob;
  videoDemo?: File | Blob;
  threeDModel?: File | Blob;
}

export interface SiteConfig {
  _id?: string;
  resumeDriveUrl: string;
  statusMessage: string;
  bioSummary: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UpdateConfigInput = Partial<Omit<SiteConfig, "_id" | "createdAt" | "updatedAt">>;

export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  _id: string;
  timestamp: string;
  level: LogLevel;
  method: string;
  endpoint: string;
  statusCode: number;
  ip: string;
  message: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
  message?: string;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  data: T[];
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, unknown> | string[];
}
