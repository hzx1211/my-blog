"use client";

import { Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CyberCat from "./CyberCat";
import MusicPlayer from "./MusicPlayer";

export default function PublicSiteWidgets() {
  const pathname = usePathname();
  const [mobileWidgetsOpen, setMobileWidgetsOpen] = useState(false);

  if (pathname.startsWith("/admin") || pathname.startsWith("/resume")) {
    return null;
  }

  return (
    <>
      <MusicPlayer mobileVisible={mobileWidgetsOpen} />
      <CyberCat mobileVisible={mobileWidgetsOpen} />
      <button
        type="button"
        onClick={() => setMobileWidgetsOpen((open) => !open)}
        className="mobile-widgets-toggle fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-3 z-[140] flex h-12 w-12 items-center justify-center rounded-full text-teal-50 transition hover:-translate-y-0.5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:hidden"
        aria-label={mobileWidgetsOpen ? "收起音乐角和像素猫" : "打开音乐角和像素猫"}
        aria-expanded={mobileWidgetsOpen}
      >
        {mobileWidgetsOpen ? <X size={20} /> : <Sparkles size={19} />}
      </button>
    </>
  );
}
