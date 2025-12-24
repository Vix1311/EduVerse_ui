import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchModuleQuizAttempt, submitModuleQuizAttempt } from '@/redux/slices/moduleQuiz.slice';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

interface QuizModalProps {
  quizId: string;
  courseId: string;
  moduleId: string;
  mode: 'take' | 'review';
  onOpen?: () => void;
  onClose: () => void;
}

const QuizModal = ({
  quizId,
  courseId,
  moduleId,
  onClose,
  onOpen,
  mode = 'take',
}: QuizModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { quizAttemptById, loading, error } = useSelector((state: RootState) => state.moduleQuiz);

  const attempt = quizAttemptById[quizId];

  const [localQuestions, setLocalQuestions] = useState<any[]>([]);

  const questions = localQuestions;

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswerButton, setShowAnswerButton] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /** FETCH ATTEMPT */
  useEffect(() => {
    if (!courseId || !moduleId || !quizId) return;

    dispatch(
      fetchModuleQuizAttempt({
        courseId,
        moduleId,
        quizId,
      }),
    );
  }, [dispatch, courseId, moduleId, quizId]);

  /** COPY QUESTIONS TO LOCAL STATE */
  useEffect(() => {
    if (attempt?.questions?.length) {
      setLocalQuestions(attempt.questions);
    }
  }, [attempt]);

  useEffect(() => {
    onOpen?.();
  }, []);

  const fireConfetti = () => {
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { x: 0.37, y: 0.99 },
      startVelocity: 35,
      ticks: 150,
    });
  };

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
        submitModuleQuizAttempt({
          courseId,
          moduleId,
          quizId,
          answers: formattedAnswers,
        }),
      ).unwrap();

      toast.success('Quiz submitted successfully!');
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Quiz submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !attempt) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error && !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No questions available</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const correctOption = currentQuestion.options?.find((o: any) => o.isCorrect);

  return (
    <div className="min-h-screen flex justify-center px-4 pt-10">
      <button className="absolute top-3 right-3 text-xl" onClick={onClose}>
        ×
      </button>

      <div className="max-w-screen-sm w-full">
        <h2 className="text-2xl font-bold text-center text-purple-700 mb-8">📝 Take Quiz</h2>

        <p className="font-medium mb-3">
          {currentQuestionIndex + 1}. {currentQuestion.content}
        </p>

        <div className="space-y-2">
          {currentQuestion.options.map((opt: any) => (
            <label
              key={opt.optionId}
              className={`block px-4 py-2 rounded border cursor-pointer
                ${
                  selectedOptionId === opt.optionId
                    ? hasChecked
                      ? isCorrect
                        ? 'bg-green-50 border-green-600'
                        : 'bg-red-50 border-red-600'
                      : 'bg-purple-50 border-purple-600'
                    : 'border-gray-300'
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
          {!hasChecked && (
            <button
              onClick={() => handleCheckAnswer(currentQuestion.questionId)}
              disabled={selectedOptionId === null}
              className="px-4 py-2 border border-purple-600 text-purple-600 rounded"
            >
              CHECK ANSWER
            </button>
          )}

          {hasChecked &&
            (currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                FINISH QUIZ
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

        {hasChecked && isCorrect && (
          <div className="mt-4 text-sm">
            <p className="text-green-600 font-medium">Correct answer: {correctOption?.content}</p>
            <p className="text-gray-600 mt-1">{currentQuestion.explanation || 'No explanation'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModal;
