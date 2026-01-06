import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

type Category = {
  id: string;
  name: string;
  description: string;
  parent_id?: string | null;
  createdAt: string;
  isActive: boolean;
};

type ListParams = {
  page: number;
  limit: number;
  sort_by?: 'created_at' | 'name';
  sort_order?: 'asc' | 'desc';
  keyword?: string;
};

type CategoryState = {
  items: Category[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  sort_by: 'created_at' | 'name';
  sort_order: 'asc' | 'desc';
  keyword: string;
};

const initialState: CategoryState = {
  items: [],
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  sort_by: 'created_at',
  sort_order: 'desc',
  keyword: '',
};

const API_PREFIX = '/api/v1/category';

const buildHeaders = () => {
  const token = localStorage.getItem('access_token');
  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  return headers;
};

const mapApiCategory = (cat: any): Category => ({
  id: String(cat.id ?? cat._id),
  name: cat.name,
  description: cat.description,
  parent_id: cat.parentCategoryId ?? cat.parent_id ?? undefined,
  createdAt: cat.createdAt ?? cat.created_at ?? '',
  isActive: cat.deletedAt ? false : (cat.isActive ?? cat.status ?? true),
});

// ================== Thunks ==================

export const fetchCategories = createAsyncThunk(
  'categories/fetch',
  async (params: Partial<ListParams> | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { categories: CategoryState };

      const page = params?.page ?? state.categories.page;
      const limit = params?.limit ?? state.categories.limit;

      const skip = (page - 1) * limit;
      const take = limit;

      const token = localStorage.getItem('access_token');
      const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (apiKey) headers['x-api-key'] = apiKey;

      const res = await axios.get('http://localhost:8080/api/v1/category', {
        params: { skip, take },
        headers,
      });

      const raw = Array.isArray(res.data?.data) ? res.data.data : [];

      const items: Category[] = raw.map(mapApiCategory);
      const total = raw.length; 

      return {
        items,
        total,
        params: {
          page,
          limit,
          sort_by: state.categories.sort_by,
          sort_order: state.categories.sort_order,
          keyword: state.categories.keyword,
        },
      };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch categories');
    }
  },
);

// Create category
export const createCategory = createAsyncThunk(
  'categories/create',
  async (
    payload: {
      name: string;
      description: string;
      parent_id?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const data: any = {
        name: payload.name,
        description: payload.description,
      };

      if (payload.parent_id && payload.parent_id.trim() !== '') {
        data.parentCategoryId = Number(payload.parent_id);
      }

      const res = await axios.post('http://localhost:8080/api/v1/category', data, {
        headers: buildHeaders(),
      });

      const created = res.data?.data ?? res.data;
      return mapApiCategory(created);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Create category failed' });
    }
  },
);

// Update category
export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const body: any = {
        name: data.name,
        description: data.description,
      };

      if (data.parent_id && data.parent_id.trim() !== '') {
        body.parentCategoryId = Number(data.parent_id);
      }

      const res = await axios.patch(`http://localhost:8080/api/v1/category/${id}`, body, {
        headers: buildHeaders(),
      });

      const updated = res.data?.data ?? res.data;
      return mapApiCategory(updated);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Update category failed' });
    }
  },
);

// Delete category
export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`http://localhost:8080/api/v1/category/${id}`, {
        headers: buildHeaders(),
      });

      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Delete category failed' });
    }
  },
);

// ================== Slice ==================

const slice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setPaging(state, action: PayloadAction<{ page?: number; limit?: number }>) {
      if (typeof action.payload.page === 'number') state.page = action.payload.page;
      if (typeof action.payload.limit === 'number') state.limit = action.payload.limit;
    },
    setSorting(
      state,
      action: PayloadAction<{
        sort_by?: CategoryState['sort_by'];
        sort_order?: CategoryState['sort_order'];
      }>,
    ) {
      if (action.payload.sort_by) state.sort_by = action.payload.sort_by;
      if (action.payload.sort_order) state.sort_order = action.payload.sort_order;
    },
    setKeyword(state, action: PayloadAction<string>) {
      state.keyword = action.payload;
      state.page = 1;
    },
  },
  extraReducers: builder => {
    builder
      // fetch
      .addCase(fetchCategories.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.params.page;
        state.limit = action.payload.params.limit;
        state.sort_by = action.payload.params.sort_by!;
        state.sort_order = action.payload.params.sort_order!;
        state.keyword = action.payload.params.keyword || '';
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Error';
      })

      // create
      .addCase(createCategory.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [action.payload, ...state.items];
        state.total += 1;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.message || 'Error';
      })

      // update
      .addCase(updateCategory.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.message || 'Error';
      })

      // delete
      .addCase(deleteCategory.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(i => i.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.message || 'Error';
      });
  },
});

export const { setPaging, setSorting, setKeyword } = slice.actions;
export default slice.reducer;
