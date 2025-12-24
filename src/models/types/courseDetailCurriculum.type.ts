export type Topic = {
  _id: string;
  title: string;
  description?: string;
  lesson_count: number;
  total_duration: number;
  is_active: boolean;
  topic_order: number;
};

export type Lesson = {
  _id: string;
  title: string;
  topic_id: string;
};

export type Props = {
  topics: Topic[];
  lessons: Lesson[];
};