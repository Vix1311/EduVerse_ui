import axiosClient from '@/core/services/axios-client';
import { Account, LoginResponse, RegisterReponse } from '@/models/interface/auth.interface';

const API_LOGIN_URL = 'https://eduverseapi-production.up.railway.app/api/v1/auth/login';
const API_REGISTER_URL = 'https://eduverseapi-production.up.railway.app/api/v1/auth/register';
const API_SEND_OTP_URL = 'https://eduverseapi-production.up.railway.app/api/v1/auth/otp';
const API_LOGIN_GOOGLE_URL = 'https://eduverseapi-production.up.railway.app/api/v1/auth/google';
const API_LOGIN_FACEBOOK_URL = 'https://eduverseapi-production.up.railway.app/api/v1/auth/facebook';

export const authApi = {
  login(params: Account): Promise<LoginResponse> {
    return axiosClient.post(API_LOGIN_URL, params);
  },
  register(params: Account): Promise<RegisterReponse> {
    return axiosClient.post(API_REGISTER_URL, params);
  },
  sendOtp(payload: { email: string; type: 'REGISTER' }) {
    return axiosClient.post(API_SEND_OTP_URL, payload);
  },
  loginWithGoogle(): Promise<{ url: string }> {
    return axiosClient.get(API_LOGIN_GOOGLE_URL);
  },

  loginWithFacebook(): Promise<{ url: string }> {
    return axiosClient.get(API_LOGIN_FACEBOOK_URL);
  },
};
