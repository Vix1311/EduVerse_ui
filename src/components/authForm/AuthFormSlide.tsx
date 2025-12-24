import React, { useState, useEffect } from 'react';
import RegisterFormContent from './RegisterFormContent';
import LoginFormContent from './LoginFormContent';
import { logo } from '@/assets/images';
import { Link } from 'react-router-dom';
import authImage from '@/assets/images/Auth.png';

const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if the screen size is considered mobile (width ≤ 1024 and height ≤ 1792)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024 && window.innerHeight <= 1792);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <div className="relative z-10 bg-white shadow-2xl rounded-2xl overflow-hidden w-full flex flex-col xl:flex-row">
        {/* Form Section */}
        <div className="xl:w-[35%] w-full px-6 sm:px-10 md:px-24 lg:px-32 xl:px-16 6xl:px-72 py-8 lg:py-8 flex flex-col justify-center min-h-screen rounded-l-2xl bg-white">
          <div className="absolute top-4 left-4 z-20">
            <Link to="/">
              <div className="flex gap-1 items-center">
                <img src={logo} alt="logo" className="transition-all duration-300 h-10 sm:h-12 6xl:h-32" />
              </div>
            </Link>
          </div>

          {isSignUp ? (
            <RegisterFormContent onSwitchToLogin={() => setIsSignUp(false)} />
          ) : (
            <LoginFormContent onSwitchToSignUp={() => setIsSignUp(true)} />
          )}
        </div>

        {/* Welcome Section */}
        <div className="relative xl:w-[65%] w-full p-3 bg-white rounded-r-full hidden xl:block">
          <div
            className="w-full h-full bg-cover bg-center rounded-xl"
            style={{ backgroundImage: `url('${authImage}')` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
