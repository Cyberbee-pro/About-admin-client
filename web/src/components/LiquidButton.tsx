"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export interface LiquidButtonProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  href?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "terminal" | "custom";
  className?: string;
  contentClassName?: string;
  liquidColor?: string;
  activeTextColor?: string;
  disabled?: boolean;
  target?: string;
  rel?: string;
  "data-testid"?: string;

  // Active state & wave animation (customizable)
  isActive?: boolean;
  active?: boolean;
  activeColor?: string;
  waveColor?: string;
  stayActiveOnClick?: boolean;
  stayActive?: boolean;

  // Toggleable and customizable border ("but-border = 0" disables border)
  butBorder?: boolean | number | string;
  "but-border"?: boolean | number | string;
  borderColor?: string;
}

const BUBBLES = [
  { left: "8%", size: 5, duration: "2.3s", delay: "0s", anim: "bubbleRise1" },
  { left: "18%", size: 3, duration: "3.0s", delay: "0.5s", anim: "bubbleRise2" },
  { left: "28%", size: 6, duration: "2.6s", delay: "1.1s", anim: "bubbleRise3" },
  { left: "40%", size: 4, duration: "2.1s", delay: "0.2s", anim: "bubbleRise1" },
  { left: "52%", size: 7, duration: "3.3s", delay: "0.8s", anim: "bubbleRise2" },
  { left: "64%", size: 3, duration: "2.5s", delay: "1.4s", anim: "bubbleRise3" },
  { left: "76%", size: 6, duration: "2.9s", delay: "0.3s", anim: "bubbleRise1" },
  { left: "86%", size: 4, duration: "2.2s", delay: "1.0s", anim: "bubbleRise2" },
  { left: "94%", size: 5, duration: "2.7s", delay: "0.6s", anim: "bubbleRise3" },
];

const VARIANT_STYLES: Record<string, string> = {
  primary:
    "font-exo2 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase px-6 py-3 rounded-none border border-eva-lime text-eva-lime bg-eva-black/60 hover:border-eva-lime-bright cursor-pointer",
  secondary:
    "font-exo2 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase px-6 py-3 rounded-none border border-eva-text/40 hover:border-eva-lime text-eva-text bg-eva-black/40 hover:bg-eva-black/60 cursor-pointer",
  terminal:
    "w-full py-3.5 px-5 rounded bg-eva-crust hover:bg-eva-surface text-eva-text border border-eva-surface-border hover:border-eva-lime font-mono text-xs tracking-wider uppercase cursor-pointer",
  custom: "",
};

export default function LiquidButton({
  children,
  href,
  type = "button",
  variant = "primary",
  className = "",
  contentClassName = "",
  liquidColor = "bg-eva-lime",
  activeTextColor = "group-hover:text-eva-black group-focus-visible:text-eva-black group-active:text-eva-black",
  disabled = false,
  target,
  rel,
  "data-testid": dataTestId,
  onClick,
  isActive = false,
  active,
  activeColor = "bg-eva-red",
  waveColor = "rgba(255, 255, 255, 0.25)",
  stayActiveOnClick = false,
  stayActive = false,
  butBorder,
  "but-border": butBorderKebab,
  borderColor,
  ...rest
}: LiquidButtonProps) {
  const isControlled = isActive !== undefined || active !== undefined;
  const [isFilling, setIsFilling] = useState(false);
  const [isClickActive, setIsClickActive] = useState(false);
  const prevActiveRef = useRef(Boolean(isActive || active));
  const hasMountedRef = useRef(false);

  const isCurrentlyActive = Boolean(
    isControlled ? (isActive || active || isClickActive) : isClickActive
  );

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const propActive = Boolean(isActive || active);
    if (!prevActiveRef.current && propActive) {
      setIsFilling(true);
    }
    if (isControlled && !propActive) {
      setIsClickActive(false);
    }
    prevActiveRef.current = propActive;
  }, [isActive, active, isControlled]);

  useEffect(() => {
    if (isFilling) {
      const timer = setTimeout(() => {
        setIsFilling(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isFilling]);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (stayActiveOnClick || stayActive || isCurrentlyActive || href) {
      setIsClickActive(true);
      setIsFilling(true);
    }

    if (onClick) {
      (onClick as React.MouseEventHandler<HTMLElement>)(e);
    }
  };

  // Border toggle and customization: if but-border = 0 / false, border is disabled; otherwise enabled by default
  const rawBorder = butBorder !== undefined ? butBorder : butBorderKebab;
  const isBorderDisabled =
    rawBorder === 0 || rawBorder === "0" || rawBorder === false;

  let variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  if (isBorderDisabled) {
    variantClass = variantClass
      .replace(/\bborder\b/g, "")
      .replace(/\bborder-[^\s]+/g, "")
      .replace(/\bhover:border-[^\s]+/g, "")
      .trim();
  } else if (typeof rawBorder === "string" && rawBorder !== "1" && rawBorder !== "true") {
    variantClass = variantClass
      .replace(/\bborder\b/g, "")
      .replace(/\bborder-[^\s]+/g, "")
      .replace(/\bhover:border-[^\s]+/g, "")
      .trim();
    variantClass = `${variantClass} ${rawBorder}`.trim();
  } else if (borderColor) {
    variantClass = variantClass
      .replace(/\bborder-[^\s]+/g, "")
      .replace(/\bhover:border-[^\s]+/g, "")
      .trim();
    variantClass = `${variantClass} border ${borderColor}`.trim();
  }

  const borderOverrideClass = isBorderDisabled ? "!border-none border-0" : "";
  const baseClasses =
    "cursor-target group relative inline-flex items-center justify-center overflow-hidden transition-colors duration-300 select-none outline-none focus-visible:ring-2 focus-visible:ring-eva-lime focus-visible:ring-offset-2 focus-visible:ring-offset-eva-black";
  const disabledClasses = disabled
    ? "opacity-40 cursor-not-allowed pointer-events-none"
    : "";

  const combinedClassName = `${baseClasses} ${variantClass} ${borderOverrideClass} ${disabledClasses} ${className}`.trim();

  // Wave color customization: supports CSS colors (hex, rgba) and Tailwind fill classes
  const isTailwindFill =
    typeof waveColor === "string" &&
    (waveColor.startsWith("fill-") || waveColor.startsWith("text-"));
  const waveColorFill = isTailwindFill ? undefined : waveColor || "rgba(255, 255, 255, 0.25)";
  const waveColorClass = isTailwindFill ? waveColor : undefined;

  const content = (
    <>
      <style>{`
        @keyframes liquidRiseFill {
          0% { transform: translateY(100%); }
          80% { transform: translateY(-2%); }
          100% { transform: translateY(0); }
        }
        @keyframes liquidWaveSlow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes liquidWaveFast {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes bubbleRise1 {
          0% { bottom: -15%; opacity: 0; transform: translateX(0) scale(0.6); }
          20% { opacity: 0.8; }
          75% { opacity: 0.7; transform: translateX(3px) scale(1); }
          100% { bottom: 115%; opacity: 0; transform: translateX(-2px) scale(1.15); }
        }
        @keyframes bubbleRise2 {
          0% { bottom: -15%; opacity: 0; transform: translateX(0) scale(0.5); }
          25% { opacity: 0.85; }
          70% { opacity: 0.75; transform: translateX(-3px) scale(0.95); }
          100% { bottom: 115%; opacity: 0; transform: translateX(3px) scale(1.1); }
        }
        @keyframes bubbleRise3 {
          0% { bottom: -15%; opacity: 0; transform: translateX(0) scale(0.65); }
          30% { opacity: 0.75; }
          65% { opacity: 0.6; transform: translateX(2px) scale(1.05); }
          100% { bottom: 115%; opacity: 0; transform: translateX(-3px) scale(1.2); }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-testid="liquid-button-wave-layer"],
          [data-testid="liquid-button-wave-layer"] *,
          [data-testid="liquid-bubbles"],
          [data-testid="liquid-bubbles"] * {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* 1. Inactive / Hover Liquid Layer (Green liquid by default) */}
      <span
        className={`absolute inset-0 ${liquidColor} ${
          isFilling
            ? "translate-y-0 opacity-100"
            : isCurrentlyActive
            ? "translate-y-0 opacity-0 pointer-events-none"
            : "translate-y-full group-hover:translate-y-0 group-focus-visible:translate-y-0 group-active:translate-y-0"
        } transition-transform duration-300 ease-out z-0 pointer-events-none`}
        aria-hidden="true"
      />

      {/* 2. Active Red Liquid Layer (Waves & Effervescent Rising Bubbles) with After-Click Fill Animation */}
      {(isCurrentlyActive || isFilling) && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none z-[1]"
          aria-hidden="true"
          data-testid="liquid-button-wave-layer"
          style={{
            animation: isFilling
              ? "liquidRiseFill 0.55s cubic-bezier(0.25, 1, 0.5, 1) forwards"
              : undefined,
          }}
          onAnimationEnd={() => setIsFilling(false)}
        >
          {/* Base active color fill */}
          <div className={`absolute inset-0 ${activeColor}`} />

          {/* Effervescent Rising Liquid Bubbles from Bottom */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            data-testid="liquid-bubbles"
          >
            {BUBBLES.map((b, i) => (
              <span
                key={i}
                className="absolute bottom-0 rounded-full pointer-events-none"
                style={{
                  left: b.left,
                  width: `${b.size}px`,
                  height: `${b.size}px`,
                  backgroundColor: waveColorFill || "rgba(255, 255, 255, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  boxShadow: "inset -1px -1px 2px rgba(0, 0, 0, 0.2), 0 0 3px rgba(255, 255, 255, 0.4)",
                  animation: `${b.anim} ${b.duration} ease-in infinite`,
                  animationDelay: b.delay,
                }}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Foreground Wave Layer */}
          <div
            className="absolute inset-0 w-[200%] h-full flex pointer-events-none"
            style={{
              animation: "liquidWaveSlow 6s linear infinite",
            }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 35 Q 125 15 250 35 T 500 35 Q 625 15 750 35 T 1000 35 L 1000 100 L 0 100 Z"
                fill={waveColorFill}
                className={waveColorClass}
                opacity={0.3}
              />
            </svg>
          </div>

          {/* Background Wave Layer (moving faster in reverse phase) */}
          <div
            className="absolute inset-0 w-[200%] h-full flex pointer-events-none"
            style={{
              animation: "liquidWaveFast 4s linear infinite",
            }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 45 Q 125 65 250 45 T 500 45 Q 625 65 750 45 T 1000 45 L 1000 100 L 0 100 Z"
                fill={waveColorFill}
                className={waveColorClass}
                opacity={0.15}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Button content (text, icons, etc.) */}
      <span
        className={`relative z-10 transition-colors duration-200 ${
          isCurrentlyActive || isFilling ? "text-white" : activeTextColor
        } flex items-center justify-center gap-2.5 ${contentClassName}`.trim()}
      >
        {children}
      </span>
    </>
  );

  // Link elements (anchors or Next.js Link)
  if (href) {
    // When disabled, completely nullify navigation, omit href, set tabIndex -1 and aria-disabled
    if (disabled) {
      return (
        <a
          role="link"
          aria-disabled="true"
          tabIndex={-1}
          className={combinedClassName}
          data-testid={dataTestId}
          aria-label={rest["aria-label"]}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    const isExternal =
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("/api/") ||
      target === "_blank";

    if (isExternal) {
      return (
        <a
          href={href}
          target={target}
          rel={target === "_blank" ? (rel || "noopener noreferrer") : rel}
          className={combinedClassName}
          data-testid={dataTestId}
          onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
          {...rest}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={combinedClassName}
        data-testid={dataTestId}
        onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={disabled ? "true" : undefined}
      className={combinedClassName}
      data-testid={dataTestId}
      onClick={handleClick as React.MouseEventHandler<HTMLButtonElement>}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
