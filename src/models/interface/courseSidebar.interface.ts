export interface Lesson {
  _id: string;
  title: string;
  video_url: string | null;
  document_urls?: { url: string; original_name?: string }[];
}

export interface Topic {
  _id: string;
  title: string;
  lessons: Lesson[];
}

export interface CourseSidebarProps {
  courseId: string;
  onSelectVideo: (url: string, _id: string) => void;
  onInitFirstVideo: (url: string, lessonId: string) => void;
  onSelectLessonId: (lessonId: string) => void;
  completedLessons: string[];
  onTotalLessons?: (count: number) => void;
  setIsLoadingNext?: (isLoading: boolean) => void;
  selectedLessonId?: string | null;
  lastCompletedLessonId?: string | null;
}
