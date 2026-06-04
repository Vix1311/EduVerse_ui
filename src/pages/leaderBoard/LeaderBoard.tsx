import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';

type Leader = {
  rank: number;
  name: string;
  xp: number;
  challenges: number;
  score: number;
  tone: 'gold' | 'silver' | 'bronze';
};

type Challenge = {
  id: string;
  title: string;
  desc: string;
  progress: number;
  total: number;
  rewardA: string;
  rewardB: string;
  tone: 'red' | 'blue';
};

type Course = {
  id: string;
  name: string;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function weekdayShort(d: Date) {
  const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  return map[d.getDay()];
}

function Drawer({
  open,
  onClose,
  courses,
  selectedCourseId,
  onSelectCourse,
}: {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (id: string) => void;
}) {
  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-black/30 transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden
      />

      <div
        className={[
          'fixed left-0 top-0 z-50 h-full w-[320px] bg-white shadow-xl',
          'transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div className="text-base font-semibold text-slate-900">Choose course</div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="p-3">
          {courses.map(c => {
            const active = c.id === selectedCourseId;
            return (
              <button
                key={c.id}
                onClick={() => {
                  onSelectCourse(c.id);
                  onClose();
                }}
                className={['flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left'].join(
                  ' ',
                )}
              >
                <span className={['flex h-5 w-5 items-center justify-center '].join(' ')}>
                  {active ? <FiCheck color="#0093fc" size={16} /> : ''}
                </span>
                <span className="font-medium">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

type LeaderRow = {
  rank: number;
  name: string;
  xp: number;
  challenges: number;
  score: number;
  tone: 'gold' | 'silver' | 'bronze';
};

function LeaderboardSheet({
  open,
  onClose,
  leaders,
}: {
  open: boolean;
  onClose: () => void;
  leaders: LeaderRow[];
}) {
  const [range, setRange] = React.useState<'day' | 'week' | 'month' | 'all'>('week');
  const [sort, setSort] = React.useState<'xp' | 'score'>('xp');

  const rows = React.useMemo(() => {
    const base = leaders.map(l => ({
      ...l,
      streak: l.rank === 1 ? 1 : 10 + l.rank * 3,
      accuracy: l.rank === 1 ? 90.91 : l.rank === 4 ? 88 : 100,
    }));

    const sorted =
      sort === 'xp'
        ? [...base].sort((a, b) => b.xp - a.xp)
        : [...base].sort((a, b) => b.score - a.score);

    return sorted.map((x, i) => ({ ...x, displayRank: i + 1 }));
  }, [leaders, sort]);

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden
      />

      <div
        className={[
          'fixed inset-x-0 bottom-0 z-[70] h-full rounded-t-3xl bg-white shadow-2xl',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
            aria-label="close"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <span>🏆</span>
            <span>Leaderboard</span>
          </div>

          <div className="w-10" />
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 px-4">
          <div className="text-sm text-slate-500">{rows.length} people</div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full bg-slate-100 p-1 text-sm">
              <TabBtn active={range === 'day'} onClick={() => setRange('day')}>
                Day
              </TabBtn>
              <TabBtn active={range === 'week'} onClick={() => setRange('week')}>
                Week
              </TabBtn>
              <TabBtn active={range === 'month'} onClick={() => setRange('month')}>
                Month
              </TabBtn>
              <TabBtn active={range === 'all'} onClick={() => setRange('all')}>
                All
              </TabBtn>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="hidden sm:inline">Sort by:</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as any)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="xp">XP earned</option>
                <option value="score">Score</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3 h-[calc(92vh-120px)] overflow-y-auto">
          {rows.map(r => (
            <div
              key={`${r.name}-${r.displayRank}`}
              className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-6 text-sm font-semibold text-slate-700">{r.displayRank}</div>

                <div className="h-11 w-11 rounded-full bg-slate-200 ring-2 ring-white" />

                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{r.name}</div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {r.challenges} challenges • {r.xp} XP
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 font-semibold text-slate-900">
                    <span className="text-sky-600">⚡</span>
                    <span>{r.xp}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 font-semibold text-slate-900">
                    <span className="text-amber-500">🔥</span>
                    <span>{r.streak}</span>
                  </div>
                  <div className="text-xs text-slate-500">Streak</div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 font-semibold text-slate-900">
                    <span className="text-emerald-600">🟢</span>
                    <span>{r.accuracy}%</span>
                  </div>
                  <div className="text-xs text-slate-500">Accuracy</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1.5 text-sm font-medium transition',
        active ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-200/70',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function DateStrip() {
  const today = startOfDay(new Date());

  const previous7 = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(today, -(7 - i));
      return { date: d, label: weekdayShort(d), day: d.getDate() };
    });
  }, [today.getTime()]);

  return (
    <div className="mt-3 flex items-end justify-between px-3">
      <div className="flex flex-1 items-end justify-between gap-6 pr-4">
        {previous7.map(item => (
          <div key={item.date.toISOString()} className="flex flex-col items-center">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="mt-1 flex items-center justify-center text-sm font-semibold text-slate-900">
              {item.day}
            </div>
          </div>
        ))}
        <div className="flex flex-col items-center">
          <div className="text-xs text-slate-500">Today</div>
          <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
            {today.getDate()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderBoardPage() {
  const navigate = useNavigate();

  const [practiceOpen, setPracticeOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('htmlcss');

  const courses: Course[] = useMemo(
    () => [
      { id: 'jsbasic', name: 'Basic JavaScript Programming' },
      { id: 'htmlcss', name: 'HTML CSS Pro' },
    ],
    [],
  );

  const selectedCourseName = courses.find(c => c.id === selectedCourseId)?.name ?? 'HTML CSS Pro';

  const leaders: Leader[] = useMemo(
    () => [
      { rank: 1, name: 'Lương Văn Huân', xp: 760, challenges: 17, score: 70.2, tone: 'gold' },
      { rank: 2, name: 'Khải Nguyễn Việt', xp: 670, challenges: 16, score: 54.4, tone: 'silver' },
      { rank: 3, name: 'Nguyễn Việt', xp: 275, challenges: 8, score: 51.2, tone: 'bronze' },
    ],
    [],
  );

  const challenges: Challenge[] = useMemo(
    () => [
      {
        id: 'streak',
        title: 'Streak Guardian',
        desc: 'Maintain your daily study streak - complete at least 10 flashcards today',
        progress: 0,
        total: 10,
        rewardA: '+20',
        rewardB: '+35 XP',
        tone: 'red',
      },
      {
        id: 'speed',
        title: 'Speed of Light',
        desc: 'Answer 10 flashcards correctly within 30 seconds per question',
        progress: 0,
        total: 10,
        rewardA: '+20',
        rewardB: '+40 XP',
        tone: 'blue',
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={setSelectedCourseId}
      />
      <LeaderboardSheet
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        leaders={leaders}
      />

      <div className="mx-auto w-full px-3 pb-10 pt-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              className="rounded-lg p-2 transition hover:bg-slate-100"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
            >
              <div className="h-[2px] w-6 bg-slate-600" />
              <div className="mt-1 h-[2px] w-6 bg-slate-600" />
              <div className="mt-1 h-[2px] w-6 bg-slate-600" />
            </button>
            <div>
              <div className="text-lg font-semibold">{selectedCourseName}</div>
            </div>
          </div>
        </div>

        <DateStrip />

        <section className="my-5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">🏆 Leaderboard</h2>
            <button
              onClick={() => setLeaderboardOpen(true)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View all →
            </button>
          </div>

          <div className="space-y-3">
            {leaders.map(l => {
              const tone =
                l.tone === 'gold'
                  ? 'bg-gradient-to-r from-yellow-200 to-orange-200 ring-yellow-200/60'
                  : l.tone === 'silver'
                    ? 'bg-gradient-to-r from-slate-200 to-slate-300 ring-slate-200/60'
                    : 'bg-gradient-to-r from-orange-200 to-orange-300 ring-orange-200/60';

              return (
                <div
                  key={l.rank}
                  className={[
                    'group rounded-2xl p-4 ring-1 transition duration-200',
                    'hover:-translate-y-1 hover:shadow-md',
                    'hover:saturate-125 hover:brightness-[1.02]',
                    tone,
                  ].join(' ')}
                >
                  <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/55 text-lg font-bold text-slate-800 ring-1 ring-white/60">
                      {l.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-semibold">{l.name}</div>
                      <div className="mt-0.5 text-sm text-slate-700/80">
                        {l.xp} XP • {l.challenges} challenges
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold">{l.score.toFixed(1)}</div>
                      <div className="text-sm text-slate-700/80">points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]">
            View full leaderboard →
          </button>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold">Daily challenges</h2>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              0/2 completed
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map(c => {
              const iconBg = c.tone === 'red' ? 'bg-rose-500' : 'bg-blue-500';
              const barColor = c.tone === 'red' ? 'bg-rose-400' : 'bg-blue-400';

              return (
                <div
                  key={c.id}
                  className={[
                    'group rounded-2xl bg-white p-5',
                    'ring-1 ring-slate-200',
                    'transition duration-200',
                    'hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-slate-300',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={[
                        'flex h-12 w-12 items-center justify-center rounded-2xl text-white',
                        iconBg,
                        'transition duration-200',
                        'group-hover:scale-110',
                      ].join(' ')}
                      aria-hidden
                    >
                      {c.tone === 'red' ? '🔥' : '⚡'}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold">{c.title}</div>
                      <div className="mt-1 text-sm text-slate-600">{c.desc}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>Progress</span>
                    <span className="font-semibold text-slate-800">
                      {c.progress}/{c.total}
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${barColor}`}
                      style={{ width: `${(c.progress / c.total) * 100}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
                      💎 {c.rewardA}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                      ⭐ {c.rewardB}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                Number of consecutive days you have completed
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-200">
                <span className="text-3xl font-semibold text-indigo-600">0</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 p-6 text-white shadow-sm">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="max-w-xl">
                <div className="text-2xl font-semibold">Continue learning</div>
                <div className="mt-1 text-white/80">You still have 2 flashcards left</div>
              </div>

              <button
                onClick={() => navigate('/flashcardgame')}
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/20 active:scale-[0.99]"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="relative overflow-hidden rounded-2xl bg-sky-100 p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xl font-semibold">Practice</div>
                <div className="mt-1 text-slate-600">Practice by chapter</div>
              </div>

              <button
                onClick={() => setPracticeOpen(true)}
                className="rounded-xl bg-white px-6 py-3 font-semibold text-sky-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
              >
                PRACTICE →
              </button>
            </div>
          </div>
        </section>
      </div>

      {practiceOpen && <PracticeFullScreen onClose={() => setPracticeOpen(false)} />}
    </div>
  );

  function PracticeFullScreen({ onClose }: { onClose: () => void }) {
    const [selected, setSelected] = React.useState<number[]>([]);

    const items = [
      { id: 1, title: '2. Getting started with HTML', count: 2 },
      { id: 2, title: '3. Basic HTML structure', count: 5 },
    ];

    const allSelected = selected.length === items.length && items.length > 0;

    const toggleItem = (id: number) => {
      setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const toggleAll = () => {
      if (allSelected) setSelected([]);
      else setSelected(items.map(i => i.id));
    };

    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="relative flex h-14 items-center border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
          >
            ✕
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 font-semibold text-slate-700">
            Practice by Chapter
          </div>

          <button
            onClick={toggleAll}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full border-2 transition"
            style={{
              borderColor: allSelected ? '#0EA5E9' : '#CBD5E1',
              background: allSelected ? 'rgba(14,165,233,0.08)' : 'transparent',
            }}
          >
            {allSelected && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="#0EA5E9"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="h-[calc(100vh-56px-170px)] overflow-y-auto bg-white px-4 py-6">
          {items.map(item => {
            const isSelected = selected.includes(item.id);

            return (
              <div key={item.id} className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-slate-800">{item.title}</span>

                  <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-2 text-xs font-semibold text-slate-600">
                    {item.count}
                  </span>
                </div>

                <button
                  onClick={() => toggleItem(item.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition"
                  style={{
                    borderColor: isSelected ? '#0EA5E9' : '#CBD5E1',
                    background: isSelected ? 'rgba(14,165,233,0.08)' : 'transparent',
                  }}
                >
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="#0EA5E9"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 pb-6 pt-5">
          <div className="mx-auto w-full space-y-4">
            <button
              disabled={selected.length === 0}
              className={[
                'w-full rounded-xl py-4 text-center text-lg font-semibold transition',
                selected.length > 0
                  ? 'bg-sky-500 text-white hover:bg-sky-600 active:scale-[0.99]'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400',
              ].join(' ')}
            >
              START
            </button>

            <button className="w-full rounded-xl border-2 border-sky-500 bg-white py-4 text-center text-lg font-semibold text-sky-500 hover:bg-sky-50 active:scale-[0.99]">
              REDO WRONG ANSWERS
            </button>
          </div>
        </div>
      </div>
    );
  }
}
