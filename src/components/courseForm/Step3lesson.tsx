import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Step3Lesson = ({ courseId, topicId, topicTitle, setCourseData, goNext, goBack }: any) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(0);

  const createLesson = async (withNext: boolean = true) => {
    try {
      const res = await axios.post(
        `http://localhost:8080/api/v1/courses/${courseId}/topics/${topicId}/lessons`,
        { title, duration },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        },
      );
      toast.success('Lesson created');
      const lesson = res.data.data;
      setCourseData((prev: any) => ({
        ...prev,
        lessonId: lesson._id,
        lessonTitle: lesson.title,
      }));

      setTimeout(() => {
        if (withNext) goNext();
        else {
          setTitle('');
          setDuration(0);
        }
      }, 50);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create lesson');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Step 3: Create Lesson for <b>{topicTitle}</b>
      </h2>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Lesson Title"
        className="w-full border p-2 rounded"
      />
      <input
        type="number"
        value={duration}
        onChange={e => setDuration(Number(e.target.value))}
        placeholder="Duration (minutes)"
        className="w-full border p-2 rounded"
      />
      <div className="flex gap-4">
        <button onClick={goBack} className="bg-gray-500 text-white px-4 py-2 rounded">
          Back
        </button>
        <button
          onClick={() => createLesson(true)}
          className="bg-purple-600 text-white px-6 py-2 rounded"
        >
          Continue
        </button>
        <button
          onClick={() => createLesson(false)}
          className="bg-orange-500 text-white px-6 py-2 rounded"
        >
          Save & Add Another
        </button>
      </div>
    </div>
  );
};

export default Step3Lesson;
