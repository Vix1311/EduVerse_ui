import { Course } from '@/models/interface/courseCard.interface';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface CategoryCoursesState {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryCoursesState = {
  courses: [],
  loading: false,
  error: null,
};

const mapToCourse = (c: any): Course => {
  const originalPrice = c.price ?? c.final_price ?? 0;
  let discountPrice = originalPrice;
  let hasDiscount = false;

  const best = c.best_coupon || c.bestCoupon;
  if (best) {
    const type = (best.discount_type || best.type || '').toString().toLowerCase();
    const amt = Number(best.discount_amount ?? best.amount ?? 0);
    hasDiscount = true;

    discountPrice =
      type === 'percentage'
        ? Math.round(originalPrice * (1 - amt / 100))
        : Math.max(0, originalPrice - amt);
  }

  return {
    id: (c._id ?? c.id ?? '').toString(),
    author: c.instructor?.full_name ?? c.instructor?.fullname ?? c.author?.name ?? 'Unknown',
    authorImage: c.instructor?.avatar ?? c.author?.avatar ?? 'src/assets/icons/user.png',
    title: c.course?.title ?? c.title ?? '',
    description: c.course?.description ?? c.description ?? '',
    video: c.preview?.video_url ?? c.previewVideo ?? '',
    images: [c.preview?.thumbnail ?? c.thumbnail ?? 'src/assets/images/featured1.png'],
    rating: Number(c.rating ?? 4.5),
    reviews: Number(c.reviews ?? 123),
    lessons: Number(c.topics?.length ?? c.lessons ?? 0),
    hour: Math.round((c.preview?.duration ?? c.duration ?? 60) / 60) || 1,
    views: Number(c.views ?? Math.floor(Math.random() * 5000)),
    originalPrice,
    discountPrice,
    hasDiscount,
    date: 'Today',
    features: ['Video chất lượng cao', 'Hỗ trợ mọi nền tảng', 'Tặng mã giảm giá khi học'],
    isBesteller: Boolean(c.is_bestseller ?? c.isBesteller ?? Math.random() < 0.5),
  };
};

// fetch course by category id
export const fetchCoursesByCategory = createAsyncThunk(
  'categoryCourses/fetchByCategory',
  async (categoryId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get('https://eduverseapi-production.up.railway.app/api/v1/course/public', {
        params: { categoryId },
      });

      let raw: any[] =
        res.data?.items ?? res.data?.data?.items ?? res.data?.data ?? res.data?.results ?? [];
      let rawAny = raw as any;
      if (!Array.isArray(rawAny)) rawAny = rawAny?.items ?? rawAny?.results ?? [];
      raw = rawAny;

      const mapped: Course[] = raw.map(mapToCourse);
      return mapped;
    } catch (err: any) {
      console.error('fetchCoursesByCategory error:', err);
      return rejectWithValue(err.message || 'Failed to fetch courses by category');
    }
  },
);

const categoryCoursesSlice = createSlice({
  name: 'categoryCourses',
  initialState,
  reducers: {
    clearCategoryCourses(state) {
      state.courses = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCoursesByCategory.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesByCategory.fulfilled, (state, action: PayloadAction<Course[]>) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCoursesByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCategoryCourses } = categoryCoursesSlice.actions;
export default categoryCoursesSlice.reducer;
