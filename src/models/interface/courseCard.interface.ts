export interface Course {
  lessons: number;
  hour: number;
  views: number;
  id: number;
  author: string;
  authorImage: string;
  title: string;
  description?: string;
  rating: number;
  reviews: number;
  originalPrice?: number;
  discountPrice?: number;
  hasDiscount?: boolean;
  date: string;
  images: string[];
  video: string;
  features: string[];
  isBesteller?: boolean;
  createdAt?: string | null; 
  categoryName?: string;
}
