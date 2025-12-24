import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartCourse, CartItemProps } from '@/models/interface/cart.interface';
import axios from 'axios';
import { toast } from 'react-toastify';
import { logoutUser } from '@/core/store/user.slice';

interface CartState {
  items: CartItemProps[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

export const addCourseToCart = createAsyncThunk(
  'cart/addCourseToCart',
  async (
    { courseId, coupon }: { courseId: string | number; coupon?: string },
    { rejectWithValue },
  ) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Unauthorized');

      const cidNum = typeof courseId === 'string' ? parseInt(courseId, 10) : Number(courseId);
      if (!Number.isFinite(cidNum) || cidNum <= 0) throw new Error('Invalid courseId');

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // payload
      const body1: Record<string, any> = { courseId: cidNum };
      if (coupon) body1.couponCode = coupon;

      try {
        const res = await axios.post('http://localhost:8080/api/v1/cart', body1, { headers });
        window.dispatchEvent(new Event('cartUpdated'));
        return String(cidNum);
      } catch (err: any) {
        if (err?.response?.status !== 422) throw err;

        // fallback
        const body2: Record<string, any> = { course_id: cidNum, source: 'web' };
        if (coupon) body2.promotion_code = coupon;

        const res2 = await axios.post('http://localhost:8080/api/v1/cart', body2, { headers });
        window.dispatchEvent(new Event('cartUpdated'));
        return String(cidNum);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const beMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to add to cart';

      if (status === 401) {
        toast.error('Please login to continue.');
        setTimeout(() => (window.location.href = '/auth'), 800);
        return rejectWithValue('Unauthorized');
      }

      if (status === 409) {
        toast.info('Already in cart');
        return String(courseId);
      }

      if (status === 422) {
        toast.error(
          Array.isArray(error?.response?.data?.message)
            ? error.response.data.message.join(', ')
            : beMsg,
        );
      } else {
        toast.error(beMsg);
      }

      return rejectWithValue(beMsg);
    }
  },
);

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return rejectWithValue('Unauthorized');
    }

    const res = await axios.get('http://localhost:8080/api/v1/cart', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = res.data?.data ?? res.data ?? {};
    const items = Array.isArray(payload.items) ? payload.items : [];

    const cart: CartCourse[] = items.map((item: any, index: number) => {
      const priceRaw = item.final_price ?? item.course?.price ?? 0;
      const originalRaw = item.course?.price ?? 0;
      return {
        id: index,
        courseId: item.courseId ?? item.course_id,
        title: item.course?.title || 'Unknown title',
        author: item.course?.teacher?.fullname || 'Unknown author',
        rating: 0,
        ratingsCount: 0,
        lectures: 0,
        totalHours: 0,
        level: item.course?.level || 'All level',
        price: item.course?.isFree ? 0 : Number(priceRaw) || 0,
        originalPrice: Number(originalRaw) || 0,
        thumbnail: item.course?.thumbnail || '',
      };
    });

    return cart;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Fetch cart failed');
  }
});

export const clearCartOnServer = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Unauthorized');
      await axios.delete('http://localhost:8080/api/v1/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Clear cart failed');
    }
  },
);

export const buyNowCourse = createAsyncThunk(
  'cart/buyNowCourse',
  async (
    { courseId, couponCode }: { courseId: string | number; couponCode?: string },
    { rejectWithValue },
  ) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Unauthorized');

      const cidNum = typeof courseId === 'string' ? parseInt(courseId, 10) : Number(courseId);
      if (!Number.isFinite(cidNum) || cidNum <= 0) throw new Error('Invalid courseId');

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      const body: Record<string, any> = { courseId: cidNum };
      if (couponCode) body.couponCode = couponCode;

      const res = await axios.post('http://localhost:8080/api/v1/orders/buy-now', body, {
        headers,
      });

      const payload = res.data?.data ?? res.data ?? {};
      const { payUrl, deeplink, orderNumber } = payload;

      if (payUrl || deeplink) {
        window.location.href = payUrl ?? deeplink;
      } else {
        toast.error('Payment URL is missing in server response.');
        return rejectWithValue('Missing payUrl');
      }

      return { orderNumber };
    } catch (error: any) {
      const status = error?.response?.status;
      const beMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Buy now failed';

      if (status === 401) {
        toast.error('Please login to continue.');
        setTimeout(() => (window.location.href = '/auth'), 800);
        return rejectWithValue('Unauthorized');
      }

      toast.error(beMsg);
      return rejectWithValue(beMsg);
    }
  },
);
export const checkMomoPayment = createAsyncThunk(
  'cart/checkMomoPayment',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Unauthorized');

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      const res = await axios.get('http://localhost:8080/api/v1/orders/momo/return', {
        headers,
      });

      const payload = res.data?.data ?? res.data ?? {};
      const { status, orderNumber } = payload;

      if (status === 'Paid') {
        toast.success('Thanh toán MoMo thành công!');
        await dispatch(clearCartOnServer()).unwrap();
      } else {
        toast.error('Thanh toán MoMo không thành công.');
      }

      return { status, orderNumber };
    } catch (error: any) {
      const status = error?.response?.status;
      const beMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Kiểm tra thanh toán MoMo thất bại';

      if (status === 401) {
        toast.error('Vui lòng đăng nhập lại.');
        return rejectWithValue('Unauthorized');
      }

      toast.error(beMsg);
      return rejectWithValue(beMsg);
    }
  },
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItemProps>) => {
      state.items.push(action.payload);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.courseId !== action.payload);
    },
    clearCart: state => {
      state.items = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(logoutUser.fulfilled, () => initialState)

      .addCase(addCourseToCart.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCourseToCart.fulfilled, state => {
        state.loading = false;
      })
      .addCase(addCourseToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCart.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload as CartItemProps[];
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        if (action.payload === 'Unauthorized') {
          state.items = [];
        }
      })
      .addCase(clearCartOnServer.fulfilled, state => {
        state.items = [];
      })
      .addCase(clearCartOnServer.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(buyNowCourse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(buyNowCourse.fulfilled, state => {
        state.loading = false;
      })
      .addCase(buyNowCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkMomoPayment.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkMomoPayment.fulfilled, state => {
        state.loading = false;
      })
      .addCase(checkMomoPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
