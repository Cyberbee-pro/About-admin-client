"use client";

import React from "react";
import {
  ConfigResumeCard,
  ConfigResumeCardProps,
} from "@/app/admin/config/components/ConfigResumeCard";

export interface ResumePreviewCardProps {
  resumeDriveUrl?: string;
  resumeUrl?: string;
  previewHeight?: string | number;
  className?: string;
}

export function ResumePreviewCard({
  resumeDriveUrl,
  resumeUrl,
  previewHeight = "230px",
  className = "",
}: ResumePreviewCardProps) {
  return (
    <ConfigResumeCard
      resumeUrl={resumeUrl || resumeDriveUrl}
      editable={false}
      previewHeight={previewHeight}
      className={className}
    />
  );
}

export default ResumePreviewCard;
