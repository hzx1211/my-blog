"use client";

import dynamic from "next/dynamic";
import { Check, Crosshair, House, LoaderCircle, MapPin, Save, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { type LocationGeocodeResult, useLocationGeocoder } from "./useLocationGeocoder";

const JourneyLocationPicker = dynamic(() => import("./JourneyLocationPicker"), {
  ssr: false,
  loading: () => <div className="flex h-[230px] items-center justify-center rounded-2xl bg-[#e8f2e9] text-sm text-[#668274] sm:h-[280px]">正在加载地图选点器…</div>,
});

type HomeLocation = {
  label: string;
  city: string;
  place: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  updatedAt: string;
};

type HomeForm = {
  label: string;
  city: string;
  place: string;
  latitude: string;
  longitude: string;
  isPublic: boolean;
};

const blankForm: HomeForm = {
  label: "家",
  city: "",
  place: "",
  latitude: "",
  longitude: "",
  isPublic: false,
};

const fieldClassName = "mt-2 w-full rounded-2xl border border-[#dbe8de] bg-white px-4 py-3 text-sm text-[#214b35] outline-none transition-colors placeholder:text-[#a3b6a8] focus:border-[#65a978] focus:ring-2 focus:ring-[#dcefdc]";

function formFromHome(home: HomeLocation): HomeForm {
  return {
    label: home.label,
    city: home.city,
    place: home.place,
    latitude: String(home.latitude),
    longitude: String(home.longitude),
    isPublic: home.isPublic,
  };
}

function coordinate(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function responseMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message || "请求失败，请稍后重试";
  } catch {
    return "请求失败，请稍后重试";
  }
}

export default function HomeLocationManager() {
  const [home, setHome] = useState<HomeLocation | null>(null);
  const [form, setForm] = useState<HomeForm>(blankForm);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [removing, setRemoving] = useState(false);
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

  const loadHome = useCallback(async () => {
    const response = await fetch("/api/admin/journey-home", { cache: "no-store" });
    if (!response.ok) throw new Error(await responseMessage(response));
    const data = (await response.json()) as { item: HomeLocation | null };
    locationInputTouchedRef.current = false;
    setHome(data.item);
    setForm(data.item ? formFromHome(data.item) : blankForm);
  }, []);

  useEffect(() => {
    void loadHome().catch((error) => setNotice({ type: "error", text: error instanceof Error ? error.message : "家的位置加载失败" }));
  }, [loadHome]);

  const latitude = coordinate(form.latitude);
  const longitude = coordinate(form.longitude);

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
      setNotice({ type: "error", text: "当前浏览器不支持定位，请在地图上点击一个适合公开的位置。" });
      return;
    }

    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates(position.coords.latitude, position.coords.longitude);
        setLocating(false);
        setNotice({ type: "success", text: "已填入当前位置。若要公开，请确认这不是精确住址。" });
      },
      () => {
        setLocating(false);
        setNotice({ type: "error", text: "无法取得当前位置。请允许定位权限，或直接在地图上点击位置。" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  async function saveHome(event: FormEvent<HTMLFormElement>) {
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
      const response = await fetch("/api/admin/journey-home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          city: form.city,
          place: form.place,
          latitude: nextLatitude,
          longitude: nextLongitude,
          isPublic: form.isPublic,
        }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));

      const data = (await response.json()) as { item: HomeLocation };
      locationInputTouchedRef.current = false;
      setHome(data.item);
      setForm(formFromHome(data.item));
      window.dispatchEvent(new Event("journey-home-changed"));
      setNotice({ type: "success", text: data.item.isPublic ? "家的特殊标点已显示在博客地图" : "家的位置已保存，但暂不公开到博客地图" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "家的位置保存失败" });
    } finally {
      setSaving(false);
    }
  }

  async function clearHome() {
    if (!home || !window.confirm("确定移除地图上的家的特殊标点吗？后台记录也会一并清除。")) return;

    setRemoving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/journey-home", { method: "DELETE" });
      if (!response.ok) throw new Error(await responseMessage(response));

      setHome(null);
      locationInputTouchedRef.current = false;
      setForm(blankForm);
      window.dispatchEvent(new Event("journey-home-changed"));
      setNotice({ type: "success", text: "家的特殊标点已移除" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "移除家的位置失败" });
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="mb-5 overflow-hidden rounded-[2rem] border border-[#dbe8de] bg-white shadow-[0_6px_24px_rgba(6,59,40,0.04)]">
      <div className="flex flex-col gap-4 border-b border-[#e5eee6] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#063b28] text-white"><House size={20} /></span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e86f45]">home marker</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-[-0.06em] text-[#063b28]">家的特殊标点</h2>
            <p className="mt-1 text-xs leading-5 text-[#78907f]">它不是旅行打卡，会以深色小屋图标单独显示在地图上。建议选城市或社区附近位置，不要公开精确住址。</p>
          </div>
        </div>
        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${home?.isPublic ? "bg-[#e2f2e3] text-[#4f8b5e]" : "bg-[#f1f7f2] text-[#668274]"}`}>{home ? home.isPublic ? "已公开" : "已保存为私密" : "尚未设置"}</span>
      </div>

      <div className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)] sm:px-7 sm:py-7">
        <form className="space-y-5" onSubmit={saveHome}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#315844]">标点名称<input required value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} maxLength={30} className={fieldClassName} placeholder="家" /></label>
            <label className="text-sm font-semibold text-[#315844]">所在城市 / 地区<input required value={form.city} onChange={(event) => updateLocationField("city", event.target.value)} maxLength={60} className={fieldClassName} placeholder="例如：惠州" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#315844]">补充地点（可选）<input value={form.place} onChange={(event) => updateLocationField("place", event.target.value)} maxLength={100} className={fieldClassName} placeholder="建议填写城市/社区，不填门牌号" /></label>
            <div className="mt-[27px]"><button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#cfe0d3] bg-[#f8fbf8] px-4 py-3 text-sm font-semibold text-[#315844] transition hover:bg-[#eef7ef] disabled:cursor-wait disabled:opacity-60">{locating ? <LoaderCircle size={16} className="animate-spin" /> : <Crosshair size={16} />}{locating ? "正在定位…" : "使用当前位置"}</button></div>
          </div>
          <div aria-live="polite" className="-mt-2 min-h-5 text-xs leading-5">
            {geocoding.status === "loading" && <span className="inline-flex items-center gap-1.5 text-[#668274]"><LoaderCircle size={13} className="animate-spin" />正在根据城市和地点查找坐标…</span>}
            {geocoding.status === "success" && <span className="text-[#4f8b5e]">已自动填入坐标{geocoding.displayName ? `（${geocoding.displayName}）` : ""}，可在地图上微调。</span>}
            {geocoding.status === "error" && <span className="inline-flex flex-wrap items-center gap-2 text-[#a65338]"><span>{geocoding.errorMessage || "没有找到准确地点，请检查名称，或直接在地图上选点。"}</span><button type="button" onClick={geocoding.retry} className="font-semibold underline underline-offset-2">重试</button></span>}
          </div>
          <JourneyLocationPicker latitude={latitude} longitude={longitude} onChange={setCoordinates} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#315844]">纬度<input required type="number" step="0.000001" min={-90} max={90} value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))} className={fieldClassName} placeholder="城市和地点会自动填入" /></label>
            <label className="text-sm font-semibold text-[#315844]">经度<input required type="number" step="0.000001" min={-180} max={180} value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))} className={fieldClassName} placeholder="城市和地点会自动填入" /></label>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dbe8de] bg-[#f8fbf8] px-4 py-3 text-sm text-[#315844]"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm({ ...form, isPublic: event.target.checked })} className="mt-0.5 h-4 w-4 accent-[#138e5f]" /><span><span className="font-semibold">公开这个特殊标点到博客地图</span><span className="mt-1 block text-xs leading-5 text-[#78907f]">若勾选，访客可见标点和城市名称；请优先选附近公共地点或城市中心。</span></span></label>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#e5eee6] pt-5"><button type="button" onClick={() => { locationInputTouchedRef.current = false; setForm(home ? formFromHome(home) : blankForm); setNotice(null); }} className="rounded-full border border-[#cfe0d3] px-4 py-2.5 text-sm font-semibold text-[#668274] hover:bg-[#f1f7f2]">重置</button><button type="submit" disabled={saving || geocoding.status === "loading"} className="inline-flex items-center gap-2 rounded-full bg-[#063b28] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b5136] disabled:cursor-not-allowed disabled:opacity-50"><Save size={15} />{saving ? "保存中…" : geocoding.status === "loading" ? "正在定位…" : "保存家的标点"}</button></div>
        </form>

        <aside className="flex min-h-[240px] flex-col justify-between rounded-[24px] border border-[#dbe8de] bg-[#f8fbf8] p-5">
          {home ? <div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#063b28] text-white"><House size={22} /></span><p className="mt-5 text-lg font-semibold text-[#063b28]">{home.label} · {home.city}</p><p className="mt-1 text-sm text-[#668274]">{home.place || "未填写补充地点"}</p><p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#78907f]"><MapPin size={13} />{home.latitude.toFixed(5)}, {home.longitude.toFixed(5)}</p></div> : <div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4f3eb] text-[#138e5f]"><House size={22} /></span><p className="mt-5 text-lg font-semibold text-[#063b28]">尚未设置家的标点</p><p className="mt-2 text-sm leading-6 text-[#668274]">保存后，它会在旅行地图中以不同于旅行打卡的深色小屋图标出现。</p></div>}
          <button type="button" onClick={() => void clearHome()} disabled={!home || removing} className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#f2b39a] px-4 py-2 text-xs font-semibold text-[#c45f3e] hover:bg-[#fff0e9] disabled:cursor-not-allowed disabled:opacity-45"><Trash2 size={14} />{removing ? "移除中…" : "移除家的标点"}</button>
        </aside>
      </div>
      {notice && <div className={`mx-5 mb-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm sm:mx-7 ${notice.type === "error" ? "bg-[#fff0e9] text-[#a65338]" : "bg-[#e2f2e3] text-[#4f8b5e]"}`}>{notice.type === "success" ? <Check size={16} /> : <MapPin size={16} />}{notice.text}</div>}
    </section>
  );
}
