const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'Strict', 
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { 
    expiresIn: '7d' 
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("user data :: ",req.body);

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username:name,
      email,
      password: hashedPassword,
      course: "pending",
      Intro:"pending"
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    console.log("generated token is ::",accessToken,refreshToken);
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.log("Signup error:", err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: `Invalid credentials :: ${email}` });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: `Invalid credentials :: ${password}` });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: `Something went wrong ${err}` });
  }
};
