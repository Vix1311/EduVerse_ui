import ContactSection from '@/components/contact/ContactSection ';
import Footer from '@/components/footer/Footer';
import HeaderFixed from '@/components/header/HeaderFixed';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0); 
  }, []);
  return (
    <>
      <HeaderFixed />
      <div className="relative h-96  bg-gradient-to-b from-[#FFF3E4] to-orange-300 text-[#2F327D] flex items-start justify-start pt-48 px-4 md:pl-40">
        <div className="text-center">
          <h1 className="text-6xl font-bold mt-1 md:my-4">Contact Us</h1>
          <div className="flex pt-4 justify-start gap-2 text-lg text-[#2F327D]">
            <Link to="/" className="hover:text-[#F48C06] text-[#2F327D] font-medium transition-colors duration-300">
              Home
            </Link>
            <span className='text-[#2F327D]'>|</span>
            <Link to="/" className="hover:text-[#F48C06] text-[#2F327D] font-medium transition-colors duration-300">
              Service
            </Link>
          </div>
        </div>
      </div>
      <ContactSection />
      <Footer />
    </>
  );
};

export default Contact;
