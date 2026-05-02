import { NextResponse } from "next/server";
import crypto from "node:crypto";

/**
 * SnapTrade webhook receiver. Verifies HMAC and acknowledges.
 *
 * SnapTrade signs the raw request body with the consumer key. We compute the
 * same HMAC-SHA256 and compare in constant time. Any mismatch → 401.
 */
export async function POST(req: Request) {
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;
  if (!consumerKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const signature = req.headers.get("signature") ?? req.headers.get("x-snaptrade-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }

  const raw = await req.text();
  const expected = crypto
    .createHmac("sha256", consumerKey)
    .update(raw)
    .digest("hex");

  const provided = Buffer.from(signature, "hex");
  const computed = Buffer.from(expected, "hex");
  if (provided.length !== computed.length || !crypto.timingSafeEqual(provided, computed)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  // Phase 2 ack — Phase 5 may persist webhook events to a queue.
  return NextResponse.json({ received: true });
}
