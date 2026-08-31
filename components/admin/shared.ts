export const postCategories = ["技术", "美食专栏", "旅行", "生活", "思考", "成长"] as const;

export type PostCategory = (typeof postCategories)[number];
export type PostStatus = "draft" | "published";
export type MediaType = "image" | "video";

export type PostMedia = {
  type: MediaType;
  url: string;
  alt: string;
  caption: string;
};

export type AdminPost = {
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
  updatedAt: string;
};

export type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: PostCategory;
  readTime: string;
  tags: string;
  media: PostMedia[];
  status: PostStatus;
};

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
  createdAt: string;
};

export type AdminNotice = {
  type: "success" | "error";
  text: string;
};

export const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[#dbe8de] bg-white px-4 py-3 text-sm text-[#214b35] outline-none transition-colors placeholder:text-[#a3b6a8] focus:border-[#65a978] focus:ring-2 focus:ring-[#dcefdc]";

export function createBlankPostForm(): PostForm {
  return {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "思考",
    readTime: "5",
    tags: "",
    media: [],
    status: "draft",
  };
}

export function postToForm(post: AdminPost): PostForm {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    readTime: String(post.readTime),
    tags: post.tags.join(", "),
    media: post.media ?? [],
    status: post.status,
  };
}

export function formatAdminDate(value: string) {
  return value.slice(0, 10).replaceAll("-", ".");
}

export async function responseMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message || "请求失败，请稍后重试";
  } catch {
    return "请求失败，请稍后重试";
  }
}
