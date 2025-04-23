'use client';

import Image from 'next/image';
import { AVATAR_URL } from '@/lib';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-32 h-32',
};

export const UserAvatar = ({
  src,
  alt,
  size = 'md',
  className,
  onClick,
}: UserAvatarProps) => {
  const avatarUrl = src || AVATAR_URL;

  return (
    <div
      className={cn(
        'rounded-full border-4 border-background bg-muted relative overflow-hidden shadow-sm',
        'hover:shadow-md transition-all duration-200',
        onClick && 'cursor-pointer',
        sizeMap[size],
        className
      )}
      onClick={onClick}
    >
      <Image
        src={avatarUrl}
        alt={alt}
        fill
        className='object-cover transition-transform duration-300 hover:scale-110'
        sizes='(max-width: 128px) 100vw, 128px'
      />
    </div>
  );
};
