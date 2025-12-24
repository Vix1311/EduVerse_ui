import axios from "axios";
import { Category } from "@/models/types/category.types";

export interface GetAllCategoriesResponse {
  statusCode: number;
  message: string;
  data: {
    categories: Category[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export const categoryService = {
  getAll: (params?: any) =>
    axios.get<GetAllCategoriesResponse>("/categories", { params }),

  getById: (id: string) => axios.get<{ data: Category }>(`/categories/${id}`),

  create: (data: Partial<Category>) => axios.post("/categories", data),

  update: (id: string, data: Partial<Category>) =>
    axios.put(`/categories/${id}`, data),

  delete: (id: string) => axios.delete(`/categories/${id}`),

  search: (params?: any) =>
    axios.get<{ data: Category[] }>("/categories/search", { params }),
};
