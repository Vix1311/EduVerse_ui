export interface Category {
  id: string;
  name: string;
  description: string;
  parent_id?: string | null;
  slug?: string;
  thumbnail?: string;
  createdAt: string;
  isActive: boolean;
}
