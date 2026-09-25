import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const apply = process.argv.includes("--apply");
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("缺少 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY（或 SUPABASE_SECRET_KEY）。");
  process.exit(1);
}

if (key.startsWith("sb_publishable_")) {
  console.error("SUPABASE_SECRET_KEY 配置成了 publishable key；请使用 sb_secret_ key 或 service_role key。");
  process.exit(1);
}

function adminFetch(apiKey) {
  if (!apiKey.startsWith("sb_secret_")) return fetch;

  // Opaque secret keys belong in `apikey`; they are not JWT Bearer tokens.
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    if (headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }
    return fetch(input, { ...init, headers });
  };
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: adminFetch(key) },
});
const bucket = "blog-media";
const sources = [
  ["posts", "posts.json"],
  ["journeys", "journeys.json"],
  ["journey_home", "journey-home.json"],
  ["music", "music.json"],
  ["resume", "resume.json"],
];
const mimeByExtension = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  wav: "audio/wav",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

function mediaNames(value, found = new Set()) {
  if (typeof value === "string") {
    const match = value.match(/^\/api\/media\/([A-Za-z0-9._-]+)$/);
    if (match) found.add(match[1]);
  } else if (Array.isArray(value)) {
    for (const item of value) mediaNames(item, found);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) mediaNames(item, found);
  }
  return found;
}

async function readDocuments() {
  return Promise.all(
    sources.map(async ([id, file]) => ({
      id,
      file,
      payload: JSON.parse(await readFile(path.join(root, "data", file), "utf8")),
    })),
  );
}

async function uploadMedia(fileName) {
  const extension = path.extname(fileName).slice(1).toLowerCase();
  const contentType = mimeByExtension[extension];
  if (!contentType) throw new Error(`不支持的媒体扩展名：${extension || "(无)"}`);

  const bytes = await readFile(path.join(root, "public", "uploads", fileName));
  const { error } = await supabase.storage.from(bucket).upload(fileName, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  // A prior run may have uploaded a file before failing to save its content row.
  if (error && error.statusCode !== "409" && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(`媒体上传失败（${fileName}）：${error.message}`);
  }

  return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
}

async function replaceLegacyMedia(value, uploaded) {
  if (typeof value === "string") {
    const match = value.match(/^\/api\/media\/([A-Za-z0-9._-]+)$/);
    return match ? uploaded.get(match[1]) : value;
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => replaceLegacyMedia(item, uploaded)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value).map(async ([keyName, item]) => [
          keyName,
          await replaceLegacyMedia(item, uploaded),
        ]),
      ),
    );
  }
  return value;
}

try {
  const documents = await readDocuments();
  const existingKeys = new Set();
  for (const { id } of documents) {
    const { data, error } = await supabase
      .from("blog_content")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`读取 Supabase 内容失败：${error.message}`);
    if (data) existingKeys.add(id);
  }

  const pending = documents.filter(({ id }) => !existingKeys.has(id));
  const files = new Set(pending.flatMap(({ payload }) => [...mediaNames(payload)]));
  console.log(`内容记录：${documents.length}；将新增：${pending.length}；线上已有、不会覆盖：${existingKeys.size}。`);
  console.log(`需要迁移的旧媒体文件：${files.size}。`);

  if (!apply) {
    console.log("当前为预览模式，没有写入数据。确认后运行：npm run supabase:import -- --apply");
    process.exit(0);
  }

  const uploaded = new Map();
  for (const fileName of files) uploaded.set(fileName, await uploadMedia(fileName));

  for (const document of pending) {
    const payload = await replaceLegacyMedia(document.payload, uploaded);
    const { error } = await supabase.from("blog_content").insert({
      id: document.id,
      payload,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`写入 ${document.file} 失败：${error.message}`);
    console.log(`已导入：${document.file}`);
  }

  console.log("导入完成。脚本不会覆盖 Supabase 中已有的内容记录。");
} catch (error) {
  console.error(error instanceof Error ? error.message : "导入失败");
  process.exitCode = 1;
}

