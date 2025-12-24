export interface Lesson {
  id: number;
  chapterId: number;
  videoUrl?: string;
  documentUrl?: string;
  isPreviewable: boolean;
  lessonOrder?: number;
  createdAt: string;
  updatedAt: string;
  title: string;
}

export interface Module {
  id: number;
  courseId: number;
  description: string;
  chapterOrder: number;
  createdAt: string;
  updatedAt: string;
  title: string;
  lessons: Lesson[];
}
