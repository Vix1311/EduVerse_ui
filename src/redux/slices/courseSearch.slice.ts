import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export type Course = {
  id: number;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  categoryId?: number | null;
  price?: number | null;
  isFree?: boolean;
  isFeatured?: boolean;
  isPreorder?: boolean;
  hasPreview?: boolean;
  previewDescription?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  slug?: string;
  _id?: string;
};
const authHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const searchCourses = createAsyncThunk(
  'course/search',
  async (keyword: string, thunkAPI) => {
    try {
      const text = keyword?.trim() ?? '';
      if (!text) return [];

      const skip = 0;
      const take = 20;

      const res = await axios.get(
        `https://eduverseapi-production.up.railway.app/api/v1/course/public?text=${encodeURIComponent(text)}&skip=${skip}&take=${take}`,
        { headers: authHeaders() },
      );
      console.log('Course search response:', res);
      const raw = res.data;
      const list = raw?.data?.items ?? raw?.items ?? raw?.data;
      return Array.isArray(list) ? (list as Course[]) : [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  },
);

interface CourseSearchState {
  data: Course[];
  loading: boolean;
  error: string | null;
}

const initialState: CourseSearchState = {
  data: [],
  loading: false,
  error: null,
};

const courseSearchSlice = createSlice({
  name: 'courseSearch',
  initialState,
  reducers: {
    clearCourseSearchResults: state => {
      state.data = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(searchCourses.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(searchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Request failed';
      });
  },
});

export const { clearCourseSearchResults } = courseSearchSlice.actions;
export default courseSearchSlice.reducer;
