"use client";

import React, { useRef, useState } from "react";
import { AsciiSkeleton } from "ascii-reveal";

export interface CertificateUploadBoxProps {
  variant?: "purple" | "orange";
  currentUrl?: string;
  selectedFile?: File | null;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
}

export function CertificateUploadBox({
  variant = "purple",
  currentUrl,
  selectedFile,
  onFileSelect,
  disabled = false,
  isUploading = false,
  className = "",
}: CertificateUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const displayImage = localPreview || currentUrl;

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayImage) {
      window.open(displayImage, "_blank", "noopener,noreferrer");
    }
  };

  const isPurple = variant === "purple";
  const bgClass = isPurple
    ? "bg-[#7B47DC] hover:bg-[#8550e6]"
    : "bg-[#e6770b] hover:bg-[#cf6a09]";

  return (
    <div
      data-ascii="surface"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload certificate media"
      onClick={handleClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full max-w-[320px] sm:max-w-[360px] h-[150px] sm:h-[165px] ${bgClass} transition-colors border ${
        isDragOver ? "border-eva-lime border-dashed" : "border-transparent"
      } flex flex-col items-center justify-center p-3 text-center cursor-pointer select-none overflow-hidden shrink-0 ${className} ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        data-ascii="skip"
      />

      {/* Top-Right External Link Icon */}
      {isPurple && (
        <button
          type="button"
          onClick={handleExternalLink}
          disabled={!displayImage}
          aria-label={displayImage ? "View uploaded certificate file in new tab" : "No certificate file to view"}
          className={`absolute top-2.5 right-2.5 z-20 transition-colors ${
            displayImage ? "text-white hover:text-eva-teal cursor-pointer" : "text-white/40 cursor-not-allowed"
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
      )}

      {isUploading ? (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2 z-30">
          <AsciiSkeleton variant="dither" rows={3} width={80} height={45} />
          <span className="text-[10px] font-mono text-eva-lime mt-1 tracking-wider uppercase">
            TRANSMITTING MEDIA...
          </span>
        </div>
      ) : (
        <>
          {displayImage && (
            <div className="absolute inset-0 flex items-center justify-center p-2 opacity-35 pointer-events-none z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="Certificate media preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
            {/* Icons: In Orange Drawer, show upload arrow + image placeholder side-by-side as in Cert 2 */}
            {variant === "orange" ? (
              <div className="flex items-center gap-3.5 mb-1.5 text-white">
                <svg
                  className="w-7 h-7 stroke-[2.2]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M12 15V4m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17v2a1.5 1.5 0 001.5 1.5h13a1.5 1.5 0 001.5-1.5v-2" strokeLinecap="round" strokeLinejoin="round" />
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
                <path d="M12 15V4m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 17v2a1.5 1.5 0 001.5 1.5h13a1.5 1.5 0 001.5-1.5v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}

            <span className="text-xs sm:text-sm font-mono text-white leading-tight font-normal">
              Drag and drop or click to upload
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default CertificateUploadBox;
