const express = require('express')
const router = express.Router()
const protect = require('../middleware/auth')
const Settings = require('../models/Settings')

// GET /api/settings — get settings (mask secret keys)
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id })
    if (!settings) settings = await Settings.create({ user: req.user._id })

    // Mask keys: show only last 4 chars
    const mask = (val) => val ? '••••••••' + val.slice(-4) : ''
    const safe = settings.toObject()
    safe.anthropicKey  = mask(settings.anthropicKey)
    safe.deepgramKey   = mask(settings.deepgramKey)
    safe.elevenLabsKey = mask(settings.elevenLabsKey)
    safe.twilioToken   = mask(settings.twilioToken)

    res.json(safe)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/settings — save settings
router.put('/', protect, async (req, res) => {
  try {
    // Don't overwrite keys if they come in masked (••••)
    const updates = { ...req.body, updatedAt: new Date() }
    const maskFields = ['anthropicKey', 'deepgramKey', 'elevenLabsKey', 'twilioToken']
    maskFields.forEach(f => {
      if (updates[f] && updates[f].startsWith('••••')) delete updates[f]
    })

    const settings = await Settings.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, upsert: true }
    )
    res.json({ message: 'Settings saved', settings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router