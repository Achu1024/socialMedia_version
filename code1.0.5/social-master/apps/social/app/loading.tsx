'use client';

export default function Loading() {
  return (
    <div className='fixed inset-0 flex flex-col gap-4 bg-background/95 dark:bg-background/95 items-center justify-center backdrop-blur-md z-50'>
      <div className='relative'>
        <div className='w-14 h-14 border-4 border-primary/20 rounded-full' />
        <div className='absolute top-0 w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
      <div className='flex flex-col items-center'>
        <p className='text-sm font-medium text-primary/80 animate-pulse'>
          加载中
        </p>
        <div className='flex gap-1 mt-2'>
          <span
            className='w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce'
            style={{ animationDelay: '0s' }}
          ></span>
          <span
            className='w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce'
            style={{ animationDelay: '0.2s' }}
          ></span>
          <span
            className='w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce'
            style={{ animationDelay: '0.4s' }}
          ></span>
        </div>
      </div>
    </div>
  );
}
