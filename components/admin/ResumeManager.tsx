"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Award,
  BriefcaseBusiness,
  Check,
  Code2,
  ExternalLink,
  GraduationCap,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import type {
  ResumeData,
  ResumeExperience,
  ResumeHonor,
  ResumeSkillGroup,
  ResumeSkillIcon,
} from "@/lib/resume";
import { responseMessage, type AdminNotice } from "./shared";

type EditorSection = "profile" | "skills" | "experience" | "education" | "project";

const editorSections: Array<{
  id: EditorSection;
  label: string;
  detail: string;
  icon: typeof UserRound;
}> = [
  { id: "profile", label: "基本资料", detail: "头像、简介与联系信息", icon: UserRound },
  { id: "skills", label: "能力技能", detail: "方向、关键词与依据", icon: Wrench },
  { id: "experience", label: "实践经历", detail: "实习、校园与项目实践", icon: BriefcaseBusiness },
  { id: "education", label: "教育荣誉", detail: "学校、课程与证书", icon: GraduationCap },
  { id: "project", label: "作品项目", detail: "博客项目与技术栈", icon: Code2 },
];

const inputClassName =
  "mt-2 w-full rounded-2xl border border-[#dbe8de] bg-white px-4 py-3 text-sm text-[#214b35] outline-none transition placeholder:text-[#a3b6a8] focus:border-[#65a978] focus:ring-2 focus:ring-[#dcefdc]";
const textareaClassName = `${inputClassName} min-h-[112px] resize-y leading-6`;

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-[#315844]">
      {label}
      {hint && <span className="ml-2 text-xs font-normal text-[#91a89a]">{hint}</span>}
      {children}
    </label>
  );
}

function Notice({ notice }: { notice: AdminNotice | null }) {
  if (!notice) return null;
  return (
    <p
      role={notice.type === "error" ? "alert" : "status"}
      className={
        "rounded-2xl border px-4 py-3 text-sm " +
        (notice.type === "error"
          ? "border-[#f1c5b6] bg-[#fff3ee] text-[#a65338]"
          : "border-[#bfe0c7] bg-[#eef8f0] text-[#386b47]")
      }
    >
      {notice.text}
    </p>
  );
}

function toLines(values: string[]) {
  return values.join("\n");
}

function fromLines(value: string) {
  return value.split("\n");
}

function formatResumeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16).replace("T", " ");
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replaceAll("/", "-");
}

function createId(prefix: string) {
  const token = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().split("-")[0]
    : Date.now().toString(36);
  return `${prefix}-${token}`;
}

function blankSkill(): ResumeSkillGroup {
  return {
    id: createId("skill"),
    icon: "server",
    label: "新的能力方向",
    eyebrow: "SKILL DIRECTION",
    title: "填写这一方向的能力标题",
    description: "说明你在这一方向已经掌握的知识、工具和实践。",
    skills: ["技能关键词"],
    evidence: ["用课程、项目或经历证明这项能力"],
  };
}

function blankExperience(): ResumeExperience {
  return {
    id: createId("experience"),
    period: "2026.01 — 2026.06",
    company: "单位或项目名称",
    role: "职位或实践角色",
    type: "实践经历",
    summary: "用一句话概括这段经历的价值和你承担的工作。",
    bullets: ["描述一项具体工作、行动或成果"],
    tags: ["关键词"],
  };
}

function blankHonor(): ResumeHonor {
  return {
    id: createId("honor"),
    date: "2026.01",
    title: "证书或荣誉名称",
    detail: "颁发单位或等级",
  };
}

export default function ResumeManager() {
  const [activeSection, setActiveSection] = useState<EditorSection>("profile");
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  async function loadResume() {
    setLoading(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/resume", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const data = (await response.json()) as { item: ResumeData };
      setResume(data.item);
      setDirty(false);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "简历数据加载失败" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResume();
  }, []);

  useEffect(() => {
    function warnBeforeLeave(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [dirty]);

  function updateResume(updater: (current: ResumeData) => ResumeData) {
    setResume((current) => (current ? updater(current) : current));
    setDirty(true);
    setNotice(null);
  }

  async function saveResume() {
    if (!resume) return;
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/resume", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resume),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      const data = (await response.json()) as { item: ResumeData; message?: string };
      setResume(data.item);
      setDirty(false);
      setNotice({ type: "success", text: data.message || "简历已保存并同步到前台" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "简历保存失败" });
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error(await responseMessage(response));
      const data = (await response.json()) as { item?: { type?: string; url?: string } };
      if (data.item?.type !== "image" || !data.item.url) throw new Error("上传结果不是有效图片");
      updateResume((current) => ({
        ...current,
        profile: { ...current.profile, photoUrl: data.item!.url! },
      }));
      setNotice({ type: "success", text: "新头像已上传，点击“保存简历”后同步到前台" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "头像上传失败" });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[2rem] border border-[#dbe8de] bg-white text-sm text-[#78907f]">
        <LoaderCircle className="mr-2 animate-spin" size={17} /> 正在读取简历…
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="rounded-[2rem] border border-[#efc6b9] bg-[#fff5f1] p-6 text-sm text-[#a65338]">
        <p>{notice?.text || "简历数据暂时无法读取"}</p>
        <button type="button" onClick={() => void loadResume()} className="mt-4 rounded-full border border-[#e8aa95] px-4 py-2 font-semibold hover:bg-white">重新加载</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-3 z-30 flex flex-col gap-3 rounded-[1.6rem] border border-[#d4e4d7] bg-white/95 px-4 py-3 shadow-[0_14px_40px_rgba(40,75,53,0.11)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3 text-sm text-[#668274]">
          <span className={"flex h-9 w-9 items-center justify-center rounded-xl " + (dirty ? "bg-[#fff0e8] text-[#d96a43]" : "bg-[#eaf5ec] text-[#3d8051]") }>
            {dirty ? <Save size={17} /> : <Check size={17} />}
          </span>
          <span>{dirty ? "有尚未保存的修改" : `已同步 · ${formatResumeDate(resume.updatedAt)}`}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/resume" target="_blank" className="inline-flex items-center gap-2 rounded-full border border-[#d4e4d7] px-4 py-2.5 text-sm font-semibold text-[#547062] transition hover:bg-[#f1f7f2]">
            前台预览 <ExternalLink size={14} />
          </Link>
          <button type="button" onClick={() => void saveResume()} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-full bg-[#063b28] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b5136] disabled:cursor-not-allowed disabled:opacity-45">
            {saving ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}
            {saving ? "保存中…" : "保存简历"}
          </button>
        </div>
      </div>

      <Notice notice={notice} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[250px_minmax(0,1fr)] xl:items-start">
        <nav aria-label="简历编辑分区" className="flex gap-2 overflow-x-auto rounded-[1.75rem] border border-[#dbe8de] bg-white p-2 xl:sticky xl:top-24 xl:flex-col xl:overflow-visible">
          {editorSections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <button key={section.id} type="button" onClick={() => setActiveSection(section.id)} aria-pressed={active} className={"flex min-w-[190px] items-center gap-3 rounded-2xl px-3 py-3 text-left transition xl:min-w-0 " + (active ? "bg-[#102f26] text-white" : "text-[#668274] hover:bg-[#f1f7f2] hover:text-[#214b35]") }>
                <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " + (active ? "bg-white/12" : "bg-[#eaf4ec] text-[#42805a]")}><Icon size={17} /></span>
                <span><strong className="block text-sm">{section.label}</strong><small className={active ? "text-white/58" : "text-[#9ab0a0]"}>{section.detail}</small></span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {activeSection === "profile" && (
            <section className="space-y-5">
              <div className="grid gap-5 rounded-[2rem] border border-[#dbe8de] bg-white p-5 sm:p-7 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-[210px] overflow-hidden rounded-[2rem] bg-[#e8f2e9]">
                    <Image src={resume.profile.photoUrl} alt="简历头像预览" fill unoptimized={resume.profile.photoUrl.startsWith("/api/media/")} sizes="210px" className="object-cover" />
                  </div>
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#9fc3a8] bg-[#f4faf5] px-3 py-3 text-sm font-semibold text-[#49715a] transition hover:bg-[#eaf5ec]">
                    {uploading ? <LoaderCircle className="animate-spin" size={16} /> : <ImagePlus size={16} />}
                    {uploading ? "上传中…" : "更换头像"}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={(event) => void uploadPhoto(event)} />
                  </label>
                  <p className="mt-2 text-center text-[11px] leading-5 text-[#91a89a]">支持 JPG、PNG、WebP、GIF，最大 20MB</p>
                </div>

                <div className="grid content-start gap-4 sm:grid-cols-2">
                  <Field label="姓名"><input className={inputClassName} value={resume.profile.name} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, name: event.target.value } }))} /></Field>
                  <Field label="英文名"><input className={inputClassName} value={resume.profile.englishName} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, englishName: event.target.value } }))} /></Field>
                  <Field label="页眉英文说明"><input className={inputClassName} value={resume.profile.headerLabel} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, headerLabel: event.target.value } }))} /></Field>
                  <Field label="毕业身份"><input className={inputClassName} value={resume.profile.graduationLabel} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, graduationLabel: event.target.value } }))} /></Field>
                  <Field label="所在地"><input className={inputClassName} value={resume.profile.location} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, location: event.target.value } }))} /></Field>
                  <Field label="公开邮箱"><input type="email" className={inputClassName} value={resume.profile.email} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, email: event.target.value } }))} /></Field>
                  <Field label="英文标语"><input className={inputClassName} value={resume.profile.tagline} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, tagline: event.target.value } }))} /></Field>
                  <Field label="当前方向"><input className={inputClassName} value={resume.profile.focus} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, focus: event.target.value } }))} /></Field>
                </div>
              </div>

              <div className="grid gap-5 rounded-[2rem] border border-[#dbe8de] bg-white p-5 sm:p-7 lg:grid-cols-2">
                <Field label="个人简介"><textarea rows={6} className={textareaClassName} value={resume.profile.summary} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, summary: event.target.value } }))} /></Field>
                <Field label="求职方向" hint="每行一项"><textarea rows={6} className={textareaClassName} value={toLines(resume.profile.roles)} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, roles: fromLines(event.target.value) } }))} /></Field>
                <Field label="联系区标题"><textarea rows={3} className={textareaClassName} value={resume.profile.contactHeading} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, contactHeading: event.target.value } }))} /></Field>
                <Field label="联系区说明"><textarea rows={3} className={textareaClassName} value={resume.profile.contactDescription} onChange={(event) => updateResume((current) => ({ ...current, profile: { ...current.profile, contactDescription: event.target.value } }))} /></Field>
              </div>
            </section>
          )}

          {activeSection === "skills" && (
            <section className="space-y-4">
              {resume.skills.map((skill, index) => (
                <article key={skill.id} className="rounded-[2rem] border border-[#dbe8de] bg-white p-5 sm:p-7">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#edf3ee] pb-4">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e86f45]">Direction {String(index + 1).padStart(2, "0")}</p><h2 className="mt-1 text-xl font-semibold text-[#214b35]">{skill.label || "未命名能力"}</h2></div>
                    <button type="button" disabled={resume.skills.length === 1} onClick={() => updateResume((current) => ({ ...current, skills: current.skills.filter((item) => item.id !== skill.id) }))} className="inline-flex items-center gap-2 rounded-full border border-[#efd0c5] px-3 py-2 text-xs font-semibold text-[#b85c48] hover:bg-[#fff4ef] disabled:cursor-not-allowed disabled:opacity-35"><Trash2 size={14} /> 删除</button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="方向名称"><input className={inputClassName} value={skill.label} onChange={(event) => updateResume((current) => ({ ...current, skills: current.skills.map((item) => item.id === skill.id ? { ...item, label: event.target.value } : item) }))} /></Field>
                    <Field label="图标风格"><select className={inputClassName} value={skill.icon} onChange={(event) => updateResume((current) => ({ ...current, skills: current.skills.map((item) => item.id === skill.id ? { ...item, icon: event.target.value as ResumeSkillIcon } : item) }))}><option value="server">后端服务器</option><option value="vision">机器视觉</option><option value="foundation">计算机基础</option></select></Field>
                    <Field label="英文标签"><input className={inputClassName} value={skill.eyebrow} onChange={(event) => updateResume((current) => ({ ...current, skills: current.skills.map((item) => item.id === skill.id ? { ...item, eyebrow: event.target.value } : item) }))} /></Field>
                    <Field label="能力标题"><input className={inputClassName} value={skill.title} onChange={(event) => updateResume((current) => ({ ...current, skills: current.skills.map((item) => item.id === skill.id ? { ...item, title: event.target.value } : item) }))} /></Field>
                    <div className="sm:col-span-2"><Field label="能力说明"><textarea rows={3} className={textareaClassName} value={skill.description} onChange={(event) => updateResume((current) => ({ ...current, skills: current.skills.map((item) => item.id === skill.id ? { ...item, description: event.target.value } : item) }))} /></Field></div>
                    <Field label="技能关键词" hint="每行一项"><textarea rows={6} className={textareaClassName} value={toLines(skill.skills)} onChange={(event) => updateResume((current) => ({ ...current, skills: current.skills.map((item) => item.id === skill.id ? { ...item, skills: fromLines(event.target.value) } : item) }))} /></Field>
                    <Field label="能力依据" hint="每行一项"><textarea rows={6} className={textareaClassName} value={toLines(skill.evidence)} onChange={(event) => updateResume((current) => ({ ...current, skills: current.skills.map((item) => item.id === skill.id ? { ...item, evidence: fromLines(event.target.value) } : item) }))} /></Field>
                  </div>
                </article>
              ))}
              <button type="button" disabled={resume.skills.length >= 6} onClick={() => updateResume((current) => ({ ...current, skills: [...current.skills, blankSkill()] }))} className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#91b59b] bg-white px-5 py-3 text-sm font-semibold text-[#49715a] hover:bg-[#eef7ef] disabled:opacity-40"><Plus size={16} /> 添加能力方向</button>
            </section>
          )}

          {activeSection === "experience" && (
            <section className="space-y-4">
              {resume.experiences.map((experience, index) => (
                <article key={experience.id} className="rounded-[2rem] border border-[#dbe8de] bg-white p-5 sm:p-7">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#edf3ee] pb-4">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e86f45]">Experience {String(index + 1).padStart(2, "0")}</p><h2 className="mt-1 text-xl font-semibold text-[#214b35]">{experience.role || "未命名经历"}</h2></div>
                    <button type="button" disabled={resume.experiences.length === 1} onClick={() => updateResume((current) => ({ ...current, experiences: current.experiences.filter((item) => item.id !== experience.id) }))} className="inline-flex items-center gap-2 rounded-full border border-[#efd0c5] px-3 py-2 text-xs font-semibold text-[#b85c48] hover:bg-[#fff4ef] disabled:opacity-35"><Trash2 size={14} /> 删除</button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="时间"><input className={inputClassName} value={experience.period} onChange={(event) => updateResume((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === experience.id ? { ...item, period: event.target.value } : item) }))} /></Field>
                    <Field label="经历类型"><input className={inputClassName} value={experience.type} onChange={(event) => updateResume((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === experience.id ? { ...item, type: event.target.value } : item) }))} /></Field>
                    <Field label="单位或项目"><input className={inputClassName} value={experience.company} onChange={(event) => updateResume((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === experience.id ? { ...item, company: event.target.value } : item) }))} /></Field>
                    <Field label="职位或角色"><input className={inputClassName} value={experience.role} onChange={(event) => updateResume((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === experience.id ? { ...item, role: event.target.value } : item) }))} /></Field>
                    <div className="sm:col-span-2"><Field label="经历摘要"><textarea rows={3} className={textareaClassName} value={experience.summary} onChange={(event) => updateResume((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === experience.id ? { ...item, summary: event.target.value } : item) }))} /></Field></div>
                    <Field label="工作内容" hint="每行一项"><textarea rows={7} className={textareaClassName} value={toLines(experience.bullets)} onChange={(event) => updateResume((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === experience.id ? { ...item, bullets: fromLines(event.target.value) } : item) }))} /></Field>
                    <Field label="经历标签" hint="每行一项"><textarea rows={7} className={textareaClassName} value={toLines(experience.tags)} onChange={(event) => updateResume((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === experience.id ? { ...item, tags: fromLines(event.target.value) } : item) }))} /></Field>
                  </div>
                </article>
              ))}
              <button type="button" disabled={resume.experiences.length >= 12} onClick={() => updateResume((current) => ({ ...current, experiences: [...current.experiences, blankExperience()] }))} className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#91b59b] bg-white px-5 py-3 text-sm font-semibold text-[#49715a] hover:bg-[#eef7ef] disabled:opacity-40"><Plus size={16} /> 添加实践经历</button>
            </section>
          )}

          {activeSection === "education" && (
            <section className="space-y-5">
              <article className="rounded-[2rem] border border-[#dbe8de] bg-white p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-3 border-b border-[#edf3ee] pb-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4ec] text-[#42805a]"><GraduationCap size={19} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e86f45]">Education</p><h2 className="text-xl font-semibold text-[#214b35]">教育背景</h2></div></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="学校"><input className={inputClassName} value={resume.education.school} onChange={(event) => updateResume((current) => ({ ...current, education: { ...current.education, school: event.target.value } }))} /></Field>
                  <Field label="就读时间"><input className={inputClassName} value={resume.education.period} onChange={(event) => updateResume((current) => ({ ...current, education: { ...current.education, period: event.target.value } }))} /></Field>
                  <Field label="专业"><input className={inputClassName} value={resume.education.major} onChange={(event) => updateResume((current) => ({ ...current, education: { ...current.education, major: event.target.value } }))} /></Field>
                  <Field label="学历"><input className={inputClassName} value={resume.education.degree} onChange={(event) => updateResume((current) => ({ ...current, education: { ...current.education, degree: event.target.value } }))} /></Field>
                  <Field label="教育说明"><textarea rows={5} className={textareaClassName} value={resume.education.description} onChange={(event) => updateResume((current) => ({ ...current, education: { ...current.education, description: event.target.value } }))} /></Field>
                  <Field label="主修课程" hint="每行一项"><textarea rows={5} className={textareaClassName} value={toLines(resume.education.courses)} onChange={(event) => updateResume((current) => ({ ...current, education: { ...current.education, courses: fromLines(event.target.value) } }))} /></Field>
                </div>
              </article>

              <article className="rounded-[2rem] border border-[#dbe8de] bg-white p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#edf3ee] pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0e8] text-[#d96a43]"><Award size={19} /></span><div><p className="text-[10px] font-semibold tracking-[0.18em] text-[#e86f45]">荣誉记录</p><h2 className="text-xl font-semibold text-[#214b35]">证书与荣誉</h2></div></div><button type="button" disabled={resume.honors.length >= 20} onClick={() => updateResume((current) => ({ ...current, honors: [...current.honors, blankHonor()] }))} className="inline-flex items-center gap-2 rounded-full border border-[#cfe0d3] px-4 py-2 text-xs font-semibold text-[#547062] hover:bg-[#f1f7f2]"><Plus size={14} /> 添加</button></div>
                <div className="space-y-3">
                  {resume.honors.length === 0 && <p className="rounded-2xl bg-[#f5f8f5] px-4 py-5 text-sm text-[#78907f]">暂无荣誉，可以点击右上角添加。</p>}
                  {resume.honors.map((honor) => (
                    <div key={honor.id} className="grid gap-3 rounded-2xl border border-[#e5eee6] p-4 sm:grid-cols-[130px_minmax(0,1fr)_180px_auto] sm:items-end">
                      <Field label="时间"><input className={inputClassName} value={honor.date} onChange={(event) => updateResume((current) => ({ ...current, honors: current.honors.map((item) => item.id === honor.id ? { ...item, date: event.target.value } : item) }))} /></Field>
                      <Field label="名称"><input className={inputClassName} value={honor.title} onChange={(event) => updateResume((current) => ({ ...current, honors: current.honors.map((item) => item.id === honor.id ? { ...item, title: event.target.value } : item) }))} /></Field>
                      <Field label="说明"><input className={inputClassName} value={honor.detail} onChange={(event) => updateResume((current) => ({ ...current, honors: current.honors.map((item) => item.id === honor.id ? { ...item, detail: event.target.value } : item) }))} /></Field>
                      <button type="button" aria-label={`删除${honor.title}`} onClick={() => updateResume((current) => ({ ...current, honors: current.honors.filter((item) => item.id !== honor.id) }))} className="mb-0.5 flex h-11 w-11 items-center justify-center rounded-xl border border-[#efd0c5] text-[#b85c48] hover:bg-[#fff4ef]"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {activeSection === "project" && (
            <section className="rounded-[2rem] border border-[#dbe8de] bg-white p-5 sm:p-7">
              <div className="mb-5 flex items-center gap-3 border-b border-[#edf3ee] pb-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4ec] text-[#42805a]"><Code2 size={19} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e86f45]">Live project</p><h2 className="text-xl font-semibold text-[#214b35]">作品项目</h2></div></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="项目区标题"><input className={inputClassName} value={resume.project.title} onChange={(event) => updateResume((current) => ({ ...current, project: { ...current.project, title: event.target.value } }))} /></Field>
                <Field label="强调文字"><input className={inputClassName} value={resume.project.accent} onChange={(event) => updateResume((current) => ({ ...current, project: { ...current.project, accent: event.target.value } }))} /></Field>
                <div className="sm:col-span-2"><Field label="项目区说明"><textarea rows={3} className={textareaClassName} value={resume.project.description} onChange={(event) => updateResume((current) => ({ ...current, project: { ...current.project, description: event.target.value } }))} /></Field></div>
                <Field label="项目名称"><input className={inputClassName} value={resume.project.name} onChange={(event) => updateResume((current) => ({ ...current, project: { ...current.project, name: event.target.value } }))} /></Field>
                <Field label="项目摘要"><textarea rows={4} className={textareaClassName} value={resume.project.summary} onChange={(event) => updateResume((current) => ({ ...current, project: { ...current.project, summary: event.target.value } }))} /></Field>
                <Field label="项目功能" hint="每行一项"><textarea rows={8} className={textareaClassName} value={toLines(resume.project.features)} onChange={(event) => updateResume((current) => ({ ...current, project: { ...current.project, features: fromLines(event.target.value) } }))} /></Field>
                <Field label="技术栈" hint="每行一项"><textarea rows={8} className={textareaClassName} value={toLines(resume.project.technologies)} onChange={(event) => updateResume((current) => ({ ...current, project: { ...current.project, technologies: fromLines(event.target.value) } }))} /></Field>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
