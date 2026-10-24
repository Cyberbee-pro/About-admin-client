"use client";

import React from "react";
import { Skill } from "@/lib/api/types";
import { AsciiReveal, AsciiSkeleton } from "ascii-reveal";

export interface SkillsListProps {
  skills: Skill[];
  loading?: boolean;
  error?: string | null;
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
  onRetry?: () => void;
}

export function SkillsList({
  skills,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onRetry,
}: SkillsListProps) {
  return (
    <section aria-label="All Skills Section" className="w-full">
      <h2 className="font-exo2 text-white text-2xl sm:text-[26px] font-normal tracking-wide mb-3">
        All Skills
      </h2>

      <AsciiReveal loading={loading} revealOnMount={false} speed={0.7}>
        {loading ? (
          <div className="space-y-3 p-2 bg-black/40">
            <AsciiSkeleton lines={4} />
          </div>
        ) : error ? (
          <div
            data-ascii="surface"
            className="w-full p-5 text-center border border-dashed border-eva-red/60 bg-eva-red/10 text-eva-red font-mono text-xs uppercase tracking-wider"
          >
            <div className="font-bold mb-1">SYSTEM ERROR // FAILED TO RETRIEVE SKILLS</div>
            <div className="text-white/80 text-[11px] mb-3">{error}</div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                data-ascii="skip"
                className="px-3 py-1 border border-eva-red text-white hover:bg-eva-red/30 transition-colors uppercase text-xs cursor-pointer"
              >
                [RETRY CONNECTION]
              </button>
            )}
          </div>
        ) : skills.length === 0 ? (
          <div
            data-ascii="surface"
            className="w-full p-6 text-center border border-dashed border-white/20 bg-eva-charcoal/30 text-white/50 font-mono text-xs uppercase tracking-wider"
          >
            NO SKILLS RECORDED // USE FORM ABOVE TO INITIALIZE
          </div>
        ) : (
          <div className="max-h-[290px] overflow-y-auto eva-custom-scrollbar pr-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map((skill) => (
                <div
                  key={skill._id}
                  data-ascii="surface"
                  className="bg-[#7B47DC] hover:bg-[#8550e6] transition-colors p-2.5 sm:p-3 flex items-center justify-between text-white rounded-none select-none group min-h-[52px]"
                >
                  {/* Left: Logo & Skill Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center bg-black/20 overflow-hidden">
                      {skill.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={skill.logoUrl}
                          alt={skill.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-mono text-xs font-bold text-white/90">
                          {skill.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-exo2 text-white font-normal text-base sm:text-lg leading-tight truncate">
                        {skill.name}
                      </div>
                      {skill.type && (
                        <span className="font-mono text-[10px] text-white/70 uppercase">
                          [{skill.type}]
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Approved Additions (Edit & Delete controls) */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => onEdit(skill)}
                      aria-label={`Edit ${skill.name}`}
                      data-ascii="fade"
                      className="bg-[#1740A2] hover:bg-[#1f4dc2] text-white font-mono text-[11px] px-2 py-0.5 rounded-none transition-colors uppercase"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(skill)}
                      aria-label={`Delete ${skill.name}`}
                      data-ascii="fade"
                      className="bg-eva-red/90 hover:bg-eva-red text-white font-mono text-[11px] px-2 py-0.5 rounded-none transition-colors uppercase"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AsciiReveal>
    </section>
  );
}

export default SkillsList;
