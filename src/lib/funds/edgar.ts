import { promises as fs } from "node:fs";
import path from "node:path";
import type { FundComponent, FundHoldings } from "@/types";

/**
 * SEC EDGAR client for mutual-fund N-PORT filings.
 *
 * Notes:
 * - SEC mandates a real `User-Agent` header on every request. We pull it from
 *   `SEC_EDGAR_USER_AGENT` and refuse to proceed if it's missing.
 * - N-PORT filings are large XML; for the hackathon we read a small set of
 *   pre-cached top holdings from `public/data/funds.json` first, and only hit
 *   EDGAR for fresh fund tickers. The hookable "fresh" path stays implemented
 *   so live demos work, but the cache covers the funds we display by default.
 */

const CACHE_FILE = path.join(process.cwd(), "public", "data", "funds.json");
const TTL_MS = Number(process.env.EDGAR_CACHE_TTL ?? 86_400) * 1000;

interface DiskShape {
  fetchedAt: string;
  funds: Record<string, FundHoldings>;
}

let memCache: { byTicker: Map<string, FundHoldings>; fetchedAt: number } | null = null;

async function loadDisk(): Promise<DiskShape | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw) as DiskShape;
  } catch {
    return null;
  }
}

async function ensureMem(): Promise<Map<string, FundHoldings>> {
  const now = Date.now();
  if (memCache && now - memCache.fetchedAt < TTL_MS) {
    return memCache.byTicker;
  }
  const disk = await loadDisk();
  const byTicker = new Map<string, FundHoldings>();
  if (disk) {
    for (const [k, v] of Object.entries(disk.funds)) {
      byTicker.set(k.toUpperCase(), v);
    }
  }
  memCache = { byTicker, fetchedAt: now };
  return byTicker;
}

// ─────────────────────────── EDGAR ticker lookup ───────────────────────────

interface CompanyTickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

let cikCache: Map<string, { cik: string; title: string }> | null = null;

async function lookupCik(
  ticker: string,
  userAgent: string,
): Promise<{ cik: string; title: string } | null> {
  if (cikCache?.has(ticker)) return cikCache.get(ticker)!;
  if (!cikCache) {
    try {
      const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
        headers: { "User-Agent": userAgent },
        cache: "force-cache",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Record<string, CompanyTickerEntry>;
      cikCache = new Map();
      for (const v of Object.values(data)) {
        cikCache.set(v.ticker.toUpperCase(), {
          cik: String(v.cik_str).padStart(10, "0"),
          title: v.title,
        });
      }
    } catch {
      return null;
    }
  }
  return cikCache.get(ticker.toUpperCase()) ?? null;
}

// ─────────────────────────── N-PORT (best-effort) ──────────────────────────

interface SubmissionFiling {
  accessionNumber: string;
  primaryDocument: string;
  form: string;
  filingDate: string;
}

async function fetchLatestNPort(
  cik: string,
  userAgent: string,
): Promise<SubmissionFiling | null> {
  try {
    const res = await fetch(
      `https://data.sec.gov/submissions/CIK${cik}.json`,
      { headers: { "User-Agent": userAgent } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      filings?: { recent?: { form: string[]; accessionNumber: string[]; primaryDocument: string[]; filingDate: string[] } };
    };
    const recent = data.filings?.recent;
    if (!recent) return null;
    for (let i = 0; i < recent.form.length; i++) {
      const form = recent.form[i] ?? "";
      if (form.startsWith("NPORT-P")) {
        return {
          accessionNumber: recent.accessionNumber[i] ?? "",
          primaryDocument: recent.primaryDocument[i] ?? "",
          form,
          filingDate: recent.filingDate[i] ?? "",
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Light XML extractor — pulls <invstOrSec> blocks' name and pctVal weights.
function parseTopHoldings(xml: string, limit = 10): FundComponent[] {
  const out: FundComponent[] = [];
  const blocks = xml.split(/<invstOrSec[\s>]/i).slice(1);
  for (const blk of blocks) {
    const name = capture(blk, /<name>([^<]+)<\/name>/i);
    const ticker = capture(blk, /<ticker>([^<]+)<\/ticker>/i) ?? capture(blk, /<cusip>([^<]+)<\/cusip>/i);
    const pct = Number(capture(blk, /<pctVal>([^<]+)<\/pctVal>/i) ?? "0");
    if (!name) continue;
    out.push({
      ticker: (ticker ?? name.slice(0, 6)).toUpperCase(),
      name: name.trim(),
      weight: pct / 100,
    });
  }
  out.sort((a, b) => b.weight - a.weight);
  return out.slice(0, limit);
}

function capture(s: string, re: RegExp): string | null {
  const m = s.match(re);
  return m ? (m[1] ?? null) : null;
}

// ───────────────────────────────── Public ─────────────────────────────────

export interface FundFetchResult {
  fund: FundHoldings | null;
  source: "cache" | "edgar" | "miss";
}

export async function getFundHoldings(ticker: string): Promise<FundFetchResult> {
  const upper = ticker.toUpperCase().trim();
  const cache = await ensureMem();
  if (cache.has(upper)) return { fund: cache.get(upper)!, source: "cache" };

  const userAgent = process.env.SEC_EDGAR_USER_AGENT;
  if (!userAgent || userAgent.length < 10) {
    return { fund: null, source: "miss" };
  }

  const cik = await lookupCik(upper, userAgent);
  if (!cik) return { fund: null, source: "miss" };

  const filing = await fetchLatestNPort(cik.cik, userAgent);
  if (!filing) return { fund: null, source: "miss" };

  // EDGAR primary doc is HTML/XML. Some filings link to a separate XML file
  // (Forms NPORT-P/A). We attempt the primary doc for a best-effort parse.
  const docUrl = `https://www.sec.gov/Archives/edgar/data/${Number(cik.cik)}/${filing.accessionNumber.replaceAll("-", "")}/${filing.primaryDocument}`;
  try {
    const res = await fetch(docUrl, { headers: { "User-Agent": userAgent } });
    if (!res.ok) return { fund: null, source: "miss" };
    const xml = await res.text();
    const holdings = parseTopHoldings(xml);
    if (holdings.length === 0) return { fund: null, source: "miss" };
    const fund: FundHoldings = {
      fundTicker: upper,
      fundName: cik.title,
      asOf: filing.filingDate,
      holdings,
      totalHoldings: holdings.length,
    };
    cache.set(upper, fund);
    return { fund, source: "edgar" };
  } catch {
    return { fund: null, source: "miss" };
  }
}

/** Internal helper — exported for tests. */
export const __test = { parseTopHoldings, capture };
