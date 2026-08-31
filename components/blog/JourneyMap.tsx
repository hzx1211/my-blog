"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";

export type PublicJourneyMemory = {
  id: string;
  city: string;
  place: string;
  latitude: number;
  longitude: number;
  visitedAt: string | null;
  note: string;
  coverUrl: string | null;
};

export type PublicHomeLocation = {
  label: string;
  city: string;
  place: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  updatedAt: string;
};

const chinaCenter: [number, number] = [35.86166, 104.195397];

function formatDate(value: string | null) {
  if (!value) return "日期未记录";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function MapViewport({ memories, home }: { memories: PublicJourneyMemory[]; home: PublicHomeLocation | null }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...memories.map((memory) => [memory.latitude, memory.longitude] as [number, number]),
      ...(home ? [[home.latitude, home.longitude] as [number, number]] : []),
    ];

    if (points.length === 0) {
      map.setView(chinaCenter, 4, { animate: false });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 10, { animate: false });
      return;
    }

    map.fitBounds(points, {
      padding: [42, 42],
      maxZoom: 10,
      animate: false,
    });
  }, [map, memories, home]);

  return null;
}

export default function JourneyMap({ memories, home }: { memories: PublicJourneyMemory[]; home: PublicHomeLocation | null }) {
  const markerIcon = useMemo(
    () => L.divIcon({
      className: "journey-map-marker",
      html: "<span style=\"display:block;width:22px;height:22px;border:4px solid #fff;border-radius:999px;background:#138E5F;box-shadow:0 5px 16px rgba(4,39,24,.32)\"></span>",
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -12],
    }),
    [],
  );
  const homeIcon = useMemo(
    () => L.divIcon({
      className: "journey-home-marker",
      html: "<span style=\"display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:4px solid #fff;border-radius:14px;background:#042718;color:#fff;font-size:20px;font-weight:700;box-shadow:0 7px 20px rgba(4,39,24,.34)\">⌂</span>",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    }),
    [],
  );

  return (
    <MapContainer center={chinaCenter} zoom={4} minZoom={2} scrollWheelZoom={false} className="h-full w-full" aria-label="旅行足迹地图">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport memories={memories} home={home} />
      {home && (
        <Marker position={[home.latitude, home.longitude]} icon={homeIcon}>
          <Tooltip permanent direction="top" offset={[0, -18]}>{home.label} · {home.city}</Tooltip>
          <Popup>
            <div className="min-w-[11rem] font-sans text-[#042718]">
              <p className="font-semibold">{home.label} · {home.city}</p>
              {home.place && <p className="mt-1 text-sm text-[#668274]">{home.place}</p>}
              <p className="mt-2 text-xs text-[#668274]">这是单独设置的家的特殊标点。</p>
            </div>
          </Popup>
        </Marker>
      )}
      {memories.map((memory) => (
        <Marker key={memory.id} position={[memory.latitude, memory.longitude]} icon={markerIcon}>
          <Popup>
            <div className="min-w-[11rem] font-sans text-[#042718]">
              <p className="font-semibold">{memory.city}{memory.place ? ` · ${memory.place}` : ""}</p>
              <p className="mt-1 text-xs text-[#668274]">{formatDate(memory.visitedAt)}</p>
              {memory.note && <p className="mt-2 text-sm leading-5">{memory.note}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
