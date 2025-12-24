import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import {
  FaComments,
  FaArrowLeft,
  FaImage,
  FaPaperPlane,
  FaPaperclip,
  FaTimes,
  FaThumbtack,
  FaCheckDouble,
  FaChevronDown,
  FaChevronUp,
  FaBars,
} from 'react-icons/fa';
import { FiMoreVertical } from 'react-icons/fi';

import { AppDispatch, RootState } from '@/core/store/store';
import {
  fetchMessages,
  fetchConversationMembers,
  fetchPinnedMessages,
  sendChatMessage,
  uploadConversationImage,
  uploadConversationPdf,
  pinMessage,
  unpinMessage,
  markMessageSeen,
} from '@/redux/slices/chat.slice';
import { useUserProfile } from '@/hooks/useUserProfile';
import defaultAvatar from '@/assets/icons/user.png';
import { useChatSocket } from '@/hooks/useChatSocket';
import { getSocket } from '@/core/services/socket-client';

interface ChatContainerProps {
  onBackMobile?: () => void;
  onToggleRightSidebar?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ onBackMobile, onToggleRightSidebar }) => {
  useChatSocket();
  const dispatch = useDispatch<AppDispatch>();

  const { selectedUser, messages, onlineUsers, members, pinnedMessages } = useSelector(
    (state: RootState) => state.chat,
  );

  const authUser = useSelector((state: RootState) => state.user.user);

  const currentUserId = useMemo(() => {
    if (!authUser || !members || members.length === 0) return null;
    const me = members.find(m => m.user?.email === authUser.email);
    if (!me) return null;
    const id = me.user?.id ?? me.userId;
    return id != null ? String(id) : null;
  }, [authUser, members]);

  const userProfile = useUserProfile();

  const avatarUrl = userProfile?.avatar
    ? userProfile.avatar.startsWith('http')
      ? userProfile.avatar
      : `http://localhost:8080/${userProfile.avatar}`
    : (defaultAvatar as string);

  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null); // textarea auto-grow
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({}); // ref each message

  const [input, setInput] = useState<string>('');

  // preview file
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Pin list open/closed status
  const [pinnedExpanded, setPinnedExpanded] = useState<boolean>(false);

  // ===== load messages + members + pinned each selectedUser =====
  useEffect(() => {
    if (selectedUser) {
      dispatch(fetchMessages(selectedUser._id));
      dispatch(fetchConversationMembers(selectedUser._id));
      dispatch(
        fetchPinnedMessages({
          conversationId: selectedUser._id,
          skip: 0,
          take: 20,
        }),
      );
    }
  }, [dispatch, selectedUser]);

  // ===== auto scroll =====
  useEffect(() => {
    if (scrollEndRef.current && messages) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ===== fancybox picture =====
  useEffect(() => {
    Fancybox.bind('[data-fancybox="chat-images"]', {});
    return () => {
      Fancybox.unbind('[data-fancybox="chat-images"]');
    };
  }, [messages]);

  const clearPendingFile = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(null);
    setPendingPreviewUrl(null);
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  };

  const autoGrowTextarea = () => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    const text = input.trim();
    const fileToSend = pendingFile;

    if (!text && !fileToSend) return;

    setInput('');
    resetTextareaHeight();

    const oldPreviewUrl = pendingPreviewUrl;
    setPendingFile(null);
    setPendingPreviewUrl(null);
    if (oldPreviewUrl) URL.revokeObjectURL(oldPreviewUrl);

    try {
      if (fileToSend) {
        let url: string;
        let messageType: 'IMAGE' | 'FILE' = 'FILE';

        if (fileToSend.type.startsWith('image/')) {
          url = await dispatch(uploadConversationImage(fileToSend)).unwrap();
          messageType = 'IMAGE';
        } else {
          url = await dispatch(uploadConversationPdf(fileToSend)).unwrap();
        }

        await dispatch(
          sendChatMessage({
            content: messageType === 'FILE' ? fileToSend.name : '',
            messageType,
            attachments: [{ url }],
          }),
        ).unwrap();
      }

      if (text) {
        await dispatch(
          sendChatMessage({
            content: text,
            messageType: 'TEXT',
            attachments: [],
          }),
        ).unwrap();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Send message failed');
      console.error(err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedUser) return;

    clearPendingFile();

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      toast.error('Only supports images and PDF files');
      return;
    }

    if (isImage) {
      const allowedImages = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!allowedImages.includes(file.type)) {
        toast.error('Image is not in the correct format (png, jpg, jpeg, webp, gif)');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setPendingFile(file);
      setPendingPreviewUrl(previewUrl);
    } else {
      setPendingFile(file);
      setPendingPreviewUrl(null);
    }
  };

  const isOnline = !!selectedUser && onlineUsers.includes(selectedUser._id);

  const isPdfUrl = (url?: string) => !!url && /\.pdf(\?|$)/i.test(url);

  const handleTogglePin = (id: string, pinned?: boolean) => {
    if (pinned) {
      dispatch(unpinMessage(id));
    } else {
      dispatch(pinMessage(id));
    }
    setOpenMenuId(null);
  };

  const handleMarkSeen = (id: string) => {
    dispatch(markMessageSeen(id));
    setOpenMenuId(null);
  };

  const handleScrollToPinned = (id: string) => {
    const el = messageRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-[#F48C06]', 'rounded-xl');
    setTimeout(() => {
      el.classList.remove('ring-2', 'ring-[#F48C06]', 'rounded-xl');
    }, 800);
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 bg-[#252641] text-gray-300 max-md:hidden">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/30">
          <FaComments className="text-3xl text-[#F48C06]" />
        </div>
        <p className="text-lg font-semibold text-white">Chat anytime, anywhere</p>
        <p className="text-xs text-gray-400">Select a conversation from the left to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-200 text-white">
      {/* ====== HEADER ====== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-600/40">
        <div className="flex items-center gap-3">
          {/* Nút back mobile */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#1E1D33]"
            onClick={() => onBackMobile && onBackMobile()}
          >
            <FaArrowLeft className="text-xs text-gray-200" />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={selectedUser.profilePic || (defaultAvatar as string)}
                alt="avatar"
                className="w-9 h-9 rounded-full object-cover border border-purple-600/70"
              />
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-[#252641] bg-green-500"></span>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-sm md:text-base font-semibold text-black">
                {selectedUser.fullName}
              </span>
              <span className="text-[11px] text-gray-400">
                {isOnline ? 'Online' : 'Offline'} · Chat support
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <img
            src={avatarUrl}
            alt="me"
            className="hidden md:block w-9 h-9 rounded-full object-cover border border-purple-600/60"
          />
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full   "
            onClick={() => onToggleRightSidebar && onToggleRightSidebar()}
          >
            <FaBars className="text-sm text-black" />
          </button>
        </div>
      </div>

      {/* ====== PINNED BAR ====== */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-slate-100 border-b border-purple-600/30">
          <button
            type="button"
            onClick={() => setPinnedExpanded(prev => !prev)}
            className="w-full flex items-center justify-between text-xs text-gray-800"
          >
            <div className="flex items-center gap-2">
              <FaThumbtack className="text-[12px] text-yellow-500" />
              <span className="font-medium">Pinned message</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-[2px] rounded-full bg-purple-100 text-[11px] text-purple-700 font-semibold">
                {pinnedMessages.length} pinned
              </span>
              {pinnedExpanded ? (
                <FaChevronUp className="text-[10px] text-gray-500" />
              ) : (
                <FaChevronDown className="text-[10px] text-gray-500" />
              )}
            </div>
          </button>

          {pinnedExpanded && (
            <div className="mt-2 bg-[#1E1D33] rounded-2xl p-2 max-h-48 overflow-y-auto space-y-1">
              {pinnedMessages.map(msg => {
                const messageId = String(msg._id || (msg as any).id);
                const isImageMsg = msg.messageType === 'IMAGE';
                const isFileMsg = msg.messageType === 'FILE';
                const baseText = (msg as any).content || (msg as any).text || '';

                const previewText = isImageMsg
                  ? '[Pinned Image]'
                  : isFileMsg
                    ? baseText || '[Pinned File]'
                    : baseText || 'Message';

                const createdAtText = new Date(msg.createdAt).toLocaleString();

                return (
                  <button
                    key={messageId}
                    type="button"
                    onClick={() => handleScrollToPinned(messageId)}
                    className="w-full flex items-start gap-2 px-2 py-1 rounded-xl hover:bg-[#3B3A5C] text-left"
                  >
                    <FaThumbtack className="mt-[2px] text-[11px] text-yellow-300 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-white break-words line-clamp-2">{previewText}</p>
                      <span className="text-[10px] text-gray-400">{createdAtText}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====== MESSAGES ====== */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(msg => {
          const messageId = String(msg._id || (msg as any).id);
          const isMine = !!currentUserId && String(msg.senderId) === currentUserId;
          const bubbleColor = isMine ? 'bg-[#F48C06]' : 'bg-purple-600/70';
          const cornerClass = isMine
            ? 'rounded-bl-3xl rounded-t-3xl'
            : 'rounded-br-3xl rounded-t-3xl';

          const url = msg.image;
          const isImageMsg = msg.messageType === 'IMAGE';
          const isFileMsg = msg.messageType === 'FILE';
          const isTextMsg = !isImageMsg && !isFileMsg;

          const showPdf = isFileMsg && isPdfUrl(url);
          const showImg = isImageMsg && url && !showPdf;

          const senderMember = members.find(
            m => String(m.user?.id ?? m.userId) === String(msg.senderId),
          );
          const otherAvatar =
            senderMember?.user?.avatar || selectedUser.profilePic || (defaultAvatar as string);

          const avatarSrc = isMine ? avatarUrl : otherAvatar;
          const createdAtText = new Date(msg.createdAt).toLocaleString();

          return (
            <div
              key={messageId}
              ref={el => {
                messageRefs.current[messageId] = el;
              }}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`relative flex items-end gap-2 max-w-[75%] ${
                  isMine ? 'flex-row-reverse' : 'flex-row'
                } group`}
              >
                {/* AVATAR */}
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover border border-purple-600/50 flex-shrink-0"
                />

                {/* BUBBLE + time */}
                <div className="flex flex-col gap-1">
                  <div
                    className={`px-3 py-2 text-sm w-fit max-w-full ${
                      isMine ? 'self-end' : 'self-start'
                    } ${bubbleColor} ${cornerClass}`}
                  >
                    {showImg && (
                      <a
                        href={url}
                        data-fancybox="chat-images"
                        className="block rounded-lg overflow-hidden"
                      >
                        <img
                          src={url}
                          alt="attachment"
                          className="w-full h-auto max-h-[500px] object-contain rounded-lg bg-black/10"
                        />
                      </a>
                    )}

                    {showPdf && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-black/20 rounded-md px-2 py-1"
                      >
                        <FaPaperclip className="text-xs text-[#F48C06]" />
                        <span className="text-xs break-all">
                          {(msg as any).content || (msg as any).text || 'Document'}
                        </span>
                      </a>
                    )}

                    {isTextMsg && ((msg as any).content || (msg as any).text) && (
                      <p
                        className="text-sm leading-snug"
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {String((msg as any).content || (msg as any).text)
                          .replace(/\r\n/g, '\n')
                          .replace(/\n{3,}/g, '\n\n')
                          .trimEnd()}
                      </p>
                    )}
                  </div>

                  <div
                    className={`flex items-center gap-2 text-[10px] text-gray-600 ${
                      isMine ? 'justify-end pr-1' : 'justify-start pl-1'
                    }`}
                  >
                    <span>{createdAtText}</span>
                    {msg.seen && isMine && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-600">
                        <FaCheckDouble className="text-[10px]" />
                        Đã xem
                      </span>
                    )}
                  </div>
                </div>

                {/* Button ... + menu */}
                <div
                  className={`absolute top-1 ${
                    isMine ? '-left-7' : '-right-7'
                  } opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(prev => (prev === messageId ? null : messageId))}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-[#1E1D33] hover:bg-[#3B3A5C]"
                    >
                      <FiMoreVertical className="text-[12px]" />
                    </button>

                    {openMenuId === messageId && (
                      <div
                        className={`absolute mt-1 min-w-[150px] rounded-md bg-[#1E1D33] text-xs shadow-lg z-10 ${
                          isMine ? 'left-0' : 'right-0'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleTogglePin(messageId, msg.pinned)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#3B3A5C]"
                        >
                          <FaThumbtack
                            className={`text-[11px] ${msg.pinned ? 'text-yellow-300' : ''}`}
                          />
                          <span>{msg.pinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkSeen(messageId)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#3B3A5C]"
                        >
                          <FaCheckDouble className="text-[11px]" />
                          <span>Đánh dấu đã xem</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={scrollEndRef} />
      </div>

      {/* ====== FILE PREVIEW ====== */}
      {pendingFile && (
        <div className="px-4 pb-2 flex items-center justify-between gap-3 bg-slate-200">
          <div className="flex items-center gap-3">
            {pendingFile.type.startsWith('image/') && pendingPreviewUrl ? (
              <img
                src={pendingPreviewUrl}
                alt="preview"
                className="max-h-40 max-w-[200px] rounded-lg object-contain border border-purple-600/40 bg-black/5"
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E1D33] border border-purple-600/40">
                <FaPaperclip className="text-xs text-[#F48C06]" />
                <span className="text-xs text-white break-all">{pendingFile.name}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={clearPendingFile}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1E1D33] hover:bg-red-500/70 transition"
          >
            <FaTimes className="text-[10px] text-white" />
          </button>
        </div>
      )}

      {/* ====== INPUT BAR ====== */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-purple-600/40 px-3 py-2 flex items-center gap-3 bg-slate-200"
      >
        <div className="flex-1 flex items-center bg-[#1E1D33] border border-purple-600/40 rounded-full px-3 py-1">
          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            onChange={e => {
              setInput(e.target.value);
              autoGrowTextarea();
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 max-h-32 min-h-[40px] p-2 text-sm text-white bg-transparent outline-none placeholder-gray-400 resize-none overflow-y-auto"
            placeholder="Type your message..."
          />

          {/* Image picker */}
          <label htmlFor="image" className="cursor-pointer mr-2 mb-1 flex-shrink-0">
            <FaImage className="w-5 text-[#F48C06]" />
          </label>
          <input
            id="image"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            hidden
            onChange={handleFileChange}
          />

          {/* Pdf picker */}
          <label htmlFor="file" className="cursor-pointer mr-1 mb-1 flex-shrink-0">
            <FaPaperclip className="w-5 text-[#F48C06]" />
          </label>
          <input
            id="file"
            type="file"
            accept="application/pdf"
            hidden
            onChange={handleFileChange}
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F48C06] hover:bg-orange-500 transition-colors shadow-md"
        >
          <FaPaperPlane className="text-white text-sm" />
        </button>
      </form>
    </div>
  );
};

export default ChatContainer;
