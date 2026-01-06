import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Step2Topic = ({ courseId, courseTitle, setCourseData, goNext, goBack }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const createTopic = async (withNext: boolean = true) => {
    try {
      const res = await axios.post(
        `http://localhost:8080/api/v1/courses/${courseId}/topics`,
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        },
      );
      toast.success('Topic created');

      const topic = res.data.data;
      setCourseData((prev: any) => ({
        ...prev,
        topicId: topic._id,
        topicTitle: topic.title,
      }));

      setTimeout(() => {
        if (withNext) goNext();
        else {
          setTitle('');
          setDescription('');
        }
      }, 50);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create topic');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Step 2: Create Topic for <b>{courseTitle}</b>
      </h2>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Topic Title"
        className="w-full border p-2 rounded"
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Topic Description"
        className="w-full border p-2 rounded"
      />
      <div className="flex gap-4">
        <button onClick={goBack} className="bg-gray-500 text-white px-4 py-2 rounded">
          Back
        </button>
        <button
          onClick={() => createTopic(true)}
          className="bg-purple-600 text-white px-6 py-2 rounded"
        >
          Continue
        </button>
        <button
          onClick={() => createTopic(false)}
          className="bg-orange-500 text-white px-6 py-2 rounded"
        >
          Save & Add Another
        </button>
      </div>
    </div>
  );
};

export default Step2Topic;
