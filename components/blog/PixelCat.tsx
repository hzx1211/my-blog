"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Hand,
  Heart,
  Loader2,
  MessageCircle,
  RotateCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

type CatAction = "idle" | "pet" | "lick" | "roll";
type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const initialMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "喵～我是黄志雄博客里的像素猫。可以陪你聊项目、学习，也可以听你说说今天。",
};

const quickPrompts = ["夸夸我的项目", "给我一个学习建议", "今天适合做什么？"];

function messageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function PixelCatArt({ action, blinking }: { action: CatAction; blinking: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-[138px] w-[166px] select-none sm:h-[150px] sm:w-[180px]"
      viewBox="0 0 176 148"
      role="presentation"
      shapeRendering="crispEdges"
    >
      <g className={`pixel-cat-figure pixel-cat-figure--${action}`}>
        <rect className="pixel-cat-shadow" x="38" y="130" width="101" height="7" rx="3" />

        <path
          className="pixel-cat-tail"
          d="M126 107h12V95h10V75h12v34h-7v9h-27z"
          fill="#123b2c"
        />
        <path
          className="pixel-cat-tail-inner"
          d="M130 105h10V92h9V79h5v27h-7v8h-17z"
          fill="#e99559"
        />

        <rect x="39" y="76" width="98" height="51" fill="#123b2c" />
        <rect x="45" y="79" width="86" height="47" fill="#ed9d5e" />
        <rect x="55" y="84" width="66" height="42" fill="#ffe8c1" />
        <rect x="64" y="91" width="48" height="35" fill="#fff2d9" />
        <rect x="46" y="108" width="10" height="18" fill="#e58b50" />
        <rect x="120" y="108" width="11" height="18" fill="#e58b50" />

        <g className="pixel-cat-head">
          <polygon points="37,57 40,25 66,41 110,41 136,25 140,57 136,88 126,101 50,101 40,88" fill="#123b2c" />
          <polygon points="44,57 46,36 66,49 110,49 130,36 133,57 129,84 121,94 55,94 47,84" fill="#f0a263" />
          <polygon points="50,53 53,41 66,50 59,66" fill="#f09aaf" />
          <polygon points="117,50 130,41 130,54 121,66" fill="#f09aaf" />
          <rect x="52" y="56" width="70" height="34" fill="#f6b477" />
          <rect x="58" y="67" width="58" height="22" fill="#ffc68c" />

          <rect className={`pixel-cat-eye ${blinking ? "pixel-cat-eye--blink" : ""}`} x="61" y="65" width="9" height="8" fill="#123b2c" />
          <rect className={`pixel-cat-eye ${blinking ? "pixel-cat-eye--blink" : ""}`} x="106" y="65" width="9" height="8" fill="#123b2c" />
          <rect x="64" y="66" width="3" height="3" fill="#fff2d9" />
          <rect x="109" y="66" width="3" height="3" fill="#fff2d9" />

          <rect x="83" y="75" width="9" height="6" fill="#e47e83" />
          <rect x="80" y="81" width="15" height="4" fill="#123b2c" />
          <rect x="58" y="78" width="7" height="4" fill="#e98a8e" />
          <rect x="111" y="78" width="7" height="4" fill="#e98a8e" />
          <rect x="49" y="73" width="11" height="3" fill="#123b2c" />
          <rect x="116" y="73" width="11" height="3" fill="#123b2c" />

          <g className="pixel-cat-whiskers">
            <path d="M56 80H36M57 85H40M119 80h21M118 85h17" fill="none" stroke="#123b2c" strokeWidth="2" />
          </g>
        </g>

        <g className="pixel-cat-front-paw pixel-cat-front-paw--left">
          <rect x="53" y="111" width="20" height="18" fill="#123b2c" />
          <rect x="57" y="111" width="13" height="15" fill="#ed9d5e" />
          <rect x="59" y="119" width="3" height="3" fill="#fff2d9" />
          <rect x="65" y="119" width="3" height="3" fill="#fff2d9" />
        </g>
        <g className="pixel-cat-front-paw pixel-cat-front-paw--right">
          <rect x="104" y="111" width="20" height="18" fill="#123b2c" />
          <rect x="108" y="111" width="13" height="15" fill="#ed9d5e" />
          <rect x="110" y="119" width="3" height="3" fill="#fff2d9" />
          <rect x="116" y="119" width="3" height="3" fill="#fff2d9" />
        </g>
        <g className="pixel-cat-lick-paw">
          <rect x="109" y="82" width="17" height="20" fill="#123b2c" />
          <rect x="112" y="82" width="11" height="16" fill="#ed9d5e" />
          <rect x="114" y="89" width="3" height="3" fill="#fff2d9" />
          <rect x="120" y="89" width="3" height="3" fill="#fff2d9" />
        </g>
        <rect className="pixel-cat-tongue" x="87" y="84" width="8" height="8" fill="#e47e83" />
      </g>
    </svg>
  );
}

export default function PixelCat() {
  const [action, setAction] = useState<CatAction>("idle");
  const [blinking, setBlinking] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState("点一下摸摸头，猫猫会回应你");
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let blinkTimer: ReturnType<typeof setTimeout>;
    let finishTimer: ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      blinkTimer = setTimeout(() => {
        setBlinking(true);
        finishTimer = setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 170);
      }, 2800 + Math.random() * 2600);
    };

    scheduleBlink();
    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (actionTimer.current) clearTimeout(actionTimer.current);
    };
  }, []);

  function triggerAction(nextAction: Exclude<CatAction, "idle">, nextNotice: string) {
    if (actionTimer.current) clearTimeout(actionTimer.current);
    setAction(nextAction);
    setNotice(nextNotice);
    actionTimer.current = setTimeout(() => {
      setAction("idle");
      setNotice("还想和我玩一会儿吗？");
    }, nextAction === "roll" ? 1250 : 1050);
  }

  function handleChatToggle() {
    setIsChatOpen((open) => !open);
    setNotice("有什么想和猫猫聊的吗？");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();

    if (!content || isSending) return;

    const userMessage: ChatMessage = { id: messageId(), role: "user", content };
    const nextMessages = [...messages, userMessage].slice(-12);
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsSending(true);
    setNotice("猫猫正在认真想……");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })) }),
      });
      const data = (await response.json()) as { reply?: string; message?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.message || "聊天接口暂时不可用");
      }

      setMessages((current) => [
        ...current,
        { id: messageId(), role: "assistant", content: data.reply as string },
      ]);
      triggerAction("pet", "呼噜～收到你的消息啦");
    } catch {
      setMessages((current) => [
        ...current,
        { id: messageId(), role: "assistant", content: "喵呜，我刚刚走神了。你可以再发一次，我会继续听着。" },
      ]);
      setNotice("网络抖了一下，但猫猫还在");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isChatOpen && (
        <section
          aria-label="像素猫聊天窗口"
          className="pixel-cat-chat w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[26px] border border-[#123b2c]/10 bg-[#fffdf6]/95 shadow-[0_18px_60px_rgba(18,59,44,0.2)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-[#123b2c]/10 bg-[#e4f3eb]/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123b2c] text-[#fff2d9]">
                <Sparkles size={17} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#123b2c]">像素猫 · 阿喵</h2>
                <p className="mt-0.5 text-[11px] text-[#123b2c]/55">陪你聊代码，也聊生活</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleChatToggle}
              aria-label="关闭聊天窗口"
              className="rounded-full p-2 text-[#123b2c]/60 transition-colors hover:bg-white hover:text-[#123b2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138e5f]"
            >
              <X size={17} />
            </button>
          </div>

          <div className="pixel-cat-messages flex max-h-[280px] min-h-[150px] flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${message.role === "user" ? "rounded-br-md bg-[#123b2c] text-white" : "rounded-bl-md bg-[#e4f3eb] text-[#123b2c]"}`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-[#e4f3eb] px-3.5 py-2.5 text-[13px] text-[#123b2c]/70">
                  <Loader2 size={14} className="animate-spin" /> 正在想……
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-hide">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setDraft(prompt)}
                className="shrink-0 rounded-full border border-[#138e5f]/20 bg-white px-2.5 py-1.5 text-[11px] text-[#138e5f] transition-colors hover:bg-[#e4f3eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138e5f]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-[#123b2c]/10 bg-white/70 p-3">
            <label className="sr-only" htmlFor="pixel-cat-message">发送给像素猫</label>
            <textarea
              id="pixel-cat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={500}
              placeholder="和猫猫说点什么…"
              className="min-h-10 flex-1 resize-none rounded-2xl border border-[#123b2c]/10 bg-[#fffdf6] px-3.5 py-2.5 text-[13px] leading-5 text-[#123b2c] outline-none placeholder:text-[#123b2c]/40 focus:border-[#138e5f] focus:ring-2 focus:ring-[#138e5f]/15"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              aria-label="发送消息"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#123b2c] text-white transition-colors hover:bg-[#138e5f] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138e5f] focus-visible:ring-offset-2"
            >
              <Send size={15} />
            </button>
          </form>
        </section>
      )}

      <div className="relative flex items-end gap-2">
        <div className="pixel-cat-speech absolute bottom-[154px] right-0 w-[204px] rounded-2xl rounded-br-md border border-[#123b2c]/10 bg-white/95 px-3 py-2 text-center text-[12px] font-medium leading-5 text-[#123b2c] shadow-[0_8px_24px_rgba(18,59,44,0.12)] sm:bottom-[166px]">
          <span aria-live="polite">{notice}</span>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleChatToggle}
            aria-label={isChatOpen ? "关闭像素猫聊天" : "打开像素猫聊天"}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-[0_6px_20px_rgba(18,59,44,0.12)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138e5f] ${isChatOpen ? "border-[#123b2c] bg-[#123b2c] text-white" : "border-[#123b2c]/10 bg-white/95 text-[#123b2c] hover:border-[#138e5f]/40 hover:text-[#138e5f]"}`}
          >
            <MessageCircle size={15} />
            {isChatOpen ? "收起聊天" : "和我聊聊"}
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-[#123b2c]/10 bg-white/95 p-1.5 shadow-[0_6px_20px_rgba(18,59,44,0.12)]">
            <button
              type="button"
              onClick={() => triggerAction("pet", "呼噜呼噜～摸得真舒服")}
              aria-label="摸摸像素猫的头"
              title="摸头"
              className="rounded-full p-2 text-[#123b2c] transition-colors hover:bg-[#e4f3eb] hover:text-[#138e5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138e5f]"
            >
              <Hand size={15} />
            </button>
            <button
              type="button"
              onClick={() => triggerAction("lick", "猫猫正在认真舔爪爪")}
              aria-label="让像素猫舔爪"
              title="舔爪"
              className="rounded-full p-2 text-[#123b2c] transition-colors hover:bg-[#fff0dc] hover:text-[#e68a4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e68a4d]"
            >
              <Heart size={15} />
            </button>
            <button
              type="button"
              onClick={() => triggerAction("roll", "翻滚完成！再来一次吗？")}
              aria-label="让像素猫翻滚"
              title="翻滚"
              className="rounded-full p-2 text-[#123b2c] transition-colors hover:bg-[#eaf5f8] hover:text-[#138e5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138e5f]"
            >
              <RotateCw size={15} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => triggerAction("pet", "呼噜呼噜～摸得真舒服")}
          aria-label="摸摸像素猫的头"
          className="pixel-cat-card group rounded-[26px] border border-[#123b2c]/10 bg-[#fffdf6]/95 p-2 shadow-[0_12px_34px_rgba(18,59,44,0.17)] backdrop-blur-xl transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138e5f] focus-visible:ring-offset-2"
        >
          <PixelCatArt action={action} blinking={blinking} />
          <span className="block pb-1 text-center text-[11px] font-semibold tracking-[0.18em] text-[#123b2c]/55">摸摸阿喵</span>
        </button>
      </div>
    </div>
  );
}
