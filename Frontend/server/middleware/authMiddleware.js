const jwt = require('jsonwebtoken');
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  console.log("cookies",token);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    return res.status(401).json({ message: `Invalid token: ${err}` });
  }
};

module.exports = authMiddleware;
