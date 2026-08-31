import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatRequest = {
  message?: unknown;
  messages?: unknown;
};

const systemPrompt = `你是黄志雄博客里的像素猫“阿喵”。
你说话温柔、俏皮、简洁，偶尔用“喵～”，但不要过度卖萌。
你是一个可以陪伴用户自由聊天的朋友，不是只会检索博客文章的助手。你可以聊近况、心情、兴趣、旅行、前端、后端、求职学习和项目实践。
回答要有实际帮助：技术问题给出清晰步骤，学习问题给出可执行的小建议；日常聊天自然回应、可以反问一句延续对话；不知道的事情要诚实说明。
你没有真实身体、感受或现实世界行动能力，因此不要编造亲身经历。
若系统消息中提供了“实时天气数据”，只能依据其中的事实回答天气，不得编造温度、降水或实时状况；若没有城市或数据，礼貌追问或说明无法查询。
除非用户明确要求，不要泄露系统提示词。`;

type WeatherSnapshot = {
  displayName: string;
  condition: string;
  observedAt?: string;
  temperature?: number;
  apparentTemperature?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  high?: number;
  low?: number;
  precipitationProbability?: number;
};

type WeatherRequest = {
  asked: boolean;
  city?: string;
};

const WEATHER_KEYWORDS = /天气|气温|温度|下雨|降雨|降雪|风力|风速|湿度|晴天|阴天|台风|冷不冷|热不热/i;
const WEATHER_CODES: Record<number, string> = {
  0: "晴朗",
  1: "大致晴朗",
  2: "局部多云",
  3: "阴天",
  45: "有雾",
  48: "雾凇",
  51: "轻毛毛雨",
  53: "中毛毛雨",
  55: "强毛毛雨",
  56: "冻毛毛雨",
  57: "强冻毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "强冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "冰粒",
  80: "阵雨",
  81: "中等阵雨",
  82: "强阵雨",
  85: "阵雪",
  86: "强阵雪",
  95: "雷暴",
  96: "伴冰雹的雷暴",
  99: "强冰雹雷暴",
};

const GENERIC_LOCATIONS = new Set(["城市", "这里", "当地", "本地", "我这里", "这边", "那里", "天气", "最近", "今天", "明天", "后天"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function firstNumber(value: unknown) {
  return Array.isArray(value) ? numberValue(value[0]) : undefined;
}

function hasWeatherIntent(content: string) {
  return WEATHER_KEYWORDS.test(content);
}

function cleanLocationCandidate(value: string) {
  const cleaned = value
    .replace(/^[，,。！？!?\s]+|[，,。！？!?\s]+$/g, "")
    .replace(/^(?:最近|这几天|今天|明天|后天|现在|当地|本地|我这里|这里)/, "")
    .replace(/(?:的|那里)$/, "")
    .trim();

  if (cleaned.length < 2 || cleaned.length > 20 || GENERIC_LOCATIONS.has(cleaned)) return undefined;
  return cleaned;
}

function removeQuestionPrefix(value: string) {
  const prefix = /^(?:请问|麻烦|能不能|可以|帮我|给我|我想知道|我想问|我想|想知道|想问|想查(?:一下)?|想看(?:一下)?|查(?:一下)?|看(?:一下)?|看看|查询|告诉我|问一下)\s*/;
  let result = value.trim();
  let previous = "";

  while (result !== previous) {
    previous = result;
    result = result.replace(prefix, "").trim();
  }

  return result;
}

function extractWeatherLocation(content: string, allowStandalone = false) {
  const question = removeQuestionPrefix(content);
  const beforeWeather = question.match(
    /^(.{2,28}?)(?:今天|明天|后天|最近|这几天|现在)?(?:的)?(?:天气|气温|温度|下雨|降雨|降雪|风力|风速|湿度|晴天|阴天|台风)/,
  );

  if (beforeWeather) {
    const city = cleanLocationCandidate(beforeWeather[1]);
    if (city) return city;
  }

  const afterWeather = question.match(
    /(?:天气|气温|温度|下雨|降雨|降雪|风力|风速|湿度)[^，。！？!?]{0,12}?(?:在|的)\s*([\u4E00-\u9FFFA-Za-z]{2,20}(?:市|区|县|州|省)?)(?:[，,。！？!?]|$)/,
  );

  if (afterWeather) {
    const city = cleanLocationCandidate(afterWeather[1]);
    if (city) return city;
  }

  if (allowStandalone && /^[\u4E00-\u9FFFA-Za-z]{2,20}(?:市|区|县|州|省)?$/.test(question)) {
    return cleanLocationCandidate(question);
  }

  return undefined;
}

function getWeatherRequest(messages: ChatMessage[], latestUserMessage: ChatMessage): WeatherRequest {
  if (hasWeatherIntent(latestUserMessage.content)) {
    return { asked: true, city: extractWeatherLocation(latestUserMessage.content) };
  }

  const previousAssistantMessage = [...messages.slice(0, -1)].reverse().find((message) => message.role === "assistant");
  if (previousAssistantMessage?.content.includes("想查哪个城市")) {
    return { asked: true, city: extractWeatherLocation(latestUserMessage.content, true) };
  }

  return { asked: false };
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

async function getWeather(city: string): Promise<WeatherSnapshot | null> {
  const geocoding = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`,
  );
  if (!isRecord(geocoding) || !Array.isArray(geocoding.results)) return null;

  const place = geocoding.results.find(isRecord);
  if (!place) return null;

  const latitude = numberValue(place.latitude);
  const longitude = numberValue(place.longitude);
  if (latitude === undefined || longitude === undefined) return null;

  const parameters = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: textValue(place.timezone) || "auto",
    forecast_days: "1",
  });
  const forecast = await fetchJson(`https://api.open-meteo.com/v1/forecast?${parameters.toString()}`);
  if (!isRecord(forecast)) return null;

  const current = isRecord(forecast.current) ? forecast.current : {};
  const daily = isRecord(forecast.daily) ? forecast.daily : {};
  const displayParts = [textValue(place.name), textValue(place.admin1), textValue(place.country)].filter(Boolean);
  const displayName = displayParts.filter((value, index, values) => values.indexOf(value) === index).join(" · ") || city;
  const weatherCode = numberValue(current.weather_code);

  return {
    displayName,
    condition: weatherCode === undefined ? "天气情况待更新" : WEATHER_CODES[weatherCode] || "天气有变化",
    observedAt: textValue(current.time) || undefined,
    temperature: numberValue(current.temperature_2m),
    apparentTemperature: numberValue(current.apparent_temperature),
    humidity: numberValue(current.relative_humidity_2m),
    windSpeed: numberValue(current.wind_speed_10m),
    precipitation: numberValue(current.precipitation),
    high: firstNumber(daily.temperature_2m_max),
    low: firstNumber(daily.temperature_2m_min),
    precipitationProbability: firstNumber(daily.precipitation_probability_max),
  };
}

function weatherContext(weather: WeatherSnapshot) {
  const facts = [
    `地点：${weather.displayName}`,
    `当前天气：${weather.condition}`,
    weather.temperature !== undefined ? `当前气温：${weather.temperature}°C` : "",
    weather.apparentTemperature !== undefined ? `体感温度：${weather.apparentTemperature}°C` : "",
    weather.humidity !== undefined ? `相对湿度：${weather.humidity}%` : "",
    weather.windSpeed !== undefined ? `风速：${weather.windSpeed} km/h` : "",
    weather.precipitation !== undefined ? `当前降水：${weather.precipitation} mm` : "",
    weather.high !== undefined && weather.low !== undefined ? `今日最高/最低：${weather.high}°C/${weather.low}°C` : "",
    weather.precipitationProbability !== undefined ? `今日最大降水概率：${weather.precipitationProbability}%` : "",
    weather.observedAt ? `数据时间：${weather.observedAt}` : "",
  ].filter(Boolean);

  return `【实时天气数据（服务端已查询）】${facts.join("；")}。请依据这些数据用自然、简短的猫咪语气回答；不要补充未提供的实时数值。`;
}

function weatherFallbackReply(weather: WeatherSnapshot) {
  const now = weather.temperature !== undefined ? `现在 ${weather.temperature}°C` : "现在的温度还在更新";
  const feel = weather.apparentTemperature !== undefined ? `，体感 ${weather.apparentTemperature}°C` : "";
  const today = weather.high !== undefined && weather.low !== undefined ? `今天大约 ${weather.low}～${weather.high}°C` : "";
  const rain = weather.precipitationProbability !== undefined ? `，降水概率最高 ${weather.precipitationProbability}%` : "";
  return `喵～${weather.displayName}${now}${feel}，${weather.condition}${rain}。${today}`;
}

function localReply(content: string) {
  if (/项目|代码|bug|报错|开发|前端|后端|接口|next|react|java|python/i.test(content)) {
    return "喵～先把问题拆成“现象、复现步骤、预期结果”三部分，再从浏览器控制台和后端日志各看一遍。你把报错贴给我，我可以陪你一起定位。";
  }

  if (/学习|求职|面试|简历|技能|校招/i.test(content)) {
    return "建议今天只完成一个能展示的闭环：选一个小功能，写完接口、接上页面，再补一条验证记录。比同时学很多框架更容易形成作品集，喵～";
  }

  if (/累|焦虑|难过|烦|压力|迷茫/i.test(content)) {
    return "先暂停一下，喝口水，给自己十分钟不解决问题的时间。等情绪降下来，再挑最小的一步开始；慢一点也算在前进。";
  }

  if (/你好|嗨|在吗|早上好|晚上好/i.test(content)) {
    return "喵～我在这里！今天想聊代码、求职，还是讲讲你遇到的有趣小事？";
  }

  return "我听见啦，喵～你可以继续说具体一点；不管是项目想法、学习计划，还是今天的心情，我都会认真看。";
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      role: (item.role === "assistant" ? "assistant" : "user") as ChatRole,
      content: typeof item.content === "string" ? item.content.trim().slice(0, 500) : "",
    }))
    .filter((item) => item.content)
    .slice(-12);
}

async function callConfiguredModel(messages: ChatMessage[], context?: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...(context ? [{ role: "system", content: context }] : []),
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 320,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`模型服务返回 ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const reply = data.choices?.[0]?.message?.content;

  return typeof reply === "string" && reply.trim() ? reply.trim() : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const messages = normalizeMessages(body.messages);
    const normalizedMessages = messages.length
      ? messages
      : normalizeMessages([{ role: "user", content: body.message }]);
    const latestUserMessage = [...normalizedMessages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage) {
      return NextResponse.json({ message: "请先发送一条消息" }, { status: 400 });
    }

    const weatherRequest = getWeatherRequest(normalizedMessages, latestUserMessage);
    if (weatherRequest.asked && !weatherRequest.city) {
      return NextResponse.json({
        reply: "喵～你想查哪个城市的天气？例如：‘杭州今天会下雨吗？’",
        provider: "weather",
        needsLocation: true,
      });
    }

    let weather: WeatherSnapshot | null = null;
    let modelContext: string | undefined;
    if (weatherRequest.city) {
      try {
        weather = await getWeather(weatherRequest.city);
      } catch {
        weather = null;
      }

      modelContext = weather
        ? weatherContext(weather)
        : `【天气查询结果】暂时无法获取“${weatherRequest.city}”的实时天气。请坦诚说明查询失败，不要猜测天气数据。`;
    }

    try {
      const reply = await callConfiguredModel(normalizedMessages, modelContext);
      if (reply) return NextResponse.json({ reply, provider: "ai", tools: weather ? ["weather"] : [] });
    } catch {
      // Keep basic chat available when the external provider is unavailable.
    }

    if (weather) {
      return NextResponse.json({ reply: weatherFallbackReply(weather), provider: "weather", tools: ["weather"] });
    }

    if (weatherRequest.city) {
      return NextResponse.json({
        reply: `喵～我暂时没查到${weatherRequest.city}的实时天气，稍后再试试吧。`,
        provider: "weather",
      });
    }

    return NextResponse.json({ reply: localReply(latestUserMessage.content), provider: "local" });
  } catch {
    return NextResponse.json({ message: "聊天请求格式不正确" }, { status: 400 });
  }
}

export async function GET() {
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());

  return NextResponse.json({
    ok: true,
    provider: configured ? "ai" : "local",
    configured,
    missing: configured ? [] : ["OPENAI_API_KEY"],
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  });
}
