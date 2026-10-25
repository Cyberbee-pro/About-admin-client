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

  test("implements liquid-fill overlay, keyboard focus accessibility, and TargetCursor integration classes", () => {
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
    assert.ok(
      html.includes("group-focus-visible:translate-y-0"),
      "Must support keyboard focus animation with group-focus-visible:translate-y-0"
    );
    assert.ok(
      html.includes("group-focus-visible:text-eva-black"),
      "Text must transition to legible black under keyboard focus (group-focus-visible:text-eva-black)"
    );
    assert.ok(
      html.includes("focus-visible:ring-eva-lime"),
      "Must include focus-visible focus ring for keyboard navigation"
    );
    assert.ok(html.includes("bg-eva-lime"), "Must use bg-eva-lime for liquid fill layer");

    // Verify removal of legacy scale press effects
    assert.ok(!html.includes("active:scale-95"), "Must NOT include active:scale-95");
  });

  test("accepts fully customizable liquidColor and activeTextColor parameters", () => {
    const customHtml = renderToString(
      React.createElement(
        LiquidButton,
        {
          liquidColor: "bg-eva-orange",
          activeTextColor: "group-hover:text-white group-focus-visible:text-white",
        },
        "NERV Alert"
      )
    );

    assert.ok(customHtml.includes("bg-eva-orange"), "Must apply custom liquidColor");
    assert.ok(
      customHtml.includes("group-hover:text-white group-focus-visible:text-white"),
      "Must apply custom activeTextColor"
    );
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

  test("disables navigation when href and disabled are both provided", () => {
    const disabledLinkHtml = renderToString(
      React.createElement(
        LiquidButton,
        { href: "/dashboard", disabled: true, variant: "secondary" },
        "Disabled Link"
      )
    );

    assert.ok(
      !disabledLinkHtml.includes('href="/dashboard"'),
      "Must omit href attribute when disabled to prevent navigation"
    );
    assert.ok(
      disabledLinkHtml.includes('aria-disabled="true"'),
      "Must specify aria-disabled='true'"
    );
    assert.ok(
      disabledLinkHtml.includes('tabindex="-1"'),
      "Must set tabindex='-1' to remove from keyboard tab order"
    );
    assert.ok(
      disabledLinkHtml.includes("pointer-events-none"),
      "Must apply pointer-events-none to prevent click events"
    );
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

  test("handles disabled state cleanly on button elements", () => {
    const html = renderToString(
      React.createElement(
        LiquidButton,
        { disabled: true },
        "Disabled Button"
      )
    );

    assert.ok(html.includes("disabled"), "Must include disabled attribute on button");
    assert.ok(html.includes('aria-disabled="true"'), "Must include aria-disabled attribute");
    assert.ok(html.includes("cursor-not-allowed"), "Must include cursor-not-allowed");
    assert.ok(html.includes("pointer-events-none"), "Must disable pointer events");
  });

  test("toggles border off when butBorder=0, 'but-border'=0, or butBorder=false", () => {
    const htmlZero = renderToString(
      React.createElement(LiquidButton, { variant: "primary", butBorder: 0 }, "No Border Zero")
    );
    assert.ok(htmlZero.includes("!border-none"), "Must include !border-none when butBorder is 0");
    assert.ok(!htmlZero.includes("border-eva-lime"), "Must strip default border class when butBorder is 0");

    const htmlKebabZero = renderToString(
      React.createElement(LiquidButton, { variant: "terminal", "but-border": 0 }, "No Border Kebab")
    );
    assert.ok(htmlKebabZero.includes("!border-none"), "Must include !border-none when but-border is 0");
    assert.ok(!htmlKebabZero.includes("border-eva-surface-border"), "Must strip border class when but-border is 0");

    const htmlFalse = renderToString(
      React.createElement(LiquidButton, { variant: "secondary", butBorder: false }, "No Border False")
    );
    assert.ok(htmlFalse.includes("!border-none"), "Must include !border-none when butBorder is false");
  });

  test("supports customizable borders via borderColor or custom butBorder class string", () => {
    const htmlColor = renderToString(
      React.createElement(LiquidButton, { variant: "primary", borderColor: "border-eva-red" }, "Red Border")
    );
    assert.ok(htmlColor.includes("border-eva-red"), "Must apply custom borderColor");

    const htmlCustom = renderToString(
      React.createElement(LiquidButton, { variant: "terminal", butBorder: "border-2 border-eva-teal" }, "Teal Border")
    );
    assert.ok(htmlCustom.includes("border-2 border-eva-teal"), "Must apply custom butBorder string");
  });

  test("renders wave animation and activeColor when isActive is true", () => {
    const htmlActive = renderToString(
      React.createElement(
        LiquidButton,
        {
          isActive: true,
          activeColor: "bg-eva-red",
          waveColor: "#52d053",
        },
        "Active Tab"
      )
    );

    assert.ok(htmlActive.includes('data-testid="liquid-button-wave-layer"'), "Must render active wave layer");
    assert.ok(htmlActive.includes('data-testid="liquid-bubbles"'), "Must render rising liquid bubbles in active state");
    assert.ok(htmlActive.includes("bubbleRise"), "Must include bubbleRise animations");
    assert.ok(htmlActive.includes("bg-eva-red"), "Must render activeColor fill");
    assert.ok(htmlActive.includes("liquidWaveSlow"), "Must reference liquidWaveSlow animation");
    assert.ok(htmlActive.includes("liquidWaveFast"), "Must reference liquidWaveFast animation");
    assert.ok(htmlActive.includes('fill="#52d053"'), "Must apply custom waveColor fill to SVG wave");
    assert.ok(htmlActive.includes("bottom: 115%"), "Must rise based on container height using bottom percentages");
    assert.ok(htmlActive.includes("prefers-reduced-motion: reduce"), "Must support prefers-reduced-motion accessibility");
  });

  test("defines liquidRiseFill animation and supports after-click fill and stayActiveOnClick", () => {
    const html = renderToString(
      React.createElement(
        LiquidButton,
        {
          stayActiveOnClick: true,
          liquidColor: "bg-eva-lime",
          activeColor: "bg-eva-red",
        },
        "Click & Stay"
      )
    );

    // Verify keyframe definition for red liquid fill rising over green
    assert.ok(html.includes("@keyframes liquidRiseFill"), "Must define liquidRiseFill keyframes");
    assert.ok(html.includes("transform: translateY(100%)"), "liquidRiseFill must start from bottom 100%");
    assert.ok(html.includes("transform: translateY(0)"), "liquidRiseFill must finish at top 0%");

    // Verify hover green liquid layer is present
    assert.ok(html.includes("bg-eva-lime"), "Must render hover green liquid layer");
    assert.ok(html.includes("translate-y-full"), "Hover green liquid starts translated for hover entry");
  });

  test("does not activate persistent active state on click when href is provided without stayActiveOnClick", () => {
    // Render an anchor with href without stayActiveOnClick or isActive
    const htmlLink = renderToString(
      React.createElement(
        LiquidButton,
        {
          href: "https://shibraj.dev",
          variant: "terminal",
        },
        "External Link"
      )
    );

    // Initial render must not include active wave layer or liquid bubbles
    assert.ok(!htmlLink.includes('<div data-testid="liquid-button-wave-layer"'), "Link without stayActiveOnClick must not have active wave layer element");
    assert.ok(!htmlLink.includes('<div data-testid="liquid-bubbles"'), "Link without stayActiveOnClick must not have bubbles element");
  });
});

