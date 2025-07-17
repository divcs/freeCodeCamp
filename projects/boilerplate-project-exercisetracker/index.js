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

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)

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
  try {
    const user = await User.findById(req.params._id)
    if (!user) return res.json({ error: 'User not found' })

    const { description, duration, date } = req.body

    const exercise = new Exercise({
      userId: user._id,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date(),
    })

    const savedExercise = await exercise.save()

    res.json({
      _id: user._id,
      username: user.username,
      date: savedExercise.date.toDateString(),
      duration: savedExercise.duration,
      description: savedExercise.description,
    })
  } catch (err) {
    res.status(500).json({ error: 'Exercise add failed.' })
  }
})

// Get logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id)
    if (!user) return res.json({ error: 'User not found' })

    let { from, to, limit } = req.query
    let filter = { userId: req.params._id }

    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to) filter.date.$lte = new Date(to)
    }

    let query = Exercise.find(filter).select('-_id description duration date')
    if (limit) query.limit(parseInt(limit))

    const exercises = await query.exec()

    const log = exercises.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }))

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log,
    })
  } catch (err) {
    res.status(500).json({ error: 'Log fetch failed.' })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('App is listening on port ' + listener.address().port)
})
