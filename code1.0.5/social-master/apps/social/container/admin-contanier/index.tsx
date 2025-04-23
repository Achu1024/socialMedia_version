'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useProfile, useLogout } from '@/http/useAuth';
import { cn } from '@/lib/utils';
import {
  Activity,
  ChartLine,
  File,
  Flag,
  LogOut,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import CreateUserModal from './create-user-modal';

const AdminContainer = ({ children }: { children?: React.ReactNode }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { logout } = useLogout();
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useProfile();

  // 确定当前活动页面
  const activePath = pathname.split('/').pop() || 'home';

  const handleLogout = () => {
    // 处理登出逻辑
    logout();
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className='flex min-h-screen bg-gray-50'>
        <Sidebar className='border-r border-gray-200 shadow-sm bg-white'>
          <SidebarHeader className='px-6 py-6 border-b border-gray-100'>
            <h1 className='text-xl font-bold text-purple flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              运营后台
            </h1>
          </SidebarHeader>
          <SidebarContent className='py-6'>
            <div className='px-6 mb-4'>
              <p className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-3'>
                主要功能
              </p>
            </div>
            <SidebarMenu>
              {/* <SidebarMenuButton
                isActive={activePath === 'home'}
                onClick={() => router.push('/admin/home')}
                className={cn(
                  'w-full justify-start cursor-pointer px-6 py-2.5 mb-1 transition-colors',
                  activePath === 'home'
                    ? 'bg-purple-light text-purple font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <ChartLine className='mr-3 h-5 w-5' />
                <span>管理员仪表盘</span>
              </SidebarMenuButton> */}
              <SidebarMenuButton
                isActive={activePath === 'user'}
                onClick={() => router.push('/admin/user')}
                className={cn(
                  'w-full justify-start cursor-pointer px-6 py-2.5 mb-1 transition-colors',
                  activePath === 'user'
                    ? 'bg-purple-light text-purple font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <Users className='mr-3 h-5 w-5' />
                <span>用户管理</span>
              </SidebarMenuButton>

              <SidebarMenuButton
                isActive={activePath === 'data'}
                onClick={() => router.push('/admin/data')}
                className={cn(
                  'w-full justify-start cursor-pointer px-6 py-2.5 mb-1 transition-colors',
                  activePath === 'data'
                    ? 'bg-purple-light text-purple font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <Activity className='mr-3 h-5 w-5' />
                <span>数据管理</span>
              </SidebarMenuButton>

              <SidebarMenuButton
                isActive={activePath === 'post'}
                onClick={() => router.push('/admin/post')}
                className={cn(
                  'w-full justify-start cursor-pointer px-6 py-2.5 mb-1 transition-colors',
                  activePath === 'post'
                    ? 'bg-purple-light text-purple font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <File className='mr-3 h-5 w-5' />
                <span>帖子管理</span>
              </SidebarMenuButton>
              <SidebarMenuButton
                isActive={activePath === 'report'}
                onClick={() => router.push('/admin/report')}
                className={cn(
                  'w-full justify-start cursor-pointer px-6 py-2.5 mb-1 transition-colors',
                  activePath === 'report'
                    ? 'bg-purple-light text-purple font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <Flag className='mr-3 h-5 w-5' />
                <span>举报管理</span>
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className='px-6 py-4 border-t border-gray-100'>
            {profile && (
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Avatar className='h-8 w-8 border border-gray-200'>
                    <AvatarImage src={profile?.avatar || ''} />
                    <AvatarFallback className='bg-purple-light text-purple'>
                      {profile?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='text-sm font-medium text-gray-700'>
                      {profile?.name}
                    </p>
                    <p className='text-xs text-gray-500'>管理员</p>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleLogout}
                  className='rounded-full h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50'
                >
                  <LogOut className='h-4 w-4' />
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        {/* 主内容区 */}
        <ScrollArea className='w-[calc(100dvw-300px)] px-2 overflow-auto h-[100dvh]'>
          {children}

          {/* 创建用户模态框 */}
          <CreateUserModal
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
          />
        </ScrollArea>
      </div>
    </SidebarProvider>
  );
};

export default AdminContainer;
