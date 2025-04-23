'use client';
import { useState, useEffect } from 'react';
import { LoginForm } from '@/container/auth-contanier/LoginForm';
import { SignupForm } from '@/container/auth-contanier/SignupForm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthCheck } from '@/http/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuthCheck();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 如果已登录，重定向到首页
    if (isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, router]);

  // 在客户端渲染前或已登录时显示加载状态
  if (!mounted || isAuthenticated) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800'>
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='text-sm text-muted-foreground'>
            {!mounted ? '加载中...' : '正在跳转...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300'>
      <div className='w-full max-w-md mx-auto p-4 sm:p-8'>
        <div className='bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden'>
          {/* Logo 和品牌区域 */}
          <div className='text-center py-8 px-6 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-800'>
            <div className='flex justify-center'>
              <Image
                src='/logo.webp'
                alt='社交平台Logo'
                width={180}
                height={180}
                className='mb-2'
              />
            </div>
            <p className='text-gray-600 dark:text-gray-400 text-sm mt-2'>
              {isLogin ? '欢迎回来' : '创建您的账号'}
            </p>
          </div>

          {/* 切换按钮区域 */}
          <div className='flex justify-center -mt-4'>
            <div className='inline-flex rounded-full p-1 bg-gray-100 dark:bg-gray-800 shadow-inner'>
              <Button
                variant='ghost'
                onClick={() => setIsLogin(true)}
                className={cn(
                  'px-6 py-2 rounded-full text-sm transition-all duration-200',
                  isLogin
                    ? 'bg-white dark:bg-gray-700  shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                登录
              </Button>
              <Button
                variant='ghost'
                onClick={() => setIsLogin(false)}
                className={cn(
                  'px-6 py-2 rounded-full text-sm transition-all duration-200',
                  !isLogin
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                注册
              </Button>
            </div>
          </div>

          {/* 表单区域 */}
          <div className='px-6'>
            {isLogin ? (
              <LoginForm />
            ) : (
              <SignupForm
                onSuccess={(data) => {
                  setIsLogin(true);
                  localStorage.setItem('access_token', data.access);
                  localStorage.setItem('refresh_token', data.refresh);
                }}
              />
            )}
          </div>

          {/* 底部切换提示 */}
          <div className='h-10' />
        </div>
      </div>
    </div>
  );
}
