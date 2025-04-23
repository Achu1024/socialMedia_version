import { User } from '@/http/useFriendship';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/http';
import { toast } from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

interface FriendSuggestionsProps {
  suggestions: User[];
  isLoading: boolean;
}

export const FriendSuggestions = ({
  suggestions,
  isLoading,
}: FriendSuggestionsProps) => {
  const queryClient = useQueryClient();

  const sendRequest = useMutation({
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

  if (isLoading) {
    return (
      <div className='py-4 text-center text-gray-500'>加载好友推荐中...</div>
    );
  }

  if (suggestions.length === 0) {
    return <div className='py-4 text-center text-gray-500'>暂无好友推荐</div>;
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-2xl font-semibold'>推荐好友</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
        {suggestions.map((user) => (
          <div
            key={user.id}
            className='flex flex-col p-4 bg-white rounded-lg shadow-sm'
          >
            <div className='flex items-center space-x-3 mb-3'>
              <Avatar>
                <AvatarImage src={user.get_avatar} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <Link
                  href={`/profile/${user.id}`}
                  className='font-semibold hover:underline'
                >
                  {user.name}
                </Link>
                <p className='text-sm text-gray-500'>{user.posts_count} 帖子</p>
              </div>
            </div>
            {user.bio && (
              <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                {user.bio}
              </p>
            )}
            <Button
              variant='outline'
              size='sm'
              className='mt-auto'
              onClick={() => sendRequest.mutate(user.id)}
              disabled={sendRequest.isPending}
            >
              <UserPlus className='h-4 w-4 mr-1' />
              添加好友
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
