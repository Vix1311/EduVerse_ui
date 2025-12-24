export interface CreateCoursePayload {
  title: string;
  description: string;
  thumbnail: string;        
  categoryId: number;       
  price: number;           
  hashtagIds: number[];     
  isFree: boolean;
  isFeatured: boolean;
  isPreorder: boolean;
  previewDescription: string;
}

export interface CreateTopicPayload {
  courseId: string;
  topicData: {
    title: string;
    description: string;
  };
}
export interface CreateLessonPayload {
  courseId: string;
  topicId: string;
  lessonData: {
    title: string;
    duration: number;
  };
}
export interface UploadContentPayload {
  courseId: string;
  topicId: string;
  lessonId: string;
  content: {
    videoUrl?: string;
    thumbnailUrl?: string;
    duration: number;
    document?: File | null;
    questions?: {
      question: string;
      options: string[];
      correct_answer: string;
    }[];
    title: string;
    description: string;
  };
}
