import { promises as fs } from "node:fs";
import path from "node:path";
import type { MacroIndicator, MacroSnapshot } from "@/types";

interface FredObservation {
  date: string;
  value: string; // FRED returns values as strings; "." means missing
}

interface FredObservationsResponse {
  observations: FredObservation[];
}

const SERIES_META: Array<{
  key: keyof Omit<MacroSnapshot, "fetchedAt">;
  seriesId: string;
  label: string;
  unit: string;
}> = [
  { key: "inflation", seriesId: "CPIAUCSL", label: "Inflation (CPI year-over-year)", unit: "%" },
  { key: "fedFundsRate", seriesId: "DFF", label: "Federal funds rate", unit: "%" },
  { key: "treasury10y", seriesId: "DGS10", label: "10-year Treasury yield", unit: "%" },
  { key: "mortgage30y", seriesId: "MORTGAGE30US", label: "30-year fixed mortgage rate", unit: "%" },
];

const CACHE_FILE = path.join(process.cwd(), "public", "data", "macro.json");
const TTL_MS = Number(process.env.FRED_CACHE_TTL ?? 86_400) * 1000;

let memCache: { snapshot: MacroSnapshot; fetchedAt: number } | null = null;

// ───────────────────────────── Plain-English ─────────────────────────────

export function translateInflation(cpi: number): string {
  if (cpi < 2.5) return "Prices are rising slowly. This is the Fed's target zone.";
  if (cpi < 3.5) return "Prices are rising at a normal pace. Your savings still need to outpace this.";
  if (cpi < 5) return "Prices are rising faster than usual. Your money loses value if it's just sitting in cash.";
  return "Prices are rising quickly. This is a tough environment for cash savers.";
}

export function translateFedFunds(dff: number): string {
  if (dff < 1.5) return "Borrowing is cheap. Banks pay you very little to hold cash.";
  if (dff < 3) return "Rates are moderate. Cash earns a real but small return.";
  if (dff < 5) return "Rates are elevated. Cash and short bonds pay meaningfully now.";
  return "Rates are high. Borrowing is expensive; cash earns a healthy yield.";
}

export function translateTreasury(yield10y: number): string {
  if (yield10y < 2) return "Bond yields are very low. Long bonds pay almost nothing.";
  if (yield10y < 3.5) return "Bond yields are moderate. A balanced portfolio gets some bond income.";
  if (yield10y < 5) return "Bond yields are attractive. Long bonds compete with stocks for safer income.";
  return "Bond yields are high. Long bonds are paying like they haven't in years.";
}

export function translateMortgage(rate: number): string {
  if (rate < 4) return "Mortgages are cheap. A big factor for affordability.";
  if (rate < 6) return "Mortgages are around their long-run average.";
  if (rate < 8) return "Mortgages are expensive. Buying a home costs a lot more than a few years ago.";
  return "Mortgages are very expensive. The housing market is under real pressure.";
}

function translateFor(seriesId: string, value: number): string {
  switch (seriesId) {
    case "CPIAUCSL":
      return translateInflation(value);
    case "DFF":
      return translateFedFunds(value);
    case "DGS10":
      return translateTreasury(value);
    case "MORTGAGE30US":
      return translateMortgage(value);
    default:
      return "";
  }
}

// ─────────────────────────────── Disk cache ───────────────────────────────

interface DiskShape {
  fetchedAt: string;
  indicators: Record<string, { seriesId: string; label: string; value: number; unit: string; asOf: string }>;
}

async function loadFromDisk(): Promise<MacroSnapshot | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DiskShape;
    return materialize(parsed);
  } catch {
    return null;
  }
}

async function writeToDisk(snapshot: MacroSnapshot): Promise<void> {
  const out: DiskShape = {
    fetchedAt: snapshot.fetchedAt,
    indicators: {
      [snapshot.inflation.seriesId]: stripTranslation(snapshot.inflation),
      [snapshot.fedFundsRate.seriesId]: stripTranslation(snapshot.fedFundsRate),
      [snapshot.treasury10y.seriesId]: stripTranslation(snapshot.treasury10y),
      [snapshot.mortgage30y.seriesId]: stripTranslation(snapshot.mortgage30y),
    },
  };
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(out, null, 2), "utf-8");
  } catch {
    // best-effort; cache write failure should not break the request.
  }
}

function stripTranslation(i: MacroIndicator) {
  return {
    seriesId: i.seriesId,
    label: i.label,
    value: i.value,
    unit: i.unit,
    asOf: i.asOf,
  };
}

function materialize(disk: DiskShape): MacroSnapshot {
  const lookup = (seriesId: string): MacroIndicator => {
    const d = disk.indicators[seriesId];
    if (!d) {
      return {
        seriesId,
        label: seriesId,
        value: 0,
        unit: "%",
        plainEnglish: "",
        asOf: disk.fetchedAt.slice(0, 10),
      };
    }
    return {
      seriesId: d.seriesId,
      label: d.label,
      value: d.value,
      unit: d.unit,
      plainEnglish: translateFor(d.seriesId, d.value),
      asOf: d.asOf,
    };
  };
  return {
    fetchedAt: disk.fetchedAt,
    inflation: lookup("CPIAUCSL"),
    fedFundsRate: lookup("DFF"),
    treasury10y: lookup("DGS10"),
    mortgage30y: lookup("MORTGAGE30US"),
  };
}

// ─────────────────────────────── FRED fetch ───────────────────────────────

async function fetchSeries(seriesId: string, apiKey: string): Promise<{ value: number; date: string } | null> {
  // For CPIAUCSL we want YoY pct change. FRED supports the `units=pc1` transform.
  const yoy = seriesId === "CPIAUCSL" ? "&units=pc1" : "";
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1${yoy}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as FredObservationsResponse;
    const obs = data.observations?.[0];
    if (!obs || obs.value === ".") return null;
    const value = Number(obs.value);
    if (!Number.isFinite(value)) return null;
    return { value, date: obs.date };
  } catch {
    return null;
  }
}

// ───────────────────────────────── Public ─────────────────────────────────

export async function getMacroSnapshot(): Promise<{
  snapshot: MacroSnapshot;
  source: "fred" | "cache" | "fallback";
}> {
  const now = Date.now();
  if (memCache && now - memCache.fetchedAt < TTL_MS) {
    return { snapshot: memCache.snapshot, source: "cache" };
  }

  const apiKey = process.env.FRED_API_KEY;
  if (apiKey) {
    const indicators: Partial<Record<keyof Omit<MacroSnapshot, "fetchedAt">, MacroIndicator>> = {};
    let allOk = true;
    for (const meta of SERIES_META) {
      const r = await fetchSeries(meta.seriesId, apiKey);
      if (!r) {
        allOk = false;
        break;
      }
      indicators[meta.key] = {
        seriesId: meta.seriesId,
        label: meta.label,
        value: round1(r.value),
        unit: meta.unit,
        plainEnglish: translateFor(meta.seriesId, r.value),
        asOf: r.date,
      };
    }
    if (allOk) {
      const snapshot: MacroSnapshot = {
        fetchedAt: new Date(now).toISOString(),
        inflation: indicators.inflation!,
        fedFundsRate: indicators.fedFundsRate!,
        treasury10y: indicators.treasury10y!,
        mortgage30y: indicators.mortgage30y!,
      };
      memCache = { snapshot, fetchedAt: now };
      void writeToDisk(snapshot);
      return { snapshot, source: "fred" };
    }
  }

  const fromDisk = await loadFromDisk();
  if (fromDisk) {
    memCache = { snapshot: fromDisk, fetchedAt: now };
    return { snapshot: fromDisk, source: "fallback" };
  }

  // Last-ditch: zeros.
  const empty: MacroSnapshot = {
    fetchedAt: new Date(now).toISOString(),
    inflation: emptyIndicator("CPIAUCSL", "Inflation (CPI year-over-year)"),
    fedFundsRate: emptyIndicator("DFF", "Federal funds rate"),
    treasury10y: emptyIndicator("DGS10", "10-year Treasury yield"),
    mortgage30y: emptyIndicator("MORTGAGE30US", "30-year fixed mortgage rate"),
  };
  return { snapshot: empty, source: "fallback" };
}

function emptyIndicator(seriesId: string, label: string): MacroIndicator {
  return {
    seriesId,
    label,
    value: 0,
    unit: "%",
    plainEnglish: "Awaiting fresh data.",
    asOf: new Date().toISOString().slice(0, 10),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
