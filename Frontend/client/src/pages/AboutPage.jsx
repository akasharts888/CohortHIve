import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaRobot, FaMicrophone, FaComments, FaBolt, FaBookOpen, FaChartLine, FaBullseye } from 'react-icons/fa';


const features = [
    {
      icon: <FaRobot className="text-5xl text-indigo-500" />,
      title: 'AI Mentor',
      desc: 'Get personalized mentorship sessions tailored to your goals, progress, and curiosity.',
      color: 'from-indigo-500 to-indigo-700',
    },
    {
      icon: <FaBolt className="text-5xl text-yellow-400" />,
      title: 'Smart Quiz',
      desc: 'Challenge yourself with AI-generated quizzes that adapt to your learning speed.',
      color: 'from-yellow-400 to-yellow-600',
    },
    {
      icon: <FaBookOpen className="text-5xl text-pink-400" />,
      title: 'Topic Discovery',
      desc: 'Easily explore trending or recommended topics based on your interests.',
      color: 'from-pink-400 to-pink-600',
    },
    {
      icon: <FaMicrophone className="text-5xl text-red-500" />,
      title: 'Live Voice Chat',
      desc: 'Speak directly with your AI mentor in real time and get instant feedback.',
      color: 'from-red-500 to-red-700',
    },
    {
      icon: <FaComments className="text-5xl text-blue-500" />,
      title: 'Discussion Room',
      desc: 'Ask, answer, and collaborate with other learners in an open discussion hub.',
      color: 'from-blue-500 to-blue-700',
    },
    {
      icon: <FaChartLine className="text-5xl text-green-400" />,
      title: 'Progress Tracker',
      desc: 'Stay motivated with visual progress tracking across your learning journey.',
      color: 'from-green-400 to-green-600',
    },
  ];
const AboutPage = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 100]);
    const y2 = useTransform(scrollY, [0, 500], [0, -100]);

    return (
        <div className="relative overflow-hidden min-h-screen bg-slate-950 text-white px-6 py-16">
            {/* Parallax Glow Backgrounds */}
            <motion.div
                style={{ y: y1 }}
                className="absolute -top-32 -left-32 w-[300px] h-[300px] bg-purple-600 opacity-30 rounded-full blur-3xl z-0"
            />
            <motion.div
                style={{ y: y2 }}
                className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500 opacity-20 rounded-full blur-2xl z-0"
            />
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-10 text-center mb-20"
            >
                <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                Welcome to MentorIQ
                </h1>
                <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                Where AI meets curiosity. Dive into a world of interactive learning powered by smart tech, friendly design, and community vibes.
                </p>
            </motion.div>
            {/* Features Section */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
                {features.map((feat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className={`relative bg-gradient-to-br ${feat.color} p-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}
                    >
                        {/* Glow Effect */}
                        <div className="absolute -inset-1 rounded-2xl blur-lg opacity-40 bg-gradient-to-br from-white/10 to-transparent z-0"></div>
                        <div className="relative z-10">
                        <div className="mb-4">{feat.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                        <p className="text-slate-100">{feat.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            {/* Footer CTA */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center mt-28"
            >
                <h2 className="text-3xl font-bold mb-2">Your AI-powered learning adventure starts now.</h2>
                <p className="text-slate-400">
                MentorIQ is made by learners, for learners. And we’re just getting started.
                </p>
            </motion.div>
        </div>
    );
};

export default AboutPage;