import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import PostViewCounter from "@/components/blog/PostViewCounter";
import { getPostBySlug } from "@/lib/server/posts";

export const dynamic = "force-dynamic";

type PostPageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug, true);

  return {
    title: post ? `${post.title} · 黄志雄的数字花园` : "文章不存在 · 黄志雄的数字花园",
    description: post?.excerpt,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(params.slug, true);

  if (!post) {
    notFound();
  }

  const media = post.media ?? [];

  return (
    <main className="min-h-screen bg-[#f8fbf8] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#547062] transition-colors hover:text-[#e86f45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e86f45] focus-visible:ring-offset-4"
        >
          <ArrowLeft size={16} />
          返回首页
        </Link>

        <article className="mt-12">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#78907f]">
            <span className="text-[#e86f45]">{post.category}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{post.publishedAt?.slice(0, 10).replaceAll("-", ".")}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{post.readTime} 分钟阅读</span>
            <PostViewCounter slug={post.slug} initialViews={post.views} />
          </div>
          <h1 className="mt-6 font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.075em] text-[#063b28] sm:text-7xl">{post.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#668274]">{post.excerpt}</p>

          {media.length > 0 && (
            <section className="mt-10" aria-label="文章照片与 Vlog">
              <p className="mb-4 text-[11px] font-semibold tracking-[0.2em] text-[#e86f45]">影像记录</p>
              <div className={`grid gap-4 ${media.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
                {media.map((item, index) => (
                  <figure key={`${item.url}-${index}`} className="overflow-hidden rounded-3xl border border-[#dbe8de] bg-white shadow-[0_6px_24px_rgba(6,59,40,0.06)]">
                    <div className="relative aspect-[4/3] bg-[#e8f2e9]">
                      {item.type === "image" ? (
                        <Image src={item.url} alt={item.alt} fill unoptimized sizes={media.length === 1 ? "(min-width: 768px) 768px, 100vw" : "(min-width: 768px) 384px, 100vw"} className="object-cover" priority={index === 0} />
                      ) : (
                        <video src={item.url} controls playsInline preload="metadata" className="h-full w-full object-cover" aria-label={item.alt} />
                      )}
                    </div>
                    {item.caption && <figcaption className="px-4 py-3 text-sm leading-6 text-[#668274]">{item.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 border-t border-[#dbe8de] pt-10">
            {post.content.split(/\n\s*\n/).map((paragraph) => (
              <p key={paragraph} className="mb-7 whitespace-pre-line text-base leading-8 text-[#315844] last:mb-0 sm:text-lg sm:leading-9">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-[#dbe8de] pt-6">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#e8f2e9] px-3 py-1.5 text-xs font-medium text-[#547062]">#{tag}</span>
            ))}
            <Link href="/admin" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#547062] hover:text-[#e86f45]">
              管理文章
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
