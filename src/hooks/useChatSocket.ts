import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '@/core/services/socket-client';
import { RootState } from '@/core/store/store';
import {
  ChatMessage,
  markMessageSeen,
  messageReceived,
  setOnlineUsers,
} from '@/redux/slices/chat.slice';

export const useChatSocket = () => {
  const dispatch = useDispatch();
  const { selectedUser } = useSelector((s: RootState) => s.chat);
  const user = useSelector((s: RootState) => s.user.user);

  useEffect(() => {
    const socket = getSocket();
    console.log('[socket] useChatSocket -> getSocket():', socket);

    if (!socket) {
      console.log('[socket] no socket -> abort (cần initSocket ở Chat.tsx)');
      return;
    }
    if (!user) {
      console.log('[socket] no user -> skip bind');
      return;
    }

    console.log('[socket] hook mounted, connected =', socket.connected);

    const onConnect = () => {
      console.log('[socket] connected with id:', socket.id);
    };
    const onDisconnect = (reason: any) => {
      console.log('[socket] disconnected:', reason);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const onAny = (event: string, ...args: any[]) => {
      console.log('[socket] event:', event, 'payload:', args[0]);
    };
    socket.onAny(onAny);

    const handleNewMessageRaw = (raw: any) => {
      console.log('[socket] newMessage RAW:', raw);

      const firstAttachment = raw.attachments?.[0];

      const normalized: ChatMessage = {
        _id: String(raw._id ?? raw.id),
        senderId: String(
          raw.senderId ?? raw.userId ?? raw.authorId ?? raw.sender?.id ?? raw.user?.id ?? '',
        ),
        text: raw.text ?? raw.content ?? '',
        image: firstAttachment?.url ?? raw.image ?? undefined,
        createdAt: raw.createdAt ?? raw.sentAt ?? new Date().toISOString(),
        seen: raw.seen ?? raw.read ?? false,
        pinned: raw.pinned ?? false,
        messageType: raw.messageType ?? 'TEXT',
        conversationId: String(
          raw.conversationId ??
            raw.conversation_id ??
            raw.conversation?.id ??
            selectedUser?._id ??
            '',
        ),
      } as any;

      console.log('[socket] newMessage NORMALIZED:', normalized);

      const isCurrentConversation =
        !!selectedUser && String((normalized as any).conversationId) === String(selectedUser._id);

      if (isCurrentConversation) {
        dispatch(markMessageSeen(normalized._id) as any);
        dispatch(messageReceived({ ...normalized, seen: true }));
      } else {
        dispatch(messageReceived(normalized));
      }
    };

    socket.on('newMessage', handleNewMessageRaw);
    socket.on('messageCreated', handleNewMessageRaw);
    socket.on('message', handleNewMessageRaw);

    const handleOnlineUsers = (ids: string[]) => {
      console.log('[socket] onlineUsers:', ids);
      dispatch(setOnlineUsers(ids));
    };
    socket.on('onlineUsers', handleOnlineUsers);

    if (selectedUser?._id) {
      socket.emit('joinConversation', { conversationId: Number(selectedUser._id) });
    }

    return () => {
      console.log('[socket] cleanup listeners');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.offAny(onAny);
      socket.off('newMessage', handleNewMessageRaw);
      socket.off('messageCreated', handleNewMessageRaw);
      socket.off('message', handleNewMessageRaw);
      socket.off('onlineUsers', handleOnlineUsers);
    };
  }, [dispatch, selectedUser, user]);
};
