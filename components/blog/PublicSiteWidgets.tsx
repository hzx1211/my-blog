"use client";

import { Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CyberCat from "./CyberCat";
import MusicPlayer from "./MusicPlayer";

export default function PublicSiteWidgets() {
  const pathname = usePathname();
  const [mobileCatOpen, setMobileCatOpen] = useState(false);

  if (pathname.startsWith("/admin") || pathname.startsWith("/resume")) {
    return null;
  }

  return (
    <>
      <MusicPlayer />
      <CyberCat mobileVisible={mobileCatOpen} />
      <button
        type="button"
        onClick={() => setMobileCatOpen((open) => !open)}
        className={
          "mobile-widgets-toggle fixed z-[140] flex h-12 w-12 items-center justify-center rounded-full text-teal-50 transition hover:-translate-y-0.5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:hidden " +
          (mobileCatOpen
            ? "bottom-[calc(var(--blog-music-widget-height,72px)+0.75rem+env(safe-area-inset-bottom))] right-[10.5rem]"
            : "bottom-[calc(var(--blog-music-widget-height,72px)+0.75rem+env(safe-area-inset-bottom))] right-3")
        }
        aria-label={mobileCatOpen ? "收起像素猫" : "打开像素猫"}
        aria-expanded={mobileCatOpen}
      >
        {mobileCatOpen ? <X size={20} /> : <Sparkles size={19} />}
      </button>
    </>
  );
}
