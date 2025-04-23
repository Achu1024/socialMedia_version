'use client';

import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { UserProfileContainer } from '@/container/profile-contanier/UserProfileContainer';

const ProfilePage = () => {
  return <UserProfileContainer />;
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(ProfilePage);
