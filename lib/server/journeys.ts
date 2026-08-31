import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type JourneyMemory = {
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

export type JourneyPayload = Omit<JourneyMemory, "id" | "createdAt" | "updatedAt">;

export class JourneyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JourneyValidationError";
  }
}

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "journeys.json");

function ensureDataFile() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]\n", "utf8");
  }
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseCoordinate(value: unknown, label: string, minimum: number, maximum: number) {
  const coordinate = typeof value === "number" ? value : Number(asText(value));
  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
    throw new JourneyValidationError(`${label}需要在 ${minimum} 到 ${maximum} 之间`);
  }

  return Number(coordinate.toFixed(6));
}

function parseCoverUrl(value: unknown) {
  const url = asText(value);
  if (!url) return null;
  if (!/^\/api\/media\/[A-Za-z0-9._-]+$/.test(url)) {
    throw new JourneyValidationError("旅行照片地址无效");
  }

  return url;
}

function parsePayload(input: unknown): JourneyPayload {
  if (!input || typeof input !== "object") {
    throw new JourneyValidationError("请求体必须是 JSON 对象");
  }

  const record = input as Record<string, unknown>;
  const city = asText(record.city).slice(0, 60);
  const place = asText(record.place).slice(0, 100);
  const note = asText(record.note).slice(0, 360);
  const visitedAtValue = asText(record.visitedAt);

  if (!city) {
    throw new JourneyValidationError("请填写城市");
  }
  if (visitedAtValue && !isDate(visitedAtValue)) {
    throw new JourneyValidationError("日期格式无效");
  }
  if (typeof record.isPublic !== "boolean") {
    throw new JourneyValidationError("公开状态无效");
  }

  return {
    city,
    place,
    latitude: parseCoordinate(record.latitude, "纬度", -90, 90),
    longitude: parseCoordinate(record.longitude, "经度", -180, 180),
    visitedAt: visitedAtValue || null,
    note,
    coverUrl: parseCoverUrl(record.coverUrl),
    isPublic: record.isPublic,
  };
}

function normalizeJourney(value: unknown): JourneyMemory | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const id = asText(record.id);
  const createdAt = asText(record.createdAt);
  const updatedAt = asText(record.updatedAt);
  if (!id || !createdAt || !updatedAt) return null;

  try {
    return {
      id,
      ...parsePayload(record),
      createdAt,
      updatedAt,
    };
  } catch {
    return null;
  }
}

function sortJourneys(items: JourneyMemory[]) {
  return [...items].sort((left, right) => {
    const leftDate = left.visitedAt ?? left.updatedAt.slice(0, 10);
    const rightDate = right.visitedAt ?? right.updatedAt.slice(0, 10);
    return rightDate.localeCompare(leftDate) || right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function readJourneys() {
  ensureDataFile();

  try {
    const value = JSON.parse(fs.readFileSync(dataFile, "utf8")) as unknown;
    if (!Array.isArray(value)) return [];
    return sortJourneys(value.map(normalizeJourney).filter((item): item is JourneyMemory => item !== null));
  } catch {
    return [];
  }
}

export function writeJourneys(items: JourneyMemory[]) {
  ensureDataFile();
  fs.writeFileSync(dataFile, `${JSON.stringify(sortJourneys(items), null, 2)}\n`, "utf8");
}

export function listJourneys(options: { publicOnly?: boolean } = {}) {
  return readJourneys().filter((item) => !options.publicOnly || item.isPublic);
}

export function getJourneyById(id: string) {
  return readJourneys().find((item) => item.id === id) ?? null;
}

export function createJourney(input: unknown): JourneyMemory {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    ...parsePayload(input),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateJourney(existing: JourneyMemory, input: unknown): JourneyMemory {
  return {
    ...existing,
    ...parsePayload(input),
    updatedAt: new Date().toISOString(),
  };
}
