# Workspace Rules & Development Standards

## 1. Core Principles
* **Functionality First**: Prioritize robust API integration, data validation, and error handling before UI styling or polish.
* **Type Safety**: Maintain strict TypeScript interfaces in the web portal and strict data models in Kotlin. Never use `any` unless explicitly required for unknown payloads.
* **TDD & Verification**: Run type checking (`tsc`) and validation loops after every significant component or service addition.

## 2. API & Network Conventions
* **Base URL Configuration**: Never hardcode API URLs; use environment variables (`NEXT_PUBLIC_API_URL` for web, build config for Android).
* **Error Boundaries**: All network calls must handle timeout, 401 unauthorized, and 404 slug-not-found errors gracefully with typed error responses.
* **FormData Handling**: When uploading assets (images, videos, `.glb` 3D models), construct `FormData` explicitly with correct field keys matching `about-core` Multer expectations (`image`, `videoDemo`, `threeDModel`).

## 3. Code Quality
* Keep components modular and separated from data-fetching logic.
* Utilize existing `.agents/skills/` patterns (Next.js turbopack conventions, Kotlin coroutine flows, and TDD workflows) during feature implementation.