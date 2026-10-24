# Skills API & Data Models Specification (`about-core`)

This document provides the authoritative specification for the **Skill** resource in `about-core`, directly derived from `.agents/backend mem/api-handoff.md`. It covers TypeScript interfaces, data models, endpoints, multipart file uploads, and Kotlin client mappings.

---

## 1. Skill Data Model

A Skill represents a technical capability, tool, language, or framework possessed by the pilot/developer. Skills are referenced by `Project` and `Experience` documents, and are displayed in the administrative dashboard and public portfolio viewers.

### Schema Fields

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `string` | Yes | Auto (ObjectId) | Unique 24-hex-character MongoDB ObjectId. |
| `name` | `string` | Yes | — | Skill name (trimmed, unique case-insensitive). |
| `type` | `SkillType` | Yes | `"tool"` | Category enum: `"tool" \| "language" \| "framework"`. |
| `logoUrl` | `string` | No | `""` | Image URL in Cloudinary or external CDN. |
| `featured` | `boolean` | No | `false` | Whether to spotlight this skill in top-tier showcases. |
| `weight` | `number` | No | `0` | Numeric display priority/weight (sorted ascending `{ weight: 1, name: 1 }`). |
| `createdAt` | `string` (ISO) | Yes | Auto | Timestamp of creation. |
| `updatedAt` | `string` (ISO) | Yes | Auto | Timestamp of last modification. |

---

## 2. TypeScript Interfaces (`web/src/lib/api/types.ts`)

```ts
/**
 * Supported skill classification categories.
 */
export type SkillType = "tool" | "language" | "framework";

/**
 * Authoritative Skill document model.
 */
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

/**
 * Payload for creating a new skill via POST /api/v1/skills.
 */
export interface CreateSkillInput {
  name: string;
  type?: SkillType;
  logoUrl?: string;
  featured?: boolean;
  weight?: number;
}

/**
 * Payload for updating an existing skill via PUT /api/v1/skills/:id.
 */
export type UpdateSkillInput = Partial<CreateSkillInput>;

/**
 * Query parameters for filtering skills via GET /api/v1/skills.
 */
export interface GetSkillsParams {
  type?: SkillType;
}

/**
 * Multipart file attachments for skill creation and updates.
 */
export interface SkillFiles {
  logoUrl?: File | Blob;
}
```

---

## 3. Endpoints Reference

### 3.1 `GET /api/v1/skills`
- **Access**: Public
- **Query Parameters**:
  - `type` (optional, `"tool" | "language" | "framework"`): Case-insensitive category filter.
- **Sorting**: `{ weight: 1, name: 1 }`
- **Response**: `200 OK`
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "670fa123456789abcdef0010",
      "name": "TypeScript",
      "type": "language",
      "logoUrl": "https://res.cloudinary.com/.../typescript.jpg",
      "featured": true,
      "weight": 1,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "_id": "670fa123456789abcdef0011",
      "name": "Next.js",
      "type": "framework",
      "logoUrl": "https://res.cloudinary.com/.../nextjs.jpg",
      "featured": true,
      "weight": 2,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "_id": "670fa123456789abcdef0012",
      "name": "Docker",
      "type": "tool",
      "logoUrl": "https://res.cloudinary.com/.../docker.jpg",
      "featured": false,
      "weight": 3,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3.2 `GET /api/v1/skills/:id`
- **Access**: Public
- **Path Parameters**: `:id` (24-hex-character MongoDB ObjectId)
- **Response**: `200 OK` `{ "success": true, "data": { ...skill } }`
- **Errors**: `400 Bad Request` if `:id` is malformed; `404 Not Found` if skill does not exist.

### 3.3 `POST /api/v1/skills`
- **Access**: Admin (Requires `Authorization: Bearer <ADMIN_SECRET>` or `x-admin-token: <ADMIN_SECRET>`)
- **Content-Type**: `application/json` or `multipart/form-data`
- **Multipart Upload Field**: `logoUrl` (image MIME: png, jpg, webp, svg)
  - Cloudinary folder: `portfolio/skills/<derivedSkillName>/<derivedSkillName>`
- **Fields**:
  - `name`: string (required, trimmed; unique case-insensitive)
  - `type`: string enum (`"tool" | "language" | "framework"`, default `"tool"`)
  - `logoUrl`: string URL or file attachment
  - `featured`: boolean (default `false`)
  - `weight`: number (default `0`)
- **Response**: `201 Created` `{ "success": true, "data": { ...createdSkill } }`
- **Errors**: `400 Bad Request` if name is missing or type is invalid; `409 Conflict` if duplicate name exists.

### 3.4 `PUT /api/v1/skills/:id`
- **Access**: Admin
- **Path Parameters**: `:id` (MongoDB ObjectId)
- **Content-Type**: `application/json` or `multipart/form-data`
- **Multipart Upload Field**: `logoUrl`
- **Fields**: Partial update of `name`, `type`, `logoUrl`, `featured`, `weight`. Unique name check excludes current `:id`.
- **Response**: `200 OK` `{ "success": true, "data": { ...updatedSkill } }`
- **Errors**: `400 Bad Request` for invalid type or malformed ID; `404 Not Found` if not found; `409 Conflict` on duplicate name.

### 3.5 `DELETE /api/v1/skills/:id`
- **Access**: Admin
- **Path Parameters**: `:id` (MongoDB ObjectId)
- **Response**: `200 OK` `{ "success": true, "message": "Skill deleted successfully" }`

---

## 4. Kotlin Android DTO Mapping

```kotlin
package com.cyberbee.about.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
enum class SkillType {
    @SerialName("tool") TOOL,
    @SerialName("language") LANGUAGE,
    @SerialName("framework") FRAMEWORK
}

@Serializable
data class Skill(
    @SerialName("_id") val id: String,
    val name: String,
    val type: SkillType = SkillType.TOOL,
    val logoUrl: String? = null,
    val featured: Boolean = false,
    val weight: Int = 0,
    val createdAt: String? = null,
    val updatedAt: String? = null
)
```

---

## 5. Relationships to Other Domain Models

1. **Projects (`Project.skills`)**:
   - Stores an array of MongoDB ObjectIds referencing `Skill` documents:
     ```ts
     skills: string[]; // e.g. ["670fa123456789abcdef0010"]
     ```
2. **Experiences (`Experience.skills`)**:
   - Stores an array of MongoDB ObjectIds referencing `Skill` documents applied during work at that organization:
     ```ts
     skills: string[]; // e.g. ["670fa123456789abcdef0010"]
     ```
