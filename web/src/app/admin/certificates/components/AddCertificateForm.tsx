"use client";

import React, { useState, useRef } from "react";
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

export function prepareCertificateData(data: {
  title: string;
  description: string;
  link?: string;
  organization: string;
  weight: number;
  createdAt?: string;
  mediaFile: File | null;
}) {
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    link: data.link ? data.link.trim() : undefined,
    organization: data.organization.trim(),
    weight: data.weight,
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : undefined,
    mediaFile: data.mediaFile,
  };
}

export function validateCertificateForm(data: {
  title: string;
  organization: string;
  link?: string;
}): {
  isValid: boolean;
  error: string | null;
  invalidField: "title" | "organization" | "link" | null;
} {
  const trimmedTitle = data.title.trim();
  if (!trimmedTitle) {
    return { isValid: false, error: "Title is required", invalidField: "title" };
  }

  const trimmedOrg = data.organization.trim();
  if (!trimmedOrg) {
    return {
      isValid: false,
      error: "Organization is required",
      invalidField: "organization",
    };
  }

  const trimmedLink = data.link ? data.link.trim() : "";
  if (trimmedLink && !isValidCredentialUrl(trimmedLink)) {
    return {
      isValid: false,
      error: "Credential URL must start with http:// or https://",
      invalidField: "link",
    };
  }

  return { isValid: true, error: null, invalidField: null };
}

export function scrollFieldIntoViewAndFocus(
  element: HTMLElement | null,
  container?: HTMLElement | null
) {
  if (!element) return;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";

  if (typeof element.scrollIntoView === "function") {
    try {
      element.scrollIntoView({ behavior, block: "center" });
    } catch {
      element.scrollIntoView();
    }
  } else if (container && typeof container.scrollBy === "function") {
    const containerRect = typeof container.getBoundingClientRect === "function" ? container.getBoundingClientRect() : null;
    const elementRect = typeof element.getBoundingClientRect === "function" ? element.getBoundingClientRect() : null;
    const topDiff = containerRect && elementRect ? elementRect.top - containerRect.top - 8 : 50;
    container.scrollBy({ top: topDiff, behavior });
  }

  if (typeof element.focus === "function") {
    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  }
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

  const titleInputRef = useRef<HTMLInputElement>(null);
  const orgInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateCertificateForm({ title, organization, link });
    if (!validation.isValid) {
      setError(validation.error);
      if (validation.invalidField === "title") {
        scrollFieldIntoViewAndFocus(titleInputRef.current);
      } else if (validation.invalidField === "organization") {
        scrollFieldIntoViewAndFocus(orgInputRef.current);
      } else if (validation.invalidField === "link") {
        scrollFieldIntoViewAndFocus(linkInputRef.current);
      }
      return;
    }

    try {
      const payload = prepareCertificateData({
        title,
        description,
        link,
        organization,
        weight,
        createdAt,
        mediaFile,
      });
      await onSubmit(payload);

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
        {/* Left Column: Add Certificate Form Fields in Natural Height */}
        <div className="lg:col-span-7 flex flex-col font-exo2 text-white">
          {/* Section Heading */}
          <h2 className="text-2xl sm:text-[28px] font-normal tracking-wide text-white shrink-0 mb-3">
            Add Certificate. . . .
          </h2>

          {/* Form Fields: Natural Flow, No Inner Overflow Container */}
          <div className="space-y-3 pt-1 text-sm sm:text-base pr-2">
            {/* Title */}
            <div className="flex items-baseline gap-2">
              <label htmlFor="add-cert-title" className="shrink-0 tracking-wide font-normal">
                Title:
              </label>
              <input
                ref={titleInputRef}
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
                ref={linkInputRef}
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
                ref={orgInputRef}
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

          {/* Action & Validation Area in normal flow directly below fields */}
          <div className="pt-4 flex flex-col items-start gap-2">
            {/* Validation Error Message */}
            {error && (
              <div role="alert" className="text-eva-red font-mono text-xs">
                ERR: {error}
              </div>
            )}

            {/* Action button */}
            <button
              type="submit"
              disabled={isSubmitting}
              data-ascii="fade"
              className="bg-[#1740A2] hover:bg-[#1f4dc2] disabled:opacity-50 text-white font-exo2 text-xs sm:text-sm px-5 py-1.5 tracking-wider uppercase transition-colors cursor-pointer"
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
