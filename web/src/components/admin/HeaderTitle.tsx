"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getHealth } from "@/lib/api/healthService";
import { HealthResponse } from "@/lib/api/types";

export interface HeaderTitleProps {
  breadcrumbs?: string[];
  subtitle?: string;
  action?: React.ReactNode;
  initialHealth?: HealthResponse;
  pollIntervalMs?: number;
}

const SEGMENT_NAME_MAP: Record<string, string> = {
  admin: "Dashboard",
  overview: "Overview",
  config: "Configuration",
  "skills-achievements": "skills and achievements",
  skills: "Skills",
  achievements: "Achievements",
  certificates: "Certificates",
  experiences: "Experiences",
  projects: "Projects",
  logs: "System Logs",
};

export function HeaderTitle({
  breadcrumbs,
  subtitle,
  action,
  initialHealth,
  pollIntervalMs = 40000,
}: HeaderTitleProps) {
  const pathname = usePathname() || "";
  const [health, setHealth] = useState<HealthResponse | null>(
    initialHealth || {
      status: "healthy",
      dbStatus: "connected",
      memoryUsageMB: 28,
      version: "1.0.0",
      env: "production",
    }
  );

  useEffect(() => {
    let isMounted = true;

    const fetchHealth = async () => {
      try {
        const data = await getHealth();
        if (isMounted) setHealth(data);
      } catch (err) {
        if (isMounted) {
          setHealth({
            status: "offline",
            dbStatus: "disconnected",
            memoryUsageMB: 0,
            version: "1.0.0",
            env: "production",
          });
        }
      }
    };

    fetchHealth();
    const timer = setInterval(fetchHealth, pollIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [pollIntervalMs]);

  // Dynamically resolve breadcrumbs if not explicitly passed
  const resolvedBreadcrumbs: string[] =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : (() => {
          const segments = pathname.split("/").filter(Boolean);
          if (segments.length === 0) return ["Dashboard", "Overview"];
          return segments.map((seg) => SEGMENT_NAME_MAP[seg.toLowerCase()] || seg.toUpperCase());
        })();

  const isHealthy = health?.status === "healthy";
  const statusLabel = isHealthy ? "ONLINE" : "OFFLINE";
  const statusColorClass = isHealthy ? "text-eva-teal" : "text-eva-red";
  const indicatorColorClass = isHealthy ? "bg-eva-teal animate-pulse" : "bg-eva-red";

  return (
    <header className="h-16 px-8 bg-black flex items-center justify-between sticky top-0 z-10 select-none">
      {/* Left: Dynamic Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2.5 font-exo2 font-mono text-xl font-normal text-white tracking-wide"
        >
          {resolvedBreadcrumbs.map((crumb, idx) => (
            <span key={`${crumb}-${idx}`} className="flex items-center gap-2.5">
              {idx > 0 && <span className="text-white/70">&gt;</span>}
              <span className="text-white">{crumb}</span>
            </span>
          ))}
        </nav>
        {subtitle && (
          <span className="font-mono text-xs text-eva-text-muted ml-3">
            // {subtitle}
          </span>
        )}
      </div>

      {/* Right: System status badges aligned in a single row */}
      <div className="flex items-center gap-3">
        {action && <div>{action}</div>}

        <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-wider text-eva-text-muted px-3 py-1 rounded border border-eva-surface-border bg-eva-charcoal/80">
          <span className={`flex items-center gap-1.5 ${statusColorClass} font-semibold`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${indicatorColorClass}`} />
            {statusLabel}
          </span>
          <span className="text-eva-surface-border">|</span>
          <span className="text-white">PILOT: Cyberbee-pro</span>
          <span className="text-eva-surface-border">|</span>
          <span className="text-eva-orange font-semibold">MAGI-01</span>
        </div>
      </div>
    </header>
  );
}

export default HeaderTitle;
