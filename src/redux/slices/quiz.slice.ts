import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const API_KEY = 'NestjsSuper@Elearning$2025';

const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

export interface CreateQuizPayload {
  title: string;
  description?: string;
  status: string;
}

export interface CreateQuestionPayload {
  content: string;
  explanation?: string;
}

export interface CreateOptionPayload {
  content: string;
  isCorrect: boolean;
  optionOrder?: number;
}

interface QuizPathArgs {
  courseId: number;
  moduleId: number;
  lessonId?: number;
}

interface QuizItemPathArgs extends QuizPathArgs {
  quizId: number;
}

const buildQuizItemPath = ({ courseId, moduleId, lessonId, quizId }: QuizItemPathArgs) => {
  if (lessonId != null) {
    return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}`;
  }
  return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/quizzes/${quizId}`;
};

const buildQuizPath = ({ courseId, moduleId, lessonId }: QuizPathArgs) => {
  if (lessonId != null) {
    return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes`;
  }
  return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/quizzes`;
};
interface QuestionItemPathArgs extends QuestionPathArgs {
  questionId: number;
}

const buildQuestionItemPath = ({
  courseId,
  moduleId,
  lessonId,
  quizId,
  questionId,
}: QuestionItemPathArgs) => {
  if (lessonId != null) {
    return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}/questions/${questionId}`;
  }
  return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/quizzes/${quizId}/questions/${questionId}`;
};

interface OptionItemPathArgs extends OptionPathArgs {
  optionId: number;
}

const buildOptionItemPath = ({
  courseId,
  moduleId,
  lessonId,
  quizId,
  questionId,
  optionId,
}: OptionItemPathArgs) => {
  if (lessonId != null) {
    return `${API_BASE_URL}/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}/questions/${questionId}/options/${optionId}`;
  }
  return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/quizzes/${quizId}/questions/${questionId}/options/${optionId}`;
};

// ================== LESSON LEVEL PATHS ==================

interface LessonQuizPathArgs {
  courseId: number;
  moduleId: number;
  lessonId: number;
}

interface LessonQuizItemPathArgs extends LessonQuizPathArgs {
  quizId: number;
}

const buildLessonQuizPath = ({ courseId, moduleId, lessonId }: LessonQuizPathArgs) =>
  `${API_BASE_URL}/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes`;

const buildLessonQuizItemPath = ({
  courseId,
  moduleId,
  lessonId,
  quizId,
}: LessonQuizItemPathArgs) =>
  `${API_BASE_URL}/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}`;

interface LessonQuestionPathArgs extends LessonQuizPathArgs {
  quizId: number;
}

interface LessonQuestionItemPathArgs extends LessonQuestionPathArgs {
  questionId: number;
}

const buildLessonQuestionPath = ({
  courseId,
  moduleId,
  lessonId,
  quizId,
}: LessonQuestionPathArgs) =>
  `${API_BASE_URL}/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}/questions`;

const buildLessonQuestionItemPath = ({
  courseId,
  moduleId,
  lessonId,
  quizId,
  questionId,
}: LessonQuestionItemPathArgs) =>
  `${API_BASE_URL}/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}/questions/${questionId}`;

interface LessonOptionPathArgs extends LessonQuestionPathArgs {
  questionId: number;
}

interface LessonOptionItemPathArgs extends LessonOptionPathArgs {
  optionId: number;
}

const buildLessonOptionPath = ({
  courseId,
  moduleId,
  lessonId,
  quizId,
  questionId,
}: LessonOptionPathArgs) =>
  `${API_BASE_URL}/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}/questions/${questionId}/options`;

const buildLessonOptionItemPath = ({
  courseId,
  moduleId,
  lessonId,
  quizId,
  questionId,
  optionId,
}: LessonOptionItemPathArgs) =>
  `${API_BASE_URL}/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}/questions/${questionId}/options/${optionId}`;

// List quizzes
export const listQuizzes = createAsyncThunk(
  'quiz/list',
  async (args: QuizPathArgs, { rejectWithValue }) => {
    try {
      const url = buildQuizPath(args);
      const res = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'List quizzes failed');
    }
  },
);

// Create quiz
export const createQuiz = createAsyncThunk(
  'quiz/create',
  async (
    {
      path,
      body,
    }: {
      path: QuizPathArgs;
      body: CreateQuizPayload;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildQuizPath(path);
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Create quiz failed');
    }
  },
);

// Update quiz
export const updateQuiz = createAsyncThunk(
  'quiz/update',
  async (
    {
      path,
      body,
    }: {
      path: QuizItemPathArgs;
      body: Partial<CreateQuizPayload>;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildQuizItemPath(path);
      const res = await axios.patch(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Update quiz failed');
    }
  },
);

// Delete quiz
export const deleteQuiz = createAsyncThunk(
  'quiz/delete',
  async (args: QuizItemPathArgs, { rejectWithValue }) => {
    try {
      const url = buildQuizItemPath(args);
      await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return { quizId: args.quizId };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Delete quiz failed');
    }
  },
);

interface QuestionPathArgs extends QuizPathArgs {
  quizId: number;
}

const buildQuestionPath = ({ courseId, moduleId, lessonId, quizId }: QuestionPathArgs) => {
  if (lessonId != null) {
    return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}/questions`;
  }
  return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/quizzes/${quizId}/questions`;
};

// List questions 1 quiz
export const listQuestions = createAsyncThunk(
  'quiz/listQuestions',
  async (args: QuestionPathArgs, { rejectWithValue }) => {
    try {
      const url = buildQuestionPath(args);
      const res = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'List questions failed');
    }
  },
);

// Create question
export const createQuestion = createAsyncThunk(
  'quiz/createQuestion',
  async (
    {
      path,
      body,
    }: {
      path: QuestionPathArgs;
      body: CreateQuestionPayload;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildQuestionPath(path);
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Create question failed');
    }
  },
);

// Update question
export const updateQuestion = createAsyncThunk(
  'quiz/updateQuestion',
  async (
    {
      path,
      body,
    }: {
      path: QuestionItemPathArgs;
      body: Partial<CreateQuestionPayload>;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildQuestionItemPath(path);
      const res = await axios.patch(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Update question failed');
    }
  },
);

// Delete question
export const deleteQuestion = createAsyncThunk(
  'quiz/deleteQuestion',
  async (args: QuestionItemPathArgs, { rejectWithValue }) => {
    try {
      const url = buildQuestionItemPath(args);
      await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return { questionId: args.questionId };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Delete question failed');
    }
  },
);

interface OptionPathArgs extends QuestionPathArgs {
  questionId: number;
}

const buildOptionPath = ({ courseId, moduleId, lessonId, quizId, questionId }: OptionPathArgs) => {
  if (lessonId != null) {
    return `${API_BASE_URL}/course/${courseId}/builder/modules/${moduleId}/lessons/${lessonId}/quizzes/${quizId}/questions/${questionId}/options`;
  }
  return `${API_BASE_URL}/courses/${courseId}/builder/modules/${moduleId}/quizzes/${quizId}/questions/${questionId}/options`;
};

// List options
export const listOptions = createAsyncThunk(
  'quiz/listOptions',
  async (args: OptionPathArgs, { rejectWithValue }) => {
    try {
      const url = buildOptionPath(args);
      const res = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'List options failed');
    }
  },
);

// Create option
export const createOption = createAsyncThunk(
  'quiz/createOption',
  async (
    {
      path,
      body,
    }: {
      path: OptionPathArgs;
      body: CreateOptionPayload;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildOptionPath(path);
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Create option failed');
    }
  },
);

// Update option
export const updateOption = createAsyncThunk(
  'quiz/updateOption',
  async (
    {
      path,
      body,
    }: {
      path: OptionItemPathArgs;
      body: Partial<CreateOptionPayload>;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildOptionItemPath(path);
      const res = await axios.patch(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Update option failed');
    }
  },
);

// Delete option
export const deleteOption = createAsyncThunk(
  'quiz/deleteOption',
  async (args: OptionItemPathArgs, { rejectWithValue }) => {
    try {
      const url = buildOptionItemPath(args);
      await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return { optionId: args.optionId };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message || 'Delete option failed');
    }
  },
);

// ================== LESSON LEVEL THUNKS ==================

// ----- Quiz theo lesson -----

export const listQuizzesByLesson = createAsyncThunk(
  'quiz/listByLesson',
  async (args: LessonQuizPathArgs, { rejectWithValue }) => {
    try {
      const url = buildLessonQuizPath(args);
      const res = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'List quizzes (lesson) failed',
      );
    }
  },
);

export const createQuizByLesson = createAsyncThunk(
  'quiz/createByLesson',
  async (
    {
      path,
      body,
    }: {
      path: LessonQuizPathArgs;
      body: CreateQuizPayload;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildLessonQuizPath(path);
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'Create quiz (lesson) failed',
      );
    }
  },
);

export const updateQuizByLesson = createAsyncThunk(
  'quiz/updateByLesson',
  async (
    {
      path,
      body,
    }: {
      path: LessonQuizItemPathArgs;
      body: Partial<CreateQuizPayload>;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildLessonQuizItemPath(path);
      const res = await axios.patch(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'Update quiz (lesson) failed',
      );
    }
  },
);

export const deleteQuizByLesson = createAsyncThunk(
  'quiz/deleteByLesson',
  async (args: LessonQuizItemPathArgs, { rejectWithValue }) => {
    try {
      const url = buildLessonQuizItemPath(args);
      await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return { quizId: args.quizId };
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'Delete quiz (lesson) failed',
      );
    }
  },
);

// ----- Question theo lesson -----

export const listQuestionsByLesson = createAsyncThunk(
  'quiz/listQuestionsByLesson',
  async (args: LessonQuestionPathArgs, { rejectWithValue }) => {
    try {
      const url = buildLessonQuestionPath(args);
      const res = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'List questions (lesson) failed',
      );
    }
  },
);

export const createQuestionByLesson = createAsyncThunk(
  'quiz/createQuestionByLesson',
  async (
    {
      path,
      body,
    }: {
      path: LessonQuestionPathArgs;
      body: CreateQuestionPayload;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildLessonQuestionPath(path);
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'Create question (lesson) failed',
      );
    }
  },
);

export const updateQuestionByLesson = createAsyncThunk(
  'quiz/updateQuestionByLesson',
  async (
    {
      path,
      body,
    }: {
      path: LessonQuestionItemPathArgs;
      body: Partial<CreateQuestionPayload>;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildLessonQuestionItemPath(path);
      const res = await axios.patch(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'Update question (lesson) failed',
      );
    }
  },
);

export const deleteQuestionByLesson = createAsyncThunk(
  'quiz/deleteQuestionByLesson',
  async (args: LessonQuestionItemPathArgs, { rejectWithValue }) => {
    try {
      const url = buildLessonQuestionItemPath(args);
      await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return { questionId: args.questionId };
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'Delete question (lesson) failed',
      );
    }
  },
);

// ----- Option theo lesson -----

export const listOptionsByLesson = createAsyncThunk(
  'quiz/listOptionsByLesson',
  async (args: LessonOptionPathArgs, { rejectWithValue }) => {
    try {
      const url = buildLessonOptionPath(args);
      const res = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'List options (lesson) failed',
      );
    }
  },
);

export const createOptionByLesson = createAsyncThunk(
  'quiz/createOptionByLesson',
  async (
    {
      path,
      body,
    }: {
      path: LessonOptionPathArgs;
      body: CreateOptionPayload;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildLessonOptionPath(path);
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'Create option (lesson) failed',
      );
    }
  },
);

export const updateOptionByLesson = createAsyncThunk(
  'quiz/updateOptionByLesson',
  async (
    {
      path,
      body,
    }: {
      path: LessonOptionItemPathArgs;
      body: Partial<CreateOptionPayload>;
    },
    { rejectWithValue },
  ) => {
    try {
      const url = buildLessonOptionItemPath(path);
      const res = await axios.patch(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'Update option (lesson) failed',
      );
    }
  },
);

export const deleteOptionByLesson = createAsyncThunk(
  'quiz/deleteOptionByLesson',
  async (args: LessonOptionItemPathArgs, { rejectWithValue }) => {
    try {
      const url = buildLessonOptionItemPath(args);
      await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          ...headers(),
        },
      });
      return { optionId: args.optionId };
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message || e.message || 'Delete option (lesson) failed',
      );
    }
  },
);

// ===== Slice =====

interface QuizFormState {
  quizzes: any[];
  questions: any[];
  options: any[];

  quizId?: number;
  questionId?: number;

  loading: boolean;
  error: string | null;
}

const initialState: QuizFormState = {
  quizzes: [],
  questions: [],
  options: [],
  loading: false,
  error: null,
};

const quizFormSlice = createSlice({
  name: 'quizForm',
  initialState,
  reducers: {
    resetQuizError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // List quizzes
      .addCase(listQuizzes.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        state.quizzes = action.payload.items || [];
      })
      .addCase(listQuizzes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create quiz
      .addCase(createQuiz.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.loading = false;
        state.quizId = action.payload.id;
        if (state.quizzes) {
          state.quizzes.push(action.payload);
        }
      })
      .addCase(createQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update quiz
      .addCase(updateQuiz.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuiz.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.quizzes.findIndex((q: any) => q.id === updated.id);
        if (idx !== -1) {
          state.quizzes[idx] = updated;
        }
      })
      .addCase(updateQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete quiz
      .addCase(deleteQuiz.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = (action.payload as any).quizId;
        state.quizzes = state.quizzes.filter((q: any) => q.id !== deletedId);
      })
      .addCase(deleteQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // List questions
      .addCase(listQuestions.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.items || [];
      })
      .addCase(listQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create question
      .addCase(createQuestion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questionId = action.payload.id;
        if (state.questions) {
          state.questions.push(action.payload);
        }
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update question
      .addCase(updateQuestion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.questions.findIndex((q: any) => q.id === updated.id);
        if (idx !== -1) {
          state.questions[idx] = updated;
        }
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete question
      .addCase(deleteQuestion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = (action.payload as any).questionId;
        state.questions = state.questions.filter((q: any) => q.id !== deletedId);
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // List options
      .addCase(listOptions.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listOptions.fulfilled, (state, action) => {
        state.loading = false;
        state.options = action.payload.items || [];
      })
      .addCase(listOptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create option
      .addCase(createOption.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOption.fulfilled, (state, action) => {
        state.loading = false;
        if (state.options) {
          state.options.push(action.payload);
        }
      })
      .addCase(createOption.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update option
      .addCase(updateOption.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOption.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.options.findIndex((o: any) => o.id === updated.id);
        if (idx !== -1) {
          state.options[idx] = updated;
        }
      })
      .addCase(updateOption.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete option
      .addCase(deleteOption.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOption.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = (action.payload as any).optionId;
        state.options = state.options.filter((o: any) => o.id !== deletedId);
      })
      .addCase(deleteOption.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      }) // List quizzes by lesson
      .addCase(listQuizzesByLesson.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listQuizzesByLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.quizzes = action.payload.items || [];
      })
      .addCase(listQuizzesByLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create quiz by lesson
      .addCase(createQuizByLesson.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuizByLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.quizId = action.payload.id;
        state.quizzes.push(action.payload);
      })
      .addCase(createQuizByLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update / Delete quiz by lesson
      .addCase(updateQuizByLesson.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.quizzes.findIndex((q: any) => q.id === updated.id);
        if (idx !== -1) state.quizzes[idx] = updated;
      })
      .addCase(updateQuizByLesson.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuizByLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteQuizByLesson.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuizByLesson.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = (action.payload as any).quizId;
        state.quizzes = state.quizzes.filter((q: any) => q.id !== deletedId);
      })
      .addCase(deleteQuizByLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetQuizError } = quizFormSlice.actions;
export default quizFormSlice.reducer;
