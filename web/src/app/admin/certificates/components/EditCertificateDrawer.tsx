"use client";

import React, { useRef, useState, useCallback } from "react";
import { Certificate } from "@/lib/api/types";
import WeightSelect, {
  normalizeWeight,
} from "@/app/admin/skills-achievements/components/WeightSelect";
import { SideDrawer } from "@/components/admin/SideDrawer";
import CertificateUploadBox from "./CertificateUploadBox";
import {
  formatCertificateDate,
  isValidCredentialUrl,
  toDateInputValue,
} from "../utils";

export interface EditCertificateDrawerProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
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
  ) => Promise<void>;
  isSaving?: boolean;
}

interface EditCertificateDrawerContentProps {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
  onSave: EditCertificateDrawerProps["onSave"];
  isSaving?: boolean;
}

function EditCertificateDrawerContent({
  certificate,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: EditCertificateDrawerContentProps) {
  const [title, setTitle] = useState(certificate.title || "");
  const [description, setDescription] = useState(certificate.description || "");
  const [link, setLink] = useState(certificate.link || "");
  const [organization, setOrganization] = useState(certificate.organization || "");
  const [weight, setWeight] = useState(normalizeWeight(certificate.weight));
  const [createdAt, setCreatedAt] = useState(toDateInputValue(certificate.createdAt));
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  const isFormDirty = useCallback((): boolean => {
    return (
      title !== (certificate.title || "") ||
      description !== (certificate.description || "") ||
      link !== (certificate.link || "") ||
      organization !== (certificate.organization || "") ||
      weight !== normalizeWeight(certificate.weight) ||
      createdAt !== toDateInputValue(certificate.createdAt) ||
      mediaFile !== null
    );
  }, [certificate, title, description, link, organization, weight, createdAt, mediaFile]);

  const handleBeforeClose = useCallback((): boolean => {
    if (isSaving) return false; // Block closing while saving/uploading is active
    if (isFormDirty()) {
      return window.confirm(
        "You have unsaved changes. Discard changes and close?"
      );
    }
    return true;
  }, [isSaving, isFormDirty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }

    const trimmedOrg = organization.trim();
    if (!trimmedOrg) {
      setError("Organization is required");
      return;
    }

    const trimmedLink = link.trim();
    if (trimmedLink && !isValidCredentialUrl(trimmedLink)) {
      setError("Credential URL must start with http:// or https://");
      return;
    }

    try {
      await onSave(
        certificate._id,
        {
          title: trimmedTitle,
          description: description.trim(),
          link: trimmedLink,
          organization: trimmedOrg,
          weight,
          createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
        },
        mediaFile
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update certificate");
    }
  };

  const formattedRecordDate = formatCertificateDate(certificate.createdAt);
  const headingText = `Edit Certificate [${certificate.organization} @${formattedRecordDate}]. . . .`;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      isBlockingClose={isSaving}
      onBeforeClose={handleBeforeClose}
      initialFocusRef={titleInputRef}
      ariaLabelledBy="edit-certificate-heading"
    >
      {/* Heading with trailing dots */}
      <h2
        id="edit-certificate-heading"
        className="font-exo2 text-2xl sm:text-3xl font-normal tracking-wide text-white leading-tight break-words"
      >
        {headingText}
      </h2>

      <form onSubmit={handleSubmit} data-ascii="skip" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Form Fields on the Left */}
          <div className="md:col-span-7 space-y-3 font-exo2 text-white text-sm sm:text-base">
            {/* Title */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="edit-cert-title" className="shrink-0 tracking-wide font-normal">
                Title:
              </label>
              <input
                ref={titleInputRef}
                id="edit-cert-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
                data-ascii="skip"
                className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full transition-colors"
              />
            </div>

            {/* Description */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="edit-cert-description" className="shrink-0 tracking-wide font-normal">
                Description:
              </label>
              <input
                id="edit-cert-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                data-ascii="skip"
                className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full transition-colors"
              />
            </div>

            {/* Credential URL */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="edit-cert-link" className="shrink-0 tracking-wide font-normal">
                credential url:
              </label>
              <input
                id="edit-cert-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={isSaving}
                data-ascii="skip"
                className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full transition-colors"
              />
            </div>

            {/* Organization */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="edit-cert-organization" className="shrink-0 tracking-wide font-normal">
                organization:
              </label>
              <input
                id="edit-cert-organization"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                disabled={isSaving}
                data-ascii="skip"
                className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full transition-colors"
              />
            </div>

            {/* Weight Select */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="edit-cert-weight" className="shrink-0 tracking-wide font-normal">
                weight:
              </label>
              <WeightSelect
                id="edit-cert-weight"
                value={weight}
                onChange={setWeight}
                disabled={isSaving}
              />
            </div>

            {/* Created At Date */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="edit-cert-created-at" className="shrink-0 tracking-wide font-normal">
                created At:
              </label>
              <div className="inline-flex items-center gap-1.5 border-b border-white">
                <input
                  id="edit-cert-created-at"
                  type="date"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  disabled={isSaving}
                  data-ascii="skip"
                  className="bg-transparent text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-36 sm:w-40 cursor-pointer [color-scheme:dark]"
                />
                <span aria-hidden="true" className="text-white/80 select-none pr-1 text-sm">
                  
                </span>
              </div>
            </div>
          </div>

          {/* Orange Upload Box on the Right */}
          <div className="md:col-span-5 flex flex-col items-center md:items-end w-full">
            <CertificateUploadBox
              variant="orange"
              currentUrl={certificate.mediaUrl}
              selectedFile={mediaFile}
              onFileSelect={(file) => setMediaFile(file)}
              disabled={isSaving}
              isUploading={isSaving && Boolean(mediaFile)}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-eva-red font-mono text-xs pt-1 bg-black/40 p-2 border border-eva-red/50">
            ERR: {error}
          </div>
        )}

        {/* Blue Save Button at Bottom-Left of Drawer */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            data-ascii="fade"
            className="bg-[#1740A2] hover:bg-[#1f4dc2] disabled:opacity-50 text-white font-exo2 text-base px-8 py-1.5 tracking-wide transition-colors uppercase cursor-pointer"
          >
            {isSaving ? "SAVING..." : "Save"}
          </button>
        </div>
      </form>
    </SideDrawer>
  );
}

export function EditCertificateDrawer({
  certificate,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: EditCertificateDrawerProps) {
  const [prevCert, setPrevCert] = useState(certificate);
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(certificate);

  if (certificate && certificate !== prevCert) {
    setPrevCert(certificate);
    setActiveCertificate(certificate);
  }

  // Initial render when no certificate has ever been selected
  if (!activeCertificate && !certificate) {
    return null;
  }

  const currentCert = certificate || activeCertificate;
  if (!currentCert) return null;

  return (
    <EditCertificateDrawerContent
      key={currentCert._id}
      certificate={currentCert}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

export default EditCertificateDrawer;
