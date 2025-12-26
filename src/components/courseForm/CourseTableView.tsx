import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Topic {
  _id: string;
  title: string;
}

interface Lesson {
  _id: string;
  title: string;
}

interface CourseData {
  _id: string;
  title: string;
  categoryName?: string;
}

interface Props {
  courses: CourseData[];
  onAddNew: () => void;
  onContinueCourse: (
    courseId: string,
    step?: number,
    topicId?: string,
    courseTitle?: string,
    topicTitle?: string,
    lessonTitle?: string,
  ) => void;
}

const CourseTableView: React.FC<Props> = ({ courses, onAddNew, onContinueCourse }) => {
  const [selectedTopics, setSelectedTopics] = useState<Record<string, string>>({});
  const [allTopics, setAllTopics] = useState<Record<string, Topic[]>>({});
  const [allLessons, setAllLessons] = useState<Record<string, Lesson[]>>({});

  const fetchTopics = async (courseId: string) => {
    if (allTopics[courseId]) return;
    try {
      const res = await axios.get(`https://eduverseapi-production.up.railway.app/api/v1/courses/${courseId}/topics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setAllTopics(prev => ({ ...prev, [courseId]: res.data.data }));
    } catch (err) {
      console.error('Failed to fetch topics', err);
    }
  };

  const fetchLessons = async (courseId: string, topicId: string) => {
    try {
      const res = await axios.get(
        `https://eduverseapi-production.up.railway.app/api/v1/courses/${courseId}/topics/${topicId}/lessons`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } },
      );
      setAllLessons(prev => ({ ...prev, [topicId]: res.data.data }));
    } catch (err) {
      console.error('Failed to fetch lessons', err);
    }
  };

  const handleAddTopic = (courseId: string) => {
    onContinueCourse(courseId, 2);
  };

  const handleAddLesson = (courseId: string, topicId: string) => {
    onContinueCourse(courseId, 3, topicId);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📚 Courses in Progress</h2>
      <Link to="/">
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded mb-4 mr-4">
          Back To Home
        </button>
      </Link>

      <button
        onClick={onAddNew}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mb-4"
      >
        + Add New Course
      </button>

      {courses.length === 0 ? (
        <p className="text-gray-500 italic">No courses created yet.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">#</th>
              <th className="border px-2 py-1">Title</th>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Topic</th>
              <th className="border px-2 py-1">Lesson</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, idx) => (
              <tr key={course._id} className="hover:bg-gray-50">
                <td className="border px-2 py-1 text-center">{idx + 1}</td>
                <td className="border px-2 py-1">{course.title}</td>
                <td className="border px-2 py-1">{course.categoryName || 'N/A'}</td>
                <td className="border px-2 py-1">
                  <div className="flex gap-2">
                    <select
                      title="select"
                      onFocus={() => fetchTopics(course._id)}
                      value={selectedTopics[course._id] || ''}
                      onChange={e => {
                        const topicId = e.target.value;
                        setSelectedTopics(prev => ({ ...prev, [course._id]: topicId }));
                        fetchLessons(course._id, topicId);
                      }}
                      className="w-full border p-1 rounded"
                    >
                      <option value="">-- Select Topic --</option>
                      {(allTopics[course._id] || []).map(topic => (
                        <option key={topic._id} value={topic._id}>
                          {topic.title}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddTopic(course._id)}
                      className="bg-green-500 text-white px-2 rounded"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="border px-2 py-1">
                  <div className="flex gap-2">
                    <select title="select" className="w-full border p-1 rounded">
                      {(allLessons[selectedTopics[course._id]] || []).map(lesson => (
                        <option key={lesson._id}>{lesson.title}</option>
                      ))}
                    </select>
                    <button
                      disabled={!selectedTopics[course._id]}
                      onClick={() => handleAddLesson(course._id, selectedTopics[course._id])}
                      className="bg-blue-500 text-white px-2 rounded disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => onContinueCourse(course._id)}
                    className="text-blue-600 hover:underline"
                  >
                    Continue
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CourseTableView;
