"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, FilePlus2, Pencil, RefreshCw } from "lucide-react";
import {
  formatAdminDate,
  responseMessage,
  type AdminNotice,
  type AdminPost,
} from "./shared";

export default function ArticleList() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/posts", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const data = (await response.json()) as { items: AdminPost[] };
      setPosts(data.items);
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "文章加载失败",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const publishedCount = useMemo(
    () => posts.filter((post) => post.status === "published").length,
    [posts],
  );
  const draftCount = posts.length - publishedCount;

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-[#dbe8de] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#668274]">
          <span><strong className="font-heading text-2xl text-[#063b28]">{loading ? "…" : posts.length}</strong> 篇全部文章</span>
          <span><strong className="font-heading text-2xl text-[#4f8b5e]">{loading ? "…" : publishedCount}</strong> 已发布</span>
          <span><strong className="font-heading text-2xl text-[#c2784e]">{loading ? "…" : draftCount}</strong> 草稿</span>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e86f45] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f1805b]"
        >
          <FilePlus2 size={16} />
          新建文章
        </Link>
      </section>

      {notice && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fff0e9] px-4 py-3 text-sm text-[#a65338]">
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => void loadPosts()}
            className="inline-flex items-center gap-1 rounded-full border border-[#f2b39a] px-3 py-1.5 text-xs font-semibold hover:bg-white"
          >
            <RefreshCw size={14} />
            重试
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#dbe8de] bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[#e5eee6] px-5 py-4 text-xs font-semibold text-[#78907f] sm:px-7">
          <span>文章</span>
          <span>打开编辑页</span>
        </div>

        {loading && <p className="px-5 py-12 text-sm text-[#78907f] sm:px-7">正在读取文章…</p>}

        {!loading && posts.length === 0 && (
          <div className="px-5 py-12 sm:px-7">
            <p className="text-lg font-semibold text-[#315844]">还没有文章</p>
            <p className="mt-2 text-sm leading-6 text-[#78907f]">新建文章后，会在这里独立打开编辑页。</p>
          </div>
        )}

        <div className="divide-y divide-[#edf3ee]">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={"/admin/posts/" + encodeURIComponent(post.id)}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 transition hover:bg-[#f8fbf8] sm:px-7"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="line-clamp-2 text-base font-semibold leading-6 text-[#315844]">{post.title}</span>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                      (post.status === "published"
                        ? "bg-[#e2f2e3] text-[#4f8b5e]"
                        : "bg-[#fff0e9] text-[#c2784e]")
                    }
                  >
                    {post.status === "published" ? "已发布" : "草稿"}
                  </span>
                </span>
                <span className="mt-2 line-clamp-1 block text-sm text-[#78907f]">{post.excerpt}</span>
                <span className="mt-2 block text-xs text-[#91a89a]">
                  {post.category} · {formatAdminDate(post.updatedAt)}
                </span>
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cfe0d3] text-[#668274] transition group-hover:border-[#8fbe99] group-hover:bg-[#e8f2e9] group-hover:text-[#138e5f]">
                <Pencil size={16} />
                <span className="sr-only">编辑 {post.title}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {!loading && posts.length > 0 && (
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-full border border-[#cfe0d3] bg-white px-5 py-3 text-sm font-semibold text-[#547062] transition hover:bg-[#f8fbf8] hover:text-[#138e5f]"
        >
          再写一篇
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
