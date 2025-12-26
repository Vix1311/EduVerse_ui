import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { clearTokenFromLS, getAccessTokenFromLS } from '@/core/shared/storage';
import { RootState } from './store';
import { toast } from 'react-toastify';

export interface MinimalUserProfile {
  id: number;
  full_name: string;
  email: string;
  avatar: string;
  cover_photo: string;
  role?: { id: number; name: string };
  roles?: string[];
}

interface UserState {
  user: MinimalUserProfile | null;
  loading: boolean;
}

const initialState: UserState = {
  user: null,
  loading: false,
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    const token = getAccessTokenFromLS();
    if (!token) return rejectWithValue('No token');

    try {
      const res = await axios.get('https://eduverseapi-production.up.railway.app/api/v1/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res?.data?.data ?? res?.data ?? {};
      const profile: MinimalUserProfile = {
        id: Number(data.id),
        full_name: data.fullname ?? '',
        email: data.email ?? '',
        avatar: data.avatar ?? 'src/assets/icons/user.png',
        cover_photo: data.cover_photo ?? '',
        role: data.role ? { id: Number(data.role.id), name: String(data.role.name) } : undefined,
        roles: Array.isArray(data.roles) ? data.roles : undefined,
      };

      return profile;
    } catch (error: any) {
      if (error.response?.status === 401) {
        clearTokenFromLS();
      }
      return rejectWithValue(error?.response?.data?.message || 'Fetch failed');
    }
  },
);

export const logoutUser = createAsyncThunk('user/logout', async (_, { rejectWithValue }) => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('Missing refresh token');

    await axios.post('https://eduverseapi-production.up.railway.app/api/v1/auth/logout', {
      refresh_token: refreshToken,
    });

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role_id');
  } catch (error) {
    return rejectWithValue('Logout failed');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: state => {
      state.user = null;
      localStorage.removeItem('role_id');
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUserProfile.pending, state => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;

        const rid = action.payload?.role?.id;
        if (typeof rid === 'number' && Number.isFinite(rid)) {
          localStorage.setItem('role_id', String(rid));
        }
      })
      .addCase(fetchUserProfile.rejected, state => {
        state.user = null;
        state.loading = false;
      })
      .addCase(logoutUser.fulfilled, state => {
        state.user = null;
        state.loading = false;
      });
  },
});

export const { clearUser } = userSlice.actions;

export const selectUser = (state: RootState) => state.user.user;
export const selectUserLoading = (state: RootState) => state.user.loading;
export default userSlice.reducer;
