'use client';

import Render from '@/components/Rich/Render';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/container/profile-contanier/UserAvatar';
import { useProfile } from '@/http/useAuth';
import { Post } from '@/http/usePost';
import { useSearch } from '@/http/useSearch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { debounce } from 'lodash-es';
import { Loader2, Search, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';

// 用户卡片组件
const UserCard = ({ user }: { user: any }) => {
  return (
    <Link href={`/profile/${user.id}`} className='block'>
      <Card className='p-4 hover:bg-muted/50 transition-colors rounded-lg min-h-[90px]'>
        <div className='flex items-center gap-3'>
          <UserAvatar src={user.get_avatar} alt={user.name} size='md' />
          <div>
            <h3 className='font-bold whitespace-nowrap text-ellipsis overflow-hidden'>
              {user.name}
            </h3>
            <p className='text-sm text-muted-foreground'>{user.email}</p>
            {user.bio && (
              <p className='mt-1 text-sm line-clamp-2 text-ellipsis overflow-hidden whitespace-nowrap'>
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

// 帖子卡片组件
const PostCard = ({ post }: { post: Post }) => {
  return (
    <Link href={`/post/${post.id}`} className='block'>
      <Card className='p-6 hover:bg-muted/50 transition-colors rounded-lg'>
        <div className='flex gap-4'>
          <UserAvatar
            src={post.created_by.get_avatar}
            alt={post.created_by.name}
            size='md'
          />
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <span className='font-bold text-lg'>
                {post.created_by.name}
              </span>
              <span className='text-muted-foreground'>·</span>
              <span className='text-muted-foreground'>
                {format(new Date(post.created_at), 'PP', { locale: zhCN })}
              </span>
            </div>
            <div className='mt-3 text-lg'>
              <Render data={post.body} />
            </div>
            
            {/* 显示帖子图片 */}
            {post.attachments && post.attachments.length > 0 && (
              <div 
                className={cn(
                  'mt-3 gap-3 grid',
                  post.attachments.length === 1 ? 'grid-cols-1' :
                  post.attachments.length <= 3 ? 'grid-cols-3' :
                  post.attachments.length === 4 ? 'grid-cols-2' :
                  post.attachments.length <= 6 ? 'grid-cols-3 grid-rows-2' :
                  'grid-cols-3 grid-rows-3'
                )}
                onClick={(e) => e.preventDefault()}
              >
                <PhotoProvider>
                  {post.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className='relative overflow-hidden bg-black/5 border border-border/40 flex items-center justify-center hover:border-primary/30 transition-colors aspect-square rounded-xl'
                    >
                      <PhotoView src={attachment.get_image}>
                        <div className="w-full h-full overflow-hidden">
                          <Image
                            width={200}
                            height={200}
                            src={attachment.get_image}
                            alt='图片'
                            className='hover:scale-105 transition-transform object-cover w-full h-full'
                          />
                        </div>
                      </PhotoView>
                    </div>
                  ))}
                </PhotoProvider>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

// 搜索容器组件
export const SearchContainer = () => {
  const [query, setQuery] = useState('');
  const { data: results, isPending, isSuccess } = useSearch(query);
  const { data: profile } = useProfile();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setQuery(e.currentTarget.value);
    }
  };

  // 搜索用户或帖子
  const handleChange = debounce(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    500,
    { maxWait: 500 }
  );

  // 过滤掉当前登录用户
  const filteredUsers = results?.users.filter(user => user.id !== profile?.id) || [];

  return (
    <div className='py-4 mx-auto'>
      <div className='flex gap-2 px-4 mb-6'>
        <div className='relative flex-1'>
          <Input
            placeholder='搜索用户或帖子...'
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className='pl-10 py-6'
          />
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
        </div>
      </div>

      {isPending && (
        <div className='flex justify-center py-10'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      )}

      {isSuccess && results && (
        <div className='px-4'>
          {filteredUsers.length === 0 && results.posts.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 text-center px-4'>
              <div className='bg-muted rounded-full p-4 mb-4'>
                <Search className='h-8 w-8 text-muted-foreground' />
              </div>
              <h3 className='text-lg font-bold'>未找到相关结果</h3>
              <p className='text-muted-foreground mt-1'>
                尝试使用不同的关键词搜索
              </p>
            </div>
          ) : (
            <>
              {filteredUsers.length > 0 && (
                <div className='mb-8'>
                  <div className='flex items-center gap-2 mb-4'>
                    <UserIcon className='h-5 w-5' />
                    <h2 className='font-bold text-lg'>用户</h2>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className='border border-border/40 rounded-lg'
                      >
                        <UserCard user={user} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.posts.length > 0 && (
                <div className='mb-8'>
                  <div className='flex items-center gap-2 mb-4'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='h-5 w-5'
                    >
                      <path d='M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z' />
                      <path d='M10 2c1 .5 2 2 2 5' />
                    </svg>
                    <h2 className='font-bold text-lg'>帖子</h2>
                  </div>
                  <div className='flex flex-col gap-4'>
                    {results.posts.map((post) => (
                      <div
                        key={post.id}
                        className='border border-border/40 rounded-lg'
                      >
                        <PostCard post={post} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
