import { Header } from "@/components";
import Footer from "@/components/footer/Footer";
import { Link } from "react-router-dom";


interface Course {
  id: number;
  title: string;
  instructor: string;
  thumbnail: string;
  progress: number;
  isStarted: boolean;
}

const myListCourses: Course[] = []; 

const MyList = () => {
  return (
    <>
      <Header />
      <div className="bg-white min-h-screen">
        <div className="bg-[#252641] text-white px-6 py-6">
          <h1 className="text-4xl font-bold mb-2">My learning</h1>
          <div className="flex-wrap flex gap-6 text-sm font-semibold">
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
              <Link to="/my-learning" className="text-gray-300">
                All courses
              </Link>
              <Link
                to="/my-learning/my-list"
                className="border-b-2 border-white pb-1"
              >
                My Lists
              </Link>
              <Link to="/my-learning/wishlish" className="text-gray-300">
                Wishlist
              </Link>
            </div>
          </div>
        </div>
        {myListCourses.length === 0 ? (
          <div className="text-center mt-36 text-gray-700 font-medium">
            <p className="text-lg mb-2">
              Organize and access your courses faster!
            </p>
            <div className=" relative justify-center flex items-center mt-2">
              <Link
                to="/my-learning"
                className="text-[#F48C06] font-semibold underline "
              >
                Go to the All Courses tab
              </Link>
              <p className="text-sm ml-1  text-gray-400">to create a list.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {myListCourses.map((course) => (
              <div
                key={course.id}
                className="border rounded shadow-sm overflow-hidden bg-white"
              >
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-32 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-sm font-semibold line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {course.instructor}
                  </p>
                  <div className="mt-2 text-sm text-gray-600">
                    {course.isStarted ? (
                      <div className="text-[#F48C06] font-semibold text-xs">
                        {course.progress}% complete
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        START COURSE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyList;
