import { isSupabasePublicMediaUrl, readContent, writeContent } from "@/lib/server/persistence";
import {
  defaultResumeData,
  type ResumeData,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeHonor,
  type ResumeProfile,
  type ResumeProject,
  type ResumeSkillGroup,
  type ResumeSkillIcon,
} from "@/lib/resume";

export class ResumeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeValidationError";
  }
}

const dataFile = "resume.json";
const skillIcons: ResumeSkillIcon[] = ["server", "vision", "foundation"];

function asObject(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ResumeValidationError(`${label}格式无效`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, maxLength: number, minLength = 1) {
  const result = typeof value === "string" ? value.trim() : "";
  if (result.length < minLength || result.length > maxLength) {
    throw new ResumeValidationError(`${label}长度需要在 ${minLength} 到 ${maxLength} 个字符之间`);
  }
  return result;
}

function list(
  value: unknown,
  label: string,
  options: { maxItems: number; maxLength: number; minItems?: number },
) {
  if (!Array.isArray(value)) {
    throw new ResumeValidationError(`${label}格式无效`);
  }

  const values = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  const minItems = options.minItems ?? 1;
  if (values.length < minItems || values.length > options.maxItems) {
    throw new ResumeValidationError(`${label}需要填写 ${minItems} 到 ${options.maxItems} 项`);
  }
  if (values.some((item) => item.length > options.maxLength)) {
    throw new ResumeValidationError(`${label}单项不能超过 ${options.maxLength} 个字符`);
  }
  return values;
}

function identifier(value: unknown, label: string) {
  const id = text(value, label, 64);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) {
    throw new ResumeValidationError(`${label}只能包含字母、数字、下划线或短横线`);
  }
  return id;
}

function parseProfile(value: unknown): ResumeProfile {
  const record = asObject(value, "基本资料");
  const email = text(record.email, "邮箱", 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ResumeValidationError("邮箱格式无效");
  }

  const photoUrl = text(record.photoUrl, "头像地址", 240);
  if (
    !/^\/[A-Za-z0-9/_-]+\.(?:jpe?g|png|webp|gif)$/i.test(photoUrl) &&
    !/^\/api\/media\/[A-Za-z0-9._-]+$/.test(photoUrl) &&
    !isSupabasePublicMediaUrl(photoUrl)
  ) {
    throw new ResumeValidationError("头像必须是本站图片地址或后台上传的图片");
  }

  return {
    name: text(record.name, "姓名", 40, 2),
    englishName: text(record.englishName, "英文名", 80),
    headerLabel: text(record.headerLabel, "页眉说明", 100),
    graduationLabel: text(record.graduationLabel, "毕业身份", 80),
    location: text(record.location, "所在地", 80),
    email,
    tagline: text(record.tagline, "英文标语", 100),
    summary: text(record.summary, "个人简介", 600, 10),
    roles: list(record.roles, "求职方向", { maxItems: 8, maxLength: 60 }),
    photoUrl,
    focus: text(record.focus, "当前方向", 100),
    contactHeading: text(record.contactHeading, "联系区标题", 160, 4),
    contactDescription: text(record.contactDescription, "联系区说明", 400, 6),
  };
}

function parseSkills(value: unknown): ResumeSkillGroup[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) {
    throw new ResumeValidationError("能力方向需要保留 1 到 6 组");
  }

  const ids = new Set<string>();
  return value.map((item, index) => {
    const record = asObject(item, `第 ${index + 1} 组能力`);
    const id = identifier(record.id, `第 ${index + 1} 组能力标识`);
    if (ids.has(id)) throw new ResumeValidationError("能力方向标识不能重复");
    ids.add(id);

    const icon = text(record.icon, "能力图标", 20) as ResumeSkillIcon;
    if (!skillIcons.includes(icon)) throw new ResumeValidationError("能力图标无效");

    return {
      id,
      icon,
      label: text(record.label, "能力名称", 40),
      eyebrow: text(record.eyebrow, "能力英文标签", 80),
      title: text(record.title, "能力标题", 120, 4),
      description: text(record.description, "能力说明", 500, 8),
      skills: list(record.skills, "技能关键词", { maxItems: 16, maxLength: 60 }),
      evidence: list(record.evidence, "能力依据", { maxItems: 8, maxLength: 180 }),
    };
  });
}

function parseExperiences(value: unknown): ResumeExperience[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) {
    throw new ResumeValidationError("实践经历需要保留 1 到 12 段");
  }

  const ids = new Set<string>();
  return value.map((item, index) => {
    const record = asObject(item, `第 ${index + 1} 段经历`);
    const id = identifier(record.id, `第 ${index + 1} 段经历标识`);
    if (ids.has(id)) throw new ResumeValidationError("经历标识不能重复");
    ids.add(id);

    return {
      id,
      period: text(record.period, "经历时间", 80),
      company: text(record.company, "单位名称", 120),
      role: text(record.role, "职位名称", 100),
      type: text(record.type, "经历类型", 40),
      summary: text(record.summary, "经历摘要", 500, 6),
      bullets: list(record.bullets, "工作内容", { maxItems: 10, maxLength: 240 }),
      tags: list(record.tags, "经历标签", { maxItems: 10, maxLength: 40 }),
    };
  });
}

function parseEducation(value: unknown): ResumeEducation {
  const record = asObject(value, "教育背景");
  return {
    school: text(record.school, "学校名称", 100),
    period: text(record.period, "就读时间", 80),
    major: text(record.major, "专业名称", 100),
    degree: text(record.degree, "学历说明", 80),
    description: text(record.description, "教育说明", 500, 6),
    courses: list(record.courses, "主修课程", { maxItems: 24, maxLength: 80 }),
  };
}

function parseHonors(value: unknown): ResumeHonor[] {
  if (!Array.isArray(value) || value.length > 20) {
    throw new ResumeValidationError("证书与荣誉最多填写 20 项");
  }

  const ids = new Set<string>();
  return value.map((item, index) => {
    const record = asObject(item, `第 ${index + 1} 项荣誉`);
    const id = identifier(record.id, `第 ${index + 1} 项荣誉标识`);
    if (ids.has(id)) throw new ResumeValidationError("荣誉标识不能重复");
    ids.add(id);
    return {
      id,
      date: text(record.date, "荣誉时间", 40),
      title: text(record.title, "荣誉名称", 140),
      detail: text(record.detail, "荣誉说明", 100),
    };
  });
}

function parseProject(value: unknown): ResumeProject {
  const record = asObject(value, "项目作品");
  return {
    title: text(record.title, "项目区标题", 120),
    accent: text(record.accent, "项目区强调文字", 160),
    description: text(record.description, "项目区说明", 500, 8),
    name: text(record.name, "项目名称", 120),
    summary: text(record.summary, "项目摘要", 500, 8),
    features: list(record.features, "项目功能", { maxItems: 10, maxLength: 140 }),
    technologies: list(record.technologies, "项目技术", { maxItems: 16, maxLength: 60 }),
  };
}

function parseResume(input: unknown, preserveUpdatedAt: boolean): ResumeData {
  const record = asObject(input, "简历");
  const storedUpdatedAt = typeof record.updatedAt === "string" ? record.updatedAt : "";
  const updatedAt = preserveUpdatedAt && !Number.isNaN(Date.parse(storedUpdatedAt))
    ? new Date(storedUpdatedAt).toISOString()
    : new Date().toISOString();

  return {
    version: 1,
    updatedAt,
    profile: parseProfile(record.profile),
    skills: parseSkills(record.skills),
    experiences: parseExperiences(record.experiences),
    education: parseEducation(record.education),
    honors: parseHonors(record.honors),
    project: parseProject(record.project),
  };
}

export function parseResumePayload(input: unknown) {
  return parseResume(input, false);
}

export async function readResume(): Promise<ResumeData> {
  const value = await readContent<unknown>("resume", dataFile, defaultResumeData);
  try {
    return parseResume(value, true);
  } catch (error) {
    console.error("Resume data could not be read", error);
    return defaultResumeData;
  }
}

export async function writeResume(resume: ResumeData) {
  await writeContent("resume", dataFile, resume);
}
