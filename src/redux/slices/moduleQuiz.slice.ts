import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { Quiz } from '@/models/interface/quiz.interface';
import { showLoading, hideLoading } from './ui.slice';

const authHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface ModuleQuizState {
  quizzesByModule: Record<string, Quiz[]>;

  quizAttemptById: Record<string, any>;

  submitResultByQuizId: Record<string, any>;

  loading: boolean;
  error: string | null;
}

const initialState: ModuleQuizState = {
  quizzesByModule: {},
  quizAttemptById: {},
  submitResultByQuizId: {},
  loading: false,
  error: null,
};

export const fetchModuleQuizzesForStudy = createAsyncThunk(
  'moduleQuiz/fetchModuleQuizzesForStudy',
  async (
    {
      courseId,
      moduleId,
      skip = 0,
      take = 100,
    }: { courseId: string | number; moduleId: string | number; skip?: number; take?: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());

      const res = await axios.get(
        `http://localhost:8080/api/v1/course/${courseId}/modules/${moduleId}/quizzes`,
        {
          headers: authHeaders(),
          params: { skip, take },
        },
      );
      const raw = res.data?.data ?? res.data ?? {};
      let items: any[] = raw.items ?? raw.results ?? raw ?? [];

      if (!Array.isArray(items)) {
        const it: any = items as any;
        items = it?.items ?? it?.results ?? [];
      }

      const quizzes: Quiz[] = items;

      return { moduleId: String(moduleId), quizzes };
    } catch (error: any) {
      console.error('fetchModuleQuizzesForStudy error:', error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch module quizzes for study';
      return rejectWithValue(msg);
    } finally {
      dispatch(hideLoading());
    }
  },
);

export const fetchModuleQuizAttempt = createAsyncThunk(
  'moduleQuiz/fetchModuleQuizAttempt',
  async (
    {
      courseId,
      moduleId,
      quizId,
    }: { courseId: string | number; moduleId: string | number; quizId: string | number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());

      const res = await axios.get(
        `http://localhost:8080/api/v1/course/${courseId}/modules/${moduleId}/quizzes/${quizId}/attempt`,
        {
          headers: authHeaders(),
        },
      );

      const data = res.data?.data ?? res.data ?? {};

      return { quizId: String(quizId), attempt: data };
    } catch (error: any) {
      console.error('fetchModuleQuizAttempt error:', error);
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to fetch module quiz attempt';
      return rejectWithValue(msg);
    } finally {
      dispatch(hideLoading());
    }
  },
);

export const submitModuleQuizAttempt = createAsyncThunk(
  'moduleQuiz/submitModuleQuizAttempt',
  async (
    {
      courseId,
      moduleId,
      quizId,
      answers,
    }: {
      courseId: string | number;
      moduleId: string | number;
      quizId: string | number;
      answers: { questionId: number | string; answerOptionId: number | string }[];
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());

      const res = await axios.post(
        `http://localhost:8080/api/v1/course/${courseId}/modules/${moduleId}/quizzes/${quizId}/attempt`,
        { answers },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      );

      const data = res.data?.data ?? res.data ?? {};

      return { quizId: String(quizId), result: data };
    } catch (error: any) {
      console.error('submitModuleQuizAttempt error:', error);
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to submit module quiz attempt';
      return rejectWithValue(msg);
    } finally {
      dispatch(hideLoading());
    }
  },
);

const moduleQuizSlice = createSlice({
  name: 'moduleQuiz',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // ---------- list quiz ----------
      .addCase(fetchModuleQuizzesForStudy.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModuleQuizzesForStudy.fulfilled, (state, action) => {
        state.loading = false;
        const { moduleId, quizzes } = action.payload as {
          moduleId: string;
          quizzes: Quiz[];
        };
        state.quizzesByModule[moduleId] = quizzes;
      })
      .addCase(fetchModuleQuizzesForStudy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- get attempt ----------
      .addCase(fetchModuleQuizAttempt.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModuleQuizAttempt.fulfilled, (state, action) => {
        state.loading = false;
        const { quizId, attempt } = action.payload as {
          quizId: string;
          attempt: any;
        };
        state.quizAttemptById[quizId] = attempt;
      })
      .addCase(fetchModuleQuizAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- submit attempt ----------
      .addCase(submitModuleQuizAttempt.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitModuleQuizAttempt.fulfilled, (state, action) => {
        state.loading = false;
        const { quizId, result } = action.payload as {
          quizId: string;
          result: any;
        };
        state.submitResultByQuizId[quizId] = result;
      })
      .addCase(submitModuleQuizAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default moduleQuizSlice.reducer;
