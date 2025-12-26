import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { PurchaseData } from '@/models/types/purchaseHistory.type';

interface PurchaseState {
  purchases: PurchaseData[];
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseState = {
  purchases: [],
  loading: false,
  error: null,
};

export const fetchPurchases = createAsyncThunk(
  'purchaseHistory/fetchPurchases',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`https://eduverseapi-production.up.railway.app/api/v1/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const mapped = res.data?.data?.results.map((order: any) => ({
        id: order.orderId,
        purchaseDate: order.date,
        price: order.price,
        status:
          order.status === 'Completed'
            ? 'Paid'
            : order.status === 'Cancelled'
              ? 'Cancelled'
              : 'Processing',
      }));

      return mapped;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error fetching purchases');
    }
  }
);

const purchaseSlice = createSlice({
  name: 'purchaseHistory',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchPurchases.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.purchases = action.payload;
      })
      .addCase(fetchPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default purchaseSlice.reducer;
