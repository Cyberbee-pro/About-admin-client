"use client";

import React from "react";

export interface WeightSelectProps {
  id: string;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  className?: string;
  selectClassName?: string;
}

export function WeightSelect({
  id,
  value,
  onChange,
  disabled = false,
  className = "",
  selectClassName = "",
}: WeightSelectProps) {
  // A weight of 0 is NOT a valid value in this UI by design.
  // Treat missing, NaN, or 0 stored weight as 1 (the minimum).
  const normalizedValue = !value || value <= 0 ? 1 : value;

  const baseOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const hasExtraOption = normalizedValue > 10;
  const options = hasExtraOption
    ? [...baseOptions, normalizedValue]
    : baseOptions;

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        id={id}
        value={normalizedValue}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        data-ascii="skip"
        className={`appearance-none bg-black border border-white/40 text-white font-mono text-xs px-2.5 py-0.5 pr-6 rounded-none focus:outline-none focus:border-white cursor-pointer ${selectClassName}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 font-mono text-[10px]">
        v
      </span>
    </div>
  );
}

export default WeightSelect;
