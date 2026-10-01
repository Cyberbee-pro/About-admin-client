# Agent Instructions & Workspace Guidance: About-admin-client

## 1. Mission & Scope
You are operating within the **`About-admin-client`** workspace. This repository contains client-facing applications interacting with the decoupled **`about-core`** backend API.
* **`web/`**: Next.js administrative dashboard and public workspace.
* **`App/`**: Native Kotlin Android client.
* **`.agents/`**: Repository of domain-specific architectural skills, quality checklists, and testing patterns.

---

## 2. Skill Directory Routing Matrix
When implementing features, always consult the relevant skill directory inside `.agents/skills/` based on the target layer:

### Web Frontend (`web/`) & UI
* **Next.js & Turbopack**: `.agents/skills/next/nextjs-turbopack.md`
* **Vercel Canary Optimization & Caching**: `.agents/skills/vercel next.js canary skills/`
* **React Architecture & Performance**: `.agents/skills/react js/`
* **Styling & Tailwind Design System**: `.agents/skills/blencorp claude-code-kit main cli-kits_tailwindcss/`

### Mobile Client (`App/`) & Kotlin
* **Kotlin Coroutines, Flows & Architecture**: `.agents/skills/kotlin/`
* **Kotlin Testing & Persistence**: `.agents/skills/kotlin/kotlin-testing.md`

### Quality Assurance, TDD & Security
* **TDD & Verification Loops**: `.agents/skills/bettercode/tdd-workflow.md` & `verification-loop.md`
* **Security & Code Health Reviews**: `.agents/skills/bettercode/security-review.md` & `code-health.md`
* **QA & SEO Integrity**: `.agents/skills/browserqa.md` & `.agents/skills/seo.md`

---

## 3. Core Development Rules
1. **Functionality First**: Prioritize robust API integration, bulletproof payload handling, and error states before visual polish.
2. **Strict Type Safety**: Use strict TypeScript interfaces on the web side and typed DTOs in Kotlin. Avoid `any`.
3. **API Contract Alignment**: Always cross-reference request/response structures with `.agents/api-handoff.md` before writing network clients.
4. **Token Security**: Never bundle `ADMIN_SECRET` into public client builds. Route mutations through authenticated server actions or protected Next.js API routes.

---

## 4. Execution Workflow
* **Step 1**: Read `architecture.md` and `api-handoff.md` to understand context.
* **Step 2**: Apply relevant patterns from `.agents/skills/` matching the code domain.
* **Step 3**: Verify changes with local type checking and test suites before finalizing.