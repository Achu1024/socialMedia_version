'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Error boundaries must be Client Components

export default function GlobalError() {
  const router = useRouter();
  return (
    <div className='min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-b from-background to-default-100'>
      <div className='text-center space-y-6 p-8 rounded-xl'>
        <div className='space-y-2'>
          <h1 className='text-4xl font-bold text-danger'>出错了</h1>
          <p className='text-lg text-default-600'>
            抱歉，页面加载过程中发生了错误
          </p>
        </div>
        <div className='animate-bounce text-6xl'>😅😅😅</div>
        <Button
          color='primary'
          variant='outline'
          size='lg'
          onClick={() => router.refresh()}
        >
          重新加载
        </Button>
      </div>
    </div>
  );
}
