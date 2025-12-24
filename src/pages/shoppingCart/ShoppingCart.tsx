import { Header } from '@/components';
import CartItem from '@/components/cartItem/CartItem';
import CheckoutButton from '@/components/cartItem/CheckOut';
import Footer from '@/components/footer/Footer';
import LoaderOverlay from '@/components/loader/LoaderOverlay';
import { AppDispatch } from '@/core/store/store';
import { CartCourse, CouponType } from '@/models/interface/cart.interface';
import { checkMomoPayment, clearCartOnServer, fetchCart } from '@/redux/slices/cart.slice';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CartPage = () => {
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [usedCouponTypes, setUsedCouponTypes] = useState<string[]>([]);
  const [cartCourses, setCartCourses] = useState<CartCourse[]>([]);
  const [coupons, setCoupons] = useState<Record<string, CouponType>>({});
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCart = () => {
      setIsLoading(true);

      dispatch(fetchCart())
        .unwrap()
        .then(data => setCartCourses(data))
        .catch(err => toast.error(err))
        .finally(() => setIsLoading(false));
    };

    window.addEventListener('cartUpdated', loadCart);
    loadCart();

    return () => window.removeEventListener('cartUpdated', loadCart);
  }, [dispatch]);

  // When Momo finishes paying and redirects to /cart?momo=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const momoFlag = params.get('momo');

    if (momoFlag === '1') {
      // Call API /orders/momo/return to check payment result
      setIsLoading(true);
      dispatch(checkMomoPayment())
        .unwrap()
        .catch(err => {
          console.error(err);
          // the error has been toasted in the thunk, just log it here
        })
        .finally(() => {
          setIsLoading(false);
          // Delete ?momo=1 from the URL so that F5 is not called again
          params.delete('momo');
          navigate({ search: params.toString() }, { replace: true });

          // After paying After completing the payment, reload the cart to be sure
          dispatch(fetchCart())
            .unwrap()
            .then(data => setCartCourses(data))
            .catch(err => toast.error(err));
        });
    }
  }, [location.search, dispatch, navigate]);

  type CouponCode = keyof typeof coupons;
  type Coupon = (typeof coupons)[CouponCode];

  useEffect(() => {
    const couponEntries = Object.entries(coupons);
    const bestCouponEntry = couponEntries.reduce(
      (best, current) => {
        const type = current[1].type;
        if (usedCouponTypes.includes(type)) return best;
        if (!best || current[1].value > best[1].value) return current;
        return best;
      },
      null as [string, Coupon] | null,
    );

    if (bestCouponEntry) {
      const [code, { type }] = bestCouponEntry;
      setAppliedCoupon(code);
      setUsedCouponTypes([type]);
      toast.success(`Automatically apply best coupon: ${code}`);
    }
  }, []);

  const totalPrice = cartCourses.reduce((sum, c) => sum + (c.price ?? c.originalPrice), 0);
  const totalOriginal = cartCourses.reduce((sum, c) => sum + c.originalPrice, 0);

  const selectedCoupon = coupons[appliedCoupon as CouponCode];
  const discountAmount = selectedCoupon
    ? selectedCoupon.type === 'fixed'
      ? selectedCoupon.value
      : Math.floor((totalPrice * selectedCoupon.value) / 100)
    : 0;

  const finalPrice = Math.max(totalPrice - discountAmount, 0);
  const discountPercent = Math.round(((totalOriginal - finalPrice) / totalOriginal) * 100);

  const handleClearCart = () => {
    dispatch(clearCartOnServer())
      .unwrap()
      .then(() => {
        setCartCourses([]);
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cart:updated', Date.now().toString());
      })
      .catch(err => toast.error(err));
  };

  return (
    <>
      {isLoading && <LoaderOverlay />}
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8 ">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
            <button
              onClick={handleClearCart}
              title="Remove"
              className="px-2 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold"
            >
              Clear cart
            </button>
          </div>
          <p className="mb-6 text-gray-700">{cartCourses.length} course in cart</p>
          {cartCourses.map(course => (
            <CartItem
              key={course.id}
              {...course}
              courseId={course.courseId}
              onRemove={() => {
                setCartCourses(prev => prev.filter(c => c.id !== course.id));
                window.dispatchEvent(new Event('cartUpdated'));
                localStorage.setItem('cart:updated', Date.now().toString());
              }}
            />
          ))}
        </div>

        <div className="w-full lg:w-[300px] space-y-6">
          <div className="border border-gray-300 rounded-lg p-5 bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Total:</h3>
            <p className="text-3xl font-bold text-purple-800 mb-1">
              ₫{finalPrice.toLocaleString('vi-VN')}
            </p>

            {finalPrice !== totalOriginal && (
              <p className="line-through text-sm text-gray-500">
                ₫{totalOriginal.toLocaleString('vi-VN')}
              </p>
            )}

            {finalPrice !== totalOriginal && (
              <p className="text-sm text-green-600 mt-1">{discountPercent}% off</p>
            )}

            <div title="CheckOut" className="mt-4 w-full py-2 ">
              <CheckoutButton />
            </div>
            <p className="text-xs text-gray-500 mt-2">You won’t be charged yet</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CartPage;
