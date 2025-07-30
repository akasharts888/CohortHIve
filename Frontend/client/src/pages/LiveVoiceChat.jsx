import React, { useEffect, useRef, useState } from 'react';
import 'animate.css';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';


const LiveVoiceChat = ({ onClose }) => {
  const {session_id} = useParams();
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  
  const utteranceRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log("Detected something!")
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const text = event.results[event.resultIndex][0].transcript.trim();
        console.log("User Says ::",text);
        setTranscript(text);
        fetchBotResponse(text);
      };
    }

    const welcome = "Hi there! I'm your voice assistant. Press Start Listening and talk to me!";
    setResponse(welcome);
    setConversation((prev) => [...prev, { sender: 'bot', text: welcome }]);
    if (!muted) speak(welcome);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, response]);

  const fetchBotResponse = async (userInput) => {
    setLoading(true);
    console.log("UserMessage ::",userInput);
    const res = await fetch('http://localhost:5000/api/ask-voice', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ input: userInput,session_id:session_id}),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    setResponse(data.response);
    setConversation((prev) => [
      ...prev,
      { sender: 'user', text: userInput },
      { sender: 'bot', text: data.response }
    ]);
    setLoading(false);
    if (!muted) speak(data.response);
  };

  const speak = (text) => {
    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.1;
    utterance.onend = () => setSpeaking(false);
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setListening(!listening);
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (!muted) speechSynthesis.cancel();
  };

  const handleClose = () => {
    speechSynthesis.cancel();
    onClose?.();
    window.history.back();
  };
  return (
    <div className="relative min-h-screen bg-blue-50 font-[Poppins] text-gray-900 dark:text-white overflow-hidden dark:bg-gray-900">
      
      {/* Animated soft blob background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-96 h-96 bg-purple-300 opacity-30 rounded-full filter blur-3xl animate-pulse top-[10%] left-[10%]"></div>
        <div className="absolute w-96 h-96 bg-sky-300 opacity-30 rounded-full filter blur-3xl animate-ping top-[40%] right-[10%]" />
        <div className="absolute w-96 h-96 bg-green-200 opacity-30 rounded-full filter blur-3xl animate-bounce bottom-[10%] left-[15%]" />
      </div>
      
      <div className="flex flex-col items-center justify-between h-full max-w-3xl mx-auto px-4 pt-24 pb-32 animate__animated animate__fadeIn">
        <h1 className="text-4xl font-bold mb-6 flex items-center gap-3">
          <span className="text-3xl">🎧</span> Smart Voice Assistant
        </h1>
        
        <div className="w-full flex-1 overflow-y-auto bg-blue-100 dark:bg-gray-500/40 backdrop-blur-lg rounded-3xl shadow-xl p-6 space-y-6 transition-all duration-500 custom-scrollbar max-h-[75vh]">
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`animate__animated animate__fadeIn ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
            >
              <p className={`${msg.sender === 'user' ? 'inline-block max-w-[75%]  ml-auto px-4 py-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md' : 'bg-blue-100 dark:bg-gray-500/40  backdrop-blur-lg'} px-4 py-3 rounded-xl break-words`}>
                <strong>{msg.sender === 'user' ? 'You' : 'Bot'}:</strong>
                <div className="overflow-y-auto max-h-[400px]">
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
              </p>
            </div>
          ))}
          {loading && <p className="text-center text-sm text-purple-700 animate__animated animate__pulse">Thinking...</p>}
          <div ref={messagesEndRef}></div>
        </div>
        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          <button
            onClick={toggleListening}
            className={`px-6 py-2 rounded-full shadow-md backdrop-blur-md transition-all duration-300 font-semibold text-white
              ${listening ? 'bg-red-400' : 'bg-blue-500 hover:bg-blue-600 animate__animated animate__pulse animate__infinite'}`}>
            {listening ? '🛑 Stop Listening' : '🎙️ Start Listening'}
          </button>

          <button
            onClick={toggleMute}
            className={`px-6 py-2 rounded-full shadow-md transition-all duration-300 font-semibold text-white 
            ${muted ? 'bg-pink-500' : 'bg-purple-500 hover:bg-purple-600'}`}>
            {muted ? '🔇 Unmute' : '🔊 Mute'}
          </button>

          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-300 text-black rounded-full hover:bg-gray-400 transition shadow">
            ❌ Close
          </button>
        </div>

      </div>
      

      {/* Wave animation when speaking */}
      {speaking && (
        <div className="mt-6 w-36 h-3 bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse rounded-full shadow-lg"></div>
      )}
    </div>
  );
};

export default LiveVoiceChat;
