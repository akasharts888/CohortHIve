import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CourseIntroModal from '../components/CourseIntroModal';
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [showIntro, setShowIntro] = useState(false);
  const [courseIntroText, setCourseIntroText] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard", {
          credentials: 'include',
        });
        const data = await res.json();
        setCourseIntroText(data.user.Intro);
        setUser(data.user);
        setResults(data.quizResults);
      } catch (err) {
        console.error("Failed to fetch dashboard", err);
      }
    };
    fetchDashboard();
  }, [navigate]);

  console.log("user details ::",user);
  console.log("user course::",courseIntroText);
  
  return (
    <div className="min-h-screen pt-[80px] px-4 pb-10 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 text-black dark:text-white transition-colors duration-500">
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <h1 className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-10 text-center tracking-tight">Your Dashboard</h1>
        {/* Show modal */}
        {user && (
          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 mb-10">
            {user.course && (
              <div className="flex-1 p-6 rounded-xl shadow-lg bg-white/80 dark:bg-gray-900 border border-blue-300 dark:border-blue-700 backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                  📘 Course Overview
                </h2>
                <p className="text-lg text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">You're currently enrolled in:</span> {user.course}
                </p>
                <button
                  onClick={() => setShowIntro(true)}
                  className="mt-4 inline-block bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all"
                >
                  📖 View Course Introduction
                </button>
              </div>
            )}
            <CourseIntroModal
              show={showIntro}
              onClose={() => setShowIntro(false)}
              courseName={user?.course || "Your Course"}
              introText={courseIntroText}
            />
            <div className="flex-1 p-6 sm:p-8 rounded-2xl shadow-xl bg-white/70 dark:bg-white/5 backdrop-blur-md border border-blue-200 dark:border-gray-700 transition-transform duration-300 hover:scale-[1.01]">
              <h2 className="text-2xl font-semibold mb-4 text-blue-800 dark:text-blue-200">👤 Personal Info</h2>
              <p className="mb-2"><span className="font-semibold">Name:</span> {user.username}</p>
              <p><span className="font-semibold">Email:</span> {user.email}</p>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 rounded-2xl shadow-xl bg-white/70 dark:bg-white/5 backdrop-blur-md border border-blue-200 dark:border-gray-700 transition-transform duration-300 hover:scale-[1.01]">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800 dark:text-blue-200">📊 Quiz History</h2>
          {results.length === 0 ? (
            <p className="italic text-gray-600 dark:text-gray-400">No quiz attempts found.</p>
          ) : (
            <ul className="space-y-6">
              {results.map((result, idx) => (
                <li key={idx} className="pb-4 border-b border-gray-300 dark:border-gray-700">
                  <p><span className="font-medium">🗓️ Date:</span> {new Date(result.date).toLocaleString()}</p>
                  <p><span className="font-medium">✅ Score:</span> {result.score} / {result.total}</p>
                  <p><span className="font-medium">💬 Feedback:</span> {result.feedback || getFeedback(result.score, result.total)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

function getFeedback(score, total) {
  const percentage = (score / total) * 100;
  if (percentage === 100) return "Excellent! You nailed it! 💯";
  if (percentage >= 75) return "Great job! Just a few small areas to review.";
  if (percentage >= 50) return "Not bad! Keep practicing and you'll get there.";
  return "Don't worry, learning takes time. Let's try again!";
}

export default Dashboard;
