import { MyLearningCourse } from '@/models/interface/myLearningCourse.interface';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

interface MyLearningState {
  ids: string[];
  courses: MyLearningCourse[];
  loading: boolean;
  error: string | null;
}

const initialState: MyLearningState = {
  ids: [],
  courses: [],
  loading: false,
  error: null,
};
export const fetchMyLearningCourses = createAsyncThunk('myLearning/fetch', async (_, thunkAPI) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return thunkAPI.rejectWithValue('Unauthorized');
    }

    const res = await axios.get('http://localhost:8080/api/v1/course/enrolled', {
      headers: { Authorization: `Bearer ${token}` },
      params: { skip: 0, take: 10 },
    });

    const raw = res.data?.data?.items ?? res.data?.items ?? [];

    const mapped: MyLearningCourse[] = raw.map((course: any) => {
      const enrollment = course.enrollment || {};
      const progress = Number(enrollment.progress ?? 0);

      return {
        _id: String(course.id),
        course_id: course.id,

        title: course.title ?? '',
        thumbnail: course.thumbnail ?? '',

        instructor: {
          full_name: course.teacher?.name ?? 'Unknown instructor',
          avatar: course.teacher?.avatar ?? '',
        },

        rating: Number(course.rating ?? 0),
        level: course.category?.name ?? '',

        progress,
        enrolled_at: enrollment.enrolledAt ?? '',
        isStarted: progress > 0,

      } as MyLearningCourse;
    });

    return mapped;
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to load my learning courses');
  }
});

const myLearningSlice = createSlice({
  name: 'myLearning',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchMyLearningCourses.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLearningCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
        state.ids = action.payload.map(c => c.course_id);
      })
      .addCase(fetchMyLearningCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default myLearningSlice.reducer;
