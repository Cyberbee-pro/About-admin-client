"use client";

import dynamic from "next/dynamic";

const PatternWaves = dynamic(() => import("@/components/designs/PatternWaves"), {
  ssr: false,
});

export default function OverviewBackground() {
  return (
    <div
      className="absolute inset-0 z-0 opacity-80 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <PatternWaves
        preset="terminal"
        color="#ffffff"
        backgroundColor="#12121b"
        fade="edges"
        fadeSize={0.4}
        interactive={true}
        speed={0.35}
        contrast={1.4}
        depth={0.8}
        className="w-full h-full"
      />
    </div>
  );
}
