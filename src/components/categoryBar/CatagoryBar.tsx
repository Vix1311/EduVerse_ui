import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CategoryBarProps } from '@/models/interface/category.interface';
import { fetchCategories } from '@/redux/slices/category.slice';
import { AppDispatch, RootState } from '@/core/store/store';
import { useDispatch, useSelector } from 'react-redux';

const CategoryBar = ({ isScrolled, isInHeader }: CategoryBarProps) => {
  const iconColorClass = isScrolled ? 'text-white' : isInHeader ? 'text-white' : 'text-[#252641]';

  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.category.categories);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  return (
    <div
      className={`text-white px-2 py-3 z-40 relative transition duration-300 w-full${
        isScrolled ? 'bg-[#252641]' : 'bg-transparent'
      }`}
    >
      <div className="flex flex-wrap justify-center max-w-8xl mx-auto gap-x-6 gap-y-2 px-4">
        {categories.map(category => (
          <div key={category.id} className="relative">
            <Link
              to={`/courses/category/${category.id}`}
              className={`hover:text-[#F48C06] font-medium transition-colors duration-300 mr-5 ${iconColorClass}`}
            >
              {category.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBar;
