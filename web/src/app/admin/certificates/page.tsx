"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Certificate } from "@/lib/api/types";
import { useLatestRequest } from "@/lib/hooks/useLatestRequest";
import {
  getCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "@/lib/api/certificateService";
import AddCertificateForm from "./components/AddCertificateForm";
import CertificatesGrid from "./components/CertificatesGrid";
import EditCertificateDrawer from "./components/EditCertificateDrawer";
import DeleteConfirmModal from "../skills-achievements/components/DeleteConfirmModal";

const PatternWaves = dynamic(() => import("@/components/designs/PatternWaves"), {
  ssr: false,
});

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { execute: executeLatestCertificates } = useLatestRequest();

  // Edit Drawer state
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);

  // Operation flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Banner
  const [statusNotice, setStatusNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const loadCertificates = useCallback(async () => {
    await executeLatestCertificates(
      () => getCertificates(),
      {
        onSuccess: (res) => {
          if (res && res.data) {
            setCertificates(res.data);
            setError(null);
          }
        },
        onError: (err) => {
          console.error("Failed to load certificates:", err);
          const errorMsg =
            err instanceof Error ? err.message : "Failed to fetch certificates";
          setError(errorMsg);
          setStatusNotice({
            type: "error",
            message: errorMsg,
          });
        },
        onSettled: (isLatest) => {
          if (isLatest) {
            setLoading(false);
          }
        },
      }
    );
  }, [executeLatestCertificates]);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  // Handle Create Certificate
  const handleAddCertificate = async (data: {
    title: string;
    description: string;
    link?: string;
    organization: string;
    weight: number;
    createdAt?: string;
    mediaFile: File | null;
  }) => {
    setIsSubmitting(true);
    setStatusNotice(null);

    try {
      const res = await createCertificate(
        {
          title: data.title,
          description: data.description,
          link: data.link,
          organization: data.organization,
          weight: data.weight,
          createdAt: data.createdAt,
        },
        data.mediaFile ? { mediaUrl: data.mediaFile } : undefined
      );

      if (res && res.data) {
        setStatusNotice({
          type: "success",
          message: `Certificate "${data.title}" successfully created.`,
        });
        await loadCertificates();

        // Scroll the admin scroll container to top to reveal notice banner and new certificate
        if (typeof document !== "undefined") {
          const container = document.querySelector<HTMLElement>(
            "[data-admin-scroll-container]"
          );
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
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create certificate";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit/Save Certificate
  const handleSaveCertificate = async (
    id: string,
    data: {
      title?: string;
      description?: string;
      link?: string;
      organization?: string;
      weight?: number;
      createdAt?: string;
    },
    mediaFile?: File | null
  ) => {
    setIsSaving(true);
    setStatusNotice(null);

    try {
      const res = await updateCertificate(
        id,
        data,
        mediaFile ? { mediaUrl: mediaFile } : undefined
      );

      if (res && res.data) {
        setCertificates((prev) =>
          prev.map((c) => (c._id === id ? res.data : c))
        );
        setStatusNotice({
          type: "success",
          message: `Certificate "${data.title || res.data.title}" updated.`,
        });
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update certificate";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Confirm Delete Certificate
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await deleteCertificate(deleteTarget._id);
      setCertificates((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setStatusNotice({
        type: "success",
        message: `Certificate "${deleteTarget.title}" deleted.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setStatusNotice({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to delete certificate",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative min-h-full flex flex-col justify-between overflow-x-hidden bg-black text-white">
      {/* Dynamic WebGL Pattern Waves Background matching Overview and Skills-Achievements */}
      <div
        className="absolute inset-0 z-0 opacity-80 pointer-events-none overflow-hidden"
        aria-hidden="true"
        data-testid="certificates-pattern-waves"
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
        {/* Section 1: Add Certificate Form & Upload cert Box */}
        <AddCertificateForm
          onSubmit={handleAddCertificate}
          isSubmitting={isSubmitting}
        />

        {/* Section 2: Past Certificates Grid */}
        <CertificatesGrid
          certificates={certificates}
          loading={loading}
          error={error}
          onRetry={() => {
            setLoading(true);
            void loadCertificates();
          }}
          onEdit={(cert) => setEditingCert(cert)}
          onDelete={(cert) => setDeleteTarget(cert)}
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

      {/* Edit Certificate Slide-in Drawer */}
      <EditCertificateDrawer
        certificate={editingCert}
        isOpen={Boolean(editingCert)}
        onClose={() => setEditingCert(null)}
        onSave={handleSaveCertificate}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          itemType="certificate"
          itemName={deleteTarget.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
