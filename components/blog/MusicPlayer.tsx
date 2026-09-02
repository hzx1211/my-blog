"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ListMusic, Music2, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
  createdAt: string;
};

type MusicPlayerProps = {
  mobileVisible: boolean;
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${Math.floor(value / 60)}:${seconds}`;
}

export default function MusicPlayer({ mobileVisible }: MusicPlayerProps) {
  const prefersReducedMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLElement>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [docked, setDocked] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [mapRetracted, setMapRetracted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const shouldReduceMotion = hasMounted && Boolean(prefersReducedMotion);

  const activeTrack = tracks.find((track) => track.id === activeId) ?? null;
  const activeTrackId = activeTrack?.id ?? null;
  const activeIndex = activeTrack ? tracks.findIndex((track) => track.id === activeTrack.id) : -1;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const playerElement = playerRef.current;
    if (!playerElement) return;

    const root = document.documentElement;
    const updateWidgetHeight = () => {
      const mobileHidden = !mobileVisible && window.innerWidth < 1024;
      const height = mobileHidden ? 72 : playerElement.offsetHeight;
      root.style.setProperty("--blog-music-widget-height", `${height}px`);
    };

    updateWidgetHeight();
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateWidgetHeight);
    resizeObserver?.observe(playerElement);

    return () => {
      resizeObserver?.disconnect();
      root.style.removeProperty("--blog-music-widget-height");
    };
  }, [hasMounted, mobileVisible]);

  useEffect(() => {
    if (!hasMounted) return;

    let animationFrame: number | null = null;
    let observedMap: HTMLElement | null = null;
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => scheduleUpdate());

    const updateMapAvoidance = () => {
      const mapElement = document.querySelector<HTMLElement>("[data-cybercat-map]");
      const playerElement = playerRef.current;

      if (mapElement !== observedMap) {
        if (observedMap) resizeObserver?.unobserve(observedMap);
        observedMap = mapElement;
        if (mapElement) resizeObserver?.observe(mapElement);
      }

      if (!mapElement || !playerElement) {
        setMapRetracted((current) => (current ? false : current));
        return;
      }

      const mapBounds = mapElement.getBoundingClientRect();
      const desktop = window.innerWidth >= 1024;
      const baseLeft = desktop ? 28 : 12;
      const baseBottom = desktop ? 24 : 16;
      const playerWidth = playerElement.offsetWidth;
      const playerHeight = playerElement.offsetHeight;
      const playerRight = baseLeft + playerWidth;
      const playerBottom = window.innerHeight - baseBottom;
      const playerTop = playerBottom - playerHeight;
      const overlapsPlayer =
        mapBounds.right > baseLeft &&
        mapBounds.left < playerRight &&
        mapBounds.bottom > playerTop &&
        mapBounds.top < playerBottom;

      setMapRetracted((current) => (current === overlapsPlayer ? current : overlapsPlayer));
    };

    function scheduleUpdate() {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        updateMapAvoidance();
      });
    }

    if (playerRef.current) resizeObserver?.observe(playerRef.current);
    const mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [hasMounted]);

  useEffect(() => {
    if (!mapRetracted) return;

    setExpanded(false);
    const focusedElement = document.activeElement;
    if (focusedElement instanceof HTMLElement && playerRef.current?.contains(focusedElement)) {
      focusedElement.blur();
    }
  }, [mapRetracted]);

  const loadTracks = useCallback(async () => {
    try {
      const response = await fetch("/api/music", { cache: "no-store" });
      if (!response.ok) throw new Error("music request failed");
      const data = (await response.json()) as { items?: MusicTrack[] };
      const nextTracks = Array.isArray(data.items) ? data.items : [];

      setTracks(nextTracks);
      setActiveId((currentId) => {
        if (currentId && nextTracks.some((track) => track.id === currentId)) return currentId;
        return nextTracks[0]?.id ?? null;
      });
    } catch {
      setTracks([]);
      setActiveId(null);
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    void loadTracks();
    const refresh = () => void loadTracks();
    window.addEventListener("music-library-changed", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("music-library-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadTracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(0);
    setDuration(0);

    if (!activeTrackId) {
      audio.pause();
      setPlaying(false);
      return;
    }

    if (playing) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [activeTrackId, playing]);

  function togglePlayback() {
    if (!activeTrack) return;

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    setPlaying(true);
    void audioRef.current?.play().catch(() => setPlaying(false));
  }

  function selectTrack(trackId: string) {
    if (trackId === activeId) {
      togglePlayback();
      return;
    }

    setActiveId(trackId);
    setPlaying(true);
  }

  function changeTrack(offset: number) {
    if (!tracks.length) return;
    const currentIndex = activeIndex >= 0 ? activeIndex : 0;
    const nextIndex = (currentIndex + offset + tracks.length) % tracks.length;
    setActiveId(tracks[nextIndex].id);
    setPlaying(true);
  }

  function handleEnded() {
    if (tracks.length <= 1) {
      setPlaying(false);
      return;
    }

    changeTrack(1);
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function dockPlayer() {
    setExpanded(false);
    setDocked(true);
  }

  const progressMax = Number.isFinite(duration) && duration > 0 ? duration : 0;

  return (
    <motion.aside
      ref={playerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, x: mapRetracted ? "-112%" : "0%", y: 0 }}
      transition={shouldReduceMotion
        ? { duration: 0 }
        : {
            x: { duration: 1.05, ease: [0.4, 0, 0.2, 1] },
            opacity: { delay: 0.3, duration: 0.35 },
            y: { delay: 0.3, duration: 0.35 },
      }}
      data-music-player="true"
      data-mobile-widget="true"
      data-mobile-visible={mobileVisible ? "true" : "false"}
      data-music-expanded={expanded ? "true" : "false"}
      className="pointer-events-none fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 z-[110] w-[min(20.5rem,calc(100vw-1.5rem))] lg:bottom-6 lg:left-7"
      style={{ willChange: "transform, opacity" }}
      aria-label="博客音乐角"
      aria-hidden={mapRetracted ? true : undefined}
    >
      <div
        className={`${mapRetracted ? "pointer-events-none" : "pointer-events-auto"} overflow-hidden rounded-[24px] border border-[#d9ebe0] bg-white/95 shadow-[0_15px_42px_rgba(4,39,24,0.14)] backdrop-blur transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none`}
        style={{ transform: docked ? "translateX(calc(-100% + 3.75rem))" : "translateX(0)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e4f3eb] text-[#138e5f]">
            <Music2 size={19} />
          </span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#138e5f] focus-visible:ring-offset-2"
            aria-expanded={expanded}
            aria-controls="blog-music-playlist"
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#138e5f]">博客音乐角</span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-[#063b28]">
              {activeTrack ? activeTrack.title : "音乐正在准备中"}
            </span>
            <span className="block truncate text-xs text-[#668274]">
              {activeTrack ? activeTrack.artist : "稍后再来听听吧"}
            </span>
          </button>
          <button
            type="button"
            onClick={togglePlayback}
            disabled={!activeTrack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#063b28] text-white transition hover:bg-[#138e5f] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={playing ? "暂停音乐" : "播放音乐"}
          >
            {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#668274] transition hover:bg-[#eef7ef] hover:text-[#138e5f]"
            aria-label={expanded ? "收起歌单" : "展开歌单"}
          >
            {expanded ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
          </button>
          <button
            type="button"
            onClick={() => docked ? setDocked(false) : dockPlayer()}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138e5f] focus-visible:ring-offset-2 ${docked ? "bg-[#063b28] text-white shadow-[0_6px_18px_rgba(4,39,24,0.2)] hover:bg-[#138e5f]" : "text-[#668274] hover:bg-[#eef7ef] hover:text-[#138e5f]"}`}
            aria-label={docked ? "展开音乐角" : "向左收起音乐角"}
            title={docked ? "展开音乐角" : "向左收起"}
          >
            {docked ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id="blog-music-playlist"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[#e7f0e9]"
            >
              {activeTrack ? (
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-[#668274]">
                    <Volume2 size={14} className="text-[#138e5f]" />
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={progressMax}
                    step="0.1"
                    value={Math.min(currentTime, progressMax)}
                    onChange={(event) => seek(Number(event.target.value))}
                    className="mt-2 h-1.5 w-full cursor-pointer accent-[#138e5f]"
                    aria-label="音乐进度"
                  />
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button type="button" onClick={() => changeTrack(-1)} disabled={tracks.length < 2} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9ebe0] text-[#315844] transition hover:border-[#138e5f] hover:text-[#138e5f] disabled:cursor-not-allowed disabled:opacity-35" aria-label="上一首"><SkipBack size={16} fill="currentColor" /></button>
                    <button type="button" onClick={togglePlayback} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e86f45] text-white transition hover:bg-[#d96138]" aria-label={playing ? "暂停音乐" : "播放音乐"}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
                    <button type="button" onClick={() => changeTrack(1)} disabled={tracks.length < 2} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9ebe0] text-[#315844] transition hover:border-[#138e5f] hover:text-[#138e5f] disabled:cursor-not-allowed disabled:opacity-35" aria-label="下一首"><SkipForward size={16} fill="currentColor" /></button>
                  </div>
                  <div className="mt-4 max-h-40 space-y-1 overflow-y-auto pr-1">
                    {tracks.map((track) => {
                      const active = track.id === activeId;
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => selectTrack(track.id)}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition ${active ? "bg-[#e4f3eb] text-[#063b28]" : "text-[#668274] hover:bg-[#f4faf5]"}`}
                          aria-pressed={active}
                        >
                          <ListMusic size={14} className={active ? "text-[#138e5f]" : "text-[#91a89a]"} />
                          <span className="min-w-0 flex-1 truncate text-xs font-semibold">{track.title}</span>
                          <span className="max-w-[7rem] truncate text-[11px]">{track.artist}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-5 text-xs leading-5 text-[#668274]">音乐角正在准备新的曲目，稍后再来听听吧。</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <audio
        ref={audioRef}
        src={activeTrack?.url}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
        onError={() => setPlaying(false)}
      />
    </motion.aside>
  );
}
