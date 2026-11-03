"use client";

import React, { useRef, useState } from "react";
import { AsciiSkeleton } from "ascii-reveal";

export type UploadTabKey = "icon" | "cert" | "media";

export interface UploadTabItem {
  key: UploadTabKey;
  label: string;
  badge?: number;
}

export interface CertificateUploadBoxProps {
  variant?: "purple" | "orange" | "blue";
  currentUrl?: string;
  selectedFile?: File | null;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;

  // Tabbed extensions for Experiences
  tabs?: UploadTabItem[];
  activeTab?: UploadTabKey;
  onTabChange?: (tab: UploadTabKey) => void;
  stagedFiles?: File[];
  existingUrls?: string[];
  onAddFiles?: (files: File[]) => void;
  onRemoveStagedFile?: (index: number) => void;
  readOnlyNote?: string;
  uploadError?: string | null;
}

export function CertificateUploadBox({
  variant = "purple",
  currentUrl,
  selectedFile,
  onFileSelect,
  disabled = false,
  isUploading = false,
  className = "",
  // Tabbed props
  tabs,
  activeTab = "icon",
  onTabChange,
  stagedFiles = [],
  existingUrls = [],
  onAddFiles,
  onRemoveStagedFile,
  readOnlyNote,
  uploadError,
}: CertificateUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const isTabbed = Boolean(tabs && tabs.length > 0);

  // Single-file local preview (for non-tabbed usage)
  const localPreview = React.useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  React.useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  // Object URLs for staged multiple files (for tabbed usage)
  const stagedObjectUrls = React.useMemo(() => {
    if (!stagedFiles || stagedFiles.length === 0) return [];
    return stagedFiles.map((f) => URL.createObjectURL(f));
  }, [stagedFiles]);

  React.useEffect(() => {
    return () => {
      stagedObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [stagedObjectUrls]);

  // Determine the display target for the top-right external link icon
  const displayImage = React.useMemo(() => {
    if (!isTabbed) {
      return localPreview || currentUrl || null;
    }
    // In tabbed mode: most recent staged file, or most recent existing URL
    if (stagedObjectUrls.length > 0) {
      return stagedObjectUrls[stagedObjectUrls.length - 1];
    }
    if (existingUrls.length > 0) {
      return existingUrls[existingUrls.length - 1];
    }
    return null;
  }, [isTabbed, localPreview, currentUrl, stagedObjectUrls, existingUrls]);

  const isUploadDisabled = disabled || Boolean(readOnlyNote);

  const handleClick = () => {
    if (!isUploadDisabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploadDisabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploadDisabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (droppedFiles.length === 0) return;

      if (isTabbed && onAddFiles) {
        onAddFiles(droppedFiles);
      } else if (onFileSelect) {
        onFileSelect(droppedFiles[0]);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (selected.length === 0) return;

      if (isTabbed && onAddFiles) {
        onAddFiles(selected);
      } else if (onFileSelect) {
        onFileSelect(selected[0]);
      }
      // Reset input so same file can be re-selected if removed
      e.target.value = "";
    }
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayImage) {
      window.open(displayImage, "_blank", "noopener,noreferrer");
    }
  };

  const bgClass =
    variant === "blue"
      ? "bg-[#1740A2] hover:bg-[#1c4cc4]"
      : variant === "orange"
      ? "bg-[#e6770b] hover:bg-[#cf6a09]"
      : "bg-[#7B47DC] hover:bg-[#8550e6]";

  const multipleAllowed = isTabbed && activeTab !== "icon";

  return (
    <div className={`flex flex-col w-full max-w-[320px] sm:max-w-[360px] shrink-0 ${className}`}>
      {/* 1. Upload Tabs across the top (when tabs provided) */}
      {isTabbed && tabs && (
        <div className="flex w-full select-none" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            let tabBg = "";
            let tabText = "";

            if (tab.key === "icon") {
              tabBg = isActive ? "bg-[#e6770b]" : "bg-[#8a4200] hover:bg-[#b05500]";
              tabText = "text-white";
            } else if (tab.key === "cert") {
              tabBg = isActive ? "bg-[#6bffb6]" : "bg-[#2d7350] hover:bg-[#3d996b]";
              tabText = isActive ? "text-black" : "text-white";
            } else if (tab.key === "media") {
              tabBg = isActive ? "bg-[#8B0000]" : "bg-[#4a0000] hover:bg-[#660000]";
              tabText = "text-white";
            }

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-ascii="fade"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onTabChange?.(tab.key);
                }}
                className={`flex-1 py-1 px-2 font-exo2 text-xs sm:text-sm font-bold text-center tracking-wide transition-colors cursor-pointer ${tabBg} ${tabText}`}
              >
                {tab.label}
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span className="ml-1 text-[10px] opacity-90 font-mono">
                    ({tab.badge})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Main Upload Box Container */}
      <div
        data-ascii="surface"
        role="button"
        tabIndex={isUploadDisabled ? -1 : 0}
        aria-label={isTabbed ? `Upload ${activeTab} media` : "Upload certificate media"}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if ((e.key === "Enter" || e.key === " ") && !isUploadDisabled) {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full h-[150px] sm:h-[165px] ${bgClass} transition-colors border ${
          isDragOver ? "border-eva-lime border-dashed" : "border-transparent"
        } flex flex-col items-center justify-center p-3 text-center cursor-pointer select-none overflow-hidden shrink-0 ${
          isUploadDisabled ? "opacity-75 cursor-default" : ""
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multipleAllowed}
          onChange={handleChange}
          disabled={isUploadDisabled}
          className="hidden"
          data-ascii="skip"
        />

        {/* Top-Right External Link Icon */}
        <button
          type="button"
          onClick={handleExternalLink}
          disabled={!displayImage}
          aria-label={
            displayImage
              ? "View latest uploaded file in new tab"
              : "No media file to view"
          }
          className={`absolute top-2.5 right-2.5 z-20 transition-colors ${
            displayImage
              ? "text-white hover:text-eva-teal cursor-pointer"
              : "text-white/40 cursor-not-allowed"
          }`}
        >
          <svg
            className="w-4 h-4"
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

        {isUploading ? (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2 z-30">
            <AsciiSkeleton variant="dither" rows={3} width={80} height={45} />
            <span className="text-[10px] font-mono text-eva-lime mt-1 tracking-wider uppercase">
              TRANSMITTING MEDIA...
            </span>
          </div>
        ) : (
          <>
            {/* Background Preview when single image exists */}
            {!isTabbed && displayImage && (
              <div className="absolute inset-0 flex items-center justify-center p-2 opacity-35 pointer-events-none z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImage}
                  alt="Media preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Read-only notification note (e.g. non-first position Icon or existing position) */}
            {readOnlyNote ? (
              <div className="relative z-10 flex flex-col items-center justify-center px-4">
                <span className="text-white/80 font-mono text-xs leading-relaxed max-w-[280px]">
                  {readOnlyNote}
                </span>
                {displayImage && (
                  <div className="mt-2 w-12 h-12 border border-white/40 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImage}
                      alt="Current preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                {/* Visual Icons: dual upload & image for orange variant, single arrow for purple / blue */}
                {variant === "orange" ? (
                  <div className="flex items-center gap-3.5 mb-1.5 text-white">
                    <svg
                      className="w-7 h-7 stroke-[2.2]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M12 15V4m0 0l-4 4m4-4l4 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 17v2a1.5 1.5 0 001.5 1.5h13a1.5 1.5 0 001.5-1.5v-2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <svg
                      className="w-8 h-8 fill-current opacity-90"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                    </svg>
                  </div>
                ) : (
                  <svg
                    className="w-8 h-8 text-white stroke-[2.2] mb-1.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M12 15V4m0 0l-4 4m4-4l4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 17v2a1.5 1.5 0 001.5 1.5h13a1.5 1.5 0 001.5-1.5v-2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                <span className="text-xs sm:text-sm font-mono text-white leading-tight font-normal">
                  Drag and drop or click to upload
                </span>

                {/* Staged previews row in tabbed mode */}
                {isTabbed && (stagedObjectUrls.length > 0 || existingUrls.length > 0) && (
                  <div
                    className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap max-w-[290px] pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Existing URLs preview */}
                    {existingUrls.map((url, idx) => (
                      <div
                        key={`exist-${idx}`}
                        className="relative w-8 h-8 bg-black/50 border border-white/40 overflow-hidden shrink-0"
                        title="Saved asset on server"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Existing asset ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}

                    {/* Staged local files preview */}
                    {stagedObjectUrls.map((url, idx) => (
                      <div
                        key={`staged-${idx}`}
                        className="relative w-8 h-8 bg-black/60 border border-eva-lime overflow-hidden shrink-0 group"
                        title={stagedFiles[idx]?.name || "Staged asset"}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Staged asset ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {onRemoveStagedFile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveStagedFile(idx);
                            }}
                            aria-label={`Remove staged file ${idx + 1}`}
                            className="absolute -top-0.5 -right-0.5 bg-eva-red text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center font-bold cursor-pointer opacity-90 hover:opacity-100"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Upload error banner if any */}
        {uploadError && (
          <div
            role="alert"
            className="absolute bottom-1 inset-x-2 bg-eva-red/90 text-white font-mono text-[10px] py-0.5 px-1 truncate z-30"
          >
            ERR: {uploadError}
          </div>
        )}
      </div>
    </div>
  );
}

export default CertificateUploadBox;
