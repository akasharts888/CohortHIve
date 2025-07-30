import { useState, useRef, useEffect } from 'react'
import {  Routes, Route,useNavigate } from 'react-router-dom';
// import Home from './pages/Home';
import QuizPage from './pages/QuizPage';
import './App.css'
import NavBar from './components/NavBar';
import ChatBot from './components/ChatBot';
import ThemeToggle from './components/ThemeToggle';
// import ProjectPage from "./pages/ProjectPage"
import Dashboard from './pages/Dashboard';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';

import UserOptionsPage from './pages/UserOptionPage';
import { QuizProvider } from './context/QuizContext';
import RoomsPage  from './pages/roomPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import TopicPage from './pages/TopicPage';
import PeerStudy from './pages/Peer-Study'
import LiveVoiceChat from './pages/LiveVoiceChat'
import AboutPage from './pages/AboutPage'
import NoteMaker from './pages/NotePage';
import { Toaster } from 'react-hot-toast';
import NoteEditorPage from './components/NoteEditor';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
    </div>
  );
}

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { authLoading } = useContext(AuthContext);

  const chatBotRef = useRef(null);
  const navigate = useNavigate();

  const scrollToChatBot = () => {
    navigate('/'); 
    setTimeout(() => {
      chatBotRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <QuizProvider>
      <Toaster position="top-center" />
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-gray-900 text-blue-900 dark:text-white transition-colors duration-300">
          <div className="fixed w-full top-0 left-0 z-50">
            <NavBar
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              onLearnClick={scrollToChatBot}
            />
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>
          <div className="pt-10 flex-1 overflow-hidden">
            <Routes>
              <Route path="/signup" element={<SignupPage setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/topic" element={<TopicPage setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/" element={<LandingPage setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/learn/:session_id" element={<ChatBot />} />
              <Route path="/chit-chat/:session_id" element={<PeerStudy />} />
              <Route path="/notes" element={<NoteMaker />} />
              <Route path="/notes/:noteId" element={<NoteEditorPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/live-voice/:session_id" element={<LiveVoiceChat />} />
              <Route path="/options" element={<UserOptionsPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
    </QuizProvider>
  );
}
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
