"use client";

import React, { useRef, useState, useEffect } from "react";

export interface ConfigResumeCardProps {
  resumeUrl: string;
  onUpdateResumeUrl: (newUrl: string) => void;
  onUploadResumeFile?: (file: File) => void;
  stagedFileName?: string;
  disabled?: boolean;
}

export function ConfigResumeCard({
  resumeUrl,
  onUpdateResumeUrl,
  onUploadResumeFile,
  stagedFileName,
  disabled = false,
}: ConfigResumeCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState(resumeUrl);

  useEffect(() => {
    setTempUrl(resumeUrl);
  }, [resumeUrl]);

  const handleUploadClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadResumeFile) {
      onUploadResumeFile(file);
    }
  };

  const handleSaveUrl = () => {
    onUpdateResumeUrl(tempUrl);
    setIsEditingUrl(false);
  };

  const handleDownload = () => {
    if (!resumeUrl) return;
    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col bg-eva-purple shadow-2xl border border-eva-purple/40 overflow-hidden w-full max-w-[480px] select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-eva-purple text-white">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <span className="font-exo2 text-2xl font-normal tracking-wide shrink-0">
            Resume.pdf
          </span>
          {stagedFileName && (
            <span
              data-testid="resume-staged-badge"
              className="text-[10px] font-mono px-2 py-0.5 bg-[var(--eva-lime)]/20 text-[var(--eva-lime)] border border-[var(--eva-lime)]/50 rounded uppercase tracking-wider truncate max-w-[180px]"
            >
              {`[STAGED: ${stagedFileName}]`}
            </span>
          )}
        </div>

        {/* 3 Action Triggers: Upload [↑], Download [↓], External Link [↗] */}
        <div className="flex items-center gap-3">
          {/* Upload icon [↑] */}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={disabled}
            title="Upload new resume document"
            className="cursor-target p-1 hover:text-eva-lime hover:scale-110 active:scale-95 transition-all text-white/90"
            aria-label="Upload Resume"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>

          {/* Download icon [↓] */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!resumeUrl || disabled}
            title="Download resume document"
            className="cursor-target p-1 hover:text-eva-lime hover:scale-110 active:scale-95 transition-all text-white/90 disabled:opacity-40"
            aria-label="Download Resume"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          {/* External Link icon [↗] */}
          <a
            href={resumeUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title="Open resume in Google Drive / external viewer"
            className={`cursor-target p-1 hover:text-eva-lime hover:scale-110 active:scale-95 transition-all text-white/90 ${
              !resumeUrl ? "pointer-events-none opacity-40" : ""
            }`}
            aria-label="Open Resume in new tab"
          >
            <svg
              className="w-5 h-5"
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
        </div>
      </div>

      {/* Body: Document Preview Sheet matching screenshot */}
      <div className="bg-white text-black p-4 font-sans text-[10px] sm:text-xs leading-snug select-text h-[190px] overflow-hidden relative shadow-inner">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-black/20 pb-2 mb-2">
          <div>
            <div className="font-semibold text-gray-800 text-[9px] uppercase tracking-wider">
              College Address:
            </div>
            <div className="text-gray-600 text-[8px] leading-tight">
              S.R.M Nagar, Potheri,<br />
              Chengalpattu District,<br />
              Tamil Nadu, 603203,<br />
              India
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xs uppercase tracking-wide text-gray-900">
              SHIBRAJ DAS
            </div>
            <div className="text-blue-700 underline text-[8px]">
              cyb.shibrajdas@gmail.com
            </div>
            <div className="text-blue-700 underline text-[8px]">
              linkedin.com/in/shibraj-das
            </div>
            <div className="text-blue-700 underline text-[8px]">
              github.com/Cyberbee-pro
            </div>
            <div className="text-gray-700 font-mono text-[8px]">
              (+91) 84206-07640
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div className="space-y-1">
          <div className="font-bold uppercase text-[9px] tracking-wider text-gray-900 border-b border-gray-300 pb-0.5">
            Education
          </div>
          <div className="flex justify-between items-baseline text-[8px]">
            <span className="font-semibold text-gray-800">
              S.R.M INSTITUTE OF SCIENCE AND TECHNOLOGY
            </span>
            <span className="text-gray-500 font-mono">2021–2025</span>
          </div>
          <div className="text-[7.5px] text-gray-600">
            Bachelor of Technology in C.S.E. Core
          </div>
          <div className="text-[7.5px] text-gray-700 pl-2 border-l border-gray-400">
            • Secured one internship and consultancy within first year of enrollment.<br />
            • Attended 5+ tech workshops and placed in ICPC qualifiers and national hackathons.
          </div>
        </div>

        {/* Subtle Fade at Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* Footer Bar: Editable Link Option */}
      <div className="px-3 py-2 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs font-mono">
        {isEditingUrl ? (
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              name="resume-url"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-form-type="other"
              data-1p-ignore="true"
              data-lpignore="true"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="cursor-target bg-transparent border-b border-[var(--eva-lime)] text-white text-xs font-mono flex-1 outline-none px-1 py-0.5"
            />
            <button
              type="button"
              onClick={handleSaveUrl}
              className="cursor-target text-[var(--eva-lime)] hover:underline"
            >
              SAVE
            </button>
            <button
              type="button"
              onClick={() => {
                setTempUrl(resumeUrl);
                setIsEditingUrl(false);
              }}
              className="cursor-target text-white/50 hover:underline"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="truncate max-w-[280px] text-white/60 text-[10px]">
              {resumeUrl || "NO DRIVE URL CONFIGURED"}
            </span>
            <button
              type="button"
              onClick={() => {
                setTempUrl(resumeUrl);
                setIsEditingUrl(true);
              }}
              className="cursor-target text-[var(--eva-orange)] hover:text-white transition-colors text-[10px] uppercase tracking-wider"
            >
              [EDIT URL]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfigResumeCard;