'use client';

import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { useProfile } from '@/http/useAuth';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/container/admin-contanier/admin-dashboard';
const AdminDataPage = () => {
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

  return <AdminDashboard />;
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(AdminDataPage);
