import React, { useEffect, useMemo, useState } from 'react';
import { FaCheck } from 'react-icons/fa';

type QuizQuestion = {
  id: string;
  question: string;
  code: string;
  options: Array<{ id: string; label: string; value: number }>;
  correctOptionId: string;
  explanation?: string; // nếu có thì hiện dưới "Chính xác!" / "Sai rồi"
};

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Có mấy phần tử trong đoạn code?',
    code: `<h1>Hello World</h1>`,
    options: [
      { id: 'a', label: '0', value: 0 },
      { id: 'b', label: '1', value: 1 },
      { id: 'c', label: '2', value: 2 },
    ],
    correctOptionId: 'b',
    explanation: 'Thẻ h1 là một phần tử HTML duy nhất.',
  },
  {
    id: 'q2',
    question: 'Thẻ nào có tác dụng in nghiêng nội dung văn bản?',
    code: `<p>Xin chào</p>`,
    options: [
      { id: 'a', label: '<b>', value: 0 },
      { id: 'b', label: '<i>', value: 1 },
      { id: 'c', label: '<u>', value: 2 },
    ],
    correctOptionId: 'b',
    explanation: 'Thẻ <i> (hoặc <em>) dùng để hiển thị chữ nghiêng.',
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ConfettiDots() {
  // nền chấm màu nhẹ như ảnh (decorative)
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-10 top-40 h-2 w-2 rounded-full bg-emerald-200 opacity-60" />
      <div className="absolute left-24 top-72 h-2 w-2 rounded-full bg-blue-200 opacity-60" />
      <div className="absolute right-14 top-60 h-2 w-2 rounded-full bg-purple-200 opacity-60" />
      <div className="absolute right-24 top-96 h-2 w-2 rounded-full bg-rose-200 opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-yellow-200 opacity-60" />
    </div>
  );
}

function SunIllustration() {
  // Bạn có thể thay bằng asset giống F8 nếu có.
  // SVG này chỉ để tạo vibe tương tự.
  return (
    <svg viewBox="0 0 240 240" className="h-44 w-44" role="img" aria-label="Congrats">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#FFD54A" />
          <stop offset="1" stopColor="#FFB300" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="54" fill="url(#g)" />
      {/* rays */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i * Math.PI) / 8;
        const x1 = 120 + Math.cos(a) * 70;
        const y1 = 120 + Math.sin(a) * 70;
        const x2 = 120 + Math.cos(a) * 92;
        const y2 = 120 + Math.sin(a) * 92;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#FFB74D"
            strokeWidth="10"
            strokeLinecap="round"
          />
        );
      })}
      {/* face */}
      <path
        d="M96 124c8 10 40 10 48 0"
        fill="none"
        stroke="#0F172A"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M98 112c0 0 6-10 14 0"
        fill="none"
        stroke="#0F172A"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M128 112c0 0 6-10 14 0"
        fill="none"
        stroke="#0F172A"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="82" cy="122" r="8" fill="#FF7AA2" opacity="0.9" />
      <circle cx="156" cy="122" r="8" fill="#FF7AA2" opacity="0.9" />
      {/* small stars */}
      <path d="M38 90l8 6-8 6-8-6 8-6z" fill="#A5B4FC" opacity="0.9" />
      <path d="M200 150l8 6-8 6-8-6 8-6z" fill="#67E8F9" opacity="0.9" />
    </svg>
  );
}

export default function QuizLikeF8() {
  const total = MOCK_QUESTIONS.length;

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = MOCK_QUESTIONS[clamp(index, 0, total - 1)];

  const progress = useMemo(() => {
    return Math.round(((index + 1) / total) * 100);
  }, [index, total]);

  const isCorrect = submitted && picked === current.correctOptionId;

  function onSubmit() {
    if (!picked || submitted) return;
    setSubmitted(true);
    if (picked === current.correctOptionId) setCorrectCount(c => c + 1);
  }

  function nextQuestion() {
    if (index >= total - 1) {
      setFinished(true);
      return;
    }
    setIndex(i => i + 1);
    setPicked(null);
    setSubmitted(false);
  }

  function resetToHome() {
    setIndex(0);
    setPicked(null);
    setSubmitted(false);
    setCorrectCount(0);
    setFinished(false);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'h') alert('Phím tắt (demo): H');
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // FINISHED SCREEN
  if (finished) {
    return (
      <div className="relative min-h-screen bg-white">
        <ConfettiDots />

        <div className="mx-auto w-full px-4 pt-16 pb-36 text-center">
          <div className="text-lg font-semibold text-gray-800">Chúc mừng bạn</div>

          <div className="mt-8 flex justify-center">
            <SunIllustration />
          </div>

          <div className="mt-8 text-sm text-gray-600">
            Bạn đã trả lời đúng{' '}
            <span className="font-bold text-blue-600">
              {correctCount}/{total}
            </span>{' '}
            câu.
          </div>

          <div className="mx-auto mt-12 max-w-4xl rounded-xl border-2 border-blue-400 bg-white">
            {MOCK_QUESTIONS.map((q, i) => (
              <div key={q.id} className="flex items-center justify-between px-6 py-5 text-left">
                <div className="text-sm text-gray-900">
                  <span className="mr-2">{i + 1}.</span>
                  {q.question}
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                  <FaCheck />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
          <div className="mx-auto w-full px-4 py-4">
            <button
              className="w-full rounded-xl bg-blue-600 py-5 text-center text-sm font-bold text-white hover:bg-blue-700"
              onClick={resetToHome}
            >
              VỀ TRANG CHỦ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ SCREEN
  return (
    <div className="relative min-h-screen bg-white">
      {/* Header */}
      <div className="mx-auto w-full px-4 pt-6">
        <div className="flex items-center justify-between">
          <button
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Close"
            onClick={() => alert('Close clicked (demo)')}
          >
            <span className="text-xl leading-none">✕</span>
          </button>

          <div className="text-sm font-semibold text-gray-700">
            {index + 1}/{total}
          </div>

          <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
            <span>Nhấn</span>
            <kbd className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600">
              H
            </kbd>
            <span>để xem phím tắt</span>
          </div>
        </div>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-1 rounded-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full px-4 pt-10 pb-44">
        <h1 className="text-2xl font-bold text-gray-900">{current.question}</h1>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <pre className="overflow-auto text-sm">
            <code className="text-gray-800">{current.code}</code>
          </pre>
        </div>

        <p className="mt-6 text-sm text-gray-500">Chọn 1 đáp án đúng</p>

        {/* Options - bỏ radio */}
        <div className="mt-4 space-y-4">
          {current.options.map(opt => {
            const checked = picked === opt.id;

            const base =
              'flex items-center justify-center rounded-xl border px-6 py-5 transition cursor-pointer select-none';
            const normal = 'border-gray-200 bg-white hover:bg-gray-50';
            const active = 'border-emerald-400 bg-emerald-50';

            return (
              <div
                key={opt.id}
                role="button"
                tabIndex={0}
                aria-pressed={checked}
                onClick={() => !submitted && setPicked(opt.id)}
                onKeyDown={e => {
                  if (submitted) return;
                  if (e.key === 'Enter' || e.key === ' ') setPicked(opt.id);
                }}
                className={[
                  base,
                  checked ? active : normal,
                  submitted ? 'cursor-not-allowed opacity-95' : '',
                ].join(' ')}
              >
                <span className="text-base font-semibold text-gray-900">{opt.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom action bar - feedback nằm ngay trên nút */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <div className="mx-auto w-full px-4 py-4">
          {/* Feedback đặt ở đây để không tạo khoảng trống ở body */}
          {submitted && (
            <div className="flex gap-2 mb-3">
              {isCorrect ? (
                <div className="text-sm font-semibold text-gray-800">🎉 Chính xác!</div>
              ) : (
                <div className="text-sm font-semibold text-gray-800">
                  ❌ Sai rồi. Đáp án đúng là{' '}
                  <span className="font-bold text-blue-600">
                    {current.options.find(o => o.id === current.correctOptionId)?.label}
                  </span>
                </div>
              )}

              {current.explanation && (
                <div className="text-sm text-gray-600">{current.explanation}</div>
              )}
            </div>
          )}

          {!submitted ? (
            <button
              className={[
                'w-full rounded-xl py-5 text-center text-sm font-bold transition',
                picked
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-500 disabled:opacity-70',
              ].join(' ')}
              onClick={onSubmit}
              disabled={!picked}
            >
              TRẢ LỜI
            </button>
          ) : (
            <button
              className="w-full rounded-xl bg-blue-600 py-5 text-center text-sm font-bold text-white hover:bg-blue-700"
              onClick={nextQuestion}
            >
              TIẾP TỤC
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
