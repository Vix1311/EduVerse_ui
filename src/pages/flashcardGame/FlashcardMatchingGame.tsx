import React, { useEffect, useMemo, useRef, useState } from 'react';

/* =======================
   MOCK DATA
   Each row is ONE logical "question" (EN <-> VI)
   ======================= */
type Pair = { pairId: string; a: string; b: string };

const MOCK_PAIRS: Pair[] = [
  { pairId: 'p1', a: 'Apple', b: 'Quả táo' },
  { pairId: 'p2', a: 'Improve', b: 'Cải thiện' },
  { pairId: 'p3', a: 'Recommend', b: 'Đề xuất / gợi ý' },
  { pairId: 'p4', a: 'Maintain', b: 'Duy trì' },
  { pairId: 'p5', a: 'Achievement', b: 'Thành tựu' },
  { pairId: 'p6', a: 'Despite', b: 'Mặc dù' },
  { pairId: 'p7', a: 'Consistent', b: 'Nhất quán' },
  { pairId: 'p8', a: 'Attempt', b: 'Cố gắng / thử' },
];

/* =======================
   TYPES
   ======================= */
type Side = 'A' | 'B';

/**
 * A "card" is one side of a pair.
 * Example: pair p1 has 2 cards => (p1-A, p1-B)
 */
type Card = { id: string; pairId: string; side: Side; text: string };

/**
 * Render/interaction state for a card.
 * - x,y: absolute position inside the board
 * - z: stacking order (z-index)
 * - removed: if true, card disappears (matched)
 * - fx: transient visual effect state (ok/bad)
 */
type CardState = Card & {
  x: number;
  y: number;
  z: number;
  removed?: boolean;
  fx?: 'ok' | 'bad' | null;
};

/* =======================
   UTILS
   ======================= */

/** Clamp a number into [min, max] */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Fisher–Yates shuffle */
function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Simple AABB rectangle overlap check */
function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

/**
 * Scatter cards randomly inside the board, best-effort avoiding overlaps.
 * NOTE: This is not a perfect packing algorithm; it tries multiple random positions.
 */
function scatterNoOverlap(opts: {
  count: number;
  width: number;
  height: number;
  cardSize: number;
  padding: number;
  triesPerCard: number;
}) {
  const { count, width, height, cardSize, padding, triesPerCard } = opts;
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];

  for (let i = 0; i < count; i++) {
    let chosen = { x: padding, y: padding, w: cardSize, h: cardSize };

    for (let t = 0; t < triesPerCard; t++) {
      const x = Math.floor(padding + Math.random() * Math.max(1, width - cardSize - padding * 2));
      const y = Math.floor(padding + Math.random() * Math.max(1, height - cardSize - padding * 2));
      const candidate = { x, y, w: cardSize, h: cardSize };

      let collide = false;
      for (const p of placed) {
        // Expand the already placed rect a little to create breathing room
        const expanded = { x: p.x - 10, y: p.y - 10, w: p.w + 20, h: p.h + 20 };
        if (rectsOverlap(candidate, expanded)) {
          collide = true;
          break;
        }
      }

      if (!collide) {
        chosen = candidate;
        break;
      }
    }

    placed.push(chosen);
  }

  return placed.map(p => ({ x: p.x, y: p.y }));
}

/* =======================
   COMPONENT
   ======================= */
export default function FlashcardScatterMatchGame() {
  // CONFIG
  const TIME_LIMIT = 60; // seconds
  const BASE_POINTS = 20; // base points per correct match
  const TIME_BONUS_MAX = 80; // bonus points depending on remaining time
  const WRONG_PENALTY = 10; // score penalty per first wrong attempt of a pair

  const MATCH_DISTANCE = 70; // max center-to-center distance to consider "dropped near"

  const CARD_SIZE = 120; // card is a square
  const BOARD_H = 560; // board height in px

  // "Finish condition": must match ALL pairs in the dataset
  const REQUIRED_CORRECT = MOCK_PAIRS.length;

  // Board DOM ref, used to convert pointer position to board coordinates
  const boardRef = useRef<HTMLDivElement | null>(null);

  /**
   * zRef is an always-up-to-date z-index counter.
   * Using a ref avoids "async state" issues that cause cards to stack incorrectly.
   */
  const zRef = useRef(1);

  /**
   * Build a deck of cards (2 cards per pair) once.
   * Then shuffle so the cards are in a random order.
   */
  const baseDeck: Card[] = useMemo(() => {
    const cards: Card[] = [];
    for (const p of MOCK_PAIRS) {
      cards.push({ id: `c-${p.pairId}-A`, pairId: p.pairId, side: 'A', text: p.a });
      cards.push({ id: `c-${p.pairId}-B`, pairId: p.pairId, side: 'B', text: p.b });
    }
    return shuffle(cards);
  }, []);

  // GAME STATE
  const [cards, setCards] = useState<CardState[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [score, setScore] = useState(0);

  /**
   * matchedPairSet:
   * - key: pairId
   * - value: true if the pair has already been matched correctly
   *
   * This prevents the "double counting" bug (+2 matches for a single pair).
   */
  const [matchedPairSet, setMatchedPairSet] = useState<Record<string, boolean>>({});
  const correctPairs = Object.keys(matchedPairSet).length;

  /**
   * wrongPairSet:
   * tracks which pair has already been counted as wrong once,
   * so we don't punish repeatedly for the same pair.
   */
  const [wrongPairSet, setWrongPairSet] = useState<Record<string, boolean>>({});

  // Currently dragged card id (for styling + absolute top zIndex while dragging)
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // gameKey: bump this to fully re-scatter & reset the board
  const [gameKey, setGameKey] = useState(1);

  const done = correctPairs >= REQUIRED_CORRECT;
  const timeUp = timeLeft <= 0;

  /**
   * dragRef stores drag session data (mutable) for smooth dragging.
   * This avoids using state for every pointer move (which could be jittery).
   */
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  /** Whether player can still interact with the board */
  function canInteract() {
    return !done && !timeUp;
  }

  /** Score function: base + time-based bonus */
  function pointsNow() {
    const ratio = clamp(timeLeft / TIME_LIMIT, 0, 1);
    const bonus = Math.round(TIME_BONUS_MAX * ratio);
    return BASE_POINTS + bonus;
  }

  /* =======================
     INIT / RESET: scatter cards
     ======================= */
  useEffect(() => {
    const el = boardRef.current;
    const width = el?.clientWidth ?? 1000;
    const height = BOARD_H;

    const positions = scatterNoOverlap({
      count: baseDeck.length,
      width,
      height,
      cardSize: CARD_SIZE,
      padding: 18,
      triesPerCard: 250,
    });

    // Reset z-counter baseline (so all cards start in a reasonable stacking order)
    zRef.current = 10;

    setCards(
      baseDeck.map((c, i) => ({
        ...c,
        x: positions[i]?.x ?? 20,
        y: positions[i]?.y ?? 20,
        z: zRef.current + i,
        removed: false,
        fx: null,
      })),
    );

    // Reset transient drag state
    setDraggingId(null);
    dragRef.current = null;
  }, [baseDeck, gameKey]);

  /* =======================
     TIMER
     ======================= */
  useEffect(() => {
    if (done) return;
    if (timeUp) return;

    const t = window.setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [done, timeUp]);

  /* =======================
     POINTER MOVE / UP HANDLERS (global)
     - move: update dragged card position
     - up: finalize drag, attempt match with nearest card within MATCH_DISTANCE
     ======================= */
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      if (!boardRef.current) return;

      const boardRect = boardRef.current.getBoundingClientRect();
      const px = e.clientX - boardRect.left;
      const py = e.clientY - boardRect.top;

      // Keep card inside the board bounds
      const newX = clamp(px - d.offsetX, 8, boardRect.width - CARD_SIZE - 8);
      const newY = clamp(py - d.offsetY, 8, boardRect.height - CARD_SIZE - 8);

      // Update just the dragged card coordinates
      setCards(prev => prev.map(c => (c.id === d.id ? { ...c, x: newX, y: newY } : c)));
    }

    function onUp() {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;

      // Attempt to match after dropping
      setCards(prev => {
        const me = prev.find(c => c.id === d.id);
        if (!me || me.removed) return prev;

        // Find the nearest card within MATCH_DISTANCE (center-to-center)
        let best: { id: string; dist: number } | null = null;

        for (const c of prev) {
          if (c.id === me.id || c.removed) continue;

          const cx = c.x + CARD_SIZE / 2;
          const cy = c.y + CARD_SIZE / 2;
          const mx = me.x + CARD_SIZE / 2;
          const my = me.y + CARD_SIZE / 2;

          const dist = Math.hypot(cx - mx, cy - my);
          if (dist <= MATCH_DISTANCE && (!best || dist < best.dist)) {
            best = { id: c.id, dist };
          }
        }

        // No candidate near enough => no match attempt
        if (!best) return prev;

        const other = prev.find(c => c.id === best.id);
        if (!other || other.removed) return prev;

        const isMatch = me.pairId === other.pairId && me.side !== other.side;

        if (isMatch) {
          // If this pair is already matched, do nothing (prevents double count)
          if (matchedPairSet[me.pairId]) return prev;

          // Mark pair as matched (counts +1 for that pair)
          setMatchedPairSet(s => ({ ...s, [me.pairId]: true }));

          // Add score once per pair match
          setScore(s => s + pointsNow());

          // Immediately remove both cards to prevent any re-trigger
          const next = prev.map(c => {
            if (c.id === me.id || c.id === other.id) {
              return { ...c, fx: 'ok' as const, removed: true };
            }
            return c;
          });

          return next;
        } else {
          // Count wrong only once per pair (based on the dragged card's pairId)
          setWrongPairSet(setPrev => {
            if (setPrev[me.pairId]) return setPrev;
            setScore(s => Math.max(0, s - WRONG_PENALTY));
            return { ...setPrev, [me.pairId]: true };
          });

          // Flash a "bad" animation on both involved cards
          const next = prev.map(c => {
            if (c.id === me.id || c.id === other.id) return { ...c, fx: 'bad' as const };
            return c;
          });

          // Clear the bad animation after a short delay
          window.setTimeout(() => {
            setCards(p2 =>
              p2.map(c => (c.id === me.id || c.id === other.id ? { ...c, fx: null } : c)),
            );
          }, 320);

          return next;
        }
      });

      setDraggingId(null);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [timeLeft, matchedPairSet]);

  /* =======================
     Z-INDEX MANAGEMENT (complex)
     Bring clicked card to front by assigning an always-increasing z value.
     ======================= */
  function bringToFront(id: string) {
    const newZ = ++zRef.current;
    setCards(prev => prev.map(c => (c.id === id ? { ...c, z: newZ } : c)));
  }

  /* =======================
     Drag start (pointer down)
     - store offset so card doesn't "jump" to cursor
     - capture pointer so dragging stays stable
     ======================= */
  function onPointerDown(e: React.PointerEvent, id: string) {
    if (!canInteract()) return;
    if (!boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const card = cards.find(c => c.id === id);
    if (!card || card.removed) return;

    bringToFront(id);
    setDraggingId(id);

    const px = e.clientX - boardRect.left;
    const py = e.clientY - boardRect.top;

    dragRef.current = {
      id,
      offsetX: px - card.x,
      offsetY: py - card.y,
    };

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  /* =======================
     Full reset
     - IMPORTANT: correctPairs is derived from matchedPairSet,
       so you reset matchedPairSet (not correctPairs directly).
     ======================= */
  function resetGame() {
    setTimeLeft(TIME_LIMIT);
    setScore(0);
    setMatchedPairSet({});
    setWrongPairSet({});
    setGameKey(k => k + 1);
  }

  const wrongPairs = Object.keys(wrongPairSet).length;
  const progress = Math.round((correctPairs / REQUIRED_CORRECT) * 100);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* TOPBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">Match Flashcards</span>
          <span className="text-xs text-gray-600">Drag a card near its matching pair</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill>⏱️ {Math.max(0, timeLeft)}s</Pill>
          <Pill>⭐ {score}</Pill>
          <Pill>
            🧩 {correctPairs}/{REQUIRED_CORRECT}
          </Pill>
          <Pill>❌ {wrongPairs}</Pill>

          <button
            onClick={resetGame}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* PROGRESS BAR (animated + shimmer) */}
      <div className="px-4 py-3">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 transition-[width] duration-500 ease-out"
            style={{ width: `${clamp(progress, 0, 100)}%` }}
          />
          {/* Shimmer overlay to make the bar feel more "alive" */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="h-full w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-[shimmer_1.2s_infinite]" />
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(420%); }
          }
        `}</style>
      </div>

      {/* BOARD */}
      <div className="px-4 pb-4">
        <div
          ref={boardRef}
          className="relative w-full rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden"
          style={{ height: BOARD_H }}
        >
          {/* End overlay */}
          {(done || timeUp) && (
            <div className="absolute inset-0 z-[999999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <p className="text-lg font-bold text-gray-900">
                  {done ? '🎉 Completed!' : '⏳ Time is up!'}
                </p>
                <p className="mt-1 text-sm text-gray-700">Score: {score}</p>
                <p className="mt-1 text-sm text-gray-700">
                  Correct: {correctPairs}/{REQUIRED_CORRECT} • Wrong (pairs): {wrongPairs}
                </p>
                <button
                  onClick={resetGame}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Play again
                </button>
              </div>
            </div>
          )}

          {/* Cards */}
          {cards.map(c => {
            if (c.removed) return null;

            const fxOk = c.fx === 'ok';
            const fxBad = c.fx === 'bad';
            const isDragging = draggingId === c.id;

            return (
              <div
                key={c.id}
                onPointerDown={e => onPointerDown(e, c.id)}
                className={[
                  'absolute select-none',
                  'flex items-center justify-center text-center',
                  'rounded-2xl border bg-white shadow-sm',
                  'px-3 text-sm font-semibold text-gray-900',
                  'cursor-grab active:cursor-grabbing',
                  'transition',
                  // Correct match effect
                  fxOk
                    ? 'border-emerald-300 ring-2 ring-emerald-200 scale-110'
                    : 'border-gray-200 hover:shadow-md',
                  // Wrong match effect
                  fxBad ? 'border-rose-300 animate-[shake_0.3s_ease-in-out]' : '',
                  // Dragging effect (visual feedback)
                  isDragging ? 'ring-2 ring-indigo-200 shadow-lg scale-[1.03]' : '',
                  // Disable interaction after finish/time up
                  !canInteract() ? 'pointer-events-none opacity-80' : '',
                ].join(' ')}
                style={{
                  width: CARD_SIZE,
                  height: CARD_SIZE,
                  left: c.x,
                  top: c.y,
                  /**
                   * While dragging, force the card to the absolute top.
                   * This avoids "card stacking" glitches.
                   */
                  zIndex: isDragging ? 999999 : c.z,
                }}
              >
                <span className="line-clamp-4">{c.text}</span>
              </div>
            );
          })}

          {/* Shake animation keyframes */}
          <style>{`
            @keyframes shake {
              0% { transform: translateX(0); }
              25% { transform: translateX(-6px); }
              50% { transform: translateX(6px); }
              75% { transform: translateX(-4px); }
              100% { transform: translateX(0); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

/* Small UI helper for topbar pills */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
      {children}
    </span>
  );
}
