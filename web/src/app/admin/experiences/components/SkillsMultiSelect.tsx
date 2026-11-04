"use client";

import React, { useId } from "react";
import { Skill } from "@/lib/api/types";

export interface SkillsMultiSelectProps {
  id?: string;
  selectedSkillIds: string[];
  onChange: (ids: string[]) => void;
  availableSkills: Skill[];
  disabled?: boolean;
  className?: string;
}

export function SkillsMultiSelect({
  id,
  selectedSkillIds,
  onChange,
  availableSkills,
  disabled = false,
  className = "",
}: SkillsMultiSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  // Build a lookup map of skillId -> Skill name
  const skillNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of availableSkills) {
      map.set(skill._id, skill.name);
    }
    return map;
  }, [availableSkills]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pickedId = e.target.value;
    if (!pickedId) return;

    if (!selectedSkillIds.includes(pickedId)) {
      onChange([...selectedSkillIds, pickedId]);
    }

    // Reset select to empty/placeholder
    e.target.value = "";
  };

  const handleRemoveSkill = (skillIdToRemove: string) => {
    if (disabled) return;
    onChange(selectedSkillIds.filter((id) => id !== skillIdToRemove));
  };

  // Only show skills in dropdown that haven't been selected yet
  const unselectedSkills = availableSkills.filter(
    (skill) => !selectedSkillIds.includes(skill._id)
  );

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Native styled dropdown matching [select|v] */}
      <div className="relative inline-block">
        <select
          id={selectId}
          defaultValue=""
          onChange={handleSelectChange}
          disabled={disabled || unselectedSkills.length === 0}
          data-ascii="skip"
          aria-label="Select skill to add"
          className="appearance-none bg-black border border-white/40 text-white font-mono text-xs px-2.5 py-0.5 pr-6 rounded-none focus:outline-none focus:border-eva-teal cursor-pointer disabled:opacity-50"
        >
          <option value="" disabled>
            [select]
          </option>
          {unselectedSkills.map((skill) => (
            <option key={skill._id} value={skill._id}>
              {skill.name}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 font-mono text-[10px]"
        >
          v
        </span>
      </div>

      {/* Removable chips: e.g. [Linux x] */}
      <div className="flex flex-wrap items-center gap-1.5" role="list" aria-label="Selected skills">
        {selectedSkillIds.map((skillId) => {
          const displayName = skillNameMap.get(skillId) || skillId;

          return (
            <span
              key={skillId}
              role="listitem"
              data-ascii="fade"
              className="inline-flex items-center gap-1 font-mono text-xs bg-black/60 border border-white/40 text-white px-2 py-0.5 select-none"
            >
              <span>{displayName}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skillId)}
                disabled={disabled}
                aria-label={`Remove skill ${displayName}`}
                className="text-white/70 hover:text-eva-red transition-colors font-bold ml-0.5 cursor-pointer disabled:opacity-50"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default SkillsMultiSelect;
