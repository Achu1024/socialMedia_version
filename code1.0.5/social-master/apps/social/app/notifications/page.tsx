'use client';

import { Button } from '@/components/ui/button';
import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { NotificationsContainer } from '@/container/notifications-container/NotificationsContainer';
import { useReadAllNotifications } from '@/http/useNotification';
import { Check } from 'lucide-react';

// 定义基础组件
const NotificationsPageBase = () => {
  const { mutate: markAllAsRead, isPending } = useReadAllNotifications();
  
  // 处理一键已读
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  return (
    <div>
      <div className='sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 z-10'>
        <div className='flex items-center justify-between p-2 px-3'>
          <h1 className='text-base font-bold'>通知</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-xs hover:text-primary"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
          >
            <Check className="h-3.5 w-3.5" />
            全部已读
          </Button>
        </div>
      </div>

      <NotificationsContainer />
    </div>
  );
};

// 先创建组件，然后再用高阶组件包装
const NotificationsPage = withAuth(NotificationsPageBase);

// 导出包装后的组件
export default NotificationsPage;
