"use client";

import React from "react";
import { Certificate } from "@/lib/api/types";
import { AsciiReveal, AsciiSkeleton } from "ascii-reveal";
import { formatCertificateDate, isValidCredentialUrl } from "../utils";

export interface CertificatesGridProps {
  certificates: Certificate[];
  loading?: boolean;
  error?: string | null;
  onEdit: (cert: Certificate) => void;
  onDelete: (cert: Certificate) => void;
  onRetry?: () => void;
}

export function CertificatesGrid({
  certificates,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onRetry,
}: CertificatesGridProps) {
  return (
    <section aria-label="Past Certificates Section" className="w-full">
      <h2 className="font-exo2 text-white text-2xl sm:text-[28px] font-normal tracking-wide mb-4">
        Past Certificates
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
            <div className="font-bold mb-1">SYSTEM ERROR // FAILED TO RETRIEVE CERTIFICATES</div>
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
        ) : certificates.length === 0 ? (
          <div
            data-ascii="surface"
            className="w-full p-8 text-center border border-dashed border-white/20 bg-eva-charcoal/30 text-white/50 font-mono text-xs uppercase tracking-wider"
          >
            NO CERTIFICATES RECORDED // USE FORM ABOVE TO INITIALIZE
          </div>
        ) : (
          <div className="max-h-[340px] overflow-y-auto eva-custom-scrollbar pr-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {certificates.map((cert) => {
                const hasValidLink = isValidCredentialUrl(cert.link);

                return (
                  <div
                    key={cert._id}
                    data-ascii="surface"
                    className="relative bg-[#7B47DC] hover:bg-[#8550e6] transition-colors p-3.5 sm:p-4 text-white flex flex-col justify-between select-none group min-h-[160px] sm:min-h-[175px]"
                  >
                    {/* Top Row: Approved Additions (Edit & Delete buttons) */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="font-mono text-[10px] text-white/70 uppercase tracking-wider">
                        LV.{cert.weight || 1}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 z-10">
                        <button
                          type="button"
                          onClick={() => onEdit(cert)}
                          aria-label={`Edit ${cert.title}`}
                          data-ascii="fade"
                          className="bg-[#1740A2] hover:bg-[#1f4dc2] text-white font-mono text-[11px] px-2.5 py-0.5 transition-colors uppercase cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(cert)}
                          aria-label={`Delete ${cert.title}`}
                          data-ascii="fade"
                          className="bg-eva-red/90 hover:bg-eva-red text-white font-mono text-[11px] px-2 py-0.5 transition-colors uppercase cursor-pointer"
                        >
                          Del
                        </button>
                      </div>
                    </div>

                    {/* Center: Image or Placeholder Icon */}
                    <div className="flex-1 flex items-center justify-center my-1 overflow-hidden min-h-[60px]">
                      {cert.mediaUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={cert.mediaUrl}
                          alt={cert.title}
                          className="max-h-20 sm:max-h-24 w-auto max-w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <svg
                          className="w-12 h-12 sm:w-14 sm:h-14 text-black/50"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                        </svg>
                      )}
                    </div>

                    {/* Bottom Row: Caption on left, External link on right */}
                    <div className="flex items-end justify-between gap-3 mt-2 pt-1 border-t border-white/20">
                      <div className="min-w-0 flex-1 font-mono text-xs text-white leading-tight">
                        <div className="font-semibold truncate">{cert.title}</div>
                        <div className="text-white/80 text-[11px] truncate">{cert.organization}</div>
                        <div className="text-white/60 text-[10px]">{formatCertificateDate(cert.createdAt)}</div>
                      </div>

                      {/* External Link Icon */}
                      <div className="shrink-0">
                        {hasValidLink ? (
                          <a
                            href={cert.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open credential link for ${cert.title}`}
                            className="inline-flex text-white hover:text-eva-teal transition-colors p-1"
                          >
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="inline-flex text-white/30 p-1 cursor-not-allowed"
                            title="No credential URL provided"
                          >
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AsciiReveal>
    </section>
  );
}

export default CertificatesGrid;
