import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface LessonNoteItem {
  id: number;
  userId: number;
  courseId: number;
  lessonId: number;
  content: string;
  timestampSec: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LessonNoteState {
  notesByLesson: Record<string, LessonNoteItem[]>;
  loadingByLesson: Record<string, boolean>;
  creating: boolean;
  error: string | null;
}

const initialState: LessonNoteState = {
  notesByLesson: {},
  loadingByLesson: {},
  creating: false,
  error: null,
};

const sortNotes = (notes: LessonNoteItem[]) =>
  [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
    return a.timestampSec - b.timestampSec;
  });

export const fetchLessonNotes = createAsyncThunk(
  'lessonNote/fetchLessonNotes',
  async (
    { lessonId, skip = 0, take = 100 }: { lessonId: string; skip?: number; take?: number },
    { rejectWithValue },
  ) => {
    const token = localStorage.getItem('access_token');

    try {
      const res = await axios.get(
        `https://edu-verse-api-rho.vercel.app/api/v1/lessons/${lessonId}/notes?skip=${skip}&take=${take}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const items = res.data?.items || res.data?.data?.items || [];
      return {
        lessonId,
        items: sortNotes(items),
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to fetch lesson notes';
      return rejectWithValue(msg);
    }
  },
);

export const createLessonNote = createAsyncThunk(
  'lessonNote/createLessonNote',
  async (
    {
      lessonId,
      content,
      timestampSec,
    }: {
      lessonId: string;
      content: string;
      timestampSec: number;
    },
    { rejectWithValue },
  ) => {
    const token = localStorage.getItem('access_token');

    try {
      const res = await axios.post(
        `https://edu-verse-api-rho.vercel.app/api/v1/lessons/${lessonId}/notes`,
        {
          content,
          timestampSec,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const note = res.data?.data || res.data;
      return { lessonId, note };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create lesson note';
      return rejectWithValue(msg);
    }
  },
);

export const pinLessonNote = createAsyncThunk(
  'lessonNote/pinLessonNote',
  async (
    {
      lessonId,
      noteId,
      isPinned,
    }: {
      lessonId: string;
      noteId: number;
      isPinned: boolean;
    },
    { rejectWithValue },
  ) => {
    const token = localStorage.getItem('access_token');

    try {
      const res = await axios.patch(
        `https://edu-verse-api-rho.vercel.app/api/v1/notes/${noteId}/pin`,
        { isPinned },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const note = res.data?.data || res.data;
      return { lessonId, note };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update pin status';
      return rejectWithValue(msg);
    }
  },
);

export const deleteLessonNote = createAsyncThunk(
  'lessonNote/deleteLessonNote',
  async (
    {
      lessonId,
      noteId,
    }: {
      lessonId: string;
      noteId: number;
    },
    { rejectWithValue },
  ) => {
    const token = localStorage.getItem('access_token');

    try {
      await axios.delete(`https://edu-verse-api-rho.vercel.app/api/v1/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { lessonId, noteId };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete lesson note';
      return rejectWithValue(msg);
    }
  },
);

const lessonNoteSlice = createSlice({
  name: 'lessonNote',
  initialState,
  reducers: {
    clearLessonNotes(state, action: PayloadAction<string>) {
      delete state.notesByLesson[action.payload];
      delete state.loadingByLesson[action.payload];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchLessonNotes.pending, (state, action) => {
        state.loadingByLesson[action.meta.arg.lessonId] = true;
        state.error = null;
      })
      .addCase(fetchLessonNotes.fulfilled, (state, action) => {
        state.loadingByLesson[action.payload.lessonId] = false;
        state.notesByLesson[action.payload.lessonId] = action.payload.items;
      })
      .addCase(fetchLessonNotes.rejected, (state, action) => {
        state.loadingByLesson[action.meta.arg.lessonId] = false;
        state.error = action.payload as string;
      })

      .addCase(createLessonNote.pending, state => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createLessonNote.fulfilled, (state, action) => {
        state.creating = false;
        const current = state.notesByLesson[action.payload.lessonId] || [];
        state.notesByLesson[action.payload.lessonId] = sortNotes([
          ...current,
          action.payload.note,
        ]);
      })
      .addCase(createLessonNote.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })

      .addCase(pinLessonNote.fulfilled, (state, action) => {
        const current = state.notesByLesson[action.payload.lessonId] || [];
        state.notesByLesson[action.payload.lessonId] = sortNotes(
          current.map(note =>
            note.id === action.payload.note.id ? action.payload.note : note,
          ),
        );
      })
      .addCase(pinLessonNote.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(deleteLessonNote.fulfilled, (state, action) => {
        const current = state.notesByLesson[action.payload.lessonId] || [];
        state.notesByLesson[action.payload.lessonId] = current.filter(
          note => note.id !== action.payload.noteId,
        );
      })
      .addCase(deleteLessonNote.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearLessonNotes } = lessonNoteSlice.actions;
export default lessonNoteSlice.reducer;