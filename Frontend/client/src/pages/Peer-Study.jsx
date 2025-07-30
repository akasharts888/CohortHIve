import { useRef,useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from 'react-router-dom';
import Lottie from "lottie-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import botAnimation from "../assets/Animation - 1744465057560.json"
import typingAnimation from '../assets/Animation - 1744300302640.json';
// import { io } from "socket.io-client";
import socket from '../socket';
const PeerStudy = () => {
    const recommendedQueries = [
        "What's one thing you're excited about today?",
        "If you could learn anything instantly, what would it be?",
        "What's your favorite way to relax after studying?",
        "What’s something new you learned this week?",
        "What’s your productivity hack?",
        "Do you prefer studying solo or in a group?",
        "What’s the most underrated study tip?",
        "If you could ask an expert one question, what would it be?",
        "What distracts you the most while studying?",
        "What's your current favorite learning resource?"
    ];

    // const socket = useRef(null);
    const {session_id} = useParams();
    console.log("session_id is ::",session_id);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);
    const [sessionId, setSessionId] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [chatSessions, setChatSessions] = useState([]); // fetched session list
    const navigate = useNavigate();
    const [suggestedQueries, setSuggestedQueries] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const [expanded, setExpanded] = useState(false);
    const visibleQueries = expanded ? suggestedQueries : suggestedQueries.slice(0, 3);
    const typingTimeout = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {      
        socket.emit('join_room', session_id, (ack) => {
            if (!ack.success) {
              console.error('Failed to join room:', ack.error);
            }
        });

        const messageHandler = (data) => {
            setMessages(prev => [...prev, data]);
        };

        // New typing handlers
        const onUserTyping = ({ username, userId }) => {
            setTypingUsers(prev => ({ ...prev, [userId]: username }));
        };

        const onUserStopTyping = ({ userId }) => {
            setTypingUsers(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });
        };

        // Join/leave notifications
        const onUserJoined = ({ username }) => {
            toast.info(`${username} joined the chat`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        };
        const onUserLeft = ({ username }) => {
            toast.warn(`${username} left the chat`, {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
        };
        socket.on("receive_message", messageHandler);
        socket.on("user_typing", onUserTyping);
        socket.on("user_stop_typing", onUserStopTyping);
        socket.on("user_joined", onUserJoined);
        socket.on("user_left", onUserLeft);

        return () => {
            socket.off("receive_message", messageHandler);
            socket.off("user_typing", onUserTyping);
            socket.off("user_stop_typing", onUserStopTyping);
            socket.off("user_joined", onUserJoined);
            socket.off("user_left", onUserLeft);
            socket.emit('leave_room', session_id);
        };
    }, [session_id]);
      
    useEffect(() => {
      setSessionId(session_id); // Assuming you have this in state
      setMessages([]);
      setSuggestedQueries([])
    }, [session_id]);

    // New chat handler
    const handleNewChat = async () => {
      const newSessionId = uuidv4();
      navigate(`/chit-chat/${newSessionId}`);
    };

    // Auto scroll Indicator
    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage =  async (message) => {
      console.log("user message : ",message);
      if (!message || !message.trim()) return;

      const msg = {
        sender: 'user',
        username:currentUser,
        text: message,
        session_id,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, msg]);
      socket.emit("send_message", msg);
      setInput('');

      // Clear any pending typing indicators
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
      socket.emit('stop_typing', session_id);
    };

    // typing indicators
    const handleInputChange = (e) => {
        setInput(e.target.value);
        
        // Start typing indicator if input is not empty
        if (e.target.value.trim() !== '') {
            if (!typingTimeout.current) {
                socket.emit('typing', session_id);
            }
            
            // Reset the typing timeout
            clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
                socket.emit('stop_typing', session_id);
                typingTimeout.current = null;
            }, 1000);
        } else {
            // If input is empty, stop typing
            clearTimeout(typingTimeout.current);
            typingTimeout.current = null;
            socket.emit('stop_typing', session_id);
        }
    };
    return (
        <div className="flex h-screen bg-white dark:bg-gray-900">
            <ToastContainer />
            <div className="flex flex-1 bg-white dark:bg-gray-900">

                {/* ⏪ Left Drawer */}
                <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 z-[1000] ${
                    isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                >
                    <div className="p-4 border-b font-semibold text-lg">Your Chats</div>
                        <ul className="overflow-y-auto max-h-full">
                        {chatSessions.map(session => (
                            <li
                            key={session.session_id}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => navigate(`/learn/${session.session_id}`)}
                            >
                            {session.session_id}
                            </li>
                        ))}
                        </ul>
                    </div>
                    {/* Vertical Drawer Toggle */}
                    <button
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        className="fixed top-1/2 left-0 z-[1100] transform -translate-y-1/2 p-2 rounded-r-full bg-white/80 dark:bg-gray-800/80 shadow-xl border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 ease-in-out"
                    >
                        <motion.div
                        animate={{ rotate: isDrawerOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-xl font-bold text-gray-700 dark:text-white"
                        >
                        ▶
                        {/* {isDrawerOpen ? '<' : '>'} */}
                        </motion.div>
                    </button>
                    <button
                        onClick={handleNewChat}
                        className="fixed top-[calc(50%+50px)] left-0 z-[1099] transform -translate-y-1/2 p-2 rounded-r-full bg-purple-600 text-white shadow-xl hover:bg-purple-700 transition-all duration-300 ease-in-out"
                    >
                        <motion.div
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        className="font-semibold"
                        >
                        + New
                        </motion.div>
                    </button>
                    <button
                        onClick={() => {
                            socket.emit('leave_room', session_id);
                            navigate('/rooms'); // Change to your desired redirect path
                        }}
                        className="fixed left-0 z-[1099] top-[calc(50%+100px)] bg-red-600 text-white transform -translate-y-1/2 p-2 rounded-r-full hover:bg-red-600 transition-all duration-300 ease-in-out"
                    >
                        - Leave
                    </button>

                    {/*  Main Chat Area */}
                    <div className={`flex flex-col pt-5 flex-1 transition-all duration-300 ${isDrawerOpen ? 'ml-64' : 'ml-0'}`}>
                    {/*  Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 space-y-4 scrollbar-hide scroll-smooth">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 transition-opacity duration-500 animate-fadeIn">
                                <div className="w-60 h-60">
                                    <Lottie animationData={botAnimation} loop={true} />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 animate-bounce">
                                    👋 Hey there! Let's have Chit Chat
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Talk about anything anything to get started...
                                </p>

                                <div className="flex flex-wrap justify-center gap-3 mt-4 px-4">
                                    {recommendedQueries.map((query, index) => (
                                    <motion.button
                                        key={index}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => sendMessage(query)}
                                        className="px-4 py-2 rounded-full border border-purple-600 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-all shadow-sm"
                                    >
                                        {query}
                                    </motion.button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                        <AnimatePresence>
                            {messages.map((msg, idx) => {
                                const isCurrentUser = msg.username === currentUser;

                                return (
                                    <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`w-fit max-w-[90%] sm:max-w-[75%] px-4 py-2 rounded-2xl break-words whitespace-pre-wrap shadow-md ${
                                        isCurrentUser
                                        ? "ml-auto bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                                        : "mr-auto bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-100 shadow-md dark:shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                                    }`}
                                    >
                                    <div className="font-semibold text-sm mb-1">
                                        {isCurrentUser ? 'You' : msg.username || 'Someone'}
                                    </div>

                                    {msg.username !== "You" ? (
                                        <ReactMarkdown
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                            code: ({ node, inline, ...props }) =>
                                            inline ? (
                                                <code className="bg-gray-800 text-yellow-300 px-1 py-0.5 rounded text-sm" {...props} />
                                            ) : (
                                                <pre className="bg-gray-900 text-green-400 p-3 rounded-md overflow-auto text-sm mb-2">
                                                <code {...props} />
                                                </pre>
                                            ),
                                            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                            blockquote: ({ node, ...props }) => (
                                            <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700 dark:text-gray-300 mb-2" {...props} />
                                            ),
                                        }}
                                        >
                                        {msg.text}
                                        </ReactMarkdown>
                                    ) : (
                                        msg.text
                                    )}
                                    <div ref={bottomRef} />
                                    </motion.div>
                                );
                            })}

                            <AnimatePresence>
                                {Object.entries(typingUsers).map(([userId, username]) => {
                                    // Don't show indicator for current user
                                    if (userId === currentUser?._id) return null;
                                    
                                    return (
                                        <motion.div
                                            key={userId}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="mr-auto bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 rounded-2xl shadow-md flex flex-col items-start gap-1 max-w-[130px]"
                                        >
                                            <span className="text-[10px] font-medium truncate">{username}</span>
                                            <motion.div
                                                className="w-12 h-12 overflow-visible"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                                            >
                                                <div className="scale-[10] origin-top-left">
                                                    <Lottie animationData={typingAnimation} loop={true} />
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </AnimatePresence>
                    )}

                </div>
                    {/* 💬 Input Area */}
                    <div className="p-3 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-400 transition-all duration-200 outline-none"
                                placeholder="Type a message..."
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                            />
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{
                                        scale: 1.1,
                                        backgroundColor: "#2563eb", // blue-600
                                        boxShadow: "0 0 15px rgba(59,130,246,0.6)"
                                    }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg"
                                    onClick={() => sendMessage(input)}
                                >
                                    Send
                                </motion.button>
                        </div>
                    </div>
                
                </div>
            </div>
        </div>  
    );
    
};
    
export default PeerStudy;