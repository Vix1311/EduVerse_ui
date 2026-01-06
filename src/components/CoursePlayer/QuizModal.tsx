import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchModuleQuizAttempt, submitModuleQuizAttempt } from '@/redux/slices/moduleQuiz.slice';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

export type QuizModalProps = {
  quizId: string;
  courseId: string;
  moduleId: string;
  mode: 'take' | 'review';
  reviewData?: {
    questions: any[];
    userAnswers: Record<string, string | string[]>;
    correctAnswers: Record<string, string | string[]>;
    score?: number;
  } | null;
  onComplete: (payload: any) => void;
  onClose: () => void;
  onOpen: () => void;
};

const QuizModal = ({
  quizId,
  courseId,
  moduleId,
  onClose,
  onOpen,
  onComplete,
  mode = 'take',
  reviewData,
}: QuizModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { quizAttemptById, loading, error } = useSelector((state: RootState) => state.moduleQuiz);

  const attempt = quizAttemptById[quizId];

  const [localQuestions, setLocalQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<any[]>([]);

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!courseId || !moduleId || !quizId) return;
    dispatch(fetchModuleQuizAttempt({ courseId, moduleId, quizId }));
  }, [dispatch, courseId, moduleId, quizId]);

  useEffect(() => {
    if (attempt?.questions?.length) {
      setLocalQuestions(attempt.questions);
      setCurrentQuestionIndex(0);
      setSelectedOptionId(null);
    }
  }, [attempt]);

  useEffect(() => {
    onOpen?.();
  }, [onOpen]);

  const questions = localQuestions;

  const currentQuestion = useMemo(() => {
    if (!questions.length) return null;
    return questions[currentQuestionIndex] ?? null;
  }, [questions, currentQuestionIndex]);

  useEffect(() => {
    if (!currentQuestion) return;
    const saved = answers[String(currentQuestion.questionId)];
    setSelectedOptionId(saved ?? null);
  }, [currentQuestion, answers]);

  const isLast = useMemo(
    () => questions.length > 0 && currentQuestionIndex === questions.length - 1,
    [questions.length, currentQuestionIndex],
  );

  const canContinue = selectedOptionId !== null;

  const fireConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      startVelocity: 35,
      ticks: 150,
    });
  };

  /* ================= ACTIONS ================= */
  const handleAnswerChange = (questionId: number, optionId: number) => {
    setSelectedOptionId(optionId);
    setAnswers(prev => ({
      ...prev,
      [String(questionId)]: optionId,
    }));
  };

  const handleContinue = () => {
    if (!canContinue) return;
    setCurrentQuestionIndex(i => Math.min(i + 1, questions.length - 1));
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
      const result = await dispatch(
        submitModuleQuizAttempt({
          courseId,
          moduleId,
          quizId,
          answers: formattedAnswers,
        }),
      ).unwrap();

      toast.success('Quiz submitted successfully!');
      fireConfetti();
      onComplete?.(result);

      setReviewQuestions(questions);
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e?.message || 'Quiz submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= REVIEW DATA ================= */
  const reviewQs = reviewData?.questions?.length
    ? reviewData.questions
    : reviewQuestions.length
      ? reviewQuestions
      : questions;

  const reviewAnswers: Record<string, number> = reviewData?.userAnswers
    ? Object.fromEntries(
        Object.entries(reviewData.userAnswers).map(([k, v]) => [
          String(k),
          Array.isArray(v) ? Number(v[0]) : Number(v),
        ]),
      )
    : answers;

  /* ================= STATES ================= */
  if (loading && !attempt) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error && !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
    );
  }

  if (!questions.length && mode !== 'review') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button className="absolute top-3 right-3 text-xl" onClick={onClose}>
          ×
        </button>
        <p>No questions available</p>
      </div>
    );
  }

  /* ================= REVIEW UI ================= */
  const ReviewBlock = ({ qs }: { qs: any[] }) => (
    <div className="max-w-screen-sm w-full h-[80vh] flex flex-col">
      <div className="shrink-0 pt-6 pb-4">
        <h2 className="text-2xl font-bold text-center text-purple-700">🔎 Quiz Result</h2>
        {reviewData?.score !== undefined && (
          <p className="text-center mt-2 text-lg font-semibold">Score: {reviewData.score}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-6">
        {qs.map((q, idx) => {
          const userPicked = reviewAnswers[String(q.questionId)];
          const correct = q.options?.find((o: any) => o.isCorrect);

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

      <div className="shrink-0 sticky backdrop-blur py-4 flex justify-center">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
        >
          Finish
        </button>
      </div>
    </div>
  );

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen flex justify-center px-4 pt-10">
      <button className="absolute top-3 right-3 text-xl" onClick={onClose}>
        ×
      </button>

      {mode === 'review' || submitted ? (
        <ReviewBlock qs={reviewQs} />
      ) : (
        <div className="max-w-screen-sm w-full">
          <h2 className="text-2xl font-bold text-center text-purple-700 mb-8">📝 Take Quiz</h2>

          <p className="font-medium mb-3">
            {currentQuestionIndex + 1}. {currentQuestion?.content}
          </p>

          <div className="space-y-2">
            {currentQuestion?.options?.map((opt: any) => (
              <label
                key={opt.optionId}
                className={`block px-4 py-2 rounded border cursor-pointer
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

export default QuizModal;
