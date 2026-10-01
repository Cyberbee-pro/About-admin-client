# About-admin-client

The administrative dashboard and multi-platform client workspace for managing your portfolio ecosystem. This repository interfaces directly with the decoupled backend service (`about-core`).

---

## 🏗️ Workspace Architecture

```text
About-admin-client/
├── web/            # Next.js admin portal & dashboard UI
├── App/            # Native Kotlin Android client
├── shared/         # Shared API client wrappers, types, and DTOs
└── .agents/        # Agent skills, workflow guides, and architecture rules
```

🔒 Security & Authentication Architecture

To prevent unauthorized mutations while keeping the backend lightweight:

    GitHub OAuth Gate: Authentication is strictly restricted to the GitHub account handle Cyberbee-pro. Any other identity is rejected at the login gateway.

    Password Verification Layer: Following successful GitHub OAuth sign-in, an additional password challenge verifies identity before issuing administrative privileges.

    Protected Server Actions: The sensitive ADMIN_SECRET token is stored securely as a server-side environment variable inside the Next.js deployment and never leaked to public client bundles. Authenticated server actions handle all backend mutations (POST, PUT, DELETE).

🌐 Backend Integration (about-core)

The clients in this workspace consume the about-core API:

    Production API Base: https://about-core.vercel.app/api/v1

    Slug-Based Routing: Projects use stable URL-safe slugs (e.g., /api/v1/projects/:slug) for detail views and version management.

    Multipart Asset Pipeline: Media assets (images, video demos, .glb 3D models) are streamed via FormData directly to nested Cloudinary folders (portfolio/projects/<slug>/...).

🤖 Agent Framework & Skills

This workspace utilizes specialized engineering skills and instructions stored in .agents/:

    Web & Turbopack: Next.js and Tailwind optimization rules.

    Mobile & Kotlin: Coroutines, Flows, and native Android patterns.

    Verification Loops: Strict TDD workflows and security review checklists.

Refer to agents.md for full agent navigation and rule execution guidelines.
🚀 Getting Started

    Clone the repository and navigate into the workspace:
    Bash

    git clone [https://github.com/Cyberbee-pro/About-admin-client.git](https://github.com/Cyberbee-pro/About-admin-client.git)
    cd About-admin-client

    Configure your environment variables for local development (.env.local inside web/):
    Code snippet

    NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
    ADMIN_SECRET=your_secure_admin_secret
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    ADMIN_PASSWORD_HASH=your_hashed_verification_password

    Install dependencies and start development across workspace packages.
