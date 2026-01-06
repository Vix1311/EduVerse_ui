import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { getAccessTokenFromLS } from '@/core/shared/storage';
import { logoutUser } from '@/core/store/user.slice';

const BASE = 'http://localhost:8080/api/v1';

export interface WishlistCourseItem {
  courseId: number;
  addedAt: string;
  course: {
    id: number;
    title: string;
    thumbnail: string | null;
    price: number;
    isFree: boolean;
    category?: { id: number; name: string } | null;
    teacher?: any | null;
  };
}

interface WishlistState {
  items: WishlistCourseItem[];
  ids: number[];
  loading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  ids: [],
  loading: false,
  error: null,
};

const authHeader = () => {
  const token = getAccessTokenFromLS();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_: void, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/wishlist`, { headers: { ...authHeader() } });
      const items: WishlistCourseItem[] = res.data?.items ?? res.data?.data?.items ?? [];
      return items;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch wishlist');
    }
  },
);

export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (courseId: number, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${BASE}/wishlist`,
        { courseId },
        { headers: { ...authHeader(), 'Content-Type': 'application/json' } },
      );

      const item: WishlistCourseItem = res.data?.item ?? res.data?.data?.item;

      return (
        item ?? {
          courseId,
          addedAt: new Date().toISOString(),
          course: {
            id: courseId,
            title: '',
            thumbnail: null,
            price: 0,
            isFree: false,
          },
        }
      );
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to add to wishlist');
    }
  },
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (courseId: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE}/wishlist/${courseId}`, { headers: { ...authHeader() } });
      return courseId;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to remove from wishlist');
    }
  },
);

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggle',
  async ({ courseId, isWishlisted }: { courseId: number; isWishlisted: boolean }, { dispatch }) => {
    if (isWishlisted) {
      await dispatch(removeFromWishlist(courseId)).unwrap();
    } else {
      await dispatch(addToWishlist(courseId)).unwrap();
    }
    return courseId;
  },
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist(state) {
      state.items = [];
      state.ids = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(logoutUser.fulfilled, () => initialState)

      .addCase(fetchWishlist.pending, s => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (s, a: PayloadAction<WishlistCourseItem[]>) => {
        s.loading = false;
        s.items = a.payload;
        s.ids = a.payload.map(i => i.courseId);
      })
      .addCase(fetchWishlist.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload as string;
      })
      .addCase(addToWishlist.fulfilled, (s, a: PayloadAction<WishlistCourseItem>) => {
        const exists = s.ids.includes(a.payload.courseId);
        if (!exists) {
          s.items.unshift(a.payload);
          s.ids.unshift(a.payload.courseId);
        }
      })
      .addCase(removeFromWishlist.fulfilled, (s, a: PayloadAction<number>) => {
        s.items = s.items.filter(i => i.courseId !== a.payload);
        s.ids = s.ids.filter(id => id !== a.payload);
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
