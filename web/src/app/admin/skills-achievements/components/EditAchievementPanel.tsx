"use client";

import React, { useState } from "react";
import { Achievement } from "@/lib/api/types";
import WeightSelect, { normalizeWeight } from "./WeightSelect";

export interface EditAchievementPanelProps {
  achievement: Achievement;
  onSave: (id: string, data: {
    title: string;
    date: string;
    detail: string;
    weight: number;
    featured: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function EditAchievementPanel({
  achievement,
  onSave,
  onCancel,
  isSaving = false,
}: EditAchievementPanelProps) {
  const [title, setTitle] = useState(achievement.title);
  const [date, setDate] = useState(achievement.date);
  const [detail, setDetail] = useState(achievement.detail);
  const [weight, setWeight] = useState(normalizeWeight(achievement.weight));
  const [featured, setFeatured] = useState(Boolean(achievement.featured));
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title required");
      return;
    }
    if (!date.trim()) {
      setError("Date required");
      return;
    }
    if (!detail.trim()) {
      setError("Description required");
      return;
    }

    try {
      await onSave(achievement._id, {
        title: title.trim(),
        date: date.trim(),
        detail: detail.trim(),
        weight,
        featured,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update achievement");
    }
  };

  return (
    <section aria-label="Edit Achievement Section" className="w-full my-4">
      <h2 className="font-exo2 text-white text-2xl sm:text-[26px] font-normal tracking-wide mb-2">
        Edit Achievement
      </h2>

      <div
        data-ascii="surface"
        className="w-full bg-[#7B47DC] p-3 sm:p-4 text-white rounded-none relative shadow-lg"
      >
        <form
          onSubmit={handleSave}
          data-ascii="skip"
          className="space-y-2 font-exo2 text-white text-base"
        >
          {/* Title */}
          <div className="flex items-baseline gap-2">
            <label htmlFor="edit-ach-title" className="shrink-0 tracking-wide text-sm sm:text-base">
              title :
            </label>
            <input
              id="edit-ach-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
              data-ascii="skip"
              className="flex-1 bg-transparent border-b border-white/60 focus:border-white focus:outline-none text-white px-1 py-0.5 font-mono text-sm"
            />
          </div>

          {/* Date */}
          <div className="flex items-baseline gap-2">
            <label htmlFor="edit-ach-date" className="shrink-0 tracking-wide text-sm sm:text-base">
              date :
            </label>
            <input
              id="edit-ach-date"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSaving}
              data-ascii="skip"
              className="w-36 bg-transparent border-b border-white/60 focus:border-white focus:outline-none text-white px-1 py-0.5 font-mono text-sm"
            />
          </div>

          {/* Description */}
          <div className="flex items-baseline gap-2">
            <label htmlFor="edit-ach-desc" className="shrink-0 tracking-wide text-sm sm:text-base">
              description :
            </label>
            <input
              id="edit-ach-desc"
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              disabled={isSaving}
              data-ascii="skip"
              className="flex-1 bg-transparent border-b border-white/60 focus:border-white focus:outline-none text-white px-1 py-0.5 font-mono text-sm"
            />
          </div>

          {/* Weight */}
          <div className="flex items-center gap-2">
            <label htmlFor="edit-ach-weight" className="shrink-0 tracking-wide text-sm sm:text-base">
              weight :
            </label>
            <WeightSelect
              id="edit-ach-weight"
              value={weight}
              onChange={setWeight}
              disabled={isSaving}
              selectClassName="bg-black/40"
            />
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2.5 pt-0.5">
            <label
              htmlFor="edit-ach-featured"
              className="flex items-center gap-2 tracking-wide cursor-pointer select-none"
            >
              <input
                id="edit-ach-featured"
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

          {/* Error Notice */}
          {error && (
            <div className="text-eva-red bg-black/50 px-2 py-0.5 font-mono text-xs">
              ERR: {error}
            </div>
          )}

          {/* Save & Cancel Buttons in bottom right matching wireframe */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              data-ascii="skip"
              className="text-white/80 hover:text-white font-mono text-xs uppercase underline transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              data-ascii="fade"
              className="bg-[#1740A2] hover:bg-[#1f4dc2] disabled:opacity-50 text-white font-exo2 text-xs sm:text-sm px-6 py-1 tracking-wider uppercase transition-colors"
            >
              {isSaving ? "SAVING..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default EditAchievementPanel;
