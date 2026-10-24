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
      assert.ok(html.includes("weight [8]"), "Must render weight indicator");
      assert.ok(html.includes("featured [✓]"), "Must render featured indicator");
      assert.ok(html.includes("eva-custom-scrollbar"), "Must use styled custom scrollbar");
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

      assert.ok(html.includes("CONFIRM SKILL PURGE"), "Must display dialog heading");
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
  });
});
