// src/pages/QuizPage.jsx
import { useState } from 'react';
import { useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate} from 'react-router-dom';

const QuizPage = () => {
  const [quizData, setQuizData] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [courseName, setCourseName] = useState('');
  // const [showReason, setShowReason] = useState(false);
  const [expandedIndexes, setExpandedIndexes] = useState([]);
  const QUIZ_STATE_KEY = 'quizState';
  const fetchYesterdayTopic = async () => {
    const res = await fetch('http://localhost:5000/api/yesterday-topic', {
      credentials: 'include',
    });

    if (!res.ok) throw new Error("Couldn't fetch yesterday's topic");

    const details = await res.json(); // { course_name, topic_name }
    return details;
  };
  const navigate = useNavigate();
  const fetchQuiz = async (course_name,topic_name) => {
    try {
      const res = await fetch("http://localhost:5000/api/quiz-start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course: course_name, topic : topic_name }), // Pass selected course here
      });
      const data = await res.json();
      console.log("response ::",data);
      setQuizData(data); // Assumes data is { questions: [...] }
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch quiz:", err);
    }
  };
  useEffect(() => {
    const savedState = localStorage.getItem(QUIZ_STATE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setQuizData(parsed.quizData || []);
      setCurrentQIndex(parsed.currentQIndex || 0);
      setSelectedOption(parsed.selectedOption);
      setSubmitted(parsed.submitted || false);
      setScore(parsed.score || 0);
      setExpandedIndexes(parsed.expandedIndexes || []);
      setCourseName(parsed.courseName || '');
      setIsLoading(false);
      return;
    }
    const init = async () => {
      try {
        const { course_name, topic_name, isNewUser } = await fetchYesterdayTopic();
        setCourseName(course_name);
        console.log("yesterday ::",course_name,topic_name)
        setIsNewUser(isNewUser);
        await fetchQuiz(course_name, topic_name);
      } catch (err) {
        console.log("Quiz Init Error:",err);
        alert("Error preparing quiz. Please try again later.");
      }
    }
    init();
  }, []);
  useEffect(() => {
    const state = {
      quizData,
      currentQIndex,
      selectedOption,
      submitted,
      score,
      expandedIndexes,
      courseName,
    };
    localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
  }, [quizData, currentQIndex, selectedOption, submitted, score, expandedIndexes, courseName]);

  useEffect(() => {
    if (isNewUser) {
      const timer = setTimeout(() => {
        setIsNewUser(false);
      }, 5000);
  
      return () => clearTimeout(timer); // clean up on re-render or unmount
    }
  }, [isNewUser]);
  const handleOptionClick = (optionKey) => {
    setSelectedOption(optionKey);
  };

  const handleSubmit = async () => {
    if (selectedOption === null) return;

    setQuizData(prev =>
      prev.map((q, i) =>
        i === currentQIndex ? { ...q, userSelected: selectedOption } : q
      )
    );
    // const currentQuestion = currentQIndex < quizData.length ? quizData[currentQIndex] : null;
    if (selectedOption === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
    if (currentQIndex !== quizData.length - 1) {
      setSubmitted(true);
      return
    }
    try {
      setIsSubmitting(true);
      await submitQuizResult();
      setCurrentQIndex(prev => prev + 1); // Show results after successful submission
    } catch (err) {
      setSubmissionError('Failed to submit quiz. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Extract submission logic into a reusable function
  const submitQuizResult = async () => {
    const userAnswers = quizData.map(q => q.userSelected);
    const originalQuestions = quizData.map(q => ({ correctIndex: q.answer }));

    const res = await fetch('http://localhost:5000/api/quiz-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userAnswers, originalQuestions }),
    });

    if (!res.ok) throw new Error('Submission failed');
    return res.json();
  };
  const handleNext = () => {
    setSelectedOption(null);
    setSubmitted(false);
    setCurrentQIndex((prev) => prev + 1);
  };
  if (isLoading || !quizData.length ) {
    return (
      <div className="text-center text-xl mt-10">
        ⏳ Loading quiz...
      </div>
    );
  }
  const currentQuestion = quizData[currentQIndex];
  if (currentQIndex >= quizData.length) {
    return (
      <div className="flex flex-col items-center justify-center mt-10 px-4 w-full">
        {isSubmitting ? (
          <div className="text-lg">📤 Submitting quiz...</div>
        ) : submissionError ? (
          <div className="text-red-600">
            ❌ {submissionError}
            <button 
              onClick={submitQuizResult}
              className="ml-2 bg-blue-500 text-white px-3 py-1 rounded"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 mb-4 animate-pulse">🎉 You did it!</h2>
            <p className="text-2xl font-medium mb-2 text-gray-800 dark:text-gray-200">Your score: <span className="font-bold text-indigo-700 dark:text-indigo-400">{score}</span>/{quizData.length}</p>
            <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">{score >= 8 ? '🔥 Amazing work!' : score >= 5 ? '👏 Good job!' : '💡 Keep learning!'}</p>
            {/* 🎯 Review Section */}
            <div className="w-full max-w-3xl space-y-6">
              {quizData.map((q, index) => {
                const isCorrect = q.userSelected === q.answer;
                const isExpanded = expandedIndexes.includes(index); 
                // For animation

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`rounded-xl p-5 border-l-8 cursor-pointer shadow-lg transition-all  ${
                      isCorrect ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-400 dark:to-green-200 border-green-500' : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-400 dark:to-red-100 border-red-500'
                    }`}
                    onClick={() => {
                      setExpandedIndexes(prev =>
                        prev.includes(index)
                          ? prev.filter(i => i !== index)
                          : [...prev, index]
                      );
                    }}
                  >
                    <div className="font-semibold text-lg flex justify-between items-center mb-2 text-gray-900 dark:text-white">
                      <span className="break-words">
                        <span className="font-bold text-indigo-600 dark:text-indigo-500">Q{index + 1}:</span> {q.question}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isCorrect ? 'text-green-700 ' : 'text-red-700'}`}>
                          {isCorrect ? '✅ Correct' : '❌ Wrong'}
                        </span>
                        <span className="text-gray-500 text-sm">{isExpanded ? '🔼' : '🔽'}</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-800 dark:text-gray-600 mb-1">
                      <strong>Your Answer:</strong> {q.userSelected} - {q.options[q.userSelected]}
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-600">
                      <strong>Correct Answer:</strong> {q.answer} - {q.options[q.answer]}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.4 }}
                          className="mt-3 p-4 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm border border-gray-200 dark:border-gray-700 shadow-inner"
                        >
                          💡 <strong>Explanation:</strong> {q.explanation || "No explanation available."}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
            >
              🔁 Play Again
            </button>
            <button
              onClick={() =>{
                const sessionId = uuidv4();
                navigate(`/learn/${sessionId}`);
              }}
              className="bg-green-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
            >
              📘 Go to Learn
            </button>
          </div>
          </>
        )}
      </div>
    );
   
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-50 dark:bg-gray-900 overflow-auto">
      {isNewUser && (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 text-center text-lg shadow">
          👋 Welcome to your quiz journey! Here's a quick starter quiz to warm up 🚀
        </div>
      )}
      {/* Progress Bar */}
      <div className="w-full max-w-xl bg-gray-200 h-2 rounded-full overflow-hidden mb-6">
        <div
          className="bg-indigo-500 h-full transition-all duration-300"
          style={{ width: `${((currentQIndex + 1) / quizData.length) * 100}%` }}
        ></div>
      </div>
      <h2 className="text-3xl font-extrabold mb-6 animate-pulse text-indigo-600">🎓 Quiz Time! Let’s test your {courseName || 'course'} knowledge!</h2>
      <div className="mb-4 w-full max-w-xl flex justify-end">
        <button
          onClick={() => {
            localStorage.removeItem(QUIZ_STATE_KEY);
            window.location.reload();
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ml-auto shadow"
          >
          🔄 Restart Quiz
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQIndex}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-xl w-full text-gray-800 dark:text-white"
        >
          <h3 className="text-xl font-semibold mb-6 text-center">{currentQuestion.question}</h3>
          
          {Object.entries(currentQuestion.options).map(([key, value]) => {
            const isCorrect = submitted && key === currentQuestion.answer;
            const isWrong = submitted && key === selectedOption && selectedOption !== currentQuestion.answer;
            return (
              <button
                key={key}
                onClick={() => handleOptionClick(key)}
                disabled={submitted}
                className={`block w-full text-left px-4 py-3 rounded-md mb-3 border transition-all duration-300
                  ${isCorrect
                    ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-800 dark:text-green-100 dark:border-green-300'
                    : isWrong
                    ? 'bg-red-100 border-red-500 text-red-800 dark:bg-red-800 dark:text-red-100 dark:border-red-300'
                    : selectedOption === key
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100 dark:border-indigo-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-500 hover:dark:bg-gray-600'
                  }`}
              >
                <strong>{key}.</strong> {value}
              </button>
            );
          })}
          {submitted && (
            <div className="mt-4 text-lg font-semibold text-center">
              {selectedOption === currentQuestion.answer
                ? '✅ Correct!'
                : `❌ Oops! The correct answer was ${currentQuestion.answer}.`}
            </div>
          )}
          <div className="mt-6 text-center">
            {!submitted ? (
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Submit
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
              >
                Next Question
              </button>
            )}
            
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizPage;
