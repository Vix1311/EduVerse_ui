export interface CartItemProps {
  id: number;
  courseId?: string;
  title: string;
  author: string;
  rating: number;
  ratingsCount: number;
  lectures: number;
  totalHours: number;
  level: string;
  price?: number;
  originalPrice: number;
  thumbnail: string;
  onRemove?: () => void;
}
export interface CartItem {
  id: number;
  title: string;
  author: string;
  thumbnail: string;
  price: number;
  originalPrice: number;
}
export interface CartDropdownProps {
  isInHeader?: boolean;
  isScrolled?: boolean;
}

export interface CartCourse {
  id: number;
  courseId?: string;
  title: string;
  author: string;
  rating: number;
  ratingsCount: number;
  lectures: number;
  totalHours: number;
  level: string;
  price: number;
  originalPrice: number;
  thumbnail: string;
  couponCode?: string;
}

export interface CouponType {
  type: 'fixed' | 'percent';
  value: number;
}