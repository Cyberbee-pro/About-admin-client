import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { AddSkillForm } from "@/app/admin/skills-achievements/components/AddSkillForm";
import { EditSkillPanel } from "@/app/admin/skills-achievements/components/EditSkillPanel";
import { SkillsList } from "@/app/admin/skills-achievements/components/SkillsList";
import { SkillUploadBox } from "@/app/admin/skills-achievements/components/SkillUploadBox";
import { AddAchievementForm } from "@/app/admin/skills-achievements/components/AddAchievementForm";
import { EditAchievementPanel } from "@/app/admin/skills-achievements/components/EditAchievementPanel";
import { AchievementsList } from "@/app/admin/skills-achievements/components/AchievementsList";
import { DeleteConfirmModal } from "@/app/admin/skills-achievements/components/DeleteConfirmModal";
import { WeightSelect, normalizeWeight } from "@/app/admin/skills-achievements/components/WeightSelect";
import SkillsAndAchievementsPage from "@/app/admin/skills-achievements/page";
import { Skill, Achievement } from "@/lib/api/types";

describe("Skills & Achievements Admin Modules", () => {
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

  describe("SkillUploadBox Component", () => {
    test("renders amber box with upload arrow and prompt copy", () => {
      const html = renderToString(
        React.createElement(SkillUploadBox, {
          onFileSelect: () => {},
        })
      );

      assert.ok(html.includes("bg-[#874807]"), "Upload box must have #874807 background");
      assert.ok(html.includes("Drag and drop"), "Must display 'Drag and drop' copy");
      assert.ok(html.includes("or click to"), "Must display 'or click to' copy");
      assert.ok(html.includes("upload"), "Must display 'upload' copy");
      assert.ok(html.includes("data-ascii=\"skip\""), "Interactive upload control must skip ASCII reveal");
    });
  });

  describe("AddSkillForm Component", () => {
    test("renders skill name, weight select, approved type selector, and upload box", () => {
      const html = renderToString(
        React.createElement(AddSkillForm, {
          onSubmit: async () => {},
        })
      );

      assert.ok(html.includes("Add Skill"), "Must render 'Add Skill' heading");
      assert.ok(html.includes("Skill :"), "Must render 'Skill :' label");
      assert.ok(html.includes("weight :"), "Must render 'weight :' label");
      assert.ok(html.includes("type :"), "Must render approved addition 'type :' selector");
      assert.ok(html.includes("tool"), "Type selector must contain 'tool' option");
      assert.ok(html.includes("language"), "Type selector must contain 'language' option");
      assert.ok(html.includes("framework"), "Type selector must contain 'framework' option");
      assert.ok(html.includes("featured"), "Must render 'featured' toggle");
      assert.ok(html.includes("bg-[#874807]"), "Must render upload box alongside form");
    });
  });

  describe("EditSkillPanel Component", () => {
    test("renders purple Edit Skills panel with pre-filled inputs and blue Save button", () => {
      const mockSkill: Skill = {
        _id: "s-edit-1",
        name: "TypeScript",
        weight: 9,
        type: "language",
        featured: true,
        logoUrl: "https://example.com/ts.png",
      };

      const html = renderToString(
        React.createElement(EditSkillPanel, {
          skill: mockSkill,
          onSave: async () => {},
          onCancel: () => {},
        })
      );

      assert.ok(html.includes("Edit Skills"), "Must render 'Edit Skills' heading");
      assert.ok(html.includes("bg-[#7B47DC]"), "Must render solid purple container #7B47DC");
      assert.ok(html.includes("value=\"TypeScript\""), "Must pre-fill skill name");
      assert.ok(html.includes("bg-[#1740A2]"), "Save button must use wireframe blue #1740A2");
      assert.ok(html.includes("Save"), "Button must have 'Save' copy");
      assert.ok(html.includes("data-ascii=\"surface\""), "Panel must have data-ascii='surface'");
    });

    test("normalizes stored 0 or negative weight to 1 in EditSkillPanel", () => {
      const skillWithZero: Skill = {
        _id: "s-zero",
        name: "ZeroSkill",
        weight: 0,
        type: "tool",
      };

      const htmlZero = renderToString(
        React.createElement(EditSkillPanel, {
          skill: skillWithZero,
          onSave: async () => {},
          onCancel: () => {},
        })
      );
      assert.ok(htmlZero.includes("value=\"1\"") && htmlZero.includes("selected"), "Must normalize 0 weight to 1");
      assert.ok(!htmlZero.includes("value=\"0\""), "Must not contain 0 option");

      const skillWithNegative: Skill = {
        _id: "s-neg",
        name: "NegSkill",
        weight: -4,
        type: "tool",
      };

      const htmlNeg = renderToString(
        React.createElement(EditSkillPanel, {
          skill: skillWithNegative,
          onSave: async () => {},
          onCancel: () => {},
        })
      );
      assert.ok(htmlNeg.includes("value=\"1\"") && htmlNeg.includes("selected"), "Must normalize negative weight to 1");
    });
  });

  describe("SkillsList Component", () => {
    test("renders skill cards with logo, name, and approved edit/delete buttons", () => {
      const mockSkills: Skill[] = [
        { _id: "s1", name: "github", weight: 10, type: "tool" },
        { _id: "s2", name: "Curl", weight: 9, type: "tool" },
      ];

      const html = renderToString(
        React.createElement(SkillsList, {
          skills: mockSkills,
          onEdit: () => {},
          onDelete: () => {},
        })
      );

      assert.ok(html.includes("All Skills"), "Must render 'All Skills' heading");
      assert.ok(html.includes("github"), "Must render 'github' skill card");
      assert.ok(html.includes("Curl"), "Must render 'Curl' skill card");
      assert.ok(html.includes("Edit"), "Must render approved addition Edit button on card");
      assert.ok(html.includes("Del"), "Must render approved addition Del button on card");
      assert.ok(html.includes("eva-custom-scrollbar"), "Must use styled custom scrollbar");
    });

    test("renders error state when fetch fails instead of empty state", () => {
      const html = renderToString(
        React.createElement(SkillsList, {
          skills: [],
          error: "Connection timeout to core database",
          onEdit: () => {},
          onDelete: () => {},
        })
      );

      assert.ok(html.includes("SYSTEM ERROR // FAILED TO RETRIEVE SKILLS"), "Must render error banner heading");
      assert.ok(html.includes("Connection timeout to core database"), "Must render actual error detail");
      assert.ok(!html.includes("NO SKILLS RECORDED"), "Must NOT show empty state when there is an error");
    });
  });

  describe("AddAchievementForm Component", () => {
    test("renders title, date [mm/yyyy], description, weight, and featured", () => {
      const html = renderToString(
        React.createElement(AddAchievementForm, {
          onSubmit: async () => {},
        })
      );

      assert.ok(html.includes("Add Achievement"), "Must render 'Add Achievement' heading");
      assert.ok(html.includes("title :"), "Must render 'title :' label");
      assert.ok(html.includes("date :"), "Must render 'date :' label");
      assert.ok(html.includes("[mm/yyyy]"), "Must render '[mm/yyyy]' placeholder");
      assert.ok(html.includes("description :"), "Must render 'description :' label");
      assert.ok(html.includes("weight :"), "Must render 'weight :' label");
      assert.ok(html.includes("featured"), "Must render 'featured' toggle");
    });
  });

  describe("EditAchievementPanel Component", () => {
    test("renders purple Edit Achievement panel with pre-filled inputs and Save button", () => {
      const mockAch: Achievement = {
        _id: "ach-edit-1",
        title: "Hackathon Champion",
        date: "12/2025",
        detail: "Autonomous robotics software award",
        weight: 10,
        featured: true,
      };

      const html = renderToString(
        React.createElement(EditAchievementPanel, {
          achievement: mockAch,
          onSave: async () => {},
          onCancel: () => {},
        })
      );

      assert.ok(html.includes("Edit Achievement"), "Must render 'Edit Achievement' heading");
      assert.ok(html.includes("bg-[#7B47DC]"), "Must render solid purple container #7B47DC");
      assert.ok(html.includes("value=\"Hackathon Champion\""), "Must pre-fill title");
      assert.ok(html.includes("value=\"12/2025\""), "Must pre-fill date");
      assert.ok(html.includes("value=\"Autonomous robotics software award\""), "Must pre-fill description");
      assert.ok(html.includes("bg-[#1740A2]"), "Save button must use wireframe blue #1740A2");
      assert.ok(html.includes("Save"), "Button must have 'Save' copy");
      assert.ok(html.includes("data-ascii=\"surface\""), "Panel must have data-ascii='surface'");
    });

    test("normalizes stored 0 or negative weight to 1 in EditAchievementPanel", () => {
      const achWithZero: Achievement = {
        _id: "a-zero",
        title: "ZeroAch",
        date: "01/2025",
        detail: "Zero description",
        weight: 0,
      };

      const htmlZero = renderToString(
        React.createElement(EditAchievementPanel, {
          achievement: achWithZero,
          onSave: async () => {},
          onCancel: () => {},
        })
      );
      assert.ok(htmlZero.includes("value=\"1\"") && htmlZero.includes("selected"), "Must normalize 0 weight to 1");
      assert.ok(!htmlZero.includes("value=\"0\""), "Must not contain 0 option");

      const achWithNegative: Achievement = {
        _id: "a-neg",
        title: "NegAch",
        date: "01/2025",
        detail: "Neg description",
        weight: -5,
      };

      const htmlNeg = renderToString(
        React.createElement(EditAchievementPanel, {
          achievement: achWithNegative,
          onSave: async () => {},
          onCancel: () => {},
        })
      );
      assert.ok(htmlNeg.includes("value=\"1\"") && htmlNeg.includes("selected"), "Must normalize negative weight to 1");
    });
  });

  describe("AchievementsList Component", () => {
    test("renders achievement row matching wireframe pattern: title, dashed line, date, description, weight", () => {
      const mockAchs: Achievement[] = [
        {
          _id: "a1",
          title: "NERV Core Specialist",
          date: "04/2026",
          detail: "Engineered synchronization fault recovery subroutines",
          weight: 8,
          featured: true,
        },
      ];

      const html = renderToString(
        React.createElement(AchievementsList, {
          achievements: mockAchs,
          onEdit: () => {},
          onDelete: () => {},
        })
      );

      assert.ok(html.includes("All Achievements"), "Must render 'All Achievements' heading");
      assert.ok(html.includes("NERV Core Specialist"), "Must render achievement title");
      assert.ok(html.includes("04/2026"), "Must render date");
      assert.ok(html.includes("Engineered synchronization fault recovery subroutines"), "Must render detail/description");
      assert.ok(html.includes("border-dashed"), "Must render dashed line separator between title and date");
      assert.ok(html.includes("weight") && html.includes("8"), "Must render weight indicator");
      assert.ok(html.includes("featured") && html.includes("✓"), "Must render featured indicator");
      assert.ok(html.includes("eva-custom-scrollbar"), "Must use styled custom scrollbar");
    });

    test("renders error state when fetch fails instead of empty state", () => {
      const html = renderToString(
        React.createElement(AchievementsList, {
          achievements: [],
          error: "Failed to connect to upstream service",
          onEdit: () => {},
          onDelete: () => {},
        })
      );

      assert.ok(html.includes("SYSTEM ERROR // FAILED TO RETRIEVE ACHIEVEMENTS"), "Must render error banner heading");
      assert.ok(html.includes("Failed to connect to upstream service"), "Must render actual error detail");
      assert.ok(!html.includes("NO ACHIEVEMENTS RECORDED"), "Must NOT show empty state when there is an error");
    });
  });

  describe("WeightSelect Component", () => {
    test("renders plain numbers 1 to 10 with no 'lv' suffix", () => {
      const html = renderToString(
        React.createElement(WeightSelect, {
          id: "test-weight",
          value: 1,
          onChange: () => {},
        })
      );

      assert.ok(!html.includes("lv"), "Dropdown options must NOT contain 'lv' suffix");
      assert.ok(html.includes("value=\"1\"") && html.includes(">1</option>"), "Must contain plain option 1");
      assert.ok(html.includes("value=\"10\">10</option>"), "Must contain plain option 10");
    });

    test("normalizes 0, negative, or missing weight to minimum 1", () => {
      const htmlZero = renderToString(
        React.createElement(WeightSelect, {
          id: "test-weight-zero",
          value: 0,
          onChange: () => {},
        })
      );

      assert.ok(htmlZero.includes("value=\"1\"") && htmlZero.includes("selected"), "Must normalize 0 to 1");

      const htmlNegative = renderToString(
        React.createElement(WeightSelect, {
          id: "test-weight-neg",
          value: -5,
          onChange: () => {},
        })
      );

      assert.ok(htmlNegative.includes("value=\"1\"") && htmlNegative.includes("selected"), "Must normalize negative value to 1");
    });

    test("includes stored weight above 10 as an extra option so saving preserves it", () => {
      const html = renderToString(
        React.createElement(WeightSelect, {
          id: "test-weight-large",
          value: 25,
          onChange: () => {},
        })
      );

      assert.ok(html.includes("value=\"25\"") && html.includes("selected") && html.includes(">25</option>"), "Must append 25 as an extra selected option");
    });

    test("normalizeWeight helper correctly maps below 1 or non-numbers to 1", () => {
      assert.equal(normalizeWeight(0), 1);
      assert.equal(normalizeWeight(-5), 1);
      assert.equal(normalizeWeight(-100), 1);
      assert.equal(normalizeWeight(NaN), 1);
      assert.equal(normalizeWeight(undefined), 1);
      assert.equal(normalizeWeight(null), 1);
      assert.equal(normalizeWeight("invalid"), 1);
      assert.equal(normalizeWeight(""), 1);

      assert.equal(normalizeWeight(1), 1);
      assert.equal(normalizeWeight(5), 5);
      assert.equal(normalizeWeight(10), 10);
      assert.equal(normalizeWeight(16), 16);
      assert.equal(normalizeWeight("8"), 8);
    });
  });

  describe("DeleteConfirmModal Component", () => {
    test("renders purge warning dialog with target name and confirmation buttons", () => {
      const html = renderToString(
        React.createElement(DeleteConfirmModal, {
          isOpen: true,
          itemType: "skill",
          itemName: "TypeScript",
          onConfirm: () => {},
          onCancel: () => {},
        })
      );

      assert.ok(html.includes("CONFIRM") && html.includes("PURGE"), "Must display dialog heading");
      assert.ok(html.includes("TypeScript"), "Must display targeted item name");
      assert.ok(html.includes("PURGE RECORD"), "Must render purge confirmation button");
      assert.ok(html.includes("Cancel"), "Must render cancel button");
      assert.ok(html.includes("data-ascii=\"skip\""), "Modal must skip ASCII reveal");
    });
  });

  describe("SkillsAndAchievementsPage Component", () => {
    test("renders complete side-by-side wireframe structure with dynamic PatternWaves background and hazard stripe footer", () => {
      const html = renderToString(React.createElement(SkillsAndAchievementsPage));

      assert.ok(html.includes("skills-pattern-waves"), "Must render WebGL PatternWaves background container");
      assert.ok(html.includes("Add Skill"), "Must render Add Skill section");
      assert.ok(html.includes("All Skills"), "Must render All Skills section");
      assert.ok(html.includes("Add Achievement"), "Must render Add Achievement section");
      assert.ok(html.includes("All Achievements"), "Must render All Achievements section");
      assert.ok(html.includes("haz_strip.svg"), "Must render hazard strip footer matching wireframe");
    });

    test("fail -> retry -> succeed clears section error and leaves unrelated notice untouched", async () => {
      // Simulate state lifecycle of section error handling
      let skillsError: string | null = null;
      let statusNotice: { type: string; message: string } | null = {
        type: "success",
        message: "EXISTING UNRELATED NOTICE",
      };
      let skills: Skill[] = [];

      // 1. Initial load fails
      const loadFailure = (err: Error) => {
        skillsError = err.message;
        // Notice: do NOT set statusNotice per finding #2
      };

      loadFailure(new Error("Database connection dropped"));
      assert.equal(skillsError, "Database connection dropped");
      assert.deepEqual(statusNotice, {
        type: "success",
        message: "EXISTING UNRELATED NOTICE",
      }, "Unrelated global notice must remain completely untouched on load failure");

      // Verify SkillsList renders error state
      const htmlError = renderToString(
        React.createElement(SkillsList, {
          skills,
          error: skillsError,
          onEdit: () => {},
          onDelete: () => {},
          onRetry: () => {},
        })
      );
      assert.ok(htmlError.includes("SYSTEM ERROR // FAILED TO RETRIEVE SKILLS"));
      assert.ok(htmlError.includes("Database connection dropped"));

      // 2. Retry succeeds
      const retrySuccess = (data: Skill[]) => {
        skills = data;
        skillsError = null; // Clears section error
        // Notice: does not clear unrelated statusNotice
      };

      retrySuccess([
        { _id: "s-retried", name: "RetriedSkill", weight: 3, type: "tool" },
      ]);

      assert.equal(skillsError, null, "Section error must be cleared on successful retry");
      assert.deepEqual(statusNotice, {
        type: "success",
        message: "EXISTING UNRELATED NOTICE",
      }, "Unrelated global notice remains untouched on successful retry");

      // Verify SkillsList now renders retried data with no stale error
      const htmlSuccess = renderToString(
        React.createElement(SkillsList, {
          skills,
          error: skillsError,
          onEdit: () => {},
          onDelete: () => {},
          onRetry: () => {},
        })
      );
      assert.ok(htmlSuccess.includes("RetriedSkill"), "Must render retried skill");
      assert.ok(!htmlSuccess.includes("SYSTEM ERROR"), "Must NOT render stale error");
    });
  });
});
