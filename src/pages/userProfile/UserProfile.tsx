import { useUserProfile } from '@/hooks/useUserProfile';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { useState } from 'react';

const ProfileOverview = () => {
  const user = useUserProfile();
  const [activeTab, setActiveTab] = useState<'my-learning' | 'wishlist'>('my-learning');

  if (!user) return null;

  return (
    <>
      <Header />
      <div className="bg-white min-h-screen">
        {/* Cover + Avatar */}
        <div className="relative w-full h-52 sm:h-64 bg-gray-200">
          <img
            src={user.cover_photo}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-[-40px] sm:bottom-[-50px] left-1/2 transform -translate-x-1/2 sm:left-16 sm:translate-x-0">
            <img
              src={user.avatar}
              alt="avatar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white object-cover shadow"
            />
          </div>
        </div>

        {/* Name + Email */}
        <div className="pt-20 sm:pt-24 text-center sm:text-left px-4 sm:px-16">
          <h2 className="text-2xl font-bold">{user.full_name}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>

        {/* Tabs */}
        <div className="mt-6 sm:mt-10 px-4 sm:px-16 border-b">
          <div className="flex gap-6 font-semibold text-sm">
            <button
              onClick={() => setActiveTab('my-learning')}
              className={`pb-2 ${
                activeTab === 'my-learning'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              My Learning
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`pb-2 ${
                activeTab === 'wishlist'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Wishlist
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="px-4 sm:px-16 py-8"></div>
      </div>
      <Footer />
    </>
  );
};

export default ProfileOverview;
