import React, { useEffect, useState } from 'react'
import { Phone, PhoneOff, PhoneCall, CalendarCheck, Clock, Search } from 'lucide-react'
import { api } from '../api'

const statusColor = {
  booked:       'var(--accent)',
  'no-answer':  'var(--text3)',
  declined:     'var(--yellow)',
  calling:      'var(--blue)',
  failed:       'var(--red)',
  completed:    'var(--green)',
  queued:       'var(--text3)',
  'in-progress':'var(--blue)',
}

const statusIcon = {
  booked:       CalendarCheck,
  'no-answer':  PhoneOff,
  declined:     PhoneOff,
  calling:      PhoneCall,
  failed:       PhoneOff,
  completed:    Phone,
  queued:       Clock,
  'in-progress':PhoneCall,
}

const FILTERS = ['all', 'calling', 'booked', 'no-answer', 'declined', 'failed', 'completed']

export default function Calls() {
  const [calls, setCalls]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)

  const load = async (f = filter, p = 1) => {
    setLoading(true)
    try {
      const status = f === 'all' ? '' : `&status=${f}`
      const res = await api.get(`/calls?page=${p}&limit=20${status}`)
      setCalls(res.calls || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleFilter = (f) => {
    setFilter(f)
    setPage(1)
    load(f, 1)
  }

  const formatDuration = (secs) => {
    if (!secs) return '—'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  const filtered = search
    ? calls.filter(c =>
        (c.contactName || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
      )
    : calls

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Call Logs</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{total} total calls</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => handleFilter(f)} style={{
            padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: '1px solid var(--border)', cursor: 'pointer',
            background: filter === f ? 'var(--accent)' : 'var(--bg2)',
            color: filter === f ? '#fff' : 'var(--text2)',
            textTransform: 'capitalize',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
        <input
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 9, padding: '10px 12px 10px 36px',
            color: 'var(--text)', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 1fr',
          padding: '12px 20px', borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text3)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          <span>Contact</span>
          <span>Campaign</span>
          <span>Date</span>
          <span>Duration</span>
          <span>Status</span>
          <span>Outcome</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>No calls found</div>
        ) : filtered.map(call => {
          const Icon = statusIcon[call.status] || Phone
          const color = statusColor[call.status] || 'var(--text3)'
          return (
            <div key={call._id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 1fr',
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              alignItems: 'center',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Contact */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={13} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{call.contactName || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{call.phone}</div>
                </div>
              </div>

              {/* Campaign */}
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {call.campaign?.name || '—'}
              </div>

              {/* Date */}
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {formatDate(call.createdAt)}
              </div>

              {/* Duration */}
              <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
                {formatDuration(call.duration)}
              </div>

              {/* Status */}
              <div>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20,
                  background: `${color}18`, color,
                }}>
                  {call.status}
                </span>
              </div>

              {/* Outcome */}
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {call.outcome || '—'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={() => { setPage(p => p - 1); load(filter, page - 1) }}
            disabled={page === 1}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg2)', color: 'var(--text2)', fontSize: 13,
              cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1,
            }}>
            Previous
          </button>
          <span style={{ padding: '8px 16px', fontSize: 13, color: 'var(--text2)' }}>
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => { setPage(p => p + 1); load(filter, page + 1) }}
            disabled={page >= Math.ceil(total / 20)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg2)', color: 'var(--text2)', fontSize: 13,
              cursor: page >= Math.ceil(total / 20) ? 'not-allowed' : 'pointer',
              opacity: page >= Math.ceil(total / 20) ? 0.5 : 1,
            }}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}