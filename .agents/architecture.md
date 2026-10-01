# Architecture: About-admin-client

## Overview
The `About-admin-client` workspace contains the administrative interfaces and client applications that interface with the decoupled `about-core` backend API.

## Monorepo Layout

About-admin-client/
├── web/ # Next.js admin portal (Dashboard, Project CRUD, Version Manager)
├── App/ # Kotlin Android client (Native mobile admin & portfolio viewer)
├── shared/ # Shared API contracts, types, and network service wrappers
└── .agents/ # Agent skills, workflows, and rule configurations


## Communication Patterns
* **Transport**: REST over HTTPS with JSON payloads.
* **Asset Uploads**: Multipart form-data (`multipart/form-data`) streaming directly to `about-core` for nested Cloudinary storage (`portfolio/projects/<slug>/<versionTag>/...`).
* **Authentication**: Bearer token authentication (`Authorization: Bearer <ADMIN_SECRET>`) for all mutation and administrative routes.
* **Routing**: Semantic slug-based API paths (`/api/v1/projects/:slug/versions`).