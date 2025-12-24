import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaHeart } from 'react-icons/fa';
import { Header } from '@/components';
import Footer from '@/components/footer/Footer';
import { toast } from 'react-toastify';
import { AppDispatch, RootState } from '@/core/store/store';
import { useDispatch, useSelector } from 'react-redux';
import defaultAvatar from '@/assets/icons/user.png';
import { fetchWishlist, removeFromWishlist } from '@/redux/slices/wishlist.slice';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const Wishlist = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { items: wishlist, loading } = useSelector((state: RootState) => state.wishlist);

  // Fetch wishlist when component mounts
  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemove = (courseId: number) => {
    dispatch(removeFromWishlist(courseId))
      .unwrap()
      .then(() => toast.success('Removed from wishlist'))
      .catch(err => toast.error(err));
  };

  const filteredCourses = wishlist.filter(item =>
    item.course.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Header />
      <div className="bg-[#252641] text-white px-6 py-6">
        <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
        <div className="flex flex-wrap gap-x-6 text-sm font-semibold">
          <Link to="/my-learning" className="text-gray-300">
            My Courses
          </Link>
          <Link to="/my-learning/wishlist" className="border-b-2 border-white pb-1">
            Wishlist
          </Link>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-6 flex items-center gap-4">
          <input
            type="text"
            placeholder="Search my wishlist"
            className="border px-4 py-2 rounded w-64"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button className="bg-orange-600 text-white p-2 rounded" title="search">
            <FaSearch />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500 text-lg">Loading wishlist...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center text-gray-600 mt-10 text-lg font-medium">
            No courses found in wishlist.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map(item => {
              const course = item.course;
              return (
                <div
                  key={course.id}
                  onClick={() => navigate(`/course/${course.id}`)}
                  className="group bg-white rounded-xl shadow hover:shadow-lg transition duration-300 relative overflow-hidden cursor-pointer"
                >
                  <div
                    className="absolute top-2 right-2 text-2xl cursor-pointer z-10 border border-orange-500 rounded-full hover:bg-orange-200 p-3 hover:text-orange-600 transition-colors duration-200"
                    title="Remove from wishlist"
                    onClick={e => {
                      e.stopPropagation();
                      handleRemove(course.id);
                    }}
                  >
                    <FaHeart className="text-2xl text-orange-600" />
                  </div>

                  <div className="relative w-full h-56">
                    <img
                      src={course.thumbnail || '/default-thumbnail.jpg'}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description || 'No description available.'}
                    </p>
                    <div className="flex justify-between items-center">
                      {course.isFree ? (
                        <span className="text-green-600 font-semibold">Free</span>
                      ) : (
                        <span className="text-lg font-bold text-gray-800">
                          {formatCurrency(course.price || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default Wishlist;
