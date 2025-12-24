import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getAccessTokenFromLS } from '@/core/shared/storage';

interface UserProfile {
  fullname?: string;
  username?: string;
  email?: string;
  avatar?: string;
  coverPhoto?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  experience?: string;
  country?: string;
  timezone?: string;
  headline?: string;
  biography?: string;
  language?: string;
  interests?: string[];
  social_links?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  role?: { id: number; name: string } | string;
}

interface UserProfileState {
  data: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserProfileState = {
  data: null,
  loading: false,
  error: null,
};

// Fetch user profile
export const fetchUserProfile = createAsyncThunk('userProfile/fetch', async (_, thunkAPI) => {
  try {
    const token = getAccessTokenFromLS();
    if (!token) return thunkAPI.rejectWithValue('No token');

    const res = await axios.get('http://localhost:8080/api/v1/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const raw = res?.data ?? {};
    const data: any = raw?.data ?? raw;

    const normalized: UserProfile = {
      fullname: data.fullname ?? data.full_name ?? '',
      email: data.email ?? '',
      username: data.username ?? '',
      avatar: data.avatar ?? 'src/assets/icons/user.png',
      // coverPhoto: data.coverPhoto ?? data.cover_photo ?? 'src/assets/icons/user.png',
      dateOfBirth: data.dateOfBirth ?? data.date_of_birth ?? '',
      gender: data.gender ?? '',
      phoneNumber: data.phoneNumber ?? data.phone_number ?? '',
      experience: data.experience ?? '',
      country: data.country ?? '',
      timezone: data.timezone ?? '',
      headline: data.headline ?? '',
      biography: data.biography ?? data.bio ?? '',
      language: data.language ?? '',
      interests: data.interests ?? [],
      social_links: data.social_links ?? {},
      role: data.role ?? undefined,
    };

    return normalized;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to fetch user profile');
  }
});

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'userProfile/update',
  async (formData: any, thunkAPI) => {
    try {
      const token = getAccessTokenFromLS();
      if (!token) return thunkAPI.rejectWithValue('No token found');

      const payload = {
        fullname: `${formData.firstName} ${formData.lastName}`,
        username: formData.username || '',
        phoneNumber: formData.phone_number || '',
        avatar: formData.profileImage || '',
        dateOfBirth: formData.date_of_birth || '',
      };

      await axios.patch('http://localhost:8080/api/v1/auth/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return payload;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to update profile');
    }
  },
);

// Upload avatar / cover
export const uploadUserImage = createAsyncThunk(
  'userProfile/uploadAvatar',
  async (file: File, thunkAPI) => {
    try {
      const token = getAccessTokenFromLS();
      if (!token) return thunkAPI.rejectWithValue('No token');

      const form = new FormData();
      form.append('file', file);

      const res = await axios.post('http://localhost:8080/api/v1/auth/avatar', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      // backend trả về url thật?
      const uploadedUrl = res?.data?.url || res?.data?.data?.url || URL.createObjectURL(file);

      return uploadedUrl;
    } catch (err) {
      return thunkAPI.rejectWithValue('Failed to upload avatar');
    }
  },
);

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUserProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload as UserProfile;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Fetch failed';
        state.data = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.data = { ...(state.data || {}), ...(action.payload as UserProfile) };
      })
      .addCase(uploadUserImage.fulfilled, (state, action) => {
        if (!state.data) state.data = {};
        state.data.avatar = action.payload as string;
      });
  },
});

export default userProfileSlice.reducer;
