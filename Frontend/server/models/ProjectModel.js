const mongoose = require('mongoose');


const ProjectSchema = new mongoose.Schema({
    Project_outline: { type: String },
    date: { type: Date, required: true }
});

const ProjectProgressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_name: { type: String, required: true },
  Project_history: [ProjectSchema ]
});

module.exports = mongoose.model('ProjectProgress', ProjectProgressSchema);
