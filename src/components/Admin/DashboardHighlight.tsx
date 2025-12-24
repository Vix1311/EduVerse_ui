import axios from 'axios';
import { useEffect, useState } from 'react';

interface Course {
  image: string;
  name: string;
}

interface Category {
  name: string;
  color: string;
}

interface Comment {
  avatar: string;
  user: string;
  comment: string;
  course: string;
}

interface DashboardHighlightData {
  hotCourses: Course[];
  favoriteCourses: Course[];
  hotCategories: Category[];
  newComments: Comment[];
}

const DashboardHighlight = () => {
  const [data, setData] = useState<DashboardHighlightData>({
    hotCourses: [],
    favoriteCourses: [],
    hotCategories: [],
    newComments: [],
  });

  useEffect(() => {
    axios.get('/data/AdminData/DashboardHighlightData/DashboardHighlightData.json').then(res => {
      setData(res.data);
    });
  }, []);

  const { hotCourses, favoriteCourses, hotCategories, newComments } = data;

  return (
    <div className="bg-white p-6 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-6 text-gray-800">
      {/* Sôi nổi nhất */}
      <div className="flex flex-col justify-between h-full border-r last:border-none pr-4">
        <h3 className="text-lg font-semibold mb-4">📚 The most exciting</h3>
        <div className="flex-1 flex flex-col gap-3">
          {hotCourses.map((course, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 cursor-pointer"
            >
              <span className="text-gray-500">{index + 1}.</span>
              <img src={course.image} alt={course.name} className="w-8 h-8 rounded object-cover" />
              <span className="truncate">{course.name}</span>
            </div>
          ))}
        </div>
        <div className="text-blue-500 text-sm mt-2 cursor-pointer">View more</div>
      </div>

      {/* Yêu thích nhất */}
      <div className="flex flex-col justify-between h-full border-r last:border-none pr-4">
        <h3 className="text-lg font-semibold mb-4">❤️ The most favorite</h3>
        <div className="flex-1 flex flex-col gap-3">
          {favoriteCourses.map((course, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 cursor-pointer"
            >
              <span className="text-gray-500">{index + 1}.</span>
              <img src={course.image} alt={course.name} className="w-8 h-8 rounded object-cover" />
              <span className="truncate">{course.name}</span>
            </div>
          ))}
        </div>
        <div className="text-blue-500 text-sm mt-2 cursor-pointer">View more</div>
      </div>

      {/* Thể loại hot */}
      <div className="flex flex-col justify-between h-full border-r last:border-none pr-4">
        <h3 className="text-lg font-semibold mb-4">🔥 The most popular categories</h3>
        <div className="flex-1 flex flex-col gap-3">
          {hotCategories.map((cat, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 cursor-pointer"
            >
              <span className="text-gray-500">{index + 1}.</span>
              <span
                className={`px-2 py-1 rounded-full text-sm text-white ${cat.color}`}
                style={{ backgroundColor: cat.color.includes('bg-') ? undefined : cat.color }}
              >
                {cat.name}
              </span>
            </div>
          ))}
        </div>
        <div className="text-blue-500 text-sm mt-2 cursor-pointer">View more</div>
      </div>

      {/* Bình luận mới */}
      <div className="flex flex-col justify-between h-full">
        <h3 className="text-lg font-semibold mb-4">💬 New comments</h3>
        <div className="flex-1 flex flex-col gap-3">
          {newComments.map((comment, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg shadow hover:shadow-md transition cursor-pointer"
            >
              <img
                src={comment.avatar}
                alt={comment.user}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="font-semibold text-sm">{comment.user}</div>
                <div className="text-xs text-gray-600 truncate">{comment.comment}</div>
                <div className="text-[10px] text-blue-400">➡️ {comment.course}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHighlight;
