import { test, describe } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { ConfigInput } from "@/app/admin/config/components/ConfigInput";
import { ConfigResumeCard } from "@/app/admin/config/components/ConfigResumeCard";
import { ConfigAvatarCard } from "@/app/admin/config/components/ConfigAvatarCard";
import AdminConfigPage from "@/app/admin/config/page";

// Validation Rule Helpers extracted for testing
const validateName = (val: string) => {
  if (!val.trim()) return { valid: false, message: "NAME REQUIRED" };
  const isValid = /^[a-zA-Z\s]+$/.test(val);
  return {
    valid: isValid,
    message: isValid ? "ACCEPTED // ALPHABET AND SPACES ONLY" : "ERROR // ONLY LETTERS AND SPACES ALLOWED",
  };
};

const validateEmail = (val: string) => {
  if (!val.trim()) return { valid: false, message: "EMAIL REQUIRED" };
  const atCount = (val.match(/@/g) || []).length;
  const dotCount = (val.match(/\./g) || []).length;
  const standardRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = atCount === 1 && dotCount >= 1 && standardRegex.test(val);
  return {
    valid: isValid,
    message: isValid ? "ACCEPTED // COMMS FREQUENCY VERIFIED" : "ERROR // INVALID FORMAT (CHECK '@' AND '.' COUNTS)",
  };
};

const validatePhone = (val: string) => {
  if (!val.trim()) return { valid: false, message: "PHONE REQUIRED" };
  const isValid = /^\d{10}$/.test(val.trim());
  return {
    valid: isValid,
    message: isValid ? "ACCEPTED // DIRECT LINE SECURED (10-DIGIT)" : "ERROR // EXACTLY 10 NUMERIC DIGITS REQUIRED",
  };
};

const validateSecret = (val: string) => {
  if (!val) return { valid: false, message: "SECRET REQUIRED" };
  const lenOk = val.length > 8;
  const numCount = (val.match(/\d/g) || []).length;
  const alphaCount = (val.match(/[a-zA-Z]/g) || []).length;
  const lowerCount = (val.match(/[a-z]/g) || []).length;
  const upperCount = (val.match(/[A-Z]/g) || []).length;
  const specialCount = (val.match(/[^a-zA-Z0-9]/g) || []).length;

  const isValid =
    lenOk &&
    numCount >= 2 &&
    alphaCount >= 5 &&
    lowerCount >= 3 &&
    upperCount >= 1 &&
    specialCount >= 1;

  return {
    valid: isValid,
    message: isValid ? "ACCEPTED // ENCRYPTION KEY STRENGTH OPTIMAL" : "SECURITY DEFICIT",
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
    });

    test("Name Validation: validates alphabets and spaces only", () => {
      const validRes = validateName("Shinji Ikari");
      assert.strictEqual(validRes.valid, true);

      const invalidNumbers = validateName("Pilot 01");
      assert.strictEqual(invalidNumbers.valid, false);

      const invalidSymbols = validateName("Rei_Ayanami!");
      assert.strictEqual(invalidSymbols.valid, false);
    });

    test("Email Validation: checks '@' and '.' counts and standard syntax", () => {
      const validEmail = validateEmail("cyb.shibrajdas@gmail.com");
      assert.strictEqual(validEmail.valid, true);

      const missingDot = validateEmail("pilot@nerv");
      assert.strictEqual(missingDot.valid, false);

      const doubleAt = validateEmail("pilot@@nerv.org");
      assert.strictEqual(doubleAt.valid, false);

      const missingAt = validateEmail("nerv.magi.org");
      assert.strictEqual(missingAt.valid, false);
    });

    test("Phone Validation: strictly enforces exactly 10 numeric digits", () => {
      const validPhone = validatePhone("8420607640");
      assert.strictEqual(validPhone.valid, true);

      const shortPhone = validatePhone("842060764");
      assert.strictEqual(shortPhone.valid, false);

      const longPhone = validatePhone("84206076400");
      assert.strictEqual(longPhone.valid, false);

      const nonNumeric = validatePhone("842060764a");
      assert.strictEqual(nonNumeric.valid, false);
    });

    test("Password / Secret Validation: enforces length >8, >=2 numbers, >=5 alphabets, >=3 lower, >=1 upper, >=1 special", () => {
      // Meets: len 19 (>8), 4 nums (>=2), 13 alphas (>=5), 11 lower (>=3), 2 upper (>=1), 2 special (>=1)
      const validSecret = validateSecret("MagiSync#2026Secure!");
      assert.strictEqual(validSecret.valid, true);

      // Too short (<= 8 chars)
      const tooShort = validateSecret("Magi12!");
      assert.strictEqual(tooShort.valid, false);

      // Insufficient numbers (< 2 numbers)
      const noNumbers = validateSecret("MagiSyncSecure!Alpha");
      assert.strictEqual(noNumbers.valid, false);

      // Insufficient uppercase (< 1 upper)
      const noUpper = validateSecret("magisync#2026secure!");
      assert.strictEqual(noUpper.valid, false);

      // Insufficient special (< 1 special)
      const noSpecial = validateSecret("MagiSync2026SecureAlpha");
      assert.strictEqual(noSpecial.valid, false);
    });

    test("Input_chk status indicator box renders dynamic glowing border-l-2", () => {
      // Valid Input status indicator
      const validHtml = renderToString(
        React.createElement(ConfigInput, {
          label: "Name",
          value: "Cyberbee pro",
          onChange: () => {},
          validator: validateName,
        })
      );

      assert.ok(validHtml.includes("border-l-2"), "Must render left border for status indicator");
      assert.ok(validHtml.includes("border-l-[var(--eva-lime)]"), "Must show lime border on valid input");
      assert.ok(validHtml.includes("[VERIFIED]"), "Must show [VERIFIED] tag on valid input");

      // Invalid Input status indicator
      const invalidHtml = renderToString(
        React.createElement(ConfigInput, {
          label: "Name",
          value: "Unit-01",
          onChange: () => {},
          validator: validateName,
        })
      );

      assert.ok(invalidHtml.includes("border-l-[var(--eva-red)]"), "Must show red border on error");
      assert.ok(invalidHtml.includes("[ERROR]"), "Must show [ERROR] tag on error");
    });

    test("Expandable summary field renders chevron toggle for collapsed preview", () => {
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
    });
  });

  describe("ConfigResumeCard Component", () => {
    test("renders Resume.pdf header bar and 3 action triggers (upload, download, external link)", () => {
      const resumeUrl = "https://drive.google.com/file/d/test_resume/view";
      const html = renderToString(
        React.createElement(ConfigResumeCard, {
          resumeUrl,
          onUpdateResumeUrl: () => {},
        })
      );

      assert.ok(html.includes("Resume.pdf"), "Must display Resume.pdf title");
      assert.ok(html.includes('aria-label="Upload Resume"'), "Must include upload trigger");
      assert.ok(html.includes('aria-label="Download Resume"'), "Must include download trigger");
      assert.ok(html.includes('aria-label="Open Resume in new tab"'), "Must include external link trigger");
      assert.ok(html.includes(`href="${resumeUrl}"`), "External link must target resumeUrl");
      assert.ok(html.includes("SHIBRAJ DAS"), "Must render document preview sheet");
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
    });
  });

  describe("AdminConfigPage Integration", () => {
    test("renders breadcrumbs, PatternWaves layer, form fields, security credentials, and full-width hazard strip", () => {
      const html = renderToString(React.createElement(AdminConfigPage));

      assert.ok(html.includes("Dashboard"), "Must render Dashboard breadcrumb");
      assert.ok(html.includes("config"), "Must render config breadcrumb");
      assert.ok(html.includes("data-testid=\"config-pattern-waves\""), "Must mount PatternWaves background layer");
      assert.ok(html.includes("Name :"), "Must render Name field");
      assert.ok(html.includes("Job :"), "Must render Job field");
      assert.ok(html.includes("Bio :"), "Must render Bio field");
      assert.ok(html.includes("Summary :"), "Must render Summary field");
      assert.ok(html.includes("Email :"), "Must render Email field");
      assert.ok(html.includes("Phone :"), "Must render Phone field");
      assert.ok(html.includes("Secret :"), "Must render Secret field");
      assert.ok(html.includes("SAVE CONFIGURATION"), "Must render save button");
      assert.ok(html.includes("haz_strip.svg"), "Must render bottom hazard strip");
    });
  });
});
