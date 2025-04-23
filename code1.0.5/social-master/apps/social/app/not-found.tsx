'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className='h-[100dvh] w-full flex items-center justify-center bg-background'>
      <div className='text-center space-y-4'>
        <h1 className='text-6xl font-bold text-primary'>404</h1>
        <h2 className='text-2xl font-medium text-muted-foreground'>
          页面未找到
        </h2>
        <p className='text-muted-foreground'>抱歉，您访问的页面不存在</p>
        <Button
          onClick={() => router.push('/')}
          variant='default'
          className='mt-4'
        >
          返回首页
        </Button>
      </div>
    </div>
  );
}
