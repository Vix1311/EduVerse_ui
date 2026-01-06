import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FaCommentDots, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppDispatch } from '@/core/store/store';
import { useDispatch } from 'react-redux';

import { submitCourseFeedback, FeedbackType } from '@/redux/slices/feedback.slice';

type ChatMsg = {
  from: 'user' | 'admin';
  text: string;
  type?: FeedbackType;
  title?: string;
};

const FeedbackWidget = () => {
  const [open, setOpen] = useState(false);

  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);

  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.General);

  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: 'admin', text: 'Hello! Do you need any help? 😊' },
  ]);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const hiddenPaths = useMemo(
    () => [
      '/auth',
      '/login',
      '/register',
      '/admin/dashboard',
      '/admin/users',
      '/admin/courses',
      '/admin/courses/new',
      '/admin/categories',
      '/admin/feedback',
      '/QnA',
      '/add-course',
      '/instructor-dashboard',
      '/messages',
    ],
    [],
  );

  const isHiddenByRegex = /^\/course-player\/[^/]+/.test(currentPath);

  if (hiddenPaths.some(path => currentPath.startsWith(path)) || isHiddenByRegex) {
    return null;
  }

  const getCourseIdFromPath = (): number | null => {
    const m = currentPath.match(/\/courses\/(\d+)/) || currentPath.match(/\/course\/(\d+)/);
    if (!m) return null;
    const id = Number(m[1]);
    return Number.isFinite(id) ? id : null;
  };

  // ✅ title lấy từ content để gửi BE
  const makeTitleFromContent = (type: FeedbackType, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return `${type} feedback`;
    const words = trimmed.split(/\s+/).slice(0, 6).join(' ');
    return `${words}${trimmed.split(/\s+/).length > 6 ? '...' : ''}`;
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error('Please enter your feedback before submitting.');
      return;
    }

    const finalTitle = makeTitleFromContent(feedbackType, trimmed);

    // ✅ optimistic show message
    setMessages(prev => [
      ...prev,
      { from: 'user', text: trimmed, type: feedbackType, title: finalTitle },
    ]);

    // ✅ reset input
    setContent('');
    setWordCount(0);

    const payload = {
      title: finalTitle,
      content: trimmed,
      feedbackType,
      courseId: getCourseIdFromPath(),
    };

    try {
      await dispatch(submitCourseFeedback(payload)).unwrap();
      toast.success('Thank you for your feedback!');

      setMessages(prev => [
        ...prev,
        { from: 'admin', text: 'Thanks! Admin received your feedback' },
      ]);
    } catch (err: any) {
      toast.error('Needed login to send feedback.');

      setTimeout(() => {
        navigate('/auth');
      }, 1000);
    }
  };

  const typeCards: { key: FeedbackType; label: string }[] = [
    { key: FeedbackType.Bug, label: 'Bug' },
    { key: FeedbackType.FeatureRequest, label: 'Feature' },
    { key: FeedbackType.General, label: 'General' },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-6 right-6 bg-[#F48C06] hover:bg-[#e37b00] transition duration-300 text-white p-3 rounded-full shadow-lg z-50"
        title="Chat with admin"
      >
        <FaCommentDots className="text-2xl" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 w-80 min-h-[450px] bg-white rounded shadow-xl border flex flex-col z-50">
          {/* Header */}
          <div className="bg-[#F48C06] text-white px-4 py-2 rounded-t flex justify-between items-center">
            <span className="font-semibold">Send feedback to admin</span>
            <button
              title="close"
              onClick={() => setOpen(false)}
              className="text-white text-sm hover:underline"
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 text-sm bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[75%] ${
                    msg.from === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="border-t p-3 bg-white">
            {/* ✅ feedbackType cards nằm phía trên input */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {typeCards.map(t => {
                const active = t.key === feedbackType;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFeedbackType(t.key)}
                    className={[
                      'border rounded-lg py-2 text-xs font-medium transition',
                      active
                        ? 'border-[#F48C06] bg-orange-50 ring-2 ring-[#F48C06]/30'
                        : 'hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={2}
              value={content}
              onChange={e => {
                const next = e.target.value;
                const words = next.trim() ? next.trim().split(/\s+/) : [];
                if (words.length <= 255) {
                  setContent(next);
                  setWordCount(words.length);
                }
              }}
              placeholder="Enter a feedback..."
              className="w-full border rounded px-2 py-1 text-sm"
            />

            <div className="flex justify-between mt-1 items-center text-xs text-gray-500">
              <span>{wordCount}/255 words</span>
              <button
                title="send"
                onClick={handleSubmit}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F48C06] hover:bg-[#e37b00] hover:scale-110 text-white transition duration-300"
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
