const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  email:      { type: String, trim: true, lowercase: true },
  company:    { type: String, trim: true },
  language:   { type: String, default: 'english' },   // ← NEW: tamil/hindi/telugu/english etc.
  tags:       [{ type: String }],
  source:     {
    type: String,
    enum: ['manual', 'csv', 'form', 'scrape', 'google-sheets'],  // ← NEW: google-sheets
    default: 'manual'
  },
  status:     { type: String, enum: ['active', 'dnd', 'called', 'booked'], default: 'active' },
  notes:      { type: String },
  lastCalled: { type: Date },
  createdAt:  { type: Date, default: Date.now },
})

module.exports = mongoose.model('Contact', contactSchema)