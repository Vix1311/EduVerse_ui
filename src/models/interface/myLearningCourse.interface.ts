export interface MyLearningCourse {
  _id: string;
  course_id: string;
  title: string;
  instructor: any;
  thumbnail: string;
  progress: number;
  rating: number;
  level: string;
  enrolled_at: string;
  isStarted: boolean;
}