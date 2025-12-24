import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  CourseOverview,
  LessonCommentsById,
  RatingCounts,
  Review,
} from '@/models/interface/courseTabs.interface';
import { Topic } from '@/models/interface/courseSidebar.interface';
import { Quiz } from '@/models/interface/quiz.interface';
import { showLoading, hideLoading } from './ui.slice';

interface CoursePlayerState {
  courseDetail: CourseOverview | null;
  topics: Topic[];
  quiz: Quiz | null;
  quizQuestions: any[];
  commentsByLesson: LessonCommentsById;
  reviews: Review[];
  ratingCounts: RatingCounts;
  loading: boolean;
  error: string | null;
  lessonReviewsMap: any;
}

const initialState: CoursePlayerState = {
  courseDetail: null,
  topics: [],
  quiz: null,
  quizQuestions: [],
  commentsByLesson: {} as Record<string, { title: string; comments: Review[] }>,
  reviews: [],
  ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  loading: false,
  error: null,
  lessonReviewsMap: {},
};
const authHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchCourseDetail = createAsyncThunk(
  'coursePlayer/fetchCourseDetail',
  async (courseId: string, { rejectWithValue, dispatch }) => {
    try {
      dispatch(showLoading());

      // 1) Course info for student
      const studyRes = await axios.get(`http://localhost:8080/api/v1/course/${courseId}/study`, {
        headers: authHeaders(),
      });

      const studyData = studyRes.data?.data ?? studyRes.data ?? {};
      const enrollment = studyData.enrollment ?? {};

      // 2) Modules (chapters)
      const modulesRes = await axios.get(
        `http://localhost:8080/api/v1/course/${courseId}/modules`,
        {
          headers: authHeaders(),
          params: { skip: 0, take: 100 },
        },
      );

      let rawModules: any[] =
        modulesRes.data?.items ?? modulesRes.data?.data?.items ?? modulesRes.data?.data ?? [];

      let rm: any = rawModules as any;
      if (!Array.isArray(rm)) rm = rm?.items ?? rm?.results ?? [];
      rawModules = rm;
      // 3) For each module -> get lessons list, then each lesson detail
      const topics: Topic[] = [];

      for (const module of rawModules) {
        const moduleId = module.id ?? module.moduleId ?? module._id;
        if (!moduleId) continue;

        // 3.1: list lessons in this module
        const lessonsRes = await axios.get(
          `http://localhost:8080/api/v1/study/modules/${moduleId}/lessons`,
          {
            headers: authHeaders(),
            params: { skip: 0, take: 100 },
          },
        );

        let rawLessons: any[] =
          lessonsRes.data?.items ?? lessonsRes.data?.data?.items ?? lessonsRes.data?.data ?? [];

        let rl: any = rawLessons as any;
        if (!Array.isArray(rl)) rl = rl?.items ?? rl?.results ?? [];
        rawLessons = rl;
        // 3.2: get detail (videoUrl, documentUrl) for each lesson
        const lessons: any[] = [];

        for (const l of rawLessons) {
          const lessonId = l.id ?? l.lessonId ?? l._id;
          if (!lessonId) continue;

          const detailRes = await axios.get(
            `http://localhost:8080/api/v1/study/lessons/${lessonId}`,
            { headers: authHeaders() },
          );

          const d = detailRes.data?.data ?? detailRes.data ?? {};

          const videoUrl = d.videoUrl || d.video_url || l.videoUrl || l.video_url || '';
          const documentUrl = d.documentUrl || d.document_url || l.documentUrl || '';

          const lessonObj = {
            _id: String(lessonId),

            title: d.title ?? l.title ?? '',

            video_url: videoUrl,
            videoUrl,

            documentUrl,
            document_urls: documentUrl
              ? [
                  {
                    url: documentUrl,
                    original_name: d.title + '.doc',
                  },
                ]
              : [],

            isPreviewable: d.isPreviewable ?? l.isPreviewable ?? false,
            isCompleted: d.isCompleted ?? l.isCompleted ?? false,
            lessonOrder: d.lessonOrder ?? l.lessonOrder ?? 1,
          };

          lessons.push(lessonObj);
        }

        topics.push({
          _id: String(moduleId),
          id: moduleId,
          title: module.title ?? '',
          description: module.description ?? '',
          order: module.chapterOrder ?? module.order ?? 1,
          lessons,
        } as unknown as Topic);
      }

      const totalLessonsFromTopics = topics.reduce(
        (sum, t: any) => sum + (Array.isArray(t.lessons) ? t.lessons.length : 0),
        0,
      );

      const overview: CourseOverview = {
        title: studyData.title ?? 'Untitled course',
        rating: studyData.rating ?? 0,
        ratingsCount: studyData.ratingsCount ?? 0,
        students: studyData.students ?? 0,
        duration: `${enrollment.totalLessons ?? totalLessonsFromTopics} lessons`,
        lastUpdated: enrollment.enrolledAt
          ? new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')
          : '',
        language: studyData.language ?? 'Vietnamese',
        skillLevel: studyData.level ?? 'All levels',
        lectures: enrollment.totalLessons ?? totalLessonsFromTopics,
        hasCaptions: true,
        description: studyData.description ?? '',
      };

      return { topics, overview };
    } catch (error: any) {
      console.error('fetchCourseDetail error:', error);
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to load course detail';
      return rejectWithValue(msg);
    } finally {
      dispatch(hideLoading());
    }
  },
);

export const fetchQuiz = createAsyncThunk(
  'coursePlayer/fetchQuiz',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:8080/api/v1/courses/my-courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const quizData = res.data?.data?.quizzes?.[0];
      return quizData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch quiz');
    } finally {
    }
  },
);

export const fetchQuizQuestions = createAsyncThunk(
  'coursePlayer/fetchQuizQuestions',
  async (
    { courseId, quizId }: { courseId: string; quizId: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());
      const token = localStorage.getItem('access_token');
      const res = await axios.get(
        `http://localhost:8080/api/v1/courses/${courseId}/quizzes/${quizId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data?.data?.questions || [];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch quiz questions');
    } finally {
      dispatch(hideLoading());
    }
  },
);

export const submitQuiz = createAsyncThunk(
  'coursePlayer/submitQuiz',
  async (
    payload: { courseId: string; quizId: string; answers: any[] },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        `http://localhost:8080/api/v1/courses/${payload.courseId}/quizzes/${payload.quizId}/submit`,
        { answers: payload.answers },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        },
      );
      return res.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit quiz');
    } finally {
      dispatch(hideLoading());
    }
  },
);

export const fetchLessonComments = createAsyncThunk(
  'coursePlayer/fetchLessonComments',
  async (courseId: string, { rejectWithValue, dispatch }) => {
    try {
      dispatch(showLoading());
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:8080/api/v1/courses/${courseId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch comments');
    } finally {
      dispatch(hideLoading());
    }
  },
);

export const submitReview = createAsyncThunk(
  'coursePlayer/submitReview',
  async (
    payload: { courseId: string; review: string; rating: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(showLoading());
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        `http://localhost:8080/api/v1/courses/${payload.courseId}/reviews`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit review');
    } finally {
      dispatch(hideLoading());
    }
  },
);
export const submitLessonComment = createAsyncThunk(
  'coursePlayer/submitLessonComment',
  async (
    payload: { courseId: string; lessonId: string; comment: string; rating: number },
    { rejectWithValue },
  ) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        `http://localhost:8080/api/v1/comments/courses/${payload.courseId}/lessons/${payload.lessonId}`,
        {
          content: payload.comment,
          rating: payload.rating,
          is_positive: payload.rating >= 3,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit comment');
    } finally {
    }
  },
);

export const deleteLessonComment = createAsyncThunk(
  'coursePlayer/deleteLessonComment',
  async (commentId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8080/api/v1/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return commentId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete comment');
    } finally {
    }
  },
);

export const submitFeedback = createAsyncThunk(
  'coursePlayer/submitFeedback',
  async (payload: { courseId: string; content: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8080/api/v1/feedbacks/course/${payload.courseId}`,
        { content: payload.content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit feedback');
    }
  },
);

export const fetchLessonCommentsByCourse = createAsyncThunk(
  'coursePlayer/fetchLessonCommentsByCourse',
  async (courseId: string, { rejectWithValue, dispatch }) => {
    try {
      dispatch(showLoading());
      const token = localStorage.getItem('access_token');

      const lessonRes = await axios.get(
        `http://localhost:8080/api/v1/courses/my-courses/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const topics = lessonRes.data?.data?.topics || [];
      const allLessons = topics.flatMap((topic: any) =>
        Array.isArray(topic.lessons) ? topic.lessons.map((lesson: any) => lesson._id) : [],
      );

      const lessonCommentMap: LessonCommentsById = {};
      const allComments: Review[] = [];
      const ratingStat: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      for (const lessonId of allLessons) {
        const res = await axios.get(`http://localhost:8080/api/v1/comments/lessons/${lessonId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const comments = res.data?.data?.results || [];
        const mappedComments = comments.map((c: any) => {
          const rating = c.rating || 0;
          ratingStat[rating] += 1;
          return {
            _id: c._id,
            name: c.user?.full_name || 'Ẩn danh',
            timeAgo: new Date(c.created_at).toLocaleDateString('vi-VN'),
            rating,
            comment: c.content,
            is_positive: c.is_positive === true,
            user_name: c.user?.full_name || '',
            user_id: c.user_id || '',
          };
        });

        allComments.push(...mappedComments);
        lessonCommentMap[lessonId] = {
          title:
            topics.flatMap((topic: any) => topic.lessons).find((l: any) => l._id === lessonId)
              ?.title || `Lesson ${lessonId}`,
          comments: mappedComments,
        };
      }

      return {
        commentsByLesson: lessonCommentMap,
        reviews: allComments,
        ratingCounts: ratingStat,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch lesson comments');
    } finally {
      dispatch(hideLoading());
    }
  },
);

export const fetchLessonReviews = createAsyncThunk(
  'coursePlayer/fetchLessonReviews',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      const lessonRes = await axios.get(
        `http://localhost:8080/api/v1/courses/my-courses/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const topics = lessonRes.data?.data?.topics || [];

      const allLessons = topics.flatMap((topic: any) =>
        Array.isArray(topic.lessons)
          ? topic.lessons.map((lesson: any) => ({ lesson, topicTitle: topic.title }))
          : [],
      );

      const commentFetches = allLessons.map(async ({ lesson }: { lesson: any }) => {
        try {
          const res = await axios.get(
            `http://localhost:8080/api/v1/comments/lessons/${lesson._id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          return { lesson, comments: res.data?.data?.results || [] };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(commentFetches);
      const valid = results.filter(Boolean) as { lesson: any; comments: any[] }[];

      const map: Record<string, { lesson: any; comments: any[] }> = {};
      valid.forEach(({ lesson, comments }) => {
        map[lesson._id] = { lesson, comments };
      });

      return map;
    } catch (err) {
      return rejectWithValue('Failed to fetch lesson comments');
    }
  },
);

const coursePlayerSlice = createSlice({
  name: 'coursePlayer',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchCourseDetail.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action) => {
        state.courseDetail = action.payload.overview;
        state.topics = action.payload.topics;
        state.loading = false;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.quiz = action.payload;
      })
      .addCase(fetchQuizQuestions.fulfilled, (state, action) => {
        state.quizQuestions = action.payload;
      })

      .addCase(fetchLessonComments.fulfilled, (state, action) => {
        state.commentsByLesson = action.payload;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.reviews.push(action.payload);
      })
      .addCase(submitLessonComment.fulfilled, (state, action) => {})
      .addCase(deleteLessonComment.fulfilled, (state, action) => {
        const commentId = action.payload;
        for (const lessonId in state.commentsByLesson) {
          const lesson = state.commentsByLesson[lessonId];
          lesson.comments = lesson.comments.filter(c => c._id !== commentId);
        }
      })
      .addCase(fetchLessonCommentsByCourse.fulfilled, (state, action) => {
        state.commentsByLesson = action.payload.commentsByLesson;
        state.reviews = action.payload.reviews;
        state.ratingCounts = action.payload.ratingCounts;
      })
      .addCase(fetchLessonReviews.fulfilled, (state, action) => {
        state.lessonReviewsMap = action.payload;
      });
  },
});

export default coursePlayerSlice.reducer;
