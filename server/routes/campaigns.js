const express = require('express')
const router = express.Router()
const Campaign = require('../models/Campaign')
const Call = require('../models/Call')

router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 })
    res.json(campaigns)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('contacts', 'name phone status')
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    res.json(campaign)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, description, contacts, script, scheduledAt } = req.body
    if (!name) return res.status(400).json({ message: 'Campaign name required' })
    const campaign = await Campaign.create({
      name, description, script, scheduledAt,
      contacts: contacts || [],
      total: contacts?.length || 0,
    })
    res.status(201).json(campaign)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { ...req.body, total: req.body.contacts?.length },
      { new: true }
    )
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    res.json(campaign)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id)
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    res.json({ message: 'Campaign deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:id/start', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('contacts')
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    if (campaign.status === 'active') return res.status(400).json({ message: 'Already active' })
    const callDocs = campaign.contacts.map(c => ({
      campaign: campaign._id,
      contact:  c._id,
      contactName: c.name,
      phone:    c.phone,
      status:   'queued',
    }))
    await Call.insertMany(callDocs)
    campaign.status = 'active'
    await campaign.save()
    res.json({ message: 'Campaign started', callsQueued: callDocs.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:id/pause', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id, { status: 'paused' }, { new: true }
    )
    res.json(campaign)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router