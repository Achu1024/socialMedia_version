'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import React from 'react';

interface AuthContainerProps {
  children: React.ReactNode;
  requireAuth?: boolean; // 是否需要登录才能访问
}

const PUBLIC_PATHS = ['/auth', '/']; // 公开路由

/**
 * ### 认证容器
 * @param param0
 * @returns
 */
export const AuthContainer = ({
  children,
  requireAuth = true,
}: AuthContainerProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = React.useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      const isPublicPath = PUBLIC_PATHS.includes(pathname);
      if ((!token || token === 'undefined') && requireAuth && !isPublicPath) {
        toast.error('请先登录');
        // 需要登录但未登录，重定向到登录页
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      } else if (token && isPublicPath) {
        // 已登录但访问登录页等公开页面，重定向到首页
        router.push('/home');
      }
    };

    checkAuth();

    // 监听 storage 事件，处理在其他标签页中的登录/登出操作
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname, requireAuth, router]);

  // 在客户端渲染前返回加载状态
  if (!isClient) {
    return <div>加载中...</div>;
  }

  // 如果是客户端渲染且需要认证但没有token，返回null
  if (isClient && requireAuth && !localStorage.getItem('access_token')) {
    return null;
  }

  return children;
};

// 高阶组件，用于包装需要认证的页面
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireAuth: boolean = true
) => {
  return function WithAuthComponent(props: P) {
    return (
      <AuthContainer requireAuth={requireAuth}>
        <WrappedComponent {...props} />
      </AuthContainer>
    );
  };
};

export default AuthContainer;
