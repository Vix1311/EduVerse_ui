import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchLessonQuizAttempt, submitLessonQuizAttempt } from '@/redux/slices/lessonQuiz.slice';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

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
  const questions = localQuestions;

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswerButton, setShowAnswerButton] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // =========================
  // FETCH QUIZ ATTEMPT
  // =========================
  useEffect(() => {
    if (!courseId || !lessonId || !quizId) return;

    dispatch(fetchLessonQuizAttempt({ courseId, lessonId, quizId }));
  }, [dispatch, courseId, lessonId, quizId]);

  useEffect(() => {
    if (attempt?.questions?.length) {
      setLocalQuestions(attempt.questions);
    }
  }, [attempt]);

  const fireConfetti = () => {
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { x: 0.37, y: 0.99 },
      startVelocity: 35,
      ticks: 150,
    });
  };

  // =========================
  // HANDLERS (giống QuizModal)
  // =========================
  const handleAnswerChange = (questionId: number, optionId: number) => {
    setSelectedOptionId(optionId);
    setHasChecked(false);
    setIsCorrect(null);
    setShowAnswerButton(true);
  };

  const handleCheckAnswer = (questionId: number) => {
    if (!selectedOptionId) return;

    const q = questions.find(q => q.questionId === questionId);
    const correctOption = q?.options?.find((o: any) => o.isCorrect);
    const correct = Number(correctOption?.optionId) === Number(selectedOptionId);

    setHasChecked(true);
    setIsCorrect(correct);

    if (correct) {
      setAnswers(prev => ({
        ...prev,
        [String(questionId)]: selectedOptionId,
      }));
      fireConfetti();
      setShowAnswerButton(false);
    } else {
      setShowAnswerButton(true);
    }
  };

  const handleContinue = () => {
    setSelectedOptionId(null);
    setHasChecked(false);
    setIsCorrect(null);
    setShowAnswerButton(false);
    setCurrentQuestionIndex(i => i + 1);
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

      setSubmitted(true);
    } catch (e: any) {
      toast.error(e?.message || 'Quiz submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // STATES
  // =========================
  if (loading && !attempt) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">Loading quiz...</div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center text-red-600">
        {error}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center">
        <button className="absolute top-3 right-3 text-xl" onClick={onClose}>
          ×
        </button>
        <p>No questions found.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const correctOption = currentQuestion?.options?.find((o: any) => o.isCorrect);

  // =========================
  // REVIEW BLOCK (giữ UI như bạn)
  // =========================
  const ReviewBlock = () => (
    <div className="w-full max-w-screen-sm pb-10">
      <h2 className="text-2xl font-bold text-purple-700 text-center mt-10 mb-8">🔎 Review Quiz</h2>

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
              <p className="mt-1 text-gray-700">Explanation: {q.explanation || 'No explanation'}</p>
            </div>
          </div>
        );
      })}

      <div className="mt-10 flex justify-center">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Finish Quiz
        </button>
      </div>
    </div>
  );

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
            {currentQuestionIndex + 1}. {currentQuestion.content}
          </p>

          <div className="space-y-2">
            {currentQuestion.options.map((opt: any) => (
              <label
                key={opt.optionId}
                className={`block px-4 py-2 rounded-md border cursor-pointer
                  ${
                    selectedOptionId === opt.optionId
                      ? hasChecked
                        ? isCorrect
                          ? 'bg-green-50 border-green-600'
                          : 'bg-red-50 border-red-600'
                        : 'bg-purple-50 border-purple-600'
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
            {(!hasChecked || isCorrect === false || showAnswerButton) && (
              <button
                onClick={() => handleCheckAnswer(currentQuestion.questionId)}
                disabled={selectedOptionId === null}
                className="px-4 py-2 border border-purple-600 text-purple-600 rounded disabled:opacity-50"
              >
                CHECK ANSWER
              </button>
            )}

            {hasChecked &&
              isCorrect === true &&
              (currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'FINISH QUIZ'}
                </button>
              ) : (
                <button
                  onClick={handleContinue}
                  className="px-4 py-2 bg-purple-600 text-white rounded"
                >
                  CONTINUE
                </button>
              ))}
          </div>

          <div className="min-h-[28px] mt-3 text-sm">
            {hasChecked && isCorrect === true && (
              <>
                <p className="text-green-600 font-medium">
                  Correct answer: <strong>{correctOption?.content || '—'}</strong>
                </p>

                <p className="mt-1 text-gray-700">
                  Explanation: {currentQuestion.explanation || 'No explanation'}
                </p>
              </>
            )}

            {hasChecked && isCorrect === false && (
              <p className="text-red-600 font-medium">The answer is not correct.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonQuizModal;
