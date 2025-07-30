import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = ({ darkMode, setDarkMode }) => {
  return (
    <button
      className="fixed top-1100 right-2 z-[9999] bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-yellow-300 p-5 rounded-full shadow-xl transition duration-300"
      onClick={() => setDarkMode(prev => !prev)}
    >
      {darkMode ? <FaSun /> : <FaMoon />}
    </button>
  );
};

export default ThemeToggle;