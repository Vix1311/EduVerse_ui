import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '@/core/store/store';

export interface Instructor {
  id: number;
  fullname: string;
  avatar: string | null;
}

interface InstructorListResponse {
  total: number;
  skip: number;
  take: number;
  items: Instructor[];
}

interface InstructorState {
  items: Instructor[];
  total: number;
  skip: number;
  take: number;
  loading: boolean;
  error: string | null;
}

const initialState: InstructorState = {
  items: [],
  total: 0,
  skip: 0,
  take: 10,
  loading: false,
  error: null,
};

export const fetchInstructors = createAsyncThunk<
  InstructorListResponse,
  { skip?: number; take?: number } | void
>('instructors/fetchList', async args => {
  const skip = args?.skip ?? 0;
  const take = args?.take ?? 10;

  const res = await axios.get('https://eduverseapi-production.up.railway.app/api/v1/users/teachers', {
    params: { skip, take },
  });

  const data = (res?.data?.data ?? res?.data) as InstructorListResponse;

  return {
    total: Number(data.total ?? 0),
    skip: Number(data.skip ?? skip),
    take: Number(data.take ?? take),
    items: Array.isArray(data.items) ? data.items : [],
  };
});

const instructorSlice = createSlice({
  name: 'instructors',
  initialState,
  reducers: {
    setPaging(state, action: PayloadAction<{ skip: number; take: number }>) {
      state.skip = action.payload.skip;
      state.take = action.payload.take;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchInstructors.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.skip = action.payload.skip;
        state.take = action.payload.take;
      })
      .addCase(fetchInstructors.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.error?.message as string) || 'Fetch instructors failed';
      });
  },
});

export const { setPaging, reset } = instructorSlice.actions;

export const selectInstructors = (s: RootState) => s.instructors.items;
export const selectInstructorPaging = (s: RootState) => ({
  total: s.instructors.total,
  skip: s.instructors.skip,
  take: s.instructors.take,
});
export const selectInstructorLoading = (s: RootState) => s.instructors.loading;
export const selectInstructorError = (s: RootState) => s.instructors.error;

export default instructorSlice.reducer;
