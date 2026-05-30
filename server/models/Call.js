const mongoose = require('mongoose')

const callSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  campaign:    { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  contact:     { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  contactName: { type: String },
  phone:       { type: String, required: true },
  language:    { type: String, default: 'english' },   // ← NEW: any language
  twilioSid:   { type: String },
  status:      {
    type: String,
    enum: ['queued', 'calling', 'in-progress', 'booked', 'no-answer', 'declined', 'failed', 'completed'],
    default: 'queued',
  },
  duration:      { type: Number, default: 0 },
  recordingUrl:  { type: String },
  transcript:    { type: String },                     // ← full AI conversation log
  aiSummary:     { type: String },
  collectedInfo: {                                     // ← NEW: info AI collected during call
    preferredDate: { type: String },
    preferredTime: { type: String },
    notes:         { type: String },
  },
  outcome:     { type: String, enum: ['booked', 'callback', 'not-interested', 'no-answer', 'failed'] },
  bookedAt:    { type: Date },
  startedAt:   { type: Date },
  endedAt:     { type: Date },
  createdAt:   { type: Date, default: Date.now },
})

module.exports = mongoose.model('Call', callSchema)