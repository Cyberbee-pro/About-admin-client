export type SupportedErrorCode =
  | 400
  | 401
  | 403
  | 404
  | 500
  | 502
  | 503
  | 504;

export interface ErrorDefinition {
  title: string;
  description: string;
  bgImage: string;
}

/**
 * Standard error definitions matching the Evangelion-styled error specifications.
 */
export const ERROR_DEFINITIONS: Record<number, ErrorDefinition> = {
  400: {
    title: "Bad Request",
    description: "The server cannot process the request due to a client error",
    bgImage: "/Errs/40X/img_400.svg",
  },
  401: {
    title: "Unauthorized",
    description: "The request requires user authentication.",
    bgImage: "/Errs/40X/img_401.svg",
  },
  403: {
    title: "Forbidden",
    description:
      "The client is authenticated but does not have permission to access the requested resource.",
    bgImage: "/Errs/40X/img_403.svg",
  },
  404: {
    title: "Not Found",
    description: "something broke in the server",
    bgImage: "/Errs/40X/img_404.svg",
  },
  500: {
    title: "Internal Server Error",
    description: "something broke in the server",
    bgImage: "/Errs/50X/img_500.svg",
  },
  502: {
    title: "Bad Gateway",
    description: "gateway got an invalid response",
    bgImage: "/Errs/50X/img_502.svg",
  },
  503: {
    title: "Service Unavailable",
    description: "Server is temporarily offline or busy",
    bgImage: "/Errs/50X/img_503.svg",
  },
  504: {
    title: "Gateway Timeout",
    description: "gateway waited too long for a reply",
    bgImage: "/Errs/50X/img_504.svg",
  },
};

/**
 * Dynamically resolves the background image path for 40X or 50X errors.
 */
export function resolveErrorBackground(code: number | string): string {
  const numericCode = typeof code === "string" ? parseInt(code, 10) : code;
  if (!Number.isNaN(numericCode) && numericCode in ERROR_DEFINITIONS) {
    return ERROR_DEFINITIONS[numericCode].bgImage;
  }

  const codeStr = String(code);
  if (codeStr.startsWith("4")) {
    return `/Errs/40X/img_${codeStr}.svg`;
  }
  if (codeStr.startsWith("5")) {
    return `/Errs/50X/img_${codeStr}.svg`;
  }

  return "/Errs/40X/img_404.svg";
}

/**
 * Helper to compute default or customized error details.
 * Safe to call from both Server Components (generateMetadata) and Client Components.
 */
export function getErrorDetails(
  code: number | string,
  customTitle?: string,
  customDescription?: string
): {
  code: number | string;
  title: string;
  description: string;
  bgImage: string;
} {
  const numericCode = typeof code === "string" ? parseInt(code, 10) : code;
  const def = !Number.isNaN(numericCode)
    ? ERROR_DEFINITIONS[numericCode]
    : undefined;

  const title = customTitle || def?.title || `Error ${code}`;
  const description =
    customDescription ||
    def?.description ||
    "An unexpected error occurred in the system.";
  const bgImage = resolveErrorBackground(code);

  return {
    code,
    title,
    description,
    bgImage,
  };
}
