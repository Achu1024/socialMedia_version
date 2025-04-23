'use client';

import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { FriendsContainer } from '@/container/friends-container';

const FriendsPage = () => {
  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <FriendsContainer />
    </div>
  );
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(FriendsPage);
