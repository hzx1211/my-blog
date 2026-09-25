"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Camera, Check, Crosshair, LoaderCircle, MapPin, Pencil, Plus, Save, Trash2, UploadCloud, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { uploadAdminMedia } from "../admin/uploadMedia";
import { type LocationGeocodeResult, useLocationGeocoder } from "./useLocationGeocoder";

const JourneyLocationPicker = dynamic(() => import("./JourneyLocationPicker"), {
  ssr: false,
  loading: () => <div className="flex h-[230px] items-center justify-center rounded-2xl bg-[#e8f2e9] text-sm text-[#668274] sm:h-[280px]">正在加载地图选点器…</div>,
});

type JourneyMemory = {
  id: string;
  city: string;
  place: string;
  latitude: number;
  longitude: number;
  visitedAt: string | null;
  note: string;
  coverUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

type JourneyForm = {
  city: string;
  place: string;
  latitude: string;
  longitude: string;
  visitedAt: string;
  note: string;
  coverUrl: string;
  isPublic: boolean;
};

const blankForm: JourneyForm = {
  city: "",
  place: "",
  latitude: "",
  longitude: "",
  visitedAt: "",
  note: "",
  coverUrl: "",
  isPublic: true,
};

const fieldClassName = "mt-2 w-full rounded-2xl border border-[#dbe8de] bg-white px-4 py-3 text-sm text-[#214b35] outline-none transition-colors placeholder:text-[#a3b6a8] focus:border-[#65a978] focus:ring-2 focus:ring-[#dcefdc]";

function formFromMemory(memory: JourneyMemory): JourneyForm {
  return {
    city: memory.city,
    place: memory.place,
    latitude: String(memory.latitude),
    longitude: String(memory.longitude),
    visitedAt: memory.visitedAt ?? "",
    note: memory.note,
    coverUrl: memory.coverUrl ?? "",
    isPublic: memory.isPublic,
  };
}

function coordinate(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value: string | null) {
  if (!value) return "日期未记录";
  return value.replaceAll("-", ".");
}

async function responseMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message || "请求失败，请稍后重试";
  } catch {
    return "请求失败，请稍后重试";
  }
}

export default function JourneyManager() {
  const [memories, setMemories] = useState<JourneyMemory[]>([]);
  const [form, setForm] = useState<JourneyForm>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [locating, setLocating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const locationInputTouchedRef = useRef(false);

  const applyGeocodedCoordinates = useCallback((result: LocationGeocodeResult) => {
    setForm((current) => {
      const currentQueryKey = `${current.city.trim()}|${current.place.trim()}`;
      if (currentQueryKey !== result.queryKey) return current;
      return {
        ...current,
        latitude: result.latitude.toFixed(6),
        longitude: result.longitude.toFixed(6),
      };
    });
  }, []);

  const geocoding = useLocationGeocoder({
    city: form.city,
    place: form.place,
    enabled: locationInputTouchedRef.current,
    onResult: applyGeocodedCoordinates,
  });

  const loadMemories = useCallback(async () => {
    const response = await fetch("/api/admin/journeys", { cache: "no-store" });
    if (!response.ok) throw new Error(await responseMessage(response));
    const data = (await response.json()) as { items: JourneyMemory[] };
    setMemories(data.items);
  }, []);

  useEffect(() => {
    void loadMemories().catch((error) => setNotice({ type: "error", text: error instanceof Error ? error.message : "旅行记忆加载失败" }));
  }, [loadMemories]);

  const latitude = coordinate(form.latitude);
  const longitude = coordinate(form.longitude);
  const cityCount = useMemo(() => new Set(memories.map((memory) => memory.city)).size, [memories]);
  const publicCount = useMemo(() => memories.filter((memory) => memory.isPublic).length, [memories]);

  function resetForm() {
    locationInputTouchedRef.current = false;
    setEditingId(null);
    setForm(blankForm);
    setNotice(null);
  }

  function editMemory(memory: JourneyMemory) {
    locationInputTouchedRef.current = false;
    setEditingId(memory.id);
    setForm(formFromMemory(memory));
    setNotice(null);
  }

  function updateLocationField(field: "city" | "place", value: string) {
    locationInputTouchedRef.current = true;
    geocoding.cancel();
    setForm((current) => ({ ...current, [field]: value, latitude: "", longitude: "" }));
  }

  function setCoordinates(nextLatitude: number, nextLongitude: number) {
    geocoding.cancel();
    setForm((current) => ({
      ...current,
      latitude: nextLatitude.toFixed(6),
      longitude: nextLongitude.toFixed(6),
    }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setNotice({ type: "error", text: "当前浏览器不支持定位，请在地图上点击地点" });
      return;
    }

    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates(position.coords.latitude, position.coords.longitude);
        setLocating(false);
        setNotice({ type: "success", text: "已填入当前位置；请确认该点位适合公开展示。" });
      },
      () => {
        setLocating(false);
        setNotice({ type: "error", text: "无法取得当前位置。请允许定位权限，或直接在地图上点击地点。" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  async function uploadPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setNotice(null);

    try {
      const item = await uploadAdminMedia(file);
      if (item.type !== "image") throw new Error("旅行封面只支持照片格式");

      setForm((current) => ({ ...current, coverUrl: item.url }));
      setNotice({ type: "success", text: "旅行照片已添加，保存记忆后会展示在地图下方。" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "旅行照片上传失败" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (geocoding.status === "loading") {
      setNotice({ type: "error", text: "正在根据城市和地点查找坐标，请稍等片刻。" });
      return;
    }
    const nextLatitude = coordinate(form.latitude);
    const nextLongitude = coordinate(form.longitude);
    if (nextLatitude === null || nextLongitude === null) {
      setNotice({ type: "error", text: "请在地图上选点、使用当前位置，或填写正确的经纬度。" });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const payload = {
        city: form.city,
        place: form.place,
        latitude: nextLatitude,
        longitude: nextLongitude,
        visitedAt: form.visitedAt || null,
        note: form.note,
        coverUrl: form.coverUrl || null,
        isPublic: form.isPublic,
      };
      const response = await fetch(editingId ? `/api/admin/journeys/${editingId}` : "/api/admin/journeys", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await responseMessage(response));

      const data = (await response.json()) as { item: JourneyMemory };
      locationInputTouchedRef.current = false;
      setEditingId(data.item.id);
      setForm(formFromMemory(data.item));
      await loadMemories();
      window.dispatchEvent(new Event("journey-library-changed"));
      setNotice({ type: "success", text: form.isPublic ? "旅行记忆已公开到地图" : "旅行记忆已保存为私密记录" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "旅行记忆保存失败" });
    } finally {
      setSaving(false);
    }
  }

  async function removeMemory(memory: JourneyMemory) {
    if (!window.confirm(`确定删除“${memory.city}${memory.place ? ` · ${memory.place}` : ""}”这条旅行记忆吗？`)) return;

    setRemovingId(memory.id);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/journeys/${memory.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseMessage(response));

      setMemories((current) => current.filter((item) => item.id !== memory.id));
      if (editingId === memory.id) resetForm();
      window.dispatchEvent(new Event("journey-library-changed"));
      setNotice({ type: "success", text: "旅行记忆已删除" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "旅行记忆删除失败" });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="mb-5 overflow-hidden rounded-[2rem] border border-[#dbe8de] bg-white shadow-[0_6px_24px_rgba(6,59,40,0.04)]">
      <div className="flex flex-col gap-4 border-b border-[#e5eee6] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e4f3eb] text-[#138e5f]"><MapPin size={20} /></span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e86f45]">travel memories</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-[-0.06em] text-[#063b28]">真实旅行记忆</h2>
            <p className="mt-1 text-xs leading-5 text-[#78907f]">请点击地图、拖动标记或使用当前位置，确认准确坐标后再保存旅行打卡。</p>
          </div>
        </div>
        <div className="flex w-fit gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#e2f2e3] px-3 py-1.5 text-[#4f8b5e]">{cityCount} 座城市</span>
          <span className="rounded-full bg-[#f1f7f2] px-3 py-1.5 text-[#668274]">{publicCount} 条公开</span>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)] sm:px-7 sm:py-7">
        <form className="space-y-5" onSubmit={saveMemory}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#315844]">{editingId ? "编辑一条真实记忆" : "添加一条真实记忆"}</p>
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-full border border-[#cfe0d3] px-3 py-1.5 text-xs font-semibold text-[#668274] hover:bg-[#f1f7f2]"><Plus size={14} />新建记录</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#315844]">城市<input required value={form.city} onChange={(event) => updateLocationField("city", event.target.value)} maxLength={60} className={fieldClassName} placeholder="例如：惠州" /></label>
            <label className="text-sm font-semibold text-[#315844]">地点（可选）<input value={form.place} onChange={(event) => updateLocationField("place", event.target.value)} maxLength={100} className={fieldClassName} placeholder="例如：西湖、双月湾" /></label>
          </div>
          <div aria-live="polite" className="-mt-2 min-h-5 text-xs leading-5">
            {geocoding.status === "loading" && <span className="inline-flex items-center gap-1.5 text-[#668274]"><LoaderCircle size={13} className="animate-spin" />正在根据城市和地点查找坐标…</span>}
            {geocoding.status === "success" && <span className="text-[#4f8b5e]">已自动填入坐标{geocoding.displayName ? `（${geocoding.displayName}）` : ""}，可在地图上微调。</span>}
            {geocoding.status === "error" && <span className="inline-flex flex-wrap items-center gap-2 text-[#a65338]"><span>{geocoding.errorMessage || "没有找到准确地点，请检查名称，或直接在地图上选点。"}</span><button type="button" onClick={geocoding.retry} className="font-semibold underline underline-offset-2">重试</button></span>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#315844]">到访日期（可选）<input type="date" value={form.visitedAt} onChange={(event) => setForm({ ...form, visitedAt: event.target.value })} className={fieldClassName} /></label>
            <div className="mt-[27px]">
              <button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#cfe0d3] bg-[#f8fbf8] px-4 py-3 text-sm font-semibold text-[#315844] transition hover:bg-[#eef7ef] disabled:cursor-wait disabled:opacity-60">
                {locating ? <LoaderCircle size={16} className="animate-spin" /> : <Crosshair size={16} />}{locating ? "正在定位…" : "使用当前位置"}
              </button>
            </div>
          </div>
          <JourneyLocationPicker latitude={latitude} longitude={longitude} onChange={setCoordinates} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#315844]">纬度<input required type="number" step="0.000001" min={-90} max={90} value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))} className={fieldClassName} placeholder="城市和地点会自动填入" /></label>
            <label className="text-sm font-semibold text-[#315844]">经度<input required type="number" step="0.000001" min={-180} max={180} value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))} className={fieldClassName} placeholder="城市和地点会自动填入" /></label>
          </div>
          <label className="block text-sm font-semibold text-[#315844]">这次旅行的一句话<textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} maxLength={360} rows={3} className={`${fieldClassName} resize-y`} placeholder="只写你真的想留住的那一小段。" /></label>
          <div className="rounded-2xl border border-dashed border-[#9bc9a7] bg-[#f7fcf8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-semibold text-[#315844]">旅行照片（可选）</p><p className="mt-1 text-xs text-[#78907f]">照片会显示在前台这条旅行记忆的卡片中。</p></div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#063b28] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0b5136]"><Camera size={15} />{uploadingPhoto ? "上传中…" : "添加照片"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={uploadingPhoto} onChange={(event) => { void uploadPhoto(event.currentTarget.files); event.currentTarget.value = ""; }} /></label>
            </div>
            {form.coverUrl && <div className="mt-4 flex items-center gap-3 rounded-xl bg-white p-2"><div className="relative h-16 w-20 overflow-hidden rounded-lg bg-[#e8f2e9]"><Image src={form.coverUrl} alt="旅行照片预览" fill unoptimized sizes="80px" className="object-cover" /></div><span className="min-w-0 flex-1 truncate text-xs text-[#668274]">旅行照片已准备好</span><button type="button" onClick={() => setForm({ ...form, coverUrl: "" })} className="flex h-8 w-8 items-center justify-center rounded-full text-[#c45f3e] hover:bg-[#fff0e9]" aria-label="移除旅行照片"><X size={15} /></button></div>}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dbe8de] bg-[#f8fbf8] px-4 py-3 text-sm text-[#315844]"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm({ ...form, isPublic: event.target.checked })} className="mt-0.5 h-4 w-4 accent-[#138e5f]" /><span><span className="font-semibold">公开展示在博客地图</span><span className="mt-1 block text-xs leading-5 text-[#78907f]">关闭后只保存在后台，不会在访客页面显示精确地点。</span></span></label>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#e5eee6] pt-5"><button type="button" onClick={resetForm} className="rounded-full border border-[#cfe0d3] px-4 py-2.5 text-sm font-semibold text-[#668274] hover:bg-[#f1f7f2]">重置</button><button type="submit" disabled={saving || uploadingPhoto || geocoding.status === "loading"} className="inline-flex items-center gap-2 rounded-full bg-[#063b28] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b5136] disabled:cursor-not-allowed disabled:opacity-50"><Save size={15} />{saving ? "保存中…" : geocoding.status === "loading" ? "正在定位…" : editingId ? "保存旅行记忆" : "添加到旅行地图"}</button></div>
        </form>

        <aside className="rounded-[24px] border border-[#dbe8de] bg-[#f8fbf8] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><h3 className="font-heading text-xl font-semibold tracking-[-0.05em] text-[#063b28]">已保存的地点</h3><span className="text-xs text-[#78907f]">{memories.length} 条</span></div>
          <div className="mt-4 space-y-2">
            {memories.length > 0 ? memories.map((memory) => (
              <div key={memory.id} className={`rounded-2xl border p-3 ${editingId === memory.id ? "border-[#8fbe99] bg-[#e8f2e9]" : "border-[#dbe8de] bg-white"}`}>
                <div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e4f3eb] text-[#138e5f]"><MapPin size={15} /></span><button type="button" onClick={() => editMemory(memory)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-[#315844]">{memory.city}{memory.place ? ` · ${memory.place}` : ""}</p><p className="mt-1 text-[11px] text-[#78907f]">{formatDate(memory.visitedAt)} · {memory.isPublic ? "公开" : "私密"}</p><p className="mt-1 truncate text-[11px] text-[#91a89a]">{memory.latitude.toFixed(5)}, {memory.longitude.toFixed(5)}</p></button><div className="flex shrink-0 gap-1"><button type="button" onClick={() => editMemory(memory)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#668274] hover:bg-[#eef7ef]" aria-label={`编辑 ${memory.city}`}><Pencil size={14} /></button><button type="button" onClick={() => void removeMemory(memory)} disabled={removingId === memory.id} className="flex h-8 w-8 items-center justify-center rounded-full text-[#c45f3e] hover:bg-[#fff0e9] disabled:cursor-wait disabled:opacity-50" aria-label={`删除 ${memory.city}`}><Trash2 size={14} /></button></div></div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-[#b9d6bf] px-4 py-8 text-center text-sm leading-6 text-[#78907f]">这里还没有旅行记录。添加去过的城市和地点后，就能在前台地图中展示。</div>}
          </div>
        </aside>
      </div>
      {notice && <div className={`mx-5 mb-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm sm:mx-7 ${notice.type === "error" ? "bg-[#fff0e9] text-[#a65338]" : "bg-[#e2f2e3] text-[#4f8b5e]"}`}>{notice.type === "success" ? <Check size={16} /> : <UploadCloud size={16} />}{notice.text}</div>}
    </section>
  );
}
