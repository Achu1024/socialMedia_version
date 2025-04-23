'use client';

import PostManagement from '@/container/admin-contanier/post-management';
import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { useProfile } from '@/http/useAuth';
import { useRouter } from 'next/navigation';

const AdminHomePage = () => {
  const { data: profile, isLoading } = useProfile();
  const router = useRouter();

  if (isLoading) {
    return null;
  }
  if (!profile) {
    router.push('/login');
    return <></>;
  }

  // 检查用户是否是管理员
  if (profile.is_admin !== true) {
    router.push('/');
    return (
      <div className='flex h-screen items-center justify-center'>
        <p className='text-red-500 text-xl'>您没有管理员权限，无法访问此页面</p>
      </div>
    );
  }

  return (
    <div className='container py-6 max-w-6xl mx-auto'>
      <PostManagement />
    </div>
  );
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(AdminHomePage);
