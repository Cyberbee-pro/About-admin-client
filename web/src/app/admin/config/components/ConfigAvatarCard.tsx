"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { PfpItem } from "@/lib/api/types";

export interface ConfigAvatarCardProps {
  currentPfpUrl?: string;
  pfpHistory?: PfpItem[];
  onSetAsPfp: (pfpItem: PfpItem) => Promise<void> | void;
  onUploadNewPfp: (file: File) => Promise<void> | void;
  disabled?: boolean;
}

export function ConfigAvatarCard({
  currentPfpUrl,
  pfpHistory = [],
  onSetAsPfp,
  onUploadNewPfp,
  disabled = false,
}: ConfigAvatarCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSettingPfp, setIsSettingPfp] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Synthesize history list if empty or single item
  const displayList: PfpItem[] =
    pfpHistory.length > 0
      ? pfpHistory
      : currentPfpUrl
      ? [{ url: currentPfpUrl, publicId: "default_active", uploadedAt: new Date().toISOString() }]
      : [
          {
            url: "/eva dash/eva no back.png",
            publicId: "pfp1",
            uploadedAt: new Date().toISOString(),
          },
        ];

  // Sync selected index when pfpHistory or currentPfpUrl updates
  useEffect(() => {
    if (currentPfpUrl) {
      const idx = displayList.findIndex((item) => item.url === currentPfpUrl);
      if (idx !== -1) {
        setSelectedIndex(idx);
      }
    }
  }, [currentPfpUrl, displayList.length]);

  const currentItem = displayList[selectedIndex] || displayList[0];

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
        <Image
          src="/eva dash/pic_frame.svg"
          alt="Pilot Frame"
          width={187}
          height={198}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
          priority
        />

        {/* Inner Content Area Inset cleanly */}
        <div className="absolute top-[6.5%] left-[7%] w-[78%] h-[80%] bg-white z-0 overflow-hidden flex items-center justify-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-black/70 font-mono text-xs">
              <span className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>TRANSMITTING...</span>
            </div>
          ) : currentItem?.url && currentItem.url !== "/eva dash/eva no back.png" ? (
            <img
              src={currentItem.url}
              alt="Pilot Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to stylized SVG if external image fails
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            /* Manga Character Line Art matching uploaded screenshot */
            <div className="w-full h-full bg-white flex flex-col items-center justify-center relative p-3">
              <svg
                className="w-full h-full text-black"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M50 15 C38 15 28 26 28 40 C28 50 33 58 40 64 L40 76 L60 76 L60 64 C67 58 72 50 72 40 C72 26 62 15 50 15 Z"
                  fill="none"
                />
                <path d="M35 38 Q42 34 48 38" stroke="currentColor" strokeWidth="2.5" />
                <path d="M52 38 Q58 34 65 38" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="43" cy="45" r="3.5" fill="black" />
                <circle cx="57" cy="45" r="3.5" fill="black" />
                <path d="M47 52 L50 56 L53 52" stroke="currentColor" strokeWidth="1.5" />
                <path d="M42 63 Q50 67 58 63" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M28 35 Q20 25 32 18 Q38 10 50 12 Q62 10 68 18 Q80 25 72 35"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path d="M20 78 L80 78 L85 95 L15 95 Z" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M36 70 L26 88 M64 70 L74 88" stroke="currentColor" strokeWidth="2.5" />
              </svg>
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

        {/* Download Icon [↓] */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={disabled || !currentItem?.url}
          className="cursor-target p-1 hover:text-eva-lime active:scale-95 transition-all"
          title="Download / View full avatar"
          aria-label="Download Current Avatar"
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

export default ConfigAvatarCard;