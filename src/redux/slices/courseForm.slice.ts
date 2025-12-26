import {
  CreateCoursePayload,
  CreateLessonPayload,
  CreateTopicPayload,
  UploadContentPayload,
} from '@/models/interface/courseForm.interface';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { log } from 'console';

const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

// List courses
export const listCourses = createAsyncThunk('course/list', async (_: void, { rejectWithValue }) => {
  try {
    const res = await axios.get('https://eduverseapi-production.up.railway.app/api/v1/course', {
      headers: {
        'X-API-KEY': 'NestjsSuper@Elearning$2025',
        ...headers(),
      },
    });
    const payload = res.data?.items ?? res.data?.data ?? res.data ?? [];
    return payload;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.message || e.message || 'List courses failed');
  }
});

// Update course status
export const updateCourseStatus = createAsyncThunk(
  'course/updateStatus',
  async (
    { id, status }: { id: number; status: 'approved' | 'pending' | 'blacklisted' },
    { rejectWithValue },
  ) => {
    try {
      const body = {
        status:
          status === 'approved' ? 'Approved' : status === 'blacklisted' ? 'Blacklisted' : 'Pending',
      };
      await axios.patch(`https://eduverseapi-production.up.railway.app/api/v1/course/${id}/status`, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'NestjsSuper@Elearning$2025',
          Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
        },
      });
      return { id, status: body.status };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Update status failed');
    }
  },
);

// Soft delete course
export const softDeleteCourse = createAsyncThunk(
  'course/softDelete',
  async ({ id }: { id: number }, { rejectWithValue }) => {
    try {
      await axios.delete(`https://eduverseapi-production.up.railway.app/api/v1/course/${id}`, {
        headers: {
          'X-API-KEY': 'NestjsSuper@Elearning$2025',
          Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
        },
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || err?.message || 'Soft delete failed');
    }
  },
);

// Restore course
export const restoreCourse = createAsyncThunk(
  'course/restore',
  async ({ id }: { id: number }, { rejectWithValue }) => {
    try {
      await axios.patch(`https://eduverseapi-production.up.railway.app/api/v1/course/${id}/restore`, null, {
        headers: {
          'X-API-KEY': 'NestjsSuper@Elearning$2025',
          Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
        },
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || err?.message || 'Restore failed');
    }
  },
);

// Create course
export const createCourse = createAsyncThunk(
  'course/create',
  async (body: CreateCoursePayload, { rejectWithValue }) => {
    try {
      const res = await axios.post('https://eduverseapi-production.up.railway.app/api/v1/course', body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'NestjsSuper@Elearning$2025',
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Create course failed');
    }
  },
);

// Update course
export const updateCourse = createAsyncThunk(
  'course/update',
  async ({ id, body }: { id: number; body: CreateCoursePayload }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`https://eduverseapi-production.up.railway.app/api/v1/course/${id}`, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'NestjsSuper@Elearning$2025',
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Update course failed');
    }
  },
);

// Create topic
export const createTopic = createAsyncThunk(
  'courseForm/createTopic',
  async ({ courseId, topicData }: CreateTopicPayload, thunkAPI) => {
    const res = await axios.post(
      `https://eduverseapi-production.up.railway.app/api/v1/courses/${courseId}/topics`,
      topicData,
      { headers: headers() },
    );
    return res.data.data;
  },
);

// Create lesson
export const createLesson = createAsyncThunk(
  'courseForm/createLesson',
  async ({ courseId, topicId, lessonData }: CreateLessonPayload, thunkAPI) => {
    try {
      const res = await axios.post(
        `https://eduverseapi-production.up.railway.app/api/v1/courses/${courseId}/topics/${topicId}/lessons`,
        lessonData,
        { headers: headers() },
      );

      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  },
);

// Delete lesson
export const deleteLesson = createAsyncThunk(
  'courseForm/deleteLesson',
  async (
    { courseId, moduleId, lessonId }: { courseId: number; moduleId: number; lessonId: number },
    { rejectWithValue },
  ) => {
    try {
      await axios.delete(
        `https://eduverseapi-production.up.railway.app/api/v1/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}`,
        {
          headers: {
            'X-API-KEY': 'NestjsSuper@Elearning$2025',
            ...headers(),
          },
        },
      );

      return { courseId, moduleId, lessonId };
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || 'Delete lesson failed',
      );
    }
  },
);

// Upload PDF document for lesson
export const uploadLessonPdf = createAsyncThunk(
  'courseForm/uploadLessonPdf',
  async (
    {
      courseId,
      moduleId,
      lessonId,
      file,
    }: { courseId: number; moduleId: number; lessonId: number; file: File },
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(
        `https://eduverseapi-production.up.railway.app/api/v1/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/pdf`,
        formData,
        {
          headers: {
            ...headers(),
            'X-API-KEY': 'NestjsSuper@Elearning$2025',
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      return { courseId, moduleId, lessonId };
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || 'Upload lesson PDF failed',
      );
    }
  },
);

const courseFormSlice = createSlice({
  name: 'courseForm',
  initialState: {
    courseId: '',
    topicId: '',
    lessonId: '',
    loading: false,
    error: null as string | null,
    courses: [] as any[],
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(createCourse.fulfilled, (state, action) => {
        state.courseId = action.payload.course_id;
      })
      .addCase(listCourses.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(listCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.courses = [];
      })
      .addCase(updateCourseStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload as { id: number; status: 'Approved' | 'Pending' };
        const found = state.courses.find(c => Number(c.id) === Number(id));
        if (found) found.status = status;
      })
      .addCase(updateCourseStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(createTopic.fulfilled, (state, action) => {
        state.topicId = action.payload.topic_id;
      })
      .addCase(createLesson.fulfilled, (state, action) => {
        state.lessonId = action.payload.lesson_id;
      })
      .addCase(deleteLesson.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(uploadLessonPdf.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export default courseFormSlice.reducer;
