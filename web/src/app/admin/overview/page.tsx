import { Metadata } from "next";
import Image from "next/image";
import ProfileDetails from "./components/ProfileDetails";
import ProfileAvatarCard from "./components/ProfileAvatarCard";
import ConfigResumeCard from "../config/components/ConfigResumeCard";
import TopSkillsCard from "./components/TopSkillsCard";
import CoreStatusBox from "./components/CoreStatusBox";
import OverviewBackground from "./components/OverviewBackground";

export const metadata: Metadata = {
  title: "Overview // NERV Admin Console",
  description: "Pilot status, profile telemetry, skills matrix, and system health overview",
};

export default function AdminOverviewPage() {
  return (
    <div className="relative flex-1 bg-black text-white flex flex-col justify-between min-h-[calc(100vh-4rem)] select-none overflow-hidden">
      {/* WebGL PatternWaves Dynamic Background */}
      <OverviewBackground />

      {/* Main Content Area */}
      <div className="relative z-10 p-8 md:p-10 space-y-10 max-w-[1600px] w-full mx-auto flex-1">
        {/* Row 1 (Top): Profile Details on Left, Avatar Framed in pic_frame.svg on Right */}
        <section
          aria-label="Pilot Dossier"
          className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12"
        >
          {/* Details (Name, Job, Bio, Summary) */}
          <div className="flex-1 w-full max-w-4xl">
            <ProfileDetails />
          </div>

          {/* Framed Avatar inside pic_frame.svg */}
          <div className="shrink-0 self-center lg:self-start">
            <ProfileAvatarCard />
          </div>
        </section>

        {/* Row 2 (Bottom): 3 Equal-Height Cards (Resume, Top Skills, Status Box) */}
        <section
          aria-label="Operational Metrics and Credentials"
          className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch"
        >
          {/* Card 1: Resume.pdf */}
          <div className="md:col-span-5 lg:col-span-5">
            <ConfigResumeCard editable={false} />
          </div>

          {/* Card 2: Top Skills */}
          <div className="md:col-span-4 lg:col-span-4">
            <TopSkillsCard />
          </div>

          {/* Card 3: MAGI_Core Telemetry Status Box */}
          <div className="md:col-span-3 lg:col-span-3">
            <CoreStatusBox />
          </div>
        </section>
      </div>

      {/* Hazard Strip Footer matching overview.png */}
      <div className="relative z-10 w-full h-8 sm:h-10 relative overflow-hidden shrink-0 mt-8">
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
