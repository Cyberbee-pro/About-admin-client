"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Skill, Achievement, SkillType } from "@/lib/api/types";
import { useLatestRequest } from "@/lib/hooks/useLatestRequest";
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from "@/lib/api/skillService";
import {
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "@/lib/api/achievementService";
import AddSkillForm from "./components/AddSkillForm";
import EditSkillPanel from "./components/EditSkillPanel";
import SkillsList from "./components/SkillsList";
import AddAchievementForm from "./components/AddAchievementForm";
import EditAchievementPanel from "./components/EditAchievementPanel";
import AchievementsList from "./components/AchievementsList";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

const PatternWaves = dynamic(() => import("@/components/designs/PatternWaves"), {
  ssr: false,
});

export default function SkillsAndAchievementsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [achievementsError, setAchievementsError] = useState<string | null>(null);

  const { execute: executeLatestSkills } = useLatestRequest();
  const { execute: executeLatestAchievements } = useLatestRequest();

  // Edit states (only one edit panel per section at a time)
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);

  // Operation flags
  const [isSubmittingSkill, setIsSubmittingSkill] = useState(false);
  const [isSavingSkill, setIsSavingSkill] = useState(false);
  const [isSubmittingAchievement, setIsSubmittingAchievement] = useState(false);
  const [isSavingAchievement, setIsSavingAchievement] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "skill" | "achievement";
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Global notification banner for errors or successes
  const [statusNotice, setStatusNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  // Load Skills from API
  const loadSkills = useCallback(async () => {
    await executeLatestSkills(
      () => getSkills(),
      {
        onSuccess: (res) => {
          if (res && res.data) {
            setSkills(res.data);
            setSkillsError(null);
          }
        },
        onError: (err) => {
          console.error("Failed to load skills:", err);
          const errorMsg =
            err instanceof Error ? err.message : "Failed to fetch skills";
          setSkillsError(errorMsg);
        },
        onSettled: (isLatest) => {
          if (isLatest) {
            setLoadingSkills(false);
          }
        },
      }
    );
  }, [executeLatestSkills]);

  // Load Achievements from API
  const loadAchievements = useCallback(async () => {
    await executeLatestAchievements(
      () => getAchievements(),
      {
        onSuccess: (res) => {
          if (res && res.data) {
            setAchievements(res.data);
            setAchievementsError(null);
          }
        },
        onError: (err) => {
          console.error("Failed to load achievements:", err);
          const errorMsg =
            err instanceof Error ? err.message : "Failed to fetch achievements";
          setAchievementsError(errorMsg);
        },
        onSettled: (isLatest) => {
          if (isLatest) {
            setLoadingAchievements(false);
          }
        },
      }
    );
  }, [executeLatestAchievements]);

  useEffect(() => {
    void loadSkills();
    void loadAchievements();
  }, [loadSkills, loadAchievements]);

  // Handle Add Skill Submit
  const handleAddSkill = async (data: {
    name: string;
    weight: number;
    type: SkillType;
    featured: boolean;
    logoFile: File | null;
  }) => {
    setIsSubmittingSkill(true);
    setStatusNotice(null);
    try {
      await createSkill(
        {
          name: data.name,
          weight: data.weight,
          type: data.type,
          featured: data.featured,
        },
        data.logoFile ? { logoUrl: data.logoFile } : undefined
      );
      setStatusNotice({
        type: "success",
        message: `SKILL "${data.name.toUpperCase()}" CREATED SUCCESSFULLY`,
      });
      await loadSkills();
    } finally {
      setIsSubmittingSkill(false);
    }
  };

  // Handle Save Edited Skill
  const handleSaveSkill = async (
    id: string,
    data: {
      name: string;
      weight: number;
      type: SkillType;
      featured: boolean;
      logoFile: File | null;
    }
  ) => {
    setIsSavingSkill(true);
    setStatusNotice(null);
    try {
      await updateSkill(
        id,
        {
          name: data.name,
          weight: data.weight,
          type: data.type,
          featured: data.featured,
        },
        data.logoFile ? { logoUrl: data.logoFile } : undefined
      );
      setStatusNotice({
        type: "success",
        message: `SKILL "${data.name.toUpperCase()}" UPDATED SUCCESSFULLY`,
      });
      setEditingSkillId(null);
      await loadSkills();
    } finally {
      setIsSavingSkill(false);
    }
  };

  // Handle Add Achievement Submit
  const handleAddAchievement = async (data: {
    title: string;
    date: string;
    detail: string;
    weight: number;
    featured: boolean;
  }) => {
    setIsSubmittingAchievement(true);
    setStatusNotice(null);
    try {
      await createAchievement({
        title: data.title,
        date: data.date,
        detail: data.detail,
        weight: data.weight,
        featured: data.featured,
      });
      setStatusNotice({
        type: "success",
        message: `ACHIEVEMENT "${data.title.toUpperCase()}" RECORDED SUCCESSFULLY`,
      });
      await loadAchievements();
    } finally {
      setIsSubmittingAchievement(false);
    }
  };

  // Handle Save Edited Achievement
  const handleSaveAchievement = async (
    id: string,
    data: {
      title: string;
      date: string;
      detail: string;
      weight: number;
      featured: boolean;
    }
  ) => {
    setIsSavingAchievement(true);
    setStatusNotice(null);
    try {
      await updateAchievement(id, {
        title: data.title,
        date: data.date,
        detail: data.detail,
        weight: data.weight,
        featured: data.featured,
      });
      setStatusNotice({
        type: "success",
        message: `ACHIEVEMENT "${data.title.toUpperCase()}" UPDATED SUCCESSFULLY`,
      });
      setEditingAchievementId(null);
      await loadAchievements();
    } finally {
      setIsSavingAchievement(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setStatusNotice(null);
    try {
      if (deleteTarget.type === "skill") {
        await deleteSkill(deleteTarget.id);
        if (editingSkillId === deleteTarget.id) setEditingSkillId(null);
        await loadSkills();
      } else {
        await deleteAchievement(deleteTarget.id);
        if (editingAchievementId === deleteTarget.id) setEditingAchievementId(null);
        await loadAchievements();
      }
      setStatusNotice({
        type: "success",
        message: `${deleteTarget.type.toUpperCase()} "${deleteTarget.name.toUpperCase()}" PURGED SUCCESSFULLY`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setStatusNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to purge record",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const editingSkill = skills.find((s) => s._id === editingSkillId);
  const editingAchievement = achievements.find((a) => a._id === editingAchievementId);

  return (
    <div className="relative flex-1 bg-black text-white flex flex-col justify-between min-h-[calc(100vh-4rem)] select-none overflow-hidden">
      {/* WebGL PatternWaves Dynamic Background */}
      <div
        className="absolute inset-0 z-0 opacity-80 pointer-events-none overflow-hidden"
        aria-hidden="true"
        data-testid="skills-pattern-waves"
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

      {/* Optional Feedback Alert Banner */}
      {statusNotice && (
        <div
          role="status"
          aria-live="polite"
          data-ascii="skip"
          className={`mx-6 mt-4 px-4 py-2 border font-mono text-xs flex items-center justify-between z-20 ${
            statusNotice.type === "error"
              ? "bg-eva-red/20 border-eva-red text-eva-red"
              : "bg-eva-lime/10 border-eva-lime text-eva-lime"
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

      {/* Main Content: 2-Column Side-by-Side Wireframe Layout */}
      <div className="relative z-10 p-6 md:p-8 space-y-8 max-w-[1600px] w-full mx-auto flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* COLUMN 1: SKILLS */}
          <div className="space-y-6 flex flex-col">
            {/* 1. Add Skill Form */}
            <AddSkillForm
              onSubmit={handleAddSkill}
              isSubmitting={isSubmittingSkill}
            />

            {/* 2. Inline Edit Skills Panel (State 2: appears between Add Skill and All Skills) */}
            {editingSkill && (
              <EditSkillPanel
                key={editingSkill._id}
                skill={editingSkill}
                onSave={handleSaveSkill}
                onCancel={() => setEditingSkillId(null)}
                isSaving={isSavingSkill}
              />
            )}

            {/* 3. All Skills List */}
            <SkillsList
              skills={skills}
              loading={loadingSkills}
              error={skillsError}
              onRetry={() => {
                setLoadingSkills(true);
                void loadSkills();
              }}
              onEdit={(skill) => {
                setEditingSkillId(skill._id);
              }}
              onDelete={(skill) => {
                setDeleteTarget({
                  type: "skill",
                  id: skill._id,
                  name: skill.name,
                });
              }}
            />
          </div>

          {/* COLUMN 2: ACHIEVEMENTS */}
          <div className="space-y-6 flex flex-col">
            {/* 1. Add Achievement Form */}
            <AddAchievementForm
              onSubmit={handleAddAchievement}
              isSubmitting={isSubmittingAchievement}
            />

            {/* 2. Inline Edit Achievement Panel (State 3: appears between Add Achievement and All Achievements) */}
            {editingAchievement && (
              <EditAchievementPanel
                key={editingAchievement._id}
                achievement={editingAchievement}
                onSave={handleSaveAchievement}
                onCancel={() => setEditingAchievementId(null)}
                isSaving={isSavingAchievement}
              />
            )}

            {/* 3. All Achievements List */}
            <AchievementsList
              achievements={achievements}
              loading={loadingAchievements}
              error={achievementsError}
              onRetry={() => {
                setLoadingAchievements(true);
                void loadAchievements();
              }}
              onEdit={(ach) => {
                setEditingAchievementId(ach._id);
              }}
              onDelete={(ach) => {
                setDeleteTarget({
                  type: "achievement",
                  id: ach._id,
                  name: ach.title,
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Hazard Strip Footer matching Wireframes */}
      <div className="relative z-10 w-full h-8 sm:h-10 overflow-hidden shrink-0 mt-8">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "url('/eva dash/haz_strip.svg')",
            backgroundRepeat: "repeat-x",
            backgroundSize: "contain",
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          itemType={deleteTarget.type}
          itemName={deleteTarget.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
