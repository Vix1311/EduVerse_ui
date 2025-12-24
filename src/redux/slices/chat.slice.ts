import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '@/core/store/store';

// ====== Types ======

export interface ChatUser {
  _id: string;
  fullName: string;
  profilePic?: string;
  bio?: string;
}

export interface ChatMessage {
  _id: string;
  text?: string;
  image?: string;
  senderId: string;
  createdAt: string;
  seen?: boolean;
  pinned?: boolean;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE';
  conversationId?: string;
}

export interface ConversationMember {
  userId: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    fullname: string;
    email: string;
    avatar?: string | null;
  };
}

export interface UnseenMap {
  [conversationOrUserId: string]: number;
}

export interface SendChatMessagePayload {
  content?: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  replyToMessageId?: number | null;
  attachments?: { url: string }[];
}

export interface CreateConversationPayload {
  type: 'DIRECT' | 'GROUP';
  title: string;
  description?: string;
  participantIds: number[];
}

export interface UpdateConversationPayload {
  id: number | string;
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface InviteMemberPayload {
  conversationId: number | string;
  userId: number;
}

export type InviteMemberResult =
  | { kind: 'MEMBER'; member: ConversationMember }
  | { kind: 'REQUEST'; requestId?: number; message?: string };

export interface ApproveJoinRequestPayload {
  requestId: number;
  approve: boolean;
  conversationId?: number | string;
}

export interface KickMemberPayload {
  conversationId: number | string;
  targetUserId: number;
}

export interface FetchPinnedMessagesArgs {
  conversationId: string;
  skip?: number;
  take?: number;
}

export interface SocketMemberKickedPayload {
  conversationId: string;
  targetUserId: number;
}

export interface SocketCurrentUserKickedPayload {
  conversationId: string;
}

export interface FetchPendingMembersArgs {
  conversationId: number | string;
  skip?: number;
  take?: number;
}

interface ChatState {
  messages: ChatMessage[];
  pinnedMessages: ChatMessage[];
  users: ChatUser[];
  selectedUser: ChatUser | null;
  unseenMessages: UnseenMap;
  onlineUsers: string[];
  members: ConversationMember[];
  loading: boolean;
  error: string | null;

  pendingMembersByConversationId: Record<string, any[]>;
  pendingTotalByConversationId: Record<string, number>;
  pendingLoading: boolean;
  pendingError: string | null;
}

// ====== Initial state ======

const initialState: ChatState = {
  messages: [],
  pinnedMessages: [],
  users: [],
  selectedUser: null,
  unseenMessages: {},
  onlineUsers: [],
  members: [],
  loading: false,
  error: null,

  pendingMembersByConversationId: {},
  pendingTotalByConversationId: {},
  pendingLoading: false,
  pendingError: null,
};

// ====== Axios instance & helpers ======

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

const authHeaders = (_state: RootState) => {
  const token = localStorage.getItem('access_token');
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

// ====== Thunks ======

// List conversations for sidebar
export const fetchChatUsers = createAsyncThunk(
  'chat/fetchUsers',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;

      const res = await axiosInstance.get('/api/v1/conversations', {
        headers: {
          ...authHeaders(state),
        },
      });

      const raw = res.data?.data ?? res.data;
      const items: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);

      const users: ChatUser[] = items.map((conv: any) => ({
        _id: String(conv.id),
        fullName: conv.title || conv.name || conv.conversationName || `Conversation #${conv.id}`,
        profilePic: conv.avatar || conv.imageUrl || undefined,
        bio: conv.description || '',
      }));

      const unseenMessages: UnseenMap = {};

      return { users, unseenMessages };
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to load conversations';
      return rejectWithValue(msg);
    }
  },
);

// Messages of one conversation
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;

      const res = await axiosInstance.get(`/api/v1/conversations/${conversationId}/messages`, {
        headers: {
          ...authHeaders(state),
        },
      });

      const raw = res.data?.data ?? res.data;
      const items: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);

      const messages: ChatMessage[] = items.map((m: any) => {
        const firstAttachment = m.attachments?.[0];

        const sender =
          m.senderId ?? m.authorId ?? m.userId ?? m.sender?.id ?? m.author?.id ?? m.user?.id;

        return {
          _id: String(m.id),
          text: m.content ?? m.text ?? '',
          image: firstAttachment?.url,
          senderId: String(sender),
          createdAt: m.createdAt ?? m.sentAt ?? new Date().toISOString(),
          seen: m.seen ?? m.read ?? false,
          pinned: m.pinned ?? false,
          messageType: m.messageType ?? 'TEXT',
          conversationId: String(m.conversationId ?? conversationId),
        };
      });

      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return messages;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load messages';
      return rejectWithValue(msg);
    }
  },
);

// Members of one conversation
export const fetchConversationMembers = createAsyncThunk(
  'chat/fetchMembers',
  async (conversationId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;

      const res = await axiosInstance.get(`/api/v1/conversations/${conversationId}/members`, {
        headers: {
          ...authHeaders(state),
        },
      });

      const raw = res.data?.data ?? res.data;
      const items: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);

      return items as ConversationMember[];
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load members';
      return rejectWithValue(msg);
    }
  },
);

// pending members for moderator
export const fetchPendingMembers = createAsyncThunk(
  'chat/fetchPendingMembers',
  async (payload: FetchPendingMembersArgs, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const { conversationId, skip = 0, take = 20 } = payload;

      const res = await axiosInstance.get(
        `/api/v1/conversations/${conversationId}/pending-members`,
        {
          headers: { ...authHeaders(state) },
          params: { skip, take },
        },
      );

      const raw = res.data?.data ?? res.data ?? {};
      const items: any[] = raw?.items ?? (Array.isArray(raw) ? raw : []);
      const total: number = raw?.total ?? items.length;

      return { conversationId: String(conversationId), items, total };
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to load pending members';
      return rejectWithValue(msg);
    }
  },
);

// Fetch pinned messages for current conversation
export const fetchPinnedMessages = createAsyncThunk(
  'chat/fetchPinnedMessages',
  async (payload: FetchPinnedMessagesArgs, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const { conversationId, skip = 0, take = 50 } = payload;

      const res = await axiosInstance.get(
        `/api/v1/conversations/${conversationId}/messages/pinned`,
        {
          headers: { ...authHeaders(state) },
          params: { skip, take },
        },
      );

      const raw = res.data?.data ?? res.data;
      const items: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);

      const messages: ChatMessage[] = items.map((m: any) => {
        const firstAttachment = m.attachments?.[0];
        const sender =
          m.senderId ?? m.authorId ?? m.userId ?? m.sender?.id ?? m.author?.id ?? m.user?.id;

        return {
          _id: String(m.id),
          text: m.content ?? m.text ?? '',
          image: firstAttachment?.url,
          senderId: String(sender),
          createdAt: m.createdAt ?? m.sentAt ?? new Date().toISOString(),
          seen: m.seen ?? m.read ?? false,
          pinned: true,
          messageType: m.messageType ?? 'TEXT',
          conversationId: String(m.conversationId ?? conversationId),
        };
      });

      return messages;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to load pinned messages';
      return rejectWithValue(msg);
    }
  },
);

// send message to current selected conversation
export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: SendChatMessagePayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const selectedConversation = state.chat.selectedUser;

      if (!selectedConversation?._id) {
        return rejectWithValue('No conversation selected');
      }

      const fallbackContent = payload.content?.trim() || payload.attachments?.[0]?.url || ' ';

      const body: any = {
        messageType: payload.messageType,
        content: fallbackContent,
      };

      if (payload.replyToMessageId != null) body.replyToMessageId = payload.replyToMessageId;
      if (payload.attachments && payload.attachments.length > 0)
        body.attachments = payload.attachments;

      const res = await axiosInstance.post(
        `/api/v1/conversations/${selectedConversation._id}/messages`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(state),
          },
        },
      );

      const raw = res.data?.data ?? res.data;
      const firstAttachment = raw.attachments?.[0];

      const newMessage: ChatMessage = {
        _id: String(raw.id),
        text: raw.content ?? raw.text ?? body.content ?? '',
        image: firstAttachment?.url,
        senderId: String(raw.senderId ?? raw.authorId ?? ''),
        createdAt: raw.createdAt ?? raw.sentAt ?? new Date().toISOString(),
        seen: raw.seen ?? raw.read ?? true,
        pinned: raw.pinned ?? false,
        messageType: raw.messageType ?? payload.messageType,
        conversationId: String(raw.conversationId ?? selectedConversation._id),
      };

      return newMessage;
    } catch (error: any) {
      console.error('sendChatMessage error:', error?.response?.data || error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to send message';
      return rejectWithValue(msg);
    }
  },
);

export const markMessageSeen = createAsyncThunk(
  'chat/markMessageSeen',
  async (messageId: string) => {
    return messageId;
  },
);

// upload image for conversation
export const uploadConversationImage = createAsyncThunk(
  'chat/uploadImage',
  async (file: File, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const formData = new FormData();
      formData.append('file', file);

      const res = await axiosInstance.post('/api/v1/conversations/upload/image', formData, {
        headers: { ...authHeaders(state) },
      });

      const data = res.data;
      const url = data?.data?.secure_url || data?.secure_url || data?.url || data?.data?.url;

      if (!url) throw new Error('No URL returned from upload image');
      return url as string;
    } catch (error: any) {
      console.error('uploadConversationImage error:', error?.response?.data || error);
      const msg = error?.response?.data?.message || error?.message || 'Upload image failed';
      return rejectWithValue(msg);
    }
  },
);

// upload pdf for conversation
export const uploadConversationPdf = createAsyncThunk(
  'chat/uploadPdf',
  async (file: File, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const formData = new FormData();
      formData.append('file', file);

      const res = await axiosInstance.post('/api/v1/conversations/upload/pdf', formData, {
        headers: { ...authHeaders(state) },
      });

      const data = res.data;
      const url = data?.data?.secure_url || data?.secure_url || data?.url || data?.data?.url;

      if (!url) throw new Error('No URL returned from upload pdf');
      return url as string;
    } catch (error: any) {
      console.error('uploadConversationPdf error:', error?.response?.data || error);
      const msg = error?.response?.data?.message || error?.message || 'Upload pdf failed';
      return rejectWithValue(msg);
    }
  },
);

export const leaveConversation = createAsyncThunk(
  'chat/leaveConversation',
  async (conversationId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      await axiosInstance.post(
        `/api/v1/conversations/${conversationId}/leave`,
        {},
        { headers: { ...authHeaders(state) } },
      );
      return conversationId;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to leave conversation';
      return rejectWithValue(msg);
    }
  },
);

export const pinMessage = createAsyncThunk(
  'chat/pinMessage',
  async (messageId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      await axiosInstance.post(
        `/api/v1/conversations/messages/${messageId}/pin`,
        {},
        { headers: { ...authHeaders(state) } },
      );
      return messageId;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to pin message';
      return rejectWithValue(msg);
    }
  },
);

// create new conversation
export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (payload: CreateConversationPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;

      const res = await axiosInstance.post('/api/v1/conversations', payload, {
        headers: { 'Content-Type': 'application/json', ...authHeaders(state) },
      });

      const conv = res.data?.data ?? res.data;

      const user: ChatUser = {
        _id: String(conv.id),
        fullName: conv.title || conv.name || conv.conversationName || `Conversation #${conv.id}`,
        profilePic: conv.avatar || conv.imageUrl || undefined,
        bio: conv.description || '',
      };

      return user;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to create conversation';
      return rejectWithValue(msg);
    }
  },
);

// update conversation details
export const updateConversation = createAsyncThunk(
  'chat/updateConversation',
  async (payload: UpdateConversationPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const { id, ...body } = payload;

      const res = await axiosInstance.patch(`/api/v1/conversations/${id}`, body, {
        headers: { 'Content-Type': 'application/json', ...authHeaders(state) },
      });

      const conv = res.data?.data ?? res.data;

      const updatedUser: ChatUser = {
        _id: String(conv.id ?? id),
        fullName:
          conv.title || conv.name || conv.conversationName || `Conversation #${conv.id ?? id}`,
        profilePic: conv.avatar || conv.imageUrl || undefined,
        bio: conv.description || '',
      };

      return updatedUser;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to update conversation';
      return rejectWithValue(msg);
    }
  },
);

// unpin message
export const unpinMessage = createAsyncThunk(
  'chat/unpinMessage',
  async (messageId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      await axiosInstance.delete(`/api/v1/conversations/messages/${messageId}/pin`, {
        headers: { ...authHeaders(state) },
      });
      return messageId;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to unpin message';
      return rejectWithValue(msg);
    }
  },
);

// invite member to conversation
export const inviteConversationMember = createAsyncThunk<InviteMemberResult, InviteMemberPayload>(
  'chat/inviteMember',
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;

      const res = await axiosInstance.post(
        `/api/v1/conversations/${payload.conversationId}/members/invite`,
        { userId: payload.userId },
        {
          headers: { 'Content-Type': 'application/json', ...authHeaders(state) },
        },
      );

      const raw = res.data?.data ?? res.data;

      if (raw && raw.user && raw.userId != null) {
        const member: ConversationMember = {
          userId: raw.userId,
          role: raw.role ?? 'MEMBER',
          joinedAt: raw.joinedAt ?? new Date().toISOString(),
          user: {
            id: raw.user.id,
            fullname: raw.user.fullname,
            email: raw.user.email,
            avatar: raw.user.avatar ?? null,
          },
        };
        return { kind: 'MEMBER', member };
      }

      const requestId = raw?.joinRequest?.id ?? raw?.requestId;
      return { kind: 'REQUEST', requestId, message: raw?.message };
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to invite member';
      return rejectWithValue(msg);
    }
  },
);

// approve or reject join request (MODERATOR)
export const approveJoinRequest = createAsyncThunk(
  'chat/approveJoinRequest',
  async (payload: ApproveJoinRequestPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;

      await axiosInstance.post(
        `/api/v1/conversations/requests/${payload.requestId}/approve`,
        { approve: payload.approve },
        {
          headers: { 'Content-Type': 'application/json', ...authHeaders(state) },
        },
      );

      return payload;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to approve request';
      return rejectWithValue(msg);
    }
  },
);

// kick member from conversation
export const kickConversationMember = createAsyncThunk(
  'chat/kickMember',
  async (payload: KickMemberPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      await axiosInstance.delete(
        `/api/v1/conversations/${payload.conversationId}/members/${payload.targetUserId}`,
        { headers: { ...authHeaders(state) } },
      );
      return payload;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to kick member';
      return rejectWithValue(msg);
    }
  },
);

// ====== Slice ======

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedUser(state, action: PayloadAction<ChatUser | null>) {
      state.selectedUser = action.payload;
      state.messages = [];
      state.members = [];
      state.pinnedMessages = [];
    },
    resetUnseenForUser(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.unseenMessages[id] != null) state.unseenMessages[id] = 0;
    },
    messageReceived(state, action: PayloadAction<ChatMessage>) {
      const newMessage = action.payload;

      const sameConversation =
        !!state.selectedUser && newMessage.conversationId === state.selectedUser._id;

      if (sameConversation) {
        const exists = state.messages.some(m => m._id === newMessage._id);
        if (exists) return;
        state.messages.push({ ...newMessage, seen: true });
      } else {
        const key = newMessage.conversationId || newMessage.senderId;
        const prev = state.unseenMessages[key] || 0;
        state.unseenMessages[key] = prev + 1;
      }

      if (newMessage.pinned) {
        const already = state.pinnedMessages.some(m => m._id === newMessage._id);
        if (!already) state.pinnedMessages.unshift(newMessage);
      }
    },
    setOnlineUsers(state, action: PayloadAction<string[]>) {
      state.onlineUsers = action.payload;
    },
    clearChatState(state) {
      state.messages = [];
      state.pinnedMessages = [];
      state.users = [];
      state.selectedUser = null;
      state.unseenMessages = {};
      state.members = [];
      state.loading = false;
      state.error = null;

      state.pendingMembersByConversationId = {};
      state.pendingTotalByConversationId = {};
      state.pendingLoading = false;
      state.pendingError = null;
    },

    // ===== Socket-only reducers =====
    socketMemberKicked(state, action: PayloadAction<SocketMemberKickedPayload>) {
      const { conversationId, targetUserId } = action.payload;
      if (state.selectedUser && state.selectedUser._id === String(conversationId)) {
        state.members = state.members.filter(m => m.userId !== targetUserId);
      }
    },

    socketCurrentUserKicked(state, action: PayloadAction<SocketCurrentUserKickedPayload>) {
      const { conversationId } = action.payload;
      const idStr = String(conversationId);

      state.users = state.users.filter(u => u._id !== idStr);

      if (state.selectedUser && state.selectedUser._id === idStr) {
        state.selectedUser = null;
        state.messages = [];
        state.members = [];
        state.pinnedMessages = [];
      }
    },

    socketConversationAdded(state, action: PayloadAction<ChatUser>) {
      const conv = action.payload;
      const exists = state.users.some(u => u._id === conv._id);
      if (!exists) state.users.unshift(conv);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchChatUsers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.unseenMessages = action.payload.unseenMessages;
      })
      .addCase(fetchChatUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchMessages.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
        state.pinnedMessages = action.payload.filter(m => m.pinned);
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchConversationMembers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversationMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchConversationMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchPendingMembers.pending, state => {
        state.pendingLoading = true;
        state.pendingError = null;
      })
      .addCase(fetchPendingMembers.fulfilled, (state, action) => {
        state.pendingLoading = false;
        const { conversationId, items, total } = action.payload as any;
        state.pendingMembersByConversationId[String(conversationId)] = items || [];
        state.pendingTotalByConversationId[String(conversationId)] = total ?? items?.length ?? 0;
      })
      .addCase(fetchPendingMembers.rejected, (state, action) => {
        state.pendingLoading = false;
        state.pendingError = action.payload as string;
      })

      .addCase(fetchPinnedMessages.fulfilled, (state, action) => {
        state.pinnedMessages = action.payload;
      })
      .addCase(fetchPinnedMessages.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        const exists = state.messages.some(m => m._id === msg._id);
        if (!exists) state.messages.push(msg);
      })

      .addCase(markMessageSeen.fulfilled, (state, action) => {
        const id = action.payload;
        const msg = state.messages.find(m => m._id === id);
        if (msg) msg.seen = true;
      })

      .addCase(leaveConversation.fulfilled, (state, action) => {
        const id = action.payload;
        state.users = state.users.filter(u => u._id !== id);
        if (state.selectedUser?._id === id) {
          state.selectedUser = null;
          state.messages = [];
          state.members = [];
          state.pinnedMessages = [];
        }
      })

      .addCase(pinMessage.fulfilled, (state, action) => {
        const id = action.payload;
        const msg = state.messages.find(m => m._id === id);
        if (msg) {
          msg.pinned = true;
          const exists = state.pinnedMessages.some(m => m._id === id);
          if (!exists) state.pinnedMessages.unshift({ ...msg });
        }
      })

      .addCase(unpinMessage.fulfilled, (state, action) => {
        const id = action.payload;
        const msg = state.messages.find(m => m._id === id);
        if (msg) msg.pinned = false;
        state.pinnedMessages = state.pinnedMessages.filter(m => m._id !== id);
      })

      .addCase(createConversation.fulfilled, (state, action) => {
        const conv = action.payload;
        state.users.unshift(conv);
      })

      .addCase(updateConversation.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.users.findIndex(u => u._id === updated._id);
        if (idx !== -1) state.users[idx] = { ...state.users[idx], ...updated };
        if (state.selectedUser?._id === updated._id) {
          state.selectedUser = { ...state.selectedUser, ...updated };
        }
      })

      .addCase(inviteConversationMember.fulfilled, (state, action) => {
        const result = action.payload;
        if (result.kind === 'MEMBER') {
          const member = result.member;
          const exists = state.members.some(m => m.userId === member.userId);
          if (!exists) state.members.push(member);
        }
      })

      // approve/reject: remove pending item + refresh members
      .addCase(approveJoinRequest.fulfilled, (state, action) => {
        const payload = action.payload as ApproveJoinRequestPayload | undefined;
        if (!payload?.conversationId) return;

        const key = String(payload.conversationId);
        const cur = state.pendingMembersByConversationId[key] || [];

        state.pendingMembersByConversationId[key] = cur.filter((x: any) => {
          const rid = Number(x?.requestId ?? x?.id);
          return rid !== Number(payload.requestId);
        });
      })

      .addCase(kickConversationMember.fulfilled, (state, action) => {
        const payload = action.payload;
        if (!payload) return;
        state.members = state.members.filter(m => m.userId !== payload.targetUserId);
      });
  },
});

// ====== Exports ======

export const {
  setSelectedUser,
  resetUnseenForUser,
  messageReceived,
  clearChatState,
  setOnlineUsers,
  socketMemberKicked,
  socketCurrentUserKicked,
  socketConversationAdded,
} = chatSlice.actions;

export default chatSlice.reducer;
