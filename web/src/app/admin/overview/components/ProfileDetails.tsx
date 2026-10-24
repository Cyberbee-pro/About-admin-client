"use client";

import { useEffect, useState } from "react";
import { AsciiReveal, AsciiSkeleton } from "ascii-reveal";
import { SiteConfig } from "@/lib/api/types";
import { getConfig } from "@/lib/api/configService";

export interface ProfileDetailsProps {
  initialConfig?: SiteConfig;
}

export function ProfileDetails({ initialConfig }: ProfileDetailsProps) {
  const [config, setConfig] = useState<SiteConfig | null>(initialConfig || null);
  const [loading, setLoading] = useState<boolean>(!initialConfig);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setLoading(false);
      return;
    }

    let isMounted = true;
    getConfig()
      .then((res) => {
        if (!isMounted) return;
        setConfig(res.data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load site configuration";
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialConfig]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 text-white font-exo2 select-none" data-testid="profile-details-loading">
        <AsciiSkeleton variant="terminal" lines={1} widths={["190px"]} animate />
        <AsciiSkeleton variant="terminal" lines={1} widths={["360px"]} animate />
        <AsciiSkeleton variant="terminal" lines={1} widths={["300px"]} animate />
        <AsciiSkeleton variant="terminal" rows={3} width="100%" animate />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="p-4 rounded border border-eva-red/40 bg-eva-red/10 text-eva-red font-mono text-xs">
        [CONFIG_ERROR]: {error}
      </div>
    );
  }

  const name = config?.name || "Cyberbee pro";
  const jobTitlesJoined =
    config?.jobTitles && config.jobTitles.length > 0
      ? config.jobTitles.join(" / ")
      : "Full-stack dev / Game dev / Low Level dev";
  const bio = config?.statusMessage || "Limited probabilities Infinite Possibilities";
  const summary =
    config?.bioSummary ||
    "Motivated developer with experience in game development, web technologies, and AI research. Skilled in JavaScript, TypeScript, C, C++, Java, Python, React, Next.js, Node.js, NumPy, Pandas, Blender, GitHub, and Figma.";

  return (
    <AsciiReveal preset="terminal" duration="fast" speed={0.7} className="w-full">
      <div className="flex flex-col gap-4 font-exo2 text-white select-none leading-relaxed">
        {/* Name */}
        <div className="text-xl md:text-2xl font-normal tracking-wide flex items-baseline gap-2">
          <span className="font-medium">Name</span>
          <span className="opacity-90">:</span>
          <span className="font-normal">{name}</span>
        </div>

        {/* Job Titles */}
        <div className="text-xl md:text-2xl font-normal tracking-wide flex items-baseline gap-2">
          <span className="font-medium">Job</span>
          <span className="opacity-90 ml-6">:</span>
          <span className="font-normal">{jobTitlesJoined}</span>
        </div>

        {/* Bio */}
        <div className="text-xl md:text-2xl font-normal tracking-wide flex items-baseline gap-2">
          <span className="font-medium">Bio</span>
          <span className="opacity-90 ml-8">:</span>
          <span className="font-normal">{bio}</span>
        </div>

        {/* Summary */}
        <div className="text-xl md:text-2xl font-normal tracking-wide mt-2">
          <span className="font-medium">Summary : </span>
          <span className="font-normal text-white/95 leading-snug">{summary}</span>
        </div>
      </div>
    </AsciiReveal>
  );
}

export default ProfileDetails;
