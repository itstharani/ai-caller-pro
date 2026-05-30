const mongoose = require('mongoose')

const campaignSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  contacts:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  script:      { type: String }, // AI prompt / conversation script
  status:      { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  total:       { type: Number, default: 0 },
  called:      { type: Number, default: 0 },
  booked:      { type: Number, default: 0 },
  failed:      { type: Number, default: 0 },
  progress:    { type: Number, default: 0 }, // percentage
  scheduledAt: { type: Date },
  completedAt: { type: Date },
  createdAt:   { type: Date, default: Date.now },
})

module.exports = mongoose.model('Campaign', campaignSchema)