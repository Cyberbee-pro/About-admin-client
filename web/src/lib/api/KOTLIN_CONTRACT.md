# Kotlin Client DTO Mapping Contract: `about-core` API

This document provides Kotlin developers with direct mappings from the TypeScript interfaces defined in `web/src/lib/api/types.ts` to `kotlinx.serialization` models for the Android client (`App/`).

---

## 1. Project Models

```kotlin
package com.cyberbee.about.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
enum class ProjectStatus {
    @SerialName("invisible") INVISIBLE,
    @SerialName("planning") PLANNING,
    @SerialName("work_in_progress") WORK_IN_PROGRESS,
    @SerialName("delay_hold") DELAY_HOLD,
    @SerialName("active") ACTIVE
}

@Serializable
data class Contributor(
    val name: String,
    val profilePicUrl: String,
    val profileLink: String? = null
)

@Serializable
data class SocialLink(
    val platform: String,
    val url: String
)

@Serializable
data class ThreeDModelConfig(
    val fileUrl: String,
    val initialRotation: List<Double>, // 3 elements: [x, y, z]
    val enableExplodedView: Boolean
)

@Serializable
data class ProjectVersion(
    val versionTag: String,
    val releaseDate: String? = null,
    val changelog: List<String> = emptyList(),
    val image: String? = null,
    val videoDemo: String? = null,
    val demoUrl: String? = null,
    val threeDFileUrl: String? = null,
    val isLatest: Boolean? = null
)

@Serializable
data class Project(
    @SerialName("_id") val id: String,
    val title: String,
    val slug: String,
    val category: String,
    val description: String,
    val image: String,
    val featured: Boolean = false,
    val tags: List<String> = emptyList(),
    val skills: List<String> = emptyList(), // ObjectId refs to Skill
    val startDate: String,
    val endDate: String? = null,
    val status: ProjectStatus = ProjectStatus.PLANNING,
    val contributors: List<Contributor> = emptyList(),
    val socialLinks: List<SocialLink> = emptyList(),
    val videoDemo: String? = null,
    val deployedLink: String? = null,
    val githubLink: String? = null,
    val threeDModel: ThreeDModelConfig? = null,
    val versions: List<ProjectVersion> = emptyList(),
    val createdAt: String,
    val updatedAt: String
)
```

---

## 2. Skill Models

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

## 3. Certificate & Achievement Models

```kotlin
package com.cyberbee.about.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
data class Certificate(
    @SerialName("_id") val id: String,
    val title: String,
    val description: String = "",
    val link: String? = null,
    val mediaUrl: String,
    val organization: String,
    val weight: Int = 0,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class Achievement(
    @SerialName("_id") val id: String,
    val title: String,
    val date: String, // e.g. "October 2024"
    val detail: String,
    val weight: Int = 0,
    val createdAt: String? = null,
    val updatedAt: String? = null
)
```

---

## 4. Experience Models

```kotlin
package com.cyberbee.about.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
enum class ExperienceTag {
    @SerialName("focus") FOCUS,
    @SerialName("extracurricular") EXTRACURRICULAR
}

@Serializable
enum class ExperienceType {
    @SerialName("internship") INTERNSHIP,
    @SerialName("contract") CONTRACT,
    @SerialName("freelance") FREELANCE,
    @SerialName("full_time") FULL_TIME,
    @SerialName("part_time") PART_TIME,
    @SerialName("club") CLUB,
    @SerialName("volunteering") VOLUNTEERING
}

@Serializable
data class ExperiencePosition(
    @SerialName("_id") val id: String? = null,
    val position: String,
    val description: String,
    val startDate: String,
    val endDate: String? = null,
    val mediaUrls: List<String> = emptyList(),
    val certificateUrls: List<String> = emptyList(),
    val isCurrent: Boolean = false
)

@Serializable
data class Experience(
    @SerialName("_id") val id: String,
    val organization: String,
    val tag: ExperienceTag = ExperienceTag.FOCUS,
    val type: ExperienceType = ExperienceType.FULL_TIME,
    val iconUrl: String? = null,
    val skills: List<String> = emptyList(), // ObjectId refs to Skill
    val weight: Int = 0,
    val positions: List<ExperiencePosition> = emptyList(),
    val createdAt: String? = null,
    val updatedAt: String? = null
)
```

---

## 5. Site Configuration & Logs

```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonElement

@Serializable
data class SiteConfig(
    @SerialName("_id") val id: String? = null,
    val resumeDriveUrl: String,
    val statusMessage: String,
    val bioSummary: String,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
enum class LogLevel {
    INFO, WARN, ERROR
}

@Serializable
data class LogEntry(
    @SerialName("_id") val id: String,
    val timestamp: String,
    val level: LogLevel,
    val method: String,
    val endpoint: String,
    val statusCode: Int,
    val ip: String,
    val message: String,
    // Use JsonObject (or Map<String, JsonElement>) for nested JSON object type safety
    val metadata: JsonObject? = null,
    val stack: String? = null
)
```

---

## 3. Generic Envelope Responses

```kotlin
@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T,
    val message: String? = null
)

@Serializable
data class ApiListResponse<T>(
    val success: Boolean,
    val count: Int,
    val data: List<T>,
    val message: String? = null
)

@Serializable
data class ApiPaginatedResponse<T>(
    val success: Boolean,
    val count: Int,
    val total: Int,
    val page: Int,
    val totalPages: Int,
    val data: List<T>,
    val message: String? = null
)
```
