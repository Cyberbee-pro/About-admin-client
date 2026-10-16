# About-client: Current Repository Context & Architecture

## 1. Purpose & System Overview
`About-client` is the client-side repository for Shibraj's personal portfolio ecosystem (`shibraj.dev`). It contains the administrative dashboard portal and client applications that interface with the decoupled **`about-core`** backend API.

The repository currently encompasses:
* **`web/`**: Next.js 16 (App Router, Turbopack) administrative portal featuring a cyberpunk/terminal-themed authentication flow, interactive WebGL/Three.js shaders, project CRUD management, site configuration editing, and backend request log inspection.
* **`App/`**: Native Kotlin Android client (planned/contracted) for mobile portfolio browsing and lightweight administrative actions.
* **`.agents/`**: Repository knowledge base containing architectural specifications, backend API handoff documentation, development standards, and specialized AI agent skills.

The architecture is strictly decoupled: `About-client` never connects directly to the MongoDB database. All data persistence, media uploads (via Cloudinary), and logging flow through the RESTful `about-core` API over HTTPS.

---

## 2. Implementation Status & Audit (October 2026)

### Key Metrics
* **Unit & Integration Tests**: 86 tests across 32 test suites passing (`npm test` via native Node.js runner with `tsx`).
* **TypeScript Health**: 0 type diagnostics under strict mode (`npx tsc --noEmit`).
* **Framework Stack**: Next.js `16.3.8`, React `19.2.8`, Tailwind CSS `^4`, TypeScript `^5`.

---

## 3. Subsystem Architecture

### 3.1 Strict Two-Factor Authentication & Identity Guard
The admin portal implements a two-factor authentication pipeline designed for exclusive administrative access by `Cyberbee-pro`:

```
Unauthenticated Request -> /login
  │
  ├─► Factor 1: GitHub OAuth (/api/auth/github -> /api/auth/github/callback)
  │     │
  │     ├─► Validates OAuth state via HTTP-only cookie `admin_oauth_state` (10 min expiry)
  │     ├─► Strict Identity Check: Verifies GitHub username strictly matches `Cyberbee-pro`
  │     │     └─► Mismatch -> 401 Unauthorized
  │     └─► Success: Issues HMAC-SHA256 signed `admin_auth_stage` cookie (15 min expiry)
  │
  └─► Factor 2: Terminal Passphrase Gate (/api/auth/password)
        │
        ├─► Requires valid `admin_auth_stage` token
        ├─► Constant-time password verification (`timingSafeCompare`) against `ADMIN_PASSWORD`
        │     └─► Mismatch -> 401 Unauthorized
        └─► Success: Issues HMAC-SHA256 signed `admin_session` cookie (24 hr expiry)
              └─► Clears `admin_auth_stage` cookie
              └─► Redirects to `/dashboard` (or sanitized `returnTo` parameter)
```

#### Authentication Utilities & Security Modules (`web/src/lib/auth/`)
* **`crypto.ts`**: Provides `timingSafeCompare` for constant-time string equality (mitigating timing attacks), `generateRandomToken` using `crypto.randomBytes`, and HMAC-SHA256 signature generation/verification (`signHmacSha256`, `verifyHmacSha256`).
* **`session.ts`**: Implements token lifecycle management:
  * Signed token format: `<base64url-payload>.<hmac-sha256-signature>`.
  * `createAuthStageToken` / `verifyAuthStageToken` for intermediate GitHub verification.
  * `createAdminSessionToken` / `verifyAdminSessionToken` for active administrator sessions.
  * Cookie management utilities (`setHttpOnlyCookie`, `clearHttpOnlyCookie`) configured with `httpOnly: true`, `sameSite: "lax"`, and `secure: true` in production.
* **`guards.ts`**: Extracts and validates session/stage tokens from request cookie headers or Next.js cookies.
* **`returnTo.ts`**: Implements `getSafeReturnTo` using WHATWG `URL` parser against a dummy origin (`http://local`). Neutralizes open-redirect vectors:
  * Protocol-relative URLs (`//attacker.com`)
  * Windows backslash separators (`/\attacker.com`)
  * ASCII control character injections (tabs, newlines, carriage returns)
  * External schemes (`javascript:`, `data:`, `https://`)
  * Preserves valid relative paths, query strings, and hashes. Defaults safely to `/dashboard`.

---

### 3.2 Route Protection & Next.js 16 Proxy (`web/src/proxy.ts`)
Next.js 16 leverages a dedicated `proxy.ts` module (matching `/dashboard/:path*`, `/admin/:path*`, and `/api/admin/:path*`):
* **UI Routes (`/dashboard`, `/admin`)**: Validates the `admin_session` cookie for role `"admin"` and username `"Cyberbee-pro"`. Unauthorized requests are redirected to `/login?returnTo=<currentPath>`.
* **API Routes (`/api/admin/*`)**: Returns structured JSON 401 errors (`{ title: "Unauthorized", status: 401, detail: "..." }`) rather than redirects.
* Public paths (`/`, `/login`, `/api/auth/*`) pass through unhindered.

---

### 3.3 Strict Zero-Fallback Environment Policy (`web/src/lib/env.ts`)
The application enforces a strict zero-fallback policy for environment configuration. Missing or whitespace-only variables immediately throw a structured `ConfigurationError` and produce a standardized 500 JSON response:

```json
{
  "title": "Internal Configuration Error",
  "status": 500,
  "detail": "The required environment variable 'VARIABLE_NAME' is missing or not set.",
  "code": "ERR_ENV_MISSING_VARIABLE_NAME"
}
```

#### Required Variables
| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Public / Runtime | Origin of the `about-core` backend API (e.g., `http://localhost:5000`) |
| `ADMIN_SECRET` | Server-only | Secret key for `about-core` mutation routes (`Authorization: Bearer <ADMIN_SECRET>`) |
| `GITHUB_CLIENT_ID` | Server-only | GitHub OAuth application client ID |
| `GITHUB_CLIENT_SECRET` | Server-only | GitHub OAuth application client secret |
| `ADMIN_PASSWORD` | Server-only | Secret passphrase for Factor 2 login terminal |
| `ADMIN_SESSION_SECRET` | Server-only | HMAC-SHA256 signing secret for authentication tokens |
| `NEXT_PUBLIC_PORTFOLIO_URL` | Public / Runtime | External link target for public portfolio viewer |

---

### 3.4 Shared API Client & Backend Service Layer (`web/src/lib/api/`)
Provides type-safe HTTP communication with the `about-core` backend:

* **`client.ts` (`apiClient<T>`)**:
  * Normalizes base URLs and query parameters (omitting `null` and `undefined`).
  * Injects `Authorization: Bearer <ADMIN_SECRET>` automatically when `auth: true` is passed.
  * Timeout management: Uses `AbortSignal.timeout(10000)` combined with caller-provided signals via `AbortSignal.any`.
  * FormData detection: Preserves runtime-calculated multipart boundaries when uploading files.
  * Normalizes API errors into `ApiClientError` instances with HTTP status code and server messages.
* **`types.ts`**: Strict TypeScript interfaces matching backend Mongoose schemas:
  * `Project`, `ProjectStatus` (`"invisible" | "planning" | "work_in_progress" | "delay_hold" | "active"`), `Contributor`, `SocialLink`, `ThreeDModelConfig`, `ProjectVersion`.
  * `SiteConfig`, `LogEntry`, `LogLevel` (`"INFO" | "WARN" | "ERROR"`).
  * Envelope types: `ApiResponse<T>`, `ApiListResponse<T>`, `ApiPaginatedResponse<T>`, `ApiErrorResponse`.
* **Services**:
  * **`projectService.ts`**: `getProjects` (with category, featured, tag filters), `getCategories`, `getProjectBySlug`, `createProject`, `updateProject`, `deleteProject`, and `appendProjectVersion`. Automatically serializes nested objects to JSON strings when `FormData` is used for media uploads.
  * **`configService.ts`**: `getConfig`, `updateConfig`.
  * **`logService.ts`**: `getLogs` with pagination (`page`, `limit` clamped 1..500) and `date`/`month`/`year`/`level` filters.

---

### 3.5 UI & Interactive Shader Design System (`web/src/components/designs/`)
The frontend incorporates interactive shader and animation components dynamically imported with SSR disabled:
* **`PatternWaves`**: WebGL/OGL background rendering procedural oscillating line patterns with presets (`terminal`, `cyber`, `matrix`), mouse interactivity, edge fading, and custom color palettes.
* **`PixelBlast`**: Three.js canvas component rendering an interactive dithered particle field with ripple physics and customizable particle density.
* **`SlideCommit`**: Interactive slider confirmation component powered by GSAP and Motion, replacing standard buttons for high-stakes actions like login confirmation.
* **`TargetCursor`**: Smooth GSAP-driven custom cursor with corner brackets that track and snap to `.cursor-target` elements with spring physics and rotation effects.

---

### 3.6 Mobile Client Contract (`App/`)
For the planned Kotlin Android client, `web/src/lib/api/KOTLIN_CONTRACT.md` documents 1:1 mappings between TypeScript interfaces and `kotlinx.serialization` `@Serializable` data classes.
* Data models: `Project`, `ProjectVersion`, `ThreeDModelConfig`, `Contributor`, `SocialLink`, `SiteConfig`, `LogEntry`.
* Envelope responses: `ApiResponse<T>`, `ApiListResponse<T>`, `ApiPaginatedResponse<T>`.

---

## 4. Monorepo Directory Layout

```
About-client/
├── .agents/                                # Agent knowledge base & workflow configurations
│   ├── api-handoff.md                      # Backend API specification & endpoint contracts
│   ├── architecture.md                     # Monorepo architecture overview
│   ├── context.md                          # Current repository state, audit, and context (this file)
│   ├── rules.md                            # Development principles and code standards
│   ├── token-budget-advisor.md             # LLM context budget guidelines
│   └── skills/                             # Domain-specific skill guides
│       ├── backend-patterns.md             # Express API patterns & Mongoose integration
│       ├── benchmark.md                    # Benchmarking standards
│       ├── browserqa.md                    # Browser QA and automated end-to-end testing
│       ├── seo.md                          # SEO & metadata patterns
│       ├── bettercode/                     # Quality checklists (TDD, security, code health)
│       ├── blencorp claude-code-kit.../     # Tailwind CSS design system kit
│       ├── designs/                        # WebGL shaders and UI animation specifications
│       ├── kotlin/                         # Android Kotlin coroutines, flows, Ktor & testing
│       ├── next/                           # Next.js & Turbopack conventions
│       ├── react js/                       # React patterns, testing, and performance
│       └── vercel next.js canary skills/   # Canary caching, PPR, and dev loops
├── web/                                    # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/                            # App Router routes & API endpoints
│   │   │   ├── api/auth/                   # OAuth, password verification, session, logout
│   │   │   ├── error/                      # Dynamic Evangelion error routes (/error/[code])
│   │   │   ├── not-found.tsx               # Next.js 404 handler (Evangelion ErrorScreen)
│   │   │   ├── error.tsx                   # Next.js 500 runtime error boundary
│   │   │   ├── login/                      # 2FA Login terminal (LoginClient.tsx)
│   │   │   ├── layout.tsx                  # Root layout with fonts (Exo 2, Geist)
│   │   │   └── page.tsx                    # Root redirect to /dashboard
│   │   ├── components/                     # Reusable components
│   │   │   ├── ErrorScreen.tsx             # Evangelion-styled Error Screen template
│   │   │   └── designs/                    # WebGL, Three.js, GSAP design components
│   │   ├── lib/
│   │   │   ├── api/                        # Shared API client, types, services, Kotlin contract
│   │   │   ├── auth/                       # Crypto utilities, session tokens, security guards
│   │   │   └── env.ts                      # Strict environment variable validation
│   │   └── proxy.ts                        # Next.js 16 route protection middleware
│   ├── tests/                              # Node.js test runner suites (86 passing tests)
│   ├── public/                             # Static public assets (fonts, icons)
│   ├── package.json                        # Scripts and dependencies
│   └── tsconfig.json                       # Strict TypeScript configuration
└── agents.md                               # Root entry point & instructions for AI agents
```

---

## 5. Engineering Constraints & Rules

1. **Strict TypeScript (Zero `any`)**: All payloads, React props, state variables, and API responses must have explicit type declarations.
2. **Token Security & Client Bundle Hygiene**: `ADMIN_SECRET`, `ADMIN_PASSWORD`, and `GITHUB_CLIENT_SECRET` must never be prefixed with `NEXT_PUBLIC_` or bundled into client-side JavaScript. All protected mutations must execute through server actions or Next.js route handlers.
3. **Environment Fail-Closed Principle**: Never provide fallback default values for missing configuration keys. Always use `getRequiredEnv` or the typed accessors in `web/src/lib/env.ts`.
4. **Open Redirect Defense**: Always pass redirect destination query parameters through `getSafeReturnTo` before executing navigation or emitting redirect headers.
5. **Multipart Upload Protocol**: When uploading files (`image`, `videoDemo`, `threeDModel`), use `FormData` and serialize complex objects (contributors, social links, versions) to JSON strings matching `about-core` Multer expectations.
6. **Testing Requirement**: Every new service method, API route handler, authentication guard, and cryptographic helper must be covered by test suites in `web/tests/`.

---

## 6. Commands & Verification

From `web/`:
```bash
# Start development server
npm run dev

# Run full test suite (72 tests)
npm test

# Type-check TypeScript strictly
npx tsc --noEmit

# Run ESLint
npm run lint

# Compile production build
npm run build
```
