import Slider from 'react-slick';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CourseItem } from './CourseCard';
import { Course } from '@/models/interface/courseCard.interface';

interface Props {
  title: string;
  courses: Course[];
  wishlistCourseIds?: string[];
  setWishlistCourseIds?: React.Dispatch<React.SetStateAction<string[]>>;
}

const PrevArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    title="Previous"
    onClick={onClick}
    className="absolute left-[-20px] top-[180px] transform -translate-y-1/2 bg-white shadow p-4 rounded-full z-10 hover:bg-gray-100"
  >
    <FaChevronLeft />
  </button>
);

const NextArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    title="Next"
    onClick={onClick}
    className="absolute right-[-20px] top-[180px] transform -translate-y-1/2 bg-white shadow p-4 rounded-full z-10 hover:bg-gray-100"
  >
    <FaChevronRight />
  </button>
);

const CourseCardByCategory = ({
  title,
  courses,
  wishlistCourseIds = [],
  setWishlistCourseIds = () => {},
}: Props) => {
  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
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
        <h3 className="text-2xl font-bold mb-6 mt-6 ml-2 text-blue-900">{title}</h3>
        <Slider {...sliderSettings}>
          {courses.map(course => (
            <div key={course.id} className="px-2">
              <CourseItem course={course} wishlistCourseIds={wishlistCourseIds} />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default CourseCardByCategory;
