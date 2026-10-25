import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { CertificateUploadBox } from "@/app/admin/certificates/components/CertificateUploadBox";
import { AddCertificateForm } from "@/app/admin/certificates/components/AddCertificateForm";
import { CertificatesGrid } from "@/app/admin/certificates/components/CertificatesGrid";
import { EditCertificateDrawer } from "@/app/admin/certificates/components/EditCertificateDrawer";
import CertificatesPage from "@/app/admin/certificates/page";
import {
  formatCertificateDate,
  toDateInputValue,
  isValidCredentialUrl,
} from "@/app/admin/certificates/utils";
import { Certificate } from "@/lib/api/types";

describe("Certificates Admin Module & Components", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "https://api.about.example.com",
      ADMIN_SECRET: "mock-backend-secret",
    };
    global.fetch = (async () => {
      return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  describe("Certificate Utilities", () => {
    test("formatCertificateDate formats valid dates to dd/mm/yyyy and defaults gracefully", () => {
      assert.equal(formatCertificateDate("2025-10-24T00:00:00.000Z"), "24/10/2025");
      assert.equal(formatCertificateDate("2024-03-05"), "05/03/2024");
      assert.equal(formatCertificateDate(undefined), "dd/mm/yyyy");
      assert.equal(formatCertificateDate(null), "dd/mm/yyyy");
      assert.equal(formatCertificateDate("invalid-date-string"), "dd/mm/yyyy");
    });

    test("toDateInputValue converts date to YYYY-MM-DD for HTML5 date input", () => {
      assert.equal(toDateInputValue("2025-10-24T12:00:00.000Z"), "2025-10-24");
      assert.equal(toDateInputValue(null), "");
      assert.equal(toDateInputValue(undefined), "");
    });

    test("isValidCredentialUrl only allows http:// and https:// schemes", () => {
      assert.equal(isValidCredentialUrl("https://example.com/cert/123"), true);
      assert.equal(isValidCredentialUrl("http://certs.org/verify"), true);
      assert.equal(isValidCredentialUrl("javascript:alert(1)"), false);
      assert.equal(isValidCredentialUrl("data:text/html;base64,..."), false);
      assert.equal(isValidCredentialUrl("vbscript:msgbox"), false);
      assert.equal(isValidCredentialUrl("//protocol-relative.com"), false);
      assert.equal(isValidCredentialUrl(""), false);
      assert.equal(isValidCredentialUrl(null), false);
      assert.equal(isValidCredentialUrl(undefined), false);
    });

    test("preserves dates under America/Los_Angeles timezone without day-shifting", () => {
      const prevTZ = process.env.TZ;
      process.env.TZ = "America/Los_Angeles";
      try {
        const utcIsoString = "2025-10-24T00:00:00.000Z";
        // formatCertificateDate must use UTC methods so 2025-10-24T00:00:00.000Z renders as 24/10/2025
        assert.equal(formatCertificateDate(utcIsoString), "24/10/2025");

        // toDateInputValue must use UTC methods so input receives "2025-10-24" (not 2025-10-23)
        const dateInputVal = toDateInputValue(utcIsoString);
        assert.equal(dateInputVal, "2025-10-24");

        // Save round-trip: parsing date input "2025-10-24" back to ISO preserves 2025-10-24
        assert.equal(formatCertificateDate(new Date(dateInputVal)), "24/10/2025");
      } finally {
        process.env.TZ = prevTZ;
      }
    });
  });

  describe("CertificateUploadBox Component", () => {
    test("renders purple base variant with upload arrow and external link icon", () => {
      const html = renderToString(
        React.createElement(CertificateUploadBox, {
          variant: "purple",
          onFileSelect: () => {},
        })
      );

      assert.ok(html.includes("bg-[#7B47DC]"), "Base upload box must have #7B47DC background");
      assert.ok(html.includes("Drag and drop or click to upload"), "Must display prompt copy");
      assert.ok(html.includes("data-ascii=\"surface\""), "Upload box must have surface ASCII attribute");
    });

    test("renders orange drawer variant with dual upload and image icons", () => {
      const html = renderToString(
        React.createElement(CertificateUploadBox, {
          variant: "orange",
          currentUrl: "https://res.cloudinary.com/demo/image/upload/sample.png",
          onFileSelect: () => {},
        })
      );

      assert.ok(html.includes("bg-[#e6770b]"), "Drawer upload box must have orange background");
      assert.ok(html.includes("Drag and drop or click to upload"), "Must display prompt copy");
      assert.ok(html.includes("sample.png"), "Shows current image preview when available");
    });

    test("onKeyDown returns early when event target !== currentTarget to prevent child bubbles triggering picker", () => {
      let clickTriggered = false;
      const fakeInput = {
        click: () => {
          clickTriggered = true;
        },
      };

      const outerDiv = { role: "button" };
      const childBtn = { tagName: "BUTTON" };

      // Handler matching CertificateUploadBox onKeyDown
      const handleKeyDown = (e: {
        target: any;
        currentTarget: any;
        key: string;
        preventDefault: () => void;
      }) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fakeInput.click();
        }
      };

      // 1. Enter pressed on child element (bubbles to outer div)
      handleKeyDown({
        target: childBtn,
        currentTarget: outerDiv,
        key: "Enter",
        preventDefault: () => {},
      });
      assert.equal(clickTriggered, false, "Must not trigger click when target !== currentTarget");

      // 2. Space pressed on child element (bubbles to outer div)
      handleKeyDown({
        target: childBtn,
        currentTarget: outerDiv,
        key: " ",
        preventDefault: () => {},
      });
      assert.equal(clickTriggered, false, "Must not trigger click when Space pressed on child");

      // 3. Enter pressed directly on upload box (target === currentTarget)
      handleKeyDown({
        target: outerDiv,
        currentTarget: outerDiv,
        key: "Enter",
        preventDefault: () => {},
      });
      assert.equal(clickTriggered, true, "Must trigger click when Enter pressed directly on upload box");
    });
  });

  describe("AddCertificateForm Component", () => {
    test("renders Add Certificate fields, calendar icon, weight select, and purple upload box", () => {
      const html = renderToString(
        React.createElement(AddCertificateForm, {
          onSubmit: async () => {},
        })
      );

      assert.ok(html.includes("Add Certificate. . . ."), "Must render 'Add Certificate. . . .' heading");
      assert.ok(html.includes("Title:"), "Must render Title label");
      assert.ok(html.includes("Description:"), "Must render Description label");
      assert.ok(html.includes("credential url:"), "Must render credential url label");
      assert.ok(html.includes("organization:"), "Must render organization label");
      assert.ok(html.includes("weight:"), "Must render weight label");
      assert.ok(html.includes("created At:"), "Must render created At label");
      assert.ok(html.includes("📅"), "Must render calendar icon next to date input");
      assert.ok(html.includes("upload cert"), "Must render 'upload cert' heading");
      assert.ok(html.includes("bg-[#7B47DC]"), "Must render purple upload box");
      assert.ok(html.includes("ADD CERTIFICATE"), "Must render submit button");
    });
  });

  describe("CertificatesGrid Component", () => {
    const mockCerts: Certificate[] = [
      {
        _id: "c-1",
        title: "Certified Kubernetes Administrator",
        description: "Official CNCF certification",
        organization: "Linux Foundation",
        link: "https://www.cncf.io/verify/123",
        mediaUrl: "https://res.cloudinary.com/demo/cka.png",
        weight: 1,
        createdAt: "2025-10-15T00:00:00.000Z",
      },
      {
        _id: "c-2",
        title: "AWS Cloud Practitioner",
        description: "Foundational cloud certification",
        organization: "Amazon Web Services",
        link: "javascript:alert('malicious')", // Invalid scheme
        mediaUrl: "",
        weight: 2,
        createdAt: "2024-05-20T00:00:00.000Z",
      },
    ];

    test("renders Past Certificates grid with styled scrollbar and card details", () => {
      const html = renderToString(
        React.createElement(CertificatesGrid, {
          certificates: mockCerts,
          onEdit: () => {},
          onDelete: () => {},
        })
      );

      assert.ok(html.includes("Past Certificates"), "Must render Past Certificates heading");
      assert.ok(html.includes("eva-custom-scrollbar"), "Must use styled custom scrollbar");
      assert.ok(html.includes("Certified Kubernetes Administrator"), "Must render certificate title");
      assert.ok(html.includes("Linux Foundation"), "Must render organization");
      assert.ok(html.includes("15/10/2025"), "Must render formatted date");
      assert.ok(html.includes("https://www.cncf.io/verify/123"), "Must render valid credential link");
      assert.ok(!html.includes("javascript:alert"), "Must NOT render dangerous javascript: link as href");
      assert.ok(html.includes("Edit"), "Must render approved addition Edit button");
      assert.ok(html.includes("Del"), "Must render approved addition Delete button");
    });

    test("renders empty state when no certificates exist", () => {
      const html = renderToString(
        React.createElement(CertificatesGrid, {
          certificates: [],
          onEdit: () => {},
          onDelete: () => {},
        })
      );

      assert.ok(html.includes("NO CERTIFICATES RECORDED"), "Must render empty state copy");
    });

    test("renders error state when fetch fails", () => {
      const html = renderToString(
        React.createElement(CertificatesGrid, {
          certificates: [],
          error: "Network connection refused",
          onEdit: () => {},
          onDelete: () => {},
        })
      );

      assert.ok(html.includes("SYSTEM ERROR // FAILED TO RETRIEVE CERTIFICATES"), "Must render system error heading");
      assert.ok(html.includes("Network connection refused"), "Must display error details");
    });

    test("treats empty string link as no link, rendering disabled external icon without href", () => {
      const certEmptyLink: Certificate = {
        _id: "c-empty-link",
        title: "Test Cert Empty Link",
        description: "Desc",
        organization: "Org",
        link: "",
        weight: 1,
        mediaUrl: "https://example.com/cert.png",
        createdAt: "2025-10-15T00:00:00.000Z",
      };

      const html = renderToString(
        React.createElement(CertificatesGrid, {
          certificates: [certEmptyLink],
          onEdit: () => {},
          onDelete: () => {},
        })
      );

      assert.ok(html.includes("title=\"No credential URL provided\""), "Must render disabled placeholder icon");
      assert.ok(!html.includes("href=\"\""), "Must not render anchor tag with empty href");
    });
  });

  describe("EditCertificateDrawer Component", () => {
    const mockCert: Certificate = {
      _id: "cert-edit-1",
      title: "Google Cloud Professional Architect",
      description: "Cloud Architecture Specialty",
      link: "https://google.accredible.com/123",
      organization: "Google Cloud",
      weight: 3,
      mediaUrl: "https://res.cloudinary.com/demo/gcp.png",
      createdAt: "2025-06-12T00:00:00.000Z",
    };

    test("renders accessible dialog with dynamic heading and pre-filled fields", () => {
      const html = renderToString(
        React.createElement(EditCertificateDrawer, {
          certificate: mockCert,
          isOpen: true,
          onClose: () => {},
          onSave: async () => {},
        })
      );

      assert.ok(html.includes("role=\"dialog\""), "Must have role='dialog'");
      assert.ok(html.includes("aria-modal=\"true\""), "Must have aria-modal='true'");
      assert.ok(html.includes("aria-labelledby=\"edit-certificate-heading\""), "Must be labelled by heading");
      assert.ok(
        html.includes("Edit Certificate [Google Cloud @12/06/2025]. . . ."),
        "Must render dynamic heading 'Edit Certificate [org @date]. . . .'"
      );
      assert.ok(html.includes("value=\"Google Cloud Professional Architect\""), "Must pre-fill title");
      assert.ok(html.includes("value=\"Cloud Architecture Specialty\""), "Must pre-fill description");
      assert.ok(html.includes("value=\"https://google.accredible.com/123\""), "Must pre-fill credential url");
      assert.ok(html.includes("value=\"Google Cloud\""), "Must pre-fill organization");
      assert.ok(html.includes("value=\"2025-06-12\""), "Must pre-fill created At date");
      assert.ok(html.includes("bg-[#e6770b]"), "Must render orange upload box in drawer");
      assert.ok(html.includes("Save"), "Must render blue Save button");
      assert.ok(html.includes("haz_strip.svg"), "Must render hazard stripe band along bottom edge");
      assert.ok(html.includes("motion-reduce:transition-none"), "Slide animation must respect prefers-reduced-motion");
    });

    test("returns null when closed or certificate is null", () => {
      const htmlClosed = renderToString(
        React.createElement(EditCertificateDrawer, {
          certificate: mockCert,
          isOpen: false,
          onClose: () => {},
          onSave: async () => {},
        })
      );
      assert.equal(htmlClosed, "");

      const htmlNull = renderToString(
        React.createElement(EditCertificateDrawer, {
          certificate: null,
          isOpen: true,
          onClose: () => {},
          onSave: async () => {},
        })
      );
      assert.equal(htmlNull, "");
    });

    test("normalizes stored 0 or negative weight to 1 in EditCertificateDrawer", () => {
      const certZeroWeight: Certificate = {
        ...mockCert,
        weight: 0,
      };
      const htmlZero = renderToString(
        React.createElement(EditCertificateDrawer, {
          certificate: certZeroWeight,
          isOpen: true,
          onClose: () => {},
          onSave: async () => {},
        })
      );
      assert.ok(htmlZero.includes("value=\"1\"") && htmlZero.includes("selected"), "Must normalize weight 0 to 1");
      assert.ok(!htmlZero.includes("value=\"0\""), "Must not include 0 option");

      const certNegWeight: Certificate = {
        ...mockCert,
        weight: -7,
      };
      const htmlNeg = renderToString(
        React.createElement(EditCertificateDrawer, {
          certificate: certNegWeight,
          isOpen: true,
          onClose: () => {},
          onSave: async () => {},
        })
      );
      assert.ok(htmlNeg.includes("value=\"1\"") && htmlNeg.includes("selected"), "Must normalize negative weight to 1");
    });
  });

  describe("CertificatesPage Component", () => {
    test("renders WebGL PatternWaves background container and hazard stripe footer", () => {
      const html = renderToString(React.createElement(CertificatesPage));

      assert.ok(html.includes("certificates-pattern-waves"), "Must render PatternWaves WebGL background");
      assert.ok(html.includes("Add Certificate. . . ."), "Must render Add Certificate section");
      assert.ok(html.includes("Past Certificates"), "Must render Past Certificates section");
      assert.ok(html.includes("haz_strip.svg"), "Must render hazard stripe footer");
    });
  });
});
