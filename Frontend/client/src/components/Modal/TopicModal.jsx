// client/src/components/Modal/TopicModal.jsx
import React, { useState } from 'react';

const TopicModal = ({ onSubmit, onClose, visible }) => {
  const [topicInput, setTopicInput] = useState('');

  if (!visible) return null;

  const handleSubmit = () => {
    if (topicInput.trim()) {
      onSubmit(topicInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-darkbg p-6 rounded-xl shadow-xl max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4 text-center">📚 What do you want to learn?</h2>
        <input
          type="text"
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full border rounded-md px-3 py-2 mb-4"
          placeholder="Enter a course like JavaScript, React, etc."
        />
        <button
          onClick={handleSubmit}
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition"
        >
          Let's Learn
        </button>
      </div>
    </div>
  );
};

export default TopicModal;
