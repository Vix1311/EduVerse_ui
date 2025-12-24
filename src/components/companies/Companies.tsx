import React, { useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/core/store/store';
import {
  fetchInstructors,
  selectInstructorError,
  selectInstructorLoading,
  selectInstructors,
} from '@/redux/slices/instructor.slice';
import defaultAvatar from '@/assets/icons/user.png';

const Companies: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const instructors = useSelector(selectInstructors);
  const loading = useSelector(selectInstructorLoading);
  const error = useSelector(selectInstructorError);

  useEffect(() => {
    dispatch(fetchInstructors({ skip: 0, take: 10 }));
  }, [dispatch]);

  const slidesToShow = instructors.length === 0 ? 1 : Math.min(instructors.length, 4);

  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(slidesToShow, 2),
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  return (
    <div className="py-16 px-8 bg-slate-100">
      <h2 className="text-center text-3xl md:text-4xl font-bold mb-12 text-blue-900">
        Community Experts
      </h2>

      {loading && <p className="text-center">Loading...</p>}

      {!loading && error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && instructors.length === 0 && (
        <p className="text-center text-gray-500">No instructors found.</p>
      )}

      {!loading && !error && instructors.length > 0 && (
        <Slider {...settings}>
          {instructors.map(ins => (
            <div key={ins.id} className="px-4">
              <div className="flex flex-col items-center bg-slate-100 p-14">
                <img
                  src={ins.avatar || defaultAvatar}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = defaultAvatar;
                  }}
                  alt={ins.fullname}
                  className="w-44 h-44 object-cover rounded-full mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-blue-900 mb-2">{ins.fullname}</h3>
              </div>
            </div>
          ))}
        </Slider>
      )}
    </div>
  );
};

export default Companies;
