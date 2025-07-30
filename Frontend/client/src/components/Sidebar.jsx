import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const colors = ['#FECACA', '#FDE68A', '#C4B5FD', '#99F6E4', '#D9F99D'];

const Sidebar = ({ onAdd, onColorSelect, selectedColor }) => {
  const [showColors, setShowColors] = useState(false);
  const [animatingColor, setAnimatingColor] = useState(null);

  const handleColorClick = (color) => {
    setAnimatingColor(color);
    onAdd(color);
    setShowColors(false); // Hide after selection

    // After 800ms, release the animating color
    setTimeout(() => setAnimatingColor(null), 2000);
  };

  return (
    <div className="h-full w-full bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl p-4 rounded-3xl shadow-xl flex flex-col items-center gap-6 z-50 transition-all animate-slideInSidebar">
      <div
        onClick={() => setShowColors(!showColors)}
        className="cursor-pointer bg-gradient-to-br from-black to-gray-800 text-white w-12 h-12 flex items-center justify-center rounded-full text-2xl hover:scale-110 active:scale-95 transition-transform duration-300 shadow-md hover:shadow-2xl"
        title="Add New Note"
      >
        +
      </div>
      {showColors && (
        <div className="flex flex-col items-center gap-4 animate-fadeIn">
          {colors.map(color => (
            <motion.div
              layoutId={`note-color-${color}`}
              key={color}
              className={`w-6 h-6 rounded-full cursor-pointer transition-all duration-300 transform 
                hover:scale-125 hover:ring-2 hover:ring-white
                ${selectedColor === color ? 'ring-4 ring-black scale-110 shadow-lg' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(color)}
          />
          ))}
        </div>
      )};

      {/* 👇 This keeps selected color dot alive just for animation */}
      <AnimatePresence>
        {animatingColor && (
          <motion.div
            layoutId={`note-color-${animatingColor}`}
            className="w-6 h-6 rounded-full absolute"
            style={{ backgroundColor: animatingColor }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Sidebar;
