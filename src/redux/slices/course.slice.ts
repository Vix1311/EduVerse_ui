import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { Course } from '@/models/interface/courseCard.interface';
import { WishlistItem } from '@/models/interface/wishlist.interface';
import { showLoading, hideLoading } from './ui.slice';

interface CourseState {
  courses1: Course[];
  courses2: Course[];
  courses3: Course[];
  wishlistCourseIds: string[];
  wishlistItems: WishlistItem[];
  error: string | null;
}

const initialState: CourseState = {
  courses1: [],
  courses2: [],
  courses3: [],
  wishlistCourseIds: [],
  wishlistItems: [],
  error: null,
};

// Map BE course object → FE Course interface
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

    author:
      c.teacher?.name ??
      c.instructor?.full_name ??
      c.instructor?.fullname ??
      c.author?.name ??
      'Unknown',

    authorImage:
      c.teacher?.avatar ?? c.instructor?.avatar ?? c.author?.avatar ?? 'src/assets/icons/user.png',

    createdAt: c.createdAt ?? c.updatedAt ?? null,

    categoryName: c.category?.name ?? '',

    title: c.course?.title ?? c.title ?? '',
    description: c.course?.description ?? c.description ?? '',
    video: c.videoUrl,
    images: [c.preview?.thumbnail ?? c.thumbnail ?? 'src/assets/images/featured1.png'],
    rating: Number(c.rating ?? 4.5),
    reviews: Number(c.reviews ?? 123),
    lessons: Number(c.topics?.length ?? c.lessons ?? 0),
    hour: Math.round((c.preview?.duration ?? c.duration ?? 60) / 60) || 1,
    views: Number(c.views ?? Math.floor(Math.random() * 5000)),
    originalPrice,
    discountPrice,
    hasDiscount,

    date: c.createdAt ?? 'Today',

    features: ['Video chất lượng cao', 'Hỗ trợ mọi nền tảng', 'Tặng mã giảm giá khi học'],
    isBesteller: Boolean(c.is_bestseller ?? c.isBesteller ?? Math.random() < 0.5),
  };
};

// Fetch all courses & wishlist simultaneously, normalize wishlistCourseIds
export const fetchCoursesAndWishlist = createAsyncThunk(
  'courses/fetchAll',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('access_token');
      const courseRes = await axios.get('http://localhost:8080/api/v1/course/public');
      let rawCourses: any[] =
        courseRes?.data?.items ??
        courseRes?.data?.data?.items ??
        courseRes?.data?.data ??
        courseRes?.data?.results ??
        [];
      let rawAny = rawCourses as any;
      if (!Array.isArray(rawAny)) rawAny = rawAny?.items ?? rawAny?.results ?? [];
      rawCourses = rawAny;

      const pick10 = () =>
        [...rawCourses]
          .sort(() => 0.5 - Math.random())
          .slice(0, 10)
          .map(mapToCourse);
      console.log('Fetched courses:', rawCourses);
      let wishlistIds: string[] = [];
      if (token) {
        const wl = await axios.get('http://localhost:8080/api/v1/wishlist', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const results = wl.data?.data?.results ?? [];
        wishlistIds = results
          .map((it: any) =>
            String(it.courseId ?? it.course_id ?? it.course?.id ?? it.course?._id ?? ''),
          )
          .filter(Boolean);
        dispatch(setWishlistCourseIds(wishlistIds));
      }

      return {
        courses1: pick10(),
        courses2: pick10(),
        courses3: pick10(),
        wishlistCourseIds: wishlistIds,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch data');
    }
  },
);

export const fetchWishlist = createAsyncThunk(
  'courses/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return [];

      const res = await axios.get('http://localhost:8080/api/v1/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data?.data?.results || [];
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status !== 401) {
        console.error('Failed to load wishlist:', err);
      }
      return rejectWithValue(err.message || 'Failed to fetch wishlist');
    }
  },
);

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setWishlistCourseIds: (state, action: PayloadAction<string[]>) => {
      state.wishlistCourseIds = action.payload;
    },
    toggleWishlistCourseId: (state, action: PayloadAction<string | number>) => {
      const id = String(action.payload);
      const i = state.wishlistCourseIds.indexOf(id);
      if (i >= 0) state.wishlistCourseIds.splice(i, 1);
      else state.wishlistCourseIds.push(id);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCoursesAndWishlist.fulfilled, (state, action) => {
        state.courses1 = action.payload.courses1;
        state.courses2 = action.payload.courses2;
        state.courses3 = action.payload.courses3;
        state.wishlistCourseIds = action.payload.wishlistCourseIds;
        state.error = null;
      })
      .addCase(fetchCoursesAndWishlist.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        const items = action.payload || [];
        state.wishlistCourseIds = items
          .map((it: any) =>
            String(it.courseId ?? it.course_id ?? it.course?.id ?? it.course?._id ?? ''),
          )
          .filter(Boolean);

        state.wishlistItems = items.map((item: any) => ({
          id: item._id,
          thumbnail: item.thumbnail || '/images/default-thumb.jpg',
          title: item.title || 'Untitled',
          author: item.instructor?.full_name || 'Unknown',
          price: item.final_price || item.price || 0,
          originalPrice: item.price || 0,
        }));
      });
  },
});

export const { setWishlistCourseIds, toggleWishlistCourseId } = courseSlice.actions;
export default courseSlice.reducer;
