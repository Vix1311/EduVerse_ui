import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export type ServerUser = {
  id: number;
  email: string;
  fullname: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  roleId: number;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  dateOfBirth?: string | null;
  username?: string | null;
  isApproved?: boolean;
  lockedUntil?: string | null;
};

export type UsersParams = {
  page?: number;
  limit?: number;
  search_by?: 'full_name' | 'email' | 'username';
  sort_by?: 'created_at' | 'full_name' | 'email';
  sort_order?: 'asc' | 'desc';
  role?: string;
  keyword?: string;
};

export type UsersResponse = {
  users: ServerUser[];
  total?: number;
  page?: number;
  limit?: number;
};

type UsersState = {
  items: ServerUser[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error?: string | null;
  teacherIds: number[];
};

const initialState: UsersState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  teacherIds: [],
};

export type UsersEnvelope = {
  statusCode: number;
  message: string;
  data: ServerUser[];
  dateTime?: string;
  messageConstants?: unknown;
};

export type TeacherItem = {
  id: number;
  fullname: string;
  avatar?: string | null;
};

export type TeachersListResponse = {
  total: number;
  skip: number;
  take: number;
  items: TeacherItem[];
};

// GET users
export const fetchUsers = createAsyncThunk<UsersResponse, UsersParams | void>(
  'users/fetchUsers',
  async params => {
    const token = localStorage.getItem('access_token');

    const res = await axios.get<UsersEnvelope>('https://eduverseapi-production.up.railway.app/api/v1/auth', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      params,
    });

    const payload = res.data.data;
    console.log('Fetched users:', payload);

    return {
      users: payload,
      total: payload.length,
      page: 1,
      limit: payload.length,
    };
  },
);

// Disable user
export const disableUser = createAsyncThunk(
  'admin/disableUser',
  async ({ userId, reason }: { userId: string; reason: string }) => {
    const token = localStorage.getItem('access_token');

    const res = await fetch('https://eduverseapi-production.up.railway.app/api/v1/admin/disable-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        target_user_id: userId,
        reason,
      }),
    });
    return await res.json();
  },
);

// Enable user
export const enableUser = createAsyncThunk('admin/enableUser', async (userId: string) => {
  const token = localStorage.getItem('access_token');

  const res = await fetch('https://eduverseapi-production.up.railway.app/api/v1/admin/enable-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      target_user_id: userId,
    }),
  });
  return await res.json();
});

// Approve teacher
export const approveTeacher = createAsyncThunk(
  'users/approveTeacher',
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        'https://eduverseapi-production.up.railway.app/api/v1/admin/approve-teacher',
        { target_user_id: userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return { userId, data: res.data };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Approve failed' });
    }
  },
);

// Reset user password
export const resetUserPassword = createAsyncThunk(
  'admin/resetUserPassword',
  async (
    {
      userId,
      newPassword,
      confirmPassword,
    }: { userId: string; newPassword: string; confirmPassword: string },
    { rejectWithValue },
  ) => {
    try {
      const token = localStorage.getItem('access_token');

      const res = await axios.post(
        'https://eduverseapi-production.up.railway.app/api/v1/admin/reset-password',
        {
          target_user_id: userId,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Reset failed' });
    }
  },
);

// Lock user
export const lockUser = createAsyncThunk(
  'users/lockUser',
  async (
    {
      userId,
      durationMinutes,
      until,
      reason,
    }: { userId: string; durationMinutes?: number; until?: string; reason: string },
    { rejectWithValue },
  ) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.put(
        `https://eduverseapi-production.up.railway.app/api/v1/auth/${userId}/lock`,
        {
          durationMinutes,
          until,
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return { userId, data: res.data, until };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Lock user failed' });
    }
  },
);

// Unlock user
export const unlockUser = createAsyncThunk(
  'users/unlockUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.put(
        `https://eduverseapi-production.up.railway.app/api/v1/auth/${userId}/unlock`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return { userId, data: res.data };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Unlock user failed' });
    }
  },
);

// Create violation
export const createUserViolation = createAsyncThunk(
  'users/createUserViolation',
  async (
    {
      userId,
      reason,
      violationType,
      actionTaken,
      lockDurationDays,
    }: {
      userId: string;
      reason: string;
      violationType: string;
      actionTaken: string;
      lockDurationDays?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        `https://eduverseapi-production.up.railway.app/api/v1/auth/${userId}/violations`,
        {
          reason,
          violationType,
          actionTaken,
          lockDurationDays,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return { userId, data: res.data, lockDurationDays, actionTaken };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Create violation failed' });
    }
  },
);

// Fetch teachers
export const fetchTeachers = createAsyncThunk<TeachersListResponse, void>(
  'users/fetchTeachers',
  async () => {
    const token = localStorage.getItem('access_token');

    const res = await axios.get<TeachersListResponse>(
      'https://eduverseapi-production.up.railway.app/api/v1/users/teachers',
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    );
    console.log('Fetched teachers:', res.data);
    return res.data;
  },
);

export const changeUserRole = createAsyncThunk<
  any,
  { userId: string; roleId: number },
  { rejectValue: string }
>('users/changeUserRole', async ({ userId, roleId }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('access_token');

    const res = await axios.put(
      `https://eduverseapi-production.up.railway.app/api/v1/role/users/${userId}/roles`,
      { roleId },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Change role failed');
  }
});

// Approve seller -> instructor
export const ensureTeacher = createAsyncThunk(
  'users/ensureTeacher',
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');

      const res = await axios.post(
        `https://eduverseapi-production.up.railway.app/api/v1/users/${userId}/ensure-teacher`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return { userId, data: res.data };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Ensure teacher failed' });
    }
  },
);

export const approveInstructor = createAsyncThunk<
  any,
  { userId: string; currentRoleId: number },
  { rejectValue: string }
>('users/approveInstructor', async ({ userId, currentRoleId }, { dispatch, rejectWithValue }) => {
  try {
    if (Number(currentRoleId) === 1) {
      await dispatch(changeUserRole({ userId, roleId: 2 })).unwrap();
    }

    await dispatch(ensureTeacher(userId)).unwrap();

    return { userId };
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Approve instructor failed');
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setPaging(state, action: PayloadAction<{ page?: number; limit?: number }>) {
      if (action.payload.page) state.page = action.payload.page;
      if (action.payload.limit) state.limit = action.payload.limit;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUsers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.users ?? [];
        state.total = action.payload.total ?? state.items.length;
        state.page = action.payload.page ?? state.page;
        state.limit = action.payload.limit ?? state.limit;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Fetch users failed';
      })
      .addCase(disableUser.fulfilled, (state, action) => {
        const userId = action.meta.arg.userId;
        const u = state.items.find(x => String(x.id) === String(userId));
        if (u) u.status = 'INACTIVE';
      })
      .addCase(enableUser.fulfilled, (state, action) => {
        const userId = action.meta.arg as string;
        const u = state.items.find(x => String(x.id) === String(userId));
        if (u) u.status = 'ACTIVE';
      })
      .addCase(approveTeacher.fulfilled, (state, action) => {
        const userId = action.meta.arg as string;
        const u = state.items.find(x => String(x.id) === String(userId));
        if (u) u.isApproved = true;
      })
      .addCase(lockUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(lockUser.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, until } = action.payload;
        const u = state.items.find(x => String(x.id) === String(userId));
        if (u) {
          u.status = 'LOCKED';
          if (until) u.lockedUntil = until;
        }
      })
      .addCase(lockUser.rejected, (state, action) => {
        state.loading = false;
        const payload: any = action.payload;
        state.error = payload?.message ?? action.error.message ?? 'Lock user failed';
      })
      .addCase(unlockUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unlockUser.fulfilled, (state, action) => {
        state.loading = false;
        const userId = action.meta.arg as string;
        const u = state.items.find(x => String(x.id) === String(userId));
        if (u) {
          u.status = 'ACTIVE';
          u.lockedUntil = null;
        }
      })
      .addCase(unlockUser.rejected, (state, action) => {
        state.loading = false;
        const payload: any = action.payload;
        state.error = payload?.message ?? action.error.message ?? 'Unlock user failed';
      })
      .addCase(createUserViolation.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserViolation.fulfilled, (state, action) => {
        state.loading = false;
        const { lockDurationDays, actionTaken } = action.payload;
        const userId = action.meta.arg.userId;
        const u = state.items.find(x => String(x.id) === String(userId));
        if (u && lockDurationDays && actionTaken !== 'Warning') {
          u.status = 'LOCKED';
        }
      })
      .addCase(createUserViolation.rejected, (state, action) => {
        state.loading = false;
        const payload: any = action.payload;
        state.error = payload?.message ?? action.error.message ?? 'Create violation failed';
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.teacherIds = action.payload.items.map(t => t.id);
      })
      .addCase(ensureTeacher.fulfilled, (state, action) => {
        const userId = Number(action.payload.userId);
        if (!state.teacherIds.includes(userId)) state.teacherIds.push(userId);
      });
  },
});

export const { setPaging } = usersSlice.actions;
export default usersSlice.reducer;
