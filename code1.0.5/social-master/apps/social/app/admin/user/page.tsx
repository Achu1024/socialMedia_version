'use client';

import { Button } from '@/components/ui/button';
import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { useProfile } from '@/http/useAuth';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import UserManagement from '@/container/admin-contanier/user-management';
import { useState } from 'react';
import CreateUserModal from '@/container/admin-contanier/create-user-modal';

const AdminHomePage = () => {
  const { data: profile, isLoading } = useProfile();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      {/* <div className='mb-8 flex justify-between items-center'>
        <h2 className='text-2xl font-bold text-gray-800'>用户管理</h2>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className='flex items-center gap-2 rounded-xl bg-purple hover:bg-purple-contrast transition-colors shadow-sm px-4 h-10'
        >
          <PlusCircle size={18} />
          <span>创建用户</span>
        </Button>
      </div> */}
      <UserManagement />
      {/* <CreateUserModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      /> */}
    </div>
  );
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(AdminHomePage);
