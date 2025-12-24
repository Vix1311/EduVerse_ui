export interface WishlistItem {
  id: string;
  thumbnail: string;
  title: string;
  author: string;
  price: number;
  originalPrice: number;
}
export interface WishlistDropdownProps {
  isInHeader?: boolean;
  isScrolled?: boolean;
}
export interface Wishlist {
  id: string;
  author: string;
  authorImage: string;
  title: string;
  rating: number;
  reviews: number;
  originalPrice: number;
  discountPrice?: number;
  date: string;
  images: string[];
  video: string;
  lessons: number;
  hour: number;
  views: number;
  description?: string;
}