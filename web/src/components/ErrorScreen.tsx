"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  ERROR_DEFINITIONS,
  getErrorDetails,
  resolveErrorBackground,
  type SupportedErrorCode,
  type ErrorDefinition,
} from "@/lib/errors";

export {
  ERROR_DEFINITIONS,
  getErrorDetails,
  resolveErrorBackground,
  type SupportedErrorCode,
  type ErrorDefinition,
};

export interface ErrorScreenProps {
  /**
   * HTTP error status code (e.g., 400, 401, 403, 404, 500, 502, 503, 504).
   * Defaults to 404.
   */
  code?: number | string;
  /**
   * Primary error title (Line 2). Defaults to Evangelion specification.
   */
  title?: string;
  /**
   * Descriptive message (Line 3). Defaults to Evangelion specification.
   */
  description?: string;
  /**
   * Custom background image override. If not supplied, resolves dynamically.
   */
  bgImage?: string;
  /**
   * Optional reset / retry handler for Next.js error boundaries.
   */
  reset?: () => void;
  /**
   * Destination URL for the navigation action button. Defaults to "/dashboard".
   */
  homeHref?: string;
  /**
   * Label for the navigation action button. Defaults to "Return to Dashboard".
   */
  homeText?: string;
  /**
   * Whether to display the return navigation button. Defaults to true.
   */
  showHomeButton?: boolean;
  /**
   * Optional additional CSS classes for root container.
   */
  className?: string;
  /**
   * Optional custom children to render below the error message.
   */
  children?: React.ReactNode;
}

export default function ErrorScreen({
  code = 404,
  title,
  description,
  bgImage: customBgImage,
  reset,
  homeHref = "/dashboard",
  homeText = "Return to Dashboard",
  showHomeButton = true,
  className = "",
  children,
}: ErrorScreenProps) {
  const errorInfo = getErrorDetails(code, title, description);
  const resolvedBgImage = customBgImage || errorInfo.bgImage;

  return (
    <main
      className={`relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#12121b] text-white selection:bg-[#B0DD09] selection:text-black ${className}`}
      data-testid="error-screen"
      data-error-code={errorInfo.code}
    >
      {/* Viewport Full-Cover Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 pointer-events-none"
        style={{ backgroundImage: `url('${resolvedBgImage}')` }}
        role="presentation"
        aria-hidden="true"
        data-testid="error-bg"
      />

      {/* Dark Legibility Overlay */}
      <div
        className="absolute inset-0 z-0 bg-black/55 backdrop-brightness-75 pointer-events-none"
        role="presentation"
        aria-hidden="true"
      />

      {/* Top Header / Status Indicator Bar */}
      <header className="relative z-10 w-full px-6 py-5 sm:px-10 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5577] animate-pulse shadow-[0_0_8px_#ff5577]" />
          <span className="font-exo2 font-semibold text-xs sm:text-sm tracking-[0.25em] text-[#ff5577] uppercase">
            NERV SYSTEM ALERT // CODE: {errorInfo.code}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-neutral-400">
          <span>MAGI_SYS: OFF-NOMINAL</span>
          <span className="text-neutral-600">|</span>
          <span>PROTOCOL_ERR</span>
        </div>
      </header>

      {/* Central Content Area */}
      <section className="relative z-10 flex-1 flex items-center px-6 sm:px-12 md:px-20 lg:px-28 py-10">
        <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-7 md:gap-9 max-w-4xl">
          {/* Circular Motif (ITZEUL.svg) Positioned to the Left of Text */}
          <div className="shrink-0 mt-1 sm:mt-2">
            <Image
              src="/common/ITZEUL.svg"
              alt="ITZEUL Circular Motif"
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain select-none drop-shadow-[0_0_20px_rgba(255,133,15,0.45)]"
              width={96}
              height={96}
              priority
              data-testid="itzeul-motif"
            />
          </div>

          {/* Typography Text Block */}
          <div className="flex flex-col text-left">
            {/* Line 1: Err [Code] : */}
            <span
              className="font-exo2 font-semibold text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-wider text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
              data-testid="error-code-line"
            >
              {`Err ${errorInfo.code} :`}
            </span>

            {/* Line 2: Error Title */}
            <h1
              className="font-exo2 font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-white mt-1 sm:mt-2 drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]"
              data-testid="error-title-line"
            >
              {errorInfo.title}
            </h1>

            {/* Line 3: Descriptive Message */}
            <p
              className="font-exo2 text-base sm:text-lg md:text-xl lg:text-2xl text-neutral-200 mt-2 sm:mt-4 leading-relaxed max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              data-testid="error-desc-line"
            >
              {errorInfo.description}
            </p>

            {/* Interactive Actions / Navigation */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
              {reset && (
                <button
                  type="button"
                  onClick={reset}
                  className="font-exo2 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase px-6 py-3 rounded-none bg-[#B0DD09] text-black hover:bg-[#cbf516] active:scale-95 transition-all shadow-[0_0_15px_rgba(176,221,9,0.4)] cursor-pointer"
                  data-testid="error-retry-btn"
                >
                  Retry Operation
                </button>
              )}

              {showHomeButton && (
                <Link
                  href={homeHref}
                  className="font-exo2 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase px-6 py-3 rounded-none border border-white/40 hover:border-[#B0DD09] text-white hover:text-[#B0DD09] bg-black/40 hover:bg-black/70 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                  data-testid="error-home-link"
                >
                  {homeText}
                </Link>
              )}
            </div>

            {children && <div className="mt-6">{children}</div>}
          </div>
        </div>
      </section>

      {/* Hazard Strip Footer */}
      <footer
        className="w-full relative z-20 shrink-0"
        aria-label="Hazard Warning Strip"
        data-testid="hazard-footer"
      >
        <div
          className="w-full h-8 sm:h-10 md:h-12 bg-repeat-x bg-contain bg-bottom"
          style={{ backgroundImage: "url('/common/haz_strip.svg')" }}
          role="presentation"
        >
          {/* Direct element reference to guarantee asset inclusion */}
          <Image
            src="/common/haz_strip.svg"
            alt="Hazard strip"
            width={892}
            height={40}
            className="sr-only"
          />
        </div>
      </footer>
    </main>
  );
}
