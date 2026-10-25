import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromHeader } from "@/lib/auth/guards";
import { getAdminSecret, getApiUrl, toEnvErrorResponse } from "@/lib/env";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

/**
 * Next.js Server-Side Admin Proxy Route Handler.
 * Securely proxies administrative requests to the about-core backend while injecting
 * the backend ADMIN_SECRET server-side.
 * Enforces dual-layer authentication: validates HTTP-only admin session cookie before
 * making any upstream calls.
 */
async function handleAdminProxy(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // 1. Defense-in-depth: Validate admin session cookie
    const cookieHeader = request.headers.get("cookie");
    const session = getAdminSessionFromHeader(cookieHeader);

    if (!session || session.role !== "admin" || session.username !== "Cyberbee-pro") {
      return NextResponse.json(
        {
          title: "Unauthorized",
          status: 401,
          detail: "Admin session required to access administrative resources.",
        },
        { status: 401 }
      );
    }

    // 2. Defense-in-depth: Origin & CSRF validation for mutating methods (POST, PUT, PATCH, DELETE)
    const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
    if (MUTATING_METHODS.has(request.method.toUpperCase())) {
      const originHeader = request.headers.get("origin");
      if (originHeader) {
        try {
          const originHost = new URL(originHeader).host.toLowerCase();
          const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
          const requestHost = (
            forwardedHost ||
            request.headers.get("host") ||
            new URL(request.url).host
          ).toLowerCase();

          if (originHost !== requestHost) {
            return NextResponse.json(
              {
                title: "Forbidden",
                status: 403,
                detail: "Cross-origin mutation rejected: Origin does not match request host.",
              },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            {
              title: "Forbidden",
              status: 403,
              detail: "Cross-origin mutation rejected: Invalid Origin header.",
            },
            { status: 403 }
          );
        }
      } else {
        const secFetchSite = request.headers.get("sec-fetch-site");
        if (secFetchSite !== "same-origin" && secFetchSite !== "none") {
          return NextResponse.json(
            {
              title: "Forbidden",
              status: 403,
              detail:
                "Cross-origin mutation rejected: Origin header missing and Sec-Fetch-Site is not same-origin or none.",
            },
            { status: 403 }
          );
        }
      }
    }

    // 3. Retrieve server-side environment variables
    const adminSecret = getAdminSecret();
    const backendBase = getApiUrl();

    // 4. Resolve path segments from route params
    const resolvedParams = await Promise.resolve(context.params);
    const pathSegments = resolvedParams?.path || [];

    if (pathSegments.length === 0) {
      return NextResponse.json(
        {
          status: "healthy",
          message: "Admin proxy gateway active",
        },
        { status: 200 }
      );
    }

    for (const segment of pathSegments) {
      if (segment === "." || segment === "..") {
        return NextResponse.json(
          {
            title: "Bad Request",
            status: 400,
            detail: "Path traversal segments '.' and '..' are prohibited.",
          },
          { status: 400 }
        );
      }
    }

    const encodedSegments = pathSegments.map((segment) => encodeURIComponent(segment));
    const encodedPath = encodedSegments.join("/");

    // Normalize downstream path: ensure leading /api/v1 prefix
    const subPath = pathSegments[0] === "api"
      ? `/${encodedPath}`
      : `/api/${encodedPath}`;

    const url = new URL(request.url);
    const search = url.search || "";
    const targetUrl = `${backendBase.replace(/\/+$/, "")}${subPath}${search}`;

    // 4. Construct upstream headers with server-side ADMIN_SECRET
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${adminSecret}`);

    const accept = request.headers.get("accept");
    if (accept) {
      headers.set("Accept", accept);
    } else {
      headers.set("Accept", "application/json");
    }

    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    // 5. Read and forward request body for non-GET/HEAD methods
    let body: BodyInit | undefined = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const arrayBuffer = await request.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        body = arrayBuffer;
      }
    }

    const timeoutSignal = AbortSignal.timeout(15000);

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: timeoutSignal,
    });

    const resBuffer = await response.arrayBuffer();
    const resHeaders = new Headers();
    const resContentType = response.headers.get("content-type");
    if (resContentType) {
      resHeaders.set("Content-Type", resContentType);
    }

    const isNoContent =
      response.status === 204 ||
      response.status === 205 ||
      response.status === 304;

    return new NextResponse(isNoContent ? null : resBuffer, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error) {
    const envResponse = toEnvErrorResponse(error);
    if (envResponse) return envResponse;

    return NextResponse.json(
      {
        title: "Bad Gateway",
        status: 502,
        detail:
          error instanceof Error
            ? error.message
            : "Failed to proxy request to backend service.",
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleAdminProxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleAdminProxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleAdminProxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleAdminProxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleAdminProxy(request, context);
}
