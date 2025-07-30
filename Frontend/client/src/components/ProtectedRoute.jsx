import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function useQuizProtection() {
  const navigate = useNavigate();

  const checkQuizAndRun = (quizTaken, action, bypassProtection = false) => {
    if (!bypassProtection && quizTaken !== true) {
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center text-center w-72">
          <div className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Quiz Required 🎯</div>
          <div className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Please take today's quiz to unlock this feature.
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              onClick={() => {
                navigate('/quiz');
                toast.dismiss(t.id);
              }}
            >
              Take Quiz
            </button>
            <button
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              onClick={() => toast.dismiss(t.id)}
            >
              Maybe Later
            </button>
          </div>
        </div>
      ));
      return false;
    }

    action();  // ✅ If quizTaken is true, run the protected action
    return true;
  };

  return { checkQuizAndRun };
}
