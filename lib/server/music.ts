import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
  createdAt: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "music.json");

function ensureDataFile() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]\n", "utf8");
  }
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isMediaUrl(value: string) {
  return /^\/api\/media\/[A-Za-z0-9._-]+$/.test(value);
}

function normalizeTrack(value: unknown): MusicTrack | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const id = asText(record.id);
  const title = asText(record.title);
  const artist = asText(record.artist);
  const url = asText(record.url);
  const createdAt = asText(record.createdAt);
  if (!id || !title || !artist || !isMediaUrl(url) || !createdAt) return null;

  return { id, title, artist, url, createdAt };
}

export function readMusicTracks() {
  ensureDataFile();

  try {
    const value = JSON.parse(fs.readFileSync(dataFile, "utf8")) as unknown;
    if (!Array.isArray(value)) return [];

    return value
      .map(normalizeTrack)
      .filter((track): track is MusicTrack => track !== null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } catch {
    return [];
  }
}

export function writeMusicTracks(tracks: MusicTrack[]) {
  ensureDataFile();
  fs.writeFileSync(dataFile, `${JSON.stringify(tracks, null, 2)}\n`, "utf8");
}

export function createMusicTrack(input: { title: unknown; artist: unknown; url: unknown }): MusicTrack {
  const title = asText(input.title).slice(0, 100);
  const artist = asText(input.artist).slice(0, 100) || "黄志雄的音乐角";
  const url = asText(input.url);

  if (!title) throw new Error("请填写歌曲名称");
  if (!isMediaUrl(url)) throw new Error("音频地址无效");

  return {
    id: randomUUID(),
    title,
    artist,
    url,
    createdAt: new Date().toISOString(),
  };
}

export function mediaFileName(url: string) {
  const match = url.match(/^\/api\/media\/([A-Za-z0-9._-]+)$/);
  return match?.[1] ?? null;
}
