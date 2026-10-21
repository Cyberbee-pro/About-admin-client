"use client";

import React, { useState } from "react";

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export interface ConfigInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: "text";
  placeholder?: string;
  validator?: (val: string) => ValidationResult;
  isExpandable?: boolean;
  multiline?: boolean;
  actionButton?: React.ReactNode;
  disabled?: boolean;
  "data-testid"?: string;
}

export function ConfigInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  validator,
  isExpandable = false,
  multiline = false,
  actionButton,
  disabled = false,
  "data-testid": dataTestId,
}: ConfigInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Compute live validation result
  const validation = validator ? validator(value) : null;
  const isError = validation !== null && !validation.valid && value.length > 0;
  const isValid = validation !== null && validation.valid && value.length > 0;

  // Determine underline color:
  // Red on error, Lime when valid and filled, Orange on focus/default (zero box-shadow or ambient glow)
  const borderBottomColor = isError
    ? "border-[var(--eva-red)]"
    : isValid
    ? "border-[var(--eva-lime)]"
    : "border-[var(--eva-orange)]";

  return (
    <div className="flex flex-col gap-0.5 w-full select-none" data-testid={dataTestId}>
      {/* Label and Input Row */}
      <div className="flex flex-wrap items-baseline gap-2 text-xl md:text-2xl font-exo2 text-white">
        <label
          htmlFor={id}
          className="font-normal text-white shrink-0 tracking-wide select-none min-w-[70px]"
        >
          {`${label} :`}
        </label>

        {/* Input Container */}
        <div className="relative flex items-center gap-2 flex-1 min-w-[240px]">
          {isExpandable && !isExpanded ? (
            /* Collapsed Single-Line Mode with Chevron */
            <div
              onClick={() => setIsExpanded(true)}
              className="group cursor-target cursor-pointer flex items-center gap-2 border-b-2 border-[var(--eva-orange)] pb-1 transition-all duration-300 max-w-[500px]"
              title="Click to expand full content"
            >
              <span className="truncate max-w-[280px] sm:max-w-[420px] text-white/95 font-normal">
                {value || placeholder || "Motivated developer ......"}
              </span>
              <span className="text-white/60 group-hover:text-eva-lime transition-colors text-sm px-1">
                ▼
              </span>
            </div>
          ) : multiline || (isExpandable && isExpanded) ? (
            /* Multiline Textarea Mode (anti-autofill and zero credential guessing) */
            <div className="flex flex-col w-full max-w-[650px] gap-1">
              <textarea
                id={id}
                name={id || "config-textarea"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                rows={4}
                disabled={disabled}
                autoComplete="off"
                spellCheck={false}
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                className={`cursor-target w-full bg-black/60 text-white font-exo2 text-base md:text-lg border-b-2 ${borderBottomColor} p-2 rounded-t outline-none transition-all duration-300 resize-y`}
              />
              {isExpandable && (
                <div className="flex justify-between items-center text-xs font-mono text-white/50 px-1">
                  <span>{value.length} CHARS</span>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="cursor-target text-[var(--eva-orange)] hover:text-white transition-colors"
                  >
                    ▲ COLLAPSE PREVIEW
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Underlined Expanding Text Input (anti-autofill, zero password prompts or glows) */
            <div className="relative flex items-center">
              <input
                id={id}
                name={id || "config-text"}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                className={`cursor-target bg-transparent text-white font-exo2 text-xl md:text-2xl border-b-2 ${borderBottomColor} pb-0.5 outline-none transition-all duration-300 w-[240px] sm:w-[280px] focus:w-[350px] md:focus:w-[480px]`}
              />
            </div>
          )}

          {/* Optional inline Action Button */}
          {actionButton && <div className="shrink-0 ml-2">{actionButton}</div>}
        </div>
      </div>

      {/* Active Error Status Text: ONLY shown when there is an active validation error */}
      {isError && validation && (
        <div
          data-testid="input-chk"
          className="border-l-2 border-l-[var(--eva-red)] text-[var(--eva-red)] bg-[var(--eva-red)]/5 pl-2 py-0.5 mt-0.5 text-[11px] leading-tight font-mono transition-all duration-200 w-fit max-w-[500px]"
        >
          <span className="font-semibold tracking-wider">[ERROR]</span>{" "}
          <span className="opacity-90">{validation.message}</span>
        </div>
      )}
    </div>
  );
}

export default ConfigInput;