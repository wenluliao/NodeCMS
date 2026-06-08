import request from "../utils/request";
import type {ApiResponse, Category, Article, Message, PaginatedData} from "../types";

// Auth API
export const login = (data: {username: string; password: string}) =>
  request.post<ApiResponse<{token: string; username: string}>>("/auth/login", data);

// Categories API
export const getCategories = () => request.get<ApiResponse<Category[]>>("/categories");

export const getCategoryBySlug = (slug: string) =>
  request.get<ApiResponse<Category>>(`/categories/slug/${slug}`);

export const createCategory = (data: {name: string; slug: string; sort_order?: number}) =>
  request.post<ApiResponse>("/categories", data);

export const updateCategory = (
  id: number,
  data: {name?: string; slug?: string; sort_order?: number},
) => request.put<ApiResponse>(`/categories/${id}`, data);

export const deleteCategory = (id: number) => request.delete<ApiResponse>(`/categories/${id}`);

// Articles API (public)
export const getPublicArticles = (params: {
  category_id?: number;
  slug?: string;
  page?: number;
  pageSize?: number;
}) => request.get<ApiResponse<PaginatedData<Article>>>("/articles/public", {params});

export const getPublicArticle = (id: number) =>
  request.get<ApiResponse<Article>>(`/articles/public/${id}`);

// Articles API (admin)
export const getArticles = (params: {
  category_id?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}) => request.get<ApiResponse<PaginatedData<Article>>>("/articles", {params});

export const getArticle = (id: number) => request.get<ApiResponse<Article>>(`/articles/${id}`);

export const createArticle = (data: Partial<Article>) =>
  request.post<ApiResponse>("/articles", data);

export const updateArticle = (id: number, data: Partial<Article>) =>
  request.put<ApiResponse>(`/articles/${id}`, data);

export const toggleArticleVisibility = (id: number) =>
  request.patch<ApiResponse>(`/articles/${id}/visibility`);

export const deleteArticle = (id: number) => request.delete<ApiResponse>(`/articles/${id}`);

// Messages API
export const submitMessage = (data: {
  name: string;
  phone: string;
  email?: string;
  content: string;
}) => request.post<ApiResponse>("/messages", data);

export const getMessages = (params: {is_read?: number; page?: number; pageSize?: number}) =>
  request.get<ApiResponse<PaginatedData<Message>>>("/messages", {params});

export const markMessageRead = (id: number) => request.patch<ApiResponse>(`/messages/${id}/read`);

export const markAllMessagesRead = () => request.patch<ApiResponse>("/messages/read-all");

export const deleteMessage = (id: number) => request.delete<ApiResponse>(`/messages/${id}`);

export const getUnreadCount = () =>
  request.get<ApiResponse<{count: number}>>("/messages/unread-count");

// Upload API
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return request.post<ApiResponse<{url: string}>>("/upload", formData, {
    headers: {"Content-Type": "multipart/form-data"},
  });
};

// Chat API (public)
export const sendChatMessage = (data: {session_id?: string; message: string}) =>
  request.post<ApiResponse<{session_id: string; reply: string}>>("/chat/send", data);

export const getChatHistory = (sessionId: string) =>
  request.get<ApiResponse<{role: string; content: string; created_at: string}[]>>(
    `/chat/history/${sessionId}`,
  );

// Chat API (admin)
export const getChatSessions = (params: {page?: number; pageSize?: number}) =>
  request.get<ApiResponse<PaginatedData<any>>>("/chat/sessions", {params});

export const getChatMessages = (sessionId: string) =>
  request.get<ApiResponse<any>>(`/chat/sessions/${sessionId}/messages`);

export const deleteChatSession = (sessionId: string) =>
  request.delete<ApiResponse>(`/chat/sessions/${sessionId}`);
