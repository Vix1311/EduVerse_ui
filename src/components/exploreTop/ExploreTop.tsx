import { RootState } from '@/core/store/store';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

interface Subject {
  id: number;
  title: string;
  image: string;
  link: string;
  categoryId?: string;
}

const ExploreTop = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const categories = useSelector((state: RootState) => state.category.categories);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jsonRes] = await Promise.all([
          axios.get('/data/ExploreTopData/ExploreTopData.json'),
        ]);

        const fileSubjects = jsonRes.data.subjects;

        const mergedSubjects = fileSubjects.map((subject: any, index: any) => ({
          ...subject,
          title: categories[index]?.name || subject.title,
          categoryId: categories[index]?._id || '',
        }));

        setSubjects(mergedSubjects);
      } catch (error) {
        console.error('Error loading subjects or categories:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="py-16 bg-slate-100">
      <div className="max-w-7xl mx-auto px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-blue-900">
          Explore top subjects
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {subjects.map(subject => (
            <div key={subject.id} className="relative group overflow-hidden rounded-lg shadow-lg">
              <div className="relative group overflow-hidden rounded-lg shadow-lg">
                <img
                  src={subject.image}
                  alt={subject.title}
                  className="w-full h-40  object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Link
                  to={`/courses/category/${subject.categoryId}`}
                  className="text-white text-lg font-bold px-3 py-1 rounded hover:underline"
                >
                  {subject.title.toUpperCase()}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/course-list"
            className="px-6 py-2 font-bold bg-transparent text-[#FF9F67] border-2 border-[#FF9F67] rounded-xl hover:bg-[#FF9F67] hover:text-white transition-colors duration-500"
          >
            View More Subjects
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ExploreTop;
