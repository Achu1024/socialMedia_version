'use client';

import { useNotifications } from '@/http/useNotification';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export const NotificationIndicator = () => {
  const { data: notifications } = useNotifications();

  const unreadCount = notifications?.length || 0;

  return (
    <div className='relative'>
      <Bell className='h-6 w-6' />
      {unreadCount > 0 && (
        <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white'>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};
