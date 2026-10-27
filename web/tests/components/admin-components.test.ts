import { test, describe } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { HeaderTitle } from "@/components/admin/HeaderTitle";
import {
  CoreStatusBox,
  getMemoryThreshold,
  IndicatorNormH,
  IndicatorHaz,
} from "@/app/admin/overview/components/CoreStatusBox";
import { ProfileDetails } from "@/app/admin/overview/components/ProfileDetails";
import { ProfileAvatarCard } from "@/app/admin/overview/components/ProfileAvatarCard";
import { ResumePreviewCard } from "@/app/admin/overview/components/ResumePreviewCard";
import { TopSkillsCard } from "@/app/admin/overview/components/TopSkillsCard";

// Mock next/navigation for tests
declare global {
  // eslint-disable-next-line no-var
  var __next_pathname: string | undefined;
}

describe("Admin Components & Overview Modules", () => {
  describe("AdminSidebar Component", () => {
    test("renders all required navigation tabs with correct links", () => {
      const html = renderToString(React.createElement(AdminSidebar));

      const requiredTabs = [
        { name: "Overview", href: "/admin/overview" },
        { name: "config", href: "/admin/config" },
        { name: "skills and achievements", href: "/admin/skills-achievements" },
        { name: "Certificates", href: "/admin/certificates" },
        { name: "experiences", href: "/admin/experiences" },
        { name: "projects", href: "/admin/projects" },
        { name: "logs", href: "/admin/logs" },
      ];

      for (const tab of requiredTabs) {
        assert.ok(
          html.includes(`href="${tab.href}"`),
          `Sidebar must contain link for ${tab.name} (${tab.href})`
        );
      }
    });

    test("renders Branding Header with ITZEUL.svg and Dashboard title strictly clean without glow or yellow accents", () => {
      const html = renderToString(React.createElement(AdminSidebar));

      assert.ok(html.includes("ITZEUL.svg"), "Must render ITZEUL.svg in header");
      assert.ok(html.includes("Dashboard"), "Must display Dashboard title");

      // Verify absence of glow and yellow accent classes in the branding header area
      assert.ok(
        !html.includes("cyber-glow-amber") && !html.includes("eva-glow-orange"),
        "Branding header must not use yellow/amber glow classes"
      );
      assert.ok(
        !html.includes("text-yellow") && !html.includes("border-yellow"),
        "Branding header must not contain yellow accents"
      );
    });

    test("renders Footer Motif with eva no back.png graphic and zero fabricated telemetry artifacts", () => {
      const html = renderToString(React.createElement(AdminSidebar));

      assert.ok(
        html.includes("eva no back.png") ||
          html.includes("eva%20no%20back.png") ||
          html.includes("EVA Unit-01 Motif"),
        "Footer must include eva no back.png graphic"
      );

      // Verify removal of AI-slop artifacts
      assert.ok(
        !html.includes("SYNC"),
        "Footer must not contain fabricated SYNC percentage text"
      );
      assert.ok(
        !html.includes("border-t-2 border-l-2"),
        "Footer must not contain fabricated corner bracket decorations"
      );
    });

    test("renders fixed height 100vh without adjusting to content", () => {
      const html = renderToString(React.createElement(AdminSidebar));

      assert.ok(
        html.includes("h-[100vh]") || html.includes("height:100vh") || html.includes("height: 100vh"),
        "Sidebar must have fixed 100vh height"
      );
      assert.ok(
        !html.includes("min-h-screen"),
        "Sidebar must not use min-h-screen which adjusts to content"
      );
    });
  });

  describe("HeaderTitle Component", () => {
    test("renders dynamic breadcrumbs in monospace Evangelion style", () => {
      const html = renderToString(
        React.createElement(HeaderTitle, {
          breadcrumbs: ["Dashboard", "Overview"],
        })
      );

      assert.ok(html.includes("font-mono"), "Breadcrumbs must use font-mono");
      assert.ok(html.includes("Dashboard"), "Must render Dashboard breadcrumb");
      assert.ok(html.includes("Overview"), "Must render Overview breadcrumb");
      assert.ok(html.includes("&gt;"), "Must render > separator between breadcrumbs");
    });

    test("renders subtitle and system telemetry badge", () => {
      const html = renderToString(
        React.createElement(HeaderTitle, {
          breadcrumbs: ["Dashboard", "Overview"],
          subtitle: "MAGI CONTROL DECK",
        })
      );

      assert.ok(html.includes("MAGI CONTROL DECK"), "Must display subtitle");
      assert.ok(html.includes("Cyberbee-pro"), "Must show pilot ID Cyberbee-pro");
      assert.ok(html.includes("ONLINE"), "Must display ONLINE status by default");
    });

    test("dynamically reflects offline status when system health is degraded", () => {
      const htmlOffline = renderToString(
        React.createElement(HeaderTitle, {
          breadcrumbs: ["Dashboard", "Overview"],
          initialHealth: {
            status: "offline",
            dbStatus: "disconnected",
            memoryUsageMB: 0,
            version: "1.0.0",
            env: "production",
          },
        })
      );

      assert.ok(htmlOffline.includes("OFFLINE"), "Must reflect OFFLINE state when health status is offline");
      assert.ok(htmlOffline.includes("text-eva-red"), "Must apply text-eva-red class when offline");
      assert.ok(htmlOffline.includes("bg-eva-red"), "Must apply red indicator badge when offline");
    });

    test("header has sticky top-0 and z-20 for fixed positioning above scrolling page content", () => {
      const html = renderToString(
        React.createElement(HeaderTitle, {
          breadcrumbs: ["Dashboard", "Certificates"],
        })
      );

      assert.ok(html.includes("sticky top-0"), "Header must have sticky top-0");
      assert.ok(html.includes("z-20"), "Header must have z-20 to layer above scrolling content");
    });
  });

  describe("CoreStatusBox & Status Indicators", () => {
    test("evaluates memory usage thresholds correctly (<= 30MB, 31-120MB, > 120MB)", () => {
      // <= 30 MB -> Green (--eva-lime)
      const optimal = getMemoryThreshold(25);
      assert.strictEqual(optimal.colorVar, "var(--eva-lime)");
      assert.strictEqual(optimal.label, "OPTIMAL");
      assert.ok(optimal.badgeClass.includes("text-eva-lime"));

      // > 30 MB and <= 120 MB -> Amber/Orange (--eva-orange)
      const moderate = getMemoryThreshold(75);
      assert.strictEqual(moderate.colorVar, "var(--eva-orange)");
      assert.strictEqual(moderate.label, "MODERATE");
      assert.ok(moderate.badgeClass.includes("text-eva-orange"));

      // > 120 MB -> Red (--eva-red)
      const high = getMemoryThreshold(150);
      assert.strictEqual(high.colorVar, "var(--eva-red)");
      assert.strictEqual(high.label, "HIGH");
      assert.ok(high.badgeClass.includes("text-eva-red"));
    });

    test("IndicatorNormH renders Green when connected and Red when disconnected", () => {
      const connectedHtml = renderToString(
        React.createElement(IndicatorNormH, { isConnected: true })
      );
      assert.ok(connectedHtml.includes("var(--eva-lime)"), "Connected must use --eva-lime");

      const disconnectedHtml = renderToString(
        React.createElement(IndicatorNormH, { isConnected: false })
      );
      assert.ok(disconnectedHtml.includes("var(--eva-red)"), "Disconnected must use --eva-red");
    });

    test("IndicatorHaz renders Green when healthy and Red when unhealthy", () => {
      const healthyHtml = renderToString(
        React.createElement(IndicatorHaz, { isHealthy: true })
      );
      assert.ok(healthyHtml.includes("var(--eva-lime)"), "Healthy must use --eva-lime");

      const unhealthyHtml = renderToString(
        React.createElement(IndicatorHaz, { isHealthy: false })
      );
      assert.ok(unhealthyHtml.includes("var(--eva-red)"), "Unhealthy must use --eva-red");
    });

    test("CoreStatusBox renders telemetry labels and circuit indicators with expanded viewBox", () => {
      const html = renderToString(
        React.createElement(CoreStatusBox, {
          initialHealth: {
            status: "healthy",
            dbStatus: "connected",
            memoryUsageMB: 28,
            version: "1.0.0",
            env: "production",
          },
        })
      );

      assert.ok(html.includes("online"), "Must show online label");
      assert.ok(html.includes("db"), "Must show db label");
      assert.ok(html.includes("mem"), "Must show mem label");
      assert.ok(html.includes("0 0 101 175"), "Must render expanded viewBox for zero bottom clipping");
      assert.ok(html.includes("overflow-visible"), "Must use overflow-visible for breathing room");
      assert.ok(html.includes("bg-transparent"), "Must have transparent background");
      assert.ok(html.includes("<polygon"), "Must render hexagon terminal caps for open circuit endpoints");
    });

    test("CoreStatusBox renders pending telemetry state with orange indicators when initialHealth is unprovided", () => {
      const html = renderToString(React.createElement(CoreStatusBox));

      assert.ok(html.includes("online"), "Must show online label");
      assert.ok(html.includes("db"), "Must show db label");
      assert.ok(html.includes("mem"), "Must show mem label");
      assert.ok(
        html.includes('transform="matrix(0.87462 -0.48481 0 1 7.5 65.206)" fill="var(--eva-orange)"'),
        "Online indicator must be orange in pending state"
      );
      assert.ok(
        html.includes('transform="matrix(0.866025 -0.5 0 1 7.5 87.2383)" fill="var(--eva-orange)"'),
        "DB indicator must be orange in pending state"
      );
    });
  });

  describe("ProfileDetails Component", () => {
    test("displays name, joined job titles, status message, and bio summary", () => {
      const html = renderToString(
        React.createElement(ProfileDetails, {
          initialConfig: {
            name: "Cyberbee Pilot",
            jobTitles: ["Systems Architect", "Lead Developer"],
            statusMessage: "Operational on Level 7",
            bioSummary: "Architecting decentralized portfolio engines.",
            resumeDriveUrl: "https://drive.google.com/file/d/test/view",
          },
        })
      );

      assert.ok(html.includes("Cyberbee Pilot"), "Must display pilot name");
      assert.ok(
        html.includes("Systems Architect / Lead Developer"),
        "Must display joined job titles"
      );
      assert.ok(html.includes("Operational on Level 7"), "Must display status message");
      assert.ok(
        html.includes("Architecting decentralized portfolio engines."),
        "Must display bio summary"
      );
    });
  });

  describe("ProfileAvatarCard Component", () => {
    test("frames active avatar inside pic_frame.svg container", () => {
      const html = renderToString(
        React.createElement(ProfileAvatarCard, {
          pfpUrl: "https://res.cloudinary.com/test/pfp.jpg",
          name: "Cyberbee",
        })
      );

      assert.ok(html.includes("pic_frame.svg"), "Must render pic_frame.svg frame");
      assert.ok(
        html.includes('src="https://res.cloudinary.com/test/pfp.jpg"'),
        "Must render profile picture image URL"
      );
      assert.strictEqual(
        html.includes("No pfp in db"),
        false,
        "Must not show 'No pfp in db' placeholder when valid pfpUrl exists"
      );
    });

    test("displays 'No pfp in db' with mono muted styling when pfpUrl is empty", () => {
      const html = renderToString(
        React.createElement(ProfileAvatarCard, {
          pfpUrl: "",
          name: "Cyberbee",
        })
      );

      assert.ok(html.includes("No pfp in db"), "Must display 'No pfp in db' text when pfpUrl is empty");
      assert.ok(html.includes("font-mono"), "Must style placeholder with font-mono");
      assert.ok(html.includes("text-eva-text-muted"), "Must style placeholder with muted text");
      assert.strictEqual(html.includes('alt="Cyberbee"'), false, "Must not render avatar img tag when pfpUrl is empty");
    });
  });

  describe("ResumePreviewCard Component", () => {
    test("renders download button with download_butt.svg pointing to resumeDriveUrl", () => {
      const driveUrl = "https://drive.google.com/file/d/resume_123/view";
      const html = renderToString(
        React.createElement(ResumePreviewCard, {
          resumeDriveUrl: driveUrl,
        })
      );

      assert.ok(html.includes("download_butt.svg"), "Must include download_butt.svg icon");
      assert.ok(html.includes(`href="${driveUrl}"`), "Button must link to resumeDriveUrl");
      assert.ok(html.includes('target="_blank"'), "Must open in new tab");
    });

    test("renders PdfViewer without editing options with compact height", () => {
      const driveUrl = "https://drive.google.com/file/d/resume_123/view";
      const html = renderToString(
        React.createElement(ResumePreviewCard, {
          resumeDriveUrl: driveUrl,
        })
      );

      assert.ok(html.includes('data-testid="pdf-viewer-container"'), "Must render PdfViewer container");
      assert.ok(html.includes("height:230px"), "Must have compact 230px height");
      assert.ok(!html.includes('aria-label="Upload Resume"'), "Must NOT include upload option");
      assert.ok(!html.includes("[EDIT URL]"), "Must NOT include editable URL option");
    });
  });

  describe("TopSkillsCard Component", () => {
    test("renders skills sorted by weight with weight level badge", () => {
      const mockSkills = [
        { _id: "s1", name: "CSS", weight: 40 },
        { _id: "s2", name: "TypeScript", weight: 99 },
        { _id: "s3", name: "React", weight: 88 },
      ];

      const html = renderToString(
        React.createElement(TopSkillsCard, {
          initialSkills: mockSkills,
        })
      );

      assert.ok(html.includes("TypeScript"), "Must render TypeScript");
      assert.ok(html.includes("React"), "Must render React");
      assert.ok(html.includes("CSS"), "Must render CSS");
      assert.ok(html.includes("99"), "Must render weight level 99");
      assert.ok(html.includes("88"), "Must render weight level 88");

      const tsIndex = html.indexOf("TypeScript");
      const reactIndex = html.indexOf("React");
      const cssIndex = html.indexOf("CSS");
      assert.ok(
        tsIndex < reactIndex && reactIndex < cssIndex,
        "Skills must be rendered in descending order by weight (TypeScript 99 > React 88 > CSS 40)"
      );
    });

    test("renders only top 6 skills by highest weight when more than 6 are provided", () => {
      const mockSkills = [
        { _id: "s1", name: "Skill 10", weight: 10 },
        { _id: "s2", name: "Skill 90", weight: 90 },
        { _id: "s3", name: "Skill 80", weight: 80 },
        { _id: "s4", name: "Skill 70", weight: 70 },
        { _id: "s5", name: "Skill 60", weight: 60 },
        { _id: "s6", name: "Skill 50", weight: 50 },
        { _id: "s7", name: "Skill 40", weight: 40 },
      ];

      const html = renderToString(
        React.createElement(TopSkillsCard, {
          initialSkills: mockSkills,
        })
      );

      assert.ok(html.includes("Skill 90"));
      assert.ok(html.includes("Skill 80"));
      assert.ok(html.includes("Skill 70"));
      assert.ok(html.includes("Skill 60"));
      assert.ok(html.includes("Skill 50"));
      assert.ok(html.includes("Skill 40"));
      assert.ok(!html.includes("Skill 10"), "Lowest weight skill (10) must be excluded from top 6");
    });
  });
});
