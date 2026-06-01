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
  is_visible: number; // 0 or 1
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
  is_read: number; // 0 or 1
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

// API Request/Response types
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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export interface CreateArticleRequest {
  category_id: number;
  title: string;
  summary?: string;
  content: string;
  cover_image?: string;
  is_visible?: number;
  sort_order?: number;
}

export interface UpdateArticleRequest {
  category_id?: number;
  title?: string;
  summary?: string;
  content?: string;
  cover_image?: string;
  is_visible?: number;
  sort_order?: number;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  sort_order?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  sort_order?: number;
}

export interface CreateMessageRequest {
  name: string;
  phone: string;
  email?: string;
  content: string;
}
