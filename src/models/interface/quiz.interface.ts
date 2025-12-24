export interface QuizModalProps {
  quizId: string;
  courseId: string;
  onClose: () => void;
}

export interface Question {
  _id: string;
  question_text: string;
  options: string[];
}
export interface Quiz {
  _id: string;
  title: string;
  quiz_result?: {
    _id: string;
    title: string;
    score: number;
    submitted_at: string;
  };
}
