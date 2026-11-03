"use client";

import React from "react";
import { Experience } from "@/lib/api/types";
import { AsciiReveal, AsciiSkeleton } from "ascii-reveal";
import { getExperienceRowColor, getLatestPosition } from "../utils";

export interface ExperiencesGridProps {
  experiences: Experience[];
  loading?: boolean;
  error?: string | null;
  onEdit: (exp: Experience) => void;
  onDelete: (exp: Experience) => void;
  onRetry?: () => void;
}

export function ExperiencesGrid({
  experiences,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onRetry,
}: ExperiencesGridProps) {
  return (
    <section aria-label="Past Experiences Section" className="w-full">
      <h2 className="font-exo2 text-white text-2xl sm:text-[28px] font-normal tracking-wide mb-4">
        Past Experiences
      </h2>

      <AsciiReveal loading={loading} revealOnMount={false} speed={0.7}>
        {loading ? (
          <div className="space-y-3 p-4 bg-black/40">
            <AsciiSkeleton lines={5} />
          </div>
        ) : error ? (
          <div
            data-ascii="surface"
            className="w-full p-6 text-center border border-dashed border-eva-red/60 bg-eva-red/10 text-eva-red font-mono text-xs uppercase tracking-wider"
          >
            <div className="font-bold mb-1">
              SYSTEM ERROR // FAILED TO RETRIEVE EXPERIENCES
            </div>
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
        ) : experiences.length === 0 ? (
          <div
            data-ascii="surface"
            className="w-full p-8 text-center border border-dashed border-white/20 bg-eva-charcoal/30 text-white/50 font-mono text-xs uppercase tracking-wider"
          >
            NO EXPERIENCES RECORDED // USE FORM ABOVE TO INITIALIZE
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {experiences.map((exp) => {
              const rowColor = getExperienceRowColor(exp);
              const latestPos = getLatestPosition(exp);
              const isLime = rowColor === "lime";

              const cardBg = isLime
                ? "bg-[#B0DD09] hover:bg-[#beeb15]"
                : "bg-[#D9381E] hover:bg-[#e6472d]";

              return (
                <div
                  key={exp._id}
                  data-ascii="surface"
                  onClick={() => onEdit(exp)}
                  className={`relative ${cardBg} transition-colors px-4 py-3 text-black flex items-center justify-between select-none cursor-pointer group shadow-sm`}
                >
                  {/* Left: Organization Icon or Image Placeholder */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black/20 rounded shrink-0 flex items-center justify-center overflow-hidden">
                      {exp.iconUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={exp.iconUrl}
                          alt={exp.organization}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <svg
                          className="w-6 h-6 text-black/60"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                        </svg>
                      )}
                    </div>

                    {/* Center: Org | Latest_pos text in wireframe styling */}
                    <div className="font-exo2 font-bold text-base sm:text-lg tracking-wide truncate text-black flex items-baseline gap-1.5 min-w-0">
                      <span className="truncate">{exp.organization}</span>
                      <span className="font-normal text-black/70">|</span>
                      <span className="font-normal text-sm sm:text-base text-black/90 truncate">
                        {latestPos?.position || "Role"}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions: Delete button & External-link / Edit Icon */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(exp);
                      }}
                      aria-label={`Delete ${exp.organization}`}
                      data-ascii="fade"
                      className="bg-black/70 hover:bg-black text-white font-mono text-[11px] px-2 py-0.5 transition-colors uppercase cursor-pointer"
                    >
                      Del
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(exp);
                      }}
                      aria-label={`Edit ${exp.organization}`}
                      className="p-1 text-black hover:text-black/70 transition-colors"
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AsciiReveal>
    </section>
  );
}

export default ExperiencesGrid;
