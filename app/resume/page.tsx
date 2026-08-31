import type { Metadata } from "next";
import InteractiveResume from "@/components/resume/InteractiveResume";
import { readResume } from "@/lib/server/resume";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const resume = readResume();
  return {
    title: `${resume.profile.name} · 交互式个人简历`,
    description: resume.profile.summary,
  };
}

export default function ResumePage() {
  return <InteractiveResume resume={readResume()} />;
}
