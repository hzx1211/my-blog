"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, Code2, Compass, Eye, FileText, Leaf, PenLine, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Category = "全部" | "技术" | "美食专栏" | "旅行" | "生活" | "思考" | "成长";
type PostCategory = Exclude<Category, "全部">;
type PostMedia = {
  type: "image" | "video";
  url: string;
  alt: string;
  caption: string;
};

type ApiPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: PostCategory;
  readTime: number;
  views: number;
  tags: string[];
  media?: PostMedia[];
  publishedAt: string | null;
};

type DisplayPost = ApiPost & {
  icon: LucideIcon;
  number: string;
  date: string;
  tone: string;
};

const categories: Category[] = ["全部", "技术", "美食专栏", "旅行", "生活", "思考", "成长"];

function iconFor(category: PostCategory) {
  if (category === "技术") return Code2;
  if (category === "美食专栏") return UtensilsCrossed;
  if (category === "旅行") return Compass;
  if (category === "生活") return Leaf;
  if (category === "成长") return FileText;
  return PenLine;
}

function toneFor(category: PostCategory, index: number) {
  if (category === "技术") return "bg-[#E8EFFB]";
  if (category === "美食专栏") return "bg-[#FFF0DD]";
  if (category === "旅行") return "bg-[#EAF5F8]";
  if (category === "生活") return index % 2 === 0 ? "bg-[#E4F3EB]" : "bg-[#EAF5F8]";
  if (category === "成长") return "bg-[#F8EFD9]";
  return "bg-[#F2E8E5]";
}

function formatDate(value: string | null) {
  if (!value) return "未发布";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(value))
    .replaceAll("/", ".");
}

function toDisplayPosts(items: ApiPost[]) {
  return items.map((post, index) => ({
    ...post,
    icon: iconFor(post.category),
    number: String(index + 1).padStart(2, "0"),
    date: formatDate(post.publishedAt),
    tone: toneFor(post.category, index),
  }));
}

export default function BlogPosts({ initialPosts }: { initialPosts: ApiPost[] }) {
  const prefersReducedMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<Category>("全部");
  const [posts, setPosts] = useState<DisplayPost[]>(() => toDisplayPosts(initialPosts));

  useEffect(() => {
    let mounted = true;

    const refreshPosts = () => {
      void fetch("/api/posts?pageSize=50", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error("文章接口请求失败");
          return (await response.json()) as { items?: ApiPost[] };
        })
        .then((data) => {
          if (mounted && Array.isArray(data.items)) setPosts(toDisplayPosts(data.items));
        })
        .catch(() => {
          // Keep the server-rendered articles visible if a refresh fails.
        });
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshPosts();
    };

    refreshPosts();
    window.addEventListener("focus", refreshPosts);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      mounted = false;
      window.removeEventListener("focus", refreshPosts);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const visiblePosts = useMemo(
    () => activeCategory === "全部" ? posts : posts.filter((post) => post.category === activeCategory),
    [activeCategory, posts],
  );

  return (
    <section id="posts" className="w-full bg-[#F6FDFF] px-6 py-16 md:py-[100px]">
      <div className="mx-auto w-full max-w-[1248px]">
        <div className="mb-12 flex flex-col gap-7 md:mb-[64px] md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#138E5F]/10 bg-[#138E5F]/5 px-3 py-1.5 text-[13px] font-medium text-[#138E5F]">
              <PenLine className="h-3.5 w-3.5" />
              <span>最新文章</span>
            </div>
            <h2 className="max-w-2xl text-[34px] font-semibold leading-[1.2] tracking-tight text-[#042718] sm:text-[44px] md:text-[52px] md:tracking-[-1.8px]">
              写下的文字，
              <span className="italic text-black/40">慢慢长成</span>
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#042718]/70 md:text-[18px]">
              技术、美食、旅行和生活里的小事，都是我想留住的片段；左下角的音乐角，也在替这些瞬间配乐。现在有 {posts.length} 篇公开文章。
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="文章分类">
            {categories.map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138E5F] focus-visible:ring-offset-2 ${active ? "border-[#042718] bg-[#042718] text-white" : "border-[#042718]/15 bg-white/70 text-[#042718]/70 hover:border-[#138E5F]/40 hover:text-[#138E5F]"}`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {visiblePosts.map((post, index) => {
            const Icon = post.icon;
            const coverMedia = post.media?.[0];
            return (
              <motion.article
                key={`${activeCategory}-${post.id}`}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.28, delay: Math.min(index, 4) * 0.035, ease: [0.22, 1, 0.36, 1] }}
                className="group overflow-hidden rounded-[28px] border border-[#042718]/[0.08] bg-white shadow-[0_4px_24px_rgba(4,39,24,0.04)] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(4,39,24,0.09)]"
              >
                <Link
                  href={`/posts/${post.slug}`}
                  aria-label={`阅读文章：${post.title}`}
                  className={`relative flex h-[180px] items-end justify-between overflow-hidden p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#138E5F] ${coverMedia ? "bg-[#042718]" : post.tone}`}
                >
                  {coverMedia ? (
                    <>
                      {coverMedia.type === "image" ? (
                        <Image src={coverMedia.url} alt={coverMedia.alt} fill unoptimized sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <video src={coverMedia.url} muted playsInline preload="metadata" className="h-full w-full object-cover" aria-label={coverMedia.alt} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#042718]/70 via-[#042718]/10 to-transparent" />
                    </>
                  ) : (
                    <>
                      <div className="absolute -right-8 -top-16 h-44 w-44 rounded-full border-[20px] border-white/40" />
                      <div className="absolute right-12 top-12 h-2.5 w-2.5 rounded-full bg-[#138E5F]/60" />
                    </>
                  )}
                  <span className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl ${coverMedia ? "bg-white/85 text-[#063b28]" : "bg-white/75 text-[#138E5F]"}`}>
                    <Icon size={21} />
                  </span>
                  {coverMedia && <span className="absolute right-6 top-5 z-10 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white">{coverMedia.type === "image" ? "照片" : "视频"}</span>}
                  <span className={`relative z-10 font-onest text-[88px] font-semibold leading-none tracking-[-8px] ${coverMedia ? "text-white/30" : "text-[#042718]/10"}`}>{post.number}</span>
                </Link>
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between gap-3 text-[12px] font-medium uppercase tracking-[0.08em] text-[#042718]/45">
                    <span className="text-[#138E5F]">{post.category}</span>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="mt-4 text-[23px] font-semibold leading-tight tracking-[-0.8px] text-[#042718] md:text-[28px]">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="rounded-sm transition-colors hover:text-[#138E5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138E5F] focus-visible:ring-offset-2"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-3 min-h-[48px] text-[15px] leading-7 text-[#042718]/65">{post.excerpt}</p>
                  <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#042718]/[0.08] pt-4 text-[13px] text-[#042718]/50">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{post.readTime} 分钟阅读</span>
                      <span className="inline-flex items-center gap-1.5"><Eye size={14} />{post.views} 次浏览</span>
                    </span>
                    <Link href={`/posts/${post.slug}`} className="inline-flex items-center gap-1 font-medium text-[#042718] transition-colors hover:text-[#138E5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138E5F] focus-visible:ring-offset-2">阅读全文 <ArrowUpRight size={15} /></Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {visiblePosts.length === 0 && <div className="mt-6 rounded-3xl border border-dashed border-[#138E5F]/30 bg-white/60 px-6 py-12 text-center text-sm text-[#042718]/60">这个分类暂时还没有文章。</div>}

        <div className="mt-12 flex items-center justify-center gap-2 text-[13px] text-[#042718]/45">
          <CalendarDays size={15} />
          <span>持续记录，持续更新</span>
        </div>
      </div>
    </section>
  );
}
