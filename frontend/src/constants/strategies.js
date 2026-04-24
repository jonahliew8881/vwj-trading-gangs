export const ENTRY_STRATEGIES = [
  {
    id: 's1',
    code: 'S1',
    name: 'Compression Breakout',
    color: '#00ff88',
    description: '量縮N日後放量突破盤整頂',
    type: 'base',
  },
  {
    id: 's2',
    code: 'S2',
    name: 'Pullback to MA',
    color: '#00d4ff',
    description: '回調至20/50MA + Stochastic超賣回升',
    type: 'base',
  },
  {
    id: 's3',
    code: 'S3',
    name: 'RSI Bull Divergence',
    color: '#ffd700',
    description: '價新低但RSI唔跟，賣壓衰竭',
    type: 'base',
  },
  {
    id: 's4',
    code: 'S4',
    name: 'Volume Climax Reversal',
    color: '#ff6b35',
    description: '異常放量長下影線 + RSI極超賣',
    type: 'base',
  },
  {
    id: 'a1',
    code: 'A1',
    name: 'OBV Divergence',
    color: '#c084fc',
    description: '價橫行但OBV持續上升，Smart Money吸貨',
    type: 'advanced',
  },
  {
    id: 'a2',
    code: 'A2',
    name: 'Multi-Timeframe',
    color: '#38bdf8',
    description: '日線同週線訊號方向一致',
    type: 'advanced',
  },
  {
    id: 'a3',
    code: 'A3',
    name: 'Fibonacci Confluence',
    color: '#fb923c',
    description: '股價喺Fib 0.618 / 0.5回調位附近',
    type: 'advanced',
  },
]

export const EXIT_STRATEGIES = [
  {
    id: 'e1',
    code: 'E1',
    name: 'Bearish RSI Divergence',
    color: '#ff3355',
    urgency: 'high',
    description: '價新高但RSI唔跟，升勢動力衰竭',
  },
  {
    id: 'e2',
    code: 'E2',
    name: 'Trend Exhaustion',
    color: '#ffd700',
    urgency: 'medium',
    description: '連升N日 + RSI超買 + 成交量萎縮',
  },
  {
    id: 'e3',
    code: 'E3',
    name: 'Support Breakdown',
    color: '#ff3355',
    urgency: 'high',
    description: '跌穿主要支撐位 + 放量確認',
  },
]

export const MAX_SCORE = 7
