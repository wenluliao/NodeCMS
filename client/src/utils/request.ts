import axios from "axios";
import type {ApiResponse} from "../types";
import {ElMessage} from "element-plus";

const request = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

// Request interceptor
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse;
    if (res.code !== 0) {
      ElMessage.error(res.message || "请求失败");
      if (res.code === 401) {
        localStorage.removeItem("cms_token");
        localStorage.removeItem("cms_username");
        window.location.hash = "#/admin/login";
      }
      return Promise.reject(new Error(res.message));
    }
    return response;
  },
  (error) => {
    ElMessage.error(error.message || "网络错误");
    return Promise.reject(error);
  },
);

export default request;
