'use client';
import { Button } from '@/components/ui/button';
import {
  Home,
  Search,
  Bell,
  Mail,
  User,
  MoreHorizontal,
  TrendingUp,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProfile } from '@/http/useAuth';
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
    label: '趋势',
    icon: TrendingUp,
    href: '/trends',
    active: ['/trends'],
  },
  {
    label: '通知',
    icon: Bell,
    href: '/notifications',
    active: ['/notifications'],
  },
  {
    label: '消息',
    icon: Mail,
    href: '/messages',
    active: ['/messages'],
  },
  {
    label: '个人资料',
    icon: User,
    href: '/profile',
    active: ['/profile'],
  },
];

export const NavSidebar = () => {
  const pathname = usePathname();
  const { data: profile } = useProfile();

  return (
    <div className='fixed w-[250px] h-screen border-r border-border/40 px-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex flex-col h-full'>
        {/* Logo */}
        <Link
          href='/home'
          className='p-2 rounded-full w-fit hover:bg-accent/80 transition-colors my-1'
        >
          <svg
            viewBox='0 0 24 24'
            className='h-6 w-6 text-primary hover:text-primary/90 transition-colors'
          >
            <g fill='currentColor'>
              <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'></path>
            </g>
          </svg>
        </Link>

        {/* 导航菜单 */}
        <nav className='flex-1 py-1'>
          {navItems.map((item) => {
            const isActive = item.active.some((active) =>
              pathname.startsWith(active)
            );
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant='ghost'
                  className={cn(
                    'w-full justify-start gap-2 h-9 text-base font-medium transition-colors group relative hover:bg-accent/80 px-3 my-0.5',
                    isActive ? 'text-primary font-bold' : 'hover:bg-accent/80'
                  )}
                >
                  <div className='relative'>
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-colors',
                        isActive ? 'text-primary' : 'group-hover:text-primary'
                      )}
                    />
                    {/* 激活状态的背景效果 */}
                    {isActive && (
                      <div className='absolute inset-0 bg-primary/10 rounded-full scale-150 animate-pulse' />
                    )}
                  </div>
                  <span>{item.label}</span>
                  {/* 激活指示器 */}
                  {isActive && (
                    <div className='absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full' />
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* 用户信息 */}
        <div className='flex items-center gap-2 p-2 hover:bg-accent/80 rounded-full cursor-pointer mt-auto mb-2 transition-colors group relative'>
          <UserAvatar
            src={profile?.avatar}
            alt={profile?.name || '用户'}
            className='w-8 h-8 rounded-full bg-muted shadow-sm group-hover:ring-1 group-hover:ring-primary transition-all'
          />
          <div className='flex-1'>
            <div className='font-bold text-sm group-hover:text-primary transition-colors'>
              用户名
            </div>
            <div className='text-xs text-muted-foreground'>{profile?.name}</div>
          </div>
          <MoreHorizontal className='h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors' />
        </div>
      </div>
    </div>
  );
};
