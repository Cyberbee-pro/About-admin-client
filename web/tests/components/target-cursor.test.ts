// Mock CSS imports for Node test runner
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(require as any).extensions[".css"] = () => ({});

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";

describe("TargetCursor Component & Global Integration", () => {
  test("TargetCursor.tsx specifies 'use client' directive at line 1", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/designs/TargetCursor.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.split("\n")[0].trim();
    assert.strictEqual(
      firstLine,
      '"use client";',
      "TargetCursor.tsx must start with 'use client' directive"
    );
  });

  test("TargetCursor renders safely as null during SSR without throwing", async () => {
    // During SSR, mounted is false so createPortal is avoided, preventing hydration errors
    const { default: TargetCursor } = await import(
      "@/components/designs/TargetCursor"
    );
    const html = renderToString(React.createElement(TargetCursor));
    assert.strictEqual(html, "", "SSR rendering must output empty string (null)");
  });

  test("TargetCursor.css strictly enforces pointer-events: none and user-select: none", () => {
    const cssPath = path.resolve(
      process.cwd(),
      "src/components/designs/TargetCursor.css"
    );
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    assert.ok(
      cssContent.includes("pointer-events: none"),
      "TargetCursor.css must declare pointer-events: none"
    );
    assert.ok(
      cssContent.includes("user-select: none"),
      "TargetCursor.css must declare user-select: none"
    );
  });

  test("Root layout imports and mounts TargetCursor inside body", () => {
    const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    assert.ok(
      layoutContent.includes("import TargetCursor from"),
      "layout.tsx must import TargetCursor"
    );
    assert.ok(
      layoutContent.includes("<TargetCursor"),
      "layout.tsx must mount TargetCursor component"
    );
  });
});
