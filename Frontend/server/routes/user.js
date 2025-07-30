const bcrypt = require('bcrypt');
const {CreateProject,fetchPorjectHistory } = require('../controllers/ProjectController')
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/update-course',authMiddleware, async (req, res) => {
  console.log(req.body);
  // const { username, email, password, course } = req.body;
  // console.log(username, email, password, course)
  try {
    const user = await User.findById(req.user._id);
    user.course = req.body.course;
    user.Intro = req.body.intro;
    await user.save();
    res.status(201).json({ message: 'Course updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save user' });
  }
});
router.post('/create-project',authMiddleware,CreateProject);
router.get('/project-history',authMiddleware,fetchPorjectHistory);
module.exports = router;