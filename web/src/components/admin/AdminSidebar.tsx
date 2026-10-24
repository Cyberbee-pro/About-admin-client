"use client";

import LiquidButton from "@/components/LiquidButton";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AsciiReveal } from "ascii-reveal";

interface NavItem {
  name: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Overview", href: "/admin/overview" },
  { name: "config", href: "/admin/config" },
  { name: "skills and achievements", href: "/admin/skills-achievements" },
  { name: "Certificates", href: "/admin/certificates" },
  { name: "experiences", href: "/admin/experiences" },
  { name: "projects", href: "/admin/projects" },
  { name: "logs", href: "/admin/logs" },
];

export function AdminSidebar() {
  const pathname = usePathname() || "";

  return (
    <aside
      aria-label="Admin Navigation"
      className="w-64 shrink-0 h-[100vh] h-screen sticky top-0 bg-eva-purple border-r border-eva-purple/40 flex flex-col select-none text-white z-20 overflow-hidden"
      style={{ height: "100vh" }}
    >
      {/* 1. Branding Header: ITZEUL.svg strictly clean with ZERO glow and NO yellow accent */}
      <div className="h-20 px-6 flex items-center gap-3.5 shrink-0">
        <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
          <AsciiReveal as="span" preset="terminal" duration="fast" speed={0.7} className="inline-flex">
            <Image
              src="/eva dash/ITZEUL.svg"
              alt="ITZEUL Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
              priority
              data-ascii="media"
            />
          </AsciiReveal>
        </div>
        <span className="font-exo2 text-white font-bold text-2xl tracking-wide">
          Dashboard
        </span>
      </div>

      {/* 2. Navigation Tabs */}
      <nav className="flex-1 py-2 flex flex-col overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/overview" && Boolean(pathname && pathname.startsWith(item.href)));

          return (
            <LiquidButton
              key={item.href}
              href={item.href}
              variant="custom"
              isActive={isActive}
              aria-current={isActive ? "page" : undefined}
              butBorder={0}
              liquidColor="bg-eva-lime"
              activeColor="bg-eva-red"
              waveColor="rgba(255, 255, 255, 0.25)"
              activeTextColor="group-hover:text-eva-black group-focus-visible:text-eva-black group-active:text-eva-black"
              className={`w-full !justify-start px-6 py-3.5 text-base font-exo2 tracking-wide transition-colors rounded-none ${
                isActive
                  ? "text-white font-semibold"
                  : "text-white/90 bg-transparent"
              }`}
              contentClassName="w-full !justify-start"
            >
              <span>{item.name}</span>
            </LiquidButton>
          );
        })}
      </nav>

      {/* 3. Footer Motif: Raw eva no back.png with zero badges, corner brackets, or extra padding */}
      <div className="mt-auto overflow-hidden shrink-0">
        <Image
          src="/eva dash/eva no back.png"
          alt="EVA Unit-01 Motif"
          width={256}
          height={256}
          className="w-full h-auto object-cover block"
        />
      </div>
    </aside>
  );
}

export default AdminSidebar;