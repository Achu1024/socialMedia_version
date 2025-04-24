'use client';

import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { ProfileEditForm } from '@/container/profile-contanier';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/http/useAuth';
import Link from 'next/link';
const ProfileEditPage = () => {
  const { data: profile, isLoading } = useProfile();

  return (
    <div className='relative'>
      {/* 渐变背景 */}
      <div
        className='absolute top-0 left-0 right-0 h-68  bg-gradient-to-r '
        style={{
          backgroundImage: `url('/blackground.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom',
        }}
      />
      {/* 内容区域 */}
      <div className='relative'>
        <div className='max-w-4xl mx-auto px-4'>
          <header className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-white pt-8 pb-42'>修改密码</h1>
          </header>
          {isLoading ? (
            <div className='flex items-center justify-center h-32'>
              <div className='text-muted-foreground'>加载中...</div>
            </div>
          ) : (
            // @ts-ignore
            <ProfileEditForm defaultValues={profile} />
          )}
        </div>
      </div>
    </div>
  );
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(ProfileEditPage);
