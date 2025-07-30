import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IntroModal from "../components/Modal/IntroModal";
import { motion } from "framer-motion";

const trendingCourses = [
  "JavaScript Basics",
  "Python for Beginners",
  "React Fundamentals",
  "Data Structures",
  "Web Development",
  "Machine Learning",
  "System Design",
];

export default function TopicPage({ setIsAuthenticated }) {
  const [topic, setTopic] = useState("");
  const [introText, setIntroText] = useState("");
  const [showIntroModal, setShowIntroModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {


      const introRes = await fetch("http://localhost:5000/api/course-intro", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: 'include',
        body: JSON.stringify({ message: topic })
      });

      const introData = await introRes.json();
      if (!introRes.ok) {
        return alert(introData.message || "Failed to fetch course intro");
      }
      
      const intro = introData.reply;

      const res = await fetch('http://localhost:5000/api/update-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 🔥 includes the cookie for authentication
        body: JSON.stringify({ course:topic, intro }),
      });
      

      const data = await res.json();
      if (!res.ok) return alert(data.message);

      setIntroText(intro);
      setShowIntroModal(true);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Failed to save topic", err);
    }
  };
  const handleIntroClose = () => {
    setShowIntroModal(false);
    navigate("/options");
  };

  const handleOptionClick = (course) => {
    setTopic(course);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white dark:from-gray-900 dark:to-gray-800 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl p-8 sm:p-10 w-full max-w-md space-y-6"
      >
        <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 text-center">
          Choose Your Learning Topic
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="e.g., JavaScript Basics"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition"
          >
            Continue
          </button>
        </form>

        {/* 👇 Trending Courses Drawer */}
        <div className="pt-4">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or pick from trending courses:
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingCourses.map((course, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(course)}
                className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-gray-700 transition"
              >
                {course}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <IntroModal
        visible={showIntroModal}
        onClose={handleIntroClose}
        introText={introText}
      />
    </div>
  );
}
