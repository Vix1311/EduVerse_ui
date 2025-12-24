import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '@/core/store/store';

interface CheckoutButtonProps {
  couponId?: string;
  className?: string;
}

const CheckoutButton = ({ couponId, className }: CheckoutButtonProps) => {
  const navigate = useNavigate();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [isLoading, setIsLoading] = useState(false);

  const handleRedirect = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      toast.error('Please log in to checkout');
      navigate('/login');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.warning('Your cart is empty');
      return;
    }
    try {
      setIsLoading(true);

      const res = await axios.post(
        'http://localhost:8080/api/v1/orders/cart-checkout',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: couponId ? { couponId } : undefined,
        },
      );

      const { payUrl, orderNumber } = res.data || {};

      if (payUrl) {
        // go to MoMo payment page
        window.location.href = payUrl;
      } else {
        console.error('Response without payUrl:', res.data);
        toast.error('Could not receive payment URL from server');
      }
    } catch (err) {
      console.error('Payment failed:', err);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRedirect}
      disabled={isLoading}
      className={`w-full text-white py-4 rounded transition font-semibold text-lg 
        bg-purple-600 hover:bg-purple-700 active:bg-purple-800 
        disabled:bg-gray-400 disabled:cursor-not-allowed ${className ?? ''}`}
    >
      {isLoading ? 'Đang xử lý...' : 'Check out →'}
    </button>
  );
};

export default CheckoutButton;
