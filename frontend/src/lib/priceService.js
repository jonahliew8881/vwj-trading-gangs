// frontend/src/lib/priceService.js
// Yahoo Finance via corsproxy.io — supports HK + US stocks, free, no API key needed
// HK stocks: ticker "9988" → "9988.HK"
// US stocks: ticker "AAPL" → "AAPL"

const PROXY = 'https://corsproxy.io/?'
const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

function toYFSymbol(ticker, market) {
  if (market === 'HK' && !ticker.includes('.HK')) return `${ticker}.HK`
  return ticker
}

/**
 * Fetch price for a single ticker
 * @param {string} ticker - e.g. "9988", "AAPL"
 * @param {string} market - "HK" or "US"
 * @returns {Promise<{ price: number, currency: string } | null>}
 */
export async function fetchPrice(ticker, market) {
  try {
    const symbol = toYFSymbol(ticker, market)
    const url = `${PROXY}${encodeURIComponent(`${YF_BASE}/${symbol}?interval=1d&range=1d`)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (!price) return null
    return { price, currency: market === 'HK' ? 'HKD' : 'USD' }
  } catch (err) {
    console.error(`[priceService] fetchPrice failed for ${ticker}:`, err)
    return null
  }
}

/**
 * Fetch prices for multiple tickers (sequential, Yahoo has no batch endpoint)
 * @param {Array<{ ticker: string, market: string }>} positions
 * @returns {Promise<Object>} - { "9988": { price, currency }, "AAPL": { price, currency } }
 */
export async function fetchPrices(positions) {
  if (!positions || positions.length === 0) return {}

  const results = {}
  for (const { ticker, market } of positions) {
    const result = await fetchPrice(ticker, market)
    if (result) results[ticker] = result
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200))
  }
  return results
}

/**
 * Fetch full quote with change data
 * @param {string} ticker
 * @param {string} market
 * @returns {Promise<{ price, change, changePct, open, high, low, volume, currency } | null>}
 */
export async function fetchFullQuote(ticker, market) {
  try {
    const symbol = toYFSymbol(ticker, market)
    const url = `${PROXY}${encodeURIComponent(`${YF_BASE}/${symbol}?interval=1d&range=1d`)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    return {
      price: meta.regularMarketPrice,
      open: meta.regularMarketOpen,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      prevClose: meta.chartPreviousClose,
      change: meta.regularMarketPrice - meta.chartPreviousClose,
      changePct: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100),
      currency: market === 'HK' ? 'HKD' : 'USD',
    }
  } catch (err) {
    console.error(`[priceService] fetchFullQuote failed for ${ticker}:`, err)
    return null
  }
}
