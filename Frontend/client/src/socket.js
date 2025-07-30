// socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  withCredentials: true, // ✅ allow cookies
  transports: ['websocket']
});

export default socket;
