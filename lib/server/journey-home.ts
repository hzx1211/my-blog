import fs from "node:fs";
import path from "node:path";

export type JourneyHome = {
  label: string;
  city: string;
  place: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  updatedAt: string;
};

export class JourneyHomeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JourneyHomeValidationError";
  }
}

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "journey-home.json");

function ensureDataFile() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "null\n", "utf8");
  }
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseCoordinate(value: unknown, label: string, minimum: number, maximum: number) {
  const coordinate = typeof value === "number" ? value : Number(asText(value));
  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
    throw new JourneyHomeValidationError(`${label}需要在 ${minimum} 到 ${maximum} 之间`);
  }

  return Number(coordinate.toFixed(6));
}

function parseHome(input: unknown, includeUpdatedAt = false): Omit<JourneyHome, "updatedAt"> | JourneyHome {
  if (!input || typeof input !== "object") {
    throw new JourneyHomeValidationError("家的位置必须是 JSON 对象");
  }

  const record = input as Record<string, unknown>;
  const label = asText(record.label).slice(0, 30) || "家";
  const city = asText(record.city).slice(0, 60);
  const place = asText(record.place).slice(0, 100);
  if (!city) {
    throw new JourneyHomeValidationError("请填写家所在的城市或地区");
  }
  if (typeof record.isPublic !== "boolean") {
    throw new JourneyHomeValidationError("公开状态无效");
  }

  const home = {
    label,
    city,
    place,
    latitude: parseCoordinate(record.latitude, "纬度", -90, 90),
    longitude: parseCoordinate(record.longitude, "经度", -180, 180),
    isPublic: record.isPublic,
  };

  if (!includeUpdatedAt) return home;

  const updatedAt = asText(record.updatedAt);
  if (!updatedAt) throw new JourneyHomeValidationError("家的位置时间无效");
  return { ...home, updatedAt };
}

export function readJourneyHome() {
  ensureDataFile();

  try {
    const value = JSON.parse(fs.readFileSync(dataFile, "utf8")) as unknown;
    if (value === null) return null;
    return parseHome(value, true) as JourneyHome;
  } catch {
    return null;
  }
}

export function saveJourneyHome(input: unknown) {
  const home = {
    ...(parseHome(input) as Omit<JourneyHome, "updatedAt">),
    updatedAt: new Date().toISOString(),
  } satisfies JourneyHome;

  ensureDataFile();
  fs.writeFileSync(dataFile, `${JSON.stringify(home, null, 2)}\n`, "utf8");
  return home;
}

export function clearJourneyHome() {
  ensureDataFile();
  fs.writeFileSync(dataFile, "null\n", "utf8");
}
