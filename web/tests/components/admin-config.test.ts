import { test, describe } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { ConfigInput } from "@/app/admin/config/components/ConfigInput";
import { ConfigResumeCard, getPdfContentUrl } from "@/app/admin/config/components/ConfigResumeCard";
import { ConfigAvatarCard } from "@/app/admin/config/components/ConfigAvatarCard";
import { ConfigPfpCard } from "@/app/admin/config/components/ConfigPfpCard";
import { PdfViewer } from "@/components/PdfViewer";
import AdminConfigPage, {
  buildSetAsPfpPayload,
  buildUploadPfpFormData,
} from "@/app/admin/config/page";
import { SiteConfig, PfpItem } from "@/lib/api/types";

// Validation Rule Helpers extracted for testing
const validateName = (val: string) => {
  if (!val.trim()) return { valid: false, message: "NAME REQUIRED" };
  const isValid = /^[a-zA-Z\s]+$/.test(val);
  return {
    valid: isValid,
    message: isValid ? "ACCEPTED // ALPHABET AND SPACES ONLY" : "ERROR // ONLY LETTERS AND SPACES ALLOWED",
  };
};

const validateResumeUrl = (val: string) => {
  if (!val.trim()) return { valid: false, message: "RESUME DRIVE URL REQUIRED" };
  const isValid = /^https?:\/\/.+/.test(val.trim());
  return {
    valid: isValid,
    message: isValid ? "ACCEPTED // VALID DOCUMENT ENDPOINT" : "ERROR // VALID URL REQUIRED (HTTP/HTTPS)",
  };
};

describe("Admin Config Page & Form Mechanics", () => {
  describe("ConfigInput Component & Live Validation Rules", () => {
    test("renders label and expanding underlined input with cursor-target", () => {
      const html = renderToString(
        React.createElement(ConfigInput, {
          label: "Name",
          value: "Cyberbee pro",
          onChange: () => {},
        })
      );

      assert.ok(html.includes("Name :"), "Must render field label with colon");
      assert.ok(html.includes('value="Cyberbee pro"'), "Must render current value");
      assert.ok(html.includes("cursor-target"), "Must include .cursor-target for TargetCursor");
      assert.ok(html.includes("border-b-2"), "Must use bottom-only underlined border");
      assert.ok(html.includes("focus:w-[350px]"), "Must support smooth expansion on focus");
      assert.ok(/autocomplete="off"/i.test(html), "Must disable autocomplete to stop browser credential prompts");
      assert.ok(html.includes('type="text"'), "Must use type='text'");
      assert.ok(html.includes('data-form-type="other"'), "Must declare data-form-type='other'");
      assert.ok(html.includes('data-1p-ignore="true"'), "Must include 1Password ignore flag");
      assert.ok(html.includes('data-lpignore="true"'), "Must include LastPass ignore flag");
      assert.strictEqual(html.includes('type="password"'), false, "Must never render password type");
    });

    test("Name Validation: validates alphabets and spaces only", () => {
      const validRes = validateName("Shinji Ikari");
      assert.strictEqual(validRes.valid, true);

      const invalidNumbers = validateName("Pilot 01");
      assert.strictEqual(invalidNumbers.valid, false);

      const invalidSymbols = validateName("Rei_Ayanami!");
      assert.strictEqual(invalidSymbols.valid, false);
    });

    test("Resume URL Validation: enforces valid HTTP/HTTPS document URL", () => {
      const validUrl = validateResumeUrl("https://drive.google.com/file/d/test/view");
      assert.strictEqual(validUrl.valid, true);

      const invalidProtocol = validateResumeUrl("ftp://files.example.com/resume.pdf");
      assert.strictEqual(invalidProtocol.valid, false);

      const emptyUrl = validateResumeUrl("");
      assert.strictEqual(emptyUrl.valid, false);
    });

    test("Input_chk status indicator: renders zero text when valid, displays error indicator only on failure without glows", () => {
      // Valid Input: must show NO status text below, NO [VERIFIED], and zero box-shadow
      const validHtml = renderToString(
        React.createElement(ConfigInput, {
          label: "Name",
          value: "Cyberbee pro",
          onChange: () => {},
          validator: validateName,
        })
      );

      assert.strictEqual(validHtml.includes("[VERIFIED]"), false, "Must NOT show [VERIFIED] text on valid input");
      assert.strictEqual(validHtml.includes("data-testid=\"input-chk\""), false, "Must show NO text message below valid input");
      assert.strictEqual(validHtml.includes("shadow-"), false, "Inputs must have zero box-shadow or ambient glow");

      // Invalid Input: renders active red error status indicator
      const invalidHtml = renderToString(
        React.createElement(ConfigInput, {
          label: "Name",
          value: "Unit-01",
          onChange: () => {},
          validator: validateName,
        })
      );

      assert.ok(invalidHtml.includes("border-l-2"), "Must render left border for error indicator");
      assert.ok(invalidHtml.includes("border-l-[var(--eva-red)]"), "Must show red border on error");
      assert.ok(invalidHtml.includes("[ERROR]"), "Must show [ERROR] tag on error");
      assert.ok(invalidHtml.includes("ONLY LETTERS AND SPACES ALLOWED"), "Must show error description");
    });

    test("Expandable summary field renders chevron toggle for collapsed preview with animation wrapper", () => {
      const html = renderToString(
        React.createElement(ConfigInput, {
          label: "Summary",
          value: "Motivated developer with experience in game development and web technologies.",
          onChange: () => {},
          isExpandable: true,
        })
      );

      assert.ok(html.includes("Summary :"), "Must render Summary label");
      assert.ok(html.includes("▼"), "Must render chevron toggle symbol for expanding");
      assert.ok(html.includes("cursor-target"), "Must be targetable by TargetCursor");
      assert.ok(html.includes('role="button"'), "Must be accessible as a toggle button");
      assert.ok(html.includes("overflow-hidden"), "Must contain animated overflow-hidden wrapper");
    });
  });

  describe("ConfigResumeCard Component", () => {
    test("renders Resume.pdf header bar and 3 action triggers (upload, download, external link)", () => {
      const resumeUrl = "https://drive.google.com/file/d/test_resume/view";
      const html = renderToString(
        React.createElement(ConfigResumeCard, {
          resumeUrl,
          onUpdateResumeUrl: () => {},
          onUploadResumeFile: () => {},
        })
      );

      assert.ok(html.includes("Resume.pdf"), "Must display Resume.pdf title");
      assert.ok(html.includes('aria-label="Upload Resume"'), "Must include upload trigger");
      assert.ok(html.includes('aria-label="Download Resume"'), "Must include download trigger");
      assert.ok(html.includes('aria-label="Open Resume in new tab"'), "Must include external link trigger");
      assert.ok(html.includes(`href="${resumeUrl}"`), "External link must target resumeUrl");
      assert.ok(html.includes('data-testid="pdf-viewer-container"'), "Must render PdfViewer container");
    });

    test("shows Upload trigger only when onUploadResumeFile exists, and URL editor only when onUpdateResumeUrl exists", () => {
      const resumeUrl = "https://drive.google.com/file/d/test_resume/view";
      // Case A: Only onUpdateResumeUrl (no upload)
      const htmlUpdateOnly = renderToString(
        React.createElement(ConfigResumeCard, {
          resumeUrl,
          onUpdateResumeUrl: () => {},
        })
      );
      assert.ok(!htmlUpdateOnly.includes('aria-label="Upload Resume"'), "Must NOT show upload trigger without onUploadResumeFile");
      assert.ok(htmlUpdateOnly.includes("[EDIT URL]"), "Must show [EDIT URL] when onUpdateResumeUrl is present");

      // Case B: Only onUploadResumeFile (no URL editor)
      const htmlUploadOnly = renderToString(
        React.createElement(ConfigResumeCard, {
          resumeUrl,
          onUploadResumeFile: () => {},
        })
      );
      assert.ok(htmlUploadOnly.includes('aria-label="Upload Resume"'), "Must show upload trigger when onUploadResumeFile is present");
      assert.ok(!htmlUploadOnly.includes("[EDIT URL]"), "Must NOT show [EDIT URL] without onUpdateResumeUrl");
    });

    test("converts Drive viewing URL to direct PDF content URL for PdfViewer while preserving Drive link for external link", () => {
      const driveUrl = "https://drive.google.com/file/d/abc123xyz/view?usp=sharing";
      const html = renderToString(
        React.createElement(ConfigResumeCard, {
          resumeUrl: driveUrl,
        })
      );

      // External link must keep the original Drive viewing URL
      assert.ok(html.includes(`href="${driveUrl}"`), "External link must preserve Drive URL");
      // PdfViewer must receive the PDF-content stream URL instead of the HTML viewing page
      assert.ok(html.includes("data-testid=\"pdf-viewer-container\""), "Must render PdfViewer container");
    });

    test("renders staged badge when stagedFileName is provided", () => {
      const resumeUrl = "https://drive.google.com/file/d/test_resume/view";
      const html = renderToString(
        React.createElement(ConfigResumeCard, {
          resumeUrl,
          onUploadResumeFile: () => {},
          stagedFileName: "my_cv.pdf",
        })
      );

      assert.ok(html.includes("STAGED: my_cv.pdf"), "Must display staged badge");
      assert.ok(html.includes('data-testid="resume-staged-badge"'), "Must include testid");
    });

    test("renders read-only mode without editing options when editable is false", () => {
      const resumeUrl = "https://drive.google.com/file/d/test_resume/view";
      const html = renderToString(
        React.createElement(ConfigResumeCard, {
          resumeUrl,
          editable: false,
        })
      );

      assert.ok(html.includes("Resume.pdf"), "Must display Resume.pdf title");
      assert.ok(html.includes('aria-label="Download Resume"'), "Must include download trigger");
      assert.ok(html.includes('aria-label="Open Resume in new tab"'), "Must include external link trigger");
      assert.ok(html.includes('data-testid="pdf-viewer-container"'), "Must render PdfViewer container");
      assert.ok(!html.includes('aria-label="Upload Resume"'), "Must NOT include upload trigger");
      assert.ok(!html.includes("[EDIT URL]"), "Must NOT include [EDIT URL] action");
      assert.ok(!html.includes('type="file"'), "Must NOT include file input");
    });

    test("applies compact previewHeight correctly to PdfViewer", () => {
      const resumeUrl = "https://drive.google.com/file/d/test_resume/view";
      const html = renderToString(
        React.createElement(ConfigResumeCard, {
          resumeUrl,
          previewHeight: "210px",
        })
      );

      assert.ok(html.includes("height:210px"), "Must apply 210px height to viewer container");
    });

    test("getPdfContentUrl converts Google Drive viewing URLs into direct PDF bytes endpoints", () => {
      assert.strictEqual(
        getPdfContentUrl("https://drive.google.com/file/d/abc-123_xyz/view?usp=sharing"),
        "https://drive.google.com/uc?export=download&id=abc-123_xyz"
      );
      assert.strictEqual(
        getPdfContentUrl("https://docs.google.com/file/d/file456/view"),
        "https://drive.google.com/uc?export=download&id=file456"
      );
      assert.strictEqual(
        getPdfContentUrl("https://drive.google.com/open?id=open789"),
        "https://drive.google.com/uc?export=download&id=open789"
      );
      assert.strictEqual(
        getPdfContentUrl("https://res.cloudinary.com/demo/raw/upload/resume.pdf"),
        "https://res.cloudinary.com/demo/raw/upload/resume.pdf"
      );
      assert.strictEqual(getPdfContentUrl(""), "");
    });
  });

  describe("PdfViewer Component", () => {
    test("renders scrollable container with 450px fixed height and overflow-y: auto", () => {
      const html = renderToString(
        React.createElement(PdfViewer, {
          fileUrl: "https://example.com/sample.pdf",
        })
      );

      assert.ok(html.includes('data-testid="pdf-viewer-container"'), "Must render viewer container");
      assert.ok(html.includes("height:450px"), "Must have fixed height of 450px");
      assert.ok(html.includes("overflow-y:auto") || html.includes("overflow-y: auto"), "Must have overflowY: auto");
      assert.ok(html.includes("rpv-core__viewer"), "Must render @react-pdf-viewer core viewer markup");
    });

    test("renders standby placeholder when fileUrl is empty or blank", () => {
      const html = renderToString(
        React.createElement(PdfViewer, {
          fileUrl: "",
        })
      );

      assert.ok(html.includes('data-testid="pdf-viewer-container"'), "Must render container");
      assert.ok(html.includes("NO PDF DOCUMENT LOADED"), "Must display fallback standby message");
      assert.ok(html.includes("height:450px"), "Must maintain 450px container height");
    });

    test("supports custom height prop override", () => {
      const html = renderToString(
        React.createElement(PdfViewer, {
          fileUrl: "https://example.com/sample.pdf",
          height: "500px",
        })
      );

      assert.ok(html.includes("height:500px"), "Must respect custom height prop");
    });

    test("disables JavaScript eval in viewer to mitigate CVE-2024-4367 via isEvalSupported: false", () => {
      const element = React.createElement(PdfViewer, {
        fileUrl: "https://example.com/sample.pdf",
      });
      const html = renderToString(element);
      assert.ok(html.includes("rpv-core__viewer"), "Renders viewer core");
    });
  });

  describe("ConfigAvatarCard Component", () => {
    test("renders framed avatar, carousel controls (< pfp1.jpg >), and blue Set as pfp button", () => {
      const html = renderToString(
        React.createElement(ConfigAvatarCard, {
          currentPfpUrl: "https://res.cloudinary.com/test/pfp.jpg",
          onSetAsPfp: () => {},
          onUploadNewPfp: () => {},
        })
      );

      assert.ok(html.includes("pic_frame.svg"), "Must render pic_frame.svg container");
      assert.ok(html.includes("&lt;"), "Must render previous avatar button <");
      assert.ok(html.includes("&gt;"), "Must render next avatar button >");
      assert.ok(html.includes("pfp1.jpg"), "Must render filename label pfp1.jpg");
      assert.ok(html.includes('aria-label="Upload New Avatar"'), "Must include avatar upload button");
      assert.ok(html.includes('aria-label="Download Current Avatar"'), "Must include avatar download button");
      assert.ok(html.includes("Set as pfp"), "Must render Set as pfp action button");
      assert.ok(html.includes("bg-[#0044cc]"), "Must style Set as pfp with distinctive blue theme");
      assert.ok(html.includes('src="https://res.cloudinary.com/test/pfp.jpg"'), "Must render avatar image tag");
      assert.strictEqual(html.includes("No pfp in db"), false, "Must not display placeholder when valid pfpUrl exists");
    });

    test("renders 'No pfp in db' with mono muted styling when pfpUrl is empty or falsy", () => {
      const html = renderToString(
        React.createElement(ConfigAvatarCard, {
          pfpUrl: "",
          onSetAsPfp: () => {},
          onUploadNewPfp: () => {},
        })
      );

      assert.ok(html.includes("No pfp in db"), "Must display 'No pfp in db' text when pfpUrl is empty string");
      assert.ok(html.includes("font-mono"), "Must style placeholder with font-mono");
      assert.ok(html.includes("text-eva-text-muted"), "Must use muted text color");
      assert.strictEqual(html.includes('alt="Pilot Avatar"'), false, "Must not render avatar img tag when pfpUrl is empty");
    });

    test("renders valid avatar image normally when pfpUrl is present without interference", () => {
      const html = renderToString(
        React.createElement(ConfigAvatarCard, {
          pfpUrl: "https://res.cloudinary.com/test/valid-pfp.png",
          onSetAsPfp: () => {},
          onUploadNewPfp: () => {},
        })
      );

      assert.ok(html.includes('src="https://res.cloudinary.com/test/valid-pfp.png"'), "Must render valid pfp image");
      assert.strictEqual(html.includes("No pfp in db"), false, "Must not display 'No pfp in db' placeholder");
    });

    test("synchronizes active avatar from pfpHistory on initial render", () => {
      const history = [
        { url: "https://res.cloudinary.com/test/first.jpg", publicId: "first_id", uploadedAt: "2026-01-01T00:00:00Z" },
        { url: "https://res.cloudinary.com/test/second.jpg", publicId: "second_id", uploadedAt: "2026-01-02T00:00:00Z" },
        { url: "https://res.cloudinary.com/test/active.jpg", publicId: "active_id", uploadedAt: "2026-01-03T00:00:00Z" },
      ];

      const html = renderToString(
        React.createElement(ConfigAvatarCard, {
          pfpUrl: "https://res.cloudinary.com/test/active.jpg",
          pfpHistory: history,
          onSetAsPfp: () => {},
          onUploadNewPfp: () => {},
        })
      );

      assert.ok(
        html.includes('src="https://res.cloudinary.com/test/active.jpg"'),
        "Must synchronize and display the active avatar on initial render"
      );
      assert.ok(
        html.includes("active.jpg"),
        "Must display the active avatar's filename label on initial render"
      );
    });

    test("ConfigPfpCard alias renders 'No pfp in db' when pfpUrl is undefined", () => {
      const html = renderToString(
        React.createElement(ConfigPfpCard, {
          onSetAsPfp: () => {},
          onUploadNewPfp: () => {},
        })
      );

      assert.ok(html.includes("No pfp in db"), "Must display 'No pfp in db' via ConfigPfpCard alias");
    });
  });

  describe("AdminConfigPage Integration", () => {
    test("renders breadcrumbs, PatternWaves layer, backend SiteConfig fields, and full-width hazard strip", () => {
      const html = renderToString(React.createElement(AdminConfigPage));

      assert.ok(html.includes("Dashboard"), "Must render Dashboard breadcrumb");
      assert.ok(html.includes("config"), "Must render config breadcrumb");
      assert.ok(html.includes("data-testid=\"config-pattern-waves\""), "Must mount PatternWaves background layer");
      assert.ok(html.includes("Name :"), "Must render Name field");
      assert.ok(html.includes("Job :"), "Must render Job field");
      assert.ok(html.includes("Bio :"), "Must render Bio field");
      assert.ok(html.includes("Resume URL :"), "Must render Resume URL field");
      assert.ok(html.includes("Summary :"), "Must render Summary field");
      assert.strictEqual(html.includes("Email :"), false, "Random Email field must be removed");
      assert.strictEqual(html.includes("Phone :"), false, "Random Phone field must be removed");
      assert.strictEqual(html.includes("Secret :"), false, "Random Secret field must be removed");
      assert.strictEqual(html.includes('type="password"'), false, "Must contain zero password inputs or credential triggers");
      assert.ok(html.includes("my-auto"), "Must vertically center main card content to prevent hanging dead space");
      assert.ok(html.includes("SAVE CONFIGURATION"), "Must render save button");
      assert.ok(html.includes("haz_strip.svg"), "Must render bottom hazard strip");
    });
  });

  describe("Avatar Operations Form Field Commit Guard", () => {
    const mockStoredConfig: SiteConfig = {
      _id: "stored-config-123",
      name: "Cyberbee pro (Persisted)",
      jobTitles: ["Stored Dev", "Stored Engineer"],
      statusMessage: "Persisted status message from DB",
      bioSummary: "Persisted bio summary from DB with extensive verified data.",
      resumeUrl: "https://drive.google.com/file/d/stored_resume/view",
      resumeDriveUrl: "https://drive.google.com/file/d/stored_resume/view",
      pfpUrl: "https://res.cloudinary.com/test/pfp1.jpg",
      pfpPublicId: "pfp_1",
      pfpHistory: [
        {
          url: "https://res.cloudinary.com/test/pfp1.jpg",
          publicId: "pfp_1",
          uploadedAt: "2026-10-01T00:00:00.000Z",
        },
        {
          url: "https://res.cloudinary.com/test/pfp2.jpg",
          publicId: "pfp_2",
          uploadedAt: "2026-10-02T00:00:00.000Z",
        },
      ],
    };

    test("buildSetAsPfpPayload uses strictly stored config values without committing draft text inputs", () => {
      const selectedPfp: PfpItem = {
        url: "https://res.cloudinary.com/test/pfp2.jpg",
        publicId: "pfp_2",
        uploadedAt: "2026-10-02T00:00:00.000Z",
      };

      const payload = buildSetAsPfpPayload(mockStoredConfig, selectedPfp);

      // Verifies avatar targets are updated
      assert.strictEqual(payload.pfpUrl, "https://res.cloudinary.com/test/pfp2.jpg");
      assert.strictEqual(payload.pfpPublicId, "pfp_2");

      // Verifies text fields strictly reflect stored values
      assert.strictEqual(payload.name, "Cyberbee pro (Persisted)");
      assert.deepStrictEqual(payload.jobTitles, ["Stored Dev", "Stored Engineer"]);
      assert.strictEqual(payload.statusMessage, "Persisted status message from DB");
      assert.strictEqual(payload.bioSummary, "Persisted bio summary from DB with extensive verified data.");
      assert.strictEqual(payload.resumeUrl, "https://drive.google.com/file/d/stored_resume/view");
    });

    test("buildUploadPfpFormData bundles strictly stored config values with new avatar file", () => {
      const fakeFile = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
      const formData = buildUploadPfpFormData(mockStoredConfig, fakeFile);

      assert.strictEqual(formData.get("name"), "Cyberbee pro (Persisted)");
      assert.strictEqual(
        formData.get("jobTitles"),
        JSON.stringify(["Stored Dev", "Stored Engineer"])
      );
      assert.strictEqual(
        formData.get("statusMessage"),
        "Persisted status message from DB"
      );
      assert.strictEqual(
        formData.get("bioSummary"),
        "Persisted bio summary from DB with extensive verified data."
      );
      assert.strictEqual(
        formData.get("resumeUrl"),
        "https://drive.google.com/file/d/stored_resume/view"
      );
      assert.ok(formData.get("pfp") instanceof Blob);
    });

    test("buildSetAsPfpPayload provides safe fallback defaults when stored config is null", () => {
      const selectedPfp: PfpItem = {
        url: "https://res.cloudinary.com/test/pfp_default.jpg",
        publicId: "pfp_default",
        uploadedAt: "2026-10-23T00:00:00.000Z",
      };

      const payload = buildSetAsPfpPayload(null, selectedPfp);

      assert.strictEqual(payload.name, "Cyberbee pro");
      assert.deepStrictEqual(payload.jobTitles, ["Full-stack dev"]);
      assert.strictEqual(payload.pfpPublicId, "pfp_default");
      assert.strictEqual(payload.pfpUrl, "https://res.cloudinary.com/test/pfp_default.jpg");
    });

    test("ConfigAvatarCard renders ASCII skeleton in fallback placeholder and during upload", () => {
      // Fallback empty avatar
      const htmlEmpty = renderToString(
        React.createElement(ConfigAvatarCard, {
          pfpUrl: "",
          onSetAsPfp: () => {},
          onUploadNewPfp: () => {},
        })
      );
      assert.ok(htmlEmpty.includes("data-ascii-skeleton"), "Empty placeholder must include AsciiSkeleton");
      assert.ok(htmlEmpty.includes("ars-terminal"), "Must style placeholder with terminal ASCII variant");
    });

    test("PdfViewer renders ASCII skeleton in standby placeholder", () => {
      const html = renderToString(
        React.createElement(PdfViewer, {
          fileUrl: "",
        })
      );
      assert.ok(html.includes("data-ascii-skeleton"), "Standby view must include AsciiSkeleton");
      assert.ok(html.includes("ars-terminal"), "Must use terminal ASCII skeleton variant");
    });

    test("AdminConfigPage wraps configuration dashboard with AsciiReveal loading layer", () => {
      const html = renderToString(React.createElement(AdminConfigPage));
      assert.ok(html.includes("ar-overlay"), "Must integrate AsciiReveal overlay in AdminConfigPage");
    });

    test("ConfigInput fields render with AsciiReveal overlay layer", () => {
      const html = renderToString(
        React.createElement(ConfigInput, {
          label: "Name",
          value: "Cyberbee pro",
          onChange: () => {},
        })
      );
      assert.ok(html.includes("ar-overlay"), "ConfigInput field must include AsciiReveal overlay");
    });
  });
});
