import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import type { Lesson, Module } from '@/models/interface/moduleBuilder.interface';

const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
});

/** Normalize lesson from API (support multiple backend field names) */
const normalizeLesson = (l: any, moduleId: number): Lesson => ({
  id: l.id,
  moduleId: l.moduleId ?? l.chapterId ?? moduleId,
  title: l.title,
  videoUrl: l.video_url ?? l.videoUrl ?? '',
  documentUrl: l.document_url ?? l.documentUrl ?? l.materialUrl ?? '',
  lessonOrder: l.lessonOrder ?? l.order ?? 0,
  isPreviewable: !!l.isPreviewable,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
});

const normalizeModule = (m: any, courseId: number): Module => ({
  id: m.id,
  courseId: m.courseId ?? courseId,
  title: m.title,
  description: m.description,
  chapterOrder: m.chapterOrder,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
  lessons: Array.isArray(m.lessons) ? m.lessons.map((l: any) => normalizeLesson(l, m.id)) : [],
});

// Get modules for a course
export const getModules = createAsyncThunk(
  'module/list',
  async (courseId: number, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/v1/course/${courseId}/builder/modules`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'NestjsSuper@Elearning$2025',
            ...headers(),
          },
        },
      );

      const raw = res.data?.data ?? res.data;
      const data = raw?.items ?? raw ?? [];

      const modules: Module[] = Array.isArray(data)
        ? data.map((m: any) => normalizeModule(m, courseId))
        : [];

      return modules;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Get modules failed');
    }
  },
);

// Create module
export const createModule = createAsyncThunk(
  'module/create',
  async (
    {
      courseId,
      payload,
    }: {
      courseId: number;
      payload: { title: string; description?: string; chapterOrder?: number };
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.post(
        `http://localhost:8080/api/v1/course/${courseId}/builder/modules`,
        [payload],
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'NestjsSuper@Elearning$2025',
            ...headers(),
          },
        },
      );

      const raw = res.data?.data ?? res.data;
      const created = Array.isArray(raw) ? raw[0] : (raw?.items?.[0] ?? raw);

      return normalizeModule({ ...created, lessons: [] }, courseId);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Create module failed');
    }
  },
);

// Get a module detail
export const getModule = createAsyncThunk(
  'module/get',
  async ({ courseId, moduleId }: { courseId: number; moduleId: number }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/v1/course/${courseId}/builder/modules/${moduleId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'NestjsSuper@Elearning$2025',
            ...headers(),
          },
        },
      );

      const raw = res.data?.data ?? res.data;
      const m = Array.isArray(raw) ? raw[0] : raw;

      return normalizeModule(m, courseId);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Get module failed');
    }
  },
);

// Patch module
export const updateModule = createAsyncThunk(
  'module/update',
  async (
    {
      courseId,
      moduleId,
      payload,
    }: {
      courseId: number;
      moduleId: number;
      payload: { title?: string; description?: string; chapterOrder?: number };
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.patch(
        `http://localhost:8080/api/v1/course/${courseId}/builder/modules/${moduleId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'NestjsSuper@Elearning$2025',
            ...headers(),
          },
        },
      );

      const raw = res.data?.data ?? res.data;
      const updated = Array.isArray(raw) ? raw[0] : (raw?.items?.[0] ?? raw);

      return normalizeModule(updated, courseId);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Update module failed');
    }
  },
);

// Delete module
export const deleteModule = createAsyncThunk(
  'module/delete',
  async ({ courseId, id }: { courseId: number; id: number }, { rejectWithValue }) => {
    try {
      await axios.delete(`http://localhost:8080/api/v1/course/${courseId}/builder/modules/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'NestjsSuper@Elearning$2025',
          ...headers(),
        },
      });

      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Delete module failed');
    }
  },
);

// Get lessons for a module
export const getLessons = createAsyncThunk(
  'module/getLessons',
  async ({ courseId, moduleId }: { courseId: number; moduleId: number }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/v1/course/${courseId}/builder/modules/${moduleId}/lessons`,
        {
          headers: {
            'X-API-KEY': 'NestjsSuper@Elearning$2025',
            ...headers(),
          },
        },
      );

      const data = res.data?.data?.items ?? res.data?.items ?? res.data ?? [];
      const lessons: Lesson[] = Array.isArray(data)
        ? data.map((l: any) => normalizeLesson(l, moduleId))
        : [];

      return { moduleId, lessons };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Get lessons failed');
    }
  },
);

// Create lesson
export const createLesson = createAsyncThunk(
  'module/createLesson',
  async (
    {
      courseId,
      moduleId,
      payload,
    }: {
      courseId: number;
      moduleId: number;
      payload: {
        title: string;
        description?: string;
        videoUrl?: string;
        documentUrl?: string;
        duration?: number;
        lessonOrder?: number;
        isPreviewable?: boolean;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.post(
        `http://localhost:8080/api/v1/course/${courseId}/builder/modules/${moduleId}/lessons`,
        { lessons: [payload] },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'NestjsSuper@Elearning$2025',
            ...headers(),
          },
        },
      );

      const raw = res.data?.data ?? res.data;
      const created = Array.isArray(raw) ? raw[0] : (raw?.items?.[0] ?? raw);

      const lesson: Lesson = normalizeLesson(created, moduleId);
      return { moduleId, lesson };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Create lesson failed');
    }
  },
);

// Update lesson
export const updateLesson = createAsyncThunk(
  'module/updateLesson',
  async (
    {
      courseId,
      moduleId,
      lessonId,
      payload,
    }: {
      courseId: number;
      moduleId: number;
      lessonId: number;
      payload: Partial<Lesson>;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.patch(
        `http://localhost:8080/api/v1/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'NestjsSuper@Elearning$2025',
            ...headers(),
          },
        },
      );

      const raw = res.data?.data ?? res.data;
      const updated = Array.isArray(raw) ? raw[0] : (raw?.items?.[0] ?? raw);

      const lesson: Lesson = normalizeLesson(updated, moduleId);
      return { moduleId, lesson };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Update lesson failed');
    }
  },
);

interface ModuleState {
  courseId: number | null;
  modules: Module[];
  loading: boolean;
  error: string | null;
}

const initialState: ModuleState = {
  courseId: null,
  modules: [],
  loading: false,
  error: null,
};

const moduleSlice = createSlice({
  name: 'module',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // getModules
      .addCase(getModules.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getModules.fulfilled, (state, action) => {
        state.loading = false;
        const newModules = action.payload;

        const existingCourseIds = newModules.map((m: any) => m.courseId);
        state.modules = [
          ...state.modules.filter(m => !existingCourseIds.includes(m.courseId)),
          ...newModules,
        ];
      })
      .addCase(getModules.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load modules';
      })

      // createModule
      .addCase(createModule.fulfilled, (state, action) => {
        state.modules.push(action.payload as Module);
      })

      // getModule
      .addCase(getModule.fulfilled, (state, action) => {
        const mod = action.payload as Module;
        const index = state.modules.findIndex(m => m.id === mod.id);
        if (index !== -1) state.modules[index] = mod;
        else state.modules.push(mod);
      })

      // updateModule
      .addCase(updateModule.fulfilled, (state, action) => {
        const updated = action.payload as Module;
        const index = state.modules.findIndex(m => m.id === updated.id);
        if (index !== -1) state.modules[index] = updated;
      })

      // deleteModule
      .addCase(deleteModule.fulfilled, (state, action) => {
        const id = action.payload as number;
        state.modules = state.modules.filter(m => m.id !== id);
      })

      // getLessons
      .addCase(getLessons.fulfilled, (state, action) => {
        const { moduleId, lessons } = action.payload as { moduleId: number; lessons: Lesson[] };
        const mod = state.modules.find(m => Number(m.id) === Number(moduleId));
        if (mod) mod.lessons = lessons;
      })

      // createLesson
      .addCase(createLesson.fulfilled, (state, action) => {
        const { moduleId, lesson } = action.payload as { moduleId: number; lesson: Lesson };
        const mod = state.modules.find(m => Number(m.id) === Number(moduleId));
        if (!mod) return;

        if (!Array.isArray(mod.lessons)) mod.lessons = [];
        mod.lessons.push(lesson);
      })

      // updateLesson
      .addCase(updateLesson.fulfilled, (state, action) => {
        const { moduleId, lesson } = action.payload as { moduleId: number; lesson: Lesson };
        const mod = state.modules.find(m => Number(m.id) === Number(moduleId));
        if (!mod || !Array.isArray(mod.lessons)) return;

        const idx = mod.lessons.findIndex(l => Number(l.id) === Number(lesson.id));
        if (idx !== -1) mod.lessons[idx] = { ...mod.lessons[idx], ...lesson };
      });
  },
});

export default moduleSlice.reducer;
