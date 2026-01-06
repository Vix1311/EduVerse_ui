import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

type Category = {
  id: number;
  name: string;
  description?: string | null;
  parentCategoryId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  slug?: string;
  _id?: string;
};

export const searchCategories = createAsyncThunk(
  'category/search',
  async (keyword: string, thunkAPI) => {
    try {
      const text = keyword?.trim() ?? '';
      if (!text) return [];

      const skip = 0;
      const take = 20;

      const res = await axios.get(
        `http://localhost:8080/api/v1/category?text=${encodeURIComponent(text)}&skip=${skip}&take=${take}`,
      );

      const list = res.data?.data;
      return Array.isArray(list) ? (list as Category[]) : [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  },
);

interface CategorySearchState {
  data: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategorySearchState = {
  data: [],
  loading: false,
  error: null,
};

const categorySearchSlice = createSlice({
  name: 'categorySearch',
  initialState,
  reducers: {
    clearSearchResults: state => {
      state.data = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(searchCategories.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(searchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Request failed';
      });
  },
});

export const { clearSearchResults } = categorySearchSlice.actions;
export default categorySearchSlice.reducer;
