"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Sparkles, Menu, X, BookOpen } from "lucide-react";

const AVATAR = "/portrait.jpg";

export default function BlogHeader({ className, initialPostCount = 0, avatarUrl = AVATAR }: { className?: string; initialPostCount?: number; avatarUrl?: string }) {
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [isCTAHovered, setIsCTAHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [postCount, setPostCount] = useState(initialPostCount);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const refreshCount = () => {
      fetch("/api/posts?pageSize=1", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error("文章数量请求失败");
          return (await response.json()) as { total?: number };
        })
        .then((data) => {
          if (mounted && typeof data.total === "number") setPostCount(data.total);
        })
        .catch(() => {
          // Keep the server-rendered count when the API is unavailable.
        });
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshCount();
    };

    refreshCount();
    window.addEventListener("focus", refreshCount);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      mounted = false;
      window.removeEventListener("focus", refreshCount);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { label: "首页", href: "#home" },
    { label: "文章", href: "#posts" },
    { label: "足迹", href: "#journey" },
    { label: "关于我", href: "#about" },
    { label: "简历", href: "/resume" },
    { label: "后台", href: "/admin" },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Onest:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,600&family=Noto+Sans+SC:wght@400;500;700&display=swap"
        rel="stylesheet"
        crossOrigin="anonymous"
      />

      <motion.section
        id="home"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" as const }}
        className={"relative w-full overflow-hidden min-h-[800px] lg:min-h-[900px] " + (className || "")}
      >
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          {isMounted && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source
                src="https://cdn.jiro.build/Amox/All%20Images/P01-Header-01-BG.mp4"
                type="video/mp4"
              />
            </video>
          )}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-12">
          {/* Navigation */}
          <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" as const }}
            className="flex items-center justify-between"
          >
            <a href="#home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-[#042718] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-onest text-xl font-semibold text-[#042718]">黄志雄的博客</span>
            </a>

            {/* Desktop Menu */}
            <ul className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={
                      "font-inter text-base leading-6 tracking-[-0.3px] text-[#042718] transition-all " +
                      (item.label === "首页"
                        ? "font-bold opacity-100"
                        : "font-normal opacity-80 hover:opacity-100 hover:font-bold")
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <motion.a
                href="#contact"
                onMouseEnter={() => setIsNavHovered(true)}
                onMouseLeave={() => setIsNavHovered(false)}
                layout
                className={
                  "hidden sm:flex items-center gap-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/40 group cursor-pointer relative h-11 transition-all duration-300 " +
                  (isNavHovered ? "flex-row-reverse pl-1.5 pr-[18px]" : "flex-row pl-[18px] pr-1.5")
                }
              >
                <motion.span
                  layout
                  className="font-inter text-base font-medium leading-6 tracking-[-0.3px] text-[#042718]"
                >
                  联系我
                </motion.span>

                <motion.div
                  layout
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center relative overflow-hidden shrink-0"
                >
                  <motion.div
                    animate={{
                      x: isNavHovered ? [-20, 0] : 0,
                      opacity: isNavHovered ? [0, 1] : 1
                    }}
                    transition={{ duration: 0.3, delay: isNavHovered ? 0.1 : 0 }}
                  >
                    <ArrowUpRight className="w-3 h-3 text-[#042718]" />
                  </motion.div>
                </motion.div>
              </motion.a>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-[#042718] bg-white/20 backdrop-blur-md rounded-full"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </motion.nav>

          {/* Mobile Navigation Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                key="mobile-menu"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring" as const, damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[100] lg:hidden bg-white px-6 py-8 flex flex-col gap-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[#042718] flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-onest text-xl font-semibold text-[#042718]">黄志雄的博客</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-[#042718] bg-[#042718]/5 rounded-full"
                  >
                    <X size={24} />
                  </button>
                </div>

                <ul className="flex flex-col gap-6">
                  {navItems.map((item, idx) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx, ease: "easeOut" as const }}
                    >
                      <a
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="font-inter text-2xl font-semibold text-[#042718]"
                      >
                        {item.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <a
                    href="#contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center w-full py-4 rounded-full bg-[#042718] text-white font-inter font-medium text-lg"
                  >
                    联系我
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero Content */}
          <div className="flex flex-col items-center mt-12 lg:mt-[80px]">
            {/* Greeting Badge */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" as const }}
              className="flex flex-row items-center gap-1.5 sm:gap-2 px-3 sm:px-[14px] py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/40 mb-6 whitespace-nowrap"
            >
              <div className="flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#042718] text-[#042718]" />
                <span className="font-inter text-sm sm:text-base lg:text-[18px] font-medium leading-[28px] text-[#042718]">
                  记录 · 思考 · 分享
                </span>
              </div>
              <span className="font-inter text-sm sm:text-base lg:text-[18px] font-normal leading-[28px] text-[#000000] opacity-60 shrink-0">
                已更新 {postCount} 篇文章
              </span>
            </motion.div>

            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" as const }}
              className="w-[88px] h-[88px] rounded-full overflow-hidden border-4 border-white/70 shadow-xl mb-6"
            >
              <Image src={avatarUrl} alt="黄志雄的头像" width={88} height={88} unoptimized className="h-full w-full object-cover" />
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" as const }}
              className="max-w-[750px] w-full text-center font-onest text-[40px] sm:text-[50px] lg:text-[66px] font-semibold leading-tight lg:leading-[72px] tracking-tight lg:tracking-[-3px] text-[#042718]"
            >
              你好，我是黄志雄，
              <span className="font-playfair italic font-semibold text-[#000000] opacity-50 tracking-normal lg:tracking-[-3.566px]">
                在文字里
              </span>
              记录生活
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" as const }}
              className="max-w-[630px] w-full text-center mt-5 font-inter text-lg lg:text-[20px] font-normal leading-relaxed lg:leading-[30px] tracking-[-0.4px] text-[#042718]"
            >
              一名喜欢写代码、旅行和下厨的计算机专业应届毕业生。这里记录技术实践，也收藏旅途与生活里的小事。
            </motion.p>

            {/* CTA Button */}
            <motion.a
              href="#posts"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: "easeOut" as const }}
              onMouseEnter={() => setIsCTAHovered(true)}
              onMouseLeave={() => setIsCTAHovered(false)}
              layout
              className={
                "flex items-center gap-3 py-2 rounded-full bg-[#042718] mt-8 lg:mt-12 group cursor-pointer relative h-14 border border-white/20 transition-all duration-300 " +
                (isCTAHovered ? "flex-row-reverse pl-2 pr-5" : "flex-row pl-5 pr-2")
              }
            >
              <motion.span
                layout
                className="font-inter text-base lg:text-[18px] font-medium leading-[28px] text-white"
              >
                开始阅读
              </motion.span>

              <motion.div
                layout
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center relative overflow-hidden shrink-0"
              >
                <motion.div
                  animate={{
                    x: isCTAHovered ? [-24, 0] : 0,
                    opacity: isCTAHovered ? [0, 1] : 1
                  }}
                  transition={{ duration: 0.3, delay: isCTAHovered ? 0.1 : 0 }}
                >
                  <ArrowUpRight className="w-4 h-4 text-[#042718]" />
                </motion.div>
              </motion.div>
            </motion.a>

            {/* Bottom Stats Section */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 1, ease: "easeOut" as const }}
              className="mt-20 lg:mt-[200px] flex flex-col items-center gap-10 w-full"
            >
              <div className="px-[16px] py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/20">
                <p className="font-inter text-sm lg:text-base font-medium leading-6 tracking-[-0.3px] text-[#042718] text-center">
                  「把日子过成值得记录的样子」
                </p>
              </div>

              <div className="w-full mt-4 overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)" } as React.CSSProperties}>
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    duration: 25,
                    ease: "linear" as const,
                    repeat: Infinity as number
                  }}
                  className="flex items-center gap-12 sm:gap-16 lg:gap-24 w-fit"
                >
                  {[...Array(2)].map((_: unknown, i: number) => (
                    <React.Fragment key={i}>
            {[`#博客 #${postCount}篇`, "#旅行足迹", "#代码 #开源", "#摄影日常", "#读书", "#美食"].map((tag: string) => (
                        <span key={tag + i} className="font-onest text-lg sm:text-xl lg:text-2xl font-semibold text-[#042718]/30 whitespace-nowrap">
                          {tag}
                        </span>
                      ))}
                    </React.Fragment>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
