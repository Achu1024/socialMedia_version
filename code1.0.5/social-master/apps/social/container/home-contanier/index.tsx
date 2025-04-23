'use client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { redirect, usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { RightSidebar } from './right-sidebar';
import { TopNavbar } from './top-navbar';
interface HomeContainerProps {
  children: ReactNode;
}

export const HomeContainer = ({ children }: HomeContainerProps) => {
  const pathname = usePathname();

  if (pathname === '/') redirect('/home');

  const isAuth = pathname.startsWith('/auth') || pathname.startsWith('/admin');
  const setBackground =
    pathname.startsWith('/home') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/post');
  if (isAuth) return children;
  return (
    <main className='bg-gray-100'>
      {!isAuth && <TopNavbar />}
      <div className='flex flex-col min-h-screen pr-30 pl-50'>
        <div className='flex flex-1 pt-16 gap-2'>
          <ScrollArea
            className='flex-1 h-[calc(100vh-3.5rem)] px-2'
            style={{
              backgroundColor: setBackground ? 'white' : 'transparent',
            }}
          >
            {children}
          </ScrollArea>
          <RightSidebar />
        </div>
      </div>
    </main>
  );
};
