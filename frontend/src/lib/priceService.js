// frontend/src/lib/priceService.js
// Unified price fetching via Financial Modeling Prep (FMP)
// Free tier: 250 requests/day
// HK stocks: use format "0700.HK" → FMP accepts same format

const FMP_BASE = 'https://financialmodelingprep.com/api/v3';
const API_KEY = import.meta.env.VITE_FMP_API_KEY;

/**
 * Fetch real-time price for a single ticker
 * @param {string} ticker - e.g. "AAPL", "0700.HK", "9988.HK"
 * @param {string} market - "US" or "HK"
 * @returns {Promise<{ price: number, change: number, changePct: number, currency: string } | null>}
 */
export async function fetchPrice(ticker, market) {
  try {
    // FMP HK stock format: append .HK if not already there
    const symbol = market === 'HK' && !ticker.includes('.HK')
      ? `${ticker}.HK`
      : ticker;

    const res = await fetch(
      `${FMP_BASE}/quote-short/${symbol}?apikey=${API_KEY}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data || data.length === 0) return null;

    const quote = data[0];
    return {
      price: quote.price,
      currency: market === 'HK' ? 'HKD' : 'USD',
    };
  } catch (err) {
    console.error(`[priceService] fetchPrice failed for ${ticker}:`, err);
    return null;
  }
}

/**
 * Fetch prices for multiple tickers in batch
 * @param {Array<{ ticker: string, market: string }>} positions
 * @returns {Promise<Object>} - { "AAPL": { price, currency }, "0700.HK": { price, currency }, ... }
 */
export async function fetchPrices(positions) {
  if (!positions || positions.length === 0) return {};

  // Build comma-separated symbol list for batch call (saves API quota)
  const symbols = positions.map(({ ticker, market }) =>
    market === 'HK' && !ticker.includes('.HK') ? `${ticker}.HK` : ticker
  );

  try {
    const symbolStr = symbols.join(',');
    const res = await fetch(
      `${FMP_BASE}/quote-short/${symbolStr}?apikey=${API_KEY}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data || data.length === 0) return {};

    // Map results back by symbol
    const result = {};
    data.forEach((quote) => {
      // Normalize symbol key: strip .HK suffix for matching
      const rawSymbol = quote.symbol;
      const baseSymbol = rawSymbol.replace('.HK', '');

      // Find original position to get market
      const pos = positions.find(
        (p) => p.ticker === rawSymbol || p.ticker === baseSymbol
      );
      const market = pos ? pos.market : (rawSymbol.includes('.HK') ? 'HK' : 'US');

      result[pos ? pos.ticker : baseSymbol] = {
        price: quote.price,
        currency: market === 'HK' ? 'HKD' : 'USD',
      };
    });

    return result;
  } catch (err) {
    console.error('[priceService] fetchPrices batch failed:', err);
    return {};
  }
}

/**
 * Fetch full quote with change data (for display purposes)
 * @param {string} ticker
 * @param {string} market
 * @returns {Promise<{ price, change, changePct, open, high, low, volume, currency } | null>}
 */
export async function fetchFullQuote(ticker, market) {
  try {
    const symbol = market === 'HK' && !ticker.includes('.HK')
      ? `${ticker}.HK`
      : ticker;

    const res = await fetch(
      `${FMP_BASE}/quote/${symbol}?apikey=${API_KEY}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data || data.length === 0) return null;

    const q = data[0];
    return {
      price: q.price,
      change: q.change,
      changePct: q.changesPercentage,
      open: q.open,
      high: q.dayHigh,
      low: q.dayLow,
      volume: q.volume,
      avgVolume: q.avgVolume,
      marketCap: q.marketCap,
      pe: q.pe,
      currency: market === 'HK' ? 'HKD' : 'USD',
      name: q.name,
      exchange: q.exchange,
    };
  } catch (err) {
    console.error(`[priceService] fetchFullQuote failed for ${ticker}:`, err);
    return null;
  }
}
