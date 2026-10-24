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
  skills?: string[];
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
  skills?: string[];
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

export interface PfpItem {
  url: string;
  publicId: string;
  uploadedAt: string;
}

export interface SiteConfig {
  _id?: string;
  name?: string;
  pfpUrl?: string;
  pfpPublicId?: string;
  pfpHistory?: PfpItem[];
  jobTitles?: string[];
  resumeUrl?: string;
  resumeDriveUrl?: string;
  resumePublicId?: string;
  statusMessage: string;
  bioSummary: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UpdateConfigInput = Partial<Omit<SiteConfig, "_id" | "createdAt" | "updatedAt">>;

export type SkillType = "tool" | "language" | "framework";

export interface Skill {
  _id: string;
  name: string;
  type?: SkillType;
  logoUrl?: string;
  featured?: boolean;
  weight: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSkillInput {
  name: string;
  type?: SkillType;
  logoUrl?: string;
  featured?: boolean;
  weight?: number;
}

export type UpdateSkillInput = Partial<CreateSkillInput>;

export interface GetSkillsParams {
  type?: SkillType;
}

export interface SkillFiles {
  logoUrl?: File | Blob;
}

// --- Certificate Models ---
export interface Certificate {
  _id: string;
  title: string;
  description: string;
  link?: string;
  mediaUrl: string;
  organization: string;
  weight: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCertificateInput {
  title: string;
  description?: string;
  organization: string;
  mediaUrl?: string;
  link?: string;
  weight?: number;
}

export type UpdateCertificateInput = Partial<CreateCertificateInput>;

export interface CertificateFiles {
  mediaUrl?: File | Blob;
}

// --- Achievement Models ---
export interface Achievement {
  _id: string;
  title: string;
  date: string; // e.g. "October 2024"
  detail: string;
  weight: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAchievementInput {
  title: string;
  date: string;
  detail: string;
  weight?: number;
}

export type UpdateAchievementInput = Partial<CreateAchievementInput>;

// --- Experience Models ---
export type ExperienceTag = "focus" | "extracurricular";
export type ExperienceType =
  | "internship"
  | "contract"
  | "freelance"
  | "full_time"
  | "part_time"
  | "club"
  | "volunteering";

export interface ExperiencePosition {
  _id?: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string;
  mediaUrls?: string[];
  certificateUrls?: string[];
  isCurrent: boolean;
}

export interface Experience {
  _id: string;
  organization: string;
  tag: ExperienceTag;
  type: ExperienceType;
  iconUrl?: string;
  skills: string[]; // ObjectId refs to Skill
  weight: number;
  positions: ExperiencePosition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExperienceInput {
  organization: string;
  tag?: ExperienceTag;
  type?: ExperienceType;
  iconUrl?: string;
  skills?: string[];
  weight?: number;
  positions?: ExperiencePosition[];
}

export type UpdateExperienceInput = Partial<CreateExperienceInput>;

export interface CreatePositionInput {
  position?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  mediaUrls?: string[];
  certificateUrls?: string[];
}

export interface ExperienceFiles {
  iconUrl?: File | Blob;
  mediaUrls?: (File | Blob)[];
  certificateUrls?: (File | Blob)[];
}

export interface HealthResponse {
  status: "healthy" | string;
  service?: string;
  version?: string;
  timestamp?: string;
  dbStatus: "connected" | "disconnected" | string;
  memoryUsageMB: number;
  nodeVersion?: string;
  env?: string;
}

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
