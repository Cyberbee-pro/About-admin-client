import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  formatDateDisplay,
  parseDateInput,
  getExperienceRowColor,
  getLatestPosition,
  validateExperienceForm,
} from "@/app/admin/experiences/utils";
import { SkillsMultiSelect } from "@/app/admin/experiences/components/SkillsMultiSelect";
import { AddExperienceForm } from "@/app/admin/experiences/components/AddExperienceForm";
import { ExperiencesGrid } from "@/app/admin/experiences/components/ExperiencesGrid";
import { EditExperienceDrawer } from "@/app/admin/experiences/components/EditExperienceDrawer";
import ExperiencesPage from "@/app/admin/experiences/page";
import { Experience, Skill } from "@/lib/api/types";

describe("Experiences Admin Module & Components", () => {
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

  describe("Experience Date & Derivation Utilities", () => {
    test("formatDateDisplay formats to dd/mm/yy and handles edge cases", () => {
      assert.equal(formatDateDisplay("2025-10-24T00:00:00.000Z"), "24/10/25");
      assert.equal(formatDateDisplay("2024-03-05T00:00:00.000Z"), "05/03/24");
      assert.equal(formatDateDisplay(undefined), "dd/mm/yy");
      assert.equal(formatDateDisplay(null), "dd/mm/yy");
      assert.equal(formatDateDisplay("invalid-date"), "dd/mm/yy");
    });

    test("parseDateInput parses dd/mm/yy and interprets 2-digit year as 20yy", () => {
      const res1 = parseDateInput("24/10/25");
      assert.equal(res1.isValid, true);
      assert.ok(res1.isoString?.startsWith("2025-10-24"));

      const res2 = parseDateInput("05/03/24");
      assert.equal(res2.isValid, true);
      assert.ok(res2.isoString?.startsWith("2024-03-05"));

      // 4-digit year also supported
      const res3 = parseDateInput("15/08/2026");
      assert.equal(res3.isValid, true);
      assert.ok(res3.isoString?.startsWith("2026-08-15"));
    });

    test("parseDateInput rejects invalid calendar dates and formats", () => {
      const res1 = parseDateInput("31/02/25"); // Feb 31 does not exist
      assert.equal(res1.isValid, false);

      const res2 = parseDateInput("15/13/25"); // Month 13
      assert.equal(res2.isValid, false);

      const res3 = parseDateInput("not-a-date");
      assert.equal(res3.isValid, false);
    });

    test("preserves dates under America/Los_Angeles timezone without day-shifting", () => {
      const prevTZ = process.env.TZ;
      process.env.TZ = "America/Los_Angeles";
      try {
        const utcIso = "2025-10-24T00:00:00.000Z";
        // Must format as 24/10/25 in UTC, not 23/10/25
        assert.equal(formatDateDisplay(utcIso), "24/10/25");

        // Parse 24/10/25 back to UTC ISO
        const parsed = parseDateInput("24/10/25");
        assert.equal(parsed.isValid, true);
        assert.ok(parsed.isoString?.startsWith("2025-10-24"));
      } finally {
        process.env.TZ = prevTZ;
      }
    });

    test("getExperienceRowColor returns lime when isCurrent is true and red when false", () => {
      const currentExp: Experience = {
        _id: "e-1",
        organization: "NERV",
        tag: "focus",
        type: "full_time",
        weight: 1,
        skills: [],
        positions: [
          {
            position: "Pilot",
            description: "Eva-01",
            startDate: "2025-01-01T00:00:00.000Z",
            isCurrent: true,
          },
        ],
      };
      assert.equal(getExperienceRowColor(currentExp), "lime");

      const pastExp: Experience = {
        _id: "e-2",
        organization: "Gehirn",
        tag: "focus",
        type: "contract",
        weight: 1,
        skills: [],
        positions: [
          {
            position: "Researcher",
            description: "Magi proto",
            startDate: "2020-01-01T00:00:00.000Z",
            endDate: "2022-12-31T00:00:00.000Z",
            isCurrent: false,
          },
        ],
      };
      assert.equal(getExperienceRowColor(pastExp), "red");
    });

    test("getLatestPosition derives active position or latest by date", () => {
      const expMulti: Experience = {
        _id: "e-3",
        organization: "Wille",
        tag: "focus",
        type: "full_time",
        weight: 1,
        skills: [],
        positions: [
          {
            position: "Officer",
            description: "Bridge",
            startDate: "2023-01-01T00:00:00.000Z",
            endDate: "2024-01-01T00:00:00.000Z",
            isCurrent: false,
          },
          {
            position: "Captain",
            description: "Command",
            startDate: "2024-02-01T00:00:00.000Z",
            isCurrent: true,
          },
        ],
      };
      // isCurrent position takes precedence
      assert.equal(getLatestPosition(expMulti)?.position, "Captain");

      const expPast: Experience = {
        _id: "e-4",
        organization: "Seele",
        tag: "extracurricular",
        type: "club",
        weight: 1,
        skills: [],
        positions: [
          {
            position: "Junior Observer",
            description: "Old role",
            startDate: "2018-01-01T00:00:00.000Z",
            endDate: "2019-01-01T00:00:00.000Z",
            isCurrent: false,
          },
          {
            position: "Council Member",
            description: "Later role",
            startDate: "2019-02-01T00:00:00.000Z",
            endDate: "2021-01-01T00:00:00.000Z",
            isCurrent: false,
          },
        ],
      };
      assert.equal(getLatestPosition(expPast)?.position, "Council Member");
    });

    test("validateExperienceForm validates organization, icon, and positions", () => {
      // 1. Missing organization
      const v1 = validateExperienceForm({
        organization: "   ",
        tag: "focus",
        type: "full_time",
        hasIcon: true,
        positions: [
          {
            position: "Engineer",
            description: "Desc",
            startDateInput: "01/01/25",
            endDateInput: "",
            isCurrent: true,
            existingMediaUrls: [],
            existingCertUrls: [],
            stagedMediaFiles: [],
            stagedCertFiles: [],
          },
        ],
      });
      assert.equal(v1.isValid, false);
      assert.equal(v1.error, "Organization is required");

      // 2. Missing icon
      const v2 = validateExperienceForm({
        organization: "NERV",
        tag: "focus",
        type: "full_time",
        hasIcon: false,
        positions: [
          {
            position: "Engineer",
            description: "Desc",
            startDateInput: "01/01/25",
            endDateInput: "",
            isCurrent: true,
            existingMediaUrls: [],
            existingCertUrls: [],
            stagedMediaFiles: [],
            stagedCertFiles: [],
          },
        ],
      });
      assert.equal(v2.isValid, false);
      assert.ok(v2.error?.includes("icon is required"));

      // 3. End date earlier than start date
      const v3 = validateExperienceForm({
        organization: "NERV",
        tag: "focus",
        type: "full_time",
        hasIcon: true,
        positions: [
          {
            position: "Engineer",
            description: "Desc",
            startDateInput: "01/01/25",
            endDateInput: "01/01/24", // Earlier than start date!
            isCurrent: false,
            existingMediaUrls: [],
            existingCertUrls: [],
            stagedMediaFiles: [],
            stagedCertFiles: [],
          },
        ],
      });
      assert.equal(v3.isValid, false);
      assert.ok(v3.error?.includes("End date cannot be earlier than start date"));
    });
  });

  describe("SkillsMultiSelect Component", () => {
    const mockSkills: Skill[] = [
      { _id: "s-1", name: "Linux", type: "tool", weight: 1, featured: true },
      { _id: "s-2", name: "Kubernetes", type: "tool", weight: 2, featured: true },
    ];

    test("renders dropdown with [select] option and chips with remove x buttons", () => {
      const html = renderToString(
        React.createElement(SkillsMultiSelect, {
          selectedSkillIds: ["s-1"],
          onChange: () => {},
          availableSkills: mockSkills,
        })
      );

      assert.ok(html.includes("[select]"), "Must render placeholder option");
      assert.ok(html.includes("Linux"), "Must render selected skill chip");
      assert.ok(html.includes("×"), "Must render chip remove button");
    });

    test("preserves skills already on a record even if missing from available skills options", () => {
      const html = renderToString(
        React.createElement(SkillsMultiSelect, {
          selectedSkillIds: ["archived-skill-id-99"],
          onChange: () => {},
          availableSkills: mockSkills,
        })
      );

      assert.ok(
        html.includes("archived-skill-id-99"),
        "Must preserve and render skill chip even if missing from available skills"
      );
    });
  });

  describe("AddExperienceForm Component", () => {
    test("renders all wireframe fields, type select, present toggle, and tabbed upload box", () => {
      const html = renderToString(
        React.createElement(AddExperienceForm, {
          onSubmit: async () => {},
          availableSkills: [],
        })
      );

      assert.ok(html.includes("Add Experience. . . ."), "Must render heading");
      assert.ok(html.includes("Position:"), "Must render Position label");
      assert.ok(html.includes("Description:"), "Must render Description label");
      assert.ok(html.includes("organization:"), "Must render organization label");
      assert.ok(html.includes("tag :"), "Must render tag label");
      assert.ok(html.includes("type :"), "Must render approved type label");
      assert.ok(html.includes("skills :"), "Must render skills label");
      assert.ok(html.includes("weight :"), "Must render weight label");
      assert.ok(html.includes("start date"), "Must render start date label");
      assert.ok(html.includes("end date"), "Must render end date label");
      assert.ok(html.includes("[present]"), "Must render [present] toggle button");
      assert.ok(html.includes("+ Add Position"), "Must render + Add Position button");
      assert.ok(html.includes("ADD EXPERIENCE"), "Must render submit button");

      // Verify tabbed upload box
      assert.ok(html.includes("Icon"), "Must render Icon tab");
      assert.ok(html.includes("Cert"), "Must render Cert tab");
      assert.ok(html.includes("Media"), "Must render Media tab");
      assert.ok(html.includes("bg-[#7B47DC]"), "Must have purple upload box on base page");
    });
  });

  describe("ExperiencesGrid Component", () => {
    const mockExperiences: Experience[] = [
      {
        _id: "exp-1",
        organization: "NERV Central",
        tag: "focus",
        type: "full_time",
        iconUrl: "https://res.cloudinary.com/demo/nerv.png",
        skills: [],
        weight: 1,
        positions: [
          {
            position: "Chief Operations Director",
            description: "Command",
            startDate: "2025-01-01T00:00:00.000Z",
            isCurrent: true,
          },
        ],
      },
      {
        _id: "exp-2",
        organization: "Wille Naval Base",
        tag: "extracurricular",
        type: "contract",
        iconUrl: "",
        skills: [],
        weight: 2,
        positions: [
          {
            position: "Tactical Specialist",
            description: "Past mission",
            startDate: "2022-01-01T00:00:00.000Z",
            endDate: "2023-01-01T00:00:00.000Z",
            isCurrent: false,
          },
        ],
      },
    ];

    test("renders two-column grid with lime active bar and red past bar", () => {
      const html = renderToString(
        React.createElement(ExperiencesGrid, {
          experiences: mockExperiences,
          onEdit: () => {},
          onDelete: () => {},
        })
      );

      assert.ok(html.includes("Past Experiences"), "Must render section heading");
      assert.ok(html.includes("bg-[#B0DD09]"), "Must render lime bar for current experience");
      assert.ok(html.includes("bg-[#D9381E]"), "Must render red bar for past experience");
      assert.ok(html.includes("NERV Central"), "Must render organization name");
      assert.ok(html.includes("Chief Operations Director"), "Must render latest position");
      assert.ok(html.includes("Wille Naval Base"), "Must render second organization name");
      assert.ok(html.includes("Tactical Specialist"), "Must render second position");
      assert.ok(html.includes("Del"), "Must render delete button on each card");
    });

    test("renders empty state and error state correctly", () => {
      const htmlEmpty = renderToString(
        React.createElement(ExperiencesGrid, {
          experiences: [],
          onEdit: () => {},
          onDelete: () => {},
        })
      );
      assert.ok(htmlEmpty.includes("NO EXPERIENCES RECORDED"), "Must render empty copy");

      const htmlError = renderToString(
        React.createElement(ExperiencesGrid, {
          experiences: [],
          error: "Database unreachable",
          onEdit: () => {},
          onDelete: () => {},
        })
      );
      assert.ok(htmlError.includes("SYSTEM ERROR // FAILED TO RETRIEVE EXPERIENCES"));
      assert.ok(htmlError.includes("Database unreachable"));
    });
  });

  describe("EditExperienceDrawer Component", () => {
    const mockExperienceToEdit: Experience = {
      _id: "exp-edit-1",
      organization: "NERV",
      tag: "focus",
      type: "full_time",
      iconUrl: "https://res.cloudinary.com/demo/nerv.png",
      skills: [],
      weight: 4,
      positions: [
        {
          _id: "pos-1",
          position: "Operations Officer",
          description: "Tactical deployment",
          startDate: "2024-01-01T00:00:00.000Z",
          isCurrent: true,
          mediaUrls: [],
          certificateUrls: [],
        },
        {
          _id: "pos-2",
          position: "Junior Analyst",
          description: "Telemetry parsing",
          startDate: "2023-01-01T00:00:00.000Z",
          endDate: "2023-12-31T00:00:00.000Z",
          isCurrent: false,
          mediaUrls: [],
          certificateUrls: [],
        },
      ],
    };

    test("renders dynamic heading, stacked position blocks, blue upload box, and pinned Save button", () => {
      const html = renderToString(
        React.createElement(EditExperienceDrawer, {
          experience: mockExperienceToEdit,
          isOpen: true,
          onClose: () => {},
          onSave: async () => {},
          availableSkills: [],
        })
      );

      assert.ok(html.includes("Edit Experience [NERV]. . . ."), "Must render dynamic heading");
      assert.ok(html.includes("Operations Officer"), "Must pre-fill first position title");
      assert.ok(html.includes("Junior Analyst"), "Must pre-fill stacked second position title");
      assert.ok(html.includes("bg-[#1740A2]"), "Must render blue upload box in drawer");
      assert.ok(html.includes("Save"), "Must render Save button");
      assert.ok(html.includes("haz_strip.svg"), "Must render hazard stripe band in drawer");
      assert.ok(html.includes("eva-custom-scrollbar"), "Stacked positions must use custom scrollbar");
    });
  });

  describe("ExperiencesPage Component", () => {
    test("renders WebGL PatternWaves background, sticky hazard stripe footer, and bottom spacing", () => {
      const html = renderToString(React.createElement(ExperiencesPage));

      assert.ok(html.includes("experiences-pattern-waves"), "Must render PatternWaves container");
      assert.ok(html.includes("Add Experience. . . ."), "Must render Add Experience section");
      assert.ok(html.includes("Past Experiences"), "Must render Past Experiences section");
      assert.ok(html.includes("sticky bottom-0"), "Hazard stripe footer must be sticky at bottom-0");
      assert.ok(html.includes("haz_strip.svg"), "Must render hazard stripe footer");
      assert.ok(html.includes("pb-20"), "Content area must have pb-20 / pb-24 bottom spacing");
    });
  });
});
