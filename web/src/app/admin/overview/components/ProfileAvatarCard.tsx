"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getConfig } from "@/lib/api/configService";

export interface ProfileAvatarCardProps {
  pfpUrl?: string;
  name?: string;
  isLoading?: boolean;
}

export function ProfileAvatarCard({
  pfpUrl: propPfpUrl,
  name: propName,
  isLoading: propIsLoading,
}: ProfileAvatarCardProps) {
  const [pfpUrl, setPfpUrl] = useState<string | undefined>(propPfpUrl);
  const [name, setName] = useState<string>(propName || "Cyberbee pro");
  const [loading, setLoading] = useState<boolean>(propIsLoading ?? !propPfpUrl);

  useEffect(() => {
    if (propPfpUrl !== undefined) {
      setPfpUrl(propPfpUrl);
      setLoading(false);
      return;
    }

    let isMounted = true;
    getConfig()
      .then((res) => {
        if (!isMounted) return;
        if (res.data) {
          setPfpUrl(res.data.pfpUrl);
          if (res.data.name) setName(res.data.name);
        }
      })
      .catch((err) => {
        console.warn("[ProfileAvatarCard] Could not load avatar from config:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propPfpUrl]);

  return (
    <div className="relative shrink-0 flex flex-col items-center select-none">
      {/* Orange/Amber Pic Frame Container matching pic_frame.svg */}
      <div className="relative w-[210px] sm:w-[240px] md:w-[260px] aspect-[187/198] shadow-2xl">
        {/* Frame SVG Graphic */}
        <Image
          src="/eva dash/pic_frame.svg"
          alt="Pilot Frame"
          width={187}
          height={198}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
          priority
        />

        {/* Inner Content Area (Inset cleanly inside the orange border & hazard bars) */}
        <div className="absolute top-[6.5%] left-[7%] w-[78%] h-[80%] bg-white z-0 overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-black/60 font-mono text-xs">
              <span className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>SYNCING...</span>
            </div>
          ) : pfpUrl ? (
            <img
              src={pfpUrl}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setPfpUrl(undefined)}
            />
          ) : (
            /* Default Manga Pilot Silhouette / Cyberpunk Line Art */
            <div className="w-full h-full bg-white flex flex-col items-center justify-center relative p-3">
              <svg
                className="w-full h-full text-black"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                {/* Stylized Pilot Manga Outline */}
                <path
                  d="M50 15 C38 15 28 26 28 40 C28 50 33 58 40 64 L40 76 L60 76 L60 64 C67 58 72 50 72 40 C72 26 62 15 50 15 Z"
                  fill="none"
                />
                <path d="M35 38 Q42 34 48 38" stroke="currentColor" strokeWidth="2.5" />
                <path d="M52 38 Q58 34 65 38" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="43" cy="45" r="3.5" fill="black" />
                <circle cx="57" cy="45" r="3.5" fill="black" />
                <path d="M47 52 L50 56 L53 52" stroke="currentColor" strokeWidth="1.5" />
                <path d="M42 63 Q50 67 58 63" stroke="currentColor" strokeWidth="2" />
                {/* Hair Spikes */}
                <path d="M28 35 Q20 25 32 18 Q38 10 50 12 Q62 10 68 18 Q80 25 72 35" stroke="currentColor" strokeWidth="2.5" />
                <path d="M20 78 L80 78 L85 95 L15 95 Z" stroke="currentColor" strokeWidth="2" fill="none" />
                {/* High collar */}
                <path d="M36 70 L26 88 M64 70 L74 88" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileAvatarCard;
