import { useRef,useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from 'react-router-dom';
import Lottie from "lottie-react";
import { useQuizProtection } from '../components/ProtectedRoute'
import { FaPaperPlane } from 'react-icons/fa';
import botAnimation from "../assets/Animation - 1744234769260.json"
import typingAnimation from '../assets/Animation - 1744300302640.json';
// import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { useQuizStatus } from '../context/QuizContext';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash } from "react-icons/fa";
// const FormData = require('form-data');
import { FaMicrophone, FaMicrophoneSlash,FaBrain } from 'react-icons/fa';
import { HiMiniSpeakerWave ,HiMiniSpeakerXMark} from "react-icons/hi2";
import { RiVoiceprintLine } from 'react-icons/ri'
import UploadModal from "./Modal/UploadModal";

const ChatBot = () => {
    const recommendedQueries = [
      "Hey, how are you today?",
      "Can you help me get started?",
      "What can you do for me?",
      "Tell me something interesting!",
      "I'm feeling stuck... any tips?",
      "What's something fun to learn?",
      "Motivate me today!",
      "Give me a random fact!",
      "How do I stay productive?"
    ];
    const { checkQuizAndRun } = useQuizProtection();
    const {session_id} = useParams();
    console.log("Now session_id is ::",session_id);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);
    const [sessionId, setSessionId] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [chatSessions, setChatSessions] = useState([]); // fetched session list
    const navigate = useNavigate();
    const [suggestedQueries, setSuggestedQueries] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const visibleQueries = expanded ? suggestedQueries : suggestedQueries.slice(0, 2);
    const visibleQueriesW = expanded ? recommendedQueries : recommendedQueries.slice(0, 2);
    const [uploadedDoc, setUploadedDoc] = useState(null);
    const [docUploadError, setDocUploadError] = useState('');
    
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const [speakingIndex, setSpeakingIndex] = useState(null);
    const { quizTaken } = useQuizStatus();
    const stopSpeaking = () => {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null); // Reset the active index
    };
    
    const speak = (text, idx) => {
      console.log("text to read:", text, idx);
    
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice =
        voices.find(v => v.name.includes("Google") && v.lang === "en-US") ||
        voices.find(v => v.lang === "en-US");
      
      const splitIntoChunks = (str, maxLength = 200) => {
        const chunks = [];
        for (let i = 0; i < str.length; i += maxLength) {
          chunks.push(str.slice(i, i + maxLength));
        }
        return chunks;
      };

      const chunks = splitIntoChunks(text)
    
      const speakChunks = (index = 0) => {
        if (index >= chunks.length) {
          setSpeakingIndex(null);
          return;
        }
    
        const utterance = new SpeechSynthesisUtterance(chunks[index].trim());
        utterance.lang = 'en-US';
        if (naturalVoice) utterance.voice = naturalVoice;
    
        if (index === 0) utterance.onstart = () => setSpeakingIndex(idx);
        utterance.onend = () => speakChunks(index + 1);
    
        window.speechSynthesis.speak(utterance);
      };
    
      speakChunks();
    };
    
    useEffect(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech Recognition is not supported in this browser');
        return;
      }
  
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };
      
      recognition.onaudiostart = () => {
        console.log("Audio capturing started.");
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        console.log("Transcript is ::",finalTranscript)
        setTranscript(finalTranscript);
        setInput(finalTranscript);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
  
      recognitionRef.current = recognition;
    }, [setInput]);

    useEffect(() => {
      const fetchSessions = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/chatbot-sessions', {
            credentials: 'include',
          });
          console.log("session are ::",res);
          const data = await res.json();
          console.log("Sessions fetched:", data);
          
          
          setChatSessions(data.sessions || []);
        } catch (err) {
          console.error("Error fetching chat sessions:", err);
        }
      };
      fetchSessions();
    }, []);
    const toggleMic = () => {
      if (!recognitionRef.current) return;
      try {
        if (isListening) {
          recognitionRef.current.stop();
        } else {
          setTranscript('');
          recognitionRef.current.start();
        }
        setIsListening((prev) => !prev);
      } catch (err) {
        console.error("Mic toggle error:", err);
      }
    };
    useEffect(() => {
      setSessionId(session_id);
      setMessages([]);
      fetchHistory();
      setSuggestedQueries([])
    }, [session_id]);

    const fetchHistory = async () => {
    
      try {
        const res = await fetch(`http://localhost:5000/api/chatbot-history/${session_id}`, {
          credentials: 'include',
        });
        console.log("fetched res ::",res);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        if (data.uploadedFileName && data.uploadedFileName !== "") {
          setUploadedDoc(data.uploadedFileName);
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      }
    };
    const handleNewChat = async () => {
      const newSessionId = uuidv4();
      setMessages([]);
      setSessionId(newSessionId);
      setInput('');
    };
    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    useEffect(() => {
        const autoLogin = async () => {
          const token = localStorage.getItem('token');
          const hasJustSignedUp = sessionStorage.getItem("justSignedUp");
          if (!token) return;
          if (!token || hasJustSignedUp) return;
      
          try {
            const res = await fetch("http://localhost:5000/api/auth/verify", {
              credentials: 'include',
            });
            const data = await res.json();
            console.log("data is ::",data);
            if (data.topic && data.topic !== 'pending') {
              sendMessage(data.topic, true);
            }
            await fetchHistory();
          } catch (err) {
            console.error("Auto-login failed", err);
            localStorage.removeItem('token');
          }
        };
      
        autoLogin();
      }, []);

      const handleLearnTopic = async () => {
      
        try {
          const Topicres = await fetch('http://localhost:5000/api/daily-learn', {
            method: 'POST',
            credentials: 'include',
          });
          const topicData = await Topicres.json();
          console.log("topic ::",topicData);
          const explanation = topicData?.response?.trim();
      
          if (explanation && explanation !== "") {
            const botIntroMsg = { sender: 'bot', text: explanation };
            setMessages(prev => [...prev, botIntroMsg]);
          } else {
            const welcomeMsg = {
              sender: 'bot',
              text: "Welcome back!! Ready to learn something amazing today?",
            };
            setMessages(prev => [...prev, welcomeMsg]);
          }
      } catch (err) {
          console.error("Failed to fetch topic:", err);
      }
    };
      
    const sendMessage =  async (message,bypassProtection = false) => {
      if (!message || !message.trim()) return;
      checkQuizAndRun(quizTaken, async () => {
        console.log("user message : ",message);
        const userMsg = { sender: 'user', text: message };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
  
        try {
          const endpoint = 'http://localhost:5000/api/Chatbotask';
          const res = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message,
              session_id: sessionId,
              file_id: !!uploadedDoc 
            }),
          });
          if (!res.ok || !res.body) throw new Error('No response body');
          
          const data = await res.json();
          const botReplyText = data.reply || "⚠️ No response from AI.";
          const botMsg = { sender: 'bot', text: botReplyText };
          
          // Update messages
          setMessages(prev => [...prev, botMsg]);
          setIsTyping(false);
  
          // 🔐 Save to chat history backend
          const token = localStorage.getItem("token");
          console.log("token is:", token);
  
          console.log("saving messages!")
          const saveRes = await fetch("http://localhost:5000/api/chatbot-save", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              messages: [userMsg, botMsg],
              session_id: sessionId, 
            }),
          });
  
          // Get suggestions if needed
          const suggestRes = await fetch("http://localhost:5000/api/suggest-query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ botMsg, userMsg}),
          });
  
          const suggestData = await suggestRes.json();
          setSuggestedQueries(suggestData.suggestions || []);
  
        } catch (err) {
          console.error('Streaming failed:', err);
          setMessages([
            ...prev.slice(0, -1),
            { sender: 'bot', text: '⚠️ Failed to connect to backend.' },
          ]);
          setIsTyping(false);
        }
      })
      setInput('');
    };
    return (
      <div className="flex h-screen bg-blue-100 dark:bg-gray-700">
        {/* ⏪ Left Drawer */}
        {/* 🎤 Voice Listening Modal */}
        {isListening && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-xl w-[90%] max-w-md text-center relative animate-fadeIn">
              <div className="w-28 h-28 mx-auto mb-4">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 animate-ping rounded-full bg-blue-50 opacity-50"></div>
                  <div className="relative w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl">
                    <FaMicrophone />
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Listening...</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{transcript || "Say something..."}</p>
              <button
                onClick={toggleMic}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
              >
                Stop
              </button>
            </div>
          </div>
        )}
        <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-700 shadow-lg transform transition-transform duration-300 z-[1000] ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b font-semibold text-lg">Your Chats</div>
            <ul className="overflow-y-auto max-h-full">
              {chatSessions.map(session => (
                <li
                  key={session.session_id}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => navigate(`/learn/${session.session_id}`)}
                >
                  {session.session_id}
                </li>
              ))}
            </ul>
          </div>
          {/* 🧲 Vertical Drawer Toggle */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="fixed top-1/2 left-0 z-[1100] transform -translate-y-1/2 p-2 rounded-r-full bg-white/80 dark:bg-gray-700/70 shadow-xl border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 ease-in-out"
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
          {/* 💬 Main Chat Area */}
          <div className={`flex flex-col pt-5 flex-1 transition-all duration-300 ${isDrawerOpen ? 'ml-64' : 'ml-0'}`}>
            <div className="w-full max-w-3xl mx-auto flex flex-col h-full px-4 sm:px-6">
              
              {/* 🧠 Chat Messages */}
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 space-y-4 scrollbar-hide scroll-smooth">
                {messages.length === 0 ? (
                  <div className="relative flex flex-col items-center justify-center h-full text-center space-y-6 transition-opacity duration-500 animate-fadeIn">
                    <div className="absolute top-40 left-20 z-10">
                      <button
                        onClick={handleLearnTopic}
                        className="px-5 py-2.5 rounded-md font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Learn New Topic
                      </button>
                    </div>
                    <div className="w-60 h-60">
                      <Lottie animationData={botAnimation} loop={true} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 animate-bounce">
                    👋 Hey there! I'm your study buddy.
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      Ask me anything to get started...
                    </p>
                    <>
                      {recommendedQueries.length > 0 && (
                        <div className="flex flex-col items-center mt-6 px-4">
                          <div className="flex flex-wrap justify-center gap-3">
                            <AnimatePresence>
                              {visibleQueriesW.map((query, index) => (
                                <motion.button
                                  key={index}
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  whileHover={{ scale: 1.06 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0 ,y: 10}}
                                  whileTap={{ scale: 0.94 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 250,
                                    damping: 20,
                                    delay: index * 0.04,
                                  }}
                                  onClick={() => sendMessage(query)}
                                  className="px-4 py-2 rounded-full border border-purple-600 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-all shadow-sm"
                                >

                                  <span className="absolute w-2.5 h-2.5 rounded-full bg-purple-300/70 blur-sm group-hover:scale-125 group-hover:opacity-80 transition-all duration-500 -top-1 -right-1 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                                  <span className="inline-flex items-center gap-2 z-10 relative">
                                    <span>{query}</span>
                                  </span>
                                </motion.button>
                              ))}
                            </AnimatePresence>
                          </div>
                          {recommendedQueries.length>2 && (
                            <button
                              onClick={() => setExpanded(!expanded)}
                              className="mt-3 text-sm text-purple-600 hover:underline transition"
                            >
                              {expanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`w-fit max-w-[90%] sm:max-w-[75%] break-words whitespace-pre-wra ${
                          msg.sender === "user"
                            ? "ml-auto px-4 py-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md"
                            : "mr-auto text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        
                        {msg.sender === "bot" ? (
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
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
                            </div>
                            <button
                              onClick={() => speak(msg.text, idx)}
                              className={`text-xl text-blue-600 hover:text-blue-800 mt-1 transition-transform duration-200 ${
                                speakingIndex === idx ? 'animate-[pulse-speaker_1.2s_ease-in-out_infinite]' : ''
                              }`}
                              title="Speak"
                            >
                              <HiMiniSpeakerWave />
                            </button>
                            <button
                              onClick={stopSpeaking}
                              className="text-xl text-red-500 hover:text-red-700 mt-1 ml-2 transition-transform duration-200"
                              title="Stop Speaking"
                            >
                              <HiMiniSpeakerXMark />
                            </button>
                          </div>
                        ) : (
                          msg.text
                        )}
                        <div ref={bottomRef} />
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mr-auto text-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 rounded-2xl flex flex-col items-start gap-1 max-w-[130px]"
                      >
                        <div className="w-500 h-200 overflow-visible">
                          <Lottie animationData={typingAnimation} loop={true} />
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                )}

              </div>

              {suggestedQueries.length > 0 && (
                <div className="flex flex-col items-center mt-6 px-4">
                  <div className="flex flex-wrap justify-center gap-3">
                    <AnimatePresence>
                      {visibleQueries.map((query, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          whileHover={{ scale: 1.06 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 ,y: 10}}
                          whileTap={{ scale: 0.94 }}
                          transition={{
                            type: "spring",
                            stiffness: 250,
                            damping: 20,
                            delay: index * 0.04,
                          }}
                          onClick={() => sendMessage(query)}
                          className="relative group px-4 py-2 bg-gradient-to-tr from-white/20 to-purple-200/10 backdrop-blur-xl border border-purple-300/30 rounded-full text-purple-900 dark:text-purple-200 shadow-[0_5px_20px_rgba(128,90,213,0.15)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.35)] transition-all duration-300 ease-in-out font-medium text-xs tracking-wide overflow-hidden"
                        >
                          
                          <span className="absolute inset-0 w-[200%] h-full -translate-x-full group-hover:translate-x-0 transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm rotate-6 dark:block hidden pointer-events-none rounded-full"></span>

                          <span className="absolute inset-0 w-[200%] h-full -translate-x-full group-hover:translate-x-0 transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-purple-400/30 to-transparent blur-sm rotate-6 block dark:hidden pointer-events-none rounded-full"></span>

                          <span className="absolute w-2.5 h-2.5 rounded-full bg-purple-300/70 blur-sm group-hover:scale-125 group-hover:opacity-80 transition-all duration-500 -top-1 -right-1 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                          <span className="inline-flex items-center gap-2 z-10 relative">
                            💡 <span>{query}</span>
                          </span>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                  {/* Expand / Collapse Toggle */}
                  {suggestedQueries.length > 2 && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="mt-3 text-sm text-purple-600 hover:underline transition"
                    >
                      {expanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              )}
              {docUploadError && (
                <div className="fixed bottom-24 right-20 group z-[1000]">
                  <div className="text-red-500 text-sm mt-1">{docUploadError}</div>
                </div>
              )}
              {uploadedDoc && (
                <div className="fixed bottom-24 right-20 group z-[1000]">
                  <div className="absolute inset-0 rounded-full bg-green-300 opacity-30 blur-3xl animate-slowPulse"></div>
                  <div className="relative p-3 backdrop-blur-md bg-red/30 border border-red/20 rounded-full shadow-lg text-green-1000 hover:scale-110 transition-all duration-300">
                    📄
                  </div>
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {uploadedDoc}
                  </div>
                </div>
              )}
              {/* 💬 Input Area */}
              <div className="pb-3  border-gray-300 dark:border-gray-700 bg-blue-100 dark:bg-gray-700">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-blue-80 dark:border-gray-600 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-400 transition-all duration-200 outline-none"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  />
                  <UploadModal sessionId={sessionId} setUploadedDoc={setUploadedDoc} setDocUploadError={setDocUploadError} />
                  

                  <motion.button
                    onClick={toggleMic}
                    className={`p-3 rounded-full relative transition-all duration-300 ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'
                    }`}
                  >
                    {isListening ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
                  </motion.button>
                  <div className="relative group flex flex-col items-center">
                    {/* Tooltip Text (Appears on Hover) */}
                    {input.trim() ? (
                      <div className="mb-2 px-3 py-1 text-sm bg-gray-800 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none absolute -top-10 z-10 whitespace-nowrap">
                        Send
                      </div>
                    ) : (
                      <div className="mb-2 px-3 py-1 text-sm bg-gray-800 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none absolute -top-10 z-10 whitespace-nowrap">
                        Enter Live Voice World
                      </div>
                    )}
                    

                    {/* Icon Button */}
                    <motion.button
                      onClick={() => {
                        if (input.trim()) {
                          sendMessage(input);
                        } else {
                            checkQuizAndRun(quizTaken, async() => {
                              navigate(`/live-voice/${sessionId}`);
                            })
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all flex items-center justify-center w-12 h-12"
                    >
                      {input.trim() ? (
                        <FaPaperPlane size={18} className="rotate-45" />
                      ) : (
                        <RiVoiceprintLine size={22} />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          
        </div>
      </div>
    );
    
};
    
export default ChatBot;