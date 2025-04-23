'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  get_avatar: string;
  bio?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  mbti_result?: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 每次组件加载时检查用户是否已登录
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/account/me/');
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录函数
  const login = async (email: string, password: string) => {
    try {
      // 获取JWT令牌
      const response = await axios.post('/api/account/login/', {
        email,
        password,
      });

      // 保存令牌到本地存储
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // 设置axios默认头部包含token
      axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${response.data.access}`;

      // 获取用户信息
      const userResponse = await axios.get('/api/account/me/');
      setUser(userResponse.data);

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // 注册函数
  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post('/api/account/signup/', {
        name,
        email,
        password1: password,
        password2: password,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // 登出函数
  const logout = () => {
    // 清除本地存储中的令牌
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');

    // 清除axios默认头部中的认证信息
    delete axios.defaults.headers.common['Authorization'];

    // 清除用户状态
    setUser(null);

    // 重定向到登录页
    router.push('/login');
  };

  // 刷新用户信息
  const refreshProfile = async () => {
    try {
      const response = await axios.get('/api/account/me/');
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
