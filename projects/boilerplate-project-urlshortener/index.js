require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const app = express()

// Middleware
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/public', express.static(`${process.cwd()}/public`))

// MongoDB Connection
mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err))

// Mongoose Schema & Model
const urlSchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: { type: Number, required: true },
})
const Url = mongoose.model('Url', urlSchema)

// Home Route
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html')
})

// POST: Create Short URL
app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url

  // Basic URL validation
  const urlRegex = /^https?:\/\/[\w.-]+\.[a-z]{2,}(\/.*)?$/i
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' })
  }

  try {
    // Check if already in DB
    let foundUrl = await Url.findOne({ original: originalUrl })
    if (foundUrl) {
      return res.json({
        original_url: foundUrl.original,
        short_url: foundUrl.short,
      })
    }

    // Generate next short ID
    const last = await Url.findOne().sort({ short: -1 })
    const nextShort = last ? last.short + 1 : 1

    // Save new short URL
    const newUrl = new Url({ original: originalUrl, short: nextShort })
    await newUrl.save()

    return res.json({
      original_url: newUrl.original,
      short_url: newUrl.short,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
})

// GET: Redirect to Original URL
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = parseInt(req.params.short_url)

  try {
    const found = await Url.findOne({ short: shortUrl })
    if (!found) return res.json({ error: 'No short URL found' })

    return res.redirect(found.original)
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
})

// Start Server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
