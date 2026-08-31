"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Code2,
  Copy,
  Database,
  ExternalLink,
  Eye,
  GraduationCap,
  Layers3,
  Mail,
  MapPin,
  Printer,
  ServerCog,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { ResumeData, ResumeSkillIcon } from "@/lib/resume";
import styles from "./InteractiveResume.module.css";

const skillIcons: Record<ResumeSkillIcon, LucideIcon> = {
  server: ServerCog,
  vision: Eye,
  foundation: Layers3,
};
const projectFeatureIcons: LucideIcon[] = [BriefcaseBusiness, Database, Eye, Mail];

const sectionLinks = [
  { label: "能力", href: "#capabilities" },
  { label: "经历", href: "#experience" },
  { label: "作品", href: "#project" },
  { label: "教育", href: "#education" },
];

export default function InteractiveResume({ resume }: { resume: ResumeData }) {
  const { profile, skills: skillGroups, experiences, education, honors, project } = resume;
  const monogram = profile.englishName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const updatedLabel = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
  }).format(new Date(resume.updatedAt)).replace("/", ".");
  const updatedYear = updatedLabel.slice(0, 4);
  const pageRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeSkillId, setActiveSkillId] = useState(skillGroups[0].id);
  const [selectedExperienceId, setSelectedExperienceId] = useState(experiences[0].id);
  const [copied, setCopied] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 28, mass: 0.35 });

  const activeSkill = skillGroups.find((group) => group.id === activeSkillId) ?? skillGroups[0];
  const selectedExperience = experiences.find((experience) => experience.id === selectedExperienceId) ?? experiences[0];

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (prefersReducedMotion || !pageRef.current) return;
    pageRef.current.style.setProperty("--resume-x", `${event.clientX}px`);
    pageRef.current.style.setProperty("--resume-y", `${event.clientY}px`);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  const reveal = prefersReducedMotion
    ? { initial: false as const, whileInView: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.58, ease: "easeOut" as const },
      };

  return (
    <main
      ref={pageRef}
      onPointerMove={handlePointerMove}
      className={`${styles.page} relative min-h-screen text-[#edf7fb]`}
    >
      <motion.div
        style={{ scaleX: progress }}
        className={`${styles.screenOnly} fixed left-0 top-0 z-[80] h-[3px] w-full origin-left bg-[#ff9f6b]`}
        aria-hidden="true"
      />
      <div className={`${styles.gridBackdrop} pointer-events-none absolute inset-0`} aria-hidden="true" />
      <div className={`${styles.spotlight} pointer-events-none fixed inset-0 z-0`} aria-hidden="true" />

      <header className={`${styles.screenOnly} sticky top-0 z-[60] border-b border-white/10 bg-[#071726]/80 backdrop-blur-xl`}>
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6bd5f5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071726]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6bd5f5]/35 bg-[#0d2940] text-[#6bd5f5] transition group-hover:border-[#6bd5f5]">
              <BookOpen size={17} />
            </span>
            <span>
              <strong className="block text-sm font-semibold tracking-[0.02em]">{profile.name} · Resume</strong>
              <span className="hidden text-[9px] font-medium uppercase tracking-[0.2em] text-white/40 sm:block">{profile.headerLabel}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/58 lg:flex" aria-label="简历页面导航">
            {sectionLinks.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-[#6bd5f5] focus-visible:outline-none focus-visible:text-[#6bd5f5]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden h-9 items-center gap-2 rounded-full border border-white/15 px-3.5 text-xs font-medium text-white/70 transition hover:border-[#6bd5f5]/60 hover:text-white sm:inline-flex"
            >
              <Printer size={14} /> 打印简历
            </button>
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#edf7fb] px-3.5 text-xs font-semibold text-[#071726] transition hover:bg-[#6bd5f5]"
            >
              <ArrowLeft size={14} /> 返回博客
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-74px)] max-w-[1380px] items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.72fr)] lg:px-12 lg:py-20">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.68, ease: "easeOut" }}
        >
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6bd5f5]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#6bd5f5]/30 bg-[#6bd5f5]/[0.07] px-3 py-1.5">
              <Sparkles size={13} /> {profile.graduationLabel}
            </span>
            <span className="text-white/40">{profile.location}</span>
          </div>

          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.28em] text-white/42">{profile.englishName}</p>
          <h1 className="mt-4 max-w-[820px] text-[clamp(3.5rem,8vw,7.9rem)] font-semibold leading-[0.84] tracking-[-0.075em]">
            {profile.name}
            <span className="mt-5 block font-playfair text-[0.48em] italic leading-none tracking-[-0.03em] text-[#6bd5f5]/75">
              {profile.tagline}
            </span>
          </h1>

          <p className="mt-9 max-w-[720px] text-base leading-8 text-white/68 sm:text-lg">
            {profile.summary}
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {profile.roles.map((role) => (
              <span key={role} className="rounded-full border border-white/15 bg-white/[0.035] px-3.5 py-2 text-xs font-medium text-white/70">
                {role}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href="#experience" className="inline-flex h-12 items-center gap-3 rounded-full bg-[#ff9f6b] px-5 text-sm font-semibold text-[#071726] transition hover:bg-[#ffc09d]">
              查看实践经历 <ArrowDown size={16} />
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex h-12 items-center gap-3 rounded-full border border-white/18 bg-white/[0.04] px-5 text-sm font-medium text-white/78 transition hover:border-[#6bd5f5]/60 hover:text-white"
            >
              {copied ? <Check size={16} className="text-[#6bd5f5]" /> : <Copy size={16} />}
              {copied ? "邮箱已复制" : profile.email}
            </button>
            <span className="inline-flex items-center gap-2 text-sm text-white/45"><MapPin size={15} /> {profile.location}</span>
          </div>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, delay: 0.16, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-[390px]"
        >
          <div className={`${styles.photoFrame} relative mx-auto aspect-[4/5] w-[min(78vw,330px)]`}>
            <div className="absolute inset-0 overflow-hidden rounded-[46%_54%_42%_58%/40%_44%_56%_60%] border border-white/20 bg-[#0d2940] shadow-[0_30px_90px_rgba(0,0,0,0.38)]">
              <Image src={profile.photoUrl} alt={`${profile.name}的简历头像`} fill priority unoptimized={profile.photoUrl.startsWith("/api/media/")} sizes="(min-width: 1024px) 330px, 78vw" className="object-cover" />
              <div className={`${styles.scanline} pointer-events-none absolute inset-x-0 top-0 h-24`} aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071726]/32 via-transparent to-white/[0.04]" />
            </div>
          </div>
          <div className="absolute -bottom-8 left-0 rounded-2xl border border-[#6bd5f5]/25 bg-[#071726]/88 px-4 py-3 shadow-2xl backdrop-blur-lg sm:-left-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6bd5f5]">Current focus</p>
            <p className="mt-1 text-sm font-semibold">{profile.focus}</p>
          </div>
          <div className="absolute -right-1 top-10 flex h-14 w-14 items-center justify-center rounded-full border border-[#ff9f6b]/35 bg-[#ff9f6b]/10 text-[#ff9f6b] backdrop-blur sm:-right-8">
            <Code2 size={22} />
          </div>
        </motion.div>

        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-3">
          {[
            [String(experiences.length).padStart(2, "0"), "段实践经历"],
            ["01", "个正在运行的作品"],
            [String(honors.length).padStart(2, "0"), "项证书与校级荣誉"],
          ].map(([value, label], index) => (
            <motion.div
              key={label}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.45, delay: 0.32 + index * 0.08 }}
              className="border-t border-white/15 py-5"
            >
              <strong className="font-onest text-3xl text-[#edf7fb]">{value}</strong>
              <span className="ml-3 text-sm text-white/45">{label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="relative z-10 border-y border-white/10 bg-[#091d2f]/82 py-20 sm:py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <motion.div {...reveal} viewport={{ once: true, amount: 0.25 }} className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6bd5f5]">Capabilities / 01</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">不使用虚假的熟练度，<span className="font-playfair italic text-white/42">只展示可验证的能力。</span></h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/48">点击不同方向，查看课程、工具与实践之间如何对应。</p>
          </motion.div>

          <div className="mt-12 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
              {skillGroups.map((group, index) => {
                const Icon = skillIcons[group.icon];
                const active = group.id === activeSkillId;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveSkillId(group.id)}
                    aria-pressed={active}
                    className={
                      "flex min-w-[200px] items-center justify-between rounded-2xl border px-4 py-4 text-left transition lg:min-w-0 " +
                      (active
                        ? "border-[#6bd5f5]/45 bg-[#6bd5f5]/10 text-white"
                        : "border-white/10 bg-white/[0.025] text-white/52 hover:border-white/20 hover:text-white")
                    }
                  >
                    <span className="flex items-center gap-3">
                      <span className={"flex h-9 w-9 items-center justify-center rounded-xl " + (active ? "bg-[#6bd5f5] text-[#071726]" : "bg-white/[0.05]")}><Icon size={17} /></span>
                      <span><small className="block text-[9px] tracking-[0.18em] opacity-45">0{index + 1}</small><strong className="mt-0.5 block text-sm">{group.label}</strong></span>
                    </span>
                    <ArrowUpRight size={15} />
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSkill.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.28 }}
                className={`${styles.printSurface} rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8 lg:p-10`}
              >
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#ff9f6b]">{activeSkill.eyebrow}</p>
                <h3 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{activeSkill.title}</h3>
                <p className={`${styles.printMuted} mt-5 max-w-3xl text-sm leading-7 text-white/55 sm:text-base`}>{activeSkill.description}</p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {activeSkill.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-[#6bd5f5]/20 bg-[#6bd5f5]/[0.06] px-3 py-2 text-xs font-medium text-[#bdeeff]">{skill}</span>
                  ))}
                </div>

                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  {activeSkill.evidence.map((item, index) => (
                    <div key={item} className="border-t border-white/12 pt-4">
                      <span className="text-[10px] font-semibold text-[#ff9f6b]">0{index + 1}</span>
                      <p className={`${styles.printMuted} mt-2 text-sm leading-6 text-white/62`}>{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section id="experience" className="relative z-10 bg-[#f4f0e8] py-20 text-[#102334] sm:py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <motion.div {...reveal} viewport={{ once: true, amount: 0.25 }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b78a5]">Experience / 02</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">在真实任务中，<span className="font-playfair italic text-black/38">一点点建立工程感。</span></h2>
          </motion.div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-14">
            <div className="relative">
              <div className={`${styles.timelineRail} absolute bottom-7 left-[7px] top-7 w-px`} aria-hidden="true" />
              <div className="space-y-2">
                {experiences.map((item) => {
                  const active = item.id === selectedExperienceId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedExperienceId(item.id)}
                      aria-pressed={active}
                      className={
                        "relative flex w-full items-start gap-5 rounded-2xl px-1 py-4 text-left transition sm:px-3 " +
                        (active ? "bg-white shadow-[0_12px_35px_rgba(16,35,52,0.08)]" : "hover:bg-white/55")
                      }
                    >
                      <span className={"relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-[#f4f0e8] " + (active ? "bg-[#0b78a5]" : "bg-[#afbec4]")} />
                      <span className="min-w-0">
                        <small className="text-[10px] font-semibold tracking-[0.13em] text-[#0b78a5]">{item.period}</small>
                        <strong className="mt-1 block text-sm leading-5">{item.role}</strong>
                        <span className="mt-1 block truncate text-xs text-black/45">{item.company}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.article
                key={selectedExperience.id}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: -10 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                className="rounded-[30px] border border-[#102334]/10 bg-white p-6 shadow-[0_20px_60px_rgba(16,35,52,0.08)] sm:p-9"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#102334]/10 pb-6">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e7744b]">{selectedExperience.type}</span>
                    <h3 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{selectedExperience.role}</h3>
                    <p className="mt-2 text-sm text-black/48">{selectedExperience.company}</p>
                  </div>
                  <span className="rounded-full bg-[#eaf6fa] px-3 py-2 text-xs font-semibold text-[#0b78a5]">{selectedExperience.period}</span>
                </div>

                <p className="mt-6 text-base leading-8 text-black/62">{selectedExperience.summary}</p>
                <ul className="mt-7 space-y-4">
                  {selectedExperience.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-black/66">
                      <Check size={17} className="mt-1.5 shrink-0 text-[#0b78a5]" /> {bullet}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-2">
                  {selectedExperience.tags.map((tag) => <span key={tag} className="rounded-full bg-[#102334]/[0.05] px-3 py-1.5 text-xs font-medium text-black/58">{tag}</span>)}
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section id="project" className="relative z-10 border-y border-white/10 bg-[#071726] py-20 sm:py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <motion.div {...reveal} viewport={{ once: true, amount: 0.2 }} className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ff9f6b]">Live project / 03</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{project.title}<span className="font-playfair italic text-white/42">{project.accent}</span></h2>
              <p className="mt-6 text-sm leading-7 text-white/52 sm:text-base">{project.description}</p>
              <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#edf7fb] px-5 py-3 text-sm font-semibold text-[#071726] transition hover:bg-[#6bd5f5]">
                查看博客首页 <ExternalLink size={16} />
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[#0b2135] p-6 sm:p-9">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#6bd5f5]"><Code2 size={16} /> PERSONAL BLOG SYSTEM</span>
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/38"><span className="h-2 w-2 animate-pulse rounded-full bg-[#ff9f6b]" /> live</span>
              </div>
              <h3 className="mt-7 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{project.name}</h3>
              <p className="mt-4 text-sm leading-7 text-white/52">{project.summary}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {project.features.map((label, index) => {
                  const FeatureIcon = projectFeatureIcons[index % projectFeatureIcons.length];
                  return <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-sm text-white/68"><FeatureIcon size={17} className="shrink-0 text-[#6bd5f5]" />{label}</div>;
                })}
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {project.technologies.map((tech) => <span key={tech} className="rounded-full border border-[#ff9f6b]/18 bg-[#ff9f6b]/[0.05] px-3 py-1.5 text-[11px] font-medium text-[#ffd1b9]">{tech}</span>)}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="education" className="relative z-10 bg-[#f4f0e8] py-20 text-[#102334] sm:py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <motion.div {...reveal} viewport={{ once: true, amount: 0.2 }} className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-[30px] border border-[#102334]/10 bg-white p-6 sm:p-9">
              <div className="flex items-center justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf6fa] text-[#0b78a5]"><GraduationCap size={21} /></span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/38">Education / 04</span>
              </div>
              <h2 className="mt-7 text-3xl font-semibold tracking-[-0.035em]">{education.school}</h2>
              <p className="mt-2 text-sm font-medium text-[#0b78a5]">{education.period} · {education.major} · {education.degree}</p>
              <p className="mt-5 text-sm leading-7 text-black/55">{education.description}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {education.courses.map((course) => <span key={course} className="rounded-full bg-[#102334]/[0.045] px-3 py-1.5 text-xs text-black/58">{course}</span>)}
              </div>
            </article>

            <article className="rounded-[30px] border border-[#102334]/10 bg-[#102334] p-6 text-white sm:p-9">
              <div className="flex items-center justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff9f6b]/12 text-[#ff9f6b]"><Trophy size={20} /></span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Honors</span>
              </div>
              <h2 className="mt-7 text-3xl font-semibold tracking-[-0.035em]">证书与荣誉</h2>
              <div className="mt-6 divide-y divide-white/10">
                {honors.map((honor) => (
                  <div key={honor.id} className="grid grid-cols-[68px_minmax(0,1fr)] gap-3 py-4">
                    <span className="text-[10px] font-semibold text-[#6bd5f5]">{honor.date}</span>
                    <span><strong className="block text-sm leading-5">{honor.title}</strong><small className="mt-1 block text-white/42">{honor.detail}</small></span>
                  </div>
                ))}
              </div>
            </article>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden bg-[#ff9f6b] py-20 text-[#071726] sm:py-24">
        <div className="pointer-events-none absolute -right-8 -top-20 select-none font-onest text-[12rem] font-semibold leading-none text-black/[0.055] sm:text-[20rem]" aria-hidden="true">{monogram}</div>
        <motion.div {...reveal} viewport={{ once: true, amount: 0.3 }} className="relative mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/52">Let&apos;s connect</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{profile.contactHeading}</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-black/58 sm:text-base">{profile.contactDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`mailto:${profile.email}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#071726] px-5 text-sm font-semibold text-white transition hover:bg-[#102f48]"><Mail size={16} /> 发送邮件</a>
            <button type="button" onClick={() => window.print()} className={`${styles.screenOnly} inline-flex h-12 items-center gap-2 rounded-full border border-[#071726]/30 px-5 text-sm font-semibold transition hover:bg-white/25`}><Printer size={16} /> 打印简历</button>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-white/8 bg-[#071726] py-7 text-white/38">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>© {updatedYear} {profile.name} · Interactive Resume</span>
          <span>信息来源于个人简历与当前博客项目 · 更新于 {updatedLabel}</span>
        </div>
      </footer>
      <span className="sr-only" aria-live="polite">{copied ? "邮箱地址已复制" : ""}</span>
    </main>
  );
}
