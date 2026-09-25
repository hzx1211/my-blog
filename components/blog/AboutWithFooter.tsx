"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Mail, Sparkles, Code2, Train, Camera, UtensilsCrossed } from "lucide-react";

const facts = [
  { icon: Code2, title: "计算机应届生", desc: "关注 Java 后端、机器视觉与 Web 开发，喜欢把想法做成真正可用的项目" },
  { icon: Train, title: "喜欢旅行", desc: "坐火车去不同城市，也认真记录沿途遇见的风景与故事" },
  { icon: Camera, title: "随手拍", desc: "用镜头保存日常、旅行和那些容易错过的光" },
  { icon: UtensilsCrossed, title: "热爱美食", desc: "喜欢下厨，也愿意分享家常菜和旅途中遇见的味道" },
];

export default function AboutWithFooter({ className, avatarUrl = "/portrait.jpg" }: { className?: string; avatarUrl?: string }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* ABOUT SECTION */}
      <section id="about" className={"relative w-full bg-[#F6FDFF] py-16 md:py-[100px] flex justify-center overflow-hidden " + (className || "")}>
        <div className="w-full max-w-[1440px] px-6 lg:px-[96px]">
          <div className="w-full max-w-[1248px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-[80px] items-start">

            {/* Left: intro */}
            <div className="w-full lg:w-[560px] flex flex-col items-start">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E4F3EB] border border-[#138E5F]/10 mb-6"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#138E5F]" />
                <span className="text-[#138E5F] text-[13px] font-sans font-medium uppercase tracking-wider">About me</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[32px] sm:text-[40px] md:text-[52px] font-onest font-semibold text-[#042718] leading-[1.15] md:leading-[58px] tracking-tight md:tracking-[-2px] mb-6"
              >
                关于<span className="italic text-[rgba(4,39,24,0.40)]">黄志雄</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[16px] md:text-[18px] text-[#042718] leading-[1.8] md:leading-[32px] font-sans opacity-80 mb-8"
              >
                我是黄志雄，一名计算机专业应届毕业生。喜欢用代码解决问题，也喜欢坐火车去看不同的城市。
                这个博客是我的数字花园——记录真实的技术实践、旅行、美食和生活。
                如果某篇文章帮到了你，那就是它最大的价值。
              </motion.p>

              {/* Fact cards */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {facts.map((fact, idx) => (
                  <motion.div
                    key={fact.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                    className="flex items-start gap-4 p-5 rounded-[20px] bg-white border border-[#042718]/[0.06] shadow-[0_2px_16px_rgba(4,39,24,0.03)]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#138E5F]/10 flex items-center justify-center shrink-0">
                      <fact.icon className="w-5 h-5 text-[#138E5F]" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="font-onest text-[16px] font-semibold text-[#042718]">{fact.title}</h3>
                      <p className="font-sans text-[14px] leading-[22px] text-[#042718]/60 mt-1">{fact.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: portrait card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full lg:w-[480px] lg:sticky lg:top-[80px]"
            >
              <div className="rounded-[32px] overflow-hidden border border-[#042718]/10 shadow-[0_20px_60px_rgba(4,39,24,0.10)] bg-white">
                <div className="relative h-[420px] overflow-hidden md:h-[520px]">
                  <Image src={avatarUrl} alt="黄志雄的照片" fill unoptimized sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" />
                </div>
                <div className="p-6 md:p-8 flex flex-col gap-2">
                  <h3 className="font-onest text-[22px] font-semibold text-[#042718]">黄志雄</h3>
                  <p className="font-sans text-[15px] text-[#042718]/60">计算机应届生 · 开发者 · 博客作者</p>
                  <div className="flex items-center gap-3 mt-3">
                    <a
                      href="mailto:2294994453@qq.com"
                      className="w-10 h-10 rounded-full bg-[#F4FAFB] border border-[#042718]/10 flex items-center justify-center hover:bg-[#042718] group transition-colors"
                      aria-label="发送邮件给黄志雄"
                    >
                      <Mail className="w-5 h-5 text-[#042718] group-hover:text-white transition-colors" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CTA + FOOTER */}
      <footer id="contact" className="relative w-full overflow-hidden flex flex-col items-center">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="https://cdn.jiro.build/Amox/All%20Images/P01-Header-01-BG.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F6FDFF] via-transparent to-white/80" />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] px-6 lg:px-[96px] pt-[80px] lg:pt-[120px] flex flex-col items-center">

          {/* CTA */}
          <div className="max-w-[1248px] w-full flex flex-col items-center text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-[742px] text-center text-[#042718] font-semibold text-[36px] md:text-[56px] leading-[1.15] md:leading-[68px] tracking-tight md:tracking-[-2.2px] mb-[12px]"
              style={{ fontFamily: "'Onest', 'Noto Sans SC', sans-serif" }}
            >
              有想法，欢迎{" "}
              <span className="italic text-[rgba(0,0,0,0.40)]">来聊聊</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-full max-w-[620px] text-center text-[#042718] font-sans text-lg md:text-[20px] leading-[1.6] opacity-80 mb-[40px]"
            >
              如果你想交流技术、项目或生活里的新发现，可以直接给我发邮件。我会在看到后认真回复。
            </motion.p>

            <motion.a
              href="mailto:2294994453@qq.com"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/70 py-2 pl-5 pr-2 text-[#042718] shadow-[0_4px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-colors hover:bg-white"
            >
              <Mail size={18} />
              <span className="font-sans text-[16px] font-medium">发送邮件</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#042718] text-white transition-transform group-hover:translate-x-0.5">
                <ArrowRight size={16} strokeWidth={2.5} />
              </span>
            </motion.a>
          </div>

          {/* Footer bottom */}
          <div className="w-full max-w-[1248px] mt-[64px] py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#042718] flex items-center justify-center">
                <span className="text-white text-sm font-bold">黄</span>
              </div>
              <span className="font-onest text-lg font-semibold text-[#042718]">黄志雄的博客</span>
            </div>

            <p className="text-[#042718]/60 font-sans text-[14px] text-center">
              © 2026 黄志雄的博客 · 用 Next.js + ❤️ 搭建 · 记录即生活
            </p>

            <div className="flex items-center gap-6 text-[#042718]/70 font-sans text-[14px]">
              <a href="#posts" className="hover:text-[#042718] transition-colors">文章</a>
              <a href="#journey" className="hover:text-[#042718] transition-colors">足迹</a>
              <a href="#about" className="hover:text-[#042718] transition-colors">关于</a>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
