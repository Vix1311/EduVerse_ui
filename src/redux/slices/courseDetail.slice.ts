import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface CourseDetailData {
  _id?: string | number;
  id?: string | number;
  price?: number;
  best_coupon?: {
    code: string;
    discount_amount: number;
    discount_type: string; // 'percentage' | 'amount'
  };
  preview?: { duration?: number; videoUrl?: string };
  instructor?: { id: number; full_name?: string; fullname?: string; avatar?: string; bio?: string };
  course?: { title?: string; description?: string };
  topics?: any[];
  teacher?: { id?: string | number };
}

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

interface CourseDetailState {
  data: CourseDetailData | null;
  includes: {
    onDemandVideo: string;
    practiceTests: string;
    articles: string;
    downloadableResources: string;
    accessOnMobileAndTV: string;
    fullLifetimeAccess: string;
    closedCaptions: string;
    audioDescription: string;
    certificateOfCompletion: string;
  };
  coupons: Record<string, any>;
  map: Record<string, { lesson: any; comments: any[] }>;
  status: Status;
  error: string | null;
  loading: boolean;
}

// Fetch course detail from BE
export const fetchCourseDetail = createAsyncThunk<any, string>(
  'courseDetail/fetch',
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`https://eduverseapi-production.up.railway.app/api/v1/course/public/${courseId}`);
      return res.data?.data ?? res.data?.result ?? res.data ?? null;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Course not found';
      return rejectWithValue(msg);
    }
  },
);

export const fetchCourseMockData = createAsyncThunk(
  'courseDetail/fetchMockData',
  async (_, { rejectWithValue }) => {
    try {
      const [includesRes, couponsRes] = await Promise.all([
        axios.get('/data/CourseDetailData/CourseDetailIncludesData.json'),
        axios.get('/data/CourseDetailData/CourseDetailCouponsData.json'),
      ]);
      return {
        includes: includesRes.data,
        coupons: couponsRes.data,
      };
    } catch {
      return rejectWithValue('Failed to fetch mock data');
    }
  },
);

export const fetchCourseComments = createAsyncThunk(
  'courseComments/fetch',
  async (courseId: string, { rejectWithValue }) => {
    const token = localStorage.getItem('access_token');
    try {
      const lessonRes = await axios.get(
        `https://eduverseapi-production.up.railway.app/api/v1/courses/my-courses/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const topics = lessonRes.data?.data?.topics || [];
      const allLessons = topics.flatMap((topic: any) =>
        Array.isArray(topic.lessons)
          ? topic.lessons.map((lesson: any) => ({ lesson, topicTitle: topic.title }))
          : [],
      );

      const commentFetches = allLessons.map(async ({ lesson }: { lesson: any }) => {
        try {
          const res = await axios.get(
            `https://eduverseapi-production.up.railway.app/api/v1/comments/lessons/${lesson._id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          return { lesson, comments: res.data?.data?.results || [] };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(commentFetches);
      const valid = results.filter(Boolean) as { lesson: any; comments: any[] }[];

      const map: Record<string, { lesson: any; comments: any[] }> = {};
      valid.forEach(({ lesson, comments }) => {
        map[lesson._id] = { lesson, comments };
      });

      return map;
    } catch {
      return rejectWithValue('Failed to fetch lesson comments');
    }
  },
);

const initialState: CourseDetailState = {
  data: null,
  includes: {
    onDemandVideo: 'On-demand video',
    practiceTests: 'Practice tests',
    articles: 'Articles',
    downloadableResources: 'Downloadable resources',
    accessOnMobileAndTV: 'Access on mobile & TV',
    fullLifetimeAccess: 'Full lifetime access',
    closedCaptions: 'Closed captions',
    audioDescription: 'Audio description',
    certificateOfCompletion: 'Certificate of completion',
  },
  coupons: {},
  map: {},
  status: 'idle',
  error: null,
  loading: false,
};

const courseDetailSlice = createSlice({
  name: 'courseDetail',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchCourseDetail.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action: PayloadAction<any>) => {
        state.status = 'succeeded';
        state.data = action.payload || null;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load course';
        state.data = null;
      })

      .addCase(fetchCourseMockData.fulfilled, (state, action) => {
        state.includes = { ...state.includes, ...(action.payload as any).includes };
        state.coupons = (action.payload as any).coupons || {};
      })

      .addCase(fetchCourseComments.pending, state => {
        state.loading = false;
      })
      .addCase(fetchCourseComments.fulfilled, (state, action) => {
        state.loading = false;
        state.map = action.payload;
      })
      .addCase(fetchCourseComments.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? null;
      });
  },
});

export default courseDetailSlice.reducer;
