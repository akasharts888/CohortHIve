const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ChatSession = require("../models/chatHistory");
const User = require('../models/User');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
  handleTopicIntro,
  handleFollowUp,
  SuggestQuery,
  LiveVoiceChat,
  NewTopic,
  UploadFile
} = require('../controllers/chatbotController');

// Initial topic selection
router.post('/course-intro', handleTopicIntro);
router.post('/ask-voice',authMiddleware,LiveVoiceChat);
router.post('/upload-doc',authMiddleware, upload.single('file'),UploadFile);
// POST /api/chat/save
router.post('/chatbot-save', authMiddleware, async (req, res) => {
  const { messages, session_id } = req.body;
  const userId = req.user.id;
  
  console.log("User name and thier Message ::",messages,session_id);
  try {
    if (!session_id) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    const session = await ChatSession.findOne({ session_id: session_id, user_id: userId });
    if (session) {
      session.messages.push(...messages);
      await session.save();

      return res.status(200).json({ message: 'Messages saved to session', session_id });
    }

    const newSession = new ChatSession({
        user_id: userId,
        username: req.user.username,
        session_id:session_id,
        messages: messages,
        uploadedFileName:""
    });
    await newSession.save();
    res.status(200).json({ message: 'New session created and messages saved',session_id: newSession._id });
  } catch (err) {
    console.error("Chat save failed:", err);
    res.status(500).json({ message: 'Failed to save message' });
  }
});
router.get('/chatbot-sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("user id is ::",userId);
    const sessions = await ChatSession.find({ user_id: userId })
      .select('session_id -_id') // Return only what we need
      .sort({ createdAt: -1 });
    console.log("all session ::",sessions);
    res.status(200).json({ sessions:sessions });
  } catch (err) {
    console.error("Failed to fetch sessions:", err);
    res.status(500).json({ message: 'Failed to fetch chat sessions' });
  }
});
router.get('/chatbot-history/:session_id', authMiddleware, async (req, res) => {
  console.log("Entered!");
  const { session_id } = req.params;
  const userId = req.user.id;
  const session = await ChatSession.findOne({ session_id: session_id, user_id: userId });
  console.log("Chat :",session);
  if (!session) return res.json({ messages: [] });
  res.json({ messages: session.messages,uploadedFileName: session.uploadedFileName });
});

router.post('/daily-learn', authMiddleware,NewTopic)
router.post('/suggest-query', SuggestQuery);

// Follow-up user questions
router.post('/Chatbotask',authMiddleware, handleFollowUp);

module.exports = router;