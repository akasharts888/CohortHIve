const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const { registerUser, loginUser } = require('../controllers/authController');
const ChatHistory = require('../models/chatHistory');

require('dotenv').config();

router.post('/signup', registerUser);
router.post('/login',loginUser);
const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT Secret:', process.env.JWT_SECRET);

router.get('/verify', authMiddleware,async (req, res) => {
  console.log('user from auth ::',req.user);
  res.json({ username: req.user.name, topic: req.user.topic || 'pending' })
});

router.get('/refresh', authMiddleware,async (req, res) => {
  console.log('user from auth ::',req.user);
  res.json( { message: `Perfect` })
});

// Chat history route (protected)


module.exports = router;