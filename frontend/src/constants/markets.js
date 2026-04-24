export const MARKETS = {
  HK: {
    label: 'HK',
    currency: 'HKD',
    suffix: '.HK',
    minLiquidity: 5000000,   // 最低每日成交額 HKD
    minPrice: 1,
    tradingHours: { open: '09:30', close: '16:00', timezone: 'Asia/Hong_Kong' },
  },
  US: {
    label: 'US',
    currency: 'USD',
    suffix: '',
    minLiquidity: 1000000,   // 最低每日成交額 USD
    minPrice: 5,
    tradingHours: { open: '09:30', close: '16:00', timezone: 'America/New_York' },
  },
}

export const KELLY_INITIAL_WIN_RATE = 0.50   // 初始勝率50%
export const KELLY_HALF_DIVISOR = 2           // Half Kelly
export const KELLY_AUTO_UPDATE_THRESHOLD = 30 // 30單後自動更新
