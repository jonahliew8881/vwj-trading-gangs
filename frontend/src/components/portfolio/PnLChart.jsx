import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

// Placeholder data — will be replaced by real journal data
const placeholder = [
  { date: 'Apr 1',  pnl: 0 },
  { date: 'Apr 5',  pnl: 1200 },
  { date: 'Apr 8',  pnl: 800 },
  { date: 'Apr 11', pnl: 3200 },
  { date: 'Apr 14', pnl: 5800 },
  { date: 'Apr 17', pnl: 4900 },
  { date: 'Apr 19', pnl: 6100 },
  { date: 'Apr 22', pnl: 9800 },
  { date: 'Apr 24', pnl: 12550 },
]

export default function PnLChart() {
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '7px', color: 'var(--cy-muted)',
        letterSpacing: '2px', marginBottom: '6px',
      }}>
        // MTD REALIZED P&L CURVE
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={placeholder} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: '#4a6a8a', fontSize: 7, fontFamily: 'Share Tech Mono' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#0d1117', border: '1px solid #1a2a3a', borderRadius: 0 }}
            labelStyle={{ color: '#4a6a8a', fontFamily: 'Montserrat', fontSize: 9 }}
            itemStyle={{ color: '#00ff88', fontFamily: 'Share Tech Mono', fontSize: 11 }}
            formatter={v => [`$${v.toLocaleString()}`, 'P&L']}
          />
          <Area type="monotone" dataKey="pnl" stroke="#00ff88" strokeWidth={1.5} fill="url(#pnlGrad)" dot={false} activeDot={{ r: 3, fill: '#00ff88' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
