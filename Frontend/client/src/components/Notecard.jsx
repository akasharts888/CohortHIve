import React from 'react';
import { Node } from 'slate';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NoteCard = ({ note, isNew}) => {
  const navigate = useNavigate();

  const getTextFromSlateValue = (value) => {
    if (!Array.isArray(value)) return ''; // Safe fallback
    try {
      return value.map(n => Node.string(n)).join(' ');
    } catch (err) {
      console.error('Failed to extract text from Slate value:', err);
      return '';
    }
  };
  // console.log("log at NoteCard ::",note);
  return(
    <motion.div
      layoutId={isNew ? `note-color-${note.color}` : undefined}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative group rounded-xl p-4 shadow-md cursor-pointer transition-all transform min-h-[150px] flex flex-col justify-between"
      style={{ backgroundColor: note.color }}
      onClick={() => navigate(`/notes/${note._id}`)}
    >
        <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-900 leading-snug mb-1 truncate">{note.title}</h2>
        <p className="text-sm text-gray-800 dark:text-gray-800 line-clamp-4">
          {typeof note.content === 'string' ? note.content.slice(0, 160) : 'Untitled note...'}
        </p>
        <div className="flex justify-between items-end mt-4">
          <span className="text-xs text-gray-700 dark:text-gray-700">
            {new Date(note.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <button className="absolute bottom-2 right-4 text-xl opacity-80 hover:scale-110 hover:opacity-100 transition duration-200" title="Edit Note">✏️</button>
        {/* Glow on Hover */}
    <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-white/30 transition-all duration-300 pointer-events-none"></div>
      </motion.div>
  );
}
export default NoteCard;
  