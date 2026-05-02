const mean = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const variance = (values: number[]) => {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
};

const standardDeviation = (values: number[]) => Math.sqrt(variance(values));

export function calculateSharpeRatio(monthlyReturns: number[], riskFreeRate = 0.04): number {
  if (monthlyReturns.length === 0) return 0;
  const monthlyRiskFree = riskFreeRate / 12;
  const excess = monthlyReturns.map((r) => r - monthlyRiskFree);
  const sd = standardDeviation(excess);
  return sd === 0 ? 0 : (mean(excess) / sd) * Math.sqrt(12);
}

export function calculateSortino(monthlyReturns: number[], riskFreeRate = 0.04): number {
  if (monthlyReturns.length === 0) return 0;
  const monthlyRiskFree = riskFreeRate / 12;
  const downside = monthlyReturns.map((r) => Math.min(0, r - monthlyRiskFree)).filter((r) => r < 0);
  const downsideDeviation = standardDeviation(downside);
  return downsideDeviation === 0 ? 0 : ((mean(monthlyReturns) - monthlyRiskFree) / downsideDeviation) * Math.sqrt(12);
}

export function calculateBeta(stockReturns: number[], marketReturns: number[]): number {
  const n = Math.min(stockReturns.length, marketReturns.length);
  if (n < 2) return 1;
  const stock = stockReturns.slice(0, n);
  const market = marketReturns.slice(0, n);
  const stockMean = mean(stock);
  const marketMean = mean(market);
  const covariance =
    stock.reduce((sum, value, i) => sum + (value - stockMean) * (market[i]! - marketMean), 0) / (n - 1);
  const marketVariance = variance(market);
  return marketVariance === 0 ? 1 : covariance / marketVariance;
}

export function calculateAlpha(
  stockReturns: number[],
  marketReturns: number[],
  beta: number,
  riskFreeRate = 0.04,
): number {
  const annualStockReturn = mean(stockReturns) * 12;
  const annualMarketReturn = mean(marketReturns) * 12;
  return annualStockReturn - (riskFreeRate + beta * (annualMarketReturn - riskFreeRate));
}

export function calculateMaxDrawdown(prices: number[]): number {
  let peak = prices[0] ?? 0;
  let maxDrawdown = 0;
  for (const price of prices) {
    peak = Math.max(peak, price);
    if (peak > 0) maxDrawdown = Math.min(maxDrawdown, (price - peak) / peak);
  }
  return maxDrawdown;
}

export function calculateVolatility(monthlyReturns: number[]): number {
  return standardDeviation(monthlyReturns) * Math.sqrt(12);
}

export function calculateCorrelationMatrix(
  holdingsReturns: Record<string, number[]>,
): Record<string, Record<string, number>> {
  const symbols = Object.keys(holdingsReturns);
  const matrix: Record<string, Record<string, number>> = {};
  for (const a of symbols) {
    matrix[a] = {};
    for (const b of symbols) {
      matrix[a]![b] = correlation(holdingsReturns[a]!, holdingsReturns[b]!);
    }
  }
  return matrix;
}

function correlation(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const xs = a.slice(0, n);
  const ys = b.slice(0, n);
  const xMean = mean(xs);
  const yMean = mean(ys);
  const numerator = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i]! - yMean), 0);
  const denominator =
    Math.sqrt(xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0)) *
    Math.sqrt(ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0));
  return denominator === 0 ? 0 : numerator / denominator;
}
