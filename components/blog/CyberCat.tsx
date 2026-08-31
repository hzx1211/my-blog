"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Fish, MessageCircle, RotateCcw, Send } from 'lucide-react';
import styles from './CyberCat.module.css';

type ChatResponse = {
  reply?: string;
  error?: string;
  message?: string;
};

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type CatAction = 'idle' | 'blink' | 'groom' | 'roll' | 'pet' | 'eat' | 'walk' | 'walk-back';
type MapAvoidance = 'none' | 'retract';

const ACTION_DURATIONS: Record<Exclude<CatAction, 'idle'>, number> = {
  blink: 380,
  groom: 3200,
  roll: 2600,
  pet: 1300,
  eat: 3000,
  walk: 1260,
  'walk-back': 1260,
};

const PET_LINES = [
  '呼噜呼噜…这里摸得最舒服啦。',
  '耳朵都被你摸软了喵。',
  '再摸一下也不是不可以。',
  '本喵批准你继续摸头。',
];

export default function CyberCat() {
  const prefersReducedMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);
  const shouldReduceMotion = hasMounted && Boolean(prefersReducedMotion);
  const [speech, setSpeech] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [catAction, setCatAction] = useState<CatAction>('idle');
  const [actionNonce, setActionNonce] = useState(0);
  const [mapAvoidance, setMapAvoidance] = useState<MapAvoidance>('none');
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleCyclesRef = useRef(0);
  const conversationRef = useRef<ConversationMessage[]>([]);
  const previousMapAvoidanceRef = useRef<MapAvoidance>('none');

  const speak = useCallback((text: string, duration = 7000) => {
    if (mapAvoidance !== 'none') return;
    setSpeech(text);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => setSpeech(null), duration);
  }, [mapAvoidance]);

  const runCatAction = useCallback((action: CatAction) => {
    if (action !== 'blink') idleCyclesRef.current = 0;
    setCatAction(action);
    setActionNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    let animationFrame: number | null = null;
    let observedMap: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const updateMapAvoidance = () => {
      const mapElement = document.querySelector<HTMLElement>('[data-cybercat-map]');

      if (mapElement !== observedMap) {
        resizeObserver?.disconnect();
        observedMap = mapElement;
        if (mapElement) resizeObserver?.observe(mapElement);
      }

      if (!mapElement) {
        setMapAvoidance((current) => (current === 'none' ? current : 'none'));
        return;
      }

      const bounds = mapElement.getBoundingClientRect();
      const catZoneTop = window.innerHeight - (window.innerWidth >= 640 ? 250 : 205);
      const catZoneLeft = window.innerWidth - (window.innerWidth >= 640 ? 240 : 190);
      const overlapsCatZone =
        bounds.right > catZoneLeft &&
        bounds.left < window.innerWidth &&
        bounds.bottom > catZoneTop &&
        bounds.top < window.innerHeight;

      const next: MapAvoidance = overlapsCatZone ? 'retract' : 'none';

      setMapAvoidance((current) => (current === next ? current : next));
    };

    const scheduleUpdate = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        updateMapAvoidance();
      });
    };

    resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleUpdate);
    const mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();

    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [hasMounted]);

  useEffect(() => {
    const previous = previousMapAvoidanceRef.current;
    if (previous === mapAvoidance) return;

    previousMapAvoidanceRef.current = mapAvoidance;

    if (mapAvoidance === 'retract') {
      setShowInput(false);
      setSpeech(null);
      runCatAction('walk');
      return;
    }

    if (previous === 'retract') {
      runCatAction('walk-back');
    }
  }, [mapAvoidance, runCatAction]);

  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (catAction === 'idle') return;

    const timer = window.setTimeout(() => setCatAction('idle'), ACTION_DURATIONS[catAction]);
    return () => window.clearTimeout(timer);
  }, [actionNonce, catAction]);

  useEffect(() => {
    if (shouldReduceMotion || catAction !== 'idle' || showInput || isThinking || speech) return;

    const shouldDoAnActivity = idleCyclesRef.current >= 1 || Math.random() > 0.58;
    const nextAction: CatAction = shouldDoAnActivity
      ? (Math.random() > 0.68 ? 'roll' : 'groom')
      : 'blink';
    const delay = shouldDoAnActivity
      ? 9000 + Math.random() * 7000
      : 5000 + Math.random() * 5000;

    const timer = window.setTimeout(() => {
      idleCyclesRef.current = nextAction === 'blink' ? idleCyclesRef.current + 1 : 0;
      runCatAction(nextAction);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [catAction, isThinking, runCatAction, shouldReduceMotion, showInput, speech]);

  const askAssistant = async (message: string, thinkingText: string) => {
    if (isThinking) return;

    const conversation = [...conversationRef.current, { role: 'user' as const, content: message }].slice(-12);
    setShowInput(false);
    setIsThinking(true);
    speak(thinkingText, 12000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversation }),
      });
      const data = (await response.json().catch(() => ({}))) as ChatResponse;

      if (!response.ok) throw new Error(data.error || data.message || `AI 服务错误（${response.status}）`);
      const reply = data.reply?.trim();
      if (!reply) throw new Error('模型没有返回内容');

      conversationRef.current = [...conversation, { role: 'assistant' as const, content: reply }].slice(-12);
      speak(reply, 10000);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '未知错误';
      speak(`本喵暂时答不了：${reason}`, 8000);
    } finally {
      setIsThinking(false);
    }
  };

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = inputValue.trim();
    if (!message || isThinking) return;

    setInputValue('');
    await askAssistant(message, '让本喵认真想想…');
  };

  const handleFeed = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    runCatAction('eat');
    await askAssistant(
      '我刚刚喂了你一条小鱼干。请用可爱但自然的像素猫语气回应我，不超过 60 字。',
      '嗷呜！小鱼干真香，让本喵想想怎么谢你…',
    );
  };

  const handlePetHead = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    runCatAction('pet');
    speak(PET_LINES[Math.floor(Math.random() * PET_LINES.length)], 2800);
  };

  const handlePlay = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const nextAction: CatAction = Math.random() > 0.55 ? 'roll' : 'groom';
    runCatAction(nextAction);
    speak(nextAction === 'roll' ? '看好喔，本喵要翻滚啦！' : '好吧，给你表演一下舔爪子。', 2600);
  };

  const toggleInput = () => {
    if (isThinking || mapAvoidance !== 'none') return;
    setShowInput((open) => {
      if (!open) setSpeech(null);
      return !open;
    });
  };

  const visualAction = catAction === 'idle' && isThinking ? 'thinking' : catAction;
  const isMapRetracted = mapAvoidance === 'retract';

  return (
    <motion.aside
      initial={{ opacity: 0, x: 0, y: 18 }}
      animate={{ opacity: 1, x: isMapRetracted ? 232 : 0, y: 0 }}
      transition={shouldReduceMotion
        ? { duration: 0 }
        : {
            x: { type: 'tween', duration: 1.16, ease: 'easeInOut' },
            opacity: { duration: 0.28, ease: 'easeOut' },
            y: { duration: 0.4, ease: 'easeOut' },
          }}
      className={
        "global-floating-layer fixed bottom-16 right-2 z-[120] flex flex-col items-end sm:bottom-24 sm:right-8 " +
        (isMapRetracted ? "pointer-events-none" : "")
      }
      style={{ willChange: 'transform, opacity' }}
      aria-label="像素猫 AI 助手煤球"
      aria-hidden={isMapRetracted ? true : undefined}
    >
      <AnimatePresence>
        {mapAvoidance === 'none' && speech && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.97 }}
            className="tide-assistant-panel absolute bottom-[132px] right-0 max-h-56 w-[min(21rem,calc(100vw-1rem))] overflow-y-auto rounded-[22px] px-5 py-4"
            aria-live="polite"
          >
            <div className="mb-2 flex items-center gap-2 text-[9px] font-semibold tracking-[0.22em] text-teal-100/50">
              <span className={`h-1.5 w-1.5 rounded-sm ${isThinking ? 'animate-pulse bg-[#f4b780]' : 'bg-teal-300'}`} />
              PIXEL CAT · 煤球
            </div>
            <p className="text-[13px] leading-6 text-teal-50/90">{speech}</p>
          </motion.div>
        )}

        {mapAvoidance === 'none' && showInput && (
          <motion.form
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.97 }}
            onSubmit={handleChatSubmit}
            className="tide-assistant-panel absolute bottom-[132px] right-0 w-[min(21rem,calc(100vw-1rem))] rounded-[22px] p-3"
          >
            <label htmlFor="pixel-cat-input" className="mb-2 block px-2 text-[9px] font-semibold tracking-[0.2em] text-teal-100/50">
              跟煤球随便聊聊 · 可问城市天气
            </label>
            <div className="flex items-center gap-2">
              <input
                id="pixel-cat-input"
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="聊聊天，或问“北京今天的天气”"
                disabled={isThinking}
                autoFocus
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-teal-50/35 focus:border-teal-200/45 focus:bg-white/10"
              />
              <button
                type="submit"
                disabled={isThinking || !inputValue.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0a7580] text-white transition hover:bg-[#075d68] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="发送问题"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        <div className="mb-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleInput}
            disabled={isThinking}
            className="tide-assistant-button flex h-10 w-10 items-center justify-center rounded-full text-teal-50/85 transition hover:-translate-y-0.5 hover:text-white disabled:cursor-wait disabled:opacity-50"
            title="和煤球聊天"
            aria-label={showInput ? '关闭像素猫聊天输入框' : '打开像素猫聊天输入框'}
            aria-expanded={showInput}
          >
            <MessageCircle size={17} />
          </button>
          <button
            type="button"
            onClick={handleFeed}
            disabled={isThinking}
            className="tide-assistant-button flex h-10 w-10 items-center justify-center rounded-full text-teal-50/85 transition hover:-translate-y-0.5 hover:text-[#f4b780] disabled:cursor-wait disabled:opacity-50"
            title="喂煤球小鱼干（播放吃鱼动画）"
            aria-label="喂像素猫小鱼干并播放吃鱼动画"
          >
            <Fish size={18} />
          </button>
          <button
            type="button"
            onClick={handlePlay}
            disabled={isThinking}
            className="tide-assistant-button flex h-10 w-10 items-center justify-center rounded-full text-teal-50/85 transition hover:-translate-y-0.5 hover:text-[#f4b780] disabled:cursor-wait disabled:opacity-50"
            title="逗煤球玩一玩（翻滚或舔爪）"
            aria-label="让像素猫煤球翻滚或舔爪"
          >
            <RotateCcw size={17} />
          </button>
        </div>

        <div
          className={`${styles.stage} group relative h-[108px] w-[108px] sm:h-[126px] sm:w-[126px]`}
          data-reduced={shouldReduceMotion ? 'true' : 'false'}
        >
          <div key={actionNonce} className={styles.actor} data-action={visualAction} aria-hidden="true">
            <div className={styles.sprite} />
          </div>

          {isThinking && (
            <span className="pointer-events-none absolute right-2 top-1 z-30 flex items-end gap-1" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={`${styles.thinkingDot} h-1.5 w-1.5 rounded-sm bg-[#f4b780]`}
                  style={{ animationDelay: `${index * 0.16}s` }}
                />
              ))}
            </span>
          )}

          {catAction === 'pet' && !shouldReduceMotion && (
            <span key={actionNonce} className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
              {[-18, 0, 18].map((offset, index) => (
                <motion.span
                  key={offset}
                  initial={{ opacity: 0, x: offset, y: 40, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 0], x: offset * 1.45, y: -18 - index * 8, scale: [0.6, 1, 0.82] }}
                  transition={{ duration: 1.3, delay: index * 0.12, ease: 'easeOut' }}
                  className="absolute left-1/2 top-2 text-lg font-black text-[#f08a78] drop-shadow-[0_2px_0_rgba(4,25,37,0.6)]"
                >
                  ♥
                </motion.span>
              ))}
            </span>
          )}

          <button
            type="button"
            onClick={toggleInput}
            disabled={isThinking || mapAvoidance !== 'none'}
            data-cat-interaction="open-chat"
            className="absolute inset-0 z-10 cursor-pointer rounded-[28%] outline-none focus-visible:ring-2 focus-visible:ring-teal-200/70"
            aria-label="点击像素猫身体打开聊天"
          />
          <button
            type="button"
            onClick={handlePetHead}
            data-cat-interaction="pet-head"
            className="absolute left-[27%] top-[4%] z-20 h-[48%] w-[48%] cursor-grab rounded-[42%] border border-dashed border-transparent outline-none transition hover:border-[#f4b780]/55 hover:bg-[#f4b780]/5 active:cursor-grabbing focus-visible:border-[#f4b780]/80 focus-visible:ring-2 focus-visible:ring-[#f4b780]/50"
            aria-label="摸摸像素猫煤球的头"
            title="摸摸煤球的头"
          />
          <span className="pointer-events-none absolute -bottom-1 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#062333]/85 px-2 py-1 text-[8px] font-semibold tracking-[0.12em] text-teal-50/70 opacity-0 shadow-lg transition group-hover:opacity-100">
            摸头 · 身体聊天
          </span>
        </div>
      </div>
    </motion.aside>
  );
}
