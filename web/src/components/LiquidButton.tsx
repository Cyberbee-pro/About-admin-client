"use client";

import React from "react";
import Link from "next/link";

export interface LiquidButtonProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  href?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "terminal" | "custom";
  className?: string;
  liquidColor?: string;
  activeTextColor?: string;
  disabled?: boolean;
  target?: string;
  rel?: string;
  "data-testid"?: string;
}

const VARIANT_STYLES: Record<string, string> = {
  primary:
    "font-exo2 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase px-6 py-3 rounded-none border border-eva-lime text-eva-lime bg-eva-black/60 hover:border-eva-lime-bright shadow-[0_0_15px_rgba(176,221,9,0.3)] hover:shadow-[0_0_25px_rgba(176,221,9,0.6)] cursor-pointer",
  secondary:
    "font-exo2 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase px-6 py-3 rounded-none border border-eva-text/40 hover:border-eva-lime text-eva-text bg-eva-black/40 hover:bg-eva-black/60 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(176,221,9,0.4)] cursor-pointer",
  terminal:
    "w-full py-3.5 px-5 rounded bg-eva-crust hover:bg-eva-surface text-eva-text border border-eva-surface-border hover:border-eva-lime font-mono text-xs tracking-wider uppercase shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(176,221,9,0.25)] cursor-pointer",
  custom: "",
};

export default function LiquidButton({
  children,
  href,
  type = "button",
  variant = "primary",
  className = "",
  liquidColor = "bg-eva-lime",
  activeTextColor = "group-hover:text-eva-black group-focus-visible:text-eva-black group-active:text-eva-black",
  disabled = false,
  target,
  rel,
  "data-testid": dataTestId,
  onClick,
  ...rest
}: LiquidButtonProps) {
  const baseClasses =
    "cursor-target group relative inline-flex items-center justify-center overflow-hidden transition-colors duration-300 select-none outline-none focus-visible:ring-2 focus-visible:ring-eva-lime focus-visible:ring-offset-2 focus-visible:ring-offset-eva-black";
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const disabledClasses = disabled
    ? "opacity-40 cursor-not-allowed pointer-events-none"
    : "";

  const combinedClassName = `${baseClasses} ${variantClass} ${disabledClasses} ${className}`.trim();

  const content = (
    <>
      {/* Liquid fill overlay sliding up from bottom to top */}
      <span
        className={`absolute inset-0 ${liquidColor} translate-y-full group-hover:translate-y-0 group-focus-visible:translate-y-0 group-active:translate-y-0 transition-transform duration-300 ease-out z-0 pointer-events-none`}
        aria-hidden="true"
      />
      <span
        className={`relative z-10 transition-colors duration-200 ${activeTextColor} flex items-center justify-center gap-2.5`}
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
          onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
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
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
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
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
