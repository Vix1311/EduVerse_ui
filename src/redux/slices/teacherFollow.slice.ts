import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '@/core/store/store';

// ====== Types ======

export interface TeacherFollower {
  [key: string]: any;
}

export interface TeacherFollowing {
  [key: string]: any;
}

interface TeacherFollowState {
  followersByTeacherId: Record<string, TeacherFollower[]>;
  followingByTeacherId: Record<string, TeacherFollowing[]>;

  followersTotalByTeacherId: Record<string, number>;
  followingTotalByTeacherId: Record<string, number>;

  isFollowingMap: Record<string, boolean>;

  loading: boolean;
  error: string | null;
}

// ====== Initial state ======

const initialState: TeacherFollowState = {
  followersByTeacherId: {},
  followingByTeacherId: {},
  followersTotalByTeacherId: {},
  followingTotalByTeacherId: {},
  isFollowingMap: {},
  loading: false,
  error: null,
};

// ====== Axios instance & helpers ======

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

const authHeaders = (_state: RootState) => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ====== Thunks ======

// follow teacher
export const followTeacher = createAsyncThunk<
  { teacherId: string },
  number | string,
  { rejectValue: string; state: RootState }
>('teacherFollow/followTeacher', async (teacherId, { rejectWithValue, getState }) => {
  try {
    const state = getState();
    await axiosInstance.post(
      `/api/v1/teachers/${teacherId}/follow`,
      {},
      { headers: { ...authHeaders(state) } },
    );
    return { teacherId: String(teacherId) };
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Failed to follow teacher';
    return rejectWithValue(msg);
  }
});

// unfollow teacher
export const unfollowTeacher = createAsyncThunk<
  { teacherId: string },
  number | string,
  { rejectValue: string; state: RootState }
>('teacherFollow/unfollowTeacher', async (teacherId, { rejectWithValue, getState }) => {
  try {
    const state = getState();
    await axiosInstance.put(
      `/api/v1/teachers/${teacherId}/unfollow`,
      {},
      { headers: { ...authHeaders(state) } },
    );
    return { teacherId: String(teacherId) };
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Failed to unfollow teacher';
    return rejectWithValue(msg);
  }
});

interface ListArgs {
  teacherId: number | string;
  page?: number;
  limit?: number;
}

interface ListResult<TItem> {
  teacherId: string;
  items: TItem[];
  total?: number;
  page?: number;
  limit?: number;
}

function normalizeListResponse<TItem>(resData: any): {
  items: TItem[];
  total?: number;
  page?: number;
  limit?: number;
} {
  const raw = resData?.data ?? resData;

  let items: TItem[] = [];
  let total: number | undefined;
  let metaPage: number | undefined;
  let metaLimit: number | undefined;

  if (Array.isArray(raw)) {
    items = raw as TItem[];
  } else if (raw) {
    items = (raw.items ?? raw.results ?? raw.data ?? []) as TItem[];
    total = raw.total ?? raw.totalItems ?? raw.count;
    metaPage = raw.page ?? raw.currentPage;
    metaLimit = raw.limit ?? raw.pageSize;
  }

  return { items, total, page: metaPage, limit: metaLimit };
}

// get teacher followers
export const fetchTeacherFollowers = createAsyncThunk<
  ListResult<TeacherFollower>,
  ListArgs,
  { rejectValue: string; state: RootState }
>('teacherFollow/fetchTeacherFollowers', async (args, { rejectWithValue, getState }) => {
  try {
    const { teacherId, page, limit } = args;
    const state = getState();

    const res = await axiosInstance.get(`/api/v1/teachers/${teacherId}/followers`, {
      headers: { ...authHeaders(state) },
      params: { page, limit },
    });

    const norm = normalizeListResponse<TeacherFollower>(res.data);

    return {
      teacherId: String(teacherId),
      items: norm.items,
      total: norm.total,
      page: norm.page ?? page,
      limit: norm.limit ?? limit,
    };
  } catch (error: any) {
    const msg =
      error?.response?.data?.message || error?.message || 'Failed to load teacher followers';
    return rejectWithValue(msg);
  }
});

// get teacher following
export const fetchTeacherFollowing = createAsyncThunk<
  ListResult<TeacherFollowing>,
  ListArgs,
  { rejectValue: string; state: RootState }
>('teacherFollow/fetchTeacherFollowing', async (args, { rejectWithValue, getState }) => {
  try {
    const { teacherId, page, limit } = args;
    const state = getState();

    const res = await axiosInstance.get(`/api/v1/teachers/${teacherId}/following`, {
      headers: { ...authHeaders(state) },
      params: { page, limit },
    });

    const norm = normalizeListResponse<TeacherFollowing>(res.data);

    return {
      teacherId: String(teacherId),
      items: norm.items,
      total: norm.total,
      page: norm.page ?? page,
      limit: norm.limit ?? limit,
    };
  } catch (error: any) {
    const msg =
      error?.response?.data?.message || error?.message || 'Failed to load teacher following';
    return rejectWithValue(msg);
  }
});

// get teacher following
export const fetchTeacherFollowingByUserId = createAsyncThunk<
  ListResult<TeacherFollowing>,
  { userId: number | string; page?: number; limit?: number },
  { rejectValue: string; state: RootState }
>('teacherFollow/fetchTeacherFollowingByUserId', async (args, { rejectWithValue, getState }) => {
  try {
    const { userId, page, limit } = args;
    const state = getState();

    const res = await axiosInstance.get(`/api/v1/teachers/user/${userId}/following`, {
      headers: { ...authHeaders(state) },
      params: { page, limit },
    });

    const norm = normalizeListResponse<TeacherFollowing>(res.data);

    return {
      teacherId: `user/${String(userId)}`,
      items: norm.items,
      total: norm.total,
      page: norm.page ?? page,
      limit: norm.limit ?? limit,
    };
  } catch (error: any) {
    const msg =
      error?.response?.data?.message || error?.message || 'Failed to load teacher following';
    return rejectWithValue(msg);
  }
});

// ====== Slice ======

const teacherFollowSlice = createSlice({
  name: 'teacherFollow',
  initialState,
  reducers: {
    clearTeacherFollowState(state) {
      state.followersByTeacherId = {};
      state.followingByTeacherId = {};
      state.followersTotalByTeacherId = {};
      state.followingTotalByTeacherId = {};
      state.isFollowingMap = {};
      state.loading = false;
      state.error = null;
    },
    setIsFollowing(state, action: PayloadAction<{ teacherId: string | number; value: boolean }>) {
      const { teacherId, value } = action.payload;
      state.isFollowingMap[String(teacherId)] = value;
    },
  },
  extraReducers: builder => {
    builder
      // follow
      .addCase(followTeacher.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(followTeacher.fulfilled, (state, action) => {
        state.loading = false;
        const { teacherId } = action.payload;
        state.isFollowingMap[teacherId] = true;
      })
      .addCase(followTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // unfollow
      .addCase(unfollowTeacher.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unfollowTeacher.fulfilled, (state, action) => {
        state.loading = false;
        const { teacherId } = action.payload;
        state.isFollowingMap[teacherId] = false;
      })
      .addCase(unfollowTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // followers list
      .addCase(fetchTeacherFollowers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherFollowers.fulfilled, (state, action) => {
        state.loading = false;
        const { teacherId, items, total } = action.payload;
        state.followersByTeacherId[teacherId] = items;
        if (typeof total === 'number') state.followersTotalByTeacherId[teacherId] = total;
      })
      .addCase(fetchTeacherFollowers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // following list (teacherId)
      .addCase(fetchTeacherFollowing.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherFollowing.fulfilled, (state, action) => {
        state.loading = false;
        const { teacherId, items, total } = action.payload;
        state.followingByTeacherId[teacherId] = items;
        if (typeof total === 'number') state.followingTotalByTeacherId[teacherId] = total;
      })
      .addCase(fetchTeacherFollowing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchTeacherFollowingByUserId.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherFollowingByUserId.fulfilled, (state, action) => {
        state.loading = false;
        const { teacherId, items, total } = action.payload;
        state.followingByTeacherId[teacherId] = items;
        if (typeof total === 'number') state.followingTotalByTeacherId[teacherId] = total;
      })
      .addCase(fetchTeacherFollowingByUserId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTeacherFollowState, setIsFollowing } = teacherFollowSlice.actions;

export default teacherFollowSlice.reducer;
