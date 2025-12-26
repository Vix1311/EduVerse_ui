import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import WishlistDropdown from '../dropdownOverlay/WishlistDropdown';
import CartDropdown from '../dropdownOverlay/CartDropdown';
import UserDropdown from '../dropdownOverlay/UserDropdown';
import { logo } from '@/assets/images';
import CategoryBar from '../categoryBar/CatagoryBar';
import { debounce } from 'lodash';
import axios from 'axios';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'react-toastify';
import defaultAvatar from '@/assets/icons/user.png';
import { logoutUser } from '@/core/store/user.slice';
import { AppDispatch, RootState } from '@/core/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { clearSearchResults, searchCategories } from '@/redux/slices/categorySearch.slice';
import { clearWishlist } from '@/redux/slices/wishlist.slice';
import { clearCart } from '@/redux/slices/cart.slice';
import { disconnectSocket } from '@/core/services/socket-client';
import { clearCourseSearchResults, searchCourses } from '@/redux/slices/courseSearch.slice';

const Header: React.FC = () => {
  const userProfile = useUserProfile();
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [showCategoryBar, setShowCategoryBar] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchTextMobile, setSearchTextMobile] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const searchResults = useSelector((state: RootState) => state.categorySearch);
  const courseSearchResults = useSelector((state: RootState) => state.courseSearch);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHoverable, setIsHoverable] = useState(false);

  const cartCount = useSelector((s: RootState) => s.cart?.items?.length ?? 0);
  const wishCount = useSelector((s: RootState) => s.wishlist?.items?.length ?? 0);
  const isAuthenticated = isLoggedIn && !!userProfile;

  // Determine whether mouse hovering is supported (desktop)
  useEffect(() => {
    const checkHoverable = () => {
      const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      setIsHoverable(canHover && window.innerWidth >= 1029);
    };
    checkHoverable();
    window.addEventListener('resize', checkHoverable);
    return () => window.removeEventListener('resize', checkHoverable);
  }, []);

  // Call debounce when mobile user types
  const handleSearchInputMobile = debounce((val: string) => {
    if (val.trim()) {
      dispatch(searchCategories(val));
      dispatch(searchCourses(val));
    } else {
      dispatch(clearSearchResults());
      dispatch(clearCourseSearchResults());
    }
  }, 200);

  // Call debounce when user types
  const handleSearchInput = debounce((val: string) => {
    if (val.trim()) {
      dispatch(searchCategories(val));
      dispatch(searchCourses(val));
    } else {
      dispatch(clearSearchResults());
      dispatch(clearCourseSearchResults());
    }
  }, 200);

  // Check if the user is logged in and save to state
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');

    setIsLoggedIn(!!accessToken);

    if (!accessToken) {
      localStorage.removeItem('user');
      setUser(null);
      return;
    }
    try {
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      if (parsed && parsed.email && parsed.username) {
        setUser(parsed);
      }
    } catch (error) {
      localStorage.removeItem('user');
      setUser(null);
    }
    // Set interceptor to automatically logout when token expires (401)
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          localStorage.removeItem('isLoggedIn');
          setUser(null);
          setIsLoggedIn(false);
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor); // Cleanup interceptor
    };
  }, []);

  // Log out user
  const handleLogout = async () => {
    toast.success('Signed out');
    disconnectSocket();
    setIsLoggedIn(false);
    dispatch(clearCart());
    dispatch(clearWishlist());
    setTimeout(() => {
      navigate('/');
    }, 1000);
    await dispatch(logoutUser()); // Dispatch action logout Redux
  };

  // Track scroll events to change header bar state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowCategoryBar(window.scrollY > 1);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const avatarUrl = userProfile?.avatar
    ? userProfile.avatar.startsWith('http')
      ? userProfile.avatar
      : `https://eduverseapi-production.up.railway.app/${userProfile.avatar}`
    : defaultAvatar;

  const formatCount = (n: number) => (n >= 99 ? '99+' : String(n));
  const Badge: React.FC<{ count: number }> = ({ count }) =>
    count > 0 ? (
      <span className="absolute -top-3 -right-3 min-w-4 h-4 px-1 rounded-full bg-purple-600 text-white text-[10px] leading-none flex items-center justify-center shadow">
        {formatCount(count)}
      </span>
    ) : null;

  return (
    <div>
      {/* Navbar */}
      <div
        className={`px-1 md:px-20 top-0 left-0 w-full z-50 transition duration-300 ${
          isScrolled ? 'bg-[#252641]' : 'bg-[#252641]'
        }`}
      >
        <div className="mx-auto px-6 py-2 flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <div className="flex gap-1 items-center">
              <img src={logo} alt="logo" className=" transition-all duration-300 h-12" />
              <span className="text-2xl ml-1 font-semibold text-white">E-Learning</span>
            </div>
          </Link>
          {/* Search Bar - Desktop */}
          <div className="relative md:block hidden flex-1 max-w-lg mr-4 ml-12">
            <input
              type="text"
              placeholder="Search for anything"
              className={`w-full px-4 py-2 border border-gray-300 text-lg placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all duration-200 ${
                searchResults.data.length > 0 || courseSearchResults.data.length > 0
                  ? 'rounded-t-md rounded-b-none'
                  : 'rounded-full'
              }`}
              // Assign input value to input box
              value={searchText}
              // When the user types in the search box
              onChange={e => {
                const val = e.target.value;
                setSearchText(val); // Update state searchText
                handleSearchInput(val);
              }}
              // When the input box loses focus, hide the search results after 150ms
              // (this delay is to allow clicking on the results before they are hidden)
              onBlur={() => {
                setTimeout(() => {
                  dispatch(clearSearchResults());
                  dispatch(clearCourseSearchResults());
                }, 150);
              }}
            />
            <button
              title="Search"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              <FaSearch />
            </button>
            {(searchResults.data.length > 0 || courseSearchResults.data.length > 0) && (
              <div className="absolute top-full left-0 w-full bg-white shadow-md border border-gray-200 rounded-b-md overflow-y-auto max-h-80 z-50">
                <div className="p-2">
                  {searchResults.data.length > 0 && (
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-600 mb-1">Categories</h3>
                      {searchResults.data.map((cat: any) => (
                        <Link
                          key={cat._id ?? cat.id ?? cat.name}
                          to={`/courses/category/${cat.id}`}
                          className="block p-2 hover:bg-gray-100"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            dispatch(clearSearchResults());
                            dispatch(clearCourseSearchResults());
                          }}
                        >
                          <div className="font-medium text-gray-900">{cat.name}</div>
                          <div className="text-xs text-gray-500">{cat.description}</div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {courseSearchResults.data.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 mb-1">Courses</h3>
                      {courseSearchResults.data.map((course: any) => (
                        <Link
                          key={course._id ?? course.id ?? course.title}
                          to={`/course/${course.slug ?? course._id ?? course.id}`}
                          className="block p-2 hover:bg-gray-100"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            dispatch(clearSearchResults());
                            dispatch(clearCourseSearchResults());
                          }}
                        >
                          <div className="font-medium text-gray-900">{course.title}</div>
                          <div className="text-xs text-gray-500">{course.description}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile search toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button
              title="Search"
              onClick={() => setIsSearchOpen(true)}
              className="text-xl text-white ml-2"
            >
              <FaSearch />
            </button>
          </div>

          {isSearchOpen && (
            <div className="fixed inset-0 z-50 bg-white p-4 overflow-y-auto md:hidden">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  placeholder="Search for anything"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg"
                  value={searchTextMobile}
                  onChange={e => {
                    const val = e.target.value;
                    setSearchTextMobile(val);
                    handleSearchInputMobile(val);
                  }}
                  autoFocus
                />
                <button
                  title="Close Search"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchTextMobile('');
                    dispatch(clearSearchResults());
                    dispatch(clearCourseSearchResults());
                  }}
                  className="ml-3 text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Mobile Search Results */}
              <div className="space-y-4">
                {searchResults.data.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Categories</h3>
                    {searchResults.data.map((cat: any) => {
                      const key = cat._id ?? cat.id ?? cat.name;
                      const slugOrId = cat.slug ?? cat._id ?? cat.id;

                      return (
                        <Link
                          key={key}
                          to={`/courses/category/${cat.id}`}
                          className="block p-2 border rounded hover:bg-gray-100"
                          onClick={() => setIsSearchOpen(false)}
                        >
                          <div className="font-medium text-gray-900">{cat.name}</div>
                          <div className="text-xs text-gray-500">{cat.description}</div>
                        </Link>
                      );
                    })}
                  </div>
                )}{' '}
                {courseSearchResults.data.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Courses</h3>
                    {courseSearchResults.data.map((course: any) => {
                      const key = course._id ?? course.id ?? course.title;
                      const slugOrId = course.slug ?? course._id ?? course.id;

                      return (
                        <Link
                          key={key}
                          to={`/course/${slugOrId}`}
                          className="block p-2 border rounded hover:bg-gray-100"
                          onClick={() => setIsSearchOpen(false)}
                        >
                          <div className="font-medium text-gray-900">{course.title}</div>
                          <div className="text-xs text-gray-500">{course.description}</div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="hidden md:flex items-center gap-5 text-gray-800 flex-col md:flex-row ml-auto pr-5 transition duration-300">
            <Link
              to="/course-list"
              className={`hover:text-[#F48C06] font-medium transition-colors duration-500 mr-5 text-lg text-white`}
            >
              Course
            </Link>

            {isLoggedIn && (
              <Link
                to="/my-learning"
                className={`hover:text-[#F48C06] font-medium transition-colors duration-500 mr-5 text-lg text-white`}
              >
                My learning
              </Link>
            )}

            <div className="flex items-center gap-5">
              <div className="relative inline-flex">
                <WishlistDropdown isInHeader={true} isScrolled={false} />
                <Badge count={wishCount} />
              </div>
              <div className="relative inline-flex">
                <CartDropdown isInHeader={true} isScrolled={false} />
                <Badge count={cartCount} />
              </div>
            </div>
          </div>

          {isAuthenticated ? (
            <div
              className="relative"
              onMouseEnter={isHoverable ? () => setShowDropdown(true) : undefined}
              onMouseLeave={isHoverable ? () => setShowDropdown(false) : undefined}
            >
              <img
                src={userProfile.avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-full cursor-pointer object-cover"
                onClick={() => {
                  if (!isHoverable) setShowDropdown(prev => !prev);
                }}
              />
              {showDropdown && (
                <UserDropdown onLogout={handleLogout} onClose={() => setShowDropdown(false)} />
              )}
            </div>
          ) : (
            <a
              href="/auth"
              className={`border hover:bg-[#F48C06] transition-colors duration-500 px-6 py-2 rounded-full hover:text-white font-semibold text-white border-white`}
            >
              Log in
            </a>
          )}
        </div>{' '}
        {window.innerWidth >= 768 && <CategoryBar isScrolled={isScrolled} isInHeader={true} />}
      </div>
    </div>
  );
};

export default Header;
