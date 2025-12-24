export interface CourseOverview {
  title: string;
  rating: number;
  ratingsCount: number;
  students: number;
  duration: string;
  lastUpdated: string;
  language: string;
  skillLevel: string;
  lectures: number;
  hasCaptions: boolean;
  description: string;
}

export interface Review {
  _id: string;
  name: string;
  timeAgo: string;
  rating: number;
  comment: string;
  is_positive: boolean;
  user_id: string;
  user_name: string;
}

export interface CourseTabsProps {
  courseId: string;
  currentLessonId: string;
  onStartQuiz: (quizId: string, moduleId: string | null) => void;
}

export interface RatingCounts {
  [star: number]: number;
}

export interface LessonCommentsById {
  [lessonId: string]: {
    title: string;
    comments: Review[];
  };
}
