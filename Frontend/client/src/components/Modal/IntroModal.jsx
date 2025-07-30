import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import ReactMarkdown from 'react-markdown';

const IntroModal = ({ visible, onClose, introText }) => {
  const navigate = useNavigate();

  if (!visible) return null;

  const handleContinue = () => {
    sessionStorage.setItem("introSeen", "true");
    onClose(); // Close modal before navigating
    navigate('/options');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full sm:w-auto max-w-3xl h-full sm:h-auto max-h-[90vh] sm:rounded-2xl overflow-auto bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-white border border-blue-100 dark:border-gray-700 shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-red-500 transition z-10"
            title="Close"
          >
            <IoClose />
          </button>
  
          {/* Modal Content */}
          <div className="p-6 pt-12 sm:pt-8">
            {/* Title */}
            <h2 className="text-3xl font-extrabold mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
              📘 Let's Dive In!
            </h2>
  
            {/* Animated Sparkles */}
            <div className="mb-4 animate-pulse text-2xl">
              ✨ Here's what you're about to explore: ✨
            </div>
  
            {/* Markdown Styled Intro */}
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-3" {...props} />,
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
                    <blockquote
                      className="border-l-4 border-blue-400 pl-4 italic text-gray-700 dark:text-gray-300 mb-2"
                      {...props}
                    />
                  ),
                }}
              >
                {introText}
              </ReactMarkdown>
            </div>
  
            {/* Continue Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleContinue}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-lg px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                🚀 Continue to Options
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  
};

export default IntroModal;
