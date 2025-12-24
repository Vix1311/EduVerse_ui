import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/v1/coupon';

const buildHeaders = () => {
  const token = localStorage.getItem('access_token');
  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (apiKey) headers['x-api-key'] = apiKey;

  return headers;
};

export type Coupon = {
  id: number;
  code: string;
  discountType: 'Fixed' | 'Percent' | string;
  discountAmount: number;
  maxUses: number;
  perUserLimit: number;
  expirationDate: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  courseId: number;
  createdById?: number | null;
  updatedById?: number | null;
};

export type CreateCouponPayload = {
  code?: string; 
  discountType: 'Fixed' | 'Percent' | string;
  discountAmount: number;
  maxUses: number;
  perUserLimit: number;
  expirationDate: string; // ISO string
  courseId: number;
};

type CouponState = {
  items: Coupon[];
  loading: boolean;
  error: string | null;
};

const initialState: CouponState = {
  items: [],
  loading: false,
  error: null,
};

// =============== THUNKS ===============

// get list of coupons
export const listCoupons = createAsyncThunk('coupon/list', async (_: void, { rejectWithValue }) => {
  try {
    const res = await axios.get(API_BASE, {
      headers: buildHeaders(),
    });

    const data = res.data;
    const items: Coupon[] = Array.isArray(data) ? data : (data?.data ?? []);

    return items;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message || e.message || 'List coupons failed');
  }
});

// Post coupon
export const createCoupon = createAsyncThunk(
  'coupon/create',
  async (payload: CreateCouponPayload, { rejectWithValue }) => {
    try {
      const res = await axios.post(API_BASE, payload, {
        headers: buildHeaders(),
      });

      const created: Coupon = res.data?.data ?? res.data;
      return created;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e.message || 'Create coupon failed');
    }
  },
);

// Patch coupon
export const updateCoupon = createAsyncThunk(
  'coupon/update',
  async ({ id, data }: { id: number; data: Partial<CreateCouponPayload> }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_BASE}/${id}`, data, {
        headers: buildHeaders(),
      });

      const updated: Coupon = res.data?.data ?? res.data;
      return updated;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e.message || 'Update coupon failed');
    }
  },
);

// Delete (soft delete) coupon
export const softDeleteCoupon = createAsyncThunk(
  'coupon/softDelete',
  async ({ id }: { id: number }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE}/${id}`, {
        headers: buildHeaders(),
      });

      return id;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message || e.message || 'Soft delete coupon failed',
      );
    }
  },
);

// =============== SLICE ===============

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(listCoupons.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload as Coupon[];
      })
      .addCase(listCoupons.rejected, (state, action) => {
        state.loading = false;
        state.items = [];
        state.error = (action.payload as string) || 'List coupons failed';
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        const coupon = action.payload as Coupon;
        if (coupon) state.items.unshift(coupon);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Create coupon failed';
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        const updated = action.payload as Coupon;
        const idx = state.items.findIndex(c => Number(c.id) === Number(updated.id));
        if (idx !== -1) state.items[idx] = updated;
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Update coupon failed';
      })
      .addCase(softDeleteCoupon.fulfilled, (state, action) => {
        const id = action.payload as number;
        const found = state.items.find(c => Number(c.id) === Number(id));
        if (found) {
          (found as any).deletedAt = new Date().toISOString();
        }
      })
      .addCase(softDeleteCoupon.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Soft delete coupon failed';
      });
  },
});

export default couponSlice.reducer;
