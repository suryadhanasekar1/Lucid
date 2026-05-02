import { NextResponse } from "next/server";
import { getMacroSnapshot } from "@/lib/macro/fred";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 60);

export async function GET(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "macro");
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const result = await getMacroSnapshot();
  return NextResponse.json(result);
}
