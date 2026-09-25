"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  ImagePlus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { uploadAdminMedia } from "./uploadMedia";
import {
  createBlankPostForm,
  fieldClassName,
  postCategories,
  postToForm,
  responseMessage,
  type AdminNotice,
  type AdminPost,
  type PostForm,
  type PostMedia,
  type PostStatus,
} from "./shared";

type ArticleEditorProps = {
  postId?: string;
};

export default function ArticleEditor({ postId }: ArticleEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(postId);
  const [form, setForm] = useState<PostForm>(() => createBlankPostForm());
  const [savedForm, setSavedForm] = useState<PostForm>(() => createBlankPostForm());
  const [loading, setLoading] = useState(isEditing);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!postId) {
      const blank = createBlankPostForm();
      setForm(blank);
      setSavedForm(blank);
      setLoading(false);
      setNotFound(false);
      setNotice(null);
      return () => {
        cancelled = true;
      };
    }

    const id = postId;

    async function loadPost() {
      setLoading(true);
      setNotFound(false);
      setNotice(null);

      try {
        const response = await fetch("/api/admin/posts/" + encodeURIComponent(id), {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(await responseMessage(response));
        const data = (await response.json()) as { item: AdminPost };
        const nextForm = postToForm(data.item);

        if (cancelled) return;
        setForm(nextForm);
        setSavedForm(nextForm);
      } catch (error) {
        if (cancelled) return;
        setNotFound(true);
        setNotice({
          type: "error",
          text: error instanceof Error ? error.message : "文章加载失败",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function handleMediaUpload(files: FileList | null) {
    const selectedFiles = files ? Array.from(files) : [];
    if (!selectedFiles.length) return;

    const availableSlots = 12 - form.media.length;
    if (availableSlots <= 0) {
      setNotice({ type: "error", text: "每篇文章最多添加 12 个照片或 Vlog 文件" });
      return;
    }

    setUploadingMedia(true);
    setNotice(null);
    let uploaded = 0;

    try {
      for (const file of selectedFiles.slice(0, availableSlots)) {
        const item = await uploadAdminMedia(file);
        if (item.type !== "image" && item.type !== "video") throw new Error("文章媒体只支持照片或视频");

        uploaded += 1;
        setForm((current) => ({
          ...current,
          media: [...current.media, item as PostMedia].slice(0, 12),
        }));
      }

      setNotice({
        type: "success",
        text: "已添加 " + uploaded + " 个媒体文件，保存文章后会一起展示。",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "媒体上传失败",
      });
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    try {
      const payload = {
        ...form,
        readTime: Number(form.readTime),
        tags: form.tags
          .split(/[，,]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const response = await fetch(
        postId ? "/api/admin/posts/" + encodeURIComponent(postId) : "/api/admin/posts",
        {
          method: postId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error(await responseMessage(response));

      const data = (await response.json()) as { item: AdminPost };
      const nextForm = postToForm(data.item);
      setForm(nextForm);
      setSavedForm(nextForm);
      setNotice({
        type: "success",
        text: form.status === "published" ? "文章已发布" : "草稿已保存",
      });

      if (!postId) {
        router.replace("/admin/posts/" + encodeURIComponent(data.item.id));
      }
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "保存失败",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!postId || !window.confirm("确定删除这篇文章吗？删除后无法从后台恢复。")) return;

    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/posts/" + encodeURIComponent(postId), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await responseMessage(response));

      router.push("/admin/posts");
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "删除失败",
      });
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-[#dbe8de] bg-white px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/posts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#668274] transition hover:text-[#e86f45]"
            >
              <ArrowLeft size={14} />
              返回文章列表
            </Link>
            <p className="mt-4 text-sm leading-6 text-[#78907f]">
              {isEditing
                ? "这是一篇独立的编辑页面，完成后可直接回到文章列表。"
                : "新文章会先保存为草稿；你也可以在这里直接选择发布。"}
            </p>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={busy || loading}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f2b39a] px-4 py-2.5 text-sm font-semibold text-[#c45f3e] transition hover:bg-[#fff0e9] disabled:cursor-wait disabled:opacity-50"
            >
              <Trash2 size={15} />
              删除文章
            </button>
          )}
        </div>
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

      {loading && (
        <section className="rounded-[2rem] border border-[#dbe8de] bg-white px-5 py-14 text-sm text-[#78907f] sm:px-7">
          正在加载文章编辑器…
        </section>
      )}

      {!loading && notFound && (
        <section className="rounded-[2rem] border border-[#dbe8de] bg-white px-5 py-12 sm:px-7">
          <p className="text-lg font-semibold text-[#315844]">无法打开这篇文章</p>
          <p className="mt-2 text-sm leading-6 text-[#78907f]">它可能已被删除，或你的登录状态已经失效。</p>
          <Link
            href="/admin/posts"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#063b28] px-4 py-2.5 text-sm font-semibold text-white"
          >
            回到文章列表
            <ArrowLeft size={15} />
          </Link>
        </section>
      )}

      {!loading && !notFound && (
        <section className="rounded-[2rem] border border-[#dbe8de] bg-white p-5 sm:p-8">
          <div className="mb-7 border-b border-[#e5eee6] pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e86f45]">
              {isEditing ? "编辑文章" : "新建文章"}
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-[-0.06em] text-[#063b28]">
              {isEditing ? "编辑文章" : "写一篇新文章"}
            </h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-semibold text-[#315844]">
                标题
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className={fieldClassName}
                  placeholder="例如：我如何开始记录一件小事"
                />
              </label>
              <label className="text-sm font-semibold text-[#315844]">
                URL Slug
                <input
                  value={form.slug}
                  onChange={(event) => setForm({ ...form, slug: event.target.value })}
                  className={fieldClassName}
                  placeholder="留空会根据标题生成"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-[#315844]">
              摘要
              <textarea
                required
                minLength={5}
                maxLength={240}
                rows={3}
                value={form.excerpt}
                onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
                className={fieldClassName + " resize-y"}
                placeholder="用一两句话介绍这篇文章"
              />
            </label>

            <label className="block text-sm font-semibold text-[#315844]">
              正文
              <textarea
                required
                minLength={10}
                rows={13}
                value={form.content}
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                className={fieldClassName + " resize-y font-mono leading-7"}
                placeholder="支持普通文本，空行会在文章页分段"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-3">
              <label className="text-sm font-semibold text-[#315844]">
                分类
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value as PostForm["category"],
                    })
                  }
                  className={fieldClassName}
                >
                  {postCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-[#315844]">
                阅读时长
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={form.readTime}
                  onChange={(event) => setForm({ ...form, readTime: event.target.value })}
                  className={fieldClassName}
                />
              </label>
              <label className="text-sm font-semibold text-[#315844]">
                状态
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as PostStatus,
                    })
                  }
                  className={fieldClassName}
                >
                  <option value="draft">草稿</option>
                  <option value="published">发布</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-semibold text-[#315844]">
              标签
              <input
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                className={fieldClassName}
                placeholder="支持中英文逗号，例如：旅行，惠州"
              />
            </label>

            <section className="rounded-3xl border border-dashed border-[#9bc9a7] bg-[#f7fcf8] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#315844]">照片与 Vlog</p>
                  <p className="mt-1 text-xs leading-5 text-[#78907f]">
                    可用手机直接拍摄，或从相册选择。每篇最多 12 个；照片最大 20MB，视频最大 120MB。
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#e2f2e3] px-3 py-1 text-[11px] font-semibold text-[#4f8b5e]">
                  {form.media.length}/12
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#063b28] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0b5136]">
                  <Camera size={15} />
                  现场拍照
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    disabled={busy || uploadingMedia}
                    onChange={(event) => {
                      void handleMediaUpload(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#cfe0d3] bg-white px-4 py-2.5 text-xs font-semibold text-[#547062] transition hover:bg-[#eef7ef]">
                  <Video size={15} />
                  拍 Vlog
                  <input
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="sr-only"
                    disabled={busy || uploadingMedia}
                    onChange={(event) => {
                      void handleMediaUpload(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#cfe0d3] bg-white px-4 py-2.5 text-xs font-semibold text-[#547062] transition hover:bg-[#eef7ef]">
                  <ImagePlus size={15} />
                  相册 / 视频库
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    multiple
                    className="sr-only"
                    disabled={busy || uploadingMedia}
                    onChange={(event) => {
                      void handleMediaUpload(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              {uploadingMedia && (
                <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-[#4f8b5e]">
                  <UploadCloud size={15} className="animate-pulse" />
                  正在上传媒体文件…
                </p>
              )}

              {form.media.length > 0 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {form.media.map((item, index) => (
                    <div
                      key={item.url + "-" + index}
                      className="overflow-hidden rounded-2xl border border-[#dbe8de] bg-white p-2 shadow-sm"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#e8f2e9]">
                        {item.type === "image" ? (
                          <Image
                            src={item.url}
                            alt={item.alt}
                            fill
                            unoptimized
                            sizes="(min-width: 1280px) 220px, (min-width: 640px) 40vw, 90vw"
                            className="object-cover"
                          />
                        ) : (
                          <video
                            src={item.url}
                            controls
                            preload="metadata"
                            className="h-full w-full object-cover"
                            aria-label={item.alt}
                          />
                        )}
                        <span className="absolute left-2 top-2 rounded-full bg-[#063b28]/80 px-2 py-1 text-[10px] font-semibold text-white">
                          {item.type === "image" ? "照片" : "Vlog"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              media: current.media.filter((_, mediaIndex) => mediaIndex !== index),
                            }))
                          }
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#c45f3e] shadow-sm transition hover:bg-white"
                          aria-label={"移除" + (item.type === "image" ? "照片" : "Vlog")}
                        >
                          <X size={15} />
                        </button>
                      </div>
                      <input
                        value={item.caption}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            media: current.media.map((media, mediaIndex) =>
                              mediaIndex === index
                                ? { ...media, caption: event.target.value }
                                : media,
                            ),
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-[#dbe8de] px-3 py-2 text-xs text-[#547062] outline-none focus:border-[#65a978]"
                        placeholder="给这张照片 / 视频写一句说明（可选）"
                        maxLength={180}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#e5eee6] pt-5">
              <button
                type="button"
                onClick={() => setForm(savedForm)}
                disabled={busy || uploadingMedia}
                className="inline-flex items-center gap-2 rounded-full border border-[#cfe0d3] px-4 py-2.5 text-sm font-semibold text-[#668274] transition hover:bg-[#f1f7f2] disabled:opacity-50"
              >
                重置
              </button>
              <button
                type="submit"
                disabled={busy || uploadingMedia}
                className="inline-flex items-center gap-2 rounded-full bg-[#063b28] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b5136] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={15} />
                {busy ? "保存中…" : form.status === "published" ? "保存并发布" : "保存草稿"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
