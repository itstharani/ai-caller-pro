const express  = require('express')
const router   = express.Router()
const multer   = require('multer')
const csv      = require('csv-parser')
const fs       = require('fs')
const Contact  = require('../models/Contact')

const upload = multer({ dest: 'uploads/' })

// ─── GET ALL / SEARCH ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, status, language, page = 1, limit = 50 } = req.query
    const query = {}

    if (status)   query.status   = status
    if (language) query.language = language
    if (search) {
      query.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { phone:   { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ]
    }

    const total    = await Contact.countDocuments(query)
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ contacts, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── CREATE CONTACT ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, company, language, tags, notes } = req.body
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone required' })

    const contact = await Contact.create({
      name, phone, email, company, tags, notes,
      language: (language || 'english').toLowerCase().trim(),  // ← FIXED: save language
      source: 'manual',
    })
    res.status(201).json(contact)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── UPDATE CONTACT ───────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    // Normalize language if being updated
    if (req.body.language) {
      req.body.language = req.body.language.toLowerCase().trim()
    }
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!contact) return res.status(404).json({ message: 'Contact not found' })
    res.json(contact)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── DELETE CONTACT ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id)
    if (!contact) return res.status(404).json({ message: 'Contact not found' })
    res.json({ message: 'Contact deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── CSV IMPORT ───────────────────────────────────────────────────────────────
// Supports: name, phone, email, company, language columns
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const contacts = []
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        const phone = row.phone || row.Phone
        if (phone) {
          contacts.push({
            name:     row.name     || row.Name     || 'Unknown',
            phone,
            email:    row.email    || row.Email,
            company:  row.company  || row.Company,
            language: (row.language || row.Language || 'english').toLowerCase().trim(), // ← NEW
            source:   'csv',
          })
        }
      })
      .on('end', async () => {
        fs.unlinkSync(req.file.path)
        const inserted = await Contact.insertMany(contacts, { ordered: false })
        res.json({ imported: inserted.length, message: `${inserted.length} contacts imported` })
      })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router