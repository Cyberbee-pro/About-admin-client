"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import WebGL design components with SSR disabled to guarantee hydration safety
const PatternWaves = dynamic(() => import("@/components/designs/PatternWaves"), {
  ssr: false,
});
const PixelBlast = dynamic(() => import("@/components/designs/PixelBlast"), {
  ssr: false,
});
const TargetCursor = dynamic(() => import("@/components/designs/TargetCursor"), {
  ssr: false,
});
const SlideCommit = dynamic(() => import("@/components/designs/SlideCommit"), {
  ssr: false,
});

export interface LoginClientProps {
  initialGithubVerified: boolean;
  portfolioUrl: string;
  returnTo?: string;
}

export default function LoginClient({
  initialGithubVerified,
  portfolioUrl,
  returnTo,
}: LoginClientProps) {
  const router = useRouter();
  const githubVerified = initialGithubVerified;
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Focus password input once GitHub is verified
  useEffect(() => {
    if (githubVerified && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [githubVerified]);

  const handlePasswordSubmit = async (): Promise<void> => {
    setError(null);
    if (!password || password.trim() === "") {
      const err = "Please enter your administrative passphrase.";
      setError(err);
      throw new Error(err);
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const detail = data?.detail || "Authentication rejected.";
        setError(detail);
        setIsSubmitting(false);
        throw new Error(detail);
      }

      // Success - redirect to dashboard or returnTo target
      const target = returnTo || data?.redirect || "/dashboard";
      router.push(target);
    } catch (err) {
      setIsSubmitting(false);
      throw err;
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#1e1e2e] text-[#cdd6f4] flex flex-col lg:grid lg:grid-cols-2 overflow-x-hidden selection:bg-[#a6e3a1] selection:text-[#11111b]">
      {/* Target Cursor Component */}
      <TargetCursor
        targetSelector=".cursor-target"
        cursorColor="#a6e3a1"
        cursorColorOnTarget="#cba6f7"
        spinDuration={2.5}
      />

      {/* ========================================================================= */}
      {/* LEFT SIDE: Pattern Waves + Exo 2 Heading Only */}
      {/* ========================================================================= */}
      <section
        aria-label="Portfolio Branding"
        className="relative min-h-[40vh] lg:min-h-screen flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#313244]/50"
      >
        {/* WebGL PatternWaves Background */}
        <div className="absolute inset-0 z-0 opacity-80 pointer-events-auto">
          <PatternWaves
            preset="terminal"
            color="#ffffff"
            backgroundColor="#120f17"
            fade="edges"
            fadeSize={0.4}
            interactive={true}
            speed={0.35}
            contrast={1.4}
            depth={0.8}
            className="w-full h-full"
          />
        </div>

        {/* Center Main Heading with Forced Inline Exo 2 Font & CSS Variable Fallback */}
        <div className="relative z-10 w-full max-w-xl px-6">
          <h1 
            style={{ fontFamily: "var(--font-exo2), 'Exo 2', sans-serif" }}
            className="font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight text-[#a6e3a1] leading-[1.1] drop-shadow-[0_0_35px_rgba(166,227,161,0.3)]"
          >
            Cyberbee&apos;s <br />
            portfolio manager
          </h1>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RIGHT SIDE: Pixel Blast + Minimalist Terminal Form */}
      {/* ========================================================================= */}
      <section
        aria-label="Login Terminal"
        className="relative min-h-[60vh] lg:min-h-screen flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-hidden bg-[#181825]"
      >
        {/* Three.js PixelBlast Dither Background */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-auto">
          <PixelBlast
            variant="circle"
            color="#a6e3a1"
            pixelSize={3}
            patternScale={4}
            patternDensity={0.8}
            enableRipples={true}
            transparent={true}
            edgeFade={0.3}
            speed={0.4}
            className="w-full h-full"
          />
        </div>

        {/* Terminal Container Card */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          {/* Terminal Heading with Forced Inline Exo 2 Font */}
          <h2 
            style={{ fontFamily: "var(--font-exo2), 'Exo 2', sans-serif" }}
            className="font-bold text-3xl sm:text-4xl text-[#cdd6f4] tracking-[0.25em] uppercase text-center mb-10"
          >
            LOGIN TERMINAL
          </h2>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="w-full mb-6 p-3.5 rounded bg-[#f38ba8]/10 border border-[#f38ba8]/40 text-[#f38ba8] text-xs font-mono flex items-start gap-2 animate-in fade-in duration-200"
            >
              <span className="font-bold">[ERR]:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields spanning full width */}
          <div className="space-y-6 w-full">
            {/* Field 1: GitHub Authentication */}
            <div className="space-y-2 w-full">
              <label className="block font-mono text-xs tracking-wider text-[#a6adc8] uppercase">
                GITHUB
              </label>

              {githubVerified ? (
                <div className="w-full px-5 py-3.5 rounded bg-[#11111b] border border-[#a6e3a1]/60 text-[#a6e3a1] font-mono text-xs flex items-center justify-between">
                  <span>Cyberbee-pro</span>
                  <span className="text-[11px] font-semibold tracking-wider text-[#a6e3a1]">
                    ✓ VERIFIED
                  </span>
                </div>
              ) : (
                <a
                  href="/api/auth/github"
                  className="cursor-target w-full py-3.5 px-5 rounded bg-[#11111b] hover:bg-[#1e1e2e] text-[#cdd6f4] border border-[#45475a] hover:border-[#a6e3a1] font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all"
                >
                  <svg
                    className="w-4 h-4 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>Authenticate GitHub</span>
                </a>
              )}
            </div>

            {/* Field 2: Administrative Passphrase */}
            <div className="space-y-2 w-full">
              <label
                htmlFor="terminal-password"
                className="block font-mono text-xs tracking-wider text-[#a6adc8] uppercase"
              >
                PASSWORD
              </label>
              <input
                id="terminal-password"
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!githubVerified || isSubmitting}
                placeholder={githubVerified ? "/@********(<3)" : "Authenticate GitHub first"}
                className="cursor-target w-full px-5 py-3.5 rounded bg-[#11111b] border border-[#45475a] focus:border-[#a6e3a1] text-[#cdd6f4] placeholder-[#585b70] font-mono text-sm tracking-widest outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit Action: SlideCommit Component */}
            <div className="pt-2 w-full">
              <div className="cursor-target w-full">
                <SlideCommit
                  label="SLIDE TO AUTHENTICATE"
                  doneLabel="ACCESS GRANTED"
                  errorLabel="AUTH REJECTED"
                  onConfirm={handlePasswordSubmit}
                  trackColor="#313244"
                  handleColor="#a6e3a1"
                  successColor="#a6e3a1"
                  dangerColor="#f38ba8"
                  width="100%"
                  height={52}
                  radius={10}
                  disabled={!githubVerified || isSubmitting}
                  className="w-full"
                />
              </div>
            </div>

            {/* Secondary Action: External Portfolio Link */}
            <div className="pt-2 w-full">
              <a
                href={
                  portfolioUrl.startsWith("http://") || portfolioUrl.startsWith("https://")
                    ? portfolioUrl
                    : `https://${portfolioUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-target w-full py-3.5 px-5 rounded bg-[#11111b] hover:bg-[#1e1e2e] text-[#cdd6f4] border border-[#45475a] hover:border-[#a6e3a1] font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all"
              >
                <span aria-hidden="true">&larr;</span>
                <span>Go to portfolio</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}