import { NextResponse } from "next/server";
import { getTrendingHeadlines } from "@/lib/news/client";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 60);

export async function GET(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "news_trending");
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const { headlines, source } = await getTrendingHeadlines();
  return NextResponse.json({ headlines, source });
}
