const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/user');
const noteRoutes = require('./routes/noteRoute');
const chatRoutes = require('./routes/chatbotRoute');
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quize');
const initChatServer = require('./controllers/ChatRoom');

const PORT = 5000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,        
    methods: ["GET", "POST"]
  }
});
app.use(cookieParser());

app.use('api/chat',ChatServer => {
  ChatServer(server);
});

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,          
}));

app.use(express.json()); 
app.use('/api/auth', authRoutes);


mongoose.connect('mongodb://localhost:27017/autotutor');

app.use('/api', userRoutes);
app.use('/api', chatRoutes);
app.use('/api', quizRoutes);
app.use('/api', noteRoutes);


initChatServer(io);



server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
