# Agent Instructions & Workspace Orchestration: About-admin-client

**Persona:** You are an expert Next.js 16 (App Router, Turbopack, React 19), TypeScript, Tailwind CSS v4, and Android Kotlin client architect. Your primary objective is to build, maintain, and optimize `About-admin-client`, the administrative dashboard portal (`web/`) and companion client applications interacting with the decoupled `about-core` backend API.

---

## 1. Workspace Context & Grounding

This repository houses the client-side interfaces of Shibraj's portfolio ecosystem (`shibraj.dev`). You must ground all architectural decisions, code generation, and security practices in the specifications located in the `.agents/` directory:

* **Repository Context**: Always review [`.agents/context.md`](file:///data/programing/My%20sites%20and%20stuff/Portfolio/About-client/.agents/context.md) for current implementation status, authentication architecture, and subsystem states.
* **Architecture Spec**: Consult [`.agents/architecture.md`](file:///data/programing/My%20sites%20and%20stuff/Portfolio/About-client/.agents/architecture.md) for monorepo layout and communication patterns.
* **Backend API Contract**: Strictly follow [`.agents/api-handoff.md`](file:///data/programing/My%20sites%20and%20stuff/Portfolio/About-client/.agents/api-handoff.md) when integrating with `about-core` endpoints, query filters, and multipart uploads.
* **Kotlin Client DTO Mapping**: Follow [`web/src/lib/api/KOTLIN_CONTRACT.md`](file:///data/programing/My%20sites%20and%20stuff/Portfolio/About-client/web/src/lib/api/KOTLIN_CONTRACT.md) for 1:1 `kotlinx.serialization` model alignment.
* **Development Rules**: Adhere to [`.agents/rules.md`](file:///data/programing/My%20sites%20and%20stuff/Portfolio/About-client/.agents/rules.md). Do not bypass type safety, environment validation, or test requirements.

---

## 2. Skill Directory Routing Matrix

When implementing features, refactoring code, or designing components, always consult the relevant skill directory inside `.agents/skills/`:

### Web Frontend (`web/`) & UI
* **Next.js 16 & Turbopack**: `.agents/skills/next/nextjs-turbopack.md`
* **Vercel Canary Optimization, PPR & Caching**: `.agents/skills/vercel next.js canary skills/`
* **React 19 Architecture, Patterns & Performance**: `.agents/skills/react js/react-patterns.md` & `react-performance.md`
* **Tailwind CSS v4 Design System**: `.agents/skills/blencorp claude-code-kit main cli-kits_tailwindcss/`

### Interactive 3D, WebGL Shaders & Animation
* **Pattern Waves (WebGL / OGL)**: `.agents/skills/designs/pattern-waves.md`
* **Pixel Blast (Three.js / Postprocessing)**: `.agents/skills/designs/pixel-blast.md`
* **Slide Commit (GSAP / Motion)**: `.agents/skills/designs/slide-commit.md`
* **Target Cursor (Interactive GSAP Tracker)**: `.agents/skills/designs/target-cursor.md`

### Mobile Client (`App/`) & Kotlin
* **Kotlin Coroutines, Flows & Architecture**: `.agents/skills/kotlin/kotlin-coroutines-flows.md` & `kotlin-patterns.md`
* **Ktor & Network Persistence**: `.agents/skills/kotlin/kotlin-ktor-patterns.md`
* **Kotlin Unit & Integration Testing**: `.agents/skills/kotlin/kotlin-testing.md`

### Backend Integration & Patterns
* **Express & API Client Patterns**: `.agents/skills/backend-patterns.md`
* **API Handoff & Serialization**: `.agents/api-handoff.md`

### Quality Assurance, TDD & Security
* **TDD & Verification Loops**: `.agents/skills/bettercode/tdd-workflow.md` & `verification-loop.md`
* **Security & Code Health Reviews**: `.agents/skills/bettercode/security-review.md`, `Cloud & Infrastructure Security Skill.md`, & `codehealth.md`
* **Code Standards & Quality**: `.agents/skills/bettercode/code-standards.md` & `plankton-code-quality.md`
* **Browser QA & SEO**: `.agents/skills/browserqa.md` & `.agents/skills/seo.md`
* **Benchmarking & Performance**: `.agents/skills/benchmark.md`
* **Token Budget Advisor**: `.agents/token-budget-advisor.md`

---

## 3. Core Development Rules & Architectural Mandates

1. **Strict Type Safety (Zero `any`)**: Maintain strict TypeScript interfaces on the web side (`web/src/lib/api/types.ts`) and typed data models in Kotlin. `any` is strictly prohibited.
2. **Zero-Fallback Environment Policy**: Never provide fallback defaults for missing environment variables. Use `web/src/lib/env.ts` (`getRequiredEnv` / typed getters) to fail closed with structured `ConfigurationError` (HTTP 500 JSON).
3. **Token & Secret Isolation**: Never expose `ADMIN_SECRET`, `ADMIN_PASSWORD`, or `GITHUB_CLIENT_SECRET` in client bundles (`NEXT_PUBLIC_*`). Route mutations through authenticated Next.js server handlers or API routes.
4. **Two-Factor Identity & Proxy Protection**:
   * Factor 1 (GitHub OAuth) strictly restricts access to GitHub username `Cyberbee-pro`.
   * Factor 2 verifies admin passphrase using constant-time comparison (`timingSafeCompare`).
   * Route protection is enforced via `web/src/proxy.ts` guarding `/dashboard/:path*`, `/admin/:path*`, and `/api/admin/:path*`.
5. **Open Redirect Defense**: Always sanitize destination query parameters with `getSafeReturnTo` from `web/src/lib/auth/returnTo.ts` to neutralize protocol-relative (`//`), Windows backslash (`/\`), and control-character bypasses.
6. **Multipart Media Handling**: When uploading assets (`image`, `videoDemo`, `threeDModel`), construct `FormData` with exact field names matching `about-core` Multer expectations, and serialize nested objects/arrays to JSON strings.

---

## 4. Execution Workflow

When tasked with implementing features, fixing bugs, or refactoring:

1. **Step 1 — Understand Context**:
   * Read [`.agents/context.md`](file:///data/programing/My%20sites%20and%20stuff/Portfolio/About-client/.agents/context.md) for the active state of the project.
   * Cross-reference [`.agents/api-handoff.md`](file:///data/programing/My%20sites%20and%20stuff/Portfolio/About-client/.agents/api-handoff.md) for endpoint specifications and data models.
2. **Step 2 — Design & Apply Patterns**:
   * Consult relevant skill documents in `.agents/skills/` (Next.js, React, Tailwind, Designs, or Kotlin).
   * Follow Test-Driven Development (TDD) by establishing test specifications in `web/tests/`.
3. **Step 3 — Implement with Strict Quality**:
   * Write modular, type-safe code without hardcoded secrets or arbitrary fallbacks.
   * Implement robust error boundaries and loading states.
4. **Step 4 — Verify & Validate**:
   * Run the test suite: `npm test` inside `web/` (ensure all tests pass).
   * Run TypeScript verification: `npx tsc --noEmit` inside `web/` (ensure 0 diagnostics).
   * Update [`.agents/context.md`](file:///data/programing/My%20sites%20and%20stuff/Portfolio/About-client/.agents/context.md) if new features, routes, or models are introduced.