import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const verifyEmailOtp = createAsyncThunk(
  'emailVerification/verify',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post('https://eduverseapi-production.up.railway.app/api/v1/auth/verify-email', {
        email,
        otp,
      });

      if (res.data?.statusCode === 200) {
        return true;
      } else {
        return rejectWithValue('OTP code is incorrect or expired.');
      }
    } catch (err: any) {
      return rejectWithValue('Error while verifying OTP.');
    }
  }
);

export const resendEmailOtp = createAsyncThunk(
  'emailVerification/resend',
  async (email: string, { rejectWithValue }) => {
    try {
      const res = await axios.post('https://eduverseapi-production.up.railway.app/api/v1/auth/resend-otp', { email });

      if (res.data.success) {
        return true;
      } else {
        return rejectWithValue('Unable to resend OTP code');
      }
    } catch (err: any) {
      return rejectWithValue('An error occurred while resending the OTP code.');
    }
  }
);

const emailVerificationSlice = createSlice({
  name: 'emailVerification',
  initialState: {
    loading: false,
    error: '',
    success: false,
  },
  reducers: {
    clearVerificationState: state => {
      state.loading = false;
      state.error = '';
      state.success = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(verifyEmailOtp.pending, state => {
        state.loading = true;
        state.error = '';
      })
      .addCase(verifyEmailOtp.fulfilled, state => {
        state.loading = false;
        state.success = true;
      })
      .addCase(verifyEmailOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resendEmailOtp.pending, state => {
        state.loading = true;
        state.error = '';
      })
      .addCase(resendEmailOtp.fulfilled, state => {
        state.loading = false;
        state.success = true;
      })
      .addCase(resendEmailOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearVerificationState } = emailVerificationSlice.actions;
export default emailVerificationSlice.reducer;
