// src/redux/slices/hashtag.slice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1/hashtag';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
  'X-API-KEY': 'NestjsSuper@Elearning$2025',
});

export interface Hashtag {
  id: number;
  name: string;
}

interface HashtagState {
  items: Hashtag[];
  loading: boolean;
  error: string | null;
}

const initialState: HashtagState = {
  items: [],
  loading: false,
  error: null,
};

// Get hashtags
export const fetchHashtags = createAsyncThunk(
  'hashtag/list',
  async (_: void, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE_URL, {
        headers: authHeaders(),
      });

      const data = res.data?.items ?? res.data?.data ?? res.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || 'Fetch hashtags failed',
      );
    }
  },
);

// Post hashtag
export const createHashtag = createAsyncThunk(
  'hashtag/create',
  async (name: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        BASE_URL,
        { name },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      );

      const hashtag = res.data?.data ?? res.data;
      return hashtag as Hashtag;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || 'Create hashtag failed',
      );
    }
  },
);

// Patch hashtag
export const updateHashtag = createAsyncThunk(
  'hashtag/update',
  async ({ id, name }: { id: number; name: string }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `${BASE_URL}/${id}`,
        { name },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      );

      const hashtag = res.data?.data ?? res.data;
      return hashtag as Hashtag;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || 'Update hashtag failed',
      );
    }
  },
);

// Delete hashtag
export const deleteHashtag = createAsyncThunk(
  'hashtag/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE_URL}/${id}`, {
        headers: authHeaders(),
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || 'Delete hashtag failed',
      );
    }
  },
);

const hashtagSlice = createSlice({
  name: 'hashtag',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchHashtags.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHashtags.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload as Hashtag[];
      })
      .addCase(fetchHashtags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.items = [];
      })

      .addCase(createHashtag.fulfilled, (state, action) => {
        const created = action.payload as Hashtag;
        if (created && created.id != null) {
          const exists = state.items.some(h => Number(h.id) === Number(created.id));
          if (!exists) state.items.push(created);
        }
      })
      .addCase(createHashtag.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(updateHashtag.fulfilled, (state, action) => {
        const updated = action.payload as Hashtag;
        const idx = state.items.findIndex(h => Number(h.id) === Number(updated.id));
        if (idx >= 0) state.items[idx] = updated;
      })
      .addCase(updateHashtag.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(deleteHashtag.fulfilled, (state, action) => {
        const id = action.payload as number;
        state.items = state.items.filter(h => Number(h.id) !== Number(id));
      })
      .addCase(deleteHashtag.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export default hashtagSlice.reducer;
