"use client";

import React, { useState, useEffect } from "react";
import { Skill, SkillType } from "@/lib/api/types";
import SkillUploadBox from "./SkillUploadBox";

export interface EditSkillPanelProps {
  skill: Skill;
  onSave: (id: string, data: {
    name: string;
    weight: number;
    type: SkillType;
    featured: boolean;
    logoFile: File | null;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function EditSkillPanel({
  skill,
  onSave,
  onCancel,
  isSaving = false,
}: EditSkillPanelProps) {
  const [name, setName] = useState(skill.name);
  const [weight, setWeight] = useState(skill.weight || 1);
  const [type, setType] = useState<SkillType>(skill.type || "tool");
  const [featured, setFeatured] = useState(Boolean(skill.featured));
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(skill.name);
    setWeight(skill.weight || 1);
    setType(skill.type || "tool");
    setFeatured(Boolean(skill.featured));
    setLogoFile(null);
    setError(null);
  }, [skill]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Skill name required");
      return;
    }

    try {
      await onSave(skill._id, {
        name: name.trim(),
        weight,
        type,
        featured,
        logoFile,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill");
    }
  };

  return (
    <section aria-label="Edit Skills Section" className="w-full my-4">
      <h2 className="font-exo2 text-white text-2xl sm:text-[26px] font-normal tracking-wide mb-2">
        Edit Skills
      </h2>

      <div
        data-ascii="surface"
        className="w-full bg-[#7B47DC] p-3 sm:p-4 text-white rounded-none relative shadow-lg"
      >
        <form
          onSubmit={handleSave}
          data-ascii="skip"
          className="flex items-start justify-between gap-4"
        >
          {/* Left Form Controls */}
          <div className="flex-1 space-y-2 font-exo2 text-white text-base">
            {/* Skill Name */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="edit-skill-name" className="shrink-0 tracking-wide text-sm sm:text-base">
                Skill :
              </label>
              <input
                id="edit-skill-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                data-ascii="skip"
                className="flex-1 bg-transparent border-b border-white/60 focus:border-white focus:outline-none text-white px-1 py-0.5 font-mono text-sm"
              />
            </div>

            {/* Weight */}
            <div className="flex items-center gap-2">
              <label htmlFor="edit-skill-weight" className="shrink-0 tracking-wide text-sm sm:text-base">
                weight :
              </label>
              <div className="relative inline-block">
                <select
                  id="edit-skill-weight"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  disabled={isSaving}
                  data-ascii="skip"
                  className="appearance-none bg-black/40 border border-white/40 text-white font-mono text-xs px-2.5 py-0.5 pr-6 rounded-none focus:outline-none focus:border-white cursor-pointer"
                >
                  <option value={1}>[1lv]</option>
                  <option value={2}>[2lv]</option>
                  <option value={3}>[3lv]</option>
                  <option value={4}>[4lv]</option>
                  <option value={5}>[5lv]</option>
                  <option value={6}>[6lv]</option>
                  <option value={7}>[7lv]</option>
                  <option value={8}>[8lv]</option>
                  <option value={9}>[9lv]</option>
                  <option value={10}>[10lv]</option>
                </select>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 font-mono text-[10px]">
                  v
                </span>
              </div>
            </div>

            {/* Approved Deviation: Type Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="edit-skill-type" className="shrink-0 tracking-wide text-xs text-white/90 font-mono">
                type :
              </label>
              <div className="relative inline-block">
                <select
                  id="edit-skill-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as SkillType)}
                  disabled={isSaving}
                  data-ascii="skip"
                  className="appearance-none bg-black/40 border border-white/40 text-white font-mono text-xs px-2.5 py-0.5 pr-6 rounded-none focus:outline-none focus:border-white cursor-pointer"
                >
                  <option value="tool">tool</option>
                  <option value="language">language</option>
                  <option value="framework">framework</option>
                </select>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 font-mono text-[10px]">
                  v
                </span>
              </div>
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <label
                htmlFor="edit-skill-featured"
                className="flex items-center gap-2 tracking-wide cursor-pointer select-none"
              >
                <input
                  id="edit-skill-featured"
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  disabled={isSaving}
                  data-ascii="skip"
                  className="w-4 h-4 rounded-none accent-black cursor-pointer"
                />
                <span className="text-sm">featured</span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-eva-red bg-black/50 px-2 py-0.5 font-mono text-xs">
                ERR: {error}
              </div>
            )}

            {/* Save & Cancel Buttons matching Wireframe */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                data-ascii="fade"
                className="bg-[#1740A2] hover:bg-[#1f4dc2] disabled:opacity-50 text-white font-exo2 text-xs sm:text-sm px-6 py-1 tracking-wider uppercase transition-colors"
              >
                {isSaving ? "SAVING..." : "Save"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                data-ascii="skip"
                className="text-white/80 hover:text-white font-mono text-xs uppercase underline transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right Upload Box */}
          <SkillUploadBox
            currentUrl={skill.logoUrl}
            selectedFile={logoFile}
            onFileSelect={(file) => setLogoFile(file)}
            disabled={isSaving}
            isUploading={isSaving && Boolean(logoFile)}
            className="shrink-0"
          />
        </form>
      </div>
    </section>
  );
}

export default EditSkillPanel;
