const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: Number,
  total: Number,
  feedback: String,
  date: Date,
});

module.exports = mongoose.model("QuizResult", quizResultSchema);
