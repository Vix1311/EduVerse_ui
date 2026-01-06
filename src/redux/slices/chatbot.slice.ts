import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
const API_BASE = 'http://localhost:8080/api/v1';

const authHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type RecommendedCourse = {
  id: number;
  title: string;
  thumbnail?: string | null;
  isFree: boolean;
  price: number;
  rating: number;
  category?: string | null;
  teacher?: string | null;
  isFeatured?: boolean;
};

export type ChatMessage = {
  id: number;
  senderId: number | null; // null = bot
  content: string;
  sentAt?: string;
  recommendedCourses?: RecommendedCourse[];
};

export type ConversationItem = {
  id: number;
  title?: string;
  updatedAt?: string;
  lastMessage?: ChatMessage | null;
};

type ListConversationsRes = { items: ConversationItem[]; nextCursor?: number | null };
type ListMessagesRes = { items: ChatMessage[]; nextBefore?: string | null };

interface ChatbotState {
  conversations: ConversationItem[];
  nextCursor: number | null;

  conversationId: number | null;

  messagesByConversation: Record<string, ChatMessage[]>;

  sending: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: ChatbotState = {
  conversations: [],
  nextCursor: null,
  conversationId: null,
  messagesByConversation: {},
  sending: false,
  loading: false,
  error: null,
};

// GET /chatbot/conversations?take=30&cursor=...
export const fetchChatbotConversations = createAsyncThunk(
  'chatbot/fetchConversations',
  async ({ take = 30, cursor }: { take?: number; cursor?: number | null }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE}/chatbot/conversations`, {
        headers: authHeaders(),
        params: { take, ...(cursor != null ? { cursor } : {}) },
      });

      const raw = res.data?.data ?? res.data ?? {};
      const items = (raw.items ?? raw.results ?? []) as ConversationItem[];
      const nextCursor = raw.nextCursor ?? null;

      return { items, nextCursor } as ListConversationsRes;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to load conversations';
      return rejectWithValue(msg);
    }
  },
);

// POST /chatbot/start
export const startChatbotConversation = createAsyncThunk(
  'chatbot/start',
  async (_: void, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE}/chatbot/start`,
        {},
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } },
      );

      const data = res.data?.data ?? res.data ?? {};
      // flutter: { conversationId, welcomeMessage }
      return {
        conversationId: Number(data.conversationId),
        welcomeMessage: data.welcomeMessage as ChatMessage | null,
      };
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to start chatbot';
      return rejectWithValue(msg);
    }
  },
);

// GET /chatbot/{conversationId}/messages?take=40&before=...
export const fetchChatbotMessages = createAsyncThunk(
  'chatbot/fetchMessages',
  async (
    {
      conversationId,
      take = 40,
      before,
    }: { conversationId: number; take?: number; before?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.get(`${API_BASE}/chatbot/${conversationId}/messages`, {
        headers: authHeaders(),
        params: { take, ...(before ? { before } : {}) },
      });

      const raw = res.data?.data ?? res.data ?? {};
      const items = (raw.items ?? raw.messages ?? raw.results ?? []) as ChatMessage[];
      const nextBefore = raw.nextBefore ?? null;

      return { conversationId, items, nextBefore } as ListMessagesRes & { conversationId: number };
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load messages';
      return rejectWithValue(msg);
    }
  },
);

// POST /chatbot/{conversationId}/chat  body { message }
export const sendChatbotMessage = createAsyncThunk(
  'chatbot/sendMessage',
  async (
    { conversationId, message }: { conversationId: number; message: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.post(
        `${API_BASE}/chatbot/${conversationId}/chat`,
        { message },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } },
      );

      const raw = res.data?.data ?? res.data ?? {};
      return {
        conversationId,
        reply: String(raw.reply ?? ''),
        recommendedCourses: (raw.recommendedCourses ?? []) as RecommendedCourse[],
        messages: (raw.messages ?? []) as ChatMessage[],
      };
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to send message';
      return rejectWithValue(msg);
    }
  },
);

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    setActiveConversation(state, action) {
      state.conversationId = action.payload as number | null;
    },
    clearActiveConversation(state) {
      state.conversationId = null;
    },
    clearMessages(state, action) {
      const id = String(action.payload);
      state.messagesByConversation[id] = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchChatbotConversations.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatbotConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload.items;
        state.nextCursor = action.payload.nextCursor ?? null;
      })
      .addCase(fetchChatbotConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(startChatbotConversation.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startChatbotConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversationId = action.payload.conversationId;

        const convKey = String(action.payload.conversationId);
        state.messagesByConversation[convKey] = [];

        const welcome = action.payload.welcomeMessage?.content;
        if (welcome) {
          state.messagesByConversation[convKey].push({
            id: Date.now(),
            senderId: null,
            content: welcome,
            recommendedCourses: action.payload.welcomeMessage?.recommendedCourses ?? [],
          });
        } else {
          state.messagesByConversation[convKey].push({
            id: Date.now(),
            senderId: null,
            content: 'Hi 👋 How can I help you find a course?',
            recommendedCourses: [],
          });
        }
      })
      .addCase(startChatbotConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchChatbotMessages.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatbotMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.conversationId = action.payload.conversationId;
        state.messagesByConversation[String(action.payload.conversationId)] =
          action.payload.items ?? [];
      })
      .addCase(fetchChatbotMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(sendChatbotMessage.pending, state => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendChatbotMessage.fulfilled, (state, action) => {
        state.sending = false;
        const convKey = String(action.payload.conversationId);

        if (action.payload.reply) {
          state.messagesByConversation[convKey] = [
            ...(state.messagesByConversation[convKey] ?? []),
            {
              id: Date.now() + 1,
              senderId: null,
              content: action.payload.reply,
              recommendedCourses: action.payload.recommendedCourses ?? [],
            },
          ];
        } else if ((action.payload.recommendedCourses ?? []).length) {
          state.messagesByConversation[convKey] = [
            ...(state.messagesByConversation[convKey] ?? []),
            {
              id: Date.now() + 1,
              senderId: null,
              content: 'Here are some courses you might like:',
              recommendedCourses: action.payload.recommendedCourses ?? [],
            },
          ];
        }
      })
      .addCase(sendChatbotMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload as string;
      });
  },
});

export const { setActiveConversation, clearActiveConversation, clearMessages } =
  chatbotSlice.actions;

export default chatbotSlice.reducer;
