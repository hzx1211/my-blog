"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  FilePenLine,
  FileText,
  House,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Music2,
} from "lucide-react";

type NavigationItem = {
  href: string;
  label: string;
  detail: string;
  icon: typeof LayoutDashboard;
};

const navigationItems: NavigationItem[] = [
  { href: "/admin", label: "概览", detail: "后台首页", icon: LayoutDashboard },
  { href: "/admin/posts", label: "文章管理", detail: "新建与编辑", icon: FileText },
  { href: "/admin/travel", label: "旅行地图", detail: "足迹与家的标点", icon: MapPinned },
  { href: "/admin/music", label: "音乐角", detail: "全站播放器歌单", icon: Music2 },
  { href: "/admin/resume", label: "个人简历", detail: "资料、技能与经历", icon: BadgeCheck },
];

type AdminShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminShell({ eyebrow, title, description, children }: AdminShellProps) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.assign("/admin");
    }
  }

  return (
    <main className="min-h-screen bg-[#f1f7f2] px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-[#dbe8de] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#063b28] text-white">
              <FilePenLine size={20} />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#e86f45]">内容工作台</p>
              <p className="mt-1 font-heading text-2xl font-semibold tracking-[-0.06em] text-[#063b28]">黄志雄的后台</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#cfe0d3] bg-white px-4 py-2.5 text-sm font-semibold text-[#547062] transition hover:border-[#91b59b] hover:text-[#e86f45]"
            >
              <ArrowLeft size={15} />
              查看博客
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-full bg-[#063b28] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b5136] disabled:cursor-wait disabled:opacity-60"
            >
              <LogOut size={15} />
              {loggingOut ? "退出中…" : "退出登录"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 py-6 lg:grid-cols-[226px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-6">
            <nav
              aria-label="后台导航"
              className="flex gap-2 overflow-x-auto rounded-[1.75rem] border border-[#dbe8de] bg-white p-2 lg:flex-col lg:overflow-visible"
            >
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      "group flex min-w-[158px] items-center gap-3 rounded-2xl px-3 py-3 transition-colors lg:min-w-0 " +
                      (active
                        ? "bg-[#063b28] text-white"
                        : "text-[#547062] hover:bg-[#eef7ef] hover:text-[#063b28]")
                    }
                  >
                    <span
                      className={
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
                        (active ? "bg-white/15 text-white" : "bg-[#e8f2e9] text-[#138e5f]")
                      }
                    >
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className={"mt-0.5 block truncate text-[11px] " + (active ? "text-white/70" : "text-[#91a89a]")}>
                        {item.detail}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 hidden rounded-[1.5rem] border border-[#d5e7d8] bg-[#e8f2e9] p-4 text-xs leading-5 text-[#547062] lg:block">
              <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#138e5f]">
                <House size={15} />
              </span>
              内容各自归位，打开对应入口即可开始编辑。
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 rounded-[2rem] border border-[#dbe8de] bg-white px-5 py-5 sm:px-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e86f45]">{eyebrow}</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.07em] text-[#063b28] sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#668274]">{description}</p>
            </div>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
