'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout, useProfile } from '@/http/useAuth';
import { cn } from '@/lib/utils';
import {
  Bell,
  Brain,
  Home,
  LogOut,
  Search,
  Settings,
  User,
  Key
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NotificationIndicator } from '../notifications-container/NotificationIndicator';
import { UserAvatar } from '../profile-contanier/UserAvatar';

const navItems = [
  {
    label: '首页',
    icon: Home,
    href: '/home',
    active: ['/home', '/post'],
  },
  {
    label: '好友',
    icon: User,
    href: '/friends',
    active: ['/friends'],
  },
  {
    label: '探索',
    icon: Search,
    href: '/explore',
    active: ['/explore'],
  },
  {
    label: '通知',
    icon: Bell,
    href: '/notifications',
    active: ['/notifications'],
    component: NotificationIndicator,
  },
  {
    label: 'MBTI测试',
    icon: Brain,
    href: '/mbti',
    active: ['/mbti'],
  },
];

export const TopNavbar = () => {
  const pathname = usePathname();
  const { data: profile } = useProfile();
  const { logout } = useLogout();

  return (
    <div className='fixed top-0 left-0 w-[100dvw] h-16 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10'>
      <div className='h-full w-full grid grid-cols-[300px_1fr_300px]  relative'>
        {/* 左侧Logo部分 */}
        <div className='flex items-center h-full '>
          <Link href='/home' className='flex items-center h-full'>
            <Image
              src='/logo.webp'
              alt='社交网站Logo'
              width={180}
              height={180}
              className='ml-4'
            />
          </Link>
        </div>

        {/* 中间导航菜单部分 */}
        <div className='flex justify-center items-center gap-2'>
          {navItems.map((item) => {
            const isActive = item.active.some((active) =>
              pathname.startsWith(active)
            );
            const Icon = item.icon;
            const CustomComponent = item.component;

            return (
              <Link
                key={item.href}
                href={item.href}
                className='relative group px-2'
              >
                <div
                  className={cn(
                    'flex flex-col items-center justify-center h-14 transition-colors min-w-10 md:min-w-16',
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-foreground/60 hover:text-primary'
                  )}
                >
                  <div className='relative'>
                    {CustomComponent ? (
                      <CustomComponent />
                    ) : (
                      <Icon
                        className={cn(
                          'h-5 w-5 transition-colors',
                          isActive ? 'text-primary' : 'group-hover:text-primary'
                        )}
                      />
                    )}
                  </div>
                  <span className='text-xs mt-1'>{item.label}</span>
                </div>
                {isActive && (
                  <div className='absolute bottom-0 left-0 right-0 h-1 bg-primary mx-auto w-12' />
                )}
              </Link>
            );
          })}
        </div>

        {/* 右侧用户头像部分 */}
        <div className='flex items-center h-full justify-end pr-10'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className='cursor-pointer'>
                <UserAvatar
                  src={profile?.avatar}
                  alt={profile?.name || '用户头像'}
                  size='sm'
                  className='border-2 hover:border-primary'
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <div className='flex items-center justify-start gap-2 p-2'>
                <UserAvatar
                  src={profile?.avatar}
                  alt={profile?.name || '用户头像'}
                  size='sm'
                />
                <div className='flex flex-col space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    {profile?.name}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {profile?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <Link href='/profile'>
                <DropdownMenuItem className='cursor-pointer'>
                  <User className='mr-2 h-4 w-4' />
                  <span>个人资料</span>
                </DropdownMenuItem>
              </Link>
              <Link href='/profile/edit'>
                <DropdownMenuItem className='cursor-pointer'>
                  <Key className='mr-2 h-4 w-4' />
                  <span>修改密码</span>
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />
              <DropdownMenuItem className='cursor-pointer' onClick={logout}>
                <LogOut className='mr-2 h-4 w-4' />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
