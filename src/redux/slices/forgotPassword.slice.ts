import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// send email
export const sendForgotPasswordEmail = createAsyncThunk(
  'auth/sendForgotPasswordEmail',
  async (email: string, { rejectWithValue }) => {
    try {
      await axios.post('http://localhost:8080/api/v1/auth/otp', {
        email,
        type: 'FORGOT_PASSWORD', 
      });
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Send OTP failed');
    }
  },
);

// forgot password 
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    {
      email,
      code,
      newPassword,
      confirmNewPassword,
    }: { email: string; code: string; newPassword: string; confirmNewPassword: string },
    { rejectWithValue },
  ) => {
    try {
      await axios.post('http://localhost:8080/api/v1/auth/forgot-password', {
        email,
        code,
        newPassword,
        confirmNewPassword,
      });
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Reset password failed');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    loading: false,
    error: '',
    success: false,
  },
  reducers: {
    clearAuthState: state => {
      state.error = '';
      state.success = false;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(sendForgotPasswordEmail.pending, state => {
        state.loading = true;
        state.error = '';
      })
      .addCase(sendForgotPasswordEmail.fulfilled, state => {
        state.loading = false;
        state.success = true;
      })
      .addCase(sendForgotPasswordEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resetPassword.pending, state => {
        state.loading = true;
        state.error = '';
      })
      .addCase(resetPassword.fulfilled, state => {
        state.loading = false;
        state.success = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;
