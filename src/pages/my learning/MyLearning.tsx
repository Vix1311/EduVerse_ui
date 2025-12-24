import { Header } from '@/components';
import Footer from '@/components/footer/Footer';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchMyLearningCourses } from '@/redux/slices/myLearning.slice';
import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const CustomDropdown = ({
  label,
  items,
  selected,
  setSelected,
  resetTrigger,
}: {
  label: string;
  items: string[];
  selected: string;
  setSelected: (value: string) => void;
  resetTrigger: number;
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [resetTrigger]);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex justify-between items-center px-4 py-2 rounded shadow bg-white min-w-[150px]"
      >
        {selected || label}
        <svg className="ml-2 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded shadow">
          {items.map(item => (
            <button
              key={item}
              onClick={() => {
                setSelected(item);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ITEMS_PER_PAGE = 8;

const MyLearning = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedProgress, setSelectedProgress] = useState('');
  const [ratings, setRatings] = useState<{ [courseId: string]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleRating = (courseId: string, value: number) => {
    setRatings(prev => ({
      ...prev,
      [courseId]: value,
    }));
  };

  const dispatch = useDispatch<AppDispatch>();
  const { courses } = useSelector((s: RootState) => s.myLearning);

  useEffect(() => {
    dispatch(fetchMyLearningCourses());
  }, [dispatch]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedInstructor, selectedProgress]);

  const instructors = Array.from(new Set(courses.map(c => c.instructor.full_name)));

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstructor = selectedInstructor
      ? course.instructor.full_name === selectedInstructor
      : true;
    const matchesProgress =
      selectedProgress === 'Completed'
        ? course.progress === 100
        : selectedProgress === 'In progress'
          ? course.progress < 100
          : true;

    return matchesSearch && matchesInstructor && matchesProgress;
  });

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <>
      <Header />
      <div className="bg-white min-h-screen">
        <div className="bg-[#252641] text-white px-6 py-6">
          <h1 className="text-4xl font-bold mb-2">My learning</h1>
          <div className="flex-wrap flex gap-6 text-sm font-semibold">
            <Link to="/my-learning" className="border-b-2 border-white pb-1">
              All courses
            </Link>
            <Link to="/my-learning/my-list" className="text-gray-300">
              My Lists
            </Link>
            <Link to="/my-learning/wishlish" className="text-gray-300">
              Wishlist
            </Link>
          </div>
        </div>

        <div id="course-list-section" className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search my courses"
                className="border px-4 py-2 rounded w-64 focus:outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button title="search" className="bg-[#F48C06] text-white p-2 rounded">
                <FaSearch />
              </button>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="relative inline-block text-left">
                <CustomDropdown
                  label="Instructor"
                  items={instructors}
                  selected={selectedInstructor}
                  setSelected={setSelectedInstructor}
                  resetTrigger={resetTrigger}
                />
                <CustomDropdown
                  label="Progress"
                  items={['Completed', 'In progress']}
                  selected={selectedProgress}
                  setSelected={setSelectedProgress}
                  resetTrigger={resetTrigger}
                />
              </div>

              <button
                className="text-sm text-gray-500 hover:underline ml-2"
                onClick={() => {
                  setSelectedInstructor('');
                  setSelectedProgress('');
                  setResetTrigger(prev => prev + 1);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedCourses.map(course => (
            <div key={course._id} className="border rounded shadow-sm overflow-hidden bg-white">
              <Link to={`/course-player/${course.course_id}`} className="block hover:no-underline">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-52 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-sm font-semibold line-clamp-2 min-h-[3.5rem]">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{course.instructor.full_name}</p>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-1 bg-[#F48C06] rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <p className="text-sm mt-1 text-orange-700 font-semibold">
                      {course.progress}% complete
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {course.isStarted ? (
                      <div className="text-yellow-500 text-lg flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span
                            key={star}
                            onClick={() => handleRating(course._id, star)}
                            className={`cursor-pointer ${
                              star <= (ratings[course._id] ?? course.rating)
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">START COURSE</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-10 gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => {
                  setCurrentPage(index + 1);
                  setTimeout(() => {
                    const section = document.getElementById('course-list-section');
                    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className={`px-4 py-2 rounded border ${
                  currentPage === index + 1
                    ? 'bg-[#F48C06] text-white'
                    : 'bg-white text-gray-700 hover:bg-orange-100'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyLearning;
