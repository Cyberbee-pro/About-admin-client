"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Experience, Skill } from "@/lib/api/types";
import { useLatestRequest } from "@/lib/hooks/useLatestRequest";
import {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  addExperiencePosition,
} from "@/lib/api/experienceService";
import { getSkills } from "@/lib/api/skillService";
import AddExperienceForm, { AddExperienceSubmitPayload } from "./components/AddExperienceForm";
import ExperiencesGrid from "./components/ExperiencesGrid";
import EditExperienceDrawer, { EditExperienceSavePayload } from "./components/EditExperienceDrawer";
import DeleteConfirmModal from "../skills-achievements/components/DeleteConfirmModal";

const PatternWaves = dynamic(() => import("@/components/designs/PatternWaves"), {
  ssr: false,
});

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { execute: executeLatestExperiences } = useLatestRequest();
  const { execute: executeLatestSkills } = useLatestRequest();

  // Edit Drawer state
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);

  // Operation flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Experience | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Banner
  const [statusNotice, setStatusNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const loadExperiences = useCallback(async () => {
    await executeLatestExperiences(
      () => getExperiences(),
      {
        onSuccess: (res) => {
          if (res && res.data) {
            setExperiences(res.data);
            setError(null);
          }
        },
        onError: (err) => {
          console.error("Failed to load experiences:", err);
          const errorMsg =
            err instanceof Error ? err.message : "Failed to fetch experiences";
          setError(errorMsg);
        },
        onSettled: (isLatest) => {
          if (isLatest) {
            setLoading(false);
          }
        },
      }
    );
  }, [executeLatestExperiences]);

  const loadSkills = useCallback(async () => {
    await executeLatestSkills(
      () => getSkills(),
      {
        onSuccess: (res) => {
          if (res && res.data) {
            setAvailableSkills(res.data);
          }
        },
        onError: (err) => {
          console.error("Failed to load skills for multi-select:", err);
        },
      }
    );
  }, [executeLatestSkills]);

  useEffect(() => {
    void loadExperiences();
    void loadSkills();
  }, [loadExperiences, loadSkills]);

  // Handle Create Experience
  const handleCreateExperience = async (payload: AddExperienceSubmitPayload) => {
    setIsSubmitting(true);
    setStatusNotice(null);

    try {
      const firstPos = payload.positions[0];
      const initialPositions = [
        {
          position: firstPos.position,
          description: firstPos.description,
          startDate: firstPos.startDate,
          endDate: firstPos.endDate,
          isCurrent: firstPos.isCurrent,
        },
      ];

      // 1. Create Experience with primary position & files
      const res = await createExperience(
        {
          organization: payload.organization,
          tag: payload.tag,
          type: payload.type,
          weight: payload.weight,
          skills: payload.skills,
          positions: initialPositions,
        },
        {
          iconUrl: payload.iconFile || undefined,
          mediaUrls: firstPos.mediaFiles.length > 0 ? firstPos.mediaFiles : undefined,
          certificateUrls: firstPos.certFiles.length > 0 ? firstPos.certFiles : undefined,
        }
      );

      if (!res || !res.data) {
        throw new Error("Failed to create experience (no data returned)");
      }

      // 2. Append any additional positions (positions 1..n)
      if (payload.positions.length > 1) {
        const failedPositions: number[] = [];
        for (let i = 1; i < payload.positions.length; i++) {
          const extraPos = payload.positions[i];
          try {
            await addExperiencePosition(
              payload.organization,
              {
                position: extraPos.position,
                description: extraPos.description,
                startDate: extraPos.startDate,
                endDate: extraPos.endDate,
                isCurrent: extraPos.isCurrent,
              },
              {
                mediaUrls: extraPos.mediaFiles.length > 0 ? extraPos.mediaFiles : undefined,
                certificateUrls: extraPos.certFiles.length > 0 ? extraPos.certFiles : undefined,
              }
            );
          } catch (appendErr) {
            console.error(`Failed to append position ${i + 1}:`, appendErr);
            failedPositions.push(i + 1);
          }
        }

        if (failedPositions.length > 0) {
          setStatusNotice({
            type: "error",
            message: `Experience created, but failed to append position(s): ${failedPositions.join(", ")}. Please edit the experience to re-add them.`,
          });
          await loadExperiences();
          return;
        }
      }

      setStatusNotice({
        type: "success",
        message: `Experience "${payload.organization}" successfully created.`,
      });

      await loadExperiences();

      // Scroll admin scroll container to top to show notice banner and new experience
      if (typeof document !== "undefined") {
        const container = document.querySelector<HTMLElement>("[data-admin-scroll-container]");
        if (container && typeof container.scrollTo === "function") {
          const prefersReducedMotion =
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          container.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? "auto" : "smooth",
          });
        }
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create experience";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit/Save Experience
  const handleSaveExperience = async (payload: EditExperienceSavePayload) => {
    setIsSaving(true);
    setStatusNotice(null);

    try {
      // 1. Prepare existing positions array preserving _id and existing asset URLs
      const existingPositionsToSave = payload.existingPositions.map((p) => ({
        _id: p._id,
        position: p.position,
        description: p.description,
        startDate: p.startDate,
        endDate: p.endDate,
        isCurrent: p.isCurrent,
        mediaUrls: p.mediaUrls,
        certificateUrls: p.certificateUrls,
      }));

      const firstPos = payload.existingPositions[0];

      // Update experience record via PUT
      const res = await updateExperience(
        payload.experienceId,
        {
          organization: payload.organization,
          tag: payload.tag,
          type: payload.type,
          weight: payload.weight,
          skills: payload.skills,
          positions: existingPositionsToSave,
        },
        {
          iconUrl: payload.iconFile || undefined,
          mediaUrls: firstPos?.stagedMediaFiles?.length ? firstPos.stagedMediaFiles : undefined,
          certificateUrls: firstPos?.stagedCertFiles?.length ? firstPos.stagedCertFiles : undefined,
        }
      );

      if (!res || !res.data) {
        throw new Error("Failed to update experience");
      }

      // 2. Append newly added positions via POST /experiences/:organization/positions
      if (payload.newPositions.length > 0) {
        const failedAppends: string[] = [];
        for (const newPos of payload.newPositions) {
          try {
            await addExperiencePosition(
              payload.organization,
              {
                position: newPos.position,
                description: newPos.description,
                startDate: newPos.startDate,
                endDate: newPos.endDate,
                isCurrent: newPos.isCurrent,
              },
              {
                mediaUrls: newPos.stagedMediaFiles.length ? newPos.stagedMediaFiles : undefined,
                certificateUrls: newPos.stagedCertFiles.length ? newPos.stagedCertFiles : undefined,
              }
            );
          } catch (err) {
            console.error(`Failed to append new position "${newPos.position}":`, err);
            failedAppends.push(newPos.position);
          }
        }

        if (failedAppends.length > 0) {
          setStatusNotice({
            type: "error",
            message: `Experience updated, but failed to append position(s): ${failedAppends.join(", ")}.`,
          });
          await loadExperiences();
          return;
        }
      }

      setStatusNotice({
        type: "success",
        message: `Experience "${payload.organization}" successfully updated.`,
      });

      await loadExperiences();
      setEditingExperience(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update experience";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Experience
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await deleteExperience(deleteTarget._id);
      setExperiences((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setStatusNotice({
        type: "success",
        message: `Experience "${deleteTarget.organization}" deleted.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setStatusNotice({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to delete experience",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative min-h-full flex flex-col justify-between overflow-x-hidden bg-black text-white">
      {/* Dynamic WebGL Pattern Waves Background matching design system */}
      <div
        className="absolute inset-0 z-0 opacity-80 pointer-events-none overflow-hidden"
        aria-hidden="true"
        data-testid="experiences-pattern-waves"
      >
        <PatternWaves
          preset="terminal"
          color="#ffffff"
          backgroundColor="#12121b"
          fade="edges"
          fadeSize={0.4}
          interactive={true}
          speed={0.35}
          contrast={1.4}
          depth={0.8}
          className="w-full h-full"
        />
      </div>

      {/* Sticky Notification Banner */}
      {statusNotice && (
        <div
          role="status"
          aria-live="polite"
          data-ascii="skip"
          className={`sticky top-16 z-30 mx-6 mt-4 px-4 py-2 border font-mono text-xs flex items-center justify-between shadow-lg backdrop-blur-md ${
            statusNotice.type === "error"
              ? "bg-[#1c0000]/95 border-eva-red text-eva-red"
              : "bg-[#0b1f14]/95 border-eva-lime text-eva-lime"
          }`}
        >
          <span>{statusNotice.message}</span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-white/70 hover:text-white uppercase font-bold ml-4 cursor-pointer"
          >
            [CLOSE]
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 p-6 md:p-8 space-y-10 max-w-[1600px] w-full mx-auto flex-1 pb-20 sm:pb-24">
        {/* Section 1: Add Experience Form & Upload Box */}
        <AddExperienceForm
          onSubmit={handleCreateExperience}
          isSubmitting={isSubmitting}
          availableSkills={availableSkills}
        />

        {/* Section 2: Past Experiences Grid */}
        <ExperiencesGrid
          experiences={experiences}
          loading={loading}
          error={error}
          onRetry={() => {
            setLoading(true);
            void loadExperiences();
          }}
          onEdit={(exp) => setEditingExperience(exp)}
          onDelete={(exp) => setDeleteTarget(exp)}
        />
      </div>

      {/* Hazard Strip Footer matching Wireframes pinned at bottom */}
      <div className="sticky bottom-0 z-20 w-full h-8 sm:h-10 overflow-hidden shrink-0 bg-black">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "url('/eva dash/haz_strip.svg')",
            backgroundRepeat: "repeat-x",
            backgroundSize: "contain",
          }}
        />
      </div>

      {/* Edit Experience Slide-in Drawer */}
      <EditExperienceDrawer
        experience={editingExperience}
        isOpen={Boolean(editingExperience)}
        onClose={() => setEditingExperience(null)}
        onSave={handleSaveExperience}
        isSaving={isSaving}
        availableSkills={availableSkills}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          itemType="experience"
          itemName={deleteTarget.organization}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
