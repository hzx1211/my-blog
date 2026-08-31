import { NextResponse } from "next/server";

type AMapResponse = {
  status?: string;
  info?: string;
  infocode?: string;
  geocodes?: Array<{
    formatted_address?: string;
    location?: string;
  }>;
};

const PI = Math.PI;
const AXIS = 6378245.0;
const OFFSET = 0.00669342162296594323;

function isOutsideChina(longitude: number, latitude: number) {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271;
}

function transformLatitude(longitude: number, latitude: number) {
  let value = -100 + 2 * longitude + 3 * latitude + 0.2 * latitude * latitude + 0.1 * longitude * latitude + 0.2 * Math.sqrt(Math.abs(longitude));
  value += (20 * Math.sin(6 * longitude * PI) + 20 * Math.sin(2 * longitude * PI)) * (2 / 3);
  value += (20 * Math.sin(latitude * PI) + 40 * Math.sin((latitude / 3) * PI)) * (2 / 3);
  value += (160 * Math.sin((latitude / 12) * PI) + 320 * Math.sin((latitude * PI) / 30)) * (2 / 3);
  return value;
}

function transformLongitude(longitude: number, latitude: number) {
  let value = 300 + longitude + 2 * latitude + 0.1 * longitude * longitude + 0.1 * longitude * latitude + 0.1 * Math.sqrt(Math.abs(longitude));
  value += (20 * Math.sin(6 * longitude * PI) + 20 * Math.sin(2 * longitude * PI)) * (2 / 3);
  value += (20 * Math.sin(longitude * PI) + 40 * Math.sin((longitude / 3) * PI)) * (2 / 3);
  value += (150 * Math.sin((longitude / 12) * PI) + 300 * Math.sin((longitude / 30) * PI)) * (2 / 3);
  return value;
}

/** Convert AMap's domestic GCJ-02 result to WGS-84 for the OSM Leaflet map. */
function gcj02ToWgs84(longitude: number, latitude: number) {
  if (isOutsideChina(longitude, latitude)) return { longitude, latitude };

  const latitudeDelta = transformLatitude(longitude - 105, latitude - 35);
  const longitudeDelta = transformLongitude(longitude - 105, latitude - 35);
  const latitudeRadians = (latitude / 180) * PI;
  const magic = 1 - OFFSET * Math.sin(latitudeRadians) ** 2;
  const sqrtMagic = Math.sqrt(magic);
  const adjustedLatitude = (latitudeDelta * 180) / (((AXIS * (1 - OFFSET)) / (magic * sqrtMagic)) * PI);
  const adjustedLongitude = (longitudeDelta * 180) / ((AXIS / sqrtMagic) * Math.cos(latitudeRadians) * PI);
  const convertedLatitude = latitude + adjustedLatitude;
  const convertedLongitude = longitude + adjustedLongitude;

  return {
    longitude: longitude * 2 - convertedLongitude,
    latitude: latitude * 2 - convertedLatitude,
  };
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const city = searchParams.get("city")?.trim() ?? "";
  const place = searchParams.get("place")?.trim() ?? "";
  const query = [city, place].filter(Boolean).join(" ") || searchParams.get("q")?.trim() || "";
  if (query.length < 2 || query.length > 160) {
    return NextResponse.json({ message: "请输入有效的城市或地点" }, { status: 400 });
  }

  const apiKey = process.env.AMAP_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ message: "尚未配置 AMAP_API_KEY，请先在 .env.local 中填写高德 Web 服务 Key" }, { status: 503 });
  }

  const url = new URL("https://restapi.amap.com/v3/geocode/geo");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("address", query);
  url.searchParams.set("output", "JSON");
  if (city) url.searchParams.set("city", city);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return NextResponse.json({ message: "高德地理编码服务暂时不可用，请稍后重试或直接在地图上选点" }, { status: 502 });
    }

    const data = (await response.json()) as AMapResponse;
    if (data.status !== "1") {
      const invalidKey = data.infocode === "10001" || data.info?.toLowerCase().includes("key");
      return NextResponse.json(
        { message: invalidKey ? "高德 Web 服务 Key 无效或未开通地理编码权限，请检查 AMAP_API_KEY" : "高德地理编码服务暂时不可用，请稍后重试" },
        { status: invalidKey ? 503 : 502 },
      );
    }

    const first = data.geocodes?.[0];
    const [longitudeValue, latitudeValue] = first?.location?.split(",") ?? [];
    const amapLatitude = Number(latitudeValue);
    const amapLongitude = Number(longitudeValue);
    if (!first || !Number.isFinite(amapLatitude) || !Number.isFinite(amapLongitude)) {
      return NextResponse.json({ message: "没有找到这个地点，请检查城市和地点名称" }, { status: 404 });
    }

    const { latitude, longitude } = gcj02ToWgs84(amapLongitude, amapLatitude);

    return NextResponse.json(
      {
        item: {
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
          displayName: first.formatted_address || query,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ message: "无法连接高德地理编码服务，请稍后重试或直接在地图上选点" }, { status: 502 });
  }
}
