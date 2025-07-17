const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const { Schema } = mongoose
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

mongoose.connect(process.env.DB_URI)

// --- Mongoose Schemas ---
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
})

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
})

const User = require('./models/User')
const Exercise = require('./models/Exercise')

// --- Routes ---

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username })
    const savedUser = await user.save()
    res.json({ username: savedUser.username, _id: savedUser._id })
  } catch (err) {
    res.status(500).json({ error: 'User creation failed.' })
  }
})

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, '_id username')
  res.json(users)
})

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body
  const { _id } = req.params

  try {
    const user = await User.findById(_id)
    if (!user) return res.status(400).json({ error: 'User not found' })

    const exercise = new Exercise({
      userId: _id,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date(),
    })

    await exercise.save()

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Get logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query
  const { _id } = req.params

  try {
    const user = await User.findById(_id)
    if (!user) return res.status(400).json({ error: 'User not found' })

    const query = { userId: _id }

    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = new Date(from)
      if (to) query.date.$lte = new Date(to)
    }

    let exercises = await Exercise.find(query).limit(parseInt(limit) || 1000)

    const log = exercises.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }))

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log,
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('App is listening on port ' + listener.address().port)
})
