import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

const UserOptionsPage = () => {
  const navigate = useNavigate();
  const [quizTaken, setQuizTaken] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch today's quiz status on mount:
  useEffect(() => {
    const fetchQuizStatus = async () => {

      const introSeen = sessionStorage.getItem('introSeen') === 'true';
      if (introSeen) {
        setQuizTaken(true);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('http://localhost:5000/api/quiz-status', {
          method: 'GET',  
          credentials: 'include',
        });
        
        if (!res.ok) {
          // If not authenticated, redirect to login page
          if (res.status === 401) {
            navigate('/');
          } else {
            throw new Error('Error fetching quiz status');
          }
        }
  
        const data = await res.json();
        setQuizTaken(data.quizTaken);
      } catch (err) {
        console.error('Error fetching quiz status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizStatus();
  }, [navigate]);

  // Card Animation variants (Framer Motion)
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.3 },
    }),
  };

  // Handler functions:
  const handleLearnClick = () => {
    const newSessionId = uuidv4();
    navigate(`/learn/${newSessionId}`);
  };

  const handleQuizClick = () => {
    navigate('/quiz');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };
  const handleChatRoomClick = () => {
    navigate('/rooms');
  };

  const handleNotesClick = () => {
    navigate('/notes');
  };
  // if (loading) return <div>Loading options...</div>;
  if (loading) return <div className="text-center mt-10 text-gray-700 dark:text-gray-300">Loading options...</div>;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-tr from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl sm:text-5xl font-extrabold mb-12 text-center text-blue-900 dark:text-white"
      >
        Welcome Back! Ready to Elevate Your Learning?
      </motion.h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10 w-full max-w-5xl">
        {/* Learn New Things Card */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="group cursor-pointer p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl hover:scale-105 transition duration-300"
          onClick={handleLearnClick}
        >
          <h2 className="text-2xl font-bold mb-2 text-green-600 group-hover:text-green-700 transition">📘 Learn New Things</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Engage with the chatbot and unlock new knowledge every day.
          </p>
        </motion.div>
        
        {/* Notes Card */}
        <motion.div
          custom={4}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="group cursor-pointer p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl hover:scale-105 transition duration-300"
          onClick={handleNotesClick}
        >
          <h2 className="text-2xl font-bold mb-2 text-yellow-500 group-hover:text-yellow-600 transition">🗒️ Notes</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Capture insights, write reflections, or save important learnings.
          </p>
        </motion.div>

        {/* Take Quiz Card */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="group cursor-pointer p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl hover:scale-105 transition duration-300 border-4 border-blue-400"
          onClick={handleQuizClick}
        >
          <h2 className="text-2xl font-bold mb-2 text-blue-500 group-hover:text-blue-600 transition">📝 Assessment</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Test your understanding and unlock today's content.
          </p>
          <p className="text-sm text-gray-500 mt-2">Daily challenge to track your progress </p>
        </motion.div>
        
        {/* Dashboard Card */}
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className= "group cursor-pointer p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl hover:scale-105 transition duration-300"
          onClick={handleDashboardClick}
        >
          <h2 className="text-2xl font-bold mb-2 text-purple-600 group-hover:text-purple-700 transition">📊 Progress</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your performance, revisit concepts, and stay ahead.
          </p>
        </motion.div>

        {/* Discuss (Chat Room) */}
        <motion.div
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="group cursor-pointer p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl hover:scale-105 transition duration-300"
          onClick={handleChatRoomClick}
        >
          <h2 className="text-2xl font-bold mb-2 text-pink-600 group-hover:text-pink-700 transition">💬 Discuss</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Join the discussion, ask doubts, or help peers in our chat space.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default UserOptionsPage;
