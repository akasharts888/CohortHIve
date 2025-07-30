const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const QuizResult = require('../models/QuizeModal');
const User = require("../models/User");
const CourseProgress = require('../models/CourseProgress');

router.post('/quiz-start', async (req, res) => {
    try {
      console.log("getTheQUize!",req.body);
      const { course,topic } = req.body;
      const response = await axios.post('http://localhost:5813/generate-quize',{
        course_name:course,
        topic_name:topic || ''
      }); // Python backend
    //   console.log("response is::",response.data);
      const quiz = await response.data;
      console.log("Quize Data ::",quiz);
      res.json(quiz); // array of { question, options: [], correctIndex }
    } catch (err) {
      res.status(500).json({ message: "Failed to get quiz questions" });
    }
});
  
router.post('/quiz-submit', authMiddleware, async (req, res) => {
    const { userAnswers, originalQuestions } = req.body;
    let score = 0;
  
    originalQuestions.forEach((q, i) => {
      if (userAnswers[i] === q.correctIndex) score++;
    });
    const result = new QuizResult({
      user_id: req.user.id,
      score,
      total: originalQuestions.length,
      date: new Date(),
    });
  
    let feedback;
    const percentage = (score / originalQuestions.length) * 100;

    if (percentage === 100) {
      feedback = "Excellent! You nailed it! 💯";
    } else if (percentage >= 75) {
      feedback = "Great job! Just a few small areas to review.";
    } else if (percentage >= 50) {
      feedback = "Not bad! Keep practicing and you'll get there.";
    } else {
      feedback = "Don't worry, learning takes time. Let's try again!";
    }

    await result.save();
    res.json({ message: "Score saved", score });
});
router.get('/dashboard', authMiddleware, async (req, res) => {
  const quizResults = await QuizResult.find({ user_id: req.user.id }).sort({ date: -1 });
  const user = await User.findById(req.user.id).select('username email course Intro');
  console.log("user detials ::",user);
  res.json({ user, quizResults });
});

router.get('/quiz-status', authMiddleware, async (req, res) => {
  
  const today = new Date().toISOString().slice(0, 10);
  const quizTaken = await QuizResult.exists({
    user_id: req.user.id,
    date: {
      $gte: new Date(today),               // start of today
      $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
    }  // simplistic: YYYY-MM-DD
  });
  console.log('quizTaken ::',quizTaken);
  res.json({ quizTaken: Boolean(quizTaken) });
});

router.get('/yesterday-topic', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log("user_id is",req.user.id);
  try {
    const progress = await CourseProgress.findOne({ user_id: userId });

    if (!progress) {
      console.log("course_name",req.user.course);
      return res.status(200).json({
        isNewUser: true,
        course_name: req.user.course,
        topic_name: null
      });
    }
    // Get the last topic from topic_history
    const lastTopic = progress.topic_history.length > 0 
      ? progress.topic_history[progress.topic_history.length - 1]
      : null;
    console.log("topic name ::",lastTopic || "No topics found");
    return res.status(200).json({
      isNewUser: !lastTopic,
      course_name: progress.course_name,
      topic_name: lastTopic?.topic_name || null,
    });
    
  } catch (err) {
    console.error("Error fetching yesterday's topic:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;