import type { Metadata } from "next";
import InteractiveResume from "@/components/resume/InteractiveResume";
import { readResume } from "@/lib/server/resume";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const resume = await readResume();
  return {
    title: `${resume.profile.name} · 交互式个人简历`,
    description: resume.profile.summary,
  };
}

export default async function ResumePage() {
  return <InteractiveResume resume={await readResume()} />;
}
