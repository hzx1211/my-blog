"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Music2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { uploadAdminMedia } from "./uploadMedia";
import {
  fieldClassName,
  responseMessage,
  type AdminNotice,
  type MusicTrack,
} from "./shared";

export default function MusicManager() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/music", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const data = (await response.json()) as { items: MusicTrack[] };
      setTracks(data.items);
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "歌单加载失败",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  async function handleUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setUploading(true);
    setNotice(null);

    try {
      const media = await uploadAdminMedia(file);
      if (media.type !== "audio") throw new Error("请选择音频文件");

      const response = await fetch("/api/admin/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist, url: media.url }),
      });
      const data = (await response.json().catch(() => ({}))) as { item?: MusicTrack; message?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.message || "音乐上传失败");
      }

      setTracks((current) => [data.item as MusicTrack, ...current.filter((track) => track.id !== data.item?.id)]);
      setTitle("");
      setArtist("");
      window.dispatchEvent(new Event("music-library-changed"));
      setNotice({ type: "success", text: "音乐已加入全站播放歌单" });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "音乐上传失败",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(track: MusicTrack) {
    if (!window.confirm("确定从全站歌单移除“" + track.title + "”吗？")) return;

    setRemovingId(track.id);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/music/" + encodeURIComponent(track.id), { method: "DELETE" });
      if (!response.ok) throw new Error(await responseMessage(response));

      setTracks((current) => current.filter((item) => item.id !== track.id));
      window.dispatchEvent(new Event("music-library-changed"));
      setNotice({ type: "success", text: "已从全站歌单移除这首音乐" });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "移除音乐失败",
      });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-[#dbe8de] bg-white shadow-[0_6px_24px_rgba(6,59,40,0.04)]">
        <div className="flex flex-col gap-4 border-b border-[#e5eee6] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e4f3eb] text-[#138e5f]">
              <Music2 size={20} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e86f45]">blog radio</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold tracking-[-0.06em] text-[#063b28]">全站音乐角</h2>
              <p className="mt-1 text-xs leading-5 text-[#78907f]">
                上传的音乐会出现在博客左下角播放器里，不会成为文章分类或文章卡片。
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-[#e2f2e3] px-3 py-1.5 text-xs font-semibold text-[#4f8b5e]">
            {loading ? "读取中…" : tracks.length + " 首曲目"}
          </span>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:px-7">
          <label className="text-sm font-semibold text-[#315844]">
            歌曲名称（可选）
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              className={fieldClassName}
              placeholder="留空则使用文件名"
              disabled={uploading}
            />
          </label>
          <label className="text-sm font-semibold text-[#315844]">
            歌手 / 来源（可选）
            <input
              value={artist}
              onChange={(event) => setArtist(event.target.value)}
              maxLength={100}
              className={fieldClassName}
              placeholder="例如：我的收藏"
              disabled={uploading}
            />
          </label>
          <label className="mt-[30px] inline-flex h-[50px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#063b28] px-5 text-sm font-semibold text-white transition hover:bg-[#0b5136]">
            <UploadCloud size={16} />
            {uploading ? "上传中…" : "上传音乐"}
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/ogg,audio/wav,audio/x-wav,audio/aac"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                void handleUpload(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        <p className="px-5 pb-5 text-xs leading-5 text-[#91a89a] sm:px-7">
          支持 MP3、M4A、WAV、OGG、AAC，单首最大 40MB。请只上传你拥有或获授权公开播放的音频。
        </p>
      </section>

      {notice && (
        <div
          className={
            "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm " +
            (notice.type === "error" ? "bg-[#fff0e9] text-[#a65338]" : "bg-[#e2f2e3] text-[#4f8b5e]")
          }
        >
          {notice.type === "success" ? <Check size={16} /> : <RefreshCw size={16} />}
          {notice.text}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#dbe8de] bg-white">
        <div className="flex items-center justify-between border-b border-[#e5eee6] px-5 py-4 sm:px-7">
          <h2 className="font-heading text-xl font-semibold tracking-[-0.05em] text-[#063b28]">歌单</h2>
          <button
            type="button"
            onClick={() => void loadTracks()}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-[#cfe0d3] px-3 py-1.5 text-xs font-semibold text-[#668274] transition hover:bg-[#f1f7f2] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            刷新
          </button>
        </div>

        {loading && <p className="px-5 py-10 text-sm text-[#78907f] sm:px-7">正在读取歌单…</p>}

        {!loading && tracks.length === 0 && (
          <p className="px-5 py-10 text-sm leading-6 text-[#78907f] sm:px-7">
            还没有曲目。上传后，它会直接出现在博客的全站播放器中。
          </p>
        )}

        {tracks.length > 0 && (
          <div className="grid gap-px bg-[#e5eee6] sm:grid-cols-2">
            {tracks.map((track) => (
              <div key={track.id} className="flex min-w-0 items-center gap-3 bg-white px-5 py-4 sm:px-7">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f7f2] text-[#138e5f]">
                  <Music2 size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#315844]">{track.title}</p>
                  <p className="truncate text-xs text-[#78907f]">{track.artist || "未填写歌手 / 来源"}</p>
                  <audio controls preload="metadata" src={track.url} className="mt-2 h-8 w-full" aria-label={"试听 " + track.title} />
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemove(track)}
                  disabled={removingId === track.id}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#c45f3e] transition hover:bg-[#fff0e9] disabled:cursor-wait disabled:opacity-50"
                  aria-label={"移除 " + track.title}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
