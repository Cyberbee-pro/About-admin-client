"use client";

import React, { useEffect } from "react";
import ErrorScreen from "@/components/ErrorScreen";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log fatal root-level errors for administrative diagnostics
    console.error("Next.js Global Error Boundary caught exception:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#12121b] text-white">
        <ErrorScreen
          code={500}
          description={
            error.digest
              ? `Error reference: ${error.digest}`
              : "something broke in the server"
          }
          reset={reset}
        />
      </body>
    </html>
  );
}
