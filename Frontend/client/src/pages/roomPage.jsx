import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import socket from '../socket';

export default function RoomsPage() {
    const [rooms, setRooms] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});
    const [newRoomName, setNewRoomName] = useState('');
    const [showInput, setShowInput] = useState(false);
    const navigate = useNavigate(); 
  
    useEffect(() => {
        socket.on('connect', () => {
            console.log("✅ Socket connected", socket.id);
        });
        // Listen for active rooms being updated
        console.log("fetching active rooms!")
        socket.on('active_rooms', (rooms) => {
            setRooms(rooms);
        });

        // Listen for typing users in rooms
        socket.on('user_typing', ({username}) => {
            setTypingUsers((prev) => ({ ...prev, [username]: true }));
        });

        socket.on('user_stop_typing', ({username}) => {
            setTypingUsers((prev) => {
                const updated = { ...prev };
                delete updated[username];
                return updated;
        });
    });

    return () => {
      socket.off('active_rooms');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, []);

  const handleJoinRoom = (roomId) => {
    socket.emit('join_room', roomId, (ack) => {
        if (ack.success) {
          navigate(`/chit-chat/${roomId}`);
        } else {
          console.error('Failed to join room:', ack.error);
        }
    });
  };

  const handleTyping = (roomId) => {
    socket.emit('typing', { roomId });
  };

  const handleStopTyping = (roomId) => {
    socket.emit('stop_typing', { roomId });
  };
  const handleCreateRoom = () => {
    console.log("Want to create a new room!!");

    const newRoomId = uuidv4();
    socket.emit('create_room', newRoomId, (ack) => {
        if (ack.success) {
            setTimeout(() => {
                navigate(`/chit-chat/${newRoomId}`);
            }, 300);
        } else {
          console.error('Failed to create room:', ack.error);
        }
    });

    setTimeout(() => {
        navigate(`/chit-chat/${newRoomId}`);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
            <h1 className="text-4xl font-extrabold tracking-wide bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                Active Chat Rooms
            </h1>
            <button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-all"
                onClick={handleCreateRoom}
            >
                ➕ Create New Room
            </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full text-center mt-2"
                >
                    <div className="text-6xl mb-4 animate-pulse">🛋️</div>
                    <h2 className="text-xl font-semibold mb-2">
                        No rooms are buzzing right now.
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Be the first to start a convo!
                    </p>
                    <button
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-all"
                        onClick={handleCreateRoom}
                    >
                        ➕ Create Room
                    </button>
                </motion.div>
            ) : (
                <AnimatePresence>
                    {rooms.map((room) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between"
                        >
                            <div>
                                <h2 className="text-lg font-bold mb-1">💬 Room: <span className="text-blue-400">{room.id}</span></h2>
                                <p className="text-sm text-gray-400">
                                    Users: {room.users.length > 0 ? room.users.join(', ') : 'Empty'}
                                </p>
                            </div>
                            <div className="mt-4 flex justify-between items-end">
                                <button
                                    onClick={() => handleJoinRoom(room.id)}
                                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-all text-white"
                                >
                                    Join Room
                                </button>
                                <div className="text-xs text-pink-300 italic transition-opacity duration-300">
                                    {room.users.map(
                                        (u) => typingUsers[u] && <span key={u}>{u} is typing... </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </div>
    </div>
  );
}

    
