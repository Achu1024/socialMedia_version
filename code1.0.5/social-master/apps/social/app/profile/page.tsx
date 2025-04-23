'use client';

import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { ProfileContainer } from '@/container/profile-contanier';

const ProfilePage = () => {
  return <ProfileContainer />;
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(ProfilePage);
