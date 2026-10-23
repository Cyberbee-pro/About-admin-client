"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PdfViewer } from "@/components/PdfViewer";
import { getConfig } from "@/lib/api/configService";

export interface ConfigResumeCardProps {
  resumeUrl?: string;
  resumeDriveUrl?: string;
  onUpdateResumeUrl?: (newUrl: string) => void;
  onUploadResumeFile?: (file: File) => void;
  stagedFileName?: string;
  disabled?: boolean;
  editable?: boolean;
  previewHeight?: string | number;
  className?: string;
}

export function ConfigResumeCard({
  resumeUrl: propResumeUrl,
  resumeDriveUrl: propResumeDriveUrl,
  onUpdateResumeUrl,
  onUploadResumeFile,
  stagedFileName,
  disabled = false,
  editable,
  previewHeight = "230px",
  className = "",
}: ConfigResumeCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialUrl = propResumeUrl ?? propResumeDriveUrl;

  const [activeResumeUrl, setActiveResumeUrl] = useState<string>(initialUrl || "");
  const [prevInitialUrl, setPrevInitialUrl] = useState<string | undefined>(initialUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState<string>(initialUrl || "");

  // Determine whether editing features are active
  const isEditable = editable ?? Boolean(onUpdateResumeUrl || onUploadResumeFile);

  // Sync state if prop updates
  if (initialUrl !== prevInitialUrl) {
    setPrevInitialUrl(initialUrl);
    if (initialUrl !== undefined) {
      setActiveResumeUrl(initialUrl);
      setTempUrl(initialUrl);
    }
  }

  // Fetch from config API if no URL prop was provided
  useEffect(() => {
    if (initialUrl !== undefined) return;

    let isMounted = true;
    getConfig()
      .then((res) => {
        if (!isMounted) return;
        const fetchedUrl = res?.data?.resumeUrl || res?.data?.resumeDriveUrl || "";
        if (fetchedUrl) {
          setActiveResumeUrl(fetchedUrl);
          setTempUrl(fetchedUrl);
        }
      })
      .catch((err) => {
        console.warn("[ConfigResumeCard] Failed to fetch resume config:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [initialUrl]);

  const handleUploadClick = () => {
    if (disabled || !isEditable) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadResumeFile) {
      onUploadResumeFile(file);
    }
  };

  const handleSaveUrl = () => {
    if (onUpdateResumeUrl) {
      onUpdateResumeUrl(tempUrl);
    }
    setActiveResumeUrl(tempUrl);
    setIsEditingUrl(false);
  };

  return (
    <div
      className={`flex flex-col bg-eva-purple shadow-2xl border border-eva-purple/40 overflow-hidden w-full select-none ${className}`}
    >
      {/* Hidden File Input (Only in editable mode) */}
      {isEditable && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-eva-purple text-white">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <span className="font-exo2 text-2xl font-normal tracking-wide shrink-0">
            Resume.pdf
          </span>
          {isEditable && stagedFileName && (
            <span
              data-testid="resume-staged-badge"
              className="text-[10px] font-mono px-2 py-0.5 bg-[var(--eva-lime)]/20 text-[var(--eva-lime)] border border-[var(--eva-lime)]/50 rounded uppercase tracking-wider truncate max-w-[180px]"
            >
              {`[STAGED: ${stagedFileName}]`}
            </span>
          )}
        </div>

        {/* Action Triggers: Upload [↑] (if editable), Download [↓], External Link [↗] */}
        <div className="flex items-center gap-3">
          {/* Upload icon [↑] */}
          {isEditable && (
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
          )}

          {/* Download icon [↓] */}
          <a
            href={activeResumeUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            download
            title="Download resume document"
            className={`cursor-target p-1 hover:text-eva-lime hover:scale-110 active:scale-95 transition-all text-white/90 ${
              !activeResumeUrl || disabled ? "pointer-events-none opacity-40" : ""
            }`}
            aria-label="Download Resume"
          >
            <Image
              src="/eva dash/download_butt.svg"
              alt="Download Resume"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
          </a>

          {/* External Link icon [↗] */}
          <a
            href={activeResumeUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title="Open resume in Google Drive / external viewer"
            className={`cursor-target p-1 hover:text-eva-lime hover:scale-110 active:scale-95 transition-all text-white/90 ${
              !activeResumeUrl ? "pointer-events-none opacity-40" : ""
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

      {/* Body: Dedicated PDF Viewer */}
      <div className="relative w-full border-t border-white/10 bg-black/40">
        <PdfViewer fileUrl={activeResumeUrl} height={previewHeight} />
      </div>

      {/* Footer Bar: Editable Link Option (Only in editable mode) */}
      {isEditable && (
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
                  setTempUrl(activeResumeUrl);
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
                {activeResumeUrl || "NO DRIVE URL CONFIGURED"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempUrl(activeResumeUrl);
                  setIsEditingUrl(true);
                }}
                className="cursor-target text-[var(--eva-orange)] hover:text-white transition-colors text-[10px] uppercase tracking-wider"
              >
                [EDIT URL]
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ConfigResumeCard;
