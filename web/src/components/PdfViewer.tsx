"use client";

import React, { useRef } from "react";
import { Viewer, Worker, type DocumentLoadEvent } from "@react-pdf-viewer/core";
import { AsciiSkeleton } from "ascii-reveal";

export interface PdfViewerProps {
  fileUrl: string;
  workerUrl?: string;
  className?: string;
  height?: number | string;
  onDocumentLoad?: (e: DocumentLoadEvent) => void;
}

const DEFAULT_WORKER_URL = "https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js";

export function PdfViewer({
  fileUrl,
  workerUrl = DEFAULT_WORKER_URL,
  className = "",
  height = "450px",
  onDocumentLoad: onDocumentLoadProp,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDocumentLoad = (e: DocumentLoadEvent) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    if (onDocumentLoadProp) {
      onDocumentLoadProp(e);
    }
  };

  const containerHeight = typeof height === "number" ? `${height}px` : height;

  if (!fileUrl || !fileUrl.trim()) {
    return (
      <div
        ref={containerRef}
        data-testid="pdf-viewer-container"
        className={`relative w-full bg-black/80 flex items-center justify-center p-4 text-white/50 font-mono text-xs border border-white/10 ${className}`}
        style={{ height: containerHeight, overflowY: "auto" }}
      >
        <div className="flex flex-col items-center gap-2 text-center select-none">
          <span className="text-[var(--eva-lime)] font-bold tracking-widest">[STANDBY]</span>
          <span className="tracking-wider">NO PDF DOCUMENT LOADED</span>
          <div className="opacity-40 mt-1 pointer-events-none">
            <AsciiSkeleton variant="terminal" lines={2} widths={["160px", "100px"]} animate={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="pdf-viewer-container"
      className={`relative w-full bg-[#111115] overflow-y-auto ${className}`}
      style={{ height: containerHeight, overflowY: "auto" }}
    >
      <Worker workerUrl={workerUrl}>
        <Viewer
          fileUrl={fileUrl}
          onDocumentLoad={handleDocumentLoad}
          renderLoader={(percentages: number) => (
            <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-white/70 font-mono text-xs gap-2 p-4 text-center select-none">
              <AsciiSkeleton variant="terminal" lines={2} widths={["140px", "90px"]} animate />
              <span className="text-[11px] tracking-wider text-[var(--eva-lime,#39ff14)] mt-1">
                INITIALIZING VIEWER // {Math.round(percentages)}%
              </span>
            </div>
          )}
          renderError={(error) => (
            <div className="flex flex-col items-center justify-center h-full min-h-[160px] p-6 text-center font-mono text-xs gap-3">
              <span className="text-[#ff9900] font-bold tracking-widest text-sm">
                [PREVIEW UNAVAILABLE]
              </span>
              <span className="text-white/60 text-[11px] max-w-xs leading-relaxed">
                {error.message || "Failed to load document stream directly."}
              </span>
              <span className="text-[10px] text-white/40 tracking-wider">
                USE [↓] OR [↗] TO VIEW IN BROWSER
              </span>
            </div>
          )}
        />
      </Worker>
    </div>
  );
}

export default PdfViewer;
