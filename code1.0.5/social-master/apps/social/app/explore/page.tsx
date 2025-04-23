'use client';

import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { SearchContainer } from '@/container/explore-contanier/SearchContainer';

const ExplorePage = () => {
  return (
    <div>
      <div className='sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 z-10'>
        <div className='flex items-center p-4'>
          <h1 className='text-xl font-bold'>探索</h1>
        </div>
      </div>

      <SearchContainer />
    </div>
  );
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(ExplorePage);
