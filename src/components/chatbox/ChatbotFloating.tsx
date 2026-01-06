import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import {
  fetchChatbotConversations,
  fetchChatbotMessages,
  sendChatbotMessage,
  setActiveConversation,
  startChatbotConversation,
} from '@/redux/slices/chatbot.slice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

type Mode = 'list' | 'chat';

type PendingMsg = {
  tempId: number;
  senderId: number; // user
  content: string;
  createdAt: number;
  recommendedCourses: any[];
};

export default function ChatbotFloating() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { conversations, conversationId, messagesByConversation, loading, sending, error } =
    useSelector((s: RootState) => s.chatbot);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('list');
  const [input, setInput] = useState('');

  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // ===== Local optimistic messages (UI only) =====
  const pendingRef = useRef<PendingMsg[]>([]);
  const [, forceRerender] = useState(0);

  const msgs = useMemo(() => {
    if (!conversationId) return [];
    return messagesByConversation[String(conversationId)] ?? [];
  }, [conversationId, messagesByConversation]);

  const allMsgs = useMemo(() => {
    const fromStore = msgs.map((m: any) => ({
      ...m,
      __kind: 'store' as const,
      __sort:
        typeof m.sentAt === 'string' && m.sentAt ? new Date(m.sentAt).getTime() : Number(m.id ?? 0),
    }));

    const pending = pendingRef.current.map(p => ({
      id: p.tempId,
      senderId: p.senderId,
      content: p.content,
      recommendedCourses: p.recommendedCourses,
      __kind: 'pending' as const,
      __sort: p.createdAt, // keep in correct order when mixed
    }));

    // Sort by time/id so it won't look swapped
    return [...fromStore, ...pending].sort((a: any, b: any) => a.__sort - b.__sort);
  }, [msgs, forceRerender]);

  // ===== Load conversations when opening =====
  useEffect(() => {
    if (!open) return;
    dispatch(fetchChatbotConversations({ take: 30, cursor: null }));
    setMode('list');
  }, [open, dispatch]);

  // ===== Close when clicking outside =====
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const el = panelRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // ===== Auto scroll =====
  useEffect(() => {
    if (!open || mode !== 'chat') return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, mode, allMsgs.length]);

  // ===== Error toast =====
  useEffect(() => {
    if (error && open) toast.error(error);
  }, [error, open]);

  // ===== Helpers =====
  const clearPending = () => {
    pendingRef.current = [];
    forceRerender(x => x + 1);
  };

  const removePendingById = (tempId: number) => {
    pendingRef.current = pendingRef.current.filter(p => p.tempId !== tempId);
    forceRerender(x => x + 1);
  };

  // ===== Actions =====
  const openConversation = async (id: number) => {
    clearPending();
    dispatch(setActiveConversation(id));
    await dispatch(fetchChatbotMessages({ conversationId: id, take: 40 })).unwrap();
    setMode('chat');
  };

  const startNew = async () => {
    clearPending();
    const r = await dispatch(startChatbotConversation()).unwrap();
    dispatch(setActiveConversation(r.conversationId));
    setMode('chat');
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !conversationId) return;

    setInput('');

    // optimistic bubble (user)
    const tempId = Date.now();
    pendingRef.current.push({
      tempId,
      senderId: 1,
      content: text,
      createdAt: Date.now(),
      recommendedCourses: [],
    });
    forceRerender(x => x + 1);

    try {
      await dispatch(sendChatbotMessage({ conversationId, message: text })).unwrap();

      // ✅ KHÔNG xoá pending ở đây
      // Chờ bot reply render xong thì pending tự nằm đúng vị trí
    } catch {
      removePendingById(tempId); // lỗi thì mới xoá
    }
  };

  return createPortal(
    <>
      {open && (
        <>
          {/* BACKDROP */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />

          {/* PANEL */}
          <div
            ref={panelRef}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            className="
              fixed bottom-24 right-6 z-[9999]
              w-[360px] sm:w-[380px] lg:w-[420px]
              h-[70vh] max-h-[640px]
              rounded-2xl border border-slate-200 bg-white shadow-2xl
              overflow-hidden flex flex-col
            "
          >
            {/* HEADER */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                🤖
              </div>

              <div className="flex-1">
                <div className="font-extrabold text-slate-900">
                  {mode === 'list' ? 'Chat History' : 'Course Assistant'}
                </div>
                <div className="text-xs text-slate-500">{loading ? 'Loading...' : 'Online'}</div>
              </div>

              {/* ✅ NEW: plus button on LIST mode */}
              {mode === 'list' && (
                <button
                  type="button"
                  title="Start new conversation"
                  onClick={startNew}
                  className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center font-black"
                >
                  +
                </button>
              )}

              {mode === 'chat' && (
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200"
                >
                  History
                </button>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div ref={listRef} className="flex-1 overflow-auto p-4">
              {mode === 'list' ? (
                <div className="space-y-3">
                  <div className="text-sm text-slate-600">
                    Pick a conversation or start a new one.
                  </div>

                  {conversations.length === 0 && !loading ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                      No conversations yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map(c => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => openConversation(c.id)}
                          className="w-full text-left rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                        >
                          <div className="font-extrabold text-slate-900">Conversation #{c.id}</div>
                          <div className="text-sm text-slate-600 line-clamp-2">
                            {c.lastMessage?.content ?? 'No messages yet'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ❌ removed big start-new button here */}
                </div>
              ) : (
                <div className="space-y-3">
                  {allMsgs.map((m: any) => (
                    <MessageBubble
                      key={m.id}
                      isMe={m.senderId != null}
                      text={m.content}
                      recommendedCourses={m.recommendedCourses ?? []}
                      onOpenCourse={(id: number) => navigate(`/course/${id}`)}
                    />
                  ))}

                  {sending && (
                    <div className="text-xs text-slate-500 font-semibold">
                      Assistant is typing...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INPUT */}
            <div className="border-t border-slate-200 p-3">
              {mode === 'chat' ? (
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        send();
                      }
                    }}
                    className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold outline-none"
                    placeholder="Ask about free courses, ratings, skills..."
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || !input.trim()}
                    className="
                      w-12 h-12 rounded-full bg-emerald-500 text-white font-black
                      hover:bg-emerald-600 disabled:opacity-50
                    "
                  >
                    ➤
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500">Select a conversation to see details.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* FLOATING BUTTON */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="
          fixed bottom-6 right-20 z-[9999]
          w-14 h-14 rounded-full
          bg-emerald-500 text-white
          shadow-xl hover:bg-emerald-600
          flex items-center justify-center
          text-2xl
        "
        aria-label="Open chatbot"
      >
        {open ? '✕' : '💬'}
      </button>
    </>,
    document.body,
  );
}

function MessageBubble({
  isMe,
  text,
  recommendedCourses,
  onOpenCourse,
}: {
  isMe: boolean;
  text: string;
  recommendedCourses: any[];
  onOpenCourse: (id: number) => void;
}) {
  const bubbleClass = isMe ? 'bg-emerald-500 text-white ml-auto' : 'bg-slate-100 text-slate-900';

  return (
    <div className={`max-w-[85%] ${isMe ? 'ml-auto' : ''}`}>
      <div className={`rounded-2xl p-3 text-sm font-semibold ${bubbleClass}`}>{text}</div>

      {!isMe && recommendedCourses.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {recommendedCourses.map((c: any) => (
            <button
              type="button"
              key={c.id}
              onClick={() => onOpenCourse(Number(c.id))}
              className="min-w-[240px] rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50"
            >
              <div className="font-extrabold text-slate-900 line-clamp-2">{c.title}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
