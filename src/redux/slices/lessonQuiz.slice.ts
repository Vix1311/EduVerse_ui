import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { showLoading, hideLoading } from './ui.slice';

const API_URL = import.meta.env.VITE_API_URL || 'https://eduverseapi-production.up.railway.app';

const authHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type StudyLessonItem = {
  id: number | string;
  title: string;
  lessonOrder?: number;
  isPreviewable?: boolean;
  isCompleted?: boolean;
  [k: string]: any;
};

interface LessonQuizState {
  quizAttemptById: Record<string, any>;
  quizzesByLessonId: Record<string, any[]>;
  submitResultByQuizId: Record<string, any>;

  studyLessonsByModuleId: Record<string, StudyLessonItem[]>;

  loading: boolean;
  error: string | null;
}

const initialState: LessonQuizState = {
  quizAttemptById: {},
  quizzesByLessonId: {},
  submitResultByQuizId: {},
  studyLessonsByModuleId: {},

  loading: false,
  error: null,
};

// List lessons by module
export const fetchStudyModuleLessons = createAsyncThunk(
  'lessonQuiz/fetchStudyModuleLessons',
  async (
    { moduleId, skip = 0, take = 50 }: { moduleId: string | number; skip?: number; take?: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());

      const res = await axios.get(`${API_URL}/api/v1/study/modules/${moduleId}/lessons`, {
        headers: authHeaders(),
        params: { skip, take },
      });

      const raw = res.data?.data ?? res.data ?? {};
      let items: any[] = raw.items ?? raw.results ?? raw ?? [];
      let it: any = items as any;
      if (!Array.isArray(it)) it = it?.items ?? it?.results ?? [];
      items = it;

      const lessons: StudyLessonItem[] = items.map((l: any) => ({
        id: l.id,
        title: l.title,
        lessonOrder: l.lessonOrder ?? l.order ?? 0,
        isPreviewable: !!(l.isPreviewable ?? l.isPreviewable === true),
        isCompleted: !!l.isCompleted,
        ...l,
      }));

      return { moduleId: String(moduleId), lessons };
    } catch (error: any) {
      console.error('fetchStudyModuleLessons error:', error);
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to fetch study module lessons';
      return rejectWithValue(msg);
    } finally {
      dispatch(hideLoading());
    }
  },
);

// List quizzes for a lesson
export const fetchLessonQuizzes = createAsyncThunk(
  'lessonQuiz/fetchLessonQuizzes',
  async (
    { lessonId, skip = 0, take = 10 }: { lessonId: string | number; skip?: number; take?: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());

      const res = await axios.get(`${API_URL}/api/v1/study/lessons/${lessonId}/quizzes`, {
        headers: authHeaders(),
        params: { skip, take },
      });

      const raw = res.data?.data ?? res.data ?? {};
      let items: any[] = raw.items ?? raw.results ?? raw ?? [];
      let it: any = items as any;
      if (!Array.isArray(it)) it = it?.items ?? it?.results ?? [];
      items = it;

      return { lessonId: String(lessonId), quizzes: items };
    } catch (error: any) {
      console.error('fetchLessonQuizzes error:', error);
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to fetch lesson quizzes';
      return rejectWithValue(msg);
    } finally {
      dispatch(hideLoading());
    }
  },
);

// Get lesson-level quiz attempt
export const fetchLessonQuizAttempt = createAsyncThunk(
  'lessonQuiz/fetchLessonQuizAttempt',
  async (
    {
      courseId,
      lessonId,
      quizId,
    }: {
      courseId: string | number;
      lessonId: string | number;
      quizId: string | number;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());

      const res = await axios.get(
        `${API_URL}/api/v1/courses/${courseId}/lessons/${lessonId}/quizzes/${quizId}/attempt`,
        { headers: authHeaders() },
      );

      const data = res.data?.data ?? res.data ?? {};
      return { quizId: String(quizId), attempt: data };
    } catch (error: any) {
      console.error('fetchLessonQuizAttempt error:', error);
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to fetch lesson quiz attempt';
      return rejectWithValue(msg);
    } finally {
      dispatch(hideLoading());
    }
  },
);

// Submit lesson-level quiz attempt
export const submitLessonQuizAttempt = createAsyncThunk(
  'lessonQuiz/submitLessonQuizAttempt',
  async (
    {
      courseId,
      lessonId,
      quizId,
      answers,
    }: {
      courseId: string | number;
      lessonId: string | number;
      quizId: string | number;
      answers: { questionId: number | string; answerOptionId: number | string }[];
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());

      const res = await axios.post(
        `${API_URL}/api/v1/courses/${courseId}/lessons/${lessonId}/quizzes/${quizId}/attempt`,
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
      console.error('submitLessonQuizAttempt error:', error);
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to submit lesson quiz attempt';
      return rejectWithValue(msg);
    } finally {
      dispatch(hideLoading());
    }
  },
);

const lessonQuizSlice = createSlice({
  name: 'lessonQuiz',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // ---------- study lessons list ----------
      .addCase(fetchStudyModuleLessons.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudyModuleLessons.fulfilled, (state, action) => {
        state.loading = false;
        const { moduleId, lessons } = action.payload as {
          moduleId: string;
          lessons: StudyLessonItem[];
        };
        state.studyLessonsByModuleId[moduleId] = lessons;
      })
      .addCase(fetchStudyModuleLessons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- get attempt ----------
      .addCase(fetchLessonQuizAttempt.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLessonQuizAttempt.fulfilled, (state, action) => {
        state.loading = false;
        const { quizId, attempt } = action.payload as { quizId: string; attempt: any };
        state.quizAttemptById[quizId] = attempt;
      })
      .addCase(fetchLessonQuizAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- submit attempt ----------
      .addCase(submitLessonQuizAttempt.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitLessonQuizAttempt.fulfilled, (state, action) => {
        state.loading = false;
        const { quizId, result } = action.payload as { quizId: string; result: any };
        state.submitResultByQuizId[quizId] = result;
      })
      .addCase(submitLessonQuizAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- list quizzes ----------
      .addCase(fetchLessonQuizzes.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLessonQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        const { lessonId, quizzes } = action.payload as { lessonId: string; quizzes: any[] };
        state.quizzesByLessonId[lessonId] = quizzes;
      })
      .addCase(fetchLessonQuizzes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default lessonQuizSlice.reducer;
