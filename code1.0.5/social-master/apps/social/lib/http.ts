'use client';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// 创建 axios 实例
const http: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 是否正在刷新token
let isRefreshing = false;
// 请求队列
let requestsQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

// 处理请求队列
const processQueue = (error: any = null) => {
  requestsQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(undefined);
    }
  });
  requestsQueue = [];
};

// 刷新 token
const refreshToken = async () => {
  const router = useRouter();
  try {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      throw new Error('No refresh token');
    }

    const response = await axios.post<{
      access_token: string;
      refresh_token: string;
    }>(`${process.env.NEXT_PUBLIC_API_URL}/refresh`, {
      refresh: refresh_token,
    });

    const { access_token, refresh_token: new_refresh_token } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', new_refresh_token);

    return access_token;
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/auth');
    throw error;
  }
};

// 请求拦截器
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error) => {
    const router = useRouter();
    const originalRequest = error.config;

    // 如果是401错误且不是刷新token的请求
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新token，将请求加入队列
        return new Promise((resolve, reject) => {
          requestsQueue.push({ resolve, reject });
        })
          .then(() => {
            return http(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        processQueue();
        return http(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 处理其他错误响应
    if (error.response) {
      switch (error.response.status) {
        case 400:
          // 请求参数错误
          toast.error('请求参数错误');
          break;
        case 401:
          // 未授权
          toast.error('未授权');
          router.push('/auth');
          break;
        case 403:
          // 权限不足
          toast.error('没有权限访问该资源');
          break;
        case 404:
          // 资源不存在
          toast.error('请求的资源不存在');
          break;
        case 500:
          // 服务器错误
          toast.error('服务器错误');
          break;
        default:
          toast.error('发生错误:', error.response.data);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      toast.error('网络错误，请检查网络连接');
    } else {
      // 请求配置出错
      toast.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// 封装 GET 请求
export const get = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return http.get(url, config);
};

// 封装 POST 请求
export const post = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  return http.post(url, data, config);
};

// 封装 PUT 请求
export const put = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  return http.put(url, data, config);
};

// 封装 DELETE 请求
export const del = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return http.delete(url, config);
};

export default http;
