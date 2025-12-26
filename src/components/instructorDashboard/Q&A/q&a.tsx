import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

import { logo } from '@/assets/images';
import { path as PATHS } from '@/core/constants/path';
import DetailPanel from './detailPanel';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://eduverseapi-production.up.railway.app/api/v1';

export type QARole = 'instructor' | 'client';

// status giống backend HTML: PENDING / UNREAD / RESOLVED
export type ThreadStatus = 'PENDING' | 'UNREAD' | 'RESOLVED';

export interface ThreadSummary {
  id: number;
  title?: string | null;
  courseId: number;
  courseTitle?: string | null;
  lessonId: number;
  status: ThreadStatus;
  lastActivityAt: string;
  authorName: string;
  lessonTitle?: string | null;
}

interface ThreadListResponse {
  items: any[];
  total?: number;
}

interface Filters {
  search: string;
  status: '' | ThreadStatus;
  sortBy: 'lastActivityAt' | 'createdAt';
  order: 'asc' | 'desc';
}

/* ========== Helpers ========== */
const api = (path: string) => `${API_BASE}${path}`;
const token = localStorage.getItem('access_token');
const buildHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': 'NestjsSuper@Elearning$2025',
    Authorization: `Bearer ${token}`,

    // TODO: Thay bằng auth thật
    // Authorization: `Bearer ${yourAccessToken}`,
  };
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  const d = Math.floor(h / 24);
  return `${d} days ago`;
};

const classNames = (...xs: (string | null | false | undefined)[]) => xs.filter(Boolean).join(' ');

/* ========== Navbar ========== */

const Navbar: React.FC<{ role: QARole; initialCourseId?: number }> = ({
  role,
  initialCourseId,
}) => {
  let backHref = PATHS.home;

  if (role === 'instructor') {
    backHref = PATHS.instructor.instructorDashboard;
  } else {
    // client
    if (initialCourseId) {
      backHref = PATHS.coursePlayer.replace(':courseId', String(initialCourseId));
    } else {
      backHref = PATHS.myLearning;
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between pr-3 ">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link to={backHref}>
            <div className="text-black text-lg pl-2 h-10 w-10 flex items-center justify-center">
              <FaArrowLeft />
            </div>
          </Link>
          <Link to={PATHS.home}>
            <div className="flex gap-1 items-center">
              <img
                src={logo}
                alt="logo"
                className="transition-all duration-300 border-black border-l-2 pl-3 h-[38px]"
              />
              <span className="text-xl font-medium">E-Learning</span>
            </div>
          </Link>
        </div>
        <h1 className="text-sm font-semibold text-slate-800">
          {role === 'instructor' ? 'Comments from learners' : 'Q&A khoá học'}
        </h1>
      </div>
    </header>
  );
};

/* ========== Sidebar (layout mới, giữ chức năng cũ) ========== */

/* ========== Sidebar (layout mới, Status / Sort / Order đều dạng pill) ========== */

const Sidebar: React.FC<{
  filters: Filters;
  setFilters: (f: Filters) => void;
}> = ({ filters, setFilters }) => {
  const setField = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters({ ...filters, [key]: value });
  };

  const statusOptions: { value: Filters['status']; label: string }[] = [
    { value: '', label: 'All status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'UNREAD', label: 'Unread' },
    { value: 'RESOLVED', label: 'Resolved' },
  ];

  const sortOptions: { value: Filters['sortBy']; label: string }[] = [
    { value: 'lastActivityAt', label: 'Last activity' },
    { value: 'createdAt', label: 'Created' },
  ];

  const orderOptions: { value: Filters['order']; label: string }[] = [
    { value: 'desc', label: 'Desc' },
    { value: 'asc', label: 'Asc' },
  ];

  return (
    <aside className="hidden md:flex sticky shrink-0 top-14 h-[calc(100vh-56px)] w-72 flex-col gap-3 bg-white p-4 ring-1 ring-slate-200">
      {/* Search giống layout mới (input + icon) nhưng binding vào filters.search */}
      <div className="relative w-full max-w-xl">
        <input
          placeholder="Search questions..."
          value={filters.search}
          onChange={e => setField('search', e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300"
        />
        <span className="pointer-events-none absolute left-3 top-2.5">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400">
            <path
              d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
              stroke="currentColor"
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>

      {/* STATUS */}
      <h2 className="mt-3 text-sm font-semibold text-slate-700">Status</h2>
      <nav className="mt-1 flex flex-col gap-1">
        {statusOptions.map(opt => {
          const active = filters.status === opt.value;
          return (
            <button
              key={opt.value || 'ALL'}
              type="button"
              onClick={() => setField('status', opt.value)}
              className={classNames(
                'flex items-center justify-between rounded-3xl px-3 py-2 text-left text-sm',
                active ? 'bg-[#0969DA] text-white' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  {/* Dot icon cho status */}
                  <span
                    className={classNames(
                      'h-2 w-2 rounded-full',
                      opt.value === ''
                        ? 'bg-slate-300'
                        : opt.value === 'PENDING'
                          ? 'bg-amber-500'
                          : opt.value === 'UNREAD'
                            ? 'bg-rose-500'
                            : 'bg-emerald-500',
                    )}
                  />
                </span>
                {opt.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* SORT BY */}
      <h2 className="mt-4 text-sm font-semibold text-slate-700">Sort by</h2>
      <nav className="mt-1 flex flex-col gap-1">
        {sortOptions.map(opt => {
          const active = filters.sortBy === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setField('sortBy', opt.value)}
              className={classNames(
                'flex items-center justify-between rounded-3xl px-3 py-2 text-left text-sm',
                active ? 'bg-[#0969DA] text-white' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  {/* icon nhỏ cho sort */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      d="M8 7h8M6 12h12M10 17h4"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                {opt.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ORDER */}
      <h2 className="mt-4 text-sm font-semibold text-slate-700">Order</h2>
      <nav className="mt-1 flex flex-col gap-1">
        {orderOptions.map(opt => {
          const active = filters.order === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setField('order', opt.value)}
              className={classNames(
                'flex items-center justify-between rounded-3xl px-3 py-2 text-left text-sm',
                active ? 'bg-[#0969DA] text-white' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  {/* icon mũi tên để gợi ý asc/desc */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    {opt.value === 'desc' ? (
                      <path
                        d="M12 5v14m0 0l-4-4m4 4l4-4"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      <path
                        d="M12 19V5m0 0l-4 4m4-4l4 4"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </span>
                {opt.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/*
        PHẦN Categories + Most helpful của layout mới vẫn chưa có dữ liệu backend,
        nên mình vẫn để comment ở bản trước. Khi nào có API categories / leaderboard
        thì có thể thêm lại giống file mock.
      */}
    </aside>
  );
};

/* ========== Status badge ========== */

const StatusBadge: React.FC<{ status: ThreadStatus }> = ({ status }) => {
  const map: Record<ThreadStatus, { text: string; cls: string }> = {
    UNREAD: {
      text: 'Unread',
      cls: 'bg-rose-50 text-rose-700 ring-rose-200',
    },
    PENDING: {
      text: 'Pending reply',
      cls: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
    RESOLVED: {
      text: 'Resolved',
      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
  };
  const info = map[status];

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        info.cls,
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {info.text}
    </span>
  );
};

/* ========== Thread row ========== */

const ThreadRow: React.FC<{
  item: ThreadSummary;
  onOpen: (t: ThreadSummary) => void;
}> = ({ item, onOpen }) => {
  return (
    <button
      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100"
      onClick={() => onOpen(item)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold text-slate-900">
              {item.title || item.lessonTitle || '(no title)'}
            </h3>
          </div>
          <p className="mt-1 text-sm text-slate-600 truncate">
            Asked by <span className="font-medium">{item.authorName}</span> ·{' '}
            {timeAgo(item.lastActivityAt)} · Course {item.courseTitle} · Lesson {item.lessonTitle}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <StatusBadge status={item.status} />
          <span className="text-xs text-slate-400">
            {new Date(item.lastActivityAt).toLocaleString()}
          </span>
        </div>
      </div>
    </button>
  );
};

/* ========== Box tạo câu hỏi cho client (API như qa-client.html) ========== */

const AskQuestionBox: React.FC<{
  role: QARole;
  initialCourseId?: number;
  initialLessonId?: number;
  onCreated?: (thread: ThreadSummary) => void;
}> = ({ role, initialCourseId, initialLessonId, onCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (role !== 'client' || !initialCourseId || !initialLessonId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trimmed = content.trim();
    if (!trimmed) {
      setMessage('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        courseId: initialCourseId,
        lessonId: initialLessonId,
        title: title.trim() || undefined,
        content: trimmed || '(empty)',
      };

      // GIỐNG qa-client.html: POST /qa/client/threads
      const res = await fetch(api('/qa/client/threads'), {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage('Tạo câu hỏi thất bại: ' + (data?.message || res.status));
        return;
      }

      setMessage('Đã gửi câu hỏi thành công!');
      setTitle('');
      setContent('');

      if (onCreated) {
        const newThread: ThreadSummary = {
          id: data.id,
          title: data.title,
          courseId: data.courseId,
          lessonId: data.lessonId,
          status: data.status as ThreadStatus,
          lastActivityAt: data.lastActivityAt,
          authorName: data.author?.fullname || 'Bạn',
          lessonTitle: data.lesson?.title || null,
        };
        onCreated(newThread);
      }
    } catch (err: any) {
      setMessage('Lỗi mạng: ' + (err?.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 mx-0 md:mx-4 rounded-lg border border-slate-200 bg-white p-4 space-y-3"
    >
      <h2 className="text-sm font-semibold text-slate-800">Đặt câu hỏi cho bài học này</h2>
      <p className="text-xs text-slate-500">
        Course #{initialCourseId} • Lesson #{initialLessonId}
      </p>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Tiêu đề (tuỳ chọn)"
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Mô tả chi tiết câu hỏi của bạn..."
        rows={4}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300 resize-y"
      />
      {message && <p className="text-xs text-red-500 whitespace-pre-line">{message}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
            submitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0969DA] hover:bg-[#0653aa]'
          }`}
        >
          {submitting ? 'Sending...' : 'Submitting question'}
        </button>
      </div>
    </form>
  );
};

/* ========== Dashboard chính ========== */

interface QADashboardProps {
  role: QARole;
  initialCourseId?: number;
  initialLessonId?: number;
}

const QADashboard: React.FC<QADashboardProps> = ({ role, initialCourseId, initialLessonId }) => {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    sortBy: 'lastActivityAt',
    order: 'desc',
  });

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ThreadSummary | null>(null);

  const reloadThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const qp = new URLSearchParams();
      qp.set('page', '1');
      qp.set('pageSize', '20');

      if (filters.search.trim()) qp.set('search', filters.search.trim());
      if (filters.status) qp.set('status', filters.status);
      if (filters.sortBy) qp.set('sortBy', filters.sortBy);
      if (filters.order) qp.set('order', filters.order);

      // client: nếu vào từ course/lesson cụ thể thì filter theo đó
      if (role === 'client' && initialCourseId && initialLessonId) {
        qp.set('courseId', String(initialCourseId));
        qp.set('lessonId', String(initialLessonId));
      }

      const basePath = role === 'instructor' ? '/qa/seller/threads' : '/qa/client/threads';

      // GIỐNG qa-seller.html / qa-client.html
      const res = await fetch(`${api(basePath)}?${qp.toString()}`, {
        headers: buildHeaders(),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error ${res.status}: ${txt}`);
      }
      const data: ThreadListResponse = await res.json();
      const items = data.items || [];

      const mapped: ThreadSummary[] = items.map(t => ({
        id: t.id,
        title: t.title,
        courseId: t.courseId,
        lessonId: t.lessonId,
        status: (t.status || 'PENDING') as ThreadStatus,
        lastActivityAt: t.lastActivityAt || t.createdAt,
        authorName: t.author?.fullname || t.authorName || `User #${t.authorId || ''}`,
        lessonTitle: t.lesson?.title,
        courseTitle: t.course?.title,
      }));

      setThreads(mapped);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reloadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    role,
    filters.search,
    filters.status,
    filters.sortBy,
    filters.order,
    initialCourseId,
    initialLessonId,
  ]);

  const handleOpen = (t: ThreadSummary) => {
    setSelected(t);
  };

  const handleThreadCreated = (t: ThreadSummary) => {
    // Sau khi tạo câu hỏi, reload list và mở luôn thread đó
    void reloadThreads().then(() => {
      setSelected(t);
    });
  };

  const emptyMessage =
    role === 'instructor'
      ? 'Chưa có câu hỏi nào từ học viên.'
      : 'Bạn chưa đặt câu hỏi nào cho bài học này.';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar role={role} initialCourseId={initialCourseId} />
      <div className="pt-14 flex w-full">
        <Sidebar filters={filters} setFilters={setFilters} />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="pt-[50px] px-4 md:px-6 lg:px-8 w-full max-w-5xl mx-auto">
            <AskQuestionBox
              role={role}
              initialCourseId={initialCourseId}
              initialLessonId={initialLessonId}
              onCreated={handleThreadCreated}
            />

            <section className="min-w-0 w-full flex flex-col">
              <div className="flex items-center justify-between px-1 py-2">
                <h2 className="text-sm font-semibold text-slate-800">
                  {role === 'instructor' ? 'Comments from learners' : 'Các câu hỏi của bạn'}
                </h2>
              </div>

              <div className="bg-white w-full border border-slate-200 rounded-lg overflow-hidden">
                {loading && (
                  <div className="px-4 py-4 text-sm text-slate-500">Loading question list... </div>
                )}
                {error && !loading && (
                  <div className="px-4 py-4 text-sm text-red-500 whitespace-pre-line">{error}</div>
                )}
                {!loading && !error && threads.length === 0 && (
                  <div className="px-4 py-4 text-sm text-slate-500">{emptyMessage}</div>
                )}
                {!loading &&
                  !error &&
                  threads.map(t => <ThreadRow key={t.id} item={t} onOpen={handleOpen} />)}
              </div>
            </section>
          </div>

          <DetailPanel
            open={!!selected}
            onClose={() => setSelected(null)}
            role={role}
            thread={selected}
            onAfterChange={reloadThreads}
          />
        </main>
      </div>
    </div>
  );
};

/* ========== Wrapper default export: quyết định role theo URL ========== */
/**
 * - Nếu path là /QnA -> không có courseId/lessonId => role = 'instructor'
 * - Nếu path là /qna/:courseId/:lessonId -> có params => role = 'client'
 */
const InstructorCommentsDashboard: React.FC = () => {
  const params = useParams<{ courseId?: string; lessonId?: string }>();

  const hasCourseContext = params.courseId && params.lessonId;

  const role: QARole = hasCourseContext ? 'client' : 'instructor';

  const initialCourseId = hasCourseContext ? Number(params.courseId) : undefined;
  const initialLessonId = hasCourseContext ? Number(params.lessonId) : undefined;

  return (
    <QADashboard role={role} initialCourseId={initialCourseId} initialLessonId={initialLessonId} />
  );
};

export default InstructorCommentsDashboard;
