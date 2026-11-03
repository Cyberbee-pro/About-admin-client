"use client";

import React, { useState, useRef } from "react";
import { ExperienceTag, ExperienceType, Skill } from "@/lib/api/types";
import WeightSelect from "@/app/admin/skills-achievements/components/WeightSelect";
import { CertificateUploadBox, UploadTabKey } from "@/app/admin/certificates/components/CertificateUploadBox";
import SkillsMultiSelect from "./SkillsMultiSelect";
import {
  parseDateInput,
  formatDateDisplay,
  validateExperienceForm,
  PositionFormState,
} from "../utils";

export interface AddExperienceSubmitPayload {
  organization: string;
  tag: ExperienceTag;
  type: ExperienceType;
  weight: number;
  skills: string[];
  iconFile: File | null;
  positions: Array<{
    position: string;
    description: string;
    startDate: string; // ISO string
    endDate?: string; // ISO string
    isCurrent: boolean;
    mediaFiles: File[];
    certFiles: File[];
  }>;
}

export interface AddExperienceFormProps {
  onSubmit: (payload: AddExperienceSubmitPayload) => Promise<void>;
  isSubmitting?: boolean;
  availableSkills: Skill[];
}

export function AddExperienceForm({
  onSubmit,
  isSubmitting = false,
  availableSkills,
}: AddExperienceFormProps) {
  // Experience-level fields
  const [organization, setOrganization] = useState("");
  const [tag, setTag] = useState<ExperienceTag>("focus");
  const [type, setType] = useState<ExperienceType>("full_time");
  const [weight, setWeight] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [iconFile, setIconFile] = useState<File | null>(null);

  // Position-level states (starting with position 1)
  const [positions, setPositions] = useState<PositionFormState[]>([
    {
      position: "",
      description: "",
      startDateInput: formatDateDisplay(new Date()),
      endDateInput: "",
      isCurrent: true,
      existingMediaUrls: [],
      existingCertUrls: [],
      stagedMediaFiles: [],
      stagedCertFiles: [],
    },
  ]);

  // Active position index for upload box interaction (defaults to 0)
  const [activePositionIndex, setActivePositionIndex] = useState(0);

  // Upload box active tab
  const [activeUploadTab, setActiveUploadTab] = useState<UploadTabKey>("icon");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Input refs for validation focus
  const orgInputRef = useRef<HTMLInputElement>(null);
  const positionInputRef = useRef<HTMLInputElement>(null);

  // Switch "present" toggle for a given position with single-truth rule
  const handleTogglePresent = (index: number) => {
    setPositions((prev) =>
      prev.map((pos, i) => {
        if (i === index) {
          const nextIsCurrent = !pos.isCurrent;
          return {
            ...pos,
            isCurrent: nextIsCurrent,
            endDateInput: nextIsCurrent ? "" : pos.endDateInput,
          };
        }
        // If position `index` is now current, all other positions must be false
        return {
          ...pos,
          isCurrent: i === index ? pos.isCurrent : false,
        };
      })
    );
  };

  const handleUpdatePosition = (
    index: number,
    field: keyof PositionFormState,
    value: unknown
  ) => {
    setPositions((prev) =>
      prev.map((pos, i) => (i === index ? { ...pos, [field]: value } : pos))
    );
  };

  const handleAddPositionBlock = () => {
    setPositions((prev) => [
      ...prev,
      {
        position: "",
        description: "",
        startDateInput: formatDateDisplay(new Date()),
        endDateInput: "",
        isCurrent: false,
        existingMediaUrls: [],
        existingCertUrls: [],
        stagedMediaFiles: [],
        stagedCertFiles: [],
      },
    ]);
    // Switch active upload position to newly added block
    setActivePositionIndex(positions.length);
  };

  const handleRemovePositionBlock = (indexToRemove: number) => {
    if (positions.length <= 1) return;
    setPositions((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (activePositionIndex >= positions.length - 1) {
      setActivePositionIndex(Math.max(0, positions.length - 2));
    }
  };

  // Upload file handlers
  const handleAddUploadFiles = (newFiles: File[]) => {
    setUploadError(null);

    if (activeUploadTab === "icon") {
      const file = newFiles[0];
      if (file.size > 100 * 1024 * 1024) {
        setUploadError("Icon file exceeds 100MB size limit");
        return;
      }
      setIconFile(file);
    } else if (activeUploadTab === "cert") {
      const curr = positions[activePositionIndex]?.stagedCertFiles || [];
      if (curr.length + newFiles.length > 10) {
        setUploadError("Maximum 10 certificate files allowed per position");
        return;
      }
      for (const f of newFiles) {
        if (f.size > 100 * 1024 * 1024) {
          setUploadError(`File ${f.name} exceeds 100MB limit`);
          return;
        }
      }
      handleUpdatePosition(activePositionIndex, "stagedCertFiles", [...curr, ...newFiles]);
    } else if (activeUploadTab === "media") {
      const curr = positions[activePositionIndex]?.stagedMediaFiles || [];
      if (curr.length + newFiles.length > 10) {
        setUploadError("Maximum 10 media files allowed per position");
        return;
      }
      for (const f of newFiles) {
        if (f.size > 100 * 1024 * 1024) {
          setUploadError(`File ${f.name} exceeds 100MB limit`);
          return;
        }
      }
      handleUpdatePosition(activePositionIndex, "stagedMediaFiles", [...curr, ...newFiles]);
    }
  };

  const handleRemoveStagedFile = (fileIndex: number) => {
    if (activeUploadTab === "icon") {
      setIconFile(null);
    } else if (activeUploadTab === "cert") {
      const curr = positions[activePositionIndex]?.stagedCertFiles || [];
      handleUpdatePosition(
        activePositionIndex,
        "stagedCertFiles",
        curr.filter((_, i) => i !== fileIndex)
      );
    } else if (activeUploadTab === "media") {
      const curr = positions[activePositionIndex]?.stagedMediaFiles || [];
      handleUpdatePosition(
        activePositionIndex,
        "stagedMediaFiles",
        curr.filter((_, i) => i !== fileIndex)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateExperienceForm({
      organization,
      tag,
      type,
      hasIcon: Boolean(iconFile),
      positions,
    });

    if (!validation.isValid) {
      setFormError(validation.error);
      if (validation.invalidField === "organization" && orgInputRef.current) {
        orgInputRef.current.focus();
      } else if (positionInputRef.current) {
        positionInputRef.current.focus();
      }
      return;
    }

    // Build payload with converted UTC ISO dates
    const parsedPositions = positions.map((p) => {
      const startRes = parseDateInput(p.startDateInput);
      const endRes = p.isCurrent ? undefined : parseDateInput(p.endDateInput);

      return {
        position: p.position.trim(),
        description: p.description.trim(),
        startDate: startRes.isoString!,
        endDate: endRes?.isoString,
        isCurrent: p.isCurrent,
        mediaFiles: p.stagedMediaFiles,
        certFiles: p.stagedCertFiles,
      };
    });

    try {
      await onSubmit({
        organization: organization.trim(),
        tag,
        type,
        weight,
        skills: selectedSkills,
        iconFile,
        positions: parsedPositions,
      });

      // Reset form on success
      setOrganization("");
      setTag("focus");
      setType("full_time");
      setWeight(1);
      setSelectedSkills([]);
      setIconFile(null);
      setPositions([
        {
          position: "",
          description: "",
          startDateInput: formatDateDisplay(new Date()),
          endDateInput: "",
          isCurrent: true,
          existingMediaUrls: [],
          existingCertUrls: [],
          stagedMediaFiles: [],
          stagedCertFiles: [],
        },
      ]);
      setActivePositionIndex(0);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create experience");
    }
  };

  // Determine active staged/existing files for active tab
  const activePosition = positions[activePositionIndex] || positions[0];
  const stagedFilesForActiveTab =
    activeUploadTab === "icon"
      ? iconFile
        ? [iconFile]
        : []
      : activeUploadTab === "cert"
      ? activePosition.stagedCertFiles
      : activePosition.stagedMediaFiles;

  const existingUrlsForActiveTab =
    activeUploadTab === "cert"
      ? activePosition.existingCertUrls
      : activeUploadTab === "media"
      ? activePosition.existingMediaUrls
      : [];

  const readOnlyNote =
    activePositionIndex > 0 && activeUploadTab === "icon"
      ? "(Organization icon is shared across all positions)"
      : undefined;

  return (
    <section aria-label="Add Experience Section" className="w-full">
      <form
        onSubmit={handleSubmit}
        data-ascii="skip"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left Column: Form Fields in Natural Height Flow */}
        <div className="lg:col-span-7 flex flex-col font-exo2 text-white">
          <h2 className="text-2xl sm:text-[28px] font-normal tracking-wide text-white shrink-0 mb-3">
            Add Experience. . . .
          </h2>

          <div className="space-y-4 pt-1 text-sm sm:text-base">
            {/* Position 1 & Shared Experience Fields */}
            {positions.map((pos, idx) => {
              const isFirst = idx === 0;

              return (
                <div
                  key={idx}
                  className={`space-y-3 pb-3 ${
                    !isFirst ? "pt-3 border-t border-white/20 relative" : ""
                  }`}
                  onClick={() => setActivePositionIndex(idx)}
                >
                  {!isFirst && (
                    <div className="flex items-center justify-between text-xs font-mono text-eva-teal mb-1">
                      <span>ADDITIONAL POSITION #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePositionBlock(idx)}
                        disabled={isSubmitting}
                        className="text-eva-red hover:underline uppercase cursor-pointer"
                      >
                        [Remove]
                      </button>
                    </div>
                  )}

                  {/* Position */}
                  <div className="flex items-baseline gap-2">
                    <label
                      htmlFor={`add-exp-pos-${idx}`}
                      className="shrink-0 tracking-wide font-normal"
                    >
                      Position:
                    </label>
                    <input
                      ref={isFirst ? positionInputRef : undefined}
                      id={`add-exp-pos-${idx}`}
                      type="text"
                      value={pos.position}
                      onChange={(e) =>
                        handleUpdatePosition(idx, "position", e.target.value)
                      }
                      disabled={isSubmitting}
                      data-ascii="skip"
                      placeholder="e.g. Lead Systems Engineer"
                      className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors placeholder:text-white/25"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex items-baseline gap-2">
                    <label
                      htmlFor={`add-exp-desc-${idx}`}
                      className="shrink-0 tracking-wide font-normal"
                    >
                      Description:
                    </label>
                    <input
                      id={`add-exp-desc-${idx}`}
                      type="text"
                      value={pos.description}
                      onChange={(e) =>
                        handleUpdatePosition(idx, "description", e.target.value)
                      }
                      disabled={isSubmitting}
                      data-ascii="skip"
                      placeholder="Role responsibilities and achievements"
                      className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors placeholder:text-white/25"
                    />
                  </div>

                  {/* Organization (Shared, editable only on first block) */}
                  <div className="flex items-baseline gap-2">
                    <label
                      htmlFor={isFirst ? "add-exp-org" : undefined}
                      className="shrink-0 tracking-wide font-normal"
                    >
                      organization:
                    </label>
                    {isFirst ? (
                      <input
                        ref={orgInputRef}
                        id="add-exp-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        disabled={isSubmitting}
                        data-ascii="skip"
                        placeholder="Company or institution name"
                        className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors placeholder:text-white/25"
                      />
                    ) : (
                      <span className="font-mono text-xs text-white/70 italic px-1 py-0.5">
                        {organization || "(Mirrored from primary organization)"}
                      </span>
                    )}
                  </div>

                  {/* Experience-level fields: tag, type, skills, weight (rendered once on first block) */}
                  {isFirst && (
                    <>
                      {/* Tag Select */}
                      <div className="flex items-baseline gap-2">
                        <label
                          htmlFor="add-exp-tag"
                          className="shrink-0 tracking-wide font-normal"
                        >
                          tag :
                        </label>
                        <div className="relative inline-block">
                          <select
                            id="add-exp-tag"
                            value={tag}
                            onChange={(e) =>
                              setTag(e.target.value as ExperienceTag)
                            }
                            disabled={isSubmitting}
                            data-ascii="skip"
                            className="appearance-none bg-black border border-white/40 text-white font-mono text-xs px-2.5 py-0.5 pr-6 rounded-none focus:outline-none focus:border-eva-teal cursor-pointer"
                          >
                            <option value="focus">focus</option>
                            <option value="extracurricular">
                              extracurricular
                            </option>
                          </select>
                          <span
                            aria-hidden="true"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 font-mono text-[10px]"
                          >
                            v
                          </span>
                        </div>
                      </div>

                      {/* Type Select (Backend Requirement) */}
                      <div className="flex items-baseline gap-2">
                        <label
                          htmlFor="add-exp-type"
                          className="shrink-0 tracking-wide font-normal"
                        >
                          type :
                        </label>
                        <div className="relative inline-block">
                          <select
                            id="add-exp-type"
                            value={type}
                            onChange={(e) =>
                              setType(e.target.value as ExperienceType)
                            }
                            disabled={isSubmitting}
                            data-ascii="skip"
                            className="appearance-none bg-black border border-white/40 text-white font-mono text-xs px-2.5 py-0.5 pr-6 rounded-none focus:outline-none focus:border-eva-teal cursor-pointer"
                          >
                            <option value="full_time">Full-time</option>
                            <option value="part_time">Part-time</option>
                            <option value="internship">Internship</option>
                            <option value="contract">Contract</option>
                            <option value="freelance">Freelance</option>
                            <option value="club">Club</option>
                            <option value="volunteering">Volunteering</option>
                          </select>
                          <span
                            aria-hidden="true"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 font-mono text-[10px]"
                          >
                            v
                          </span>
                        </div>
                      </div>

                      {/* Skills Multi-select with Removable Chips */}
                      <div className="flex items-baseline gap-2">
                        <span className="shrink-0 tracking-wide font-normal">
                          skills :
                        </span>
                        <SkillsMultiSelect
                          id="add-exp-skills"
                          selectedSkillIds={selectedSkills}
                          onChange={setSelectedSkills}
                          availableSkills={availableSkills}
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Weight Select */}
                      <div className="flex items-baseline gap-2">
                        <label
                          htmlFor="add-exp-weight"
                          className="shrink-0 tracking-wide font-normal"
                        >
                          weight :
                        </label>
                        <WeightSelect
                          id="add-exp-weight"
                          value={weight}
                          onChange={setWeight}
                          disabled={isSubmitting}
                        />
                      </div>
                    </>
                  )}

                  {/* Start Date */}
                  <div className="flex items-baseline gap-2">
                    <label
                      htmlFor={`add-exp-start-${idx}`}
                      className="shrink-0 tracking-wide font-normal"
                    >
                      start date
                    </label>
                    <input
                      id={`add-exp-start-${idx}`}
                      type="text"
                      value={pos.startDateInput}
                      onChange={(e) =>
                        handleUpdatePosition(
                          idx,
                          "startDateInput",
                          e.target.value
                        )
                      }
                      disabled={isSubmitting}
                      data-ascii="skip"
                      placeholder="[dd/mm/yy]"
                      className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-28 sm:w-32 transition-colors placeholder:text-white/40"
                    />
                  </div>

                  {/* End Date & Present Toggle */}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <label
                      htmlFor={`add-exp-end-${idx}`}
                      className="shrink-0 tracking-wide font-normal"
                    >
                      end date
                    </label>
                    <input
                      id={`add-exp-end-${idx}`}
                      type="text"
                      value={pos.isCurrent ? "" : pos.endDateInput}
                      onChange={(e) =>
                        handleUpdatePosition(idx, "endDateInput", e.target.value)
                      }
                      disabled={pos.isCurrent || isSubmitting}
                      data-ascii="skip"
                      placeholder={pos.isCurrent ? "[present]" : "[dd/mm/yy]"}
                      className={`bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-28 sm:w-32 transition-colors placeholder:text-white/40 ${
                        pos.isCurrent ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleTogglePresent(idx)}
                      disabled={isSubmitting}
                      aria-pressed={pos.isCurrent}
                      className={`font-mono text-xs px-2 py-0.5 border transition-colors cursor-pointer ${
                        pos.isCurrent
                          ? "bg-eva-lime text-black border-eva-lime font-bold"
                          : "border-white/40 text-white/80 hover:border-white"
                      }`}
                    >
                      [present]
                    </button>
                  </div>
                </div>
              );
            })}

            {/* + Add Position */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleAddPositionBlock}
                disabled={isSubmitting}
                className="text-white hover:text-eva-teal font-exo2 text-xs sm:text-sm tracking-wide transition-colors cursor-pointer"
              >
                + Add Position
              </button>
            </div>
          </div>

          {/* Action & Validation Error Area */}
          <div className="pt-5 flex flex-col items-start gap-2">
            {formError && (
              <div role="alert" className="text-eva-red font-mono text-xs">
                ERR: {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              data-ascii="fade"
              className="bg-[#1740A2] hover:bg-[#1f4dc2] disabled:opacity-50 text-white font-exo2 text-xs sm:text-sm px-5 py-1.5 tracking-wider uppercase transition-colors cursor-pointer"
            >
              {isSubmitting ? "TRANSMITTING..." : "ADD EXPERIENCE"}
            </button>
          </div>
        </div>

        {/* Right Column: Tabbed Upload Box (Purple body in base page) */}
        <div className="lg:col-span-5 flex flex-col items-start lg:items-end w-full">
          <div className="w-full max-w-[320px] sm:max-w-[360px] space-y-2">
            <h3 className="font-exo2 text-xl sm:text-2xl font-normal tracking-wide text-white">
              Upload
            </h3>

            {positions.length > 1 && (
              <div className="font-mono text-[11px] text-white/70">
                Staging uploads for:{" "}
                <span className="text-eva-teal font-bold">
                  Position #{activePositionIndex + 1}
                </span>
              </div>
            )}

            <CertificateUploadBox
              variant="purple"
              disabled={isSubmitting}
              tabs={[
                {
                  key: "icon",
                  label: "Icon",
                  badge: iconFile ? 1 : 0,
                },
                {
                  key: "cert",
                  label: "Cert",
                  badge: activePosition.stagedCertFiles.length,
                },
                {
                  key: "media",
                  label: "Media",
                  badge: activePosition.stagedMediaFiles.length,
                },
              ]}
              activeTab={activeUploadTab}
              onTabChange={setActiveUploadTab}
              stagedFiles={stagedFilesForActiveTab}
              existingUrls={existingUrlsForActiveTab}
              onAddFiles={handleAddUploadFiles}
              onRemoveStagedFile={handleRemoveStagedFile}
              readOnlyNote={readOnlyNote}
              uploadError={uploadError}
            />
          </div>
        </div>
      </form>
    </section>
  );
}

export default AddExperienceForm;
