import { useState } from 'react';
import { Props } from '@/models/types/courseDetailCurriculum.type';

const CourseDetailCurriculum = ({ topics, lessons }: Props) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandAll, setExpandAll] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleToggleAll = () => {
    if (expandAll) {
      setExpandedSections([]);
    } else {
      setExpandedSections(topics.map(t => t._id));
    }
    setExpandAll(!expandAll);
  };

  const totalLectures = topics.reduce((acc, t) => acc + t.lesson_count, 0);
  const totalSeconds = topics.reduce((acc, t) => acc + t.total_duration, 0);
  const totalHours = Math.floor(totalSeconds / 60);
  const totalMinutes = totalSeconds % 60;
  const formattedDuration = `${totalHours}h ${totalMinutes}m`;

  return (
    <div className="mx-auto space-y-1">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Curriculum</h2>
      <div className="flex justify-between mb-4">
        <div className="text-base text-gray-700 font-medium">
          {topics.length} sections • {totalLectures} lectures • {formattedDuration} total length
        </div>
        <button
          onClick={handleToggleAll}
          className="px-4 py-2 bg-[#F48C06] hover:bg-[#e37b00] text-white text-sm font-medium rounded  transition"
        >
          {expandAll ? 'Collapse all Sections' : 'Expand all Sections'}
        </button>
      </div>

      {topics.map(topic => {
        return (
          <div key={topic._id} className="border border-gray-200 rounded-md">
            <button
              onClick={() => toggleSection(topic._id)}
              className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 font-semibold text-left text-gray-800 hover:bg-gray-200"
            >
              <span>{topic.title}</span>
              <span className="text-sm text-gray-600">{topic.lesson_count} lectures</span>
            </button>

            {expandedSections.includes(topic._id) && (
              <div className="p-4 text-sm text-gray-700 space-y-1">
                {lessons
                  ?.filter(lesson => lesson.topic_id === topic._id)
                  .map(lesson => (
                    <div key={lesson._id} className="flex items-center gap-2">
                      <span>🎓</span>
                      <span>{lesson.title}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseDetailCurriculum;
