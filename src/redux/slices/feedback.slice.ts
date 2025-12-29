import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export enum FeedbackType {
  General = 'General',
  Bug = 'Bug',
  FeatureRequest = 'FeatureRequest',
  CourseContent = 'CourseContent',
}

export interface SubmitFeedbackPayload {
  title: string;
  content: string;
  feedbackType: FeedbackType;
  courseId: number;
}

export interface FeedbackItem {
  id: number;
  userId: number;
  courseId: number | null;
  title: string;
  content: string;
  feedbackType: FeedbackType | string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackPagination {
  page: number;
  limit?: number;
  total: number;
  totalPages: number;
}

interface FeedbackState {
  loading: boolean;
  error: string | null;
  items: FeedbackItem[];
  pagination: FeedbackPagination | null;
}

const initialState: FeedbackState = {
  loading: false,
  error: null,
  items: [],
  pagination: null,
};

const authHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Post feedback for a course
export const submitCourseFeedback = createAsyncThunk<
  void,
  SubmitFeedbackPayload,
  { rejectValue: string }
>('feedback/submitCourseFeedback', async (payload, { rejectWithValue }) => {
  try {
    await axios.post(
      'https://eduverseapi-production.up.railway.app/api/v1/feedback',
      {
        title: payload.title,
        content: payload.content,
        feedbackType: payload.feedbackType,
        courseId: payload.courseId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'NestjsSuper@Elearning$2025',
          ...authHeaders(),
        },
      },
    );
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || 'Failed to submit feedback';
    return rejectWithValue(message);
  }
});

// Get feedback list for admin with optional filters
export interface FetchAdminFeedbackParams {
  page?: number;
  take?: number;
  feedbackType?: FeedbackType | '';
  status?: string;
}

export const fetchAdminFeedbacks = createAsyncThunk<
  { items: FeedbackItem[]; pagination: FeedbackPagination | null },
  FetchAdminFeedbackParams | undefined,
  { rejectValue: string }
>('feedback/fetchAdminFeedbacks', async (params, { rejectWithValue }) => {
  const page = params?.page ?? 1;
  const take = params?.take ?? 10;
  const skip = (page - 1) * take;

  try {
    const res = await axios.get('https://eduverseapi-production.up.railway.app/api/v1/feedback', {
      params: {
        feedbackType: params?.feedbackType || 'General',
        status: params?.status || 'Pending',
        take,
        skip,
      },
      headers: {
        'X-API-KEY': 'NestjsSuper@Elearning$2025',
        ...authHeaders(),
      },
    });

    const root = res.data;
    const items: FeedbackItem[] = Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.data?.data)
        ? root.data.data
        : [];

    const pagination: FeedbackPagination | null = root?.pagination ||
      root?.data?.pagination || {
        page,
        limit: take,
        total: items.length,
        totalPages: 1,
      };

    return { items, pagination };
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || 'Failed to load feedbacks';
    return rejectWithValue(message);
  }
});

// Delete feedback by ID (admin only)
export const deleteFeedback = createAsyncThunk<number, number, { rejectValue: string }>(
  'feedback/deleteFeedback',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`https://eduverseapi-production.up.railway.app/api/v1/feedback/${id}`, {
        headers: {
          'X-API-KEY': 'NestjsSuper@Elearning$2025',
          ...authHeaders(),
        },
      });
      return id;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to delete feedback';
      return rejectWithValue(message);
    }
  },
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // submit
      .addCase(submitCourseFeedback.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitCourseFeedback.fulfilled, state => {
        state.loading = false;
      })
      .addCase(
        submitCourseFeedback.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || 'Failed to submit feedback';
        },
      )

      // list (admin)
      .addCase(fetchAdminFeedbacks.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAdminFeedbacks.fulfilled,
        (
          state,
          action: PayloadAction<{ items: FeedbackItem[]; pagination: FeedbackPagination | null }>,
        ) => {
          state.loading = false;
          state.items = action.payload.items;
          state.pagination = action.payload.pagination;
        },
      )
      .addCase(fetchAdminFeedbacks.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load feedbacks';
      })

      // delete (admin)
      .addCase(deleteFeedback.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFeedback.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.items = state.items.filter(f => f.id !== action.payload);
        if (state.pagination) {
          state.pagination.total = Math.max(0, state.pagination.total - 1);
        }
      })
      .addCase(deleteFeedback.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete feedback';
      });
  },
});

export default feedbackSlice.reducer;
