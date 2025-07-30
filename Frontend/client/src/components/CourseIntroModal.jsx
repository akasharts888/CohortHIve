import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import ReactMarkdown from 'react-markdown';

const CourseIntroModal = ({ show, onClose, courseName, introText }) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`relative w-full sm:w-auto max-w-3xl h-full sm:h-auto max-h-[90vh] sm:rounded-lg overflow-auto bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-xl`}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-red-500 transition z-10"
            title="Close"
          >
            <IoClose />
          </button>
  
          {/* Modal Content */}
          <div className="p-6 pt-12 sm:pt-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              📘 Course Introduction: {courseName}
            </h2>
  
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
                    <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700 dark:text-gray-300 mb-2" {...props} />
                  ),
                }}
              >
                {introText}
              </ReactMarkdown>
            </div>
  
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}  

export default CourseIntroModal;
