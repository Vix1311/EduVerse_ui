import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { Category } from '@/models/interface/category.interface';

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk<Category[]>(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('https://eduverseapi-production.up.railway.app/api/v1/category');
      const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      const normalized: Category[] = raw.map((c: any) => ({
        _id: String(c.id ?? c._id ?? ''),
        name: c.name ?? 'Unknown',
        description: c.description ?? '',
        parentCategoryId: c.parentCategoryId ?? null,
        createdAt: c.createdAt ?? null,
        updatedAt: c.updatedAt ?? null,
        id: c.id ?? null, 
        link: c.link ?? '',
      }));
      normalized.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      return normalized;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to fetch categories') as any;
    }
  },
);

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchCategories.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch categories';
      });
  },
});

export default categorySlice.reducer;
