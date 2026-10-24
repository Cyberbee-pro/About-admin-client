"use client";

import React from "react";
import { Achievement } from "@/lib/api/types";
import { AsciiReveal, AsciiSkeleton } from "ascii-reveal";

export interface AchievementsListProps {
  achievements: Achievement[];
  loading?: boolean;
  onEdit: (achievement: Achievement) => void;
  onDelete: (achievement: Achievement) => void;
}

export function AchievementsList({
  achievements,
  loading = false,
  onEdit,
  onDelete,
}: AchievementsListProps) {
  return (
    <section aria-label="All Achievements Section" className="w-full">
      <h2 className="font-exo2 text-white text-2xl sm:text-[26px] font-normal tracking-wide mb-3">
        All Achievements
      </h2>

      <AsciiReveal loading={loading} revealOnMount={false} speed={0.7}>
        {loading ? (
          <div className="space-y-3 p-2 bg-black/40">
            <AsciiSkeleton lines={4} />
          </div>
        ) : achievements.length === 0 ? (
          <div
            data-ascii="surface"
            className="w-full p-6 text-center border border-dashed border-white/20 bg-eva-charcoal/30 text-white/50 font-mono text-xs uppercase tracking-wider"
          >
            NO ACHIEVEMENTS RECORDED // USE FORM ABOVE TO INITIALIZE
          </div>
        ) : (
          <div className="max-h-[290px] overflow-y-auto eva-custom-scrollbar pr-3 space-y-4">
            {achievements.map((ach) => (
              <div
                key={ach._id}
                data-ascii="surface"
                className="w-full text-white font-exo2 select-none group border-b border-white/10 pb-3 last:border-b-0"
              >
                {/* Line 1: title -----------------------------------date */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-exo2 text-base sm:text-lg font-normal text-white truncate max-w-[220px] sm:max-w-[280px]">
                    {ach.title}
                  </span>
                  <div className="flex-1 border-b border-dashed border-white/40 min-w-4" />
                  <span className="font-mono text-xs sm:text-sm text-white/90 shrink-0">
                    {ach.date}
                  </span>
                </div>

                {/* Line 2: description */}
                <p className="font-mono text-xs text-white/70 line-clamp-2 mt-1">
                  {ach.detail}
                </p>

                {/* Line 3: weight [] featured [] & Actions */}
                <div className="flex items-center justify-between text-xs font-mono text-white/80 mt-1.5">
                  <div className="flex items-center gap-3">
                    <span>weight [{ach.weight ?? 0}]</span>
                    <span>featured [{ach.featured ? "✓" : " "}]</span>
                  </div>

                  {/* Approved Additions: Edit & Delete controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEdit(ach)}
                      aria-label={`Edit ${ach.title}`}
                      data-ascii="fade"
                      className="bg-[#1740A2] hover:bg-[#1f4dc2] text-white font-mono text-[11px] px-2 py-0.5 rounded-none transition-colors uppercase"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(ach)}
                      aria-label={`Delete ${ach.title}`}
                      data-ascii="fade"
                      className="bg-eva-red/90 hover:bg-eva-red text-white font-mono text-[11px] px-2 py-0.5 rounded-none transition-colors uppercase"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AsciiReveal>
    </section>
  );
}

export default AchievementsList;
