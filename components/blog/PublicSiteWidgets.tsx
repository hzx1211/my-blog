"use client";

import { usePathname } from "next/navigation";
import CyberCat from "./CyberCat";
import MusicPlayer from "./MusicPlayer";

export default function PublicSiteWidgets() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/resume")) {
    return null;
  }

  return (
    <>
      <MusicPlayer />
      <CyberCat />
    </>
  );
}
