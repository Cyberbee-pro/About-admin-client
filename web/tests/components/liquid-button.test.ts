import { test, describe } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import LiquidButton from "@/components/LiquidButton";

describe("LiquidButton Component", () => {
  test("renders button element with type='button' by default when no href is provided", () => {
    const html = renderToString(
      React.createElement(LiquidButton, { type: "button" }, "Click Me")
    );

    assert.ok(html.startsWith("<button"), "Must render as a <button> element");
    assert.ok(html.includes('type="button"'), "Must specify type='button'");
    assert.ok(html.includes("Click Me"), "Must render children text");
  });

  test("implements liquid-fill overlay and TargetCursor integration classes", () => {
    const html = renderToString(
      React.createElement(LiquidButton, { variant: "primary" }, "Liquid Action")
    );

    // Verify TargetCursor tracking class
    assert.ok(html.includes("cursor-target"), "Must contain cursor-target for TargetCursor");

    // Verify liquid-fill animation classes
    assert.ok(html.includes("overflow-hidden"), "Must contain overflow-hidden");
    assert.ok(
      html.includes("translate-y-full") && html.includes("group-hover:translate-y-0"),
      "Must contain translate-y-full and group-hover:translate-y-0 for liquid sliding animation"
    );
    assert.ok(html.includes("bg-eva-lime"), "Must use bg-eva-lime for liquid fill layer");

    // Verify removal of legacy scale press effects
    assert.ok(!html.includes("active:scale-95"), "Must NOT include active:scale-95");
  });

  test("renders external URLs and /api/ paths as an anchor <a> element", () => {
    const htmlApi = renderToString(
      React.createElement(
        LiquidButton,
        { href: "/api/auth/github", variant: "terminal" },
        "Authenticate GitHub"
      )
    );

    assert.ok(htmlApi.startsWith("<a"), "API route must render as <a> element");
    assert.ok(htmlApi.includes('href="/api/auth/github"'), "Must preserve href");
    assert.ok(htmlApi.includes("Authenticate GitHub"), "Must render children");

    const htmlExternal = renderToString(
      React.createElement(
        LiquidButton,
        { href: "https://shibraj.dev", target: "_blank", variant: "terminal" },
        "Portfolio"
      )
    );

    assert.ok(htmlExternal.startsWith("<a"), "External link must render as <a> element");
    assert.ok(htmlExternal.includes('href="https://shibraj.dev"'), "Must preserve external href");
    assert.ok(htmlExternal.includes('target="_blank"'), "Must preserve target='_blank'");
    assert.ok(htmlExternal.includes('rel="noopener noreferrer"'), "Must set safe rel attribute");
  });

  test("renders internal routes as a Next.js Link element", () => {
    const html = renderToString(
      React.createElement(
        LiquidButton,
        { href: "/dashboard", variant: "secondary" },
        "Return to Dashboard"
      )
    );

    assert.ok(html.startsWith("<a"), "Next.js Link renders as <a> in HTML");
    assert.ok(html.includes('href="/dashboard"'), "Must point to /dashboard");
    assert.ok(html.includes("Return to Dashboard"), "Must contain label");
  });

  test("renders terminal variant styling for login page buttons", () => {
    const html = renderToString(
      React.createElement(
        LiquidButton,
        { variant: "terminal" },
        "Terminal Button"
      )
    );

    assert.ok(html.includes("bg-eva-crust"), "Terminal variant must use bg-eva-crust");
    assert.ok(html.includes("border-eva-surface-border"), "Terminal variant must use border-eva-surface-border");
    assert.ok(html.includes("hover:border-eva-lime"), "Terminal variant must use hover:border-eva-lime");
    assert.ok(html.includes("font-mono"), "Terminal variant must use font-mono");
  });

  test("handles disabled state cleanly", () => {
    const html = renderToString(
      React.createElement(
        LiquidButton,
        { disabled: true },
        "Disabled Button"
      )
    );

    assert.ok(html.includes("disabled"), "Must include disabled attribute on button");
    assert.ok(html.includes("cursor-not-allowed"), "Must include cursor-not-allowed");
    assert.ok(html.includes("pointer-events-none"), "Must disable pointer events");
  });
});
