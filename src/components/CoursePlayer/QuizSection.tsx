import { useSelector } from 'react-redux';
import { RootState } from '@/core/store/store';

const QuizSection = ({
  onStartQuiz,
  currentLessonId,
  moduleId,
}: {
  onStartQuiz: (quizId: string, moduleId: string | null) => void;
  currentLessonId: string;
  moduleId: string | null;
}) => {
  const { quizzesByModule, loading, error } = useSelector(
    (state: RootState) => state.moduleQuiz,
  );

  const quizzes = moduleId ? quizzesByModule[String(moduleId)] || [] : [];

  if (!moduleId) {
    return (
      <div className="mt-6 text-sm text-gray-500">
        Cannot determine the module for the current lesson. Please select a lesson in the Course content.
      </div>
    );
  }

  if (loading && (!quizzes || quizzes.length === 0)) {
    return <div className="mt-6 text-sm text-gray-500">Loading module quizzes...</div>;
  }

  if (error && (!quizzes || quizzes.length === 0)) {
    return (
      <div className="mt-6 text-sm text-red-500">
        Error loading quizzes: {error}
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="mt-6 text-sm text-gray-500">
        This module has no quizzes yet.
      </div>
    );
  }

  const getQuizId = (quiz: any): string | null => {
    const raw =
      quiz._id ??
      quiz.id ??
      quiz.quizId ??
      quiz.quiz_id ??
      null;

    return raw != null ? String(raw) : null;
  };

  return (
    <div className="mt-6 space-y-4">
      {quizzes.map((quiz: any) => {
        const quizId = getQuizId(quiz);

        return (
          <div
            key={quizId || quiz.title}
            className="border rounded p-4 flex items-center justify-between bg-white shadow-sm"
          >
            <div>
              <h3 className="text-lg font-semibold mb-1">{quiz.title}</h3>
              {quiz.description && (
                <p className="text-sm text-gray-600 mb-1">{quiz.description}</p>
              )}

              {quiz.quiz_result && (
                <p className="text-xs text-green-700">
                  Score: {quiz.quiz_result.score} – submitted at{' '}
                  {new Date(quiz.quiz_result.submitted_at).toLocaleString()}
                </p>
              )}
            </div>

            {quiz.quiz_result ? (
              <span className="text-sm text-green-700 font-semibold">Completed</span>
            ) : (
              <button
                onClick={() => {
                  if (!quizId) return;
                  onStartQuiz(quizId, moduleId);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
              >
                Take quiz: {quiz.title}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QuizSection;
