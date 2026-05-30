import React, { useEffect, useState } from 'react'
import { UserPlus, Search, Trash2, Phone, Building, Sheet, Link, CheckCircle, AlertCircle, Loader, Globe } from 'lucide-react'
import { api } from '../api'

const statusColor = {
  active: 'var(--accent)',
  dnd:    'var(--red)',
  called: 'var(--blue)',
  booked: 'var(--green)',
}

const LANGUAGES = [
  'english','tamil','hindi','telugu','malayalam','kannada',
  'bengali','marathi','gujarati','punjabi','urdu','arabic',
  'french','spanish','german','portuguese','japanese','chinese','korean',
]

// ─── ADD CONTACT MODAL ────────────────────────────────────────────────────────
function AddContactModal({ onClose, onAdded }) {
  const [form, setForm]     = useState({ name: '', phone: '', email: '', company: '', language: 'english' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const submit = async () => {
    if (!form.name || !form.phone) return setError('Name and phone are required')
    setLoading(true)
    try {
      const contact = await api.post('/contacts', form)
      onAdded(contact)
      onClose()
    } catch { setError('Failed to add contact') }
    finally { setLoading(false) }
  }

  return (
    <Overlay>
      <ModalBox>
        <ModalTitle>Add Contact</ModalTitle>
        {error && <ErrorBox>{error}</ErrorBox>}

        {[
          { key: 'name',    label: 'Full Name *',    placeholder: 'John Doe' },
          { key: 'phone',   label: 'Phone Number *', placeholder: '+91 98765 43210' },
          { key: 'email',   label: 'Email',          placeholder: 'john@example.com' },
          { key: 'company', label: 'Company',        placeholder: 'Acme Corp' },
        ].map(f => (
          <Field key={f.key} label={f.label}>
            <Input placeholder={f.placeholder} value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
          </Field>
        ))}

        <Field label="Language">
          <Select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
          </Select>
        </Field>

        <ModalActions>
          <CancelBtn onClick={onClose}>Cancel</CancelBtn>
          <PrimaryBtn onClick={submit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Contact'}
          </PrimaryBtn>
        </ModalActions>
      </ModalBox>
    </Overlay>
  )
}

// ─── GOOGLE SHEETS IMPORT MODAL ───────────────────────────────────────────────
function SheetsModal({ onClose, onImported }) {
  const [url, setUrl]             = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [campaigns, setCampaigns]  = useState([])
  const [step, setStep]            = useState('form')   // form | importing | done | error
  const [result, setResult]        = useState(null)
  const [errorMsg, setErrorMsg]    = useState('')
  const [startCalls, setStartCalls] = useState(false)

  useEffect(() => {
    api.get('/campaigns').then(r => setCampaigns(r.campaigns || [])).catch(() => {})
  }, [])

  const handleImport = async () => {
    if (!url.trim()) return setErrorMsg('Please paste a Google Sheet URL')
    setErrorMsg('')
    setStep('importing')
    try {
      const res = await api.post('/calls/import-sheets', {
        sheetUrl:   url.trim(),
        campaignId: campaignId || undefined,
      })
      setResult(res)
      setStep('done')
      onImported()

      // Auto-start bulk calls if checkbox ticked
      if (startCalls && res.callIds?.length) {
        await api.post('/calls/bulk-initiate', { callIds: res.callIds })
      }
    } catch (err) {
      setErrorMsg(err.message || 'Import failed')
      setStep('error')
    }
  }

  return (
    <Overlay>
      <ModalBox style={{ width: 500 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(34,197,94,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sheet size={18} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Import from Google Sheets</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Contacts are imported with their language settings</div>
          </div>
        </div>

        {/* Sheet format hint */}
        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>📋 Required Sheet Format:</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
              <thead>
                <tr>
                  {['Name','Phone','Language','Campaign/Purpose'].map(h => (
                    <th key={h} style={{
                      padding: '4px 10px', background: 'rgba(124,58,237,0.1)',
                      color: 'var(--accent)', fontWeight: 700, textAlign: 'left',
                      borderRadius: 4,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Ravi Kumar', '+919800000001', 'tamil',   'dental clinic'],
                  ['Priya Singh','+919800000002', 'hindi',   'insurance offer'],
                  ['John',       '+919800000003', 'english', 'gym membership'],
                ].map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '4px 10px', color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, color: 'var(--text3)', fontSize: 11 }}>
            💡 Language can be: tamil, hindi, telugu, malayalam, kannada, bengali, marathi, gujarati, punjabi, urdu, arabic, french, spanish, german... any language!
          </div>
        </div>

        {step === 'form' || step === 'error' ? (<>
          {errorMsg && <ErrorBox>{errorMsg}</ErrorBox>}

          <Field label={<><Link size={12} style={{ marginRight: 4 }} />Google Sheet URL</>}>
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Make sure sheet is set to <strong>"Anyone with link can view"</strong>
            </div>
          </Field>

          <Field label="Campaign (optional)">
            <Select value={campaignId} onChange={e => setCampaignId(e.target.value)}>
              <option value="">— No campaign —</option>
              {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </Field>

          {/* Auto-start toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 20, cursor: 'pointer',
          }} onClick={() => setStartCalls(p => !p)}>
            <div style={{
              width: 40, height: 22, borderRadius: 11,
              background: startCalls ? 'var(--accent)' : 'var(--border)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: startCalls ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Auto-start calls after import</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                AI will call all imported contacts immediately
              </div>
            </div>
          </div>

          <ModalActions>
            <CancelBtn onClick={onClose}>Cancel</CancelBtn>
            <PrimaryBtn onClick={handleImport} style={{ background: 'var(--green)' }}>
              <Sheet size={14} /> Import Sheet
            </PrimaryBtn>
          </ModalActions>
        </>) : step === 'importing' ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <Loader size={36} color="var(--accent)"
                style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Importing contacts...</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              Reading your Google Sheet and creating call queue
            </div>
          </div>
        ) : (
          // Done
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={44} color="var(--green)" style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Import Successful!</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              {result?.contacts} contacts imported · {result?.calls} calls queued
              {result?.skipped > 0 && ` · ${result.skipped} skipped`}
            </div>
            {startCalls && (
              <div style={{
                background: 'rgba(34,197,94,0.1)', color: 'var(--green)',
                borderRadius: 8, padding: '8px 14px', fontSize: 12,
                fontWeight: 600, marginBottom: 18,
              }}>
                🎙️ AI calls are being initiated in background!
              </div>
            )}
            <PrimaryBtn onClick={onClose} style={{ margin: '0 auto' }}>Done</PrimaryBtn>
          </div>
        )}
      </ModalBox>
    </Overlay>
  )
}

// ─── MAIN CONTACTS PAGE ───────────────────────────────────────────────────────
export default function Contacts() {
  const [contacts, setContacts]     = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [showSheets, setShowSheets] = useState(false)
  const [deleting, setDeleting]     = useState(null)
  const [calling, setCalling]       = useState(null)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const res = await api.get(`/contacts?search=${q}&limit=50`)
      setContacts(res.contacts || [])
      setTotal(res.total || 0)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setTimeout(() => load(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await api.delete(`/contacts/${id}`)
      setContacts(p => p.filter(c => c._id !== id))
      setTotal(p => p - 1)
    } catch (err) { console.error(err) }
    finally { setDeleting(null) }
  }

  const handleCall = async (contact) => {
    setCalling(contact._id)
    try {
      const call = await api.post('/calls', {
        contactName: contact.name,
        phone:       contact.phone,
        contact:     contact._id,
        language:    contact.language || 'english',
      })
      if (!call._id) throw new Error('Failed to create call record')
await api.post('/vapi/initiate', { callId: call._id })
      alert(`📞 Calling ${contact.name} in ${contact.language || 'english'}...`)
    } catch (err) {
      alert('Failed to start call: ' + err.message)
    } finally {
      setCalling(null)
    }
  }

  const handleAdded    = (contact) => { setContacts(p => [contact, ...p]); setTotal(p => p + 1) }
  const handleImported = () => load(search)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Contacts</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{total} total contacts</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Google Sheets button */}
          <button onClick={() => setShowSheets(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', border: '1px solid var(--green)',
            borderRadius: 9, background: 'rgba(34,197,94,0.08)',
            color: 'var(--green)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <Sheet size={15} /> Import from Sheets
          </button>
          {/* Add contact button */}
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', border: 'none', borderRadius: 9,
            background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <UserPlus size={15} /> Add Contact
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
        <input
          placeholder="Search by name, phone or company..."
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
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.2fr 1fr 0.8fr 90px',
          padding: '12px 20px', borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text3)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          <span>Name</span>
          <span>Phone</span>
          <span>Company</span>
          <span>Language</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>
        ) : contacts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
            No contacts found. Add manually or import from Google Sheets!
          </div>
        ) : contacts.filter(c => c && c._id).map(c => (
          <div key={c._id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.2fr 1fr 0.8fr 90px',
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            alignItems: 'center', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(124,58,237,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
              }}>
                {(c.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                {c.email && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.email}</div>}
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
              <Phone size={11} />{c.phone}
            </div>

            {/* Company */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}>
              {c.company ? <><Building size={11} />{c.company}</> : '—'}
            </div>

            {/* Language badge */}
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, padding: '3px 9px', borderRadius: 20,
                background: 'rgba(124,58,237,0.1)', color: 'var(--accent)',
              }}>
                <Globe size={9} />
                {c.language || 'english'}
              </span>
            </div>

            {/* Status */}
            <div>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: `${statusColor[c.status] || 'var(--text3)'}18`,
                color: statusColor[c.status] || 'var(--text3)',
              }}>
                {c.status}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
              <button
                onClick={() => handleCall(c)}
                disabled={calling === c._id}
                title={`Call in ${c.language || 'english'}`}
                style={{
                  background: 'none', border: 'none', cursor: calling === c._id ? 'not-allowed' : 'pointer',
                  color: calling === c._id ? 'var(--text3)' : 'var(--green)',
                  padding: 6, borderRadius: 6,
                }}
              >
                {calling === c._id
                  ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Phone size={14} />
                }
              </button>
              <button
                onClick={() => handleDelete(c._id)}
                disabled={deleting === c._id}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', padding: 6, borderRadius: 6,
                  opacity: deleting === c._id ? 0.4 : 1,
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

      {showModal  && <AddContactModal onClose={() => setShowModal(false)}  onAdded={handleAdded} />}
      {showSheets && <SheetsModal     onClose={() => setShowSheets(false)} onImported={handleImported} />}
    </div>
  )
}

// ─── REUSABLE STYLE COMPONENTS ────────────────────────────────────────────────
const Overlay = ({ children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
    {children}
  </div>
)
const ModalBox = ({ children, style }) => (
  <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, width: 440, maxHeight: '90vh', overflowY: 'auto', ...style }}>
    {children}
  </div>
)
const ModalTitle = ({ children }) => <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{children}</div>
const ErrorBox   = ({ children }) => <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>{children}</div>
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'flex', alignItems: 'center' }}>{label}</label>
    {children}
  </div>
)
const inputStyle = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const Input  = (props) => <input  style={inputStyle} {...props} />
const Select = (props) => <select style={{ ...inputStyle, cursor: 'pointer' }} {...props} />
const ModalActions = ({ children }) => <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>{children}</div>
const CancelBtn  = ({ children, onClick }) => <button onClick={onClick} style={{ padding: '9px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>{children}</button>
const PrimaryBtn = ({ children, onClick, disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1, ...style }}>
    {children}
  </button>
)