export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: number;
  category_id: number;
  title: string;
  summary: string;
  content: string;
  cover_image: string;
  is_visible: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface Message {
  id: number;
  name: string;
  phone: string;
  email: string;
  content: string;
  is_read: number;
  created_at: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
