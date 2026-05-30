import React, { useEffect, useState } from 'react'
import { Key, Phone, Mic, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react'
import { api } from '../api'

const sections = [
  { key: 'api',    icon: Key,    label: 'API Keys' },
  { key: 'twilio', icon: Phone,  label: 'Twilio' },
  { key: 'voice',  icon: Mic,    label: 'Voice & AI' },
  { key: 'notif',  icon: Bell,   label: 'Notifications' },
  { key: 'comply', icon: Shield, label: 'Compliance' },
]

function Input({ label, placeholder, type = 'text', hint, value, onChange }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPass && !show ? 'password' : 'text'}
          placeholder={placeholder}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: 8,
            padding: isPass ? '10px 40px 10px 12px' : '10px 12px',
            color: 'var(--text)', fontSize: 13, outline: 'none',
            fontFamily: isPass ? 'var(--mono)' : 'var(--font)',
          }}
        />
        {isPass && (
          <button onClick={() => setShow(s => !s)} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
          }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{description}</div>
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--accent)' : 'var(--border2)',
        border: 'none', position: 'relative', transition: 'background 0.2s',
        cursor: 'pointer', flexShrink: 0,
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: value ? '#fff' : 'var(--text3)',
          position: 'absolute', top: 3, left: value ? 22 : 3,
          transition: 'left 0.2s, background 0.2s',
        }} />
      </button>
    </div>
  )
}

export default function Settings() {
  const [active, setActive]   = useState('api')
  const [form, setForm]       = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/settings')
        setForm(res)
      } catch (err) {
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await api.put('/settings', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text2)' }}>
      Loading settings...
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 24 }}>

      {/* Sidebar */}
      <div style={{
        width: 200, background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 12, height: 'fit-content',
      }}>
        {sections.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setActive(key)} style={{
            width: '100%', padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderRadius: 8, border: 'none',
            background: active === key ? 'rgba(124,58,237,0.08)' : 'none',
            color: active === key ? 'var(--accent)' : 'var(--text2)',
            fontSize: 13, fontWeight: active === key ? 600 : 400,
            marginBottom: 2, cursor: 'pointer', textAlign: 'left',
          }}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        {saved && (
          <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
            ✅ Settings saved successfully!
          </div>
        )}

        {/* API Keys */}
        {active === 'api' && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>API Keys</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Connect your AI and speech services</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Anthropic / OpenAI API Key" placeholder="sk-..." type="password"
                hint="Used for AI conversation logic (Claude or GPT-4)"
                value={form.anthropicKey} onChange={v => set('anthropicKey', v)} />
              <Input label="Deepgram API Key" placeholder="dg-..." type="password"
                hint="Speech-to-text transcription"
                value={form.deepgramKey} onChange={v => set('deepgramKey', v)} />
              <Input label="ElevenLabs API Key" placeholder="..." type="password"
                hint="High-quality text-to-speech voice synthesis"
                value={form.elevenLabsKey} onChange={v => set('elevenLabsKey', v)} />
            </div>
          </div>
        )}

        {/* Twilio */}
        {active === 'twilio' && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Twilio Configuration</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Voice calling credentials</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Twilio Account SID" placeholder="ACxxxxxxxxxxxx"
                hint="From your Twilio console dashboard"
                value={form.twilioSid} onChange={v => set('twilioSid', v)} />
              <Input label="Twilio Auth Token" placeholder="..." type="password"
                value={form.twilioToken} onChange={v => set('twilioToken', v)} />
              <Input label="Twilio Phone Number" placeholder="+91 555 000 0000"
                hint="Your Twilio outbound caller ID"
                value={form.twilioPhone} onChange={v => set('twilioPhone', v)} />
              <Input label="Webhook Base URL" placeholder="https://yourapp.com"
                hint="Your server URL for Twilio webhooks"
                value={form.webhookUrl} onChange={v => set('webhookUrl', v)} />
            </div>
          </div>
        )}

        {/* Voice & AI */}
        {active === 'voice' && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Voice & AI Settings</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Tune conversation behaviour</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Default Voice</label>
                <select value={form.defaultVoice || ''} onChange={e => set('defaultVoice', e.target.value)} style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 12px',
                  color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
                }}>
                  {['Nova (Female)', 'Alloy (Neutral)', 'Echo (Male)', 'Shimmer (Female)', 'Onyx (Male)'].map(v => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>AI Model</label>
                <select value={form.aiModel || ''} onChange={e => set('aiModel', e.target.value)} style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 12px',
                  color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
                }}>
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4 (Faster)</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>
              <Toggle label="Interruption Handling" description="Allow user to interrupt AI mid-sentence"
                value={form.interruptionHandling} onChange={v => set('interruptionHandling', v)} />
              <Toggle label="Silence Detection" description="Hang up after 8 seconds of silence"
                value={form.silenceDetection} onChange={v => set('silenceDetection', v)} />
              <Toggle label="Call Recording" description="Record all calls for quality review"
                value={form.callRecording} onChange={v => set('callRecording', v)} />
            </div>
          </div>
        )}

        {/* Notifications */}
        {active === 'notif' && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Notifications</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Choose when to be notified</div>
            <Toggle label="Campaign Completed" description="Notify when all calls in a campaign finish"
              value={form.notifCampaignCompleted} onChange={v => set('notifCampaignCompleted', v)} />
            <Toggle label="Booking Confirmed" description="Real-time alerts for each appointment booked"
              value={form.notifBookingConfirmed} onChange={v => set('notifBookingConfirmed', v)} />
            <Toggle label="Call Failed" description="Alert when call fails or errors out"
              value={form.notifCallFailed} onChange={v => set('notifCallFailed', v)} />
            <Toggle label="Daily Summary Email" description="Get a daily digest of all call activity"
              value={form.notifDailySummary} onChange={v => set('notifDailySummary', v)} />
          </div>
        )}

        {/* Compliance */}
        {active === 'comply' && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Compliance Settings</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>India TRAI / DND compliance</div>
            <Toggle label="DND Registry Check" description="Auto-skip numbers on India DND list before calling"
              value={form.dndCheck} onChange={v => set('dndCheck', v)} />
            <Toggle label="Call Time Restrictions" description="Only allow calls between 9 AM – 7 PM local time"
              value={form.callTimeRestrict} onChange={v => set('callTimeRestrict', v)} />
            <Toggle label="Opt-out Handling" description='End call and mark DND if user says "stop"'
              value={form.optOutHandling} onChange={v => set('optOutHandling', v)} />
            <Toggle label="Consent Logging" description="Log consent confirmation for each outbound call"
              value={form.consentLogging} onChange={v => set('consentLogging', v)} />
            <div style={{
              marginTop: 16, background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 9, padding: '12px 14px', fontSize: 12, color: 'var(--yellow)', lineHeight: 1.6,
            }}>
              ⚠️ Always ensure you have proper consent before making automated calls. Verify compliance with TRAI regulations.
            </div>
          </div>
        )}

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 24px', border: 'none', borderRadius: 9,
            background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7,
            cursor: 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}