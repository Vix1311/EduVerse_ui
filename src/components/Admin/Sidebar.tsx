import { useState } from 'react';
import {
  Home,
  BookOpen,
  Users,
  CreditCard,
  ChevronDown,
  Tag,
  LogOut,
  MessageCircleMore,
} from 'lucide-react';
import { path } from '@/core/constants/path';
import { Link } from 'react-router-dom';
import { logo } from '@/assets/images';

const Sidebar = () => {
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);

  const menu = [
    { label: 'Dashboard', icon: <Home size={20} />, path: `/${path.admin.dashboard}` },
    {
      label: 'Courses',
      icon: <BookOpen size={20} />,
      path: '/courses',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Course List', path: `/${path.admin.courses}` },
        { label: 'Course Categories', path: `/${path.admin.categories}` },
      ],
    },
    { label: 'Users', icon: <Users size={20} />, path: `/${path.admin.users}` },
    { label: 'Feedback', icon: <MessageCircleMore size={20} />, path: `/${path.admin.feedback}` },
    { label: 'Promotion', icon: <Tag size={20} />, path: `/${path.admin.coupon}` },
    { label: 'Hashtag', icon: <Tag size={20} />, path: `/${path.admin.hashtag}` },
  ];

  return (
    <aside className="w-48 h-screen bg-gray-900 text-white p-4 flex flex-col">
      <Link to="/">
        <div className="flex gap-1 items-center pb-4">
          <img src={logo} alt="logo" className="transition-all duration-300 border-black h-6" />
          <span className="text-lg font-medium ">E-Learning</span>
        </div>
      </Link>
      <nav className="space-y-4 flex-grow">
        {menu.map((item, i) => (
          <div key={i}>
            <a
              href={item.hasDropdown ? undefined : item.path}
              className="flex items-center justify-between gap-3 text-sm hover:text-blue-400 cursor-pointer"
              onClick={() => item.hasDropdown && setIsCoursesDropdownOpen(prev => !prev)}
            >
              <div className="flex items-center gap-3">
                {item.icon} {item.label}
              </div>
              {item.hasDropdown && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isCoursesDropdownOpen ? 'rotate-180' : ''}`}
                />
              )}
            </a>
            {item.hasDropdown && isCoursesDropdownOpen && (
              <div className="ml-6 mt-2 space-y-2">
                {item.dropdownItems?.map((dropdownItem, j) => (
                  <a key={j} href={dropdownItem.path} className="block text-sm hover:text-blue-400">
                    {dropdownItem.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
