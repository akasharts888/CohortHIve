// models/CourseProgress.js
const mongoose = require('mongoose');


const topicSchema = new mongoose.Schema({
    topic_name: { type: String, required: true },
    date: { type: Date, required: true }
});

const courseProgressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_name: { type: String, required: true },
  topic_history: [topicSchema]
});

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
