const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // API Keys
  anthropicKey:   { type: String },
  deepgramKey:    { type: String },
  elevenLabsKey:  { type: String },

  // Twilio
  twilioSid:      { type: String },
  twilioToken:    { type: String },
  twilioPhone:    { type: String },
  webhookUrl:     { type: String },

  // Voice & AI
  defaultVoice:   { type: String, default: 'Nova (Female)' },
  aiModel:        { type: String, default: 'claude-sonnet-4-20250514' },
  interruptionHandling: { type: Boolean, default: true },
  silenceDetection:     { type: Boolean, default: true },
  callRecording:        { type: Boolean, default: false },

  // Notifications
  notifCampaignCompleted: { type: Boolean, default: true },
  notifBookingConfirmed:  { type: Boolean, default: true },
  notifCallFailed:        { type: Boolean, default: false },
  notifDailySummary:      { type: Boolean, default: true },

  // Compliance
  dndCheck:         { type: Boolean, default: true },
  callTimeRestrict: { type: Boolean, default: true },
  optOutHandling:   { type: Boolean, default: true },
  consentLogging:   { type: Boolean, default: false },

  updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Settings', settingsSchema)