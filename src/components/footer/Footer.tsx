import { logo } from '@/assets/images';
import { FaFacebook, FaPinterest, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#252641] text-white pt-32">
      <div className="max-w-8xl mx-auto pl-10 md:pl-40">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Courses Column */}
          <div>
            <div className='flex items-center mb-4'>
              <img src={logo} alt="logo" className="h-12 transition-all duration-300 " />
              <span className={`text-2xl ml-1 font-semibold text-white`}>E-Learning</span>
            </div>

            <p className="text-gray-400 text-sm pt-3">
              The automated process starts as soon as your clothes go into the machine.
            </p>
          </div>

          {/* Our Solutions Column */}
          <div className="justify-center">
            <h3 className="text-lg font-bold mb-4">Our Solutions</h3>
            <ul className="space-y-2">
              <li>
                <a href="#solution1" className="hover:text-[#F48C06] transition">
                  Design & creatives
                </a>
              </li>
              <li>
                <a href="#solution2" className="hover:text-[#F48C06] transition">
                  Telecommunication
                </a>
              </li>
              <li>
                <a href="#solution3" className="hover:text-[#F48C06] transition">
                  Programing
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#faq" className="hover:text-[#F48C06] transition">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-[#F48C06] transition">
                  Contact
                </a>
              </li>
              <li>
                <a href="#help" className="hover:text-[#F48C06] transition">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="hover:text-[#F48C06] transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#careers" className="hover:text-[#F48C06] transition">
                  Careers
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-[#F48C06] transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright Section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Social Media Icons */}
          <div className="flex gap-4 mb-4 md:mb-0">
            <a title="twitter" href="#twitter" className="hover:text-[#1DA1F2]">
              <FaTwitter className="w-6 h-6 " />
            </a>
            <a title="facebook" href="#facebook" className="hover:text-[#1877F2]">
              <FaFacebook className="w-6 h-6" />
            </a>
            <a title="pinterest" href="#pinterest" className="hover:text-[#E60023]">
              <FaPinterest className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
      <p className="text-white text-center pt-36 pb-5 text-lg">
        Copyright ©2025 All rights reserved | This template is made with with 💜 by MaiKyVi
      </p>
    </footer>
  );
};

export default Footer;
