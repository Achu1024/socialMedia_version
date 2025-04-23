'use client';

import { withAuth } from '@/container/auth-contanier/AuthContainer';

const HomePage = () => {
  return <></>;
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(HomePage);
