import { useMutation, useQuery } from '@tanstack/react-query';
import { post, get } from '@/lib/http';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { MBTIResult } from '@/container/mibt-contanier/MBTITest';

export interface TokenResponse {
  access: string;
  refresh: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  email: string;
  name: string;
  password1: string;
  password2: string;
  is_verified?: boolean;
}

// 新增发送验证码的接口
interface SendEmailCodeParams {
  email: string;
}

// 新增验证码验证的接口
interface VerifyEmailCodeParams {
  email: string;
  code: string;
}

interface Profile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  mbti_result: MBTIResult | null;
  is_admin?: boolean;
}

/**
 * ### 保存令牌到本地存储
 */
const saveTokens = (tokens: TokenResponse) => {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
};

/**
 * ### 清除本地存储的令牌
 */
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

/**
 * ### 发送邮箱验证码
 * @returns 发送验证码的mutation函数和状态
 */
export const useSendEmailCode = () => {
  return useMutation({
    mutationFn: async (params: SendEmailCodeParams) => {
      const response = await post<{ success: boolean; message: string }>(
        '/send-email-code/',
        params
      );
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || '验证码已发送，请查收邮件');
      } else {
        toast.error(data.message || '发送验证码失败');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '发送验证码失败，请稍后重试');
    },
  });
};

/**
 * ### 验证邮箱验证码
 * @returns 验证验证码的mutation函数和状态
 */
export const useVerifyEmailCode = () => {
  return useMutation({
    mutationFn: async (params: VerifyEmailCodeParams) => {
      const response = await post<{ success: boolean; message: string; verified: boolean }>(
        '/verify-email-code/',
        params
      );
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || '验证码验证成功');
      } else {
        toast.error(data.message || '验证码验证失败');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '验证码验证失败，请稍后重试');
    },
  });
};

/**
 * ### 登录
 * @returns 登录 mutation 函数和状态
 */
export const useLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await post<TokenResponse>('/login/', credentials);
      return response;
    },
    onSuccess: (data) => {
      // 保存令牌
      saveTokens(data);
      // 显示成功提示
      toast.success('登录成功');
      // 跳转到首页
      router.push('/home');
    },
    onError: (error: any) => {
      // 显示错误提示
      toast.error(error.response?.data?.detail || '登录失败，请检查邮箱和密码');
    },
  });
};

/**
 * ### 注册
 * @returns 注册 mutation 函数和状态
 */
export const useSignup = () => {
  return useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      const response = await post<{ token: TokenResponse }>(
        '/signup/',
        credentials
      );
      return response;
    },

    onError: (error: any) => {
      // 显示错误提示
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.data &&
          Object.values(
            error.response?.data as Record<string, string[]>
          )[0]?.[0]) ||
        '注册失败，请稍后重试';
      toast.error(errorMessage);
    },
  });
};

/**
 * ### 登出
 * @returns 登出函数
 */
export const useLogout = () => {
  const router = useRouter();

  const logout = () => {
    // 清除令牌
    clearTokens();
    // 显示提示
    toast.success('已退出登录');
    // 跳转到登录页
    router.push('/auth');
    // 刷新页面以清除所有状态
    router.refresh();
  };

  return { logout };
};

/**
 * ### 检查用户是否已登录
 * @returns 认证状态
 */
export const useAuthCheck = () => {
  const isAuthenticated =
    typeof window !== 'undefined' &&
    (!!localStorage.getItem('access_token') ||
      localStorage.getItem('access_token') === 'undefined') &&
    !!localStorage.getItem('refresh_token') &&
    localStorage.getItem('refresh_token') !== 'undefined';
  return { isAuthenticated };
};

/**
 * ### 获取访问令牌
 * @returns 访问令牌
 */
export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

/**
 * ### 获取刷新令牌
 * @returns 刷新令牌
 */
export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
};

/**
 * ### 获取用户个人资料
 * @returns 用户个人资料数据和查询状态
 */
export const useProfile = () => {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await get<Profile>('/me/');
      return response;
    },
    enabled: !!getAccessToken(), // 只在用户已登录时获取数据
    retry: false,
    staleTime: 1000 * 60 * 5, // 5分钟内不重新获取数据
  });
};
