require('dotenv').config()
const express  = require('express')
const router   = express.Router()
const axios    = require('axios')
const Call     = require('../models/Call')
const Campaign = require('../models/Campaign')
const Contact  = require('../models/Contact')

// ─── VAPI CONFIG ──────────────────────────────────────────────────────────────
const VAPI_API_KEY       = () => process.env.VAPI_API_KEY
const VAPI_PHONE_ID      = () => process.env.VAPI_PHONE_NUMBER_ID
const ELEVENLABS_API_KEY = () => process.env.ELEVENLABS_API_KEY
const VAPI_BASE_URL      = 'https://api.vapi.ai'

const vapiClient = () =>
  axios.create({
    baseURL: VAPI_BASE_URL,
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY()}`,
      'Content-Type': 'application/json',
    },
  })

// ─── ELEVENLABS VOICE IDS ─────────────────────────────────────────────────────
// Add more voice IDs here as you get them from ElevenLabs voice library
const ELEVENLABS_VOICES = {
  tamil:   'OUBMjq0LvBjb07bhwD3H',  // Vanishree - Modern Friendly Tamil
  english: 'OUBMjq0LvBjb07bhwD3H',  // Using Vanishree as fallback until English voice added
  // Add more below when ready:
  // hindi:     'YOUR_HINDI_VOICE_ID',
  // telugu:    'YOUR_TELUGU_VOICE_ID',
  // malayalam: 'YOUR_MALAYALAM_VOICE_ID',
  // kannada:   'YOUR_KANNADA_VOICE_ID',
}

// ─── VOICE CONFIG (ElevenLabs for Tamil/Indian, OpenAI for others) ────────────
function getVoiceConfig(language) {
  const lang = (language || 'english').toLowerCase().trim()

  // If we have an ElevenLabs voice for this language, use it
  if (ELEVENLABS_VOICES[lang]) {
    return {
      provider: '11labs',           // ✅ VAPI requires '11labs' not 'elevenlabs'
      voiceId:  ELEVENLABS_VOICES[lang],
      model:    'eleven_turbo_v2_5', // fastest for real-time calls
      stability:        0.5,
      similarityBoost:  0.75,
      style:            0.0,
      useSpeakerBoost:  true,
    }
  }

  // Fallback to OpenAI for languages not yet configured
  return { provider: 'openai', voiceId: 'shimmer' }
}

// ─── TRANSCRIBER CONFIG (Deepgram nova-2 with correct language codes) ─────────
// These are the CORRECT Deepgram language codes — 'multi' was causing user speech to be missed
function getTranscriberConfig(language) {
  const lang = (language || 'english').toLowerCase().trim()

  const map = {
    english:   { model: 'nova-2', language: 'en-IN' },
    tamil:     { model: 'nova-2', language: 'multi' },  // VAPI nova-2 doesn't support 'ta' — use multi
    hindi:     { model: 'nova-2', language: 'hi'    },
    telugu:    { model: 'nova-2', language: 'multi' },
    malayalam: { model: 'nova-2', language: 'multi' },
    kannada:   { model: 'nova-2', language: 'multi' },
    bengali:   { model: 'nova-2', language: 'multi' },
    marathi:   { model: 'nova-2', language: 'multi' },
    gujarati:  { model: 'nova-2', language: 'multi' },
    punjabi:   { model: 'nova-2', language: 'multi' },
    arabic:    { model: 'nova-2', language: 'ar'    },
    french:    { model: 'nova-2', language: 'fr'    },
    spanish:   { model: 'nova-2', language: 'es'    },
    german:    { model: 'nova-2', language: 'de'    },
    japanese:  { model: 'nova-2', language: 'ja'    },
    chinese:   { model: 'nova-2', language: 'zh'    },
    korean:    { model: 'nova-2', language: 'ko'    },
    russian:   { model: 'nova-2', language: 'ru'    },
    italian:   { model: 'nova-2', language: 'it'    },
    dutch:     { model: 'nova-2', language: 'nl'    },
    turkish:   { model: 'nova-2', language: 'tr'    },
    portuguese:{ model: 'nova-2', language: 'pt'    },
  }

  return map[lang] || { model: 'nova-2', language: 'en' }
}

// ─── LANGUAGE INSTRUCTIONS (for system prompt) ────────────────────────────────
function getLangInstructions(language) {
  const lang = (language || 'english').toLowerCase().trim()

  if (lang === 'tamil') {
    return `
You MUST speak ONLY in Tamil language.
NEVER speak English under any circumstances — not even a single word.
Use natural conversational Tamil throughout the entire call.
Keep responses short (1-3 sentences).
Example phrases:
- "சரி, புரிந்தது"
- "உங்கள் appointment confirm ஆகிவிட்டது"
- "எப்படி உதவலாம்?"
- "ஏதாவது கேள்வி இருந்தா சொல்லுங்க"
- "நன்றி, உங்கள் நேரம் மதிக்கிறேன்"
`
  }

  if (lang === 'hindi') {
    return `
You MUST speak ONLY in Hindi language.
NEVER speak English under any circumstances — not even a single word.
Use natural conversational Hindi throughout the entire call.
Keep responses short (1-3 sentences).
Example phrases:
- "ठीक है, समझ गया"
- "आपकी appointment confirm हो गई है"
- "क्या मैं आपकी मदद कर सकता हूँ?"
- "कोई सवाल हो तो बताइए"
`
  }

  if (lang === 'telugu') {
    return `
You MUST speak ONLY in Telugu language.
NEVER speak English under any circumstances — not even a single word.
Use natural conversational Telugu throughout the entire call.
Keep responses short (1-3 sentences).
`
  }

  if (lang === 'malayalam') {
    return `
You MUST speak ONLY in Malayalam language.
NEVER speak English under any circumstances — not even a single word.
Use natural conversational Malayalam throughout the entire call.
Keep responses short (1-3 sentences).
`
  }

  if (lang === 'kannada') {
    return `
You MUST speak ONLY in Kannada language.
NEVER speak English under any circumstances — not even a single word.
Use natural conversational Kannada throughout the entire call.
Keep responses short (1-3 sentences).
`
  }

  if (lang === 'bengali') {
    return `
You MUST speak ONLY in Bengali language.
NEVER speak English. Use natural conversational Bengali.
Keep responses short (1-3 sentences).
`
  }

  if (lang === 'marathi') {
    return `
You MUST speak ONLY in Marathi language.
NEVER speak English. Use natural conversational Marathi.
Keep responses short (1-3 sentences).
`
  }

  if (lang === 'gujarati') {
    return `
You MUST speak ONLY in Gujarati language.
NEVER speak English. Use natural conversational Gujarati.
Keep responses short (1-3 sentences).
`
  }

  return 'Speak in clear, friendly English only. Keep responses short (1-3 sentences).'
}

// ─── CRITICAL LANGUAGE ENFORCEMENT ───────────────────────────────────────────
function getCriticalLangRule(language) {
  const lang = (language || 'english').toLowerCase().trim()

  const rules = {
    tamil:     'ABSOLUTE RULE: Respond ONLY in Tamil script. Every word must be Tamil. Speaking even one English word = complete failure. The human will speak Tamil — you reply in Tamil.',
    hindi:     'ABSOLUTE RULE: Respond ONLY in Hindi. Every word must be Hindi. Speaking even one English word = complete failure. The human will speak Hindi — you reply in Hindi.',
    telugu:    'ABSOLUTE RULE: Respond ONLY in Telugu. Every word must be Telugu. Never use English.',
    malayalam: 'ABSOLUTE RULE: Respond ONLY in Malayalam. Every word must be Malayalam. Never use English.',
    kannada:   'ABSOLUTE RULE: Respond ONLY in Kannada. Every word must be Kannada. Never use English.',
    bengali:   'ABSOLUTE RULE: Respond ONLY in Bengali. Every word must be Bengali. Never use English.',
    marathi:   'ABSOLUTE RULE: Respond ONLY in Marathi. Every word must be Marathi. Never use English.',
    gujarati:  'ABSOLUTE RULE: Respond ONLY in Gujarati. Every word must be Gujarati. Never use English.',
    punjabi:   'ABSOLUTE RULE: Respond ONLY in Punjabi. Every word must be Punjabi. Never use English.',
  }

  return rules[lang] || `ABSOLUTE RULE: Respond ONLY in ${lang}. Never switch to any other language.`
}

// ─── FIRST MESSAGE ────────────────────────────────────────────────────────────
function buildFirstMessage(language, contactName, campaignName) {
  const name = contactName || ''
  const lang = (language || 'english').toLowerCase().trim()

  const messages = {
    tamil:     `வணக்கம் ${name}! நான் AI assistant பேசுகிறேன். உங்களுக்கு எப்படி உதவலாம்?`,
    hindi:     `नमस्ते ${name}! मैं AI assistant बोल रहा हूँ। आपकी कैसे मदद कर सकता हूँ?`,
    telugu:    `నమస్కారం ${name}! నేను AI assistant మాట్లాడుతున్నాను. మీకు ఎలా సహాయం చేయగలను?`,
    malayalam: `നമസ്കാരം ${name}! ഞാൻ AI assistant ആണ്. എങ്ങനെ സഹായിക്കാം?`,
    kannada:   `ನಮಸ್ಕಾರ ${name}! ನಾನು AI assistant ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
    bengali:   `নমস্কার ${name}! আমি AI assistant বলছি। আপনাকে কীভাবে সাহায্য করতে পারি?`,
    marathi:   `नमस्कार ${name}! मी AI assistant बोलत आहे। तुम्हाला कशी मदत करू?`,
    gujarati:  `નમસ્તે ${name}! હું AI assistant બોલું છું। આપની કેવી રીતે મદદ કરી શકું?`,
  }

  return messages[lang] ||
    `Hello ${name}! This is an AI assistant calling on behalf of ${campaignName || 'our company'}. How can I help you today?`
}

// ─── END CALL MESSAGE ─────────────────────────────────────────────────────────
function getEndCallMessage(language) {
  const lang = (language || 'english').toLowerCase().trim()

  const messages = {
    tamil:     'உங்கள் நேரத்திற்கு நன்றி. நல்ல நாளாக இருக்கட்டும்!',
    hindi:     'आपके समय के लिए धन्यवाद। आपका दिन शुभ हो!',
    telugu:    'మీ సమయానికి ధన్యవాదాలు. మీకు శుభదినం!',
    malayalam: 'നിങ്ങളുടെ സമയത്തിന് നന്ദി. ഒരു നല്ല ദിവസം!',
    kannada:   'ನಿಮ್ಮ ಸಮಯಕ್ಕೆ ಧನ್ಯವಾದ. ಒಳ್ಳೆಯ ದಿನ!',
    bengali:   'আপনার সময়ের জন্য ধন্যবাদ। শুভ দিন!',
    marathi:   'आपल्या वेळेबद्दल धन्यवाद. शुभ दिवस!',
    gujarati:  'તમારા સમય માટે આભાર. શુભ દિવસ!',
  }

  return messages[lang] || 'Thank you for your time. Have a wonderful day!'
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
function buildSystemPrompt(call, campaign, language) {
  const langInstructions = getLangInstructions(language)
  const contactName      = call.contactName || 'there'
  const script           = campaign?.script || 'Offer an appointment booking service'
  const purpose          = campaign?.name   || 'appointment booking'
  const lang             = (language || 'english').toLowerCase().trim()

  return `
You are a professional AI voice assistant making a marketing call on behalf of a company.
${langInstructions}

Contact Name: ${contactName}
Campaign: ${purpose}
Your Goal: ${script}
Language: ${lang.toUpperCase()} — YOU MUST SPEAK ONLY IN ${lang.toUpperCase()}

== CONVERSATION FLOW ==
1. Greet the contact warmly by their name in ${lang}
2. Briefly introduce yourself and the purpose of the call in ${lang}
3. Present the offer clearly and naturally in ${lang}
4. Answer ANY questions they have — be knowledgeable and helpful — always in ${lang}
5. Handle objections politely in ${lang}:
   - "Too busy" → ask for a better time, offer to call back
   - "Not interested" → ask what their concern is, address it once
   - "Already have one" → acknowledge, highlight what makes this different
6. Try to book an appointment — ask for preferred date and time
7. Confirm the booking details clearly in ${lang}
8. If they decline after 2 genuine attempts → thank them and end politely in ${lang}

== STRICT RULES ==
- Keep each response SHORT: 1-3 sentences maximum
- Sound natural and human — NOT robotic or scripted
- ALWAYS speak ONLY in ${lang} — NEVER switch to English or any other language
- The human WILL speak to you in ${lang} — listen carefully and respond in ${lang}
- When appointment is confirmed: say the confirmation in ${lang}
- When call ends without booking: say a warm goodbye in ${lang}

== COLLECT THIS INFO IF THEY AGREE ==
- Preferred appointment date
- Preferred appointment time
- Any special requirements or notes

== IMPORTANT: AT END OF CALL ==
After the conversation, output a JSON block (invisible to caller) on a new line in this exact format:
CALL_DATA:{"date":"<date or null>","time":"<time or null>","notes":"<any notes or null>","outcome":"<booked|declined|no-answer|callback>","summary":"<one sentence summary in English>"}
`.trim()
}

// ─── INITIATE A SINGLE CALL ───────────────────────────────────────────────────
// POST /api/vapi/initiate
// Body: { callId }
router.post('/initiate', async (req, res) => {
  try {
    const { callId } = req.body

    const call = await Call.findById(callId)
      .populate('campaign')
      .populate('contact', 'language name')

    if (!call) return res.status(404).json({ message: 'Call not found' })

    // ── Resolve language ──────────────────────────────────────────────────────
    const language = (call.contact?.language || call.language || 'english').toLowerCase().trim()

    console.log(`🌐 Language resolved: "${language}"`)
    console.log(`📞 Initiating VAPI call to ${call.phone} | Language: ${language}`)

    // ── Build configs ─────────────────────────────────────────────────────────
    const systemPrompt    = buildSystemPrompt(call, call.campaign, language)
    const firstMessage    = buildFirstMessage(language, call.contactName || call.contact?.name, call.campaign?.name)
    const criticalRule    = getCriticalLangRule(language)
    const voiceConfig     = getVoiceConfig(language)
    const transcriberConf = getTranscriberConfig(language)

    console.log(`🎙️  Voice: ${voiceConfig.provider} / ${voiceConfig.voiceId}`)
    console.log(`👂 Transcriber: ${transcriberConf.model} / ${transcriberConf.language}`)

    const payload = {
      phoneNumberId: VAPI_PHONE_ID(),
      customer: {
        number: call.phone,
        name:   call.contactName || call.contact?.name || 'Contact',
      },
      assistant: {
        name:  'AI Sales Assistant',

        // ── Language model ────────────────────────────────────────────────────
        model: {
          provider: 'openai',
          model:    'gpt-4o',
          messages: [
            {
              role:    'system',
              content: systemPrompt,
            },
            {
              role:    'system',
              content: criticalRule,  // double enforcement
            },
            {
              // Third enforcement — tells GPT the user will SPEAK in this language
              role:    'system',
              content: `The caller will speak to you in ${language}. You MUST reply ONLY in ${language}. Every single word of your response must be in ${language}. Never use English even for filler words.`,
            },
          ],
          temperature: 0.7,
        },

        // ── Voice (Azure Neural for Indian languages) ─────────────────────────
        voice: voiceConfig,

        // ── First spoken message ──────────────────────────────────────────────
        firstMessage,

        // ── End of call ───────────────────────────────────────────────────────
        endCallMessage: getEndCallMessage(language),
        endCallPhrases: [
          'goodbye', 'bye', 'not interested', 'remove me', 'do not call',
          'போகட்டும்',    // Tamil bye
          'अलविदा',       // Hindi bye
          'వెళ్తాను',     // Telugu bye
          'പോകണം',       // Malayalam bye
          'ಹೋಗುತ್ತೇನೆ',  // Kannada bye
        ],

        // ── Transcriber (CRITICAL — correct language code so user speech is heard) ──
        transcriber: {
          provider: 'deepgram',
          model:    transcriberConf.model,
          language: transcriberConf.language,
          // smartFormat helps with Indian language punctuation
          smartFormat: true,
        },

        // ── Webhook ───────────────────────────────────────────────────────────
        serverUrl:       `${process.env.WEBHOOK_URL || 'http://localhost:5000'}/api/vapi/webhook`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || '',

        // ── Post-call analysis ────────────────────────────────────────────────
        analysisPlan: {
          summaryPrompt: `Summarize this sales call in 1-2 sentences in English. Include whether an appointment was booked and any key details mentioned.`,
          structuredDataPrompt: `Extract the following from the call transcript as JSON:
{
  "preferredDate": "<appointment date mentioned, or null>",
  "preferredTime": "<appointment time mentioned, or null>",
  "notes": "<any special requirements, concerns, or extra info, or null>",
  "outcome": "<one of: booked | declined | callback | no-answer>"
}
Return ONLY valid JSON, no explanation.`,
          structuredDataSchema: {
            type: 'object',
            properties: {
              preferredDate: { type: 'string', nullable: true },
              preferredTime: { type: 'string', nullable: true },
              notes:         { type: 'string', nullable: true },
              outcome:       { type: 'string', enum: ['booked', 'declined', 'callback', 'no-answer'] },
            },
          },
        },

        metadata: { callId: callId.toString() },
      },
    }

    const { data: vapiCall } = await vapiClient().post('/call/phone', payload)

    await Call.findByIdAndUpdate(callId, {
      twilioSid:  vapiCall.id,
      status:    'calling',
      startedAt: new Date(),
    })

    console.log(`✅ VAPI call created: ${vapiCall.id}`)
    res.json({ message: 'Call initiated', vapiCallId: vapiCall.id })

  } catch (err) {
    console.error('❌ VAPI initiate error:', err.response?.data || err.message)
    res.status(500).json({ message: err.response?.data?.message || err.message })
  }
})

// ─── VAPI WEBHOOK ─────────────────────────────────────────────────────────────
// POST /api/vapi/webhook
router.post('/webhook', async (req, res) => {
  try {
    const event   = req.body
    const { message } = event

    if (!message) return res.sendStatus(200)

    const callId = message.call?.metadata?.callId

    // ── Status updates ────────────────────────────────────────────────────────
    if (message.type === 'status-update') {
      const statusMap = {
        'queued':      'calling',
        'ringing':     'calling',
        'in-progress': 'in-progress',
        'forwarding':  'in-progress',
        'ended':       'completed',
      }
      const newStatus = statusMap[message.status] || message.status

      if (callId) {
        const call = await Call.findByIdAndUpdate(callId, {
          status: newStatus,
          ...(message.status === 'ended' ? { endedAt: new Date() } : {}),
        }, { new: true })

        if (call?.contact && message.status === 'ended') {
          await Contact.findByIdAndUpdate(call.contact, {
            lastCalled: new Date(),
            status: 'called',
          })
        }
      }
    }

    // ── End-of-call report ────────────────────────────────────────────────────
    if (message.type === 'end-of-call-report') {
      const transcript     = message.transcript || ''
      const summary        = message.summary    || ''
      const duration       = message.durationSeconds || 0
      const structuredData = message.analysis?.structuredData || {}

      const vapiOutcome = structuredData.outcome || ''
      const textToScan  = transcript + ' ' + summary

      const booked   = vapiOutcome === 'booked'   || /confirmed|appointment.*set|appointment.*book|scheduled|we will send/i.test(textToScan)
      const declined = vapiOutcome === 'declined' || /not interested|do not call/i.test(textToScan)
      const callback = vapiOutcome === 'callback' || /call.*back|better time|try.*again later/i.test(textToScan)

      const finalStatus  = booked ? 'booked' : declined ? 'declined' : 'completed'
      const finalOutcome = booked ? 'booked' : callback ? 'callback' : declined ? 'not-interested' : 'completed'

      const collectedInfo = {
        preferredDate: structuredData.preferredDate || extractDate(transcript) || null,
        preferredTime: structuredData.preferredTime || extractTime(transcript) || null,
        notes:         structuredData.notes         || null,
      }

      const update = {
        transcript,
        aiSummary:    summary,
        collectedInfo,
        duration,
        status:       finalStatus,
        outcome:      finalOutcome,
        endedAt:      new Date(),
        ...(booked ? { bookedAt: new Date() } : {}),
      }

      if (callId) {
        const call = await Call.findByIdAndUpdate(callId, update, { new: true })

        if (booked && call?.campaign) {
          await Campaign.findByIdAndUpdate(call.campaign, { $inc: { booked: 1 } })
        }

        if (call?.contact) {
          await Contact.findByIdAndUpdate(call.contact, {
            lastCalled: new Date(),
            status: 'called',
          })
        }

        console.log(`📋 Call ${callId} ended | Status: ${finalStatus} | Duration: ${duration}s`)
        if (collectedInfo.preferredDate) {
          console.log(`📅 Appointment: ${collectedInfo.preferredDate} @ ${collectedInfo.preferredTime}`)
        }
      }
    }

    // ── Real-time transcript chunks ───────────────────────────────────────────
    if (message.type === 'transcript') {
      const role = message.role === 'assistant' ? 'AI' : 'CALLER'
      console.log(`[${role}]: ${message.transcript}`)
    }

    res.sendStatus(200)

  } catch (err) {
    console.error('❌ VAPI webhook error:', err.message)
    res.sendStatus(500)
  }
})

// ─── GET CALL STATUS FROM VAPI ────────────────────────────────────────────────
// GET /api/vapi/call-status/:vapiCallId
router.get('/call-status/:vapiCallId', async (req, res) => {
  try {
    const { data } = await vapiClient().get(`/call/${req.params.vapiCallId}`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.response?.data?.message || err.message })
  }
})

// ─── TRANSCRIPT FALLBACK EXTRACTORS ──────────────────────────────────────────
function extractDate(transcript) {
  const match = transcript.match(
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?|\btomorrow\b|\bnext\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{4}-\d{2}-\d{2}\b)/i
  )
  return match ? match[0] : null
}

function extractTime(transcript) {
  const match = transcript.match(
    /\b(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|morning|afternoon|evening|noon)\b/i
  )
  return match ? match[0] : null
}

// ─── DOGRAH AI CALL ───────────────────────────────────────────────────────────
// POST /api/vapi/dograh-call

router.post('/dograh-call', async (req, res) => {
  try {
    const { callId } = req.body
    const call = await Call.findById(callId)
    if (!call) return res.status(404).json({ message: 'Call not found' })

    const workflowUUID = process.env.DOGRAH_WORKFLOW_UUID
    const apiKey = process.env.DOGRAH_API_KEY
    const url = `https://app.dograh.com/api/v1/public/agent/workflow/${workflowUUID}`
    
    console.log('🔗 URL:', url)
    console.log('🔑 API Key:', apiKey?.substring(0, 10) + '...')
    console.log('📱 Phone:', call.phone)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        phone_number: call.phone,
        telephony_configuration_id: 357,
      })
    })

    console.log('📊 Status code:', response.status)
    const data = await response.json()
    console.log('✅ Dograh response:', JSON.stringify(data))

    await Call.findByIdAndUpdate(callId, { status: 'calling', startedAt: new Date() })
    res.json({ message: 'Dograh AI call initiated', data })
  } catch (err) {
    console.error('❌ Dograh error:', err)
    res.status(500).json({ message: err.message })
  }
})
module.exports = { router }
