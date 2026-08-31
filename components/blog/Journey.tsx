"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, MapPin, MapPinned, Train } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicHomeLocation, PublicJourneyMemory } from "./JourneyMap";

const JourneyMap = dynamic(() => import("./JourneyMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-[#e8f2e9] text-sm text-[#668274]">正在加载真实地图…</div>,
});

function formatDate(value: string | null) {
  if (!value) return "日期未记录";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export default function Journey({ className }: { className?: string }) {
  const [memories, setMemories] = useState<PublicJourneyMemory[]>([]);
  const [home, setHome] = useState<PublicHomeLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch("/api/journeys", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("journey request failed");
        return (await response.json()) as { items?: PublicJourneyMemory[]; home?: PublicHomeLocation | null };
      })
      .then((data) => {
        if (mounted) {
          setMemories(Array.isArray(data.items) ? data.items : []);
          setHome(data.home ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setMemories([]);
          setHome(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const cityCount = useMemo(() => new Set(memories.map((memory) => memory.city)).size, [memories]);
  const datedMemory = memories.find((memory) => memory.visitedAt) ?? null;

  return (
    <section id="journey" className={`relative flex w-full justify-center overflow-hidden bg-[#F6FDFF] py-16 md:py-[100px] ${className || ""}`}>
      <div className="w-full max-w-[1440px] px-6 lg:px-[96px]">
        <div className="mx-auto w-full max-w-[1248px]">
          <div className="mb-12 flex flex-col items-center text-center md:mb-[72px]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#138E5F]/10 bg-[#138E5F]/5 px-3 py-1"
            >
              <Train className="h-4 w-4 text-[#138E5F]" />
              <span className="font-sans text-[14px] font-medium text-[#138E5F]">真实旅行足迹</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="mb-6 max-w-2xl text-center text-[32px] font-semibold leading-[1.2] tracking-tight text-[#042718] sm:text-[40px] md:text-[52px] md:leading-[58px] md:tracking-[-1.8px]"
            >
              {home ? (
                <>从 <span className="italic text-black/40">{home.label} · {home.city}</span> 出发</>
              ) : cityCount > 0 ? (
                <>在 <span className="italic text-black/40">{cityCount} 座城市</span> 留下记忆</>
              ) : (
                <>下一站，从 <span className="italic text-black/40">真实记忆</span> 开始</>
              )}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="max-w-[650px] text-center font-sans text-[15px] font-normal leading-[1.6] text-[#042718] opacity-80 md:text-[18px] md:leading-[28px]"
            >
              地图上的家的标点与每一枚旅行标记，都收藏着我生活或到访过的地方。可以缩放、拖动地图，慢慢查看这些记忆。
            </motion.p>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-[#042718]/10 bg-white shadow-[0_8px_40px_rgba(4,39,24,0.06)]">
            <div data-cybercat-map className="relative h-[420px] w-full md:h-[520px]">
              {loading ? (
                <div className="flex h-full items-center justify-center bg-[#e8f2e9] text-sm text-[#668274]">正在读取旅行记忆…</div>
              ) : memories.length > 0 || home ? (
                <JourneyMap memories={memories} home={home} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_32%,#e5f4e9,transparent_42%),linear-gradient(135deg,#f8fcf8,#edf7f1)] px-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white text-[#138E5F] shadow-[0_8px_24px_rgba(19,142,95,0.12)]"><MapPinned size={28} /></span>
                  <h3 className="mt-5 text-xl font-semibold text-[#042718]">旅行记忆正在整理中</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#668274]">新的城市、照片和沿途故事，会在准备好后慢慢出现在这里。</p>
                </div>
              )}
            </div>
            {(memories.length > 0 || home) && <p className="border-t border-[#e5eee6] px-5 py-3 text-center text-xs text-[#668274]">地图数据 © OpenStreetMap contributors。缩放、拖动地图可查看每一处真实打卡。</p>}
          </div>

          {!loading && memories.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {memories.map((memory, index) => (
                <motion.article
                  key={memory.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className="overflow-hidden rounded-[24px] border border-[#042718]/10 bg-white"
                >
                  {memory.coverUrl ? (
                    <div className="relative h-36 overflow-hidden bg-[#e8f2e9]">
                      <Image src={memory.coverUrl} alt={`${memory.city}${memory.place ? ` ${memory.place}` : ""}旅行照片`} fill unoptimized sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-20 items-center justify-between bg-[#e8f2e9] px-5 text-[#138E5F]">
                      <MapPin size={22} />
                      <span className="text-[11px] font-semibold tracking-[0.14em]">真实坐标</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-[#042718]">{memory.city}{memory.place ? ` · ${memory.place}` : ""}</h3>
                      <span className="shrink-0 text-xs text-[#668274]">{formatDate(memory.visitedAt)}</span>
                    </div>
                    {memory.note && <p className="mt-3 text-sm leading-6 text-[#547062]">{memory.note}</p>}
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          <div className="mt-12 flex flex-col items-center gap-6 md:mt-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex flex-wrap justify-center gap-x-8 gap-y-4 rounded-[24px] border border-[#138E5F]/15 bg-white/70 px-7 py-4 shadow-[0_4px_24px_rgba(19,142,95,0.03)] md:gap-x-10"
            >
              {[
                { value: String(cityCount), label: "座城市" },
                { value: String(memories.length), label: "真实打卡" },
                { value: home ? `${home.label} · ${home.city}` : datedMemory ? formatDate(datedMemory.visitedAt) : "—", label: home ? "特殊标点" : "最近记录" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-onest text-[24px] font-semibold leading-none text-[#138E5F] md:text-[30px]">{stat.value}</p>
                  <p className="mt-1 text-[13px] text-[#042718]/60 md:text-[14px]">{stat.label}</p>
                </div>
              ))}
            </motion.div>
            {!loading && memories.length === 0 && <p className="inline-flex items-center gap-2 text-xs text-[#668274]"><Camera size={14} />新的旅行记忆会继续在这里更新。</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
