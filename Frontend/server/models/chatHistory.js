// models/ChatHistory.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  messages: [messageSchema],
  session_id: { type: mongoose.Schema.Types.Mixed, required: false },
  createdAt: { type: Date, default: Date.now },
  uploadedFileName: { type: String }
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
