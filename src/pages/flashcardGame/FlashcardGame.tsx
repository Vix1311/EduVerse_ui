import React, { useEffect, useMemo, useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

type QuizQuestion = {
  id: string;
  question: string;
  code: string;
  options: Array<{ id: string; label: string; value: number }>;
  correctOptionId: string;
  explanation?: string;
};

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'How many elements are there in the code snippet?',
    code: `<h1>Hello World</h1>`,
    options: [
      { id: 'a', label: '0', value: 0 },
      { id: 'b', label: '1', value: 1 },
      { id: 'c', label: '2', value: 2 },
    ],
    correctOptionId: 'b',
    explanation: 'The h1 tag is a single HTML element.',
  },
  {
    id: 'q2',
    question: 'Which tag makes text appear italic?',
    code: `<p>Hello</p>`,
    options: [
      { id: 'a', label: '<b>', value: 0 },
      { id: 'b', label: '<i>', value: 1 },
      { id: 'c', label: '<u>', value: 2 },
    ],
    correctOptionId: 'b',
    explanation: 'The <i> tag (or <em>) is used to display italic text.',
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ConfettiDots() {
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
  return (
    <svg viewBox="0 0 240 240" className="h-44 w-44" role="img" aria-label="Congrats">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#FFD54A" />
          <stop offset="1" stopColor="#FFB300" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="54" fill="url(#g)" />
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
      if (e.key.toLowerCase() === 'h') alert('Shortcut key (demo): H');
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navigate = useNavigate();

  if (finished) {
    return (
      <div className="relative min-h-screen bg-white">
        <ConfettiDots />

        <div className="mx-auto w-full px-4 pb-36 pt-16 text-center">
          <div className="text-lg font-semibold text-gray-800">Congratulations</div>

          <div className="mt-8 flex justify-center">
            <SunIllustration />
          </div>

          <div className="mt-8 text-sm text-gray-600">
            You answered{' '}
            <span className="font-bold text-blue-600">
              {correctCount}/{total}
            </span>{' '}
            questions correctly.
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
              BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      <div className="mx-auto w-full px-4 pt-6">
        <div className="flex items-center justify-between">
          <button
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Close"
            onClick={() => navigate('/leaderboard')}
          >
            <span className="text-xl leading-none">✕</span>
          </button>

          <div className="text-sm font-semibold text-gray-700">
            {index + 1}/{total}
          </div>

          <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
            <span>Press</span>
            <kbd className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600">
              H
            </kbd>
            <span>to view shortcuts</span>
          </div>
        </div>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-1 rounded-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mx-auto w-full px-4 pb-44 pt-10">
        <h1 className="text-2xl font-bold text-gray-900">{current.question}</h1>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <pre className="overflow-auto text-sm">
            <code className="text-gray-800">{current.code}</code>
          </pre>
        </div>

        <p className="mt-6 text-sm text-gray-500">Choose 1 correct answer</p>

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

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <div className="mx-auto w-full px-4 py-4">
          {submitted && (
            <div className="mb-3 flex gap-2">
              {isCorrect ? (
                <div className="text-sm font-semibold text-gray-800">🎉 Correct!</div>
              ) : (
                <div className="text-sm font-semibold text-gray-800">
                  ❌ Incorrect. The correct answer is{' '}
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
              ANSWER
            </button>
          ) : (
            <button
              className="w-full rounded-xl bg-blue-600 py-5 text-center text-sm font-bold text-white hover:bg-blue-700"
              onClick={nextQuestion}
            >
              CONTINUE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
