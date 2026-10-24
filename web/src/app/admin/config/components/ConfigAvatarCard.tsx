"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { AsciiReveal, AsciiSkeleton } from "ascii-reveal";
import { PfpItem } from "@/lib/api/types";

export interface ConfigAvatarCardProps {
  currentPfpUrl?: string;
  pfpUrl?: string;
  pfpHistory?: PfpItem[];
  onSetAsPfp: (pfpItem: PfpItem) => Promise<void> | void;
  onUploadNewPfp: (file: File) => Promise<void> | void;
  disabled?: boolean;
}

export function ConfigAvatarCard({
  currentPfpUrl,
  pfpUrl,
  pfpHistory = [],
  onSetAsPfp,
  onUploadNewPfp,
  disabled = false,
}: ConfigAvatarCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSettingPfp, setIsSettingPfp] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});

  const activePfpUrl = pfpUrl !== undefined ? pfpUrl : currentPfpUrl;
  const hasValidPfp = Boolean(activePfpUrl && activePfpUrl.trim() !== "");

  // Synthesize history list if empty or single item
  const displayList: PfpItem[] =
    pfpHistory.length > 0
      ? pfpHistory
      : hasValidPfp
      ? [
          {
            url: activePfpUrl!.trim(),
            publicId: "default_active",
            uploadedAt: new Date().toISOString(),
          },
        ]
      : [
          {
            url: "",
            publicId: "pfp1",
            uploadedAt: new Date().toISOString(),
          },
        ];

  // Adjust selectedIndex when activePfpUrl updates without cascading renders
  const [prevActiveUrl, setPrevActiveUrl] = useState<string | undefined>(undefined);
  if (activePfpUrl !== prevActiveUrl) {
    setPrevActiveUrl(activePfpUrl);
    if (activePfpUrl) {
      const idx = displayList.findIndex((item) => item.url === activePfpUrl);
      if (idx !== -1) {
        setSelectedIndex(idx);
      }
    }
  }

  const currentItem = displayList[selectedIndex] || displayList[0];
  const hasDisplayUrl = Boolean(
    currentItem?.url &&
      currentItem.url.trim() !== "" &&
      currentItem.url !== "/eva dash/eva no back.png" &&
      !brokenUrls[currentItem.url]
  );

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + displayList.length) % displayList.length);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % displayList.length);
  };

  const handleUploadClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await onUploadNewPfp(file);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleSetAsPfp = async () => {
    if (!currentItem || disabled || isSettingPfp) return;
    setIsSettingPfp(true);
    try {
      await onSetAsPfp(currentItem);
    } finally {
      setIsSettingPfp(false);
    }
  };

  const handleDownload = () => {
    if (!currentItem?.url) return;
    window.open(currentItem.url, "_blank", "noopener,noreferrer");
  };

  // Human-readable file name label like "pfp1.jpg", "pfp2.jpg"
  const fileNameLabel = `pfp${selectedIndex + 1}.jpg`;

  return (
    <div className="flex flex-col items-center w-full max-w-[280px] sm:max-w-[300px] select-none gap-3">
      {/* Hidden File Input for Avatar Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Frame Container matching pic_frame.svg */}
      <div className="relative w-full aspect-[187/198] shadow-2xl">
        {/* Frame SVG Graphic */}
        <AsciiReveal preset="terminal" duration="fast" speed={0.7} className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <Image
            src="/eva dash/pic_frame.svg"
            alt="Pilot Frame"
            width={187}
            height={198}
            className="w-full h-full object-fill pointer-events-none"
            priority
            data-ascii="media"
          />
        </AsciiReveal>

        {/* Inner Content Area Inset cleanly */}
        <div className="absolute top-[6.5%] left-[7%] w-[78%] h-[80%] bg-[#12121b] z-0 overflow-hidden flex items-center justify-center">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center p-3 text-center gap-2 text-[var(--eva-lime)] font-mono text-xs select-none">
              <AsciiSkeleton variant="terminal" rows={3} width="110px" height="36px" animate />
              <span className="tracking-widest text-[11px] text-white/80 animate-pulse">[PROCESSING_UPLOAD]</span>
            </div>
          ) : hasDisplayUrl ? (
            <AsciiReveal preset="terminal" duration="fast" speed={0.7} className="w-full h-full">
              <img
                src={currentItem.url}
                alt="Pilot Avatar"
                className="w-full h-full object-cover"
                onError={() => {
                  if (currentItem?.url) {
                    setBrokenUrls((prev) => ({ ...prev, [currentItem.url]: true }));
                  }
                }}
              />
            </AsciiReveal>
          ) : (
            <div
              className="w-full h-full bg-[#12121b] flex flex-col items-center justify-center p-3 text-center select-none gap-2"
              data-testid="no-pfp-placeholder"
            >
              <div className="opacity-35 pointer-events-none">
                <AsciiSkeleton variant="terminal" rows={4} width="90px" height="42px" animate={false} />
              </div>
              <span className="font-mono text-xs text-eva-text-muted tracking-wider">
                No pfp in db
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Carousel Selector Row: < pfp1.jpg >  [↑]  [↓] */}
      <div className="flex items-center justify-between w-full px-2 text-white font-exo2 text-lg">
        {/* Left Arrow Button < */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={displayList.length <= 1 || disabled}
          className="cursor-target px-2 py-1 hover:text-eva-lime active:scale-95 transition-all text-xl font-bold disabled:opacity-30"
          title="Previous profile picture"
          aria-label="Previous Avatar"
        >
          &lt;
        </button>

        {/* Current Filename Label */}
        <span className="font-normal tracking-wide text-white/95">
          {fileNameLabel}
        </span>

        {/* Right Arrow Button > */}
        <button
          type="button"
          onClick={handleNext}
          disabled={displayList.length <= 1 || disabled}
          className="cursor-target px-2 py-1 hover:text-eva-lime active:scale-95 transition-all text-xl font-bold disabled:opacity-30"
          title="Next profile picture"
          aria-label="Next Avatar"
        >
          &gt;
        </button>

        {/* Upload Icon [↑] */}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={disabled || isUploading}
          className="cursor-target p-1 hover:text-eva-lime active:scale-95 transition-all ml-1"
          title="Upload new avatar image"
          aria-label="Upload New Avatar"
        >
          <AsciiReveal as="span" preset="terminal" duration="fast" speed={0.7} className="inline-flex items-center">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-ascii="media"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </AsciiReveal>
        </button>

        {/* Download Icon [↓] */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={disabled || !currentItem?.url}
          className="cursor-target p-1 hover:text-eva-lime active:scale-95 transition-all"
          title="Download / View full avatar"
          aria-label="Download Current Avatar"
        >
          <AsciiReveal as="span" preset="terminal" duration="fast" speed={0.7} className="inline-flex items-center">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-ascii="media"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </AsciiReveal>
        </button>
      </div>

      {/* Blue "Set as pfp" Action Button matching screenshot */}
      <button
        type="button"
        onClick={handleSetAsPfp}
        disabled={disabled || isSettingPfp}
        className="cursor-target w-full py-2.5 px-4 bg-[#0044cc] hover:bg-[#1a56db] active:bg-[#0033aa] text-white font-exo2 text-lg font-normal tracking-wide text-center transition-all duration-200 shadow-md shadow-blue-900/50 rounded-none disabled:opacity-50"
      >
        {isSettingPfp ? "SETTING..." : "Set as pfp"}
      </button>
    </div>
  );
}

export const ConfigPfpCard = ConfigAvatarCard;
export default ConfigAvatarCard;