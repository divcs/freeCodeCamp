// models/Exercise.js
const mongoose = require('mongoose')

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
})

module.exports = mongoose.model('Exercise', exerciseSchema)
