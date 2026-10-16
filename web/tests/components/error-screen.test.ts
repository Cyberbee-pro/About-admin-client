import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";

import ErrorScreen, {
  ERROR_DEFINITIONS as ComponentDefs,
  resolveErrorBackground as componentResolveBg,
  getErrorDetails as componentGetDetails,
} from "@/components/ErrorScreen";
import {
  ERROR_DEFINITIONS,
  resolveErrorBackground,
  getErrorDetails,
} from "@/lib/errors";
import { generateStaticParams } from "@/app/error/[code]/page";
import ErrorBoundary from "@/app/error";
import NotFound from "@/app/not-found";

describe("Evangelion Error Screen & Dynamic Routes", () => {
  const publicDir = path.resolve(__dirname, "../../public");

  describe("ERROR_DEFINITIONS Matrix", () => {
    const expectedCodes = [400, 401, 403, 404, 500, 502, 503, 504];

    test("contains specifications for all 8 standard error codes", () => {
      for (const code of expectedCodes) {
        assert.ok(code in ERROR_DEFINITIONS, `Missing definition for error code ${code}`);
      }
    });

    test("ErrorScreen component re-exports match lib/errors definitions", () => {
      assert.deepEqual(ComponentDefs, ERROR_DEFINITIONS);
      assert.equal(typeof componentResolveBg, "function");
      assert.equal(typeof componentGetDetails, "function");
    });

    test("maps titles matching Evangelion tech specifications", () => {
      assert.equal(ERROR_DEFINITIONS[400].title, "Bad Request");
      assert.equal(ERROR_DEFINITIONS[401].title, "Unauthorized");
      assert.equal(ERROR_DEFINITIONS[403].title, "Forbidden");
      assert.equal(ERROR_DEFINITIONS[404].title, "Not Found");
      assert.equal(ERROR_DEFINITIONS[500].title, "Internal Server Error");
      assert.equal(ERROR_DEFINITIONS[502].title, "Bad Gateway");
      assert.equal(ERROR_DEFINITIONS[503].title, "Service Unavailable");
      assert.equal(ERROR_DEFINITIONS[504].title, "Gateway Timeout");
    });

    test("maps descriptions matching Evangelion mockups and specifications", () => {
      assert.equal(
        ERROR_DEFINITIONS[400].description,
        "The server cannot process the request due to a client error"
      );
      assert.equal(
        ERROR_DEFINITIONS[401].description,
        "The request requires user authentication."
      );
      assert.equal(
        ERROR_DEFINITIONS[403].description,
        "The client is authenticated but does not have permission to access the requested resource."
      );
      assert.equal(
        ERROR_DEFINITIONS[404].description,
        "something broke in the server"
      );
      assert.equal(
        ERROR_DEFINITIONS[500].description,
        "something broke in the server"
      );
      assert.equal(
        ERROR_DEFINITIONS[502].description,
        "gateway got an invalid response"
      );
      assert.equal(
        ERROR_DEFINITIONS[503].description,
        "Server is temporarily offline or busy"
      );
      assert.equal(
        ERROR_DEFINITIONS[504].description,
        "gateway waited too long for a reply"
      );
    });
  });

  describe("resolveErrorBackground Resolver", () => {
    test("resolves whitelisted 40X error codes to /Errs/40X/img_[code].svg", () => {
      assert.equal(resolveErrorBackground(400), "/Errs/40X/img_400.svg");
      assert.equal(resolveErrorBackground(401), "/Errs/40X/img_401.svg");
      assert.equal(resolveErrorBackground(403), "/Errs/40X/img_403.svg");
      assert.equal(resolveErrorBackground(404), "/Errs/40X/img_404.svg");
      assert.equal(resolveErrorBackground("404"), "/Errs/40X/img_404.svg");
    });

    test("resolves whitelisted 50X error codes to /Errs/50X/img_[code].svg", () => {
      assert.equal(resolveErrorBackground(500), "/Errs/50X/img_500.svg");
      assert.equal(resolveErrorBackground(502), "/Errs/50X/img_502.svg");
      assert.equal(resolveErrorBackground(503), "/Errs/50X/img_503.svg");
      assert.equal(resolveErrorBackground(504), "/Errs/50X/img_504.svg");
      assert.equal(resolveErrorBackground("500"), "/Errs/50X/img_500.svg");
    });

    test("falls back safely to /Errs/40X/img_404.svg for unlisted 4xx or unclassified codes", () => {
      assert.equal(resolveErrorBackground("418"), "/Errs/40X/img_404.svg");
      assert.equal(resolveErrorBackground(999), "/Errs/40X/img_404.svg");
      assert.equal(resolveErrorBackground("unknown"), "/Errs/40X/img_404.svg");
      assert.equal(resolveErrorBackground("404'url(evil)"), "/Errs/40X/img_404.svg");
    });

    test("falls back safely to /Errs/50X/img_500.svg for unlisted 5xx codes", () => {
      assert.equal(resolveErrorBackground("505"), "/Errs/50X/img_500.svg");
      assert.equal(resolveErrorBackground(501), "/Errs/50X/img_500.svg");
    });
  });

  describe("getErrorDetails Helper", () => {
    test("populates default values for known error code", () => {
      const details = getErrorDetails(403);
      assert.equal(details.code, 403);
      assert.equal(details.title, "Forbidden");
      assert.match(details.description, /not have permission/);
      assert.equal(details.bgImage, "/Errs/40X/img_403.svg");
    });

    test("respects custom title and description overrides", () => {
      const customTitle = "Access Denied by Central Dogma";
      const customDesc = "Security level clearance insufficient for Terminal Dogma access.";
      const details = getErrorDetails(403, customTitle, customDesc);

      assert.equal(details.title, customTitle);
      assert.equal(details.description, customDesc);
      assert.equal(details.bgImage, "/Errs/40X/img_403.svg");
    });
  });

  describe("Static Route Generation", () => {
    test("generateStaticParams pre-renders all 8 standard error codes", () => {
      const params = generateStaticParams();
      const codes = params.map((p) => p.code);

      assert.equal(params.length, 8);
      assert.deepEqual(codes.sort(), ["400", "401", "403", "404", "500", "502", "503", "504"]);
    });
  });

  describe("Physical Asset Integrity in public/", () => {
    test("all 8 background SVG image files exist on disk", () => {
      for (const [code, def] of Object.entries(ERROR_DEFINITIONS)) {
        const filePath = path.join(publicDir, def.bgImage);
        assert.ok(
          fs.existsSync(filePath),
          `Asset missing on disk for code ${code}: ${filePath}`
        );
        const stats = fs.statSync(filePath);
        assert.ok(stats.size > 0, `Asset file is empty for code ${code}: ${filePath}`);
      }
    });

    test("circular motif ITZEUL.svg exists on disk", () => {
      const itzeulPath = path.join(publicDir, "common/ITZEUL.svg");
      assert.ok(fs.existsSync(itzeulPath), `Missing ITZEUL.svg at ${itzeulPath}`);
      const stats = fs.statSync(itzeulPath);
      assert.ok(stats.size > 0, "ITZEUL.svg file is empty");
    });

    test("hazard strip haz_strip.svg exists on disk with diagonal stripes", () => {
      const hazPath = path.join(publicDir, "common/haz_strip.svg");
      assert.ok(fs.existsSync(hazPath), `Missing haz_strip.svg at ${hazPath}`);
      const content = fs.readFileSync(hazPath, "utf8");
      assert.ok(content.includes("#B0DD09"), "haz_strip.svg must contain yellow-green hazard base");
      assert.ok(content.includes("#000000"), "haz_strip.svg must contain black diagonal stripes");
    });
  });

  describe("Component Rendering", () => {
    test("renders full Evangelion error screen structure with correct text and assets", () => {
      const html = renderToString(
        React.createElement(ErrorScreen, {
          code: 400,
          title: "Bad Request",
          description: "The server cannot process the request due to a client error",
        })
      );

      // Verify Line 1: Err 400 :
      assert.ok(html.includes("Err 400 :"), "HTML must render Line 1: Err 400 :");
      // Verify Line 2: Bad Request
      assert.ok(html.includes("Bad Request"), "HTML must render Line 2: Bad Request");
      // Verify Line 3: Description
      assert.ok(
        html.includes("The server cannot process the request due to a client error"),
        "HTML must render Line 3 description"
      );
      // Verify ITZEUL circular motif
      assert.ok(html.includes("/common/ITZEUL.svg"), "HTML must include ITZEUL motif");
      // Verify background SVG path
      assert.ok(html.includes("/Errs/40X/img_400.svg"), "HTML must include 400 background");
      // Verify hazard footer
      assert.ok(html.includes("/common/haz_strip.svg"), "HTML must include haz_strip.svg");
      // Verify Return to Dashboard link
      assert.ok(html.includes("/dashboard"), "HTML must render return link");

      // Verify header alert format with enlarged > prefix and no pulsing dot or glow
      assert.ok(
        html.includes("&gt;</span>") &&
          html.includes("NERV SYSTEM ALERT // CODE: 400"),
        "HTML must render header alert with enlarged > prefix"
      );
      assert.ok(!html.includes("animate-pulse"), "HTML must not render pulsing dot");
      assert.ok(
        !html.includes("drop-shadow-[0_0_20px"),
        "HTML must not render amber glow on ITZEUL motif"
      );
    });

    test("renders retry button when reset callback is provided", () => {
      const html = renderToString(
        React.createElement(ErrorScreen, {
          code: 500,
          reset: () => {},
        })
      );

      assert.ok(html.includes("Err 500 :"), "HTML must render Err 500 :");
      assert.ok(html.includes("Internal Server Error"), "HTML must render Internal Server Error");
      assert.ok(html.includes("Retry Operation"), "HTML must render Retry Operation button");
      assert.ok(html.includes("/Errs/50X/img_500.svg"), "HTML must include 500 background");
    });

    test("buttons implement liquid-fill green animation without active:scale-95", () => {
      const html = renderToString(
        React.createElement(ErrorScreen, {
          code: 500,
          reset: () => {},
        })
      );

      // Verify removal of scale-down press effects
      assert.ok(!html.includes("active:scale-95"), "Buttons must NOT use active:scale-95");

      // Verify TargetCursor integration class
      assert.ok(html.includes("cursor-target"), "Buttons must have cursor-target class for TargetCursor");

      // Verify liquid-fill green transition layers
      assert.ok(
        html.includes("overflow-hidden"),
        "Buttons must have overflow-hidden container for liquid-fill effect"
      );
      assert.ok(
        html.includes("translate-y-full") && html.includes("group-hover:translate-y-0"),
        "Buttons must contain liquid-fill slide animation (translate-y-full -> translate-y-0)"
      );
      assert.ok(
        html.includes("bg-eva-lime") || html.includes("bg-[#B0DD09]"),
        "Liquid-fill element must use vibrant Evangelion lime green (bg-eva-lime)"
      );
    });

    test("ErrorBoundary sanitizes error message and shows generic fallback without digest", () => {
      const originalConsoleError = console.error;
      console.error = () => {};
      try {
        const sensitiveError = new Error("FATAL: database password exposed in query");
        const html = renderToString(
          React.createElement(ErrorBoundary, {
            error: sensitiveError,
            reset: () => {},
          })
        );

        assert.ok(!html.includes("FATAL: database password exposed"), "HTML must NOT leak error.message");
        assert.ok(html.includes("something broke in the server"), "HTML must render generic fallback");
        assert.ok(html.includes("Err 500 :"), "HTML must render Err 500 :");
      } finally {
        console.error = originalConsoleError;
      }
    });

    test("ErrorBoundary displays correlation reference when error.digest is provided", () => {
      const originalConsoleError = console.error;
      console.error = () => {};
      try {
        const errorWithDigest = Object.assign(new Error("Internal DB connection dropped"), {
          digest: "CORRELATION_ID_XYZ123",
        });
        const html = renderToString(
          React.createElement(ErrorBoundary, {
            error: errorWithDigest,
            reset: () => {},
          })
        );

        assert.ok(!html.includes("Internal DB connection dropped"), "HTML must NOT leak error.message");
        assert.ok(html.includes("Error reference: CORRELATION_ID_XYZ123"), "HTML must render digest reference");
      } finally {
        console.error = originalConsoleError;
      }
    });

    test("NotFound component renders Evangelion 404 layout and assets", () => {
      const html = renderToString(React.createElement(NotFound));

      assert.ok(html.includes("Err 404 :"), "HTML must render Err 404 :");
      assert.ok(html.includes("Not Found"), "HTML must render Not Found");
      assert.ok(html.includes("/Errs/40X/img_404.svg"), "HTML must render 404 background");
      assert.ok(html.includes("/common/ITZEUL.svg"), "HTML must render ITZEUL circular motif");
      assert.ok(html.includes("/common/haz_strip.svg"), "HTML must render hazard strip");
    });
  });
});
