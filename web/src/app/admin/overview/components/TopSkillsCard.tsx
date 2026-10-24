"use client";

import { useEffect, useState } from "react";
import { AsciiReveal, AsciiSkeleton } from "ascii-reveal";
import { Skill } from "@/lib/api/types";
import { getSkills } from "@/lib/api/skillService";

export interface TopSkillsCardProps {
  initialSkills?: Skill[];
}

function sortSkillsByWeight(items: Skill[]): Skill[] {
  return items.slice().sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
}

// Clean fallback component rendering the skill's logoUrl from the DB, 
// or a typography initial if the URL is missing or fails to load.
function SkillIcon({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <AsciiReveal as="span" preset="terminal" duration="fast" speed={0.7} className="inline-flex shrink-0">
      {logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt={name}
          className="w-6 h-6 object-contain shrink-0"
          onError={() => setImgError(true)}
          data-ascii="media"
        />
      ) : (
        <div className="w-6 h-6 rounded bg-black text-white font-mono text-xs flex items-center justify-center font-bold shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </AsciiReveal>
  );
}

export function TopSkillsCard({ initialSkills }: TopSkillsCardProps) {
  const [skills, setSkills] = useState<Skill[]>(() =>
    initialSkills ? sortSkillsByWeight(initialSkills) : []
  );
  const [loading, setLoading] = useState<boolean>(!initialSkills);

  useEffect(() => {
    if (initialSkills) {
      setSkills(sortSkillsByWeight(initialSkills));
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchSkills = async () => {
      try {
        const serviceRes = await getSkills();
        const rawItems = serviceRes.data || [];

        if (!isMounted) return;
        setSkills(sortSkillsByWeight(rawItems));
      } catch (err) {
        console.warn("[TopSkillsCard] Failed to fetch skills from API:", err);
        if (isMounted) setSkills([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSkills();

    return () => {
      isMounted = false;
    };
  }, [initialSkills]);

  return (
    <div className="flex flex-col bg-eva-purple shadow-xl select-none p-5 h-[280px]">
      {/* Header */}
      <h3 className="font-exo2 text-white font-normal text-2xl tracking-wide mb-4">
        Top Skills
      </h3>

      {/* 2-Column Grid taking exactly the top 6 items via .slice(0, 6).map(...) */}
      <AsciiReveal loading={loading} preset="terminal" duration="fast" speed={0.7} revealOnMount={false} className="flex-1">
        <div className="grid grid-cols-2 gap-3.5 items-start">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-11 px-3.5 bg-eva-orange/20 border border-eva-orange/30 flex items-center justify-between shadow-md overflow-hidden font-mono text-xs"
              >
                <AsciiSkeleton variant="terminal" lines={1} widths={["75px"]} animate />
                <AsciiSkeleton variant="terminal" lines={1} widths={["24px"]} animate />
              </div>
            ))
          ) : skills.length === 0 ? (
            <div className="col-span-2 text-eva-text-muted text-sm font-mono py-4 text-center">
              404 : NO SKILLS FOUND 
            </div>
          ) : (
            skills.slice(0, 6).map((skill, index) => (
              <div
                key={skill._id || `${skill.name}-${index}`}
                className="cursor-target h-11 px-3.5 bg-eva-orange flex items-center justify-between shadow-md transition-transform hover:scale-[1.01] cursor-pointer"
              >
                {/* Left: Skill Icon from DB logoUrl & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <SkillIcon name={skill.name} logoUrl={skill.logoUrl} />
                  <span className="font-exo2 font-normal text-white text-lg truncate tracking-wide">
                    {skill.name}
                  </span>
                </div>

                {/* Right: Numeric Weight Badge */}
                <span className="font-exo2 font-normal text-white text-2xl tracking-tight shrink-0 ml-2">
                  {skill.weight}
                </span>
              </div>
            ))
          )}
        </div>
      </AsciiReveal>
    </div>
  );
}

export default TopSkillsCard;