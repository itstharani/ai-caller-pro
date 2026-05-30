require('dotenv').config()

const express    = require('express')
const mongoose   = require('mongoose')
const cors       = require('cors')
const http       = require('http')
const WebSocket  = require('ws')
const url        = require('url')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Routes ──────────────────────────────────────────────────────────────────
const { router: twilioRouter, mediaStreamHandler } = require('./routes/VAPI')

app.use('/api/auth',      require('./routes/auth'))
app.use('/api/contacts',  require('./routes/contacts'))
app.use('/api/campaigns', require('./routes/campaigns'))
app.use('/api/calls',     require('./routes/calls'))
app.use('/api/settings',  require('./routes/settings'))
app.use('/api/twilio',    twilioRouter)
app.use('/api/vapi',   twilioRouter)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// ─── HTTP + WebSocket Server ──────────────────────────────────────────────────
// We wrap express in http.createServer so we can attach a WebSocket server
// on the same port — needed for Twilio Media Streams
const server = http.createServer(app)

// WebSocket server — handles Twilio audio ↔ OpenAI Realtime bridge
const wss = new WebSocket.Server({ noServer: true })

wss.on('connection', (ws, req) => {
  const pathname = url.parse(req.url).pathname
  if (pathname === '/api/twilio/media-stream') {
    mediaStreamHandler(ws, req)
  } else {
    ws.close()
  }
})

// Upgrade HTTP → WebSocket only for our media-stream path
server.on('upgrade', (req, socket, head) => {
  const { pathname } = url.parse(req.url)
  if (pathname === '/api/twilio/media-stream') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  } else {
    socket.destroy()
  }
})

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT      = process.env.PORT      || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-caller-pro'

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    server.listen(PORT, () => {
      console.log(`🚀 Server + WebSocket running on port ${PORT}`)
      console.log(`📡 Media stream: ws://localhost:${PORT}/api/twilio/media-stream`)
    })
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })

module.exports = app