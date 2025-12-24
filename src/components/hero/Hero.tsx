import heroImg from '@/assets/images/hero.png';
import { useEffect } from 'react';
import { FaPlay } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

const Hero = () => {
  useEffect(() => {
    Fancybox.bind('[data-fancybox]', {});
    return () => {
      Fancybox.destroy();
    };
  }, []);

  return (
    <section className="relative bg-[#FFF3E4] overflow-hidden pb-20">
      <div className="relative z-10 container mx-auto px-6 pt-20 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2">
          <h1 className="text-4xl md:text-5xl md:ml-20 font-bold leading-tight text-[#2F327D]">
            <span className="text-[#F48C06]">Studying</span> Online is now much easier
          </h1>
          <p className=" md:ml-20 mt-10 text-[#464646] text-base md:text-lg max-w-md">
            Skilline is an interesting platform that will teach you in more an interactive way
          </p>

          <div className=" md:ml-20 mt-8 flex gap-4 items-center">
            <Link to="/auth">
              <button className="bg-[#F48C06] text-white p-1  md:px-6 md:py-3 rounded-full font-medium shadow hover:bg-[#e37b00] transition-colors duration-500">
                Join for free
              </button>
            </Link>

            <div >
              <a
                href="https://vimeo.com/191947042"
                data-fancybox
                data-aspect-ratio="2 / 1"
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center">
                  <FaPlay className="text-[#65DAFF]" />
                </div>
                <span className="text-[#252641] font-medium">Watch how it works</span>
              </a>
            </div>
          </div>
        </div>

        <div className="md:w-[650px] mt-10 md:-mt-20 mr-20 relative md:block hidden">
          <img src={heroImg} alt="Hero" className="max-w-full mx-auto" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
        <svg
          className="relative block w-full h-[120px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0,320 C360,50 1080,50 1440,320 L1440,0 L0,0 Z" fill="#F1F5F9" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
