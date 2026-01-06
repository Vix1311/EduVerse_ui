import React, { useEffect, useMemo, useRef, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import CourseDetailCurriculum from '@/components/courseDetail/CourseDetailCurriculum';
import { Header } from '@/components';
import Footer from '@/components/footer/Footer';
import NotFound from '@/components/404/NotFound';
import { extractYouTubeId } from '@/core/utils/extractYouTubeId';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/core/store/store';
import { addCourseToCart, buyNowCourse } from '@/redux/slices/cart.slice';
import {
  fetchCourseComments,
  fetchCourseDetail,
  fetchCourseMockData,
} from '@/redux/slices/courseDetail.slice';
import Loader from '@/components/loader/Loader';
import { toggleWishlist } from '@/redux/slices/wishlist.slice';
import { fetchCoursesAndWishlist, toggleWishlistCourseId } from '@/redux/slices/course.slice';
import { getModules, getLessons } from '@/redux/slices/module.slice';
import { listCoupons, Coupon } from '@/redux/slices/adminSlices/coupon.slice';
import {
  fetchTeacherFollowers,
  followTeacher,
  setIsFollowing,
  unfollowTeacher,
} from '@/redux/slices/teacherFollow.slice';
import { useUserProfile } from '@/hooks/useUserProfile';

const CoursePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const playerRef = useRef<YouTubePlayer | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROGRAMME' | 'LECTURER' | 'EVALUATE'>(
    'OVERVIEW',
  );
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [usedCouponTypes, setUsedCouponTypes] = useState<string[]>([]);
  const [isPreviewEnded, setIsPreviewEnded] = useState(false);
  const [isHoveredHeart, setIsHoveredHeart] = useState(false);

  const data = useSelector((s: RootState) => s.courseDetail.data);
  const includes = useSelector((s: RootState) => s.courseDetail.includes) || {};
  const lessonCommentsMap = useSelector((s: RootState) => s.courseDetail.map || {});
  const lessonEntries = Object.entries(lessonCommentsMap) as [
    string,
    { lesson: any; comments: any[] },
  ][];

  const { modules } = useSelector((s: RootState) => s.module);
  const { items: allCoupons } = useSelector((s: RootState) => s.coupon);

  const safeIncludes = {
    onDemandVideo: includes?.onDemandVideo ?? 'On-demand video',
    practiceTests: includes?.practiceTests ?? 'Practice tests',
    articles: includes?.articles ?? 'Articles',
    downloadableResources: includes?.downloadableResources ?? 'Downloadable resources',
    accessOnMobileAndTV: includes?.accessOnMobileAndTV ?? 'Access on mobile & TV',
    fullLifetimeAccess: includes?.fullLifetimeAccess ?? 'Full lifetime access',
    closedCaptions: includes?.closedCaptions ?? 'Closed captions',
    audioDescription: includes?.audioDescription ?? 'Audio description',
    certificateOfCompletion: includes?.certificateOfCompletion ?? 'Certificate of completion',
  };

  useEffect(() => {
    if (!id) return;
    dispatch(fetchCourseDetail(id));
    dispatch(fetchCoursesAndWishlist());
  }, [id, dispatch]);

  useEffect(() => {
    dispatch(fetchCourseMockData());
  }, [dispatch]);

  useEffect(() => {
    dispatch(listCoupons());
  }, [dispatch]);

  useEffect(() => {
    if (data?.best_coupon) setAppliedCoupon(data.best_coupon.code);
  }, [data]);

  // load modules for this course
  useEffect(() => {
    if (!id) return;
    const courseIdNum = Number(id);
    if (Number.isNaN(courseIdNum)) return;
    dispatch(getModules(courseIdNum));
  }, [id, dispatch]);

  // load lessons for each module if not already loaded
  useEffect(() => {
    if (!id) return;
    const courseIdNum = Number(id);
    if (Number.isNaN(courseIdNum)) return;
    if (!Array.isArray(modules) || modules.length === 0) return;

    modules.forEach((m: any) => {
      if (!m || typeof m.id === 'undefined') return;
      const hasLessons = Array.isArray(m.lessons) && m.lessons.length > 0;
      if (!hasLessons) {
        dispatch(
          getLessons({
            courseId: courseIdNum,
            moduleId: Number(m.id),
          }),
        );
      }
    });
  }, [id, modules, dispatch]);

  const isLoggedIn = () => {
    const token = localStorage.getItem('access_token');
    return Boolean(token && token !== 'null' && token !== 'undefined');
  };

  const handleVideoReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    const interval = setInterval(() => {
      const currentTime = playerRef.current?.getCurrentTime();
      if (currentTime && currentTime > 120) {
        playerRef.current?.stopVideo();
        setIsPreviewEnded(true);
        clearInterval(interval);
      }
    }, 1000);
  };

  // Normalize BE data
  const courseNorm = useMemo(() => {
    const d = (data || {}) as any;
    return {
      id: String(d._id ?? d.id ?? ''),
      title: d.course?.title ?? d.title ?? 'Untitled',
      description: d.course?.description ?? d.description ?? '',
      previewUrl: d.videoUrl ?? d.preview?.videoUrl ?? null,
      previewDurationSec: Number(d.preview?.duration ?? d.duration ?? 0),
      instructorName:
        d.instructor?.full_name ??
        d.instructor?.fullname ??
        d.teacher?.name ??
        d.author?.name ??
        'Unknown',
      instructorAvatar:
        d.instructor?.avatar ??
        d.teacher?.avatar ??
        d.author?.avatar ??
        'src/assets/icons/user.png',
      price: Number(d.price ?? d.originalPrice ?? 0),
      bestCoupon: d.best_coupon ?? null,
      topics: Array.isArray(d.topics) ? d.topics : [],
      categoryName: d.category?.name ?? '',
      thumbnail: d.thumbnail ?? '',
    };
  }, [data]);

  const courseIdNum = useMemo(() => {
    if (!id) return null;
    const num = Number(id);
    return Number.isFinite(num) ? num : null;
  }, [id]);

  const courseCoupons = useMemo(() => {
    if (!courseIdNum) return [];
    const now = new Date();

    return (allCoupons || []).filter((c: Coupon) => {
      const exp = new Date(c.expirationDate);
      const isExpired = !Number.isNaN(exp.getTime()) && exp.getTime() < now.getTime();
      const isDeleted = !!c.deletedAt;

      return (
        !isDeleted &&
        !isExpired &&
        (Number(c.courseId) === courseIdNum || (c as any).courseId == null)
      );
    });
  }, [allCoupons, courseIdNum]);

  const couponsByCode = useMemo(() => {
    const map: Record<string, Coupon> = {};
    courseCoupons.forEach(c => {
      if (c.code) map[c.code] = c;
    });
    return map;
  }, [courseCoupons]);

  // Preview video URL
  const previewVideoUrl = useMemo(() => {
    if (courseNorm.previewUrl) return courseNorm.previewUrl;

    if (!Array.isArray(modules) || modules.length === 0) return null;

    for (const m of modules as any[]) {
      const lessons = Array.isArray(m.lessons) ? [...m.lessons] : [];
      lessons.sort(
        (a: any, b: any) => (a.lessonOrder ?? a.order ?? 0) - (b.lessonOrder ?? b.order ?? 0),
      );
      const previewLesson = lessons.find(
        (l: any) =>
          l && l.isPreviewable && typeof l.videoUrl === 'string' && l.videoUrl.trim() !== '',
      );
      if (previewLesson) {
        return previewLesson.videoUrl as string;
      }
    }
    return null;
  }, [courseNorm.previewUrl, modules]);

  const allLessons = useMemo(
    () =>
      Array.isArray(modules)
        ? modules.flatMap((m: any) => (Array.isArray(m.lessons) ? m.lessons : []))
        : [],
    [modules],
  );

  const myLearningIds = useSelector((s: RootState) => s.myLearning.ids);
  const wishlistCourseIds = useSelector((s: RootState) => s.courses.wishlistCourseIds);

  const isWishlisted = useMemo(
    () => (courseNorm.id ? wishlistCourseIds.map(String).includes(courseNorm.id) : false),
    [courseNorm.id, wishlistCourseIds],
  );
  const hasCourseId = Boolean(courseNorm.id);

  const handleAddToCart = (mode: 'ADD' | 'ENROLL' = 'ADD') => {
    if (!data) return;

    if (!isLoggedIn()) {
      toast.error('You need to login to continue.');
      setTimeout(() => navigate('/auth'), 800);
      return;
    }

    if (data?.id && myLearningIds.includes(String(data.id))) {
      if (mode === 'ADD') {
        toast.warning('You already enrolled in this course!');
      }
      // Không toast cho 'ENROLL' mode
      return;
    }

    if (!data?.id) return;
    dispatch(addCourseToCart({ courseId: data.id, coupon: appliedCoupon || undefined }))
      .unwrap?.()
      .then?.((response: any) => {
        if (mode === 'ENROLL') {
          if (response?.status === 409) return;
          toast.success('Enrolled successfully! Check My Learning.');
        }
      })
      .catch?.((err: any) => {
        if (err?.status === 409) return;
        toast.error(mode === 'ENROLL' ? 'Failed to enroll' : 'Failed to add to cart');
      });
  };

  const handleBuyNow = () => {
    if (!data) return;
    if (!isLoggedIn()) {
      toast.error('You need to login to continue.');
      setTimeout(() => navigate('/auth'), 800);
      return;
    }
    if (!data?.id) return;
    // cart.slice.ts: buyNowCourse({ courseId, couponCode })
    dispatch(
      buyNowCourse({
        courseId: data.id,
        couponCode: appliedCoupon || undefined,
      }),
    )
      .unwrap()
      .then(() => {
        toast.success('Course added to cart!');
      })
      .catch(() => {
        toast.error('Failed to add to cart');
      });
  };

  const handleToggleWishlist = () => {
    if (!courseNorm.id) return;
    dispatch(toggleWishlist({ courseId: Number(courseNorm.id), isWishlisted }))
      .unwrap()
      .then(() => {
        dispatch(toggleWishlistCourseId(courseNorm.id));
        toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
        window.dispatchEvent(new Event('wishlistUpdated'));
      })
      .catch(err => toast.error(err?.message || 'Toggle failed'));
  };

  const teacherFollow = useSelector((s: RootState) => s.teacherFollow);
  const isFollowLoading = teacherFollow.loading;

  const userProfile: any = useUserProfile();
  const currentUserId = String(userProfile?.id ?? userProfile?.user?.id ?? userProfile?._id ?? '');

  const teacherUserId = useMemo(() => {
    return String(data?.teacher?.id ?? '');
  }, [data]);

  const isFollowing = teacherUserId ? !!teacherFollow.isFollowingMap[String(teacherUserId)] : false;

  useEffect(() => {
    if (!teacherUserId) return;
    if (!currentUserId) return;
    if (!isLoggedIn()) return;

    dispatch(fetchTeacherFollowers({ teacherId: `user/${teacherUserId}` }))
      .unwrap()
      .then(res => {
        const items = res?.items || [];
        const found = items.some((it: any) => String(it?.user?.id) === String(currentUserId));
        dispatch(setIsFollowing({ teacherId: teacherUserId, value: found }));
      })
      .catch(() => {});
  }, [dispatch, teacherUserId, currentUserId]);

  const handleToggleFollowTeacher = () => {
    if (!teacherUserId) return;

    if (!isLoggedIn()) {
      toast.error('You need to login to continue.');
      setTimeout(() => navigate('/auth'), 800);
      return;
    }

    const key = `user/${teacherUserId}`;
    const thunk = isFollowing ? unfollowTeacher(key) : followTeacher(key);

    dispatch(thunk)
      .unwrap()
      .then(() => {
        toast.success(isFollowing ? 'Unfollowed teacher' : 'Followed teacher');

        dispatch(fetchTeacherFollowers({ teacherId: key }))
          .unwrap()
          .then(res => {
            const items = res?.items || [];
            const found = items.some((it: any) => String(it?.user?.id) === String(currentUserId));
            dispatch(setIsFollowing({ teacherId: teacherUserId, value: found }));
          });
      })
      .catch((err: any) => toast.error(err || 'Action failed'));
  };
  const followersKey = teacherUserId ? `user/${teacherUserId}` : '';
  const followerCount =
    (followersKey && teacherFollow.followersTotalByTeacherId?.[followersKey]) ??
    (followersKey && teacherFollow.followersByTeacherId?.[followersKey]?.length) ??
    0;

  if (!data) return <Loader />;

  return (
    <>
      <Header />

      <div className="coursedetail mx-auto mt-6 p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 bg-white rounded-2xl shadow-lg">
        {/* LEFT: Player + basic info */}
        <div className="lg:col-span-3 space-y-6 border shadow-lg rounded-xl">
          <div className="aspect-video rounded-xl overflow-hidden shadow-md">
            {previewVideoUrl ? (
              <div className="relative w-full h-full">
                <YouTube
                  videoId={extractYouTubeId(previewVideoUrl) || ''}
                  opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0 } }}
                  onReady={handleVideoReady}
                  className="w-full h-full"
                />
                {isPreviewEnded && (
                  <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center text-white text-xl font-bold z-10">
                    Preview ended. Please buy to continue.
                  </div>
                )}
              </div>
            ) : courseNorm.thumbnail ? (
              <img
                src={courseNorm.thumbnail}
                alt={courseNorm.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                No video available
              </div>
            )}
          </div>

          <div className="space-y-4 p-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">{courseNorm.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <i className="fas fa-user text-purple-600" />
                <span>{courseNorm.instructorName}</span>
              </div>

              {courseNorm.categoryName && (
                <div className="flex items-center gap-2">
                  <i className="fas fa-tag text-purple-600" />
                  <span>{courseNorm.categoryName}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <i className="fas fa-eye text-purple-600" />
                <span>{Math.max(0, Math.round(courseNorm.previewDurationSec / 60))} minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Price / actions / includes */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border space-y-4 h-full">
          {(() => {
            const original = courseNorm.price;

            const calculateDiscount = (
              originalPrice: number,
              code: string | null,
              couponMap: Record<string, Coupon>,
              bestCouponFromApi: any,
            ): { discounted: number; percent: number } => {
              if (!code) return { discounted: originalPrice, percent: 0 };

              // ưu tiên coupon từ coupon.slice
              const c = couponMap[code];
              if (c) {
                const t = (c.discountType || '').toLowerCase();
                if (t === 'percent' || t === 'percentage') {
                  return {
                    discounted: Math.round(originalPrice * (1 - c.discountAmount / 100)),
                    percent: c.discountAmount,
                  };
                }
                const off = c.discountAmount;
                return {
                  discounted: Math.max(0, originalPrice - off),
                  percent: originalPrice ? Math.round((off / originalPrice) * 100) : 0,
                };
              }

              // fallback: best_coupon từ API course detail
              if (bestCouponFromApi?.code === code) {
                const amt = bestCouponFromApi.discount_amount;
                const t = (bestCouponFromApi.discount_type || '').toLowerCase();
                if (t === 'percentage') {
                  return {
                    discounted: Math.round(originalPrice * (1 - amt / 100)),
                    percent: amt,
                  };
                }
                return {
                  discounted: Math.max(0, originalPrice - amt),
                  percent: originalPrice ? Math.round((amt / originalPrice) * 100) : 0,
                };
              }

              return { discounted: originalPrice, percent: 0 };
            };

            const { discounted, percent } = calculateDiscount(
              original,
              appliedCoupon,
              couponsByCode,
              courseNorm.bestCoupon,
            );

            const saved = Math.max(0, original - discounted);

            return (
              <>
                <span className="text-2xl font-bold text-gray-900">
                  {discounted.toLocaleString()}₫
                </span>

                {appliedCoupon && discounted < original && (
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-2 ">
                      <span className="text-lg text-gray-400 line-through">
                        {original.toLocaleString()}₫
                      </span>
                      <span className="text-base text-green-600 font-bold">{percent}% off</span>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {courseNorm.price > 0 ? (
            <>
              <div className="flex items-center justify-between mt-4 gap-1">
                <button
                  onClick={() => handleAddToCart('ADD')}
                  disabled={!hasCourseId}
                  className="w-full bg-purple-600 text-white font-semibold py-3 rounded-md"
                >
                  ADD TO CART
                </button>
                <button
                  onClick={handleToggleWishlist}
                  disabled={!hasCourseId}
                  onMouseEnter={() => setIsHoveredHeart(true)}
                  onMouseLeave={() => setIsHoveredHeart(false)}
                  className="p-3 border border-purple-300 rounded-lg hover:bg-purple-100 transition"
                  title={isWishlisted ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
                >
                  {isWishlisted ? (
                    isHoveredHeart ? (
                      <FaHeart className="text-xl text-purple-700" />
                    ) : (
                      <FaHeart className="text-xl text-purple-500" />
                    )
                  ) : isHoveredHeart ? (
                    <FaHeart className="text-xl text-purple-300" />
                  ) : (
                    <FaRegHeart className="text-xl" />
                  )}
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                className="w-full bg-purple-600 text-white font-semibold py-3 rounded-md"
              >
                BUY NOW
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between mt-4 gap-1">
              <button
                onClick={() => handleAddToCart('ENROLL')}
                disabled={!hasCourseId}
                className="w-full bg-purple-600 text-white font-semibold py-3 rounded-md"
              >
                ENROLL NOW
              </button>
            </div>
          )}

          {/* Includes */}
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">This course includes:</h3>
            <div className="relative h-1 bg-gray-200 overflow-hidden mb-6">
              <div className="absolute inset-0 bg-purple-500 w-1/5 animate-slide" />
            </div>
            <ul className="text-sm text-gray-700 space-y-3">
              <li className="flex items-center gap-3">
                <i className="fas fa-desktop text-purple-500" />
                {safeIncludes.onDemandVideo}
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-question-circle text-purple-500" />
                {safeIncludes.practiceTests}
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-file-alt text-purple-500" />
                {safeIncludes.articles}
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-download text-purple-500" />
                {safeIncludes.downloadableResources}
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-mobile-alt text-purple-500" />
                {safeIncludes.accessOnMobileAndTV}
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-infinity text-purple-500" />
                {safeIncludes.fullLifetimeAccess}
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-closed-captioning text-purple-500" />
                {safeIncludes.closedCaptions}
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-audio-description text-purple-500" />
                {safeIncludes.audioDescription}
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-trophy text-purple-500" />
                {safeIncludes.certificateOfCompletion}
              </li>
            </ul>
          </div>

          {/* Coupon info */}
          {!appliedCoupon && courseNorm.bestCoupon && (
            <div className="mt-2 border border-purple-200 bg-purple-50 rounded px-3 py-2 flex flex-col relative">
              <button
                onClick={() => {
                  setAppliedCoupon(null);
                  setUsedCouponTypes([]);
                }}
                className="absolute top-1 right-2 text-purple-400 hover:text-purple-600 text-sm"
              >
                ×
              </button>
              <span className="font-bold text-purple-700">
                {courseNorm.bestCoupon.code} is ready to apply
              </span>
              <span className="text-xs text-gray-500">Best coupon is ready apply</span>
            </div>
          )}

          {appliedCoupon && (
            <div className="relative mt-2 border border-purple-200 bg-purple-50 rounded px-3 py-2 flex flex-col">
              <button
                onClick={() => {
                  setAppliedCoupon(null);
                  setUsedCouponTypes([]);
                }}
                className="absolute top-1 right-2 text-purple-400 hover:text-purple-600 text-sm"
              >
                ×
              </button>
              <span className="font-bold text-purple-700">{appliedCoupon} is applied</span>
              <span className="text-xs text-gray-500">Coupon is applied</span>
            </div>
          )}

          {/* Apply coupon form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              const code = coupon.trim();
              if (!code) return;

              let typeKey = '';
              const c = couponsByCode[code];

              if (c) {
                typeKey = (c.discountType || '').toLowerCase();
              } else if (courseNorm.bestCoupon && courseNorm.bestCoupon.code === code) {
                typeKey = (courseNorm.bestCoupon.discount_type || '').toLowerCase();
              } else {
                return toast.error('Invalid coupon');
              }

              if (typeKey && usedCouponTypes.includes(typeKey)) {
                return toast.error('Each coupon type can only be used once');
              }

              setAppliedCoupon(code);
              setUsedCouponTypes(prev => (typeKey ? [...prev, typeKey] : prev));
              toast.success('Coupon applied!');
            }}
            className="flex gap-2"
          >
            <input
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
              placeholder="Enter coupon"
              className="flex-grow border border-gray-300 px-3 py-2 rounded text-sm"
            />
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">
              Apply
            </button>
          </form>
          {courseCoupons.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex flex-wrap gap-2">
                {courseCoupons.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCoupon(c.code)}
                    className="px-2 py-1 rounded border border-purple-300 bg-purple-50 text-xs hover:bg-purple-100"
                    title={
                      c.discountType?.toLowerCase().includes('percent')
                        ? `${c.code} - Giảm ${c.discountAmount}%`
                        : `${c.code} - Giảm ${c.discountAmount.toLocaleString()}₫`
                    }
                  >
                    <span className="font-semibold">{c.code}</span>
                    <span className="ml-1 text-gray-600">
                      (
                      {c.discountType?.toLowerCase().includes('percent')
                        ? `-${c.discountAmount}%`
                        : `-${c.discountAmount.toLocaleString()}₫`}
                      )
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM: Tabs */}
        <div className="lg:col-span-4 mt-12">
          <div className="flex border-b pb-3 mb-6">
            {(['OVERVIEW', 'PROGRAMME', 'LECTURER', 'EVALUATE'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-center px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50'
                    : 'text-gray-500 hover:text-purple-600 hover:border-b-2 hover:border-purple-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-inner">
            {(() => {
              switch (activeTab) {
                case 'OVERVIEW':
                  return (
                    <div className="text-gray-700 text-[16px] leading-relaxed space-y-4">
                      <h2 className="text-2xl font-bold">📘 Course Introduction</h2>
                      <div>
                        {courseNorm.description
                          ?.replace(/\n/g, '\n')
                          .split('\n')
                          .map((line: string, i: number) => <p key={i}>{line}</p>)}
                      </div>
                      <h2 className="text-2xl font-bold">🎬 Course Preview</h2>
                      <p>{courseNorm.description}</p>
                      <p>
                        Duration: {Math.max(0, Math.round(courseNorm.previewDurationSec / 60))}{' '}
                        minutes
                      </p>
                    </div>
                  );
                case 'PROGRAMME':
                  return <CourseDetailCurriculum topics={courseNorm.topics} lessons={allLessons} />;
                case 'LECTURER':
                  return (
                    <div className="flex flex-col lg:flex-row items-center lg:items-start bg-purple-50 p-6 rounded-lg space-y-6 lg:space-y-0 lg:space-x-6">
                      <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                        <img
                          src={courseNorm.instructorAvatar}
                          alt="Instructor Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-center gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              {courseNorm.instructorName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {data?.instructor?.bio || 'No bio provided.'}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-semibold">{followerCount}</span> followers
                            </p>
                          </div>
                          <button
                            onClick={handleToggleFollowTeacher}
                            disabled={!teacherUserId || isFollowLoading}
                            className={`px-4 py-2 rounded-md font-semibold transition ${
                              isFollowing
                                ? 'bg-white border border-purple-400 text-purple-700 hover:bg-purple-100'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            } ${(!teacherUserId || isFollowLoading) && 'opacity-60 '}`}
                          >
                            {isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );

                case 'EVALUATE':
                  if (lessonEntries.length === 0)
                    return <p className="text-gray-500">No comments available for any lesson.</p>;
                  return (
                    <div className="space-y-10">
                      {lessonEntries.map(([lessonId, { comments }]) => (
                        <div key={lessonId} className="space-y-4">
                          {comments.map((review: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-start bg-purple-50 p-4 rounded-lg shadow-md space-x-4"
                            >
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300">
                                <img
                                  src={review.user?.avatar || '/default-avatar.png'}
                                  alt="avatar"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-gray-800">
                                    {review.user?.full_name || 'Anonymous'}
                                  </h4>
                                  <div className="text-yellow-500">
                                    {'⭐'.repeat(review.rating)}
                                    {'☆'.repeat(5 - review.rating)}
                                  </div>
                                </div>
                                <p className="text-gray-700 mt-2">{review.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                default:
                  return null;
              }
            })()}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CoursePreview;
