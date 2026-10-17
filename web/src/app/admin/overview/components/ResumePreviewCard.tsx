"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SiteConfig, ApiResponse } from "@/lib/api/types";
import { getConfig } from "@/lib/api/configService";

export interface ResumePreviewCardProps {
  resumeDriveUrl?: string;
}

export function ResumePreviewCard({
  resumeDriveUrl: propResumeDriveUrl,
}: ResumePreviewCardProps) {
  const [resumeUrl, setResumeUrl] = useState<string | undefined>(propResumeDriveUrl);
  const [, setLoading] = useState<boolean>(!propResumeDriveUrl);

  useEffect(() => {
    if (propResumeDriveUrl !== undefined) {
      setResumeUrl(propResumeDriveUrl);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (apiUrl) {
      fetch(`${apiUrl}/api/v1/config`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<ApiResponse<SiteConfig>>;
        })
        .then((data) => {
          if (!isMounted) return;
          if (data.data?.resumeDriveUrl) {
            setResumeUrl(data.data.resumeDriveUrl);
          }
        })
        .catch((err) => {
          console.warn("[ResumePreviewCard] Direct fetch failed, falling back to service:", err);
          getConfig()
            .then((serviceRes) => {
              if (!isMounted) return;
              if (serviceRes.data?.resumeDriveUrl) {
                setResumeUrl(serviceRes.data.resumeDriveUrl);
              }
            })
            .catch(() => {});
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      getConfig()
        .then((serviceRes) => {
          if (!isMounted) return;
          if (serviceRes.data?.resumeDriveUrl) {
            setResumeUrl(serviceRes.data.resumeDriveUrl);
          }
        })
        .catch((err) => {
          console.warn("[ResumePreviewCard] Failed to fetch resume URL from config:", err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [propResumeDriveUrl]);

  return (
    <div className="flex flex-col justify-between bg-eva-purple shadow-xl select-none p-5 h-[280px] overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full">
        <span className="font-exo2 text-white font-normal text-2xl tracking-wide">
          Resume.pdf
        </span>
        {resumeUrl ? (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Download / View Resume"
            className="cursor-target p-1 rounded hover:bg-white/10 transition-colors flex items-center justify-center text-white"
          >
            <Image
              src="/eva dash/download_butt.svg"
              alt="Download"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
          </a>
        ) : (
          <div className="p-1 text-white/50" title="No resume URL configured">
            <Image
              src="/eva dash/download_butt.svg"
              alt="Download"
              width={20}
              height={20}
              className="w-5 h-5 object-contain opacity-60"
            />
          </div>
        )}
      </div>

      {/* Center Body: Minimalist interactive area opening resumeDriveUrl */}
      {resumeUrl ? (
        <a
          href={resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-target flex-1 flex items-center justify-center group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:scale-105 group-hover:border-white/40 transition-all bg-white/5">
            <Image
              src="/eva dash/download_butt.svg"
              alt="Open Resume"
              width={24}
              height={24}
              className="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </a>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/30 font-exo2 text-sm tracking-wider">
          AWAITING_CONFIG
        </div>
      )}
    </div>
  );
}

export default ResumePreviewCard;
