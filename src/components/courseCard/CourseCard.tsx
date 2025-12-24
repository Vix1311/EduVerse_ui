import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaBook,
  FaClock,
  FaEye,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaTag,
} from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CourseOverlayPortal from '../courseOverlayPortal/CourseOverlayPortal';
import { toast } from 'react-toastify';
import { Course } from '@/models/interface/courseCard.interface';
import { AppDispatch, RootState } from '@/core/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCoursesAndWishlist, toggleWishlistCourseId } from '@/redux/slices/course.slice';
import { toggleWishlist } from '@/redux/slices/wishlist.slice';

const FALLBACK_THUMB =
  'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1200';
const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const slidesToShow = 4;

const CourseCard = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const dispatch = useDispatch<AppDispatch>();
  const { courses1, courses2, courses3, wishlistCourseIds } = useSelector(
    (state: RootState) => state.courses,
  );

  // Load featured courses + wishlist ids once on mount
  useEffect(() => {
    dispatch(fetchCoursesAndWishlist());
  }, [dispatch]);

  const PrevArrow = ({ onClick }: { onClick?: () => void }) => (
    <button
      title="Previous"
      onClick={onClick}
      className="absolute left-[-20px] top-[180px] -translate-y-1/2 bg-white shadow p-4 rounded-full z-10 hover:bg-gray-100"
    >
      <FaChevronLeft />
    </button>
  );

  const NextArrow = ({ onClick }: { onClick?: () => void }) => (
    <button
      title="Next"
      onClick={onClick}
      className="absolute right-[-20px] top-[180px] -translate-y-1/2 bg-white shadow p-4 rounded-full z-10 hover:bg-gray-100"
    >
      <FaChevronRight />
    </button>
  );

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow,
    slidesToScroll: 1,
    autoplay: false,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="py-16 bg-slate-100">
      <div className="mx-auto px-2 sm:px-4 md:px-12 lg:px-24 xl:px-36 relative z-0">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-blue-900">
          Featured Courses
        </h2>

        {isHomePage ? (
          <Section title="Recommended for you">
            <Slider {...sliderSettings}>
              {courses1.map(course => (
                <div key={course.id} className="px-[8px]">
                  <CourseItem course={course} wishlistCourseIds={wishlistCourseIds} />
                </div>
              ))}
            </Slider>
          </Section>
        ) : (
          <>
            <Section title="Recommended for you">
              <Slider {...sliderSettings}>
                {courses1.map(course => (
                  <div key={course.id} className="px-[8px]">
                    <CourseItem course={course} wishlistCourseIds={wishlistCourseIds} />
                  </div>
                ))}
              </Slider>
            </Section>

            <Section title="Learners are viewing">
              <Slider {...sliderSettings}>
                {courses2.map(course => (
                  <div key={course.id} className="px-2">
                    <CourseItem course={course} wishlistCourseIds={wishlistCourseIds} />
                  </div>
                ))}
              </Slider>
            </Section>

            <Section title="Recommended to you based on ratings">
              <Slider {...sliderSettings}>
                {courses3.map(course => (
                  <div key={course.id} className="px-2">
                    <CourseItem course={course} wishlistCourseIds={wishlistCourseIds} />
                  </div>
                ))}
              </Slider>
            </Section>
          </>
        )}
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <>
    <h3 className="text-2xl font-bold mb-6 mt-12 ml-2 text-blue-900">{title}</h3>
    {children}
  </>
);

export const CourseItem = ({
  course,
  wishlistCourseIds,
}: {
  course: Course;
  wishlistCourseIds: string[];
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [isHoveredHeart, setIsHoveredHeart] = useState(false);
  const [overlayDirection, setOverlayDirection] = useState<'left' | 'right'>('right');
  const cardRef = useRef<HTMLDivElement>(null);
  const [overlayPos, setOverlayPos] = useState({ top: 0, left: 0, width: 0 });
  const dispatch = useDispatch<AppDispatch>();

  const norm = useMemo(() => {
    const c: any = course;

    const price = Number(c.price ?? c.discountPrice ?? c.originalPrice ?? 0);
    const originalPrice = Number(c.originalPrice ?? price);
    const hasDiscount =
      Boolean(c.hasDiscount) ||
      (c.discountPrice && c.discountPrice < originalPrice) ||
      Boolean(c.best_coupon);

    const createdAtRaw = c.createdAt ?? c.date ?? c.updatedAt ?? c.created_at ?? null;

    return {
      id: Number(c.id ?? c._id ?? ''),
      title: c.title ?? 'Untitled',
      description: c.description ?? c.previewDescription ?? '',
      thumbnail: c.thumbnail ?? c.images?.[0] ?? FALLBACK_THUMB,

      authorName: c.teacher?.name ?? c.author ?? 'Unknown',
      authorAvatar: c.teacher?.avatar ?? c.authorImage ?? FALLBACK_AVATAR,

      createdAt: createdAtRaw ? new Date(createdAtRaw) : null,

      lessons: c.totalLessons ?? c.lessons ?? 0,
      hours: c.totalDurationHours ?? c.hour ?? 0,
      views: c.students ?? c.views ?? 0,
      rating: Number(c.rating ?? c.avgRating ?? 0),
      price,
      originalPrice,
      hasDiscount,
      isBestseller: Boolean(c.isBesteller ?? c.isBestseller),
      categoryName: c.category?.name ?? '',
      features: (c.features as string[]) ?? [],
    };
  }, [course]);

  // Lookup for wishlist membership
  const wishlistIdSet = useMemo(() => new Set(wishlistCourseIds.map(String)), [wishlistCourseIds]);
  const isWishlisted = useMemo(() => wishlistIdSet.has(String(norm.id)), [wishlistIdSet, norm.id]);
  const handleCardClick = () => navigate(`/course/${norm.id}`);

  // Toggle wishlist and reconcile with server if states are out of sync
  const [toggling, setToggling] = useState(false);
  const handleToggleWishlist = () => {
    if (toggling) return;
    setToggling(true);

    const before = isWishlisted;
    dispatch(toggleWishlist({ courseId: norm.id, isWishlisted: before }))
      .unwrap()
      .then(() => {
        dispatch(toggleWishlistCourseId(norm.id));
        toast.success(before ? 'Removed from wishlist' : 'Added to wishlist');
        window.dispatchEvent(new Event('wishlistUpdated'));
      })
      .catch((err: any) => {
        const msg = err?.message || err?.data?.message || '';
        const status = err?.status || err?.response?.status;

        if (status === 409 || /already in wishlist/i.test(msg)) {
          if (!before) dispatch(toggleWishlistCourseId(norm.id));
          toast.info('Item is already in your wishlist. Synced with server.');
          return;
        }
        if (status === 404 || /not in wishlist/i.test(msg)) {
          if (before) dispatch(toggleWishlistCourseId(norm.id));
          toast.info('Item was not in wishlist. Synced with server.');
          return;
        }
        toast.error(msg || 'Toggle failed');
      })
      .finally(() => setToggling(false));
  };

  // Compute overlay direction & position to avoid viewport overflow
  useEffect(() => {
    if (!hovered || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const cardWidth = rect.width;
    const willOverflow = rect.left + cardWidth + 320 + 16 > screenWidth;

    setOverlayDirection(willOverflow ? 'left' : 'right');
    const left = willOverflow ? rect.left - cardWidth - 16 : rect.right + 16;
    setOverlayPos({ top: rect.top, left, width: cardWidth });
  }, [hovered]);

  // Keep all cards the same height to prevent layout shifts when overlay appears
  useEffect(() => {
    const syncHeights = () => {
      const cards = document.querySelectorAll('.course-card');
      let maxHeight = 0;
      cards.forEach(card => {
        const h = (card as HTMLElement).offsetHeight;
        if (h > maxHeight) maxHeight = h;
      });
      cards.forEach(card => {
        (card as HTMLElement).style.height = `${maxHeight}px`;
      });
    };

    syncHeights();
    window.addEventListener('resize', syncHeights);
    return () => window.removeEventListener('resize', syncHeights);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      className="cursor-pointer relative bg-white shadow rounded-lg w-full course-card"
    >
      <div onClick={handleCardClick}>
        <div className="relative w-full h-[180px]">
          <img src={norm.thumbnail} alt={norm.title} className="w-full h-full object-cover" />
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <img
                src={norm.authorAvatar}
                alt={norm.authorName}
                className="w-12 h-12 rounded-full object-cover mr-3"
              />
              <div className="flex flex-col">
                <span className="text-base text-gray-700 font-medium">{norm.authorName}</span>
                {norm.categoryName && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <FaTag /> {norm.categoryName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-3 text-gray-800 line-clamp-2 min-h-[3.5rem]">
            {norm.title}
          </h3>

          <div className="flex justify-between text-xs text-gray-500 mb-5 space-x-2">
            <div className="flex items-center">
              <FaBook className="mr-1" /> {norm.lessons} lessons
            </div>
            <div className="flex items-center">
              <FaClock className="mr-1" /> {norm.hours} hours
            </div>
            <div className="flex items-center">
              <FaEye className="mr-1" /> {norm.views} students
            </div>
          </div>

          <div className="flex items-center text-xs text-yellow-500 space-x-1">
            <span className="font-bold">{norm.rating.toFixed(1)}</span>
            <span className="flex">
              {Array.from({ length: 5 }, (_, i) =>
                i < Math.floor(norm.rating) ? (
                  <FaStar key={i} />
                ) : i < norm.rating ? (
                  <FaStarHalfAlt key={i} />
                ) : (
                  <FaRegStar key={i} />
                ),
              )}
            </span>
          </div>

          <div className="flex justify-between mt-2 space-x-2">
            <div>
              <span className="text-base font-bold text-gray-900">
                {formatCurrency(norm.price)}
              </span>
              {norm.hasDiscount && (
                <span className="text-base text-gray-400 line-through ml-2">
                  {formatCurrency(norm.originalPrice)}
                </span>
              )}
            </div>

            {norm.isBestseller && (
              <span className="text-xs bg-green-400 text-white font-semibold px-2 py-1 rounded">
                Bestseller
              </span>
            )}
          </div>
        </div>
      </div>

      {hovered && (
        <>
          <CourseOverlayPortal
            position={overlayPos}
            direction={overlayDirection}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onTouchStart={() => setHovered(true)}
            onTouchEnd={() => setHovered(false)}
            content={
              <div className="bg-white rounded-lg">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-bold text-gray-800 line-clamp-3 ">{norm.title}</h4>
                  {norm.createdAt && (
                    <span className="text-xs text-gray-400">
                      {norm.createdAt.toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mt-1 mb-3 line-clamp-6">{norm.description}</p>
                {!!norm.features.length && (
                  <ul className="text-sm text-gray-600 space-y-2 mb-4">
                    {norm.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">✔️</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between">
                  <button
                    disabled={toggling}
                    onMouseEnter={() => setIsHoveredHeart(true)}
                    onMouseLeave={() => setIsHoveredHeart(false)}
                    onClick={handleToggleWishlist}
                    className="p-3 border border-orange-500 rounded-full hover:bg-orange-200 transition disabled:opacity-50"
                  >
                    {isWishlisted ? (
                      isHoveredHeart ? (
                        <FaHeart className="text-xl text-orange-800" />
                      ) : (
                        <FaHeart className="text-xl text-orange-600" />
                      )
                    ) : isHoveredHeart ? (
                      <FaHeart className="text-xl text-orange-400" />
                    ) : (
                      <FaRegHeart className="text-xl" />
                    )}
                  </button>

                  <Link
                    to={`/course/${norm.id}`}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                  >
                    Find Out More
                  </Link>
                </div>
              </div>
            }
          />

          <div
            className={`absolute top-0 h-full w-6 z-40 bg-transparent ${
              overlayDirection === 'left' ? 'right-full' : 'left-full'
            }`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onTouchStart={() => setHovered(true)}
            onTouchEnd={() => setHovered(false)}
          />
        </>
      )}
    </div>
  );
};

export default CourseCard;
