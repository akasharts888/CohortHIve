const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },  // added email
  password: { type: String, required: true },              // added password
  course: { type: String, required: true },
  Intro: { type: String, required: true },
  refreshToken: { type: String},
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', userSchema);
