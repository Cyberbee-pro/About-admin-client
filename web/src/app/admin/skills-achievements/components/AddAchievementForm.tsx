"use client";

import React, { useState } from "react";

export interface AddAchievementFormProps {
  onSubmit: (data: {
    title: string;
    date: string;
    detail: string;
    weight: number;
    featured: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddAchievementForm({
  onSubmit,
  isSubmitting = false,
}: AddAchievementFormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [detail, setDetail] = useState("");
  const [weight, setWeight] = useState(1);
  const [featured, setFeatured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title required");
      return;
    }
    if (!date.trim()) {
      setError("Date required (e.g. mm/yyyy)");
      return;
    }
    if (!detail.trim()) {
      setError("Description required");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        date: date.trim(),
        detail: detail.trim(),
        weight,
        featured,
      });
      // Reset form on success
      setTitle("");
      setDate("");
      setDetail("");
      setWeight(1);
      setFeatured(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create achievement");
    }
  };

  return (
    <section aria-label="Add Achievement Section" className="w-full">
      <h2 className="font-exo2 text-white text-2xl sm:text-[26px] font-normal tracking-wide mb-3">
        Add Achievement
      </h2>

      <form
        onSubmit={handleSubmit}
        data-ascii="skip"
        className="space-y-2.5 font-exo2 text-white text-base max-w-xl"
      >
        {/* Title Input */}
        <div className="flex items-baseline gap-2">
          <label htmlFor="add-ach-title" className="shrink-0 tracking-wide">
            title :
          </label>
          <input
            id="add-ach-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Achievement title"
            disabled={isSubmitting}
            data-ascii="skip"
            className="flex-1 bg-transparent border-b border-white/60 focus:border-white focus:outline-none text-white px-1 py-0.5 font-mono text-sm placeholder:text-white/30"
          />
        </div>

        {/* Date Input [mm/yyyy] */}
        <div className="flex items-baseline gap-2">
          <label htmlFor="add-ach-date" className="shrink-0 tracking-wide">
            date :
          </label>
          <input
            id="add-ach-date"
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="[mm/yyyy]"
            disabled={isSubmitting}
            data-ascii="skip"
            className="w-36 bg-transparent border-b border-white/60 focus:border-white focus:outline-none text-white px-1 py-0.5 font-mono text-sm placeholder:text-white/30"
          />
        </div>

        {/* Description Input */}
        <div className="flex items-baseline gap-2">
          <label htmlFor="add-ach-desc" className="shrink-0 tracking-wide">
            description :
          </label>
          <input
            id="add-ach-desc"
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Summary details"
            disabled={isSubmitting}
            data-ascii="skip"
            className="flex-1 bg-transparent border-b border-white/60 focus:border-white focus:outline-none text-white px-1 py-0.5 font-mono text-sm placeholder:text-white/30"
          />
        </div>

        {/* Weight Select */}
        <div className="flex items-center gap-2">
          <label htmlFor="add-ach-weight" className="shrink-0 tracking-wide">
            weight :
          </label>
          <div className="relative inline-block">
            <select
              id="add-ach-weight"
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

        {/* Featured Toggle */}
        <div className="flex items-center gap-2.5 pt-0.5">
          <label
            htmlFor="add-ach-featured"
            className="flex items-center gap-2 tracking-wide cursor-pointer select-none"
          >
            <input
              id="add-ach-featured"
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

        {/* Error Notice */}
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
            {isSubmitting ? "CREATING..." : "ADD ACHIEVEMENT"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddAchievementForm;
