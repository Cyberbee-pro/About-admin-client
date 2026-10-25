"use client";

import React, { useState } from "react";
import WeightSelect from "@/app/admin/skills-achievements/components/WeightSelect";
import CertificateUploadBox from "./CertificateUploadBox";
import { isValidCredentialUrl, toDateInputValue } from "../utils";

export interface AddCertificateFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    link?: string;
    organization: string;
    weight: number;
    createdAt?: string;
    mediaFile: File | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddCertificateForm({
  onSubmit,
  isSubmitting = false,
}: AddCertificateFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [organization, setOrganization] = useState("");
  const [weight, setWeight] = useState(1);
  const [createdAt, setCreatedAt] = useState(toDateInputValue(new Date()));
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      await onSubmit({
        title: trimmedTitle,
        description: description.trim(),
        link: trimmedLink || undefined,
        organization: trimmedOrg,
        weight,
        createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
        mediaFile,
      });

      // Reset form on success
      setTitle("");
      setDescription("");
      setLink("");
      setOrganization("");
      setWeight(1);
      setCreatedAt(toDateInputValue(new Date()));
      setMediaFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create certificate");
    }
  };

  return (
    <section aria-label="Add Certificate Section" className="w-full">
      <form
        onSubmit={handleSubmit}
        data-ascii="skip"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left Column: Add Certificate Form Fields */}
        <div className="lg:col-span-7 space-y-4 font-exo2 text-white">
          <h2 className="text-2xl sm:text-[28px] font-normal tracking-wide text-white">
            Add Certificate. . . .
          </h2>

          <div className="space-y-3 pt-1 text-sm sm:text-base">
            {/* Title */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="add-cert-title" className="shrink-0 tracking-wide font-normal">
                Title:
              </label>
              <input
                id="add-cert-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                data-ascii="skip"
                placeholder="Certificate title"
                className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors placeholder:text-white/25"
              />
            </div>

            {/* Description */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="add-cert-description" className="shrink-0 tracking-wide font-normal">
                Description:
              </label>
              <input
                id="add-cert-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                data-ascii="skip"
                placeholder="Optional description"
                className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors placeholder:text-white/25"
              />
            </div>

            {/* Credential URL */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="add-cert-link" className="shrink-0 tracking-wide font-normal">
                credential url:
              </label>
              <input
                id="add-cert-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={isSubmitting}
                data-ascii="skip"
                placeholder="https://example.com/verify"
                className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors placeholder:text-white/25"
              />
            </div>

            {/* Organization */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="add-cert-organization" className="shrink-0 tracking-wide font-normal">
                organization:
              </label>
              <input
                id="add-cert-organization"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                disabled={isSubmitting}
                data-ascii="skip"
                placeholder="Issuing authority"
                className="bg-transparent border-b border-white text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-full max-w-md transition-colors placeholder:text-white/25"
              />
            </div>

            {/* Weight Select */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="add-cert-weight" className="shrink-0 tracking-wide font-normal">
                weight:
              </label>
              <WeightSelect
                id="add-cert-weight"
                value={weight}
                onChange={setWeight}
                disabled={isSubmitting}
              />
            </div>

            {/* Created At Date Picker */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="add-cert-created-at" className="shrink-0 tracking-wide font-normal">
                created At:
              </label>
              <div className="inline-flex items-center gap-1.5 border-b border-white">
                <input
                  id="add-cert-created-at"
                  type="date"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  disabled={isSubmitting}
                  data-ascii="skip"
                  className="bg-transparent text-white font-mono text-xs sm:text-sm px-1 py-0.5 focus:outline-none focus:border-eva-teal w-36 sm:w-40 cursor-pointer [color-scheme:dark]"
                />
                <span aria-hidden="true" className="text-white/80 select-none pr-1 text-sm">
                  📅
                </span>
              </div>
            </div>
          </div>

          {/* Validation Error Message */}
          {error && (
            <div className="text-eva-red font-mono text-xs pt-1">
              ERR: {error}
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              data-ascii="fade"
              className="bg-[#1740A2] hover:bg-[#1f4dc2] disabled:opacity-50 text-white font-exo2 text-xs sm:text-sm px-5 py-1.5 tracking-wider uppercase transition-colors"
            >
              {isSubmitting ? "TRANSMITTING..." : "ADD CERTIFICATE"}
            </button>
          </div>
        </div>

        {/* Right Column: Upload Box with header "upload cert" */}
        <div className="lg:col-span-5 flex flex-col items-start lg:items-end w-full">
          <div className="w-full max-w-[320px] sm:max-w-[360px] space-y-2">
            <h3 className="font-exo2 text-xl sm:text-2xl font-normal tracking-wide text-white">
              upload cert
            </h3>
            <CertificateUploadBox
              variant="purple"
              selectedFile={mediaFile}
              onFileSelect={(file) => setMediaFile(file)}
              disabled={isSubmitting}
              isUploading={isSubmitting && Boolean(mediaFile)}
            />
          </div>
        </div>
      </form>
    </section>
  );
}

export default AddCertificateForm;
