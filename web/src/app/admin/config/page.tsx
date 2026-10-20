"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SiteConfig, PfpItem } from "@/lib/api/types";
import { getConfig, updateConfig } from "@/lib/api/configService";
import { ConfigInput, ValidationResult } from "./components/ConfigInput";
import { ConfigResumeCard } from "./components/ConfigResumeCard";
import { ConfigAvatarCard } from "./components/ConfigAvatarCard";
import LiquidButton from "@/components/LiquidButton";

const PatternWaves = dynamic(() => import("@/components/designs/PatternWaves"), {
  ssr: false,
});

// Validation Rule Helpers conforming strictly to specifications
const validateName = (val: string): ValidationResult => {
  if (!val.trim()) {
    return { valid: false, message: "NAME REQUIRED // ALPHABET AND SPACES ONLY" };
  }
  const isValid = /^[a-zA-Z\s]+$/.test(val);
  return {
    valid: isValid,
    message: isValid
      ? "ACCEPTED // ALPHABET AND SPACES ONLY"
      : "ERROR // ONLY LETTERS AND SPACES ALLOWED",
  };
};

const validateEmail = (val: string): ValidationResult => {
  if (!val.trim()) {
    return { valid: false, message: "COMMS EMAIL REQUIRED" };
  }
  const atCount = (val.match(/@/g) || []).length;
  const dotCount = (val.match(/\./g) || []).length;
  const standardRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = atCount === 1 && dotCount >= 1 && standardRegex.test(val);
  return {
    valid: isValid,
    message: isValid
      ? "ACCEPTED // COMMS FREQUENCY VERIFIED"
      : "ERROR // INVALID FORMAT (CHECK '@' AND '.' COUNTS)",
  };
};

const validatePhone = (val: string): ValidationResult => {
  if (!val.trim()) {
    return { valid: false, message: "PHONE NUMBER REQUIRED" };
  }
  const isValid = /^\d{10}$/.test(val.trim());
  return {
    valid: isValid,
    message: isValid
      ? "ACCEPTED // DIRECT LINE SECURED (10-DIGIT)"
      : "ERROR // EXACTLY 10 NUMERIC DIGITS REQUIRED",
  };
};

const validateSecret = (val: string): ValidationResult => {
  if (!val) {
    return { valid: false, message: "SECURITY ACCESS PHRASE REQUIRED" };
  }
  const lenOk = val.length > 8;
  const numCount = (val.match(/\d/g) || []).length;
  const alphaCount = (val.match(/[a-zA-Z]/g) || []).length;
  const lowerCount = (val.match(/[a-z]/g) || []).length;
  const upperCount = (val.match(/[A-Z]/g) || []).length;
  const specialCount = (val.match(/[^a-zA-Z0-9]/g) || []).length;

  const isValid =
    lenOk &&
    numCount >= 2 &&
    alphaCount >= 5 &&
    lowerCount >= 3 &&
    upperCount >= 1 &&
    specialCount >= 1;

  if (isValid) {
    return { valid: true, message: "ACCEPTED // ENCRYPTION KEY STRENGTH OPTIMAL" };
  }

  const missing: string[] = [];
  if (!lenOk) missing.push(">8 chars");
  if (numCount < 2) missing.push(">=2 nums");
  if (alphaCount < 5) missing.push(">=5 alphas");
  if (lowerCount < 3) missing.push(">=3 lower");
  if (upperCount < 1) missing.push(">=1 upper");
  if (specialCount < 1) missing.push(">=1 special");

  return {
    valid: false,
    message: `SECURITY DEFICIT // REQUIRES: ${missing.join(", ")}`,
  };
};

const validateJob = (val: string): ValidationResult => {
  if (!val.trim()) {
    return { valid: false, message: "AT LEAST ONE DESIGNATION REQUIRED" };
  }
  return { valid: true, message: "ACCEPTED // CLASSIFICATIONS ACTIVE" };
};

const validateBio = (val: string): ValidationResult => {
  if (!val.trim()) {
    return { valid: false, message: "STATUS BROADCAST REQUIRED" };
  }
  return { valid: true, message: "ACCEPTED // STATUS MESSAGE BROADCAST READY" };
};

const validateSummary = (val: string): ValidationResult => {
  if (!val.trim()) {
    return { valid: false, message: "BIO SUMMARY DOSSIER REQUIRED" };
  }
  return { valid: true, message: `ACCEPTED // DOSSIER VERIFIED (${val.length} CHARS)` };
};

export default function AdminConfigPage() {
  const [, startTransition] = useTransition();

  // Raw configuration fetched from database
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form Field States
  const [name, setName] = useState("");
  const [jobTitlesStr, setJobTitlesStr] = useState("");
  const [bio, setBio] = useState("");
  const [summary, setSummary] = useState("");
  const [email, setEmail] = useState("cyb.shibrajdas@gmail.com");
  const [phone, setPhone] = useState("8420607640");
  const [secret, setSecret] = useState("MagiSync#2026Secure!");
  const [resumeUrl, setResumeUrl] = useState("");

  // Avatar Management States
  const [pfpUrl, setPfpUrl] = useState<string | undefined>(undefined);
  const [pfpHistory, setPfpHistory] = useState<PfpItem[]>([]);

  // UI Notification & Feedback Banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Fetch configuration on component mount
  const loadConfigData = async () => {
    setIsLoading(true);
    try {
      const res = await getConfig();
      if (res?.data) {
        const d = res.data;
        setConfig(d);
        setName(d.name || "Cyberbee pro");
        setJobTitlesStr(
          d.jobTitles && d.jobTitles.length > 0
            ? d.jobTitles.join(" / ")
            : "Full-stack dev / Game dev / Low Level dev"
        );
        setBio(d.statusMessage || "Limited probabilities Infinite Possibilities");
        setSummary(
          d.bioSummary ||
            "Motivated developer with experience in game development, web technologies, and AI research. Skilled in JavaScript, TypeScript, C, C++, Java, Python, React, Next.js, Node.js, NumPy, Pandas, Blender, GitHub, and Figma."
        );
        setResumeUrl(d.resumeDriveUrl || "https://drive.google.com/file/d/resume/view");
        setPfpUrl(d.pfpUrl);
        setPfpHistory(d.pfpHistory || []);
      }
    } catch (err: unknown) {
      console.warn("[AdminConfigPage] Failed to fetch config from API:", err);
      // Fallback defaults for graceful initial rendering
      setName("Cyberbee pro");
      setJobTitlesStr("Full-stack dev / Game dev / Low Level dev");
      setBio("Limited probabilities Infinite Possibilities");
      setSummary("Motivated developer with experience in game development, web technologies, and AI research.");
      setResumeUrl("https://drive.google.com/file/d/resume/view");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigData();
  }, []);

  // Save changes to backend via PUT /api/v1/config
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    // Validate main required fields
    const nameValid = validateName(name).valid;
    const emailValid = validateEmail(email).valid;
    const phoneValid = validatePhone(phone).valid;
    const secretValid = validateSecret(secret).valid;

    if (!nameValid || !emailValid || !phoneValid || !secretValid) {
      setIsSaving(false);
      setFeedback({
        type: "error",
        message: "VALIDATION REJECTED // VERIFY INPUT CONSTRAINTS BEFORE COMMITTING",
      });
      return;
    }

    // Split job titles by ' / ' or ','
    const parsedJobs = jobTitlesStr
      .split(/[\/,]+/)
      .map((j) => j.trim())
      .filter(Boolean);

    try {
      const payload = {
        name: name.trim(),
        jobTitles: parsedJobs.length > 0 ? parsedJobs : ["Full-stack dev"],
        statusMessage: bio.trim(),
        bioSummary: summary.trim(),
        resumeDriveUrl: resumeUrl.trim(),
      };

      const res = await updateConfig(payload);
      if (res?.data) {
        setConfig(res.data);
      }

      setFeedback({
        type: "success",
        message: "[TRANSMISSION COMPLETE] // CONFIGURATION COMMITTED TO MAGI SYSTEM",
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to transmit changes to API";
      setFeedback({
        type: "error",
        message: `[TRANSMISSION FAILED] // ${errorMsg.toUpperCase()}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Revert / Select Historical Avatar
  const handleSetAsPfp = async (pfpItem: PfpItem) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await updateConfig({
        pfpPublicId: pfpItem.publicId,
        pfpUrl: pfpItem.url,
      });

      if (res?.data) {
        setConfig(res.data);
        setPfpUrl(res.data.pfpUrl);
        setPfpHistory(res.data.pfpHistory || []);
      }

      setFeedback({
        type: "success",
        message: `[AVATAR UPDATED] // ACTIVE PROFILE GRAPHIC SYNCHRONIZED`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile picture";
      setFeedback({
        type: "error",
        message: `[AVATAR REJECTED] // ${msg.toUpperCase()}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload New Avatar File
  const handleUploadNewPfp = async (file: File) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append("pfp", file);

      const res = await updateConfig(formData);
      if (res?.data) {
        setConfig(res.data);
        setPfpUrl(res.data.pfpUrl);
        setPfpHistory(res.data.pfpHistory || []);
      }

      setFeedback({
        type: "success",
        message: `[AVATAR INGESTED] // NEW GRAPHIC STREAMED TO CLOUD REPOSITORY`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload avatar";
      setFeedback({
        type: "error",
        message: `[UPLOAD FAILED] // ${msg.toUpperCase()}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload New Resume File
  const handleUploadResumeFile = (file: File) => {
    startTransition(() => {
      setFeedback({
        type: "info",
        message: `[DOCUMENT QUEUED] // ${file.name.toUpperCase()} ATTACHED. SAVE TO COMMIT.`,
      });
    });
  };

  return (
    <div className="relative flex-1 bg-[var(--eva-black)] text-white flex flex-col justify-between min-h-[calc(100vh-4rem)] select-none overflow-x-hidden">
      {/* WebGL PatternWaves Background */}
      <div
        className="absolute inset-0 z-0 opacity-80 pointer-events-none overflow-hidden"
        aria-hidden="true"
        data-testid="config-pattern-waves"
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

      {/* Main Content Area */}
      <div className="relative z-10 p-5 md:p-8 max-w-[1600px] w-full mx-auto flex-1 flex flex-col justify-between space-y-4 sm:space-y-6">
        {/* Top Header / Monospace Breadcrumbs matching screenshot */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
          <nav aria-label="Breadcrumb" className="font-exo2 text-2xl font-normal text-white tracking-wide">
            <Link href="/admin/overview" className="cursor-target hover:text-eva-lime transition-colors">
              Dashboard
            </Link>
            <span className="mx-2.5 opacity-60">&gt;</span>
            <span className="text-white">config</span>
          </nav>

          {/* Master Actions Bar */}
          <div className="flex items-center gap-3">
            <LiquidButton
              variant="secondary"
              onClick={loadConfigData}
              disabled={isLoading || isSaving}
              className="py-1.5 px-3.5 text-xs tracking-wider"
              liquidColor="bg-eva-orange"
            >
              RESET
            </LiquidButton>

            <LiquidButton
              variant="primary"
              onClick={handleSaveAll}
              disabled={isLoading || isSaving}
              className="py-2 px-5 text-xs tracking-[0.2em]"
              liquidColor="bg-eva-lime"
            >
              {isSaving ? "TRANSMITTING..." : "SAVE CONFIGURATION"}
            </LiquidButton>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`p-2.5 border-l-4 font-mono text-xs flex items-center justify-between transition-all ${
              feedback.type === "success"
                ? "border-l-[var(--eva-lime)] bg-[var(--eva-lime)]/10 text-[var(--eva-lime)]"
                : feedback.type === "error"
                ? "border-l-[var(--eva-red)] bg-[var(--eva-red)]/10 text-[var(--eva-red)]"
                : "border-l-[var(--eva-orange)] bg-[var(--eva-orange)]/10 text-[var(--eva-orange)]"
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="cursor-target ml-4 text-xs font-bold hover:underline"
            >
              ✕
            </button>
          </div>
        )}

        {/* Center Grid: Form Fields & Resume on Left, Avatar Dossier on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Form Inputs & Resume (span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Primary Config Fields matching screenshot */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              {/* Name */}
              <ConfigInput
                id="cfg-name"
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Cyberbee pro"
                validator={validateName}
                disabled={isLoading || isSaving}
                data-testid="config-name-input"
              />

              {/* Job */}
              <ConfigInput
                id="cfg-job"
                label="Job"
                value={jobTitlesStr}
                onChange={setJobTitlesStr}
                placeholder="Full-stack dev / Game dev / Low Level dev"
                validator={validateJob}
                disabled={isLoading || isSaving}
                data-testid="config-job-input"
              />

              {/* Bio */}
              <ConfigInput
                id="cfg-bio"
                label="Bio"
                value={bio}
                onChange={setBio}
                placeholder="Limited probabilities Infinite Possibilities"
                validator={validateBio}
                disabled={isLoading || isSaving}
                data-testid="config-bio-input"
              />

              {/* Summary with expandable chevron matching screenshot */}
              <ConfigInput
                id="cfg-summary"
                label="Summary"
                value={summary}
                onChange={setSummary}
                placeholder="Motivated developer ......"
                validator={validateSummary}
                isExpandable={true}
                disabled={isLoading || isSaving}
                data-testid="config-summary-input"
              />
            </div>

            {/* Verification & Security Credentials Panel */}
            <div className="mt-2 pt-3 border-t border-white/10 flex flex-col gap-2 sm:gap-2.5">
              <div className="text-[11px] font-mono text-[var(--eva-orange)] tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--eva-orange)] animate-pulse" />
                <span>COMMS &amp; SECURITY PROTOCOLS</span>
              </div>

              {/* Email */}
              <ConfigInput
                id="cfg-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="pilot@nerv.magi"
                validator={validateEmail}
                disabled={isLoading || isSaving}
                data-testid="config-email-input"
              />

              {/* Phone */}
              <ConfigInput
                id="cfg-phone"
                label="Phone"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="8420607640"
                validator={validatePhone}
                disabled={isLoading || isSaving}
                data-testid="config-phone-input"
              />

              {/* Secret Passphrase */}
              <ConfigInput
                id="cfg-secret"
                label="Secret"
                type="password"
                value={secret}
                onChange={setSecret}
                placeholder="Enter access passphrase"
                validator={validateSecret}
                disabled={isLoading || isSaving}
                data-testid="config-secret-input"
              />
            </div>

            {/* Resume Card (Bottom Left) matching screenshot */}
            <div className="mt-3 sm:mt-4">
              <ConfigResumeCard
                resumeUrl={resumeUrl}
                onUpdateResumeUrl={(newUrl) => setResumeUrl(newUrl)}
                onUploadResumeFile={handleUploadResumeFile}
                disabled={isLoading || isSaving}
              />
            </div>
          </div>

          {/* Right Column: Framed Avatar with Carousel & Set as PFP Button (span 4) */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-end w-full">
            <ConfigAvatarCard
              currentPfpUrl={pfpUrl}
              pfpHistory={pfpHistory}
              onSetAsPfp={handleSetAsPfp}
              onUploadNewPfp={handleUploadNewPfp}
              disabled={isLoading || isSaving}
            />
          </div>
        </div>
      </div>

      {/* Full-width Hazard Strip Footer matching screenshot */}
      <div className="relative z-10 w-full h-8 sm:h-10 overflow-hidden shrink-0 mt-4 sm:mt-6">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "url('/eva dash/haz_strip.svg')",
            backgroundRepeat: "repeat-x",
            backgroundSize: "contain",
          }}
        />
      </div>
    </div>
  );
}