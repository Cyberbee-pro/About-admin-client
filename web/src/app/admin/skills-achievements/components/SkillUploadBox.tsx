"use client";

import React, { useRef, useState } from "react";
import { AsciiSkeleton } from "ascii-reveal";

export interface SkillUploadBoxProps {
  currentUrl?: string;
  selectedFile?: File | null;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
}

export function SkillUploadBox({
  currentUrl,
  selectedFile,
  onFileSelect,
  disabled = false,
  isUploading = false,
  className = "",
}: SkillUploadBoxProps) {
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

  return (
    <div
      data-ascii="skip"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload skill logo"
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
      className={`relative w-[110px] sm:w-[130px] h-[100px] sm:h-[110px] bg-[#874807] hover:bg-[#99530a] transition-colors border ${
        isDragOver ? "border-eva-lime border-dashed" : "border-transparent"
      } flex flex-col items-center justify-center p-2 text-center cursor-pointer select-none overflow-hidden shrink-0 ${className} ${
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

      {isUploading ? (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2 z-20">
          <AsciiSkeleton variant="dither" rows={3} width={70} height={40} />
          <span className="text-[10px] font-mono text-eva-lime mt-1 tracking-wider uppercase">
            UPLOADING
          </span>
        </div>
      ) : (
        <>
          {displayImage && (
            <div className="absolute inset-0 flex items-center justify-center p-2 opacity-35 pointer-events-none z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="Logo preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
            {/* Upload Icon from wireframe: Arrow up with tray */}
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[2.2] mb-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M12 15V4m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 17v2a1.5 1.5 0 001.5 1.5h13a1.5 1.5 0 001.5-1.5v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <span className="text-[11px] sm:text-xs font-mono text-white leading-tight font-normal">
              Drag and drop
              <br />
              or click to
              <br />
              upload
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default SkillUploadBox;
