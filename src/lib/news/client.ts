import { promises as fs } from "node:fs";
import path from "node:path";
import type { Headline } from "@/types";

/**
 * NewsAPI client. Falls back to the seeded `public/data/news.json` set when
 * NEWSAPI_KEY is missing or the live call fails — never throws.
 */

const CACHE_FILE = path.join(process.cwd(), "public", "data", "news.json");
const TTL_MS = Number(process.env.NEWS_CACHE_TTL ?? 1800) * 1000;

interface NewsApiResponse {
  status: string;
  articles?: Array<{
    source?: { name?: string };
    title?: string;
    url?: string;
    publishedAt?: string;
  }>;
}

interface DiskShape {
  fetchedAt: string;
  headlines: Headline[];
}

let memCache: { headlines: Headline[]; fetchedAt: number } | null = null;

export async function getTrendingHeadlines(): Promise<{
  headlines: Headline[];
  source: "newsapi" | "cache" | "fallback";
}> {
  const now = Date.now();
  if (memCache && now - memCache.fetchedAt < TTL_MS) {
    return { headlines: memCache.headlines, source: "cache" };
  }

  const apiKey = process.env.NEWSAPI_KEY;
  if (apiKey) {
    const live = await fetchNewsApi(apiKey);
    if (live && live.length > 0) {
      memCache = { headlines: live, fetchedAt: now };
      return { headlines: live, source: "newsapi" };
    }
  }

  const fromDisk = await loadDisk();
  if (fromDisk) {
    memCache = { headlines: fromDisk.headlines, fetchedAt: now };
    return { headlines: fromDisk.headlines, source: "fallback" };
  }
  return { headlines: [], source: "fallback" };
}

async function fetchNewsApi(apiKey: string): Promise<Headline[] | null> {
  const url = `https://newsapi.org/v2/top-headlines?country=us&category=business&pageSize=10&apiKey=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as NewsApiResponse;
    if (json.status !== "ok" || !Array.isArray(json.articles)) return null;
    return json.articles
      .filter((a) => a.title && a.url && a.publishedAt)
      .slice(0, 8)
      .map((a, idx) => ({
        id: stableId(a.url ?? String(idx)),
        title: a.title!,
        source: a.source?.name ?? "Unknown",
        url: a.url!,
        publishedAt: a.publishedAt!,
      }));
  } catch {
    return null;
  }
}

async function loadDisk(): Promise<DiskShape | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw) as DiskShape;
  } catch {
    return null;
  }
}

function stableId(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return `h${Math.abs(h)}`;
}
