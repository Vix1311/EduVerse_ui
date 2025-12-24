import React, { useState } from 'react';
import Step1CourseInfo from './Step1CourseInfo';
import Step2Topic from './Step2Topic';
import Step3Lesson from './Step3lesson';
import Step4UploadContent from './Step4UploadContent';

interface Props {
  initialCourseId: string | null;
  initialStep?: number;
  initialTopicId?: string;
  initialCourseTitle?: string;
  initialTopicTitle?: string;
  initialLessonTitle?: string;
  onBack: () => void;
  onComplete: (newCourse: any) => void;
}

const CourseStepForm: React.FC<Props> = ({
  initialCourseId,
  initialStep = 1,
  initialTopicId,
  initialCourseTitle,
  initialTopicTitle,
  initialLessonTitle,
  onBack,
  onComplete,
}) => {
  const [step, setStep] = useState(initialStep || 2);
  const [courseData, setCourseData] = useState<any>({
    id: initialCourseId,
    title: initialCourseTitle,
    topicId: initialTopicId,
    topicTitle: initialTopicTitle,
    lessonTitle: initialLessonTitle,
  });

  const goNext = () => setStep(prev => prev + 1);
  const goBack = () => setStep(prev => prev - 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between space-x-2 text-sm font-medium">
        {[1, 2, 3, 4].map(n => (
          <div
            key={n}
            onClick={() => n <= step && setStep(n)}
            className={`flex-1 px-2 py-1 text-center border-b-4 cursor-pointer ${
              step === n
                ? 'border-purple-700 text-purple-700 font-bold'
                : step > n
                  ? 'border-purple-400 text-purple-600'
                  : 'border-gray-200 text-gray-400'
            }`}
          >
            Step {n}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Step1CourseInfo
          setCourseData={setCourseData}
          goNext={goNext}
          onBack={onBack}
          onComplete={onComplete}
        />
      )}
      {step === 2 && (
        <Step2Topic
          courseId={courseData.id}
          courseTitle={courseData.title}
          setCourseData={setCourseData}
          goNext={goNext}
          goBack={goBack}
        />
      )}
      {step === 3 && (
        <Step3Lesson
          courseId={courseData.id}
          topicId={courseData.topicId}
          setCourseData={setCourseData}
          topicTitle={courseData.topicTitle}
          goNext={goNext}
          goBack={goBack}
        />
      )}
      {step === 4 && (
        <Step4UploadContent
          courseId={courseData.id}
          topicId={courseData.topicId}
          topicTitle={courseData.topicTitle}
          lessonTitle={courseData.lessonTitle}
          goBack={goBack}
          onComplete={onComplete}
        />
      )}
    </div>
  );
};

export default CourseStepForm;
