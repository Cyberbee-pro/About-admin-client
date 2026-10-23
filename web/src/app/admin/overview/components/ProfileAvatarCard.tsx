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
  const [loading, setLoading] = useState<boolean>(propIsLoading ?? (propPfpUrl === undefined));

  const [prevPropUrl, setPrevPropUrl] = useState(propPfpUrl);
  if (propPfpUrl !== prevPropUrl) {
    setPrevPropUrl(propPfpUrl);
    setPfpUrl(propPfpUrl);
    setLoading(false);
  }

  useEffect(() => {
    if (propPfpUrl !== undefined) return;

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
      <div className="cursor-target cursor-pointer relative w-[210px] sm:w-[240px] md:w-[260px] aspect-[187/198] shadow-2xl">
        {/* Frame SVG Graphic */}
        <Image
          src="/eva dash/pic_frame.svg"
          alt="Pilot Frame"
          width={187}
          height={198}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
          priority
        />

        {/* Inner Content Area (Inset cleanly inside the orange border & hazard bars) */}
        <div className="absolute top-[6.5%] left-[7%] w-[78%] h-[80%] bg-[#12121b] z-0 overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-white/60 font-mono text-xs">
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>SYNCING...</span>
            </div>
          ) : pfpUrl && pfpUrl.trim() !== "" ? (
            <img
              src={pfpUrl}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setPfpUrl(undefined)}
            />
          ) : (
            <div
              className="w-full h-full bg-[#12121b] flex flex-col items-center justify-center p-3 text-center select-none"
              data-testid="no-pfp-placeholder"
            >
              <span className="font-mono text-xs text-eva-text-muted tracking-wider">
                No pfp in db
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileAvatarCard;
