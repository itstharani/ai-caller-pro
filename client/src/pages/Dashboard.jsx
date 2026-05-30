import React, { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, PhoneCall, CalendarCheck, PhoneOff, ArrowUpRight, Clock } from 'lucide-react'
import { api } from '../api'

const statusColor = {
  booked:      'var(--accent)',
  'no-answer': 'var(--text3)',
  declined:    'var(--yellow)',
  calling:     'var(--blue)',
  failed:      'var(--red)',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid var(--border2)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text2)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, delta, color, icon: Icon, i }) {
  const isNeg = delta?.startsWith('-')
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 12,
      animation: `slide-in 0.3s ease ${i * 0.07}s both`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
          {value ?? '—'}
        </span>
        {delta && (
          <span style={{
            fontSize: 12, color: isNeg ? 'var(--red)' : 'var(--accent)',
            background: isNeg ? 'rgba(255,68,102,0.1)' : 'rgba(124,58,237,0.1)',
            padding: '2px 8px', borderRadius: 20, marginBottom: 2, fontFamily: 'var(--mono)',
          }}>
            {delta}
          </span>
        )}
      </div>
      <div style={{ height: 2, background: 'var(--border)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: '60%', background: color, borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [weekly, setWeekly] = useState([])
  const [calls, setCalls]   = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
useEffect(() => {
  const load = async () => {
    try {
      const [statsRes, callsRes, campRes] = await Promise.all([
        api.get('/calls/stats'),
        api.get('/calls?limit=4'),
        api.get('/campaigns'),
      ])
      setStats(statsRes.stats || {})
      setWeekly(statsRes.weekly || [])
      setCalls(callsRes.calls || [])
      setCampaigns(Array.isArray(campRes) ? campRes : [])
    } catch (err) {
      console.error('Dashboard load error:', err)
      // Don't crash — just show empty state
      setStats({})
    } finally {
      setLoading(false)
    }
  }
  load()
}, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text2)' }}>
      Loading dashboard...
    </div>
  )

  const statCards = [
    { label: 'Booking Rate',  value: `${stats?.bookingRate ?? 0}%`, color: 'var(--accent)',  icon: TrendingUp },
    { label: 'Total Calls',   value: stats?.total ?? 0,             color: 'var(--blue)',    icon: PhoneCall },
    { label: 'Booked',        value: stats?.booked ?? 0,            color: 'var(--green)',   icon: CalendarCheck },
    { label: 'No Answer',     value: stats?.noAnswer ?? 0,          color: 'var(--red)',     icon: PhoneOff },
  ]

  const liveCalls = calls.filter(c => c.status === 'calling')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {statCards.map((s, i) => <StatCard key={s.label} {...s} i={i} />)}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Weekly Call Activity</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Calls placed vs appointments booked</div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {[['Calls', 'var(--blue)'], ['Booked', 'var(--accent)']].map(([l, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                  <span style={{ width: 10, height: 3, borderRadius: 2, background: c, display: 'inline-block' }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekly}>
              <defs>
                <linearGradient id="gCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--blue)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--blue)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBooked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="calls"  stroke="var(--blue)"   fill="url(#gCalls)"  strokeWidth={2} name="Calls" />
              <Area type="monotone" dataKey="booked" stroke="var(--accent)" fill="url(#gBooked)" strokeWidth={2} name="Booked" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Booking Rate</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Daily conversion %</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly} barSize={18}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="booked" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Booked" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Live Calls */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Live Calls</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-dot 1.5s infinite', display: 'inline-block' }} />
              {liveCalls.length} active
            </div>
          </div>
          {calls.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No calls yet</div>
          ) : calls.slice(0, 4).map(call => (
            <div key={call._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: `${statusColor[call.status] || 'var(--text3)'}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: statusColor[call.status] || 'var(--text3)',
                flexShrink: 0,
              }}>
                {(call.contactName || call.phone || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{call.contactName || call.phone}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {call.campaign?.name || 'No campaign'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: `${statusColor[call.status] || 'var(--text3)'}18`,
                  color: statusColor[call.status] || 'var(--text3)', marginBottom: 3,
                }}>
                  {call.status}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  {call.duration ? `${call.duration}s` : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Campaigns */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Active Campaigns</div>
            <ArrowUpRight size={16} color="var(--text3)" />
          </div>
          {campaigns.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No campaigns yet</div>
          ) : campaigns.filter(c => c.status !== 'draft').slice(0, 4).map(camp => (
            <div key={camp._id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{camp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />
                    {camp.called}/{camp.total} calls
                  </div>
                </div>
                <div style={{
                  fontSize: 11,
                  color: camp.status === 'active' ? 'var(--accent)' : camp.status === 'completed' ? 'var(--blue)' : 'var(--yellow)',
                }}>
                  {camp.status}
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 4 }}>
                <div style={{
                  height: '100%', width: `${camp.progress || 0}%`,
                  background: camp.status === 'completed' ? 'var(--blue)' : 'var(--accent)',
                  borderRadius: 4, transition: 'width 1s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                {camp.progress || 0}% complete · {camp.booked || 0} booked
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}