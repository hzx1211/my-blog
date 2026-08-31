"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, BookOpen, FilePenLine, LockKeyhole, ShieldCheck } from "lucide-react";
import { responseMessage, type AdminNotice } from "./shared";

type SessionState = "checking" | "authenticated" | "unauthenticated";

const HERO_VIDEO = "https://cdn.jiro.build/Amox/All%20Images/P01-Header-01-BG.mp4";

export default function AdminGate({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        const data = (await response.json()) as { authenticated?: boolean; configured?: boolean };

        if (cancelled) return;
        setConfigured(Boolean(data.configured));
        setSessionState(data.authenticated ? "authenticated" : "unauthenticated");
      } catch {
        if (cancelled) return;
        setSessionState("unauthenticated");
        setNotice({ type: "error", text: "后台暂时无法连接，请稍后重试" });
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) throw new Error(await responseMessage(response));

      setPassword("");
      setSessionState("authenticated");
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "登录失败",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#c5dde3] px-5 text-[#202324]">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.32, ease: "easeOut" }}
          className="flex items-center gap-3 border-y border-white/70 bg-white/15 px-5 py-3 text-sm font-medium backdrop-blur-md"
        >
          <BookOpen size={17} />
          正在打开编辑室…
        </motion.div>
      </main>
    );
  }

  if (sessionState === "authenticated") {
    return <>{children}</>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#c5dde3] text-[#202324]">
      <video autoPlay loop muted playsInline aria-hidden="true" className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-[58%_center]">
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/15 to-black/[0.06]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-7 lg:px-10">
        <motion.header
          initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.42, ease: "easeOut" }}
          className="flex items-center justify-between border-b border-white/55 py-6"
        >
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#202324] text-white">
              <BookOpen size={18} />
            </span>
            <span>
              <strong className="block font-onest text-base font-semibold leading-none sm:text-lg">黄志雄的博客</strong>
              <span className="mt-1 hidden text-[10px] font-medium tracking-[0.18em] text-black/50 sm:block">内容管理中心</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/65 bg-white/20 px-4 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">回到前台</span>
          </Link>
        </motion.header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-16 lg:py-14">
          <motion.section
            initial={prefersReducedMotion ? false : { opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.55, delay: 0.08, ease: "easeOut" }}
            className="max-w-[660px]"
          >
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/55">
              <span className="h-px w-10 bg-current" />
              私人内容空间 · 01
            </div>
            <h1 className="mt-7 font-onest text-[48px] font-semibold leading-[0.98] tracking-[-2.8px] sm:text-[62px] sm:tracking-[-3.6px] lg:text-[78px] lg:tracking-[-4.5px]">
              回到一张
              <br />
              <span className="font-playfair italic font-semibold text-black/45">没有写完的纸。</span>
            </h1>
            <p className="mt-7 max-w-[560px] text-base leading-8 text-black/65 sm:text-lg">
              这里不负责展示，只负责把散落的灵感整理好。文章、旅行、音乐和简历，都从这一页继续生长。
            </p>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-y border-white/55 py-4 text-xs font-semibold tracking-[0.12em] text-black/55 sm:text-sm">
              <span>01 · 写文章</span>
              <span>02 · 记足迹</span>
              <span>03 · 排歌单</span>
              <span>04 · 改简历</span>
            </div>
          </motion.section>

          <motion.section
            initial={prefersReducedMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.14, ease: "easeOut" }}
            className="border-t border-white/70 bg-white/[0.16] px-1 py-8 backdrop-blur-md sm:px-8 lg:border-l lg:border-t-0 lg:px-10 lg:py-10"
          >
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">
              <span>编辑权限</span>
              <span>仅限本人</span>
            </div>

            <span className="mt-9 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/35">
              <FilePenLine size={19} />
            </span>
            <h2 className="mt-5 font-onest text-4xl font-semibold tracking-[-2px]">进入编辑室</h2>
            <p className="mt-3 text-sm leading-7 text-black/60">输入管理员密码，继续处理尚未完成的内容。</p>

            {!configured && (
              <div className="mt-6 border-l-2 border-[#b85c48] bg-[#fff4ef]/80 px-4 py-3 text-sm leading-6 text-[#8f4435]">
                后台尚未完成安全配置，请联系站点维护者后再登录。
              </div>
            )}

            <form className="mt-8" onSubmit={handleLogin}>
              <label className="text-xs font-semibold tracking-[0.1em]" htmlFor="admin-password">管理员密码</label>
              <div className="relative mt-2">
                <LockKeyhole aria-hidden="true" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/45" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/80 bg-white/50 py-3.5 pl-11 pr-4 text-sm font-medium outline-none backdrop-blur-sm transition focus:border-white focus:bg-white/70 focus:ring-2 focus:ring-white/55 placeholder:text-black/35"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  disabled={!configured || submitting}
                />
              </div>
              <button
                type="submit"
                disabled={!configured || submitting || password.length === 0}
                className="mt-4 inline-flex w-full items-center justify-between rounded-2xl bg-[#202324] px-5 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#373b3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#202324] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span>{submitting ? "登录中…" : "继续进入"}</span>
                <ArrowUpRight size={17} />
              </button>
            </form>

            {notice && (
              <p role="alert" className={"mt-4 border-l-2 pl-3 text-sm leading-6 " + (notice.type === "error" ? "border-[#b85c48] text-[#8f4435]" : "border-[#42657b] text-[#31566e]")}>
                {notice.text}
              </p>
            )}

            <div className="mt-8 flex items-start gap-2 border-t border-white/55 pt-4 text-[11px] leading-5 text-black/45">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              <span>登录信息只用于私人内容管理，请勿向他人分享密码。</span>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
