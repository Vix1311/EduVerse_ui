import { FaShoppingCart } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/core/store/store';
import { fetchCart } from '@/redux/slices/cart.slice';
import type { CartItem } from '@/models/interface/cart.interface';

type Props = {
  isScrolled?: boolean;
  isInHeader?: boolean;
};

const CartDropdown = ({ isScrolled, isInHeader = false }: Props) => {
  const [hovered, setHovered] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const cartItems = useSelector((s: RootState) => (s.cart?.items as CartItem[]) ?? []);

  const iconColorClass = isScrolled ? 'text-white' : isInHeader ? 'text-white' : 'text-[#252641]';

  useEffect(() => {
    // initial load
    dispatch(fetchCart());

    // refresh when other parts of app announce updates
    const reload = () => dispatch(fetchCart());
    window.addEventListener('cartUpdated', reload);

    // cross-tab sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cart:updated' && e.newValue) reload();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('cartUpdated', reload);
      window.removeEventListener('storage', onStorage);
    };
  }, [dispatch]);

  const totalPrice = cartItems.reduce(
    (sum, item: any) => sum + (item.final_price ?? item.price ?? 0),
    0,
  );

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative inline-flex"
    >
      <Link to="/cart" title="Cart" aria-label="Cart">
        <FaShoppingCart
          className={`hover:text-[#F48C06] font-medium transition-colors duration-250 text-lg ${iconColorClass}`}
        />
      </Link>

      {hovered && (
        <div>
          <div className="z-50 absolute top-[calc(100%+12px)] -right-2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white" />
          <div
            className="fixed"
            style={{
              top: '40px',
              right: '150px',
              width: '120px',
              height: '80px',
              zIndex: 60,
              pointerEvents: 'auto',
            }}
          />
        </div>
      )}

      {hovered && (
        <div className="absolute top-[calc(100%+20px)] -left-36 -translate-x-1/2 w-96 bg-white shadow-xl rounded-lg p-4 z-50 max-h-[80vh] overflow-auto">
          {cartItems.length > 0 ? (
            <>
              {cartItems.slice(0, 3).map((item: any, idx: number) => (
                <div key={item.id ?? idx} className="flex justify-between items-start mb-4">
                  <img
                    src={item.course?.thumbnail ?? item.thumbnail ?? ''}
                    alt="thumbnail"
                    className="w-28 h-16 object-cover rounded"
                  />
                  <div className="flex-1 px-3">
                    <h4 className="font-semibold text-sm line-clamp-2">
                      {item.course?.title ?? item.title ?? 'Updating...'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.course?.teacher ??
                        item.course?.instructor?.full_name ??
                        item.author ??
                        ''}
                    </p>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {(item.final_price ?? item.price ?? 0).toLocaleString('vi-VN')} ₫
                    </div>
                    {(item.course?.price ?? item.originalPrice) && (
                      <div className="text-xs line-through text-gray-400">
                        {(item.course?.price ?? item.originalPrice).toLocaleString('vi-VN')} ₫
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {cartItems.length > 3 && (
                <div className="text-sm text-gray-500 italic text-center">
                  ...and {cartItems.length - 3} more course{cartItems.length - 3 > 1 ? 's' : ''}
                </div>
              )}

              <div className="border-t pt-3 mt-2 flex justify-between font-semibold text-gray-800">
                <span>Total:</span>
                <span>{totalPrice.toLocaleString('vi-VN')} ₫</span>
              </div>

              <Link
                to="/cart"
                className="block mt-4 w-full bg-orange-500 text-white text-center py-2 rounded-md font-semibold hover:bg-orange-600"
              >
                Go to cart
              </Link>
            </>
          ) : (
            <p className="text-center text-sm text-gray-500">Your cart is empty.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CartDropdown;
