"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { Check, ImagePlus, LoaderCircle, UserRound } from "lucide-react";
import { uploadAdminMedia } from "./uploadMedia";
import { responseMessage, type AdminNotice } from "./shared";

type SiteProfile = {
  homeAvatarUrl: string;
  aboutAvatarUrl: string;
};

type AvatarField = keyof SiteProfile;

const fallbackAvatar = "/resume-profile.jpg";

const avatarFields: Array<{
  key: AvatarField;
  title: string;
  description: string;
  previewClassName: string;
  imageClassName: string;
}> = [
  {
    key: "homeAvatarUrl",
    title: "首页头像",
    description: "显示在首页标题上方的圆形头像。",
    previewClassName: "h-32 w-32 rounded-full",
    imageClassName: "h-full w-full rounded-full object-cover",
  },
  {
    key: "aboutAvatarUrl",
    title: "关于我照片",
    description: "显示在首页“关于我”介绍卡片中的照片。",
    previewClassName: "h-40 w-32 rounded-2xl",
    imageClassName: "h-full w-full rounded-2xl object-cover",
  },
];

export default function SiteProfileManager() {
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<AvatarField | null>(null);
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  async function loadProfile() {
    setLoading(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/site-profile", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const data = (await response.json()) as { item: SiteProfile };
      setProfile(data.item);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "头像设置加载失败" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function uploadAvatar(field: AvatarField, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(field);
    setNotice(null);
    try {
      const media = await uploadAdminMedia(file);
      if (media.type !== "image" || !media.url) throw new Error("上传结果不是有效图片");

      const response = await fetch("/api/admin/site-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: media.url }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));

      const data = (await response.json()) as { item: SiteProfile; message?: string };
      setProfile(data.item);
      const label = field === "homeAvatarUrl" ? "首页头像" : "关于我照片";
      setNotice({ type: "success", text: `${label}已上传并保存，刷新前台即可查看` });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "头像上传失败" });
    } finally {
      setUploading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[2rem] border border-[#dbe8de] bg-white text-sm text-[#78907f]">
        <LoaderCircle className="mr-2 animate-spin" size={17} /> 正在读取头像设置…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-2">
        {avatarFields.map((field) => {
          const isUploading = uploading === field.key;
          return (
            <article key={field.key} className="rounded-[2rem] border border-[#dbe8de] bg-white p-5 shadow-[0_6px_24px_rgba(6,59,40,0.04)] sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e4f3eb] text-[#138e5f]">
                  <UserRound size={18} />
                </span>
                <div>
                  <h2 className="font-heading text-lg font-semibold text-[#063b28]">{field.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-[#78907f]">{field.description}</p>
                </div>
              </div>

              <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl bg-[#f4faf5] p-4">
                <div className={`relative ${field.previewClassName} overflow-hidden border-4 border-white bg-[#e8f2e9] shadow-[0_8px_24px_rgba(6,59,40,0.12)]`}>
                  <Image
                    src={profile?.[field.key] || fallbackAvatar}
                    alt={`${field.title}预览`}
                    fill
                    unoptimized
                    sizes="160px"
                    className={field.imageClassName}
                  />
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#9fc3a8] bg-white px-4 py-3 text-sm font-semibold text-[#49715a] transition hover:bg-[#eef7ef] has-[:disabled]:cursor-wait has-[:disabled]:opacity-55">
                {isUploading ? <LoaderCircle className="animate-spin" size={16} /> : <ImagePlus size={16} />}
                {isUploading ? "正在上传并保存…" : `更换${field.title}`}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={uploading !== null}
                  onChange={(event) => void uploadAvatar(field.key, event)}
                />
              </label>
              <p className="mt-2 text-center text-[11px] leading-5 text-[#91a89a]">支持 JPG、PNG、WebP、GIF，单张最大 20MB；选择后自动保存</p>
            </article>
          );
        })}
      </section>

      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={
            "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm " +
            (notice.type === "error" ? "bg-[#fff0e9] text-[#a65338]" : "bg-[#e2f2e3] text-[#4f8b5e]")
          }
        >
          {notice.type === "success" ? <Check size={16} /> : <ImagePlus size={16} />}
          {notice.text}
        </div>
      )}

      {!profile && notice?.type === "error" && (
        <button type="button" onClick={() => void loadProfile()} className="rounded-full border border-[#cfe0d3] bg-white px-4 py-2 text-sm font-semibold text-[#547062] hover:bg-[#f1f7f2]">
          重新加载
        </button>
      )}
    </div>
  );
}

