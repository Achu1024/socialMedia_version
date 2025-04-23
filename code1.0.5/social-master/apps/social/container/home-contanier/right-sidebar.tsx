'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFriendSuggestions, usePopularUsers, User } from '@/http/useFriendship';
import { getTrend } from '@/http/usePost';
import { post } from '@/lib/http';
import { getInitials } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';

// 需要显示右侧栏的页面
const SHOWN_SIDEBAR_PATHS = [
  'profile',
  'messages',
  'friends',
  'notifications',
  'mbti',
  'post',
];

export const RightSidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('query');
  const isShown = SHOWN_SIDEBAR_PATHS.includes(pathname.split('/')[1]);
  // 好友推荐
  const { data: suggestedUsers, isLoading: isSuggestedLoading } = useFriendSuggestions();
  // 热门用户（点赞最多）
  const { data: popularUsers, isLoading: isPopularLoading } = usePopularUsers();
  // 话题列表
  const { data: trendPosts, isLoading: isTrendLoading } = getTrend();
  
  // 存储实际显示的用户推荐
  const [displayUsers, setDisplayUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // 在数据加载后处理推荐用户
  useEffect(() => {
    if (!isSuggestedLoading && !isPopularLoading) {
      setIsLoadingUsers(false);
      
      // 如果有正常的好友推荐，使用好友推荐
      if (suggestedUsers && suggestedUsers.length > 0) {
        setDisplayUsers(suggestedUsers.slice(0, 5));
      } 
      // 否则从热门用户中随机选择5个
      else if (popularUsers && popularUsers.length > 0) {
        // 随机选择5个热门用户
        const randomUsers = [...popularUsers]
          .sort(() => 0.5 - Math.random()) // 随机排序
          .slice(0, 5); // 取前5个
        setDisplayUsers(randomUsers);
      } else {
        setDisplayUsers([]);
      }
    }
  }, [suggestedUsers, popularUsers, isSuggestedLoading, isPopularLoading]);

  const queryClient = useQueryClient();

  // 发送好友请求的mutation
  const sendFriendRequest = useMutation({
    mutationFn: async (userId: string) => {
      const response = await post(`/friends/${userId}/request/`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendSuggestions'] });
      toast.success('好友请求已发送');
    },
    onError: (error: any) => {
      toast.error('发送好友请求失败: ' + (error.message || '未知错误'));
    },
  });
  if (isShown) return null;

  return (
    <div className='w-[350px] pr-[5%] hidden bg-gray-100 lg:block backdrop-blur'>
      <div className='sticky top-4 space-y-3 mt-4 h-[calc(100vh-10rem)] overflow-y-auto'>
        {/* 推荐用户 */}
        <Card className='rounded-lg p-3 shadow-sm hover:shadow-md transition-all border-none'>
          <CardContent className='p-0'>
            <p className='text-base font-bold mb-2'>推荐好友</p>
            <hr className='mb-2' />
            {isLoadingUsers ? (
              <div className='py-4 flex justify-center'>
                <Loader2 className='h-5 w-5 animate-spin text-primary' />
              </div>
            ) : displayUsers.length === 0 ? (
              <div className='text-center text-muted-foreground text-sm'>
                暂无推荐好友
              </div>
            ) : (
              <div className='space-y-2'>
                {displayUsers.map((user) => (
                  <div key={user.id} className='flex items-center gap-2 group'>
                    <Link href={`/profile/${user.id}`}>
                      <Avatar className='w-8 h-8'>
                        <AvatarImage src={user.get_avatar} alt={user.name} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className='flex-1'>
                      <Link
                        href={`/profile/${user.id}`}
                        className='font-medium group-hover:text-primary transition-colors text-xs'
                      >
                        {user.name}
                      </Link>
                      <div className='text-muted-foreground text-xs'>
                        帖子数 {user.posts_count}
                      </div>
                    </div>
                  </div>
                ))}
                {displayUsers.length > 5 && (
                  <Link
                    href='/friends'
                    className='block text-center text-xs text-primary hover:underline mt-1'
                  >
                    查看更多推荐用户
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 热门话题 */}
        <Card className='rounded-lg p-3 shadow-sm hover:shadow-md transition-all border-none'>
          <CardContent className='p-0'>
            <p className='text-base font-bold mb-2'>热门话题</p>
            <hr className='mb-2' />
            {isTrendLoading ? (
              <div className='py-4 flex justify-center'>
                <Loader2 className='h-5 w-5 animate-spin text-primary' />
              </div>
            ) : !trendPosts || trendPosts.length === 0 ? (
              <div className='py-2 text-center text-muted-foreground text-sm'>
                暂无热门话题
              </div>
            ) : (
              <div className='space-y-2 max-h-[400px] overflow-y-auto pr-1'>
                {trendPosts && trendPosts.map((trend) => (
                  <div
                    key={trend.id}
                    className='group cursor-pointer'
                    onClick={() => {
                      if (query === trend.hashtag) {
                        router.push(`/home`);
                      } else {
                        router.push(`/home?query=${trend.hashtag}`);
                      }
                    }}
                  >
                    <div className='flex items-center hover:bg-muted/50 rounded-lg p-1.5 transition-colors'>
                      <div className='mr-2'>
                        <div className='flex items-center justify-center w-6 h-6 bg-muted text-primary font-medium rounded-lg'>
                          #
                        </div>
                      </div>
                      <div className='flex-1'>
                        <div
                          className={`font-medium group-hover:text-primary transition-colors text-xs ${
                            query === trend.hashtag ? 'text-primary' : ''
                          }`}
                        >
                          {trend.hashtag}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          热度 {trend.occurences}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
