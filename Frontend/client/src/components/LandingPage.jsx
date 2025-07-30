import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useAnimation } from 'framer-motion';
import { FaBrain, FaRobot, FaChalkboardTeacher,FaStickyNote, FaChartLine, FaLightbulb, FaCalendarDay, FaMicrophone, FaComments } from 'react-icons/fa';
import sparklesAnimation from "../assets/Animation - 1744684131979.json";

import { useNavigate } from 'react-router-dom';
import mascotAnimation from '../assets/Animation - 1744682156737.json';
import Lottie from 'lottie-react';

const features = [
  { title: 'Interactive AI Learning Tutor', icon: <FaRobot className="text-4xl text-blue-600" />, description: 'Learn anything, anytime. Our AI-powered tutor simplifies complex topics with engaging explanations and real-time responses.' },
  { title: 'Smart Quizzes with Real-Time Feedback', icon: <FaBrain className="text-4xl text-indigo-600" />, description: 'Stay sharp with AI-generated quizzes that adapt to your skill level and provide instant insights to improve.' },
  { title: 'Daily Topic Discovery', icon: <FaCalendarDay className="text-4xl text-pink-500" />, description: 'Fuel your curiosity with fresh daily topics, curated to expand your knowledge across multiple domains.' },
  { title: 'Progress Dashboard', icon: <FaChartLine className="text-4xl text-green-600" />, description: 'Monitor your growth with personalized analytics, activity streaks, and performance breakdowns.' },
  { title: 'Live Voice Chat with AI', icon: <FaMicrophone className="text-4xl text-red-500" />, description: 'Have real-time voice conversations with your AI mentor for a hands-free, immersive learning experience.' },
  { title: 'Interactive Chatroom', icon: <FaComments className="text-4xl text-teal-500" />, description: 'Join the vibrant discussion space to ask questions, help peers, or share insights with the learning community.' },
  {
    title: 'Smart Notes Assistant',
    icon: <FaStickyNote className="text-4xl text-yellow-500" />,
    description:
      'Capture, organize, and interact with your thoughts. Summarize long notes, ask contextual queries from saved content, or even command the AI to write structured notes for you automatically.',
  },
];



const fadeInScroll = {
  hidden: { opacity: 0, y: 60 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};


const LandingPage = ({setShowSignupModal,setIsAuthenticated}) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: scrollRef });
  const glowY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('justSignedUp');
    setIsAuthenticated(false);
  }, []);

  return (
    <div className="flex-1 relative overflow-x-hidden bg-gradient-to-br from-[#e0f7ff] via-white to-[#d0e0ff] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-blue-900 dark:text-white">

      {/* Sparkles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Lottie
          animationData={sparklesAnimation}
          loop
          autoplay
          style={{
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            top: 0,
            left: 0,
            objectFit: 'cover',
            zIndex: 0,
            opacity: 0.3, // keeps it subtle
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Gradient Blobs */}
      <div className="absolute w-full h-full overflow-hidden -z-10">
        <div className="absolute animate-pulse bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 opacity-30 blur-3xl w-[35rem] h-[35rem] rounded-full top-10 -left-20" />
        <div className="absolute animate-pulse bg-gradient-to-tr from-yellow-300 via-pink-300 to-red-400 opacity-20 blur-3xl w-[45rem] h-[45rem] rounded-full bottom-10 right-0" />
      </div>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden z-10">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-6xl font-black leading-tight mb-6 text-blue-800 dark:text-white"
        >
          Learn Smarter.<br />Grow Faster.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto"
        >
          Your personal AI-powered tutor, quiz master, and learning mentor—ready 24/7 to guide you.
        </motion.p>

        <motion.div
          whileInView={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.9 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <button
            onClick={() => navigate('/signup')}
            className="px-12 py-4 bg-blue-600 text-white rounded-full text-xl font-semibold shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-300"
          >
            Start Learning
          </button>
        </motion.div>
      </section>

      {/* Mascot Section */}
      <section className="relative py-32 flex flex-col items-center justify-center bg-white dark:bg-gray-900 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="w-full max-w-xl"
        >
          <Lottie animationData={mascotAnimation} loop={true} />
        </motion.div>
        <h3 className="mt-10 text-3xl font-bold text-blue-700 dark:text-white text-center">
          Meet your AI Mentor — always by your side.
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-xl mt-4">
        Let Cohort Hive's charismatic mascot bring your learning experience to life, offering interactive guidance and making education feel like a collaborative quest.
        </p>
      </section>
      
      {/* Features Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
        <motion.h2
          className="text-5xl font-bold text-center mb-20 text-blue-800 dark:text-white"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Explore the Magic of Cohort Hive
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeInScroll}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-blue-100 dark:border-gray-700 hover:shadow-blue-300/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                {feature.icon}
                <h3 className="text-2xl font-semibold text-blue-800 dark:text-white">{feature.title}</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call To Action */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white py-28 text-center relative overflow-hidden">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-4xl font-extrabold mb-6"
        >
          Ready to elevate your skills?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          className="text-xl max-w-xl mx-auto mb-10"
        >
          Get started for free and begin your personalized AI learning journey today.
        </motion.p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/signup')}
          className="px-10 py-4 bg-white text-blue-700 font-bold text-lg rounded-full shadow-lg hover:bg-gray-100 transition"
        >
          Sign Up For Free
        </motion.button>
      </section>
    </div>
  );
};

export default LandingPage;
