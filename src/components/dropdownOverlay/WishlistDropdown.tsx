import { useEffect, useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { WishlistDropdownProps } from '@/models/interface/wishlist.interface';
import { AppDispatch, RootState } from '@/core/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist } from '@/redux/slices/wishlist.slice';

const WishlistDropdown = ({ isScrolled, isInHeader = false }: WishlistDropdownProps) => {
  const [hovered, setHovered] = useState(false);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const iconColorClass = isScrolled ? 'text-white' : isInHeader ? 'text-white' : 'text-[#252641]';
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchWishlist());

    const reload = () => dispatch(fetchWishlist());
    window.addEventListener('wishlistUpdated', reload);
    return () => window.removeEventListener('wishlistUpdated', reload);
  }, [dispatch]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative"
    >
      <Link to="/my-learning/wishlish">
        <FaHeart
          className={`hover:text-[#F48C06] font-medium transition-colors duration-250 text-lg ${iconColorClass}`}
        />
      </Link>

      {hovered && (
        <div className="absolute top-[calc(100%+18px)] -left-36 -translate-x-1/2 w-96 bg-white shadow-xl rounded-lg p-4 z-50">
          <div
            className="fixed"
            style={{
              top: '-20px',
              left: '260px',
              width: '120px',
              height: '80px',
              zIndex: 40,
              pointerEvents: 'auto',
            }}
          />
          <div className="absolute top-[-8px] right-4 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white" />
          {wishlistItems.length > 0 ? (
            <>
              {wishlistItems.slice(0, 3).map(item => (
                <div key={item.course.id} className="flex items-start space-x-3 mb-4">
                  <img
                    src={item.course.thumbnail ?? undefined}
                    alt="thumb"
                    className="w-28 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm line-clamp-2">{item.course.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{item.course.teacher}</p>
                    <div className="mt-1 text-base font-semibold text-gray-900">
                      {item.course.price.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              ))}
              {wishlistItems.length > 3 && (
                <div className="text-sm text-gray-500 italic text-center">
                  ...and {wishlistItems.length - 3} more course
                  {wishlistItems.length - 3 > 1 ? 's' : ''}
                </div>
              )}
              <Link to="/my-learning/wishlish">
                <button className="w-full mt-2 bg-orange-500 text-white text-center py-2 rounded font-semibold hover:bg-orange-600">
                  Go to Wishlist
                </button>
              </Link>
            </>
          ) : (
            <p className="text-center text-sm text-gray-500">No items in wishlist.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WishlistDropdown;
