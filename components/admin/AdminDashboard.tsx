"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, FilePlus2, MapPinned, Music2, RefreshCw } from "lucide-react";
import {
  formatAdminDate,
  responseMessage,
  type AdminPost,
  type AdminNotice,
  type MusicTrack,
} from "./shared";

type JourneySummary = {
  id: string;
  city: string;
  place: string;
  isPublic: boolean;
};

type HomeSummary = {
  label: string;
  isPublic: boolean;
} | null;

type DashboardData = {
  posts: AdminPost[];
  journeys: JourneySummary[];
  music: MusicTrack[];
  home: HomeSummary;
};

async function getJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(await responseMessage(response));
  return (await response.json()) as T;
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    setNotice(null);

    try {
      const results = await Promise.all([
        getJson<{ items: AdminPost[] }>("/api/admin/posts"),
        getJson<{ items: JourneySummary[] }>("/api/admin/journeys"),
        getJson<{ items: MusicTrack[] }>("/api/admin/music"),
        getJson<{ item: HomeSummary }>("/api/admin/journey-home"),
      ]);

      setDashboard({
        posts: results[0].items,
        journeys: results[1].items,
        music: results[2].items,
        home: results[3].item,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "后台数据加载失败",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const publishedCount = useMemo(
    () => dashboard?.posts.filter((post) => post.status === "published").length ?? 0,
    [dashboard],
  );
  const draftCount = (dashboard?.posts.length ?? 0) - publishedCount;
  const publicJourneyCount = useMemo(
    () => dashboard?.journeys.filter((journey) => journey.isPublic).length ?? 0,
    [dashboard],
  );
  const latestPosts = dashboard?.posts.slice(0, 4) ?? [];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-[#dbe8de] bg-white p-5">
          <p className="text-xs font-medium text-[#78907f]">全部文章</p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-[-0.06em] text-[#063b28]">
            {loading ? "…" : dashboard?.posts.length ?? 0}
          </p>
          <p className="mt-2 text-xs text-[#91a89a]">{publishedCount} 篇已发布，{draftCount} 篇草稿</p>
        </div>
        <div className="rounded-3xl border border-[#dbe8de] bg-white p-5">
          <p className="text-xs font-medium text-[#78907f]">旅行足迹</p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-[-0.06em] text-[#138e5f]">
            {loading ? "…" : dashboard?.journeys.length ?? 0}
          </p>
          <p className="mt-2 text-xs text-[#91a89a]">{publicJourneyCount} 条在前台地图公开</p>
        </div>
        <div className="rounded-3xl border border-[#dbe8de] bg-white p-5">
          <p className="text-xs font-medium text-[#78907f]">音乐角</p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-[-0.06em] text-[#c2784e]">
            {loading ? "…" : dashboard?.music.length ?? 0}
          </p>
          <p className="mt-2 text-xs text-[#91a89a]">首曲目可在全站播放器播放</p>
        </div>
        <div className="rounded-3xl border border-[#dbe8de] bg-white p-5">
          <p className="text-xs font-medium text-[#78907f]">家的标点</p>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-[-0.06em] text-[#315844]">
            {loading ? "…" : dashboard?.home ? dashboard.home.label : "未设置"}
          </p>
          <p className="mt-3 text-xs text-[#91a89a]">
            {dashboard?.home ? (dashboard.home.isPublic ? "已显示在前台地图" : "仅后台可见") : "可在旅行地图页设置"}
          </p>
        </div>
      </section>

      {notice && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fff0e9] px-4 py-3 text-sm text-[#a65338]">
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-1 rounded-full border border-[#f2b39a] px-3 py-1.5 text-xs font-semibold hover:bg-white"
          >
            <RefreshCw size={14} />
            重试
          </button>
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
        <div className="overflow-hidden rounded-[2rem] border border-[#dbe8de] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#e5eee6] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#e86f45]">文章工作台</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold tracking-[-0.06em] text-[#063b28]">最近的文章</h2>
            </div>
            <Link
              href="/admin/posts"
              className="inline-flex items-center gap-2 rounded-full border border-[#cfe0d3] px-4 py-2 text-xs font-semibold text-[#547062] transition hover:bg-[#f1f7f2]"
            >
              全部文章
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-[#edf3ee]">
            {loading && (
              <div className="px-5 py-10 text-sm text-[#78907f] sm:px-7">正在读取文章…</div>
            )}
            {!loading && latestPosts.length === 0 && (
              <div className="px-5 py-10 text-sm leading-6 text-[#78907f] sm:px-7">
                还没有文章。先写一篇，让这座博客有第一段新的记忆。
              </div>
            )}
            {latestPosts.map((post) => (
              <Link
                key={post.id}
                href={"/admin/posts/" + encodeURIComponent(post.id)}
                className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#f8fbf8] sm:px-7"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#315844]">{post.title}</span>
                  <span className="mt-1 flex flex-wrap gap-2 text-xs text-[#91a89a]">
                    <span className={post.status === "published" ? "text-[#4f8b5e]" : "text-[#c2784e]"}>
                      {post.status === "published" ? "已发布" : "草稿"}
                    </span>
                    <span>·</span>
                    <span>{formatAdminDate(post.updatedAt)}</span>
                  </span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-[#91a89a] transition group-hover:translate-x-0.5 group-hover:text-[#138e5f]" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#dbe8de] bg-[#063b28] p-5 text-white sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
            <FilePlus2 size={20} />
          </span>
          <p className="mt-7 text-[11px] font-semibold tracking-[0.18em] text-white/60">开始写作</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.06em]">新写一篇文章</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            编辑器现在是独立页面，带照片和 Vlog 的长文也能专心写完。
          </p>
          <Link
            href="/admin/posts/new"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e86f45] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f1805b]"
          >
            开始写作
            <ArrowRight size={16} />
          </Link>
          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-xs text-white/65 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            <Link href="/admin/travel" className="rounded-2xl bg-white/10 px-3 py-3 transition hover:bg-white/15">
              <MapPinned size={15} className="mb-2 text-[#bfe6c7]" />
              记录旅行
            </Link>
            <Link href="/admin/music" className="rounded-2xl bg-white/10 px-3 py-3 transition hover:bg-white/15">
              <Music2 size={15} className="mb-2 text-[#ffd2bd]" />
              管理歌单
            </Link>
            <Link href="/admin/resume" className="rounded-2xl bg-white/10 px-3 py-3 transition hover:bg-white/15">
              <BadgeCheck size={15} className="mb-2 text-[#bdeeff]" />
              编辑简历
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
