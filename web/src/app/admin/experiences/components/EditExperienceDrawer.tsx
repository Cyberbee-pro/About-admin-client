"use client";

import React, { useState, useRef } from "react";
import { Experience, ExperienceTag, ExperienceType, Skill } from "@/lib/api/types";
import { SideDrawer } from "@/components/admin/SideDrawer";
import WeightSelect, { normalizeWeight } from "@/app/admin/skills-achievements/components/WeightSelect";
import {
  CertificateUploadBox,
  UploadTabKey,
} from "@/app/admin/certificates/components/CertificateUploadBox";
import SkillsMultiSelect from "./SkillsMultiSelect";
import DeleteConfirmModal from "@/app/admin/skills-achievements/components/DeleteConfirmModal";
import {
  formatDateDisplay,
  parseDateInput,
  validateExperienceForm,
  PositionFormState,
} from "../utils";

export interface EditExperienceSavePayload {
  experienceId: string;
  organization: string;
  tag: ExperienceTag;
  type: ExperienceType;
  weight: number;
  skills: string[];
  iconFile: File | null;
  existingPositions: Array<{
    _id?: string;
    position: string;
    description: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    mediaUrls: string[];
    certificateUrls: string[];
    stagedMediaFiles: File[];
    stagedCertFiles: File[];
  }>;
  newPositions: Array<{
    position: string;
    description: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    stagedMediaFiles: File[];
    stagedCertFiles: File[];
  }>;
}

export interface EditExperienceDrawerProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: EditExperienceSavePayload) => Promise<void>;
  isSaving?: boolean;
  availableSkills: Skill[];
}

interface EditExperienceDrawerContentProps {
  experience: Experience;
  isOpen: boolean;
  onClose: () => void;
  onSave: EditExperienceDrawerProps["onSave"];
  isSaving?: boolean;
  availableSkills: Skill[];
}

function EditExperienceDrawerContent({
  experience,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  availableSkills,
}: EditExperienceDrawerContentProps) {
  const [organization, setOrganization] = useState(experience.organization || "");
  const [tag, setTag] = useState<ExperienceTag>(experience.tag || "focus");
  const [type, setType] = useState<ExperienceType>(experience.type || "full_time");
  const [weight, setWeight] = useState(normalizeWeight(experience.weight));
  const [selectedSkills, setSelectedSkills] = useState<string[]>(experience.skills || []);
  const [iconFile, setIconFile] = useState<File | null>(null);

  const [positions, setPositions] = useState<PositionFormState[]>(() => {
    if (experience.positions && experience.positions.length > 0) {
      return experience.positions.map((p) => ({
        _id: p._id,
        position: p.position || "",
        description: p.description || "",
        startDateInput: formatDateDisplay(p.startDate),
        endDateInput: p.endDate ? formatDateDisplay(p.endDate) : "",
        isCurrent: Boolean(p.isCurrent),
        existingMediaUrls: p.mediaUrls || [],
        existingCertUrls: p.certificateUrls || [],
        stagedMediaFiles: [],
        stagedCertFiles: [],
      }));
    }
    return [
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
    ];
  });

  const [activeTabs, setActiveTabs] = useState<Record<number, UploadTabKey>>(() => {
    const tabsMap: Record<number, UploadTabKey> = {};
    if (experience.positions) {
      experience.positions.forEach((_, idx) => {
        tabsMap[idx] = idx === 0 ? "icon" : "cert";
      });
    } else {
      tabsMap[0] = "icon";
    }
    return tabsMap;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Position removal confirmation modal state
  const [positionToDeleteIndex, setPositionToDeleteIndex] = useState<number | null>(null);

  const handleUpdatePosition = (
    index: number,
    field: keyof PositionFormState,
    value: unknown
  ) => {
    setIsDirty(true);
    setPositions((prev) =>
      prev.map((pos, i) => (i === index ? { ...pos, [field]: value } : pos))
    );
  };

  const handleTogglePresent = (index: number) => {
    setIsDirty(true);
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
        return {
          ...pos,
          isCurrent: i === index ? pos.isCurrent : false,
        };
      })
    );
  };

  const handleAddPosition = () => {
    setIsDirty(true);
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
  };

  const handleRequestRemovePosition = (index: number) => {
    if (positions.length <= 1) return;
    const targetPos = positions[index];
    if (targetPos._id) {
      // Position is already saved in database -> confirm with modal
      setPositionToDeleteIndex(index);
    } else {
      // Newly added block that hasn't been saved yet -> remove immediately
      setIsDirty(true);
      setPositions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleConfirmDeletePosition = () => {
    if (positionToDeleteIndex !== null) {
      setIsDirty(true);
      setPositions((prev) => prev.filter((_, i) => i !== positionToDeleteIndex));
      setPositionToDeleteIndex(null);
    }
  };

  // Upload handlers per block
  const handleAddFiles = (posIndex: number, newFiles: File[]) => {
    setIsDirty(true);
    setFormError(null);
    const tab = activeTabs[posIndex] || (posIndex === 0 ? "icon" : "cert");

    if (posIndex === 0 && tab === "icon") {
      const file = newFiles[0];
      if (file.size > 100 * 1024 * 1024) {
        setFormError("Icon file exceeds 100MB size limit");
        return;
      }
      setIconFile(file);
    } else if (tab === "cert") {
      const curr = positions[posIndex]?.stagedCertFiles || [];
      if (curr.length + newFiles.length > 10) {
        setFormError("Maximum 10 certificate files allowed per position");
        return;
      }
      for (const f of newFiles) {
        if (f.size > 100 * 1024 * 1024) {
          setFormError(`File ${f.name} exceeds 100MB limit`);
          return;
        }
      }
      handleUpdatePosition(posIndex, "stagedCertFiles", [...curr, ...newFiles]);
    } else if (tab === "media") {
      const curr = positions[posIndex]?.stagedMediaFiles || [];
      if (curr.length + newFiles.length > 10) {
        setFormError("Maximum 10 media files allowed per position");
        return;
      }
      for (const f of newFiles) {
        if (f.size > 100 * 1024 * 1024) {
          setFormError(`File ${f.name} exceeds 100MB limit`);
          return;
        }
      }
      handleUpdatePosition(posIndex, "stagedMediaFiles", [...curr, ...newFiles]);
    }
  };

  const handleRemoveStagedFile = (posIndex: number, fileIndex: number) => {
    setIsDirty(true);
    const tab = activeTabs[posIndex] || (posIndex === 0 ? "icon" : "cert");

    if (posIndex === 0 && tab === "icon") {
      setIconFile(null);
    } else if (tab === "cert") {
      const curr = positions[posIndex]?.stagedCertFiles || [];
      handleUpdatePosition(
        posIndex,
        "stagedCertFiles",
        curr.filter((_, i) => i !== fileIndex)
      );
    } else if (tab === "media") {
      const curr = positions[posIndex]?.stagedMediaFiles || [];
      handleUpdatePosition(
        posIndex,
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
      hasIcon: Boolean(iconFile || experience.iconUrl),
      positions,
    });

    if (!validation.isValid) {
      setFormError(validation.error);
      return;
    }

    const existingPositionsList: EditExperienceSavePayload["existingPositions"] = [];
    const newPositionsList: EditExperienceSavePayload["newPositions"] = [];

    positions.forEach((p) => {
      const startParsed = parseDateInput(p.startDateInput);
      const endParsed = p.isCurrent ? undefined : parseDateInput(p.endDateInput);

      if (p._id) {
        existingPositionsList.push({
          _id: p._id,
          position: p.position.trim(),
          description: p.description.trim(),
          startDate: startParsed.isoString!,
          endDate: endParsed?.isoString,
          isCurrent: p.isCurrent,
          mediaUrls: p.existingMediaUrls,
          certificateUrls: p.existingCertUrls,
          stagedMediaFiles: p.stagedMediaFiles,
          stagedCertFiles: p.stagedCertFiles,
        });
      } else {
        newPositionsList.push({
          position: p.position.trim(),
          description: p.description.trim(),
          startDate: startParsed.isoString!,
          endDate: endParsed?.isoString,
          isCurrent: p.isCurrent,
          stagedMediaFiles: p.stagedMediaFiles,
          stagedCertFiles: p.stagedCertFiles,
        });
      }
    });

    try {
      await onSave({
        experienceId: experience._id,
        organization: organization.trim(),
        tag,
        type,
        weight,
        skills: selectedSkills,
        iconFile,
        existingPositions: existingPositionsList,
        newPositions: newPositionsList,
      });

      setIsDirty(false);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update experience");
    }
  };

  return (
    <>
      <SideDrawer
        isOpen={isOpen}
        onClose={onClose}
        isBlockingClose={isSaving}
        onBeforeClose={() => {
          if (isDirty) {
            return window.confirm(
              "You have unsaved changes in this experience. Discard them?"
            );
          }
          return true;
        }}
        ariaLabelledBy="edit-experience-heading"
        hazardStripe={true}
        panelClassName="w-full max-w-[960px] flex flex-col bg-[#7B47DC] text-white"
      >
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* Top Title: Edit Experience [org]. . . . */}
          <div className="p-6 sm:p-8 pb-4 shrink-0">
            <h2
              id="edit-experience-heading"
              className="text-2xl sm:text-3xl font-exo2 font-normal tracking-wide text-white"
            >
              {`Edit Experience [${experience.organization}]. . . .`}
            </h2>
            {formError && (
              <div role="alert" className="mt-2 text-eva-red font-mono text-xs">
                ERR: {formError}
              </div>
            )}
          </div>

          {/* Scrollable Position Blocks Stack with custom Evangelion scrollbar */}
          <div className="flex-1 overflow-y-auto eva-custom-scrollbar px-6 sm:px-8 space-y-8 pb-20">
            {positions.map((pos, idx) => {
              const isFirst = idx === 0;
              const isExisting = Boolean(pos._id);
              const activeTab = activeTabs[idx] || (isFirst ? "icon" : "cert");

              // Determine read-only notes for non-first position blocks
              let readOnlyNote: string | undefined = undefined;
              if (!isFirst) {
                if (activeTab === "icon") {
                  readOnlyNote = "(Organization icon is shared across all positions)";
                } else if (isExisting) {
                  readOnlyNote =
                    "(New media/certificates can only be added to the initial position or when appending a new position)";
                }
              }

              const stagedFilesForTab =
                isFirst && activeTab === "icon"
                  ? iconFile
                    ? [iconFile]
                    : []
                  : activeTab === "cert"
                  ? pos.stagedCertFiles
                  : pos.stagedMediaFiles;

              const existingUrlsForTab =
                activeTab === "icon"
                  ? isFirst && experience.iconUrl && !iconFile
                    ? [experience.iconUrl]
                    : !isFirst && experience.iconUrl
                    ? [experience.iconUrl]
                    : []
                  : activeTab === "cert"
                  ? pos.existingCertUrls
                  : pos.existingMediaUrls;

              return (
                <div
                  key={pos._id || `new-pos-${idx}`}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start ${
                    !isFirst ? "pt-6 border-t border-white/30" : ""
                  }`}
                >
                  {/* Left Column: Position & Experience Fields */}
                  <div className="lg:col-span-7 flex flex-col font-exo2 text-white space-y-3">
                    {!isFirst && (
                      <div className="flex items-center justify-between font-mono text-xs text-eva-teal mb-1">
                        <span>POSITION #{idx + 1} {isExisting ? "(Saved)" : "(New)"}</span>
                        <button
                          type="button"
                          onClick={() => handleRequestRemovePosition(idx)}
                          disabled={isSaving}
                          className="text-eva-red hover:underline uppercase cursor-pointer"
                        >
                          [Remove]
                        </button>
                      </div>
                    )}

                    {/* Position Title */}
                    <div className="flex items-baseline gap-2">
                      <label
                        htmlFor={`edit-pos-title-${idx}`}
                        className="shrink-0 tracking-wide font-normal"
                      >
                        Position:
                      </label>
                      <input
                        id={`edit-pos-title-${idx}`}
                        type="text"
                        value={pos.position}
                        onChange={(e) =>
                          handleUpdatePosition(idx, "position", e.target.value)
                        }
                        disabled={isSaving}
                        data-ascii="skip"
                        className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors"
                      />
                    </div>

                    {/* Description */}
                    <div className="flex items-baseline gap-2">
                      <label
                        htmlFor={`edit-pos-desc-${idx}`}
                        className="shrink-0 tracking-wide font-normal"
                      >
                        Description:
                      </label>
                      <input
                        id={`edit-pos-desc-${idx}`}
                        type="text"
                        value={pos.description}
                        onChange={(e) =>
                          handleUpdatePosition(idx, "description", e.target.value)
                        }
                        disabled={isSaving}
                        data-ascii="skip"
                        className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors"
                      />
                    </div>

                    {/* Organization: editable on first block, mirrored on subsequent */}
                    <div className="flex items-baseline gap-2">
                      <label
                        htmlFor={isFirst ? "edit-exp-org" : undefined}
                        className="shrink-0 tracking-wide font-normal"
                      >
                        organization:
                      </label>
                      {isFirst ? (
                        <input
                          id="edit-exp-org"
                          type="text"
                          value={organization}
                          onChange={(e) => {
                            setIsDirty(true);
                            setOrganization(e.target.value);
                          }}
                          disabled={isSaving}
                          data-ascii="skip"
                          className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors"
                        />
                      ) : (
                        <span className="font-mono text-xs text-white/70 italic px-1 py-0.5">
                          {organization}
                        </span>
                      )}
                    </div>

                    {/* Experience-level fields on Block 1 */}
                    {isFirst && (
                      <>
                        {/* Tag Select */}
                        <div className="flex items-baseline gap-2">
                          <label
                            htmlFor="edit-exp-tag"
                            className="shrink-0 tracking-wide font-normal"
                          >
                            tag :
                          </label>
                          <div className="relative inline-block">
                            <select
                              id="edit-exp-tag"
                              value={tag}
                              onChange={(e) => {
                                setIsDirty(true);
                                setTag(e.target.value as ExperienceTag);
                              }}
                              disabled={isSaving}
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

                        {/* Type Select */}
                        <div className="flex items-baseline gap-2">
                          <label
                            htmlFor="edit-exp-type"
                            className="shrink-0 tracking-wide font-normal"
                          >
                            type :
                          </label>
                          <div className="relative inline-block">
                            <select
                              id="edit-exp-type"
                              value={type}
                              onChange={(e) => {
                                setIsDirty(true);
                                setType(e.target.value as ExperienceType);
                              }}
                              disabled={isSaving}
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

                        {/* Skills Multi-Select */}
                        <div className="flex items-baseline gap-2">
                          <span className="shrink-0 tracking-wide font-normal">
                            skills :
                          </span>
                          <SkillsMultiSelect
                            id="edit-exp-skills"
                            selectedSkillIds={selectedSkills}
                            onChange={(ids) => {
                              setIsDirty(true);
                              setSelectedSkills(ids);
                            }}
                            availableSkills={availableSkills}
                            disabled={isSaving}
                          />
                        </div>

                        {/* Weight Select */}
                        <div className="flex items-baseline gap-2">
                          <label
                            htmlFor="edit-exp-weight"
                            className="shrink-0 tracking-wide font-normal"
                          >
                            weight :
                          </label>
                          <WeightSelect
                            id="edit-exp-weight"
                            value={weight}
                            onChange={(val) => {
                              setIsDirty(true);
                              setWeight(val);
                            }}
                            disabled={isSaving}
                          />
                        </div>
                      </>
                    )}

                    {/* Start Date */}
                    <div className="flex items-baseline gap-2">
                      <label
                        htmlFor={`edit-exp-start-${idx}`}
                        className="shrink-0 tracking-wide font-normal"
                      >
                        start date
                      </label>
                      <input
                        id={`edit-exp-start-${idx}`}
                        type="text"
                        value={pos.startDateInput}
                        onChange={(e) =>
                          handleUpdatePosition(
                            idx,
                            "startDateInput",
                            e.target.value
                          )
                        }
                        disabled={isSaving}
                        data-ascii="skip"
                        placeholder="[dd/mm/yy]"
                        className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-28 sm:w-32 transition-colors placeholder:text-white/40"
                      />
                    </div>

                    {/* End Date & Present Toggle */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <label
                        htmlFor={`edit-exp-end-${idx}`}
                        className="shrink-0 tracking-wide font-normal"
                      >
                        end date
                      </label>
                      <input
                        id={`edit-exp-end-${idx}`}
                        type="text"
                        value={pos.isCurrent ? "" : pos.endDateInput}
                        onChange={(e) =>
                          handleUpdatePosition(idx, "endDateInput", e.target.value)
                        }
                        disabled={pos.isCurrent || isSaving}
                        data-ascii="skip"
                        placeholder={pos.isCurrent ? "[present]" : "[dd/mm/yy]"}
                        className={`bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-28 sm:w-32 transition-colors placeholder:text-white/40 ${
                          pos.isCurrent ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleTogglePresent(idx)}
                        disabled={isSaving}
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

                  {/* Right Column: Tabbed Upload Box (Blue #1740A2 in Drawer) */}
                  <div className="lg:col-span-5 flex flex-col items-start lg:items-end w-full">
                    <CertificateUploadBox
                      variant="blue"
                      disabled={isSaving}
                      tabs={[
                        {
                          key: "icon",
                          label: "Icon",
                          badge: isFirst && (iconFile || experience.iconUrl) ? 1 : 0,
                        },
                        {
                          key: "cert",
                          label: "Cert",
                          badge: pos.stagedCertFiles.length + pos.existingCertUrls.length,
                        },
                        {
                          key: "media",
                          label: "Media",
                          badge: pos.stagedMediaFiles.length + pos.existingMediaUrls.length,
                        },
                      ]}
                      activeTab={activeTab}
                      onTabChange={(newTab) =>
                        setActiveTabs((prev) => ({ ...prev, [idx]: newTab }))
                      }
                      stagedFiles={stagedFilesForTab}
                      existingUrls={existingUrlsForTab}
                      onAddFiles={(files) => handleAddFiles(idx, files)}
                      onRemoveStagedFile={(fIdx) => handleRemoveStagedFile(idx, fIdx)}
                      readOnlyNote={readOnlyNote}
                    />
                  </div>
                </div>
              );
            })}

            {/* + Add Position */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddPosition}
                disabled={isSaving}
                className="text-white hover:text-eva-teal font-exo2 text-sm tracking-wide transition-colors cursor-pointer"
              >
                + Add Position
              </button>
            </div>
          </div>

          {/* Pinned Bottom Action Area: Save stays pinned above the hazard stripe band */}
          <div className="shrink-0 p-6 sm:p-8 pt-3 pb-4 bg-[#7B47DC]/95 border-t border-white/20 flex items-center justify-between z-20">
            <button
              type="submit"
              disabled={isSaving}
              data-ascii="fade"
              className="bg-[#1740A2] hover:bg-[#1f4dc2] disabled:opacity-50 text-white font-exo2 text-base px-8 py-1 tracking-wider uppercase transition-colors cursor-pointer"
            >
              {isSaving ? "SAVING..." : "Save"}
            </button>
          </div>
        </form>
      </SideDrawer>

      {/* Delete Confirmation Modal for Existing Saved Position Removal */}
      {positionToDeleteIndex !== null && (
        <DeleteConfirmModal
          isOpen={positionToDeleteIndex !== null}
          itemType="position"
          itemName={positions[positionToDeleteIndex]?.position || `Position #${positionToDeleteIndex + 1}`}
          onConfirm={handleConfirmDeletePosition}
          onCancel={() => setPositionToDeleteIndex(null)}
          isDeleting={isSaving}
        />
      )}
    </>
  );
}

export function EditExperienceDrawer({
  experience,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  availableSkills,
}: EditExperienceDrawerProps) {
  if (!experience || !isOpen) {
    return null;
  }

  return (
    <EditExperienceDrawerContent
      key={experience._id}
      experience={experience}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      availableSkills={availableSkills}
    />
  );
}

export default EditExperienceDrawer;
