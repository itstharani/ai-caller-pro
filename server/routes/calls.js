const express  = require('express')
const router   = express.Router()
const axios    = require('axios')
const Call     = require('../models/Call')
const Contact  = require('../models/Contact')
const Campaign = require('../models/Campaign')

// ─── SUPPORTED LANGUAGES ──────────────────────────────────────────────────────
// Any value from the Google Sheet "Language" column is passed directly to OpenAI.
// OpenAI Realtime supports 57+ languages — just pass the name as-is.
const SUPPORTED_LANGUAGES = [
  'english','tamil','hindi','telugu','malayalam','kannada',
  'bengali','marathi','gujarati','punjabi','odia','urdu',
  'arabic','french','spanish','german','portuguese','japanese',
  'chinese','korean','russian','italian','dutch','turkish',
]

// ─── STATS (must be before /:id) ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [total, booked, failed, noAnswer] = await Promise.all([
      Call.countDocuments({}),
      Call.countDocuments({ status: 'booked' }),
      Call.countDocuments({ status: 'failed' }),
      Call.countDocuments({ status: 'no-answer' }),
    ])

    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    const weekly = await Promise.all(days.map(async (day, i) => {
      const date  = new Date()
      date.setDate(date.getDate() - (6 - i))
      const start = new Date(date.setHours(0,0,0,0))
      const end   = new Date(date.setHours(23,59,59,999))
      const [calls, booked] = await Promise.all([
        Call.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Call.countDocuments({ status: 'booked', createdAt: { $gte: start, $lte: end } }),
      ])
      return { day, calls, booked }
    }))

    const bookingRate = total > 0 ? ((booked / total) * 100).toFixed(1) : 0
    res.json({ stats: { total, booked, failed, noAnswer, bookingRate }, weekly })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET ALL CALLS ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, campaign, page = 1, limit = 20 } = req.query
    const query = {}
    if (status)   query.status   = status
    if (campaign) query.campaign = campaign

    const total = await Call.countDocuments(query)
    const calls = await Call.find(query)
      .populate('campaign', 'name')
      .populate('contact',  'name phone language')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ calls, total, page: Number(page) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── IMPORT FROM GOOGLE SHEETS ────────────────────────────────────────────────
// POST /api/calls/import-sheets
// Body: { sheetUrl, campaignId }
// Sheet columns expected: Name | Phone | Language | Campaign/Purpose | Notes (optional)
router.post('/import-sheets', async (req, res) => {
  try {
    const { sheetUrl, campaignId } = req.body
    if (!sheetUrl) return res.status(400).json({ message: 'sheetUrl is required' })

    // Extract sheet ID from URL and build CSV export link
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) return res.status(400).json({ message: 'Invalid Google Sheets URL' })
    const sheetId  = match[1]
    const csvUrl   = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

    // Fetch CSV data
    const csvResp  = await axios.get(csvUrl)
    const rows     = parseCSV(csvResp.data)

    if (rows.length === 0) return res.status(400).json({ message: 'Sheet is empty or unreadable' })

    const headers  = rows[0].map(h => h.toLowerCase().trim())
    const nameIdx  = findCol(headers, ['name','full name','contact name'])
    const phoneIdx = findCol(headers, ['phone','phone number','mobile','contact'])
    const langIdx  = findCol(headers, ['language','lang','language preference','speak'])
    const noteIdx  = findCol(headers, ['notes','note','purpose','campaign purpose','description'])

    if (phoneIdx === -1) return res.status(400).json({ message: 'Sheet must have a "Phone" column' })

    const dataRows = rows.slice(1).filter(r => r[phoneIdx]?.trim())

    const contacts = []
    const calls    = []
    let   skipped  = 0

    for (const row of dataRows) {
      const phone    = sanitizePhone(row[phoneIdx])
      const name     = row[nameIdx]    || 'Unknown'
      const rawLang  = (row[langIdx]   || 'english').toLowerCase().trim()
      const language = SUPPORTED_LANGUAGES.includes(rawLang) ? rawLang : 'english'
      const notes    = row[noteIdx]    || ''

      if (!phone) { skipped++; continue }

      // Upsert contact
      let contact = await Contact.findOne({ phone })
      if (!contact) {
        contact = await Contact.create({
          name, phone, language, notes,
          source: 'google-sheets',
          status: 'active',
        })
      } else {
        // Update language if now specified
        if (language !== 'english' || !contact.language) {
          contact.language = language
          await contact.save()
        }
      }

      contacts.push(contact)

      // Create a queued call
      const callDoc = await Call.create({
        contact:     contact._id,
        campaign:    campaignId || null,
        contactName: contact.name,
        phone:       contact.phone,
        language:    contact.language,
        status:      'queued',
      })
      calls.push(callDoc)
    }

    res.json({
      message:  `Imported ${contacts.length} contacts, created ${calls.length} queued calls`,
      skipped,
      contacts: contacts.length,
      calls:    calls.length,
      callIds:  calls.map(c => c._id),
    })
  } catch (err) {
    console.error('❌ Google Sheets import error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// ─── BULK INITIATE CALLS ──────────────────────────────────────────────────────
// POST /api/calls/bulk-initiate
// Body: { callIds: [...], delayMs: 3000 }   ← delayMs between each call
router.post('/bulk-initiate', async (req, res) => {
  try {
    const { callIds, campaignId, delayMs = 4000 } = req.body
    if (!callIds?.length) return res.status(400).json({ message: 'callIds array required' })

    const WEBHOOK = process.env.WEBHOOK_URL || 'http://localhost:5000'

    // Respond immediately, fire calls in background
    res.json({ message: `Starting ${callIds.length} calls with ${delayMs}ms delay`, total: callIds.length })

    // Fire calls sequentially with delay (avoids Twilio rate limit)
    ;(async () => {
      for (const callId of callIds) {
        try {
          await axios.post(`${WEBHOOK}/api/twilio/initiate`, { callId })
          console.log(`📞 Initiated call: ${callId}`)
        } catch (e) {
          console.error(`❌ Failed to initiate ${callId}:`, e.message)
          await Call.findByIdAndUpdate(callId, { status: 'failed' })
        }
        await sleep(delayMs)
      }
      console.log('✅ All bulk calls initiated')
    })()
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── SUPPORTED LANGUAGES LIST ─────────────────────────────────────────────────
router.get('/languages', (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES })
})

// ─── GET / UPDATE / CREATE single call ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const call = await Call.findById(req.params.id).populate('campaign contact')
    if (!call) return res.status(404).json({ message: 'Call not found' })
    res.json(call)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const call = await Call.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!call) return res.status(404).json({ message: 'Call not found' })
    res.json(call)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const call = await Call.create(req.body)
    res.status(201).json(call)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function parseCSV(text) {
  return text.split('\n').map(line => {
    const row = []
    let cur = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { row.push(cur.trim()); cur = '' }
      else cur += ch
    }
    row.push(cur.trim())
    return row
  }).filter(r => r.some(c => c))
}

function findCol(headers, options) {
  for (const opt of options) {
    const i = headers.indexOf(opt)
    if (i !== -1) return i
  }
  return -1
}

function sanitizePhone(raw) {
  if (!raw) return null
  let p = raw.replace(/[^\d+]/g, '')
  if (!p.startsWith('+')) p = '+' + p
  return p.length >= 10 ? p : null
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = router