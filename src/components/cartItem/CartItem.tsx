import axios from 'axios';
import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { CartItemProps } from '@/models/interface/cart.interface';

const CartItem = ({
  courseId,
  title,
  author,
  lectures,
  totalHours,
  level,
  price,
  originalPrice,
  thumbnail,
  onRemove,
}: CartItemProps) => {
  const [randomStars, setRandomStars] = useState(0);
  const [randomRatingsCount, setRandomRatingsCount] = useState(0);

  useEffect(() => {
    const stars = Math.floor(Math.random() * 5) + 1;
    const ratings = Math.floor(Math.random() * 1000) + 100;
    setRandomStars(stars);
    setRandomRatingsCount(ratings);
  }, []);
  return (
    <div className="relative flex flex-col sm:flex-row gap-4 border-b pb-4 mb-4 bg-white p-2 sm:items-center">
      <button
        onClick={async () => {
          try {
            if (courseId) {
              const token = localStorage.getItem('access_token');
              await axios.delete(`http://localhost:8080/api/v1/cart/${courseId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              toast.success('Course deleted successfully!');
            }
            onRemove?.();
          } catch (error) {
            console.error('Delete failed course:', error);
          }
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
        title="Remove"
      >
        <FaTimes />
      </button>

      <img
        src={thumbnail}
        alt={title}
        className="w-full sm:w-32 h-32 sm:h-20 object-cover rounded"
      />

      <div className="flex flex-col sm:flex-row justify-between w-full gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600 mt-1">By {author}</p>
          <div className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
            {Array.from({ length: randomStars }).map((_, i) => (
              <span key={i}>⭐</span>
            ))}
            <span className="text-gray-500">
              ({randomRatingsCount.toLocaleString('vi-VN')} ratings)
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {totalHours} hours • {lectures} lectures • {level}
          </p>
        </div>

        <div className="text-right sm:text-right sm:mt-10">
          <p className="text-base font-bold text-purple-800">
            ₫{(price ?? originalPrice).toLocaleString('vi-VN')}
          </p>
          {price && price !== originalPrice && (
            <p className="text-xs text-gray-500 line-through">
              ₫{originalPrice.toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;
