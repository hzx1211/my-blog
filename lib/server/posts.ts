import { randomUUID } from "node:crypto";
import { isSupabasePublicMediaUrl, readContent, writeContent } from "@/lib/server/persistence";

export const postCategories = ["技术", "美食专栏", "旅行", "生活", "思考", "成长"] as const;
export type PostCategory = (typeof postCategories)[number];
export type PostStatus = "draft" | "published";
export type PostMediaType = "image" | "video";

export type PostMedia = {
  type: PostMediaType;
  url: string;
  alt: string;
  caption: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: PostCategory;
  readTime: number;
  views: number;
  tags: string[];
  media?: PostMedia[];
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostPayload = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: PostCategory;
  readTime: number;
  tags: string[];
  media: PostMedia[];
  status: PostStatus;
};

export class PostValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostValidationError";
  }
}

const dataFile = "posts.json";

function sortPosts(posts: BlogPost[]) {
  return [...posts].sort((left, right) => {
    const leftTime = new Date(left.updatedAt).getTime();
    const rightTime = new Date(right.updatedAt).getTime();
    return rightTime - leftTime;
  });
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStoredCategory(value: unknown): PostCategory {
  const category = asText(value);
  if (category === "做饭") return "美食专栏";
  if (category === "出行") return "旅行";
  return postCategories.includes(category as PostCategory) ? (category as PostCategory) : "生活";
}

function normalizeViewCount(value: unknown) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\u4E00-\u9FFFa-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");

  return slug || `post-${Date.now()}`;
}

function parseMedia(value: unknown): PostMedia[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 12)
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const type = asText(record.type);
      const url = asText(record.url);
      if (
        (type !== "image" && type !== "video") ||
        (!/^\/api\/media\/[A-Za-z0-9._-]+$/.test(url) && !isSupabasePublicMediaUrl(url))
      ) {
        return null;
      }

      return {
        type,
        url,
        alt: asText(record.alt).slice(0, 120) || (type === "image" ? "博客照片" : "博客 Vlog"),
        caption: asText(record.caption).slice(0, 180),
      } as PostMedia;
    })
    .filter((item): item is PostMedia => item !== null);
}

export function parsePostPayload(input: unknown): PostPayload {
  if (!input || typeof input !== "object") {
    throw new PostValidationError("请求体必须是 JSON 对象");
  }

  const record = input as Record<string, unknown>;
  const title = asText(record.title);
  const excerpt = asText(record.excerpt);
  const content = asText(record.content);
  const slug = slugify(asText(record.slug) || title);
  const rawCategory = asText(record.category);
  const category = (rawCategory === "做饭" ? "美食专栏" : rawCategory === "出行" ? "旅行" : rawCategory) as PostCategory;
  const status = asText(record.status) as PostStatus;
  const readTime = Number(record.readTime ?? 5);
  const media = parseMedia(record.media);
  const tags = Array.isArray(record.tags)
    ? record.tags.map(asText).filter(Boolean).slice(0, 8)
    : asText(record.tags)
        .split(/[，,]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8);

  if (title.length < 2 || title.length > 80) {
    throw new PostValidationError("标题长度需要在 2 到 80 个字符之间");
  }
  if (excerpt.length < 5 || excerpt.length > 240) {
    throw new PostValidationError("摘要长度需要在 5 到 240 个字符之间");
  }
  if (content.length < 10) {
    throw new PostValidationError("正文至少需要 10 个字符");
  }
  if (!postCategories.includes(category)) {
    throw new PostValidationError("文章分类无效");
  }
  if (status !== "draft" && status !== "published") {
    throw new PostValidationError("文章状态无效");
  }
  if (!Number.isInteger(readTime) || readTime < 1 || readTime > 60) {
    throw new PostValidationError("阅读时长需要是 1 到 60 之间的整数");
  }

  return { title, slug, excerpt, content, category, readTime, tags, media, status };
}

export async function readPosts(): Promise<BlogPost[]> {
  const value = await readContent<unknown>("posts", dataFile, []);
  if (!Array.isArray(value)) return [];

  return sortPosts(
    (value as BlogPost[]).map((post) => ({
      ...post,
      category: normalizeStoredCategory(post.category),
      views: normalizeViewCount(post.views),
    })),
  );
}

export async function listPosts(options: { publishedOnly?: boolean; category?: string } = {}) {
  return (await readPosts()).filter((post) => {
    const matchesStatus = !options.publishedOnly || post.status === "published";
    const matchesCategory = !options.category || post.category === options.category;
    return matchesStatus && matchesCategory;
  });
}

export async function writePosts(posts: BlogPost[]) {
  await writeContent("posts", dataFile, sortPosts(posts));
}

export function createPost(input: unknown, existingPosts: BlogPost[]) {
  const payload = parsePostPayload(input);
  const now = new Date().toISOString();
  const slug = uniqueSlug(payload.slug, existingPosts);

  return {
    ...payload,
    id: randomUUID(),
    slug,
    views: 0,
    publishedAt: payload.status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  } satisfies BlogPost;
}

export function updatePost(existing: BlogPost, input: unknown, existingPosts: BlogPost[]) {
  const payload = parsePostPayload(input);
  const now = new Date().toISOString();
  const slug = uniqueSlug(payload.slug, existingPosts, existing.id);

  return {
    ...existing,
    ...payload,
    slug,
    publishedAt:
      payload.status === "published" ? existing.publishedAt ?? now : null,
    updatedAt: now,
  } satisfies BlogPost;
}

function uniqueSlug(slug: string, posts: BlogPost[], currentId?: string) {
  const base = slugify(slug);
  const conflict = posts.some((post) => post.slug === base && post.id !== currentId);

  if (!conflict) {
    return base;
  }

  return `${base}-${Date.now()}`;
}

export async function getPostById(id: string) {
  return (await readPosts()).find((post) => post.id === id) ?? null;
}

export async function getPostBySlug(slug: string, publishedOnly = false) {
  return (
    (await readPosts()).find(
      (post) => post.slug === slug && (!publishedOnly || post.status === "published"),
    ) ?? null
  );
}

export async function incrementPostViews(slug: string) {
  const posts = await readPosts();
  const index = posts.findIndex(
    (post) => post.slug === slug && post.status === "published",
  );

  if (index === -1) {
    return null;
  }

  const updatedPost = {
    ...posts[index],
    views: normalizeViewCount(posts[index].views) + 1,
  };
  const updatedPosts = [...posts];
  updatedPosts[index] = updatedPost;
  await writePosts(updatedPosts);

  return updatedPost.views;
}

export function toPublicPost(post: BlogPost) {
  const { content: _content, status: _status, ...publicPost } = post;
  return publicPost;
}
