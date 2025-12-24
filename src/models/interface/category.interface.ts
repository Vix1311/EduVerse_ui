export interface Category {
  id: number;
  name: string;
  link: string;
}

export interface CategoryBarProps {
  isScrolled: boolean;
  isInHeader?: boolean;
}