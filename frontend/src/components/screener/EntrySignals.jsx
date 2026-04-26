import React, { useState, useEffect } from 'react'
import { fetchPrices } from '../../lib/priceService'
import { ENTRY_STRATEGIES, MAX_SCORE } from '../../constants/strategies'
import StockCard from './StockCard'

const MOCK_STOCKS = [
  {
    ticker: '1211.HK', name: 'BYD Company', market: 'HK',
    price: 248.60, chg: 3.2, signals: ['s1','s2','a1','a2','a3'],
    annotations: {
      s1: { time: 'Apr 24 · 16:02 HKT', data: [['過去7日均量','18.4M'],['今日成交量','34.2M (×1.86)','pos'],['突破位','HK$245.00'],['Stochastic %K','28→54','pos']], explain: '股價橫盤8日後，今日量放大1.86倍，收破盤整頂$245。量價齊升確認突破有效。', caution: '需確認大市配合，建議等翌日確認排除假突破。' },
      s2: { time: 'Apr 23 · 16:02 HKT', data: [['20日MA','HK$241.30'],['最低觸及','HK$242.80'],['Stochastic %K','22 (超賣)','pos']], explain: '回調至20MA附近，Stochastic超賣後回升，係上升趨勢中低買機會。', caution: '跌穿20MA並收市於下方則訊號失效。' },
      a1: { time: 'Apr 24 · 16:02 HKT', data: [['OBV趨勢（7日）','持續上升','pos'],['OBV升幅','+12.4%','pos'],['股價7日','橫行 / 微跌']], explain: '過去7日股價橫行但OBV持續升12.4%，代表Smart Money低調吸貨。', caution: 'OBV係累計指標，短期有誤差，配合其他訊號使用。' },
      a2: { time: 'Apr 24 · 16:02 HKT', data: [['日線Stochastic','28→54 回升','pos'],['週線EMA','多頭排列','pos'],['方向一致','日+週同步','pos']], explain: '日線Stochastic超賣回升，週線EMA多頭排列。兩個時間框架方向一致。', caution: 'Multi-TF係加分項，唔代表100%勝率。' },
      a3: { time: 'Apr 24 · 16:02 HKT', data: [['波段低','HK$198.40 (Feb)'],['波段高','HK$272.00 (Apr)'],['Fib 0.618','HK$226.50'],['現價狀態','已反彈離開','pos']], explain: '股價曾回調至Fib 0.618位反彈，確認強力支撐。現價已離開Fib區域。', caution: 'Fib位係參考，建議在TradingView自行確認。' },
    }
  },
  {
    ticker: 'META', name: 'Meta Platforms', market: 'US',
    price: 582.30, chg: 2.4, signals: ['s1','s2','s3','a1','a2','a3'],
    annotations: {
      s1: { time: 'Apr 24 · 16:00 ET', data: [['過去5日均量','18.2M'],['今日成交量','29.8M (×1.64)','pos'],['突破位','$572.50'],['盤整','9日','pos']], explain: '橫盤9日後今日量放大1.64倍，收破$572.50。機構資金推動突破。', caution: '美股入場前確認無重大財報消息。' },
      s2: { time: 'Apr 23 · 16:00 ET', data: [['50日MA','$568.40'],['回調低位','$565.20'],['Stochastic %K','18 (深度超賣)','pos']], explain: '回調至50MA輕微穿越後迅速收復，Stochastic達18深度超賣。', caution: '一旦確認跌穿50MA需即時止蝕。' },
      s3: { time: 'Apr 22 · 16:00 ET', data: [['前低RSI','38.4'],['新低RSI','42.1','pos'],['配合','長下影線','pos']], explain: '價格低點更低但RSI更高，配合長下影線確認背馳有效。', caution: 'RSI背馳已2日前出現，今日突破係補充確認。' },
      a1: { time: 'Apr 24 · 16:00 ET', data: [['OBV趨勢（10日）','持續創新高','pos'],['淨買入量','+142M shares','pos']], explain: 'OBV持續10日創新高，機構持續吸籌訊號明確。', caution: '科技股OBV受ETF再平衡影響，配合其他指標判斷。' },
      a2: { time: 'Apr 24 · 16:00 ET', data: [['日線','突破+回升','pos'],['週線EMA','多頭排列','pos'],['月線','上升通道','pos']], explain: '三個時間框架同步看好，係最高質素入場環境。', caution: '三重確認往往升幅已大後出現，注意追高風險。' },
      a3: { time: 'Apr 24 · 16:00 ET', data: [['波段低','$454.20 (Jan)'],['波段高','$589.50 (Mar)'],['回調','僅至Fib 0.236','pos']], explain: '回調僅至Fib 0.236即止，顯示升勢強勁，強勢股特徵。', caution: '淺回調意味風險回報比可能較差，止蝕位需更精確。' },
    }
  },
  {
    ticker: '388.HK', name: 'HKEX', market: 'HK',
    price: 312.40, chg: 1.8, signals: ['s3','a2'],
    annotations: {
      s3: { time: 'Apr 24 · 16:02 HKT', data: [['前低','HK$298.20'],['新低','HK$295.80'],['RSI前低','31.2'],['RSI新低','35.8','pos']], explain: '股價創新低但RSI唔跟，賣壓動力衰減，見底訊號出現。', caution: '需K線反轉形態配合，才係正式入場訊號。' },
      a2: { time: 'Apr 24 · 16:02 HKT', data: [['日線RSI','35.8 回升中','pos'],['週線支撐','$290-295區間'],['一致性','日線反轉+週線支撐','pos']], explain: '日線RSI背馳，週線長期橫行區間下沿。雙重時間框架指向支撐。', caution: '週線趨勢係橫行，波段空間受限。目標設於$330-340。' },
    }
  },
  {
    ticker: 'AMZN', name: 'Amazon', market: 'US',
    price: 198.70, chg: -0.3, signals: ['s2','s3'],
    annotations: {
      s2: { time: 'Apr 24 · 16:00 ET', data: [['20日MA','$197.40'],['今日低位','$196.80'],['反彈收市','$198.70','pos'],['Stochastic %K','26 回升','pos']], explain: '回調至20MA附近，日內觸及後反彈收市。MA支撐測試後反彈形態。', caution: '今日仍收跌0.3%，力度偏弱。建議等明日確認。' },
      s3: { time: 'Apr 23 · 16:00 ET', data: [['前低','$194.20'],['新低','$196.80 (未破)'],['RSI前低','33.8'],['RSI新低','37.2','pos']], explain: '股價未能創新低，RSI走高，形成隱性背馳。配合MA支撐，短期底部可能形成。', caution: '隱性背馳訊號較弱，大市偏弱時建議觀望。' },
    }
  },
]

export default function EntrySignals() {
  const [marketFilter, setMarketFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('any')
  const [advLoaded, setAdvLoaded] = useState(false)
  const [livePrices, setLivePrices] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAdvLoaded(true), 3000)
    return () => clearTimeout(t)
  }, [])

  async function refreshPrices() {
    setRefreshing(true)
    const targets = MOCK_STOCKS.map(s => ({
      ticker: s.ticker.replace('.HK', ''),
      market: s.market,
    }))
    const result = await fetchPrices(targets)
    setLivePrices(result)
    setRefreshing(false)
  }

  const filtered = MOCK_STOCKS.filter(s => {
    if (marketFilter !== 'all' && s.market.toLowerCase() !== marketFilter) return false
    if (scoreFilter === '3+' && s.signals.length < 3) return false
    if (scoreFilter === '5+' && s.signals.length < 5) return false
    return true
  }).sort((a, b) => b.signals.length - a.signals.length)
    .map(s => {
    const key = s.ticker.replace('.HK', '')
    const live = livePrices[key]
    if (!live) return s
    const chg = s.price > 0 ? ((live.price - s.price) / s.price * 100) : 0
    return { ...s, price: live.price, chg: parseFloat(chg.toFixed(2)) }
  })

  return (
    <div>
      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px',
        padding: '7px 9px',
        background: 'var(--cy-grid)',
        border: '1px solid var(--cy-border)',
        marginBottom: '8px',
      }}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 700, letterSpacing: '2px', color: 'var(--cy-muted)', width: '100%', marginBottom: '2px' }}>
          Strategy Legend
        </div>
        {ENTRY_STRATEGIES.map(s => (
          <SignalBadge key={s.id} id={s.id} code={s.code} color={s.color} />
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <FilterLabel>Market:</FilterLabel>
        {['all','hk','us'].map(f => (
          <FilterBtn key={f} active={marketFilter === f} onClick={() => setMarketFilter(f)}>
            {f.toUpperCase()}
          </FilterBtn>
        ))}
        <FilterLabel style={{ marginLeft: '6px' }}>Score:</FilterLabel>
        {['any','3+','5+'].map(f => (
          <FilterBtn key={f} active={scoreFilter === f} onClick={() => setScoreFilter(f)}>
            {f}
          </FilterBtn>
        ))}
        <button
          onClick={refreshPrices}
          disabled={refreshing}
          style={{
            marginLeft: 'auto',
            padding: '2px 10px',
            border: '1px solid var(--cy-accent)',
            background: 'rgba(0,212,255,0.06)',
            color: refreshing ? 'var(--cy-muted)' : 'var(--cy-accent)',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '8px', fontWeight: 700,
            letterSpacing: '1px', cursor: refreshing ? 'not-allowed' : 'pointer',
          }}
        >
          {refreshing ? '...' : '↻ Prices'}
        </button> 
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Share Tech Mono', monospace", fontSize: '8px', color: advLoaded ? 'var(--cy-green)' : 'var(--cy-muted)' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: advLoaded ? 'var(--cy-green)' : 'var(--cy-muted)', animation: advLoaded ? 'none' : 'blink 1.2s infinite' }} />
          {advLoaded ? 'All signals loaded' : 'Advanced loading...'}
        </div>
      </div>

      {/* Stock list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {filtered.map((s, i) => (
          <StockCard key={s.ticker} stock={s} index={i} />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--cy-muted)', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}>
            // No stocks match current filters
          </div>
        )}
      </div>
    </div>
  )
}

function SignalBadge({ id, code, color }) {
  return (
    <span style={{
      padding: '2px 5px', fontSize: '8px',
      fontFamily: "'Share Tech Mono', monospace",
      border: `1px solid ${color}40`,
      background: `${color}14`,
      color,
    }}>
      {code}
    </span>
  )
}

function FilterLabel({ children, style }) {
  return (
    <span style={{
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '7px', fontWeight: 700,
      color: 'var(--cy-muted)', letterSpacing: '1.5px',
      textTransform: 'uppercase', ...style,
    }}>
      {children}
    </span>
  )
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '2px 8px',
      border: `1px solid ${active ? 'var(--cy-green)' : 'var(--cy-border)'}`,
      background: active ? 'rgba(0,255,136,0.06)' : 'none',
      color: active ? 'var(--cy-green)' : 'var(--cy-muted)',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '8px', fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {children}
    </button>
  )
}
