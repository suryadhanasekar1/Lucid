import { Snaptrade } from "snaptrade-typescript-sdk";

let _client: Snaptrade | null = null;

/**
 * Lazily-instantiated SnapTrade SDK client. Server-only — never import from
 * a client component.
 */
export function snaptrade(): Snaptrade {
  if (_client) return _client;

  const clientId = process.env.SNAPTRADE_CLIENT_ID;
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;

  if (!clientId || !consumerKey) {
    throw new Error("SnapTrade credentials missing — set SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY");
  }

  _client = new Snaptrade({
    clientId,
    consumerKey,
  });
  return _client;
}
