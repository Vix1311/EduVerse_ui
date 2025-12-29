import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchLessonQuizAttempt, submitLessonQuizAttempt } from '@/redux/slices/lessonQuiz.slice';
import { toast } from 'react-toastify';

interface LessonQuizModalProps {
  quizId: string;
  courseId: string;
  lessonId: string;

  onLessonCompleted?: (lessonId: string) => void;
  onClose: () => void;
}

const LessonQuizModal = ({
  quizId,
  courseId,
  lessonId,
  onLessonCompleted,
  onClose,
}: LessonQuizModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { quizAttemptById, loading, error } = useSelector((state: RootState) => state.lessonQuiz);

  const attempt = quizAttemptById[String(quizId)];

  const [localQuestions, setLocalQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ======= FETCH ATTEMPT (HOOKS MUST STAY ABOVE RETURNS) =======
  useEffect(() => {
    if (!courseId || !lessonId || !quizId) return;
    dispatch(fetchLessonQuizAttempt({ courseId, lessonId, quizId }));
  }, [dispatch, courseId, lessonId, quizId]);

  useEffect(() => {
    if (attempt?.questions?.length) {
      setLocalQuestions(attempt.questions);
      // reset index if questions changed
      setCurrentQuestionIndex(0);
      setSelectedOptionId(null);
    }
  }, [attempt]);

  const questions = localQuestions;

  // current question memo (safe)
  const currentQuestion = useMemo(() => {
    if (!questions.length) return null;
    return questions[currentQuestionIndex] ?? null;
  }, [questions, currentQuestionIndex]);

  // restore selection when moving between questions
  useEffect(() => {
    if (!currentQuestion) return;
    const saved = answers[String(currentQuestion.questionId)];
    setSelectedOptionId(saved ?? null);
  }, [currentQuestion, answers]);

  // ======= HANDLERS =======
  const handleAnswerChange = (questionId: number, optionId: number) => {
    setSelectedOptionId(optionId);
    setAnswers(prev => ({
      ...prev,
      [String(questionId)]: optionId,
    }));
  };

  const isLast = useMemo(
    () => questions.length > 0 && currentQuestionIndex === questions.length - 1,
    [questions.length, currentQuestionIndex],
  );

  const canContinue = selectedOptionId !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    setCurrentQuestionIndex(i => Math.min(i + 1, Math.max(questions.length - 1, 0)));
  };

  const handleSubmit = async () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, answerOptionId]) => ({
      questionId: Number(questionId),
      answerOptionId: Number(answerOptionId),
    }));

    if (!formattedAnswers.length) {
      toast.error('You have not answered any questions');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        submitLessonQuizAttempt({
          courseId,
          lessonId,
          quizId,
          answers: formattedAnswers,
        }),
      ).unwrap();

      toast.success('Quiz submitted successfully!');
      onLessonCompleted?.(lessonId);

      // ✅ switch to review in-modal (no reload)
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e?.message || 'Quiz submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ======= RENDER HELPERS =======
  const showInitialLoading = loading && !attempt;
  const showInitialError = !!error && !attempt;
  const noQuestions = !questions.length;

  const ReviewBlock = () => (
    <div className="w-full max-w-screen-sm pb-10">
      <h2 className="text-2xl font-bold text-purple-700 text-center mt-10 mb-8">🔎 Review Quiz</h2>

      <div className="max-h-[70vh] overflow-y-auto scrollbar-soft pr-2">
        {questions.map((q, idx) => {
          const correct = q.options?.find((o: any) => o.isCorrect);
          const userPicked = answers[String(q.questionId)];

          return (
            <div key={q.questionId} className="mb-6 p-4">
              <p className="font-medium mb-3">
                {idx + 1}. {q.content}
              </p>

              <div className="space-y-2">
                {q.options?.map((opt: any) => {
                  const isCorrectOpt = !!opt.isCorrect;
                  const isPicked = Number(opt.optionId) === Number(userPicked);

                  return (
                    <div
                      key={opt.optionId}
                      className={`px-4 py-2 rounded-md border text-sm
                      ${
                        isCorrectOpt
                          ? 'border-green-600 bg-green-50 text-green-800 font-semibold'
                          : isPicked
                            ? 'border-red-600 bg-red-50 text-red-800 font-semibold'
                            : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      {opt.content}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-sm">
                <p className="text-green-700">
                  Correct answer: <strong>{correct?.content || '—'}</strong>
                </p>
                <p className="mt-1 text-gray-700">
                  Explanation: {q.explanation || 'No explanation'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* nút Finish nằm ngoài vùng scroll */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Finish Quiz
        </button>
      </div>
    </div>
  );

  // ======= RETURNS (after ALL hooks) =======
  if (showInitialLoading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <button className="absolute top-3 right-3 text-xl" onClick={onClose}>
          ×
        </button>
        Loading quiz...
      </div>
    );
  }

  if (showInitialError) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center text-red-600">
        <button className="absolute top-3 right-3 text-xl" onClick={onClose}>
          ×
        </button>
        {error}
      </div>
    );
  }

  if (noQuestions) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center">
        <button className="absolute top-3 right-3 text-xl" onClick={onClose}>
          ×
        </button>
        <p>No questions found.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-start mt-10 px-4">
      <button className="absolute top-3 right-3 text-gray-600 text-xl" onClick={onClose}>
        ×
      </button>

      {submitted ? (
        <ReviewBlock />
      ) : (
        <div className="w-full max-w-screen-sm pb-10">
          <h2 className="text-2xl font-bold text-purple-700 text-center mt-10 mb-12">
            📝 Lesson Quiz
          </h2>

          <p className="font-medium mb-3">
            {currentQuestionIndex + 1}. {currentQuestion?.content}
          </p>

          <div className="space-y-2">
            {currentQuestion?.options?.map((opt: any) => (
              <label
                key={opt.optionId}
                className={`block px-4 py-2 rounded-md border cursor-pointer
                  ${
                    selectedOptionId === opt.optionId
                      ? 'bg-purple-50 border-purple-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <input
                  type="radio"
                  hidden
                  checked={selectedOptionId === opt.optionId}
                  onChange={() => handleAnswerChange(currentQuestion.questionId, opt.optionId)}
                />
                {opt.content}
              </label>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !canContinue}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'FINISH QUIZ'}
              </button>
            ) : (
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
              >
                CONTINUE
              </button>
            )}
          </div>

          <div className="min-h-[24px] mt-3 text-sm text-gray-600">
            {!canContinue ? 'Please select an answer to continue.' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonQuizModal;
