import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import type { QARole, ThreadStatus, ThreadSummary } from './q&a';
import { path as PATHS } from '@/core/constants/path';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

interface ThreadDetail extends ThreadSummary {
  locked?: boolean;
  acceptedPostId?: number | null;
  isResolved?: boolean;
  courseName?: string | null;
  lessonName?: string | null;
  participants?: string[];
  // NOTE: The new layout may include category/participant details, but the backend doesn't provide them yet.
}

interface Post {
  id: number;
  authorName: string;
  authorId?: number;
  createdAt: string;
  content: string;
  isEdited?: boolean;
  parentId?: number | null;

  // Backend may return `isMine` to allow client Edit/Delete
  isMine?: boolean;
}

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  role: QARole;
  thread: ThreadSummary | null;
  onAfterChange?: () => void; // reload list when status/lock/accept changes
}

/* ===== Helpers ===== */

const api = (path: string) => `${API_BASE}${path}`;

const buildHeaders = (): HeadersInit => {
  // Real token from app login
  let token = localStorage.getItem('access_token') || '';

  // Ensure Bearer prefix
  if (token && !token.toLowerCase().startsWith('bearer ')) {
    token = `Bearer ${token}`;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-key': 'NestjsSuper@Elearning$2025', // Must match backend exactly
  };

  if (token) {
    headers['Authorization'] = token;
  }

  return headers;
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

const Dot = ({ className = '' }: { className?: string }) => (
  <span className={classNames('inline-block h-1.5 w-1.5 rounded-full', className)} />
);

const StatusBadge: React.FC<{ status: ThreadStatus }> = ({ status }) => {
  const map: Record<ThreadStatus, { text: string; cls: string; dot: string }> = {
    UNREAD: {
      text: 'Unread',
      cls: 'bg-rose-50 text-rose-700 ring-rose-200',
      dot: 'bg-rose-500',
    },
    PENDING: {
      text: 'Pending reply',
      cls: 'bg-amber-50 text-amber-700 ring-amber-200',
      dot: 'bg-amber-500',
    },
    RESOLVED: {
      text: 'Resolved',
      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      dot: 'bg-emerald-500',
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
      <Dot className={info.dot} />
      {info.text}
    </span>
  );
};

const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200">
      {initials}
    </span>
  );
};

/**
 * Slightly richer than plain text:
 *  - `code`
 *  - [link](https://...)
 *  - **bold**
 *  - *italic*
 *  - > quote
 */
function renderRichText(raw: string): React.ReactNode {
  const lines = (raw || '').split(/\r?\n/);

  const renderInline = (t: string): React.ReactNode[] => {
    let out: React.ReactNode[] = [t];

    const apply = (re: RegExp, fn: (m: RegExpExecArray, idx: number) => React.ReactNode) => {
      const next: React.ReactNode[] = [];
      out.forEach(chunk => {
        if (typeof chunk !== 'string') {
          next.push(chunk);
          return;
        }
        let i = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(chunk))) {
          if (m.index > i) next.push(chunk.slice(i, m.index));
          next.push(fn(m, next.length));
          i = m.index + m[0].length;
        }
        if (i < chunk.length) next.push(chunk.slice(i));
      });
      out = next;
    };

    // inline code
    apply(/`([^`]+)`/g, (m, k) => (
      <code
        key={`c-${k}`}
        className="rounded bg-slate-100 px-1 font-mono text-[13px] text-slate-800"
      >
        {m[1]}
      </code>
    ));

    // link
    apply(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, k) => (
      <a
        key={`a-${k}`}
        href={m[2]}
        target="_blank"
        rel="noreferrer"
        className="text-sky-600 underline"
      >
        {m[1]}
      </a>
    ));

    // bold
    apply(/\*\*([^*]+)\*\*/g, (m, k) => (
      <strong key={`b-${k}`} className="font-semibold">
        {m[1]}
      </strong>
    ));

    // italic
    apply(/(^|[^\*])\*([^*]+)\*(?!\*)/g, (m, k) => (
      <React.Fragment key={`i-${k}`}>
        {m[1]}
        <em className="italic">{m[2]}</em>
      </React.Fragment>
    ));

    return out;
  };

  const children: React.ReactNode[] = [];
  let buffer: React.ReactNode[] = [];

  const flushParagraph = () => {
    if (!buffer.length) return;
    children.push(
      <p key={`p-${children.length}`} className="mb-1 last:mb-0">
        {buffer}
      </p>,
    );
    buffer = [];
  };

  lines.forEach(line => {
    if (/^\s*>\s?/.test(line)) {
      flushParagraph();
      const text = line.replace(/^\s*>\s?/, '');
      children.push(
        <div
          key={`q-${children.length}`}
          className="my-2 border-l-4 border-slate-200 pl-3 text-slate-700"
        >
          {renderInline(text)}
        </div>,
      );
    } else if (line.trim() === '') {
      flushParagraph();
    } else {
      if (buffer.length) buffer.push(<br key={`br-${buffer.length}`} />);
      buffer.push(...renderInline(line));
    }
  });

  flushParagraph();
  return <>{children}</>;
}

/* ===== Post Item ===== */

const PostItem: React.FC<{
  post: Post;
  childrenPosts: Post[];
  role: QARole;
  thread: ThreadDetail;
  onReply: (parentId?: number | null) => void;
  onAccept: (postId: number) => void;
  onUnaccept: () => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}> = ({ post, childrenPosts, role, thread, onReply, onAccept, onUnaccept, onEdit, onDelete }) => {
  const accepted = thread.acceptedPostId === post.id;
  const actions: React.ReactNode[] = [];

  if (role === 'instructor') {
    actions.push(
      <button
        key="reply"
        className="text-xs text-sky-600 hover:underline"
        onClick={() => onReply(post.id)}
      >
        Reply
      </button>,
    );

    if (accepted) {
      actions.push(
        <button
          key="unaccept"
          className="text-xs text-amber-600 hover:underline"
          onClick={() => onUnaccept()}
        >
          Unaccept
        </button>,
      );
    } else {
      actions.push(
        <button
          key="accept"
          className="text-xs text-emerald-600 hover:underline"
          onClick={() => onAccept(post.id)}
        >
          Accept
        </button>,
      );
    }
  }

  if (role === 'client' && post.isMine) {
    actions.push(
      <button
        key="edit"
        className="text-xs text-sky-600 hover:underline"
        onClick={() => onEdit && onEdit(post)}
      >
        Edit
      </button>,
    );
    actions.push(
      <button
        key="delete"
        className="text-xs text-red-600 hover:underline"
        onClick={() => onDelete && onDelete(post)}
      >
        Delete
      </button>,
    );
  }

  return (
    <div className="mb-3">
      <div className="flex items-start gap-3 rounded-lg bg-white px-3 py-2 hover:bg-slate-50 border border-slate-100">
        <Avatar name={post.authorName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{post.authorName}</span>
              {accepted && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                  Accepted answer
                </span>
              )}
              <span className="text-xs text-slate-500">
                {timeAgo(post.createdAt)}
                {post.isEdited && ' • edited'}
              </span>
            </div>

            {actions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>

          <div className="mt-1 text-[13px] leading-relaxed text-slate-800">
            {renderRichText(post.content || '')}
          </div>
        </div>
      </div>

      {childrenPosts.length > 0 && (
        <div className="ml-6 border-l border-dashed border-slate-200 pl-3 mt-1 space-y-2">
          {childrenPosts.map(child => (
            <PostItem
              key={child.id}
              post={child}
              childrenPosts={[]}
              role={role}
              thread={thread}
              onReply={onReply}
              onAccept={onAccept}
              onUnaccept={onUnaccept}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ===== DetailPanel ===== */

const DetailPanel: React.FC<DetailPanelProps> = ({
  open,
  onClose,
  role,
  thread,
  onAfterChange,
}) => {
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [replyContent, setReplyContent] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');

  // Lock body scroll when panel is open
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev;
    };
  }, [open]);

  const threadId = thread?.id;

  const loadDetail = async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const path =
        role === 'instructor' ? `/qa/seller/threads/${threadId}` : `/qa/client/threads/${threadId}`;

      const res = await fetch(api(path), { headers: buildHeaders() });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error ${res.status}: ${txt}`);
      }

      const t = await res.json();
      const mapped: ThreadDetail = {
        id: t.id,
        title: t.title,
        courseId: t.courseId,
        lessonId: t.lessonId,
        status: t.status,
        lastActivityAt: t.lastActivityAt,
        authorName: t.author?.fullname || 'User',
        lessonTitle: t.lesson?.title || t.lessonName || t.title,
        locked: t.locked,
        acceptedPostId: t.acceptedPostId,
        isResolved: t.isResolved,
        courseName: t.course?.title || null,
        lessonName: t.lesson?.title || null,
        participants: [t.author?.fullname, t.instructor?.fullname].filter(Boolean),
      };

      setDetail(mapped);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!threadId) return;
    setLoadingPosts(true);
    setError(null);
    try {
      const path =
        role === 'instructor'
          ? `/qa/seller/threads/${threadId}/posts`
          : `/qa/client/threads/${threadId}/posts`;

      const res = await fetch(api(path), { headers: buildHeaders() });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error ${res.status}: ${txt}`);
      }

      const data = await res.json();
      const items = data.items || data || [];

      const mapped: Post[] = items.map((p: any) => ({
        id: p.id,
        authorName: p.author?.fullname || `User #${p.authorId || ''}`,
        authorId: p.authorId,
        createdAt: p.createdAt,
        content: p.content,
        isEdited: p.isEdited,
        parentId: p.parentId,
        isMine: p.isMine,
      }));

      setPosts(mapped);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (!open || !threadId) {
      setDetail(null);
      setPosts([]);
      return;
    }
    void loadDetail();
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, threadId, role]);

  const roots = useMemo(() => {
    const byParent: Record<number, Post[]> = {};
    const rootList: Post[] = [];

    posts.forEach(p => {
      if (p.parentId) {
        if (!byParent[p.parentId]) byParent[p.parentId] = [];
        byParent[p.parentId].push(p);
      } else {
        rootList.push(p);
      }
    });

    return { rootList, byParent };
  }, [posts]);

  if (!open || !thread || !detail) return null;

  const handleSendReply = async () => {
    const content = replyContent.trim();
    if (!content || !threadId) return;

    try {
      const path =
        role === 'instructor'
          ? `/qa/seller/threads/${threadId}/posts`
          : `/qa/client/threads/${threadId}/posts`;

      const body = {
        threadId,
        content: content || '(empty)',
        parentId,
      };

      const res = await fetch(api(path), {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        alert(`Send failed ${res.status}: ${txt}`);
        return;
      }

      setReplyContent('');
      setParentId(null);

      await loadPosts();
      await loadDetail();
      onAfterChange?.();
    } catch (e: any) {
      alert('Network error: ' + (e?.message || String(e)));
    }
  };

  const handleAccept = async (postId: number) => {
    if (role !== 'instructor' || !threadId) return;
    try {
      const res = await fetch(api(`/qa/seller/threads/${threadId}/accept`), {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert('Accept failed: ' + txt);
        return;
      }
      await loadDetail();
      await loadPosts();
      onAfterChange?.();
    } catch (e: any) {
      alert('Network error: ' + (e?.message || String(e)));
    }
  };

  const handleUnaccept = async () => {
    if (role !== 'instructor' || !threadId) return;
    try {
      const res = await fetch(api(`/qa/seller/threads/${threadId}/unaccept`), {
        method: 'POST',
        headers: buildHeaders(),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert('Unaccept failed: ' + txt);
        return;
      }
      await loadDetail();
      await loadPosts();
      onAfterChange?.();
    } catch (e: any) {
      alert('Network error: ' + (e?.message || String(e)));
    }
  };

  const handleSetStatus = async (status: ThreadStatus) => {
    if (role !== 'instructor' || !threadId) return;
    try {
      const res = await fetch(api(`/qa/seller/threads/${threadId}/status`), {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert('Failed to update status: ' + txt);
        return;
      }
      await loadDetail();
      onAfterChange?.();
    } catch (e: any) {
      alert('Network error: ' + (e?.message || String(e)));
    }
  };

  const handleSetLock = async (locked: boolean) => {
    if (role !== 'instructor' || !threadId) return;
    try {
      const res = await fetch(api(`/qa/seller/threads/${threadId}/lock`), {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify({ locked }),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert('Lock/unlock failed: ' + txt);
        return;
      }
      await loadDetail();
      onAfterChange?.();
    } catch (e: any) {
      alert('Network error: ' + (e?.message || String(e)));
    }
  };

  const handleEditPost = async (post: Post) => {
    if (role !== 'client') return;
    setEditingPostId(post.id);
    setEditingContent(post.content);
  };

  const submitEditPost = async () => {
    if (role !== 'client' || !editingPostId) return;

    const content = editingContent.trim() || '(empty)';
    try {
      const res = await fetch(api(`/qa/client/posts/${editingPostId}`), {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert('Edit failed: ' + txt);
        return;
      }

      setEditingPostId(null);
      setEditingContent('');
      await loadPosts();
    } catch (e: any) {
      alert('Network error: ' + (e?.message || String(e)));
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (role !== 'client') return;
    if (!window.confirm('Delete this comment?')) return;

    try {
      const res = await fetch(api(`/qa/client/posts/${post.id}`), {
        method: 'DELETE',
        headers: buildHeaders(),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert('Delete failed: ' + txt);
        return;
      }
      await loadPosts();
    } catch (e: any) {
      alert('Network error: ' + (e?.message || String(e)));
    }
  };

  const canReply = replyContent.trim().length > 0 && !detail.locked;
  const remainingChars = 2000 - replyContent.length;

  const backHref =
    role === 'instructor' ? PATHS.instructor.instructorDashboard : PATHS.myLearning || PATHS.home;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full bg-white shadow-xl flex">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 md:ml-2 justify-between items-center gap-3 ">
            <button onClick={onClose}>
              <div className="text-black text-lg h-10 w-10 flex items-center justify-center ">
                <FaArrowLeft />
              </div>
            </button>

            <div className="border-l-2 border-black pl-3 min-w-0">
              <p className="truncate text-xs text-slate-500">
                Course {detail.courseName} • Lesson {detail.lessonName}
              </p>
              <h2 className="truncate text-[18px] md:text-[22px] font-semibold text-slate-900">
                {detail.title || detail.lessonTitle || '(no title)'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {detail.locked && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                Locked
              </span>
            )}
            {detail.isResolved && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                Solved
              </span>
            )}
            <StatusBadge status={detail.status} />
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
          <div className="px-10 pt-4 pb-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              {/* Left column: Discussion */}
              <div className="min-w-0 space-y-4">
                {/* Top info */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium">{detail.authorName}</span>
                  <span className="text-xs text-slate-500">
                    • Last activity {timeAgo(detail.lastActivityAt)} • {detail.courseName}
                  </span>
                </div>

                {/* Instructor tools */}
                {role === 'instructor' && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => handleSetStatus('PENDING')}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Set Pending
                    </button>
                    <button
                      onClick={() => handleSetStatus('RESOLVED')}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Set Resolved
                    </button>

                    {!detail.locked ? (
                      <button
                        onClick={() => handleSetLock(true)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Lock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetLock(false)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Unlock
                      </button>
                    )}
                  </div>
                )}

                {error && (
                  <div className="text-xs text-red-500 whitespace-pre-line bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                {/* Discussion list */}
                <section className="space-y-3">
                  <div className="text-sm font-semibold text-slate-700">Discussion</div>

                  {loadingPosts ? (
                    <div className="text-sm text-slate-500">Loading comments...</div>
                  ) : posts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500 bg-white">
                      No comments yet.
                    </div>
                  ) : (
                    roots.rootList.map(p => (
                      <PostItem
                        key={p.id}
                        post={p}
                        childrenPosts={roots.byParent[p.id] || []}
                        role={role}
                        thread={detail}
                        onReply={pid => setParentId(pid ?? null)}
                        onAccept={handleAccept}
                        onUnaccept={handleUnaccept}
                        onEdit={handleEditPost}
                        onDelete={handleDeletePost}
                      />
                    ))
                  )}
                </section>

                {/* Reply composer */}
                {(role === 'instructor' || !detail.locked) && (
                  <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                    <div className="text-xs font-medium text-slate-600 mb-1">
                      {parentId
                        ? `Replying to comment `
                        : 'Your reply'}
                    </div>

                    <textarea
                      rows={3}
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder={
                        detail.locked
                          ? 'This thread is locked. You cannot reply.'
                          : 'Type your answer for this learner...'
                      }
                      disabled={detail.locked}
                      className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 disabled:bg-slate-100"
                    />

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{remainingChars} characters left</span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyContent('');
                            setParentId(null);
                          }}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Clear
                        </button>

                        <button
                          type="button"
                          onClick={handleSendReply}
                          disabled={!canReply}
                          className={classNames(
                            'rounded-md px-3 py-1.5 text-xs font-semibold',
                            canReply
                              ? 'bg-sky-600 text-white hover:bg-sky-700'
                              : 'cursor-not-allowed bg-slate-200 text-slate-500',
                          )}
                        >
                          Send reply
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {/* Right column: Meta */}
              <aside className="min-w-0 space-y-3">
                {/* Lesson box */}
                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Lesson</span>
                  </div>
                  <div className="p-3 text-sm">
                    <div className="text-slate-800 font-medium">
                      {detail.lessonTitle || detail.title || '(no title)'}
                    </div>
                    <div className="mt-1 text-slate-500">Course {detail.courseName}</div>
                  </div>
                </div>

                {/* Participants */}
                {detail.participants && detail.participants.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                      <span className="text-sm font-semibold text-slate-700">
                        {detail.participants.length} participants
                      </span>
                    </div>
                    <div className="p-3 text-sm space-y-1">
                      {detail.participants.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700">
                          <Avatar name={name} />
                          <span>{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/*
                  Sections from the newer UI that are not wired yet:
                  - Category
                  - Reactions (Like/Love/Haha...)
                  - Rich inline composer
                  - "See more replies" behavior

                  TODO when backend supports them:
                  - Add category/participant details fields to ThreadDetail
                  - Add reactions API & rich content support
                */}
              </aside>
            </div>
          </div>
        </div>

        {/* Client edit modal */}
        {role === 'client' && editingPostId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Edit your comment</h3>

              <textarea
                rows={4}
                value={editingContent}
                onChange={e => setEditingContent(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />

              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => {
                    setEditingPostId(null);
                    setEditingContent('');
                  }}
                  className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={submitEditPost}
                  className="rounded-md px-3 py-1.5 bg-sky-600 text-white hover:bg-sky-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] flex items-center justify-center text-sm text-slate-500">
            Loading thread...
          </div>
        )}
      </div>
    </aside>
  );
};

export default DetailPanel;
