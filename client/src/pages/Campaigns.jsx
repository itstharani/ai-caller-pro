import React, { useEffect, useState } from 'react'
import { Plus, Play, Pause, Trash2, Users, Clock, ChevronRight } from 'lucide-react'
import { api } from '../api'

const statusColor = {
  draft:     'var(--text3)',
  active:    'var(--accent)',
  paused:    'var(--yellow)',
  completed: 'var(--blue)',
}

function CreateCampaignModal({ onClose, onCreated }) {
  const [form, setForm]     = useState({ name: '', description: '', script: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const submit = async () => {
    if (!form.name) return setError('Campaign name is required')
    setLoading(true)
    try {
      const campaign = await api.post('/campaigns', form)
      onCreated(campaign)
      onClose()
    } catch (err) {
      setError('Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 28, width: 480,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Create Campaign</div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Campaign Name *</label>
          <input
            placeholder="e.g. Summer Outreach 2026"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            style={{
              width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none',
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Description</label>
          <input
            placeholder="What is this campaign about?"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            style={{
              width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none',
            }}
          />
        </div>

        {/* Script */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>AI Script</label>
          <textarea
            placeholder="Hello! I am calling from XYZ to offer you an appointment. Are you available?"
            value={form.script}
            onChange={e => setForm(p => ({ ...p, script: e.target.value }))}
            rows={4}
            style={{
              width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13,
              outline: 'none', resize: 'vertical', fontFamily: 'var(--font)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', border: '1px solid var(--border)',
            borderRadius: 8, background: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading} style={{
            padding: '9px 20px', border: 'none', borderRadius: 8,
            background: 'var(--accent)', color: '#fff', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [acting, setActing]       = useState(null)

  const load = async () => {
    setLoading(true)
    try {const res = await api.get('/campaigns')
setCampaigns(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleStart = async (id) => {
    setActing(id)
    try {
      await api.post(`/campaigns/${id}/start`, {})
      setCampaigns(p => p.map(c => c._id === id ? { ...c, status: 'active' } : c))
    } catch (err) {
      console.error(err)
    } finally {
      setActing(null)
    }
  }

  const handlePause = async (id) => {
    setActing(id)
    try {
      await api.post(`/campaigns/${id}/pause`, {})
      setCampaigns(p => p.map(c => c._id === id ? { ...c, status: 'paused' } : c))
    } catch (err) {
      console.error(err)
    } finally {
      setActing(null)
    }
  }

  const handleDelete = async (id) => {
    setActing(id)
    try {
      await api.delete(`/campaigns/${id}`)
      setCampaigns(p => p.filter(c => c._id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setActing(null)
    }
  }

  const handleCreated = (campaign) => {
    setCampaigns(p => [campaign, ...p])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Campaigns</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{campaigns.length} total campaigns</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', border: 'none', borderRadius: 9,
          background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Campaign Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 60,
          textAlign: 'center', color: 'var(--text3)',
        }}>
          No campaigns yet. Create your first one!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {campaigns.map(camp => (
            <div key={camp._id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              {/* Status dot */}
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: statusColor[camp.status] || 'var(--text3)',
                boxShadow: camp.status === 'active' ? `0 0 8px ${statusColor.active}` : 'none',
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{camp.name}</div>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: `${statusColor[camp.status]}18`,
                    color: statusColor[camp.status],
                  }}>
                    {camp.status}
                  </span>
                </div>

                {camp.description && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{camp.description}</div>
                )}

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={11} /> {camp.total || 0} contacts
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> {camp.called || 0}/{camp.total || 0} called
                  </span>
                  <span style={{ color: 'var(--accent)' }}>
                    {camp.booked || 0} booked
                  </span>
                </div>

                {/* Progress bar */}
                {camp.status !== 'draft' && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 4 }}>
                      <div style={{
                        height: '100%', width: `${camp.progress || 0}%`,
                        background: camp.status === 'completed' ? 'var(--blue)' : 'var(--accent)',
                        borderRadius: 4, transition: 'width 1s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                      {camp.progress || 0}% complete
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {camp.status === 'draft' || camp.status === 'paused' ? (
                  <button
                    onClick={() => handleStart(camp._id)}
                    disabled={acting === camp._id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', border: 'none', borderRadius: 8,
                      background: 'var(--accent)', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      opacity: acting === camp._id ? 0.6 : 1,
                    }}>
                    <Play size={12} /> Start
                  </button>
                ) : camp.status === 'active' ? (
                  <button
                    onClick={() => handlePause(camp._id)}
                    disabled={acting === camp._id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', border: 'none', borderRadius: 8,
                      background: 'var(--yellow)', color: '#000',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      opacity: acting === camp._id ? 0.6 : 1,
                    }}>
                    <Pause size={12} /> Pause
                  </button>
                ) : null}

                <button
                  onClick={() => handleDelete(camp._id)}
                  disabled={acting === camp._id}
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                    color: 'var(--text3)', opacity: acting === camp._id ? 0.4 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <CreateCampaignModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  )
}