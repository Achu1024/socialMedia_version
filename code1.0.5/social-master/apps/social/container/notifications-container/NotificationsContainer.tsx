'use client';

import {
  NOTIFICATION_TYPES,
  Notification,
  useNotifications,
  useReadNotification,
} from '@/http/useNotification';
import {
  AlertTriangle,
  Bell,
  Heart,
  Loader2,
  MessageSquare,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

// 通知图标组件
const NotificationIcon = ({
  type,
}: {
  type: Notification['type_of_notification'];
}) => {
  switch (type) {
    case 'post_like':
      return <Heart className='h-5 w-5 text-pink-500' />;
    case 'post_comment':
      return <MessageSquare className='h-5 w-5 text-blue-500' />;
    case 'new_friendrequest':
      return <UserPlus className='h-5 w-5 text-green-500' />;
    case 'accepted_friendrequest':
      return <UserCheck className='h-5 w-5 text-green-500' />;
    case 'rejected_friendrequest':
      return <AlertTriangle className='h-5 w-5 text-orange-500' />;
    default:
      return <Bell className='h-5 w-5 text-muted-foreground' />;
  }
};

// 通知项组件
const NotificationItem = ({ notification }: { notification: Notification }) => {
  const { mutate: markAsRead } = useReadNotification();

  // 处理通知点击事件
  const handleClick = () => {
    markAsRead(notification.id);
  };

  // 根据通知类型获取链接
  const getLink = () => {
    if (notification.post_id) {
      return `/post/${notification.post_id}`;
    }

    switch (notification.type_of_notification) {
      case 'new_friendrequest':
      case 'accepted_friendrequest':
        return '/friends';
      case 'rejected_friendrequest':
        return '#';  // 拒绝通知不跳转
      default:
        return '#';
    }
  };

  // 如果是拒绝通知，使用div而不是Link
  if (notification.type_of_notification === 'rejected_friendrequest') {
    return (
      <div onClick={handleClick}>
        <div className='p-2.5 py-2 hover:bg-muted/50 transition-colors border-b border-border/30'>
          <div className='flex items-start gap-2'>
            <div className='mt-0.5'>
              <NotificationIcon type={notification.type_of_notification} />
            </div>
            <div className='flex-1'>
              <p className='text-xs text-foreground leading-snug'>{notification.body}</p>
              <p className='text-[11px] text-muted-foreground mt-0.5'>
                {NOTIFICATION_TYPES[notification.type_of_notification]} ·{' '}
                {/* {format(new Date(), 'PPp', { locale: zhCN })} */}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 其他通知使用Link包装器
  return (
    <Link href={getLink()} onClick={handleClick}>
      <div className='p-2.5 py-2 hover:bg-muted/50 transition-colors border-b border-border/30'>
        <div className='flex items-start gap-2'>
          <div className='mt-0.5'>
            <NotificationIcon type={notification.type_of_notification} />
          </div>
          <div className='flex-1'>
            <p className='text-xs text-foreground leading-snug'>{notification.body}</p>
            <p className='text-[11px] text-muted-foreground mt-0.5'>
              {NOTIFICATION_TYPES[notification.type_of_notification]} ·{' '}
              {/* {format(new Date(), 'PPp', { locale: zhCN })} */}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

// 通知容器组件
export const NotificationsContainer = () => {
  const { data: notifications, isLoading, isError } = useNotifications();

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin text-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center py-8 text-center px-4'>
        <AlertTriangle className='h-6 w-6 text-destructive mb-2' />
        <h3 className='font-bold text-sm'>加载通知失败</h3>
        <p className='text-muted-foreground text-xs mt-1'>请稍后再试</p>
      </div>
    );
  }

  if (!notifications?.length) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center px-4'>
        <div className='bg-muted p-3 rounded-full mb-3'>
          <Bell className='h-6 w-6 text-muted-foreground' />
        </div>
        <h3 className='font-bold text-sm'>暂无新通知</h3>
        <p className='text-muted-foreground text-xs mt-1'>
          有新活动时会在这里显示
        </p>
      </div>
    );
  }

  return (
    <div className='divide-y divide-border/30'>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
