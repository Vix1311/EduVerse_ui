import { FaArrowRight, FaChevronRight, FaStar } from 'react-icons/fa';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { TestimonialData } from '@/models/interface/testimonial.interface';

const Testimonial = () => {
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);

  const nextSlide = () => {
    setCurrentIndex(prevIndex => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1));
  };

  useEffect(() => {
    axios
      .get('/data/TestimonialsData/Testimonials.json')
      .then(response => {
        const data = response.data;
        if (Array.isArray(data.testimonials)) {
          setTestimonials(data.testimonials);
        } else {
          console.error('❌ Invalid JSON format: "testimonials" is missing or not an array');
          setTestimonials([]); // fallback to empty array
        }
      })
      .catch(error => {
        console.error('❌ Error fetching testimonials:', error);
        setTestimonials([]); // fallback to empty array
      });
  }, []);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="bg-[#F1F5F9] py-16 px-4 sm:px-6 md:px-16 lg:px-32 text-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left Section */}
        <div className="text-left">
          <span className="text-sm tracking-widest font-semibold text-[#8F92A1] uppercase border-l-2 border-[#F48C06] pl-2 mb-2 block">
            Testimonial
          </span>
          <h1 className="text-3xl sm:text-4xl text-[#2F327D] font-bold mb-6">What they say?</h1>
          <div className="text-lg font-semibold text-gray-500 flex flex-col gap-y-3 max-w-md">
            <p>Skilline has got more than 100k positive ratings from our users around the world.</p>
            <p>Some of the students and teachers were greatly helped by the Skilline.</p>
            <p>Are you too? Please give your assessment</p>
          </div>

          <button className="flex items-center mt-10 border border-[#F48C06] text-[#F48C06] hover:text-white hover:bg-[#F48C06] transition-colors duration-300 rounded-full overflow-hidden">
            <span className="px-6 py-2 font-medium text-base">Write your assessment</span>
            <div className="w-12 h-12 flex items-center justify-center border-l rounded-full border-[#F48C06] hover:border-white duration-300">
              <FaArrowRight />
            </div>
          </button>
        </div>

        {/* Right Section */}
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-[420px] ">
            <div className="relative overflow-hidden">
              <div
                ref={carouselRef}
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {testimonials.map(item => (
                  <div key={item.id} className="flex-shrink-0 w-full rounded-lg shadow-lg">
                    <div className="rounded-xl overflow-hidden w-full max-w-[420px] h-[560px]">
                      <img
                        src={item.image}
                        alt="testimonial"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              title="click to previous slide"
              onClick={nextSlide}
              className="absolute -right-7 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-[#1EA4CE] rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
            >
              <FaChevronRight className="w-5 h-5" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  title="click to select slide"
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-[#F48C06] scale-125'
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>

            {/* Comment card */}
            {currentTestimonial && (
              <div className="absolute bottom-[-50px] left-1/2 md:left-2/3 transform -translate-x-1/2 bg-white rounded-xl shadow-lg p-6 w-[320px] text-start transition-all duration-500">
                <p className="text-[#464646] text-sm mb-4 border-l-4 pl-3 border-[#F48C06]">
                  "{currentTestimonial.review}"
                </p>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#2F327D]">{currentTestimonial.name}</h4>
                  <div className="text-[#F6B93B] flex gap-1">
                    {Array(currentTestimonial.rating)
                      .fill(0)
                      .map((_, i) => (
                        <FaStar key={i} />
                      ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">{currentTestimonial.reviewCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
