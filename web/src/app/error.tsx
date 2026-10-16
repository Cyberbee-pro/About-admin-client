"use client";

import React, { useEffect } from "react";
import ErrorScreen from "@/components/ErrorScreen";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for administrative diagnostics
    console.error("Next.js Error Boundary caught runtime exception:", error);
  }, [error]);

  return (
    <ErrorScreen
      code={500}
      description={error.message || "something broke in the server"}
      reset={reset}
    />
  );
}
