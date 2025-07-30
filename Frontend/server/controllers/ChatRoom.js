const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function initChatServer(io){
  const activeRooms = {};

  io.use(async (socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return next(new Error("Authentication error: No cookies sent"));
    }

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.refreshToken; // or accessToken if you store it that way

    if (!token) {
      return next(new Error("Authentication error: Token not found in cookies"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id); // or however you store user ID
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user; // attach the user to the socket
      next();
    } catch (err) {
      console.error("Socket auth error:", err);
      next(new Error("Authentication error"));
    }
  });
  io.on('connection', (socket) => {
      console.log(`🔌 ${socket.user.username} connected (${socket.id})`);
      console.log("current rooms are ::",getActiveRooms());
      // Send active rooms on connect
      socket.emit('active_rooms', getActiveRooms());
      
      // Unified room joining handler (for both create and join)
      const handleJoinRoom = (roomId) => {
        if (!activeRooms[roomId]) {
          activeRooms[roomId] = { users: [] };
        }
        
        console.log(`room with id ${roomId} is ${activeRooms[roomId]}`)
        const alreadyJoined = activeRooms[roomId].users.some(u => u.id === socket.id);
        
        if (!alreadyJoined) {
          socket.join(roomId);
          activeRooms[roomId].users.push({ 
            id: socket.id, 
            username: socket.user.username 
          });
          
          console.log(`🆕 ${socket.user.username} joined room: ${roomId}`);
          io.emit('active_rooms', getActiveRooms());
          console.log('active_rooms', getActiveRooms())
          // Send acknowledgement back to client
          return { success: true, roomId };
        }
        
        return { success: false, error: "Already joined this room" };
      };
    
      // Create or join a room
      socket.on('create_room', (roomId, callback) => {
        console.log(`🚪 ${socket.user.username} creating room: ${roomId}`);
        const result = handleJoinRoom(roomId);
        if (typeof callback === 'function') {
          callback(result);
        }
      });
    
      // Explicit join room handler
      socket.on('join_room', (roomId, callback) => {
        console.log(`🚪 ${socket.user.username} joining room: ${roomId}`);
        console.log(activeRooms[roomId]);
        if (!activeRooms[roomId]) {
          const error = "Room does not exist";
          console.log(error);
          if (typeof callback === 'function') {
            callback({ success: false, error });
          }
          return;
        }
        
        const result = handleJoinRoom(roomId);
    
        // Notify other users in the room about the new user
        socket.broadcast.to(roomId).emit('user_joined', {
          username: socket.user.username,
          userId: socket.user._id
        });
    
        if (typeof callback === 'function') {
          callback(result);
        }
      });
    
      // Leave room handler
      socket.on('leave_room', (roomId) => {
        if (activeRooms[roomId]) {
          
          socket.broadcast.to(roomId).emit('user_left', {
            username: socket.user.username,
            userId: socket.user._id
          });
    
          activeRooms[roomId].users = activeRooms[roomId].users.filter(
            user => user.id !== socket.id
          );
          
          if (activeRooms[roomId].users.length === 0) {
            delete activeRooms[roomId];
          }
          
          socket.leave(roomId);
          console.log(`🚪 ${socket.user.username} left room: ${roomId}`);
          io.emit('active_rooms', getActiveRooms());
        }
      });
      // Handle chat message
      socket.on('send_message', (data) => {
        // Attach user data to the message
        console.log("user Message: ",data);
        const messageWithUser = {
          ...data,
          username: socket.user.username,
          userId: socket.user._id,
        };
        socket.broadcast.to(data.session_id).emit('receive_message',  messageWithUser);
      });
    
      // 🔤 Typing indicator
      socket.on('typing', (roomId)=> {
        // const roomId = payload?.roomId;
        if(!roomId) {
          console.log("No roomId provided for typing indicator");
          return;
        }
        socket.broadcast.to(roomId).emit('user_typing', { username: socket.user.username ,userId: socket.user._id});
      });
    
      socket.on('stop_typing', (roomId) => {
        // const roomId = payload?.roomId;
        if(!roomId) {
          console.log("No roomId provided for stop typing indicator");
          return;
        }
        socket.broadcast.to(roomId).emit('user_stop_typing', { userId: socket.user._id });
      });
    
      socket.on('disconnect', () => {
        console.log(`❌ ${socket.user.username} disconnected (${socket.id})`);
    
        for (const roomId in activeRooms) {
          const users = activeRooms[roomId].users;
          activeRooms[roomId].users = users.filter(user => user.id !== socket.id);
    
          // Clean up empty rooms
          if (activeRooms[roomId].users.length === 0) {
            delete activeRooms[roomId];
          }
        }
        // Update room list
        io.emit('active_rooms', getActiveRooms());
      });
    });
    function getActiveRooms() {
      return Object.entries(activeRooms).map(([id, data]) => ({
        id,
        users: data.users.map((u) => u.username),
      }));
    }
};

// module.export = initChatServer;