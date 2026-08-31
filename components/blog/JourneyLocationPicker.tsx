"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useMemo } from "react";

type JourneyLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
};

const chinaCenter: [number, number] = [35.86166, 104.195397];

function MapClickHandler({ onChange }: Pick<JourneyLocationPickerProps, "onChange">) {
  useMapEvents({
    click(event) {
      onChange(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)));
    },
  });

  return null;
}

function MapViewport({ latitude, longitude }: Pick<JourneyLocationPickerProps, "latitude" | "longitude">) {
  const map = useMap();

  useEffect(() => {
    if (latitude === null || longitude === null) return;
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 11), { animate: true, duration: 0.45 });
  }, [latitude, longitude, map]);

  return null;
}

export default function JourneyLocationPicker({ latitude, longitude, onChange }: JourneyLocationPickerProps) {
  const markerIcon = useMemo(
    () => L.divIcon({
      className: "journey-location-marker",
      html: "<span style=\"display:block;width:24px;height:24px;border:4px solid #fff;border-radius:999px;background:#e86f45;box-shadow:0 5px 16px rgba(87,35,18,.28)\"></span>",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
    [],
  );
  const hasCoordinate = latitude !== null && longitude !== null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dbe8de] bg-[#e8f2e9]">
      <div className="h-[230px] w-full sm:h-[280px]">
        <MapContainer center={chinaCenter} zoom={4} minZoom={2} className="h-full w-full" aria-label="旅行地点选点地图">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onChange={onChange} />
          <MapViewport latitude={latitude} longitude={longitude} />
          {hasCoordinate && (
            <Marker
              position={[latitude, longitude]}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const position = (event.target as L.Marker).getLatLng();
                  onChange(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="px-4 py-3 text-xs leading-5 text-[#668274]">在地图上点击或拖动橙色标记，即可记录准确坐标。地图只会保存你确认后的点位。</p>
    </div>
  );
}
