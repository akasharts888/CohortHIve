// QuizContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const QuizContext = createContext();

export const useQuizStatus = () => useContext(QuizContext);

export const QuizProvider = ({ children }) => {
  const [quizTaken, setQuizTaken] = useState(null); // null = loading

  const fetchQuizStatus = async () => {
    const introSeen = sessionStorage.getItem('introSeen') === 'true';
    if (introSeen) {
      setQuizTaken(true);
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/quiz-status', {
        credentials: 'include',
      });
      const data = await res.json();
      setQuizTaken(data.quizTaken);
    } catch (err) {
      console.error('Error checking quiz status:', err);
      setQuizTaken(false);
    }
  };

  useEffect(() => {
    fetchQuizStatus();
  }, []);

  return (
    <QuizContext.Provider value={{ quizTaken, fetchQuizStatus }}>
      {children}
    </QuizContext.Provider>
  );
};
