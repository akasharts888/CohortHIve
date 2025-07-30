import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Confetti from 'react-confetti';

export default function ProjectPage() {
    const [project, setProject] = useState(null);
    const [githubLink, setGithubLink] = useState("");
    const [notes, setNotes] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [countdown, setCountdown] = useState("");
    
    
    const fetcProjecthHistory = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/project-history`, {
              credentials: 'include',
            });
            const data = await res.json();
            console.log("fetched res ::",data);
            if (data.response) {
                setProject(data);
            }
          } catch (err) {
            console.error('Failed to fetch chat history:', err);
          }
    }
    useEffect(() => {
        fetcProjecthHistory();
    },[]);
    useEffect(() => {
        if(!project?.dueDate) return;
        const targetDate = new Date(project.dueDate);

        const updateCountdown = () => {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                console.log("Countdown finished. Diff:", diff);
                setCountdown("0d 0h 0m");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);

            console.log("Time left →", {
                diff,
                days,
                hours,
                minutes
            });
            setCountdown(`${days}d ${hours}h ${minutes}m`);
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, [project]);

    const handleGenerateProject = async () => {
        try {
            const ProjectRes = await fetch('http://localhost:5000/api/create-project', {
              method: 'POST',
              credentials: 'include',
            });
            const ProjectData = await ProjectRes.json();
            console.log("Project ::",ProjectData);
            setProject(ProjectData.response)
        } catch (err) {
            console.error("Failed to fetch topic:", err);
        }
    };


    const handleSubmit = () => {
        if (!githubLink.trim()) return;
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    };

    return (
    <div className="min-h-screen px-6 py-10 bg-blue-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto bg-blue-50 dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6"
      >
        <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold text-center text-indigo-700 dark:text-indigo-400 tracking-wide"
        >
            Weekly Project
        </motion.h1>

        {!project ? (
          <motion.div
            initial={{ opacity: 0.5, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <p className="text-lg font-medium">You don’t have a project yet for this week.</p>
            <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(99,102,241,0.7)" }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-semibold shadow-lg transition"
                onClick={handleGenerateProject}
            >
                Generate Project
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
            <AnimatePresence>
                {project && (
                    <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                        delayChildren: 0.3,
                        staggerChildren: 0.15
                        }
                    }
                    }}
                    whileHover={{ scale: 1.02, boxShadow: "0px 0px 20px rgba(99,102,241,0.6)" }}
                    transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                    className="bg-gradient-to-br from-gray-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 px-5 py-4 rounded-xl shadow-md transition-all duration-300"
                >
                    <h2 className="text-2xl font-bold mb-2">Your Mission This Week</h2>
                    <ReactMarkdown
                    components={{
                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-2" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-2" {...props} />,
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
                        
                        {project.response}
                    </ReactMarkdown>

                    <motion.p
                        className="text-sm mt-4"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                         Time remaining: <span className="ml-2 px-2 py-1 rounded-md bg-black text-green-300 animate-pulse font-mono">{countdown}</span>
                    </motion.p>
                    {/* <CircularProgressbar
                        value={countdownPercentage}
                        text={`${days}d`}
                        styles={buildStyles({
                            pathColor: days < 2 ? "red" : "#4f46e5",
                            textColor: "#111",
                            trailColor: "#eee",
                        })}
                    /> */}
                </motion.div>
                )}
            </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold">Submit Your Work</h3>
              <div className="relative z-0 w-full group">
                <input
                    type="text"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-indigo-300 appearance-none dark:text-white dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-indigo-500 peer"
                    placeholder=" "
                />
                <label
                    className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                    Paste your GitHub link
                </label>
              </div>
              <textarea
                placeholder="Reflection or additional notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="4"
              ></textarea>
              <button
                onClick={handleSubmit}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
              >
                Submit Project
              </button>
              {submitted && (
                <>
                    <Confetti />
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-green-600 font-semibold text-lg mt-2"
                    >
                        Mission Submitted Successfully!
                    </motion.div>
                </>
                )}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}