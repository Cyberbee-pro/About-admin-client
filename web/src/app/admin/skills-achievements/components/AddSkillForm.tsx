"use client";

import React, { useState } from "react";
import { SkillType } from "@/lib/api/types";
import SkillUploadBox from "./SkillUploadBox";

export interface AddSkillFormProps {
  onSubmit: (data: {
    name: string;
    weight: number;
    type: SkillType;
    featured: boolean;
    logoFile: File | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddSkillForm({ onSubmit, isSubmitting = false }: AddSkillFormProps) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(1);
  const [type, setType] = useState<SkillType>("tool");
  const [featured, setFeatured] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Skill name required");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        weight,
        type,
        featured,
        logoFile,
      });
      // Reset form on success
      setName("");
      setWeight(1);
      setType("tool");
      setFeatured(false);
      setLogoFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create skill");
    }
  };

  return (
    <section aria-label="Add Skill Section" className="w-full">
      <h2 className="font-exo2 text-white text-2xl sm:text-[26px] font-normal tracking-wide mb-3">
        Add Skill
      </h2>

      <form
        onSubmit={handleSubmit}
        data-ascii="skip"
        className="flex items-start justify-between gap-4 sm:gap-6"
      >
        {/* Left Inputs Column */}
        <div className="flex-1 space-y-2.5 font-exo2 text-white text-base">
          {/* Skill Name Input */}
          <div className="flex items-baseline gap-2">
            <label htmlFor="add-skill-name" className="shrink-0 tracking-wide">
              Skill :
            </label>
            <input
              id="add-skill-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skill name"
              disabled={isSubmitting}
              data-ascii="skip"
              className="flex-1 bg-transparent border-b border-white/60 focus:border-white focus:outline-none text-white px-1 py-0.5 font-mono text-sm placeholder:text-white/30"
            />
          </div>

          {/* Weight Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="add-skill-weight" className="shrink-0 tracking-wide">
              weight :
            </label>
            <div className="relative inline-block">
              <select
                id="add-skill-weight"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                disabled={isSubmitting}
                data-ascii="skip"
                className="appearance-none bg-black border border-white/40 text-white font-mono text-xs px-2.5 py-0.5 pr-6 rounded-none focus:outline-none focus:border-white cursor-pointer"
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
            <label htmlFor="add-skill-type" className="shrink-0 tracking-wide text-xs text-white/80 font-mono">
              type :
            </label>
            <div className="relative inline-block">
              <select
                id="add-skill-type"
                value={type}
                onChange={(e) => setType(e.target.value as SkillType)}
                disabled={isSubmitting}
                data-ascii="skip"
                className="appearance-none bg-black border border-white/40 text-white font-mono text-xs px-2.5 py-0.5 pr-6 rounded-none focus:outline-none focus:border-white cursor-pointer"
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

          {/* Featured Toggle */}
          <div className="flex items-center gap-2.5 pt-0.5">
            <label
              htmlFor="add-skill-featured"
              className="flex items-center gap-2 tracking-wide cursor-pointer select-none"
            >
              <input
                id="add-skill-featured"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                disabled={isSubmitting}
                data-ascii="skip"
                className="w-4 h-4 rounded-none accent-eva-purple cursor-pointer"
              />
              <span className="text-sm">featured</span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-eva-red font-mono text-xs pt-1">
              ERR: {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              data-ascii="fade"
              className="bg-[#1740A2] hover:bg-[#1f4dc2] disabled:opacity-50 text-white font-exo2 text-xs sm:text-sm px-4 py-1 tracking-wider uppercase transition-colors"
            >
              {isSubmitting ? "CREATING..." : "ADD SKILL"}
            </button>
          </div>
        </div>

        {/* Right Upload Box */}
        <SkillUploadBox
          selectedFile={logoFile}
          onFileSelect={(file) => setLogoFile(file)}
          disabled={isSubmitting}
          isUploading={isSubmitting && Boolean(logoFile)}
        />
      </form>
    </section>
  );
}

export default AddSkillForm;
