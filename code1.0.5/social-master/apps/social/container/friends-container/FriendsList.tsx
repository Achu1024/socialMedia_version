import { User } from '@/http/useFriendship';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

interface FriendsListProps {
  friends: User[];
  isLoading: boolean;
}

export const FriendsList = ({ friends, isLoading }: FriendsListProps) => {
  if (isLoading) {
    return (
      <div className='py-4 text-center text-gray-500'>加载好友列表中...</div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className='py-4 text-center text-gray-500'>
        暂无好友，快去添加好友吧
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        {friends.map((friend) => (
          <div
            key={friend.id}
            className='flex items-center justify-between p-3 bg-white rounded-lg shadow-sm'
          >
            <Link
              href={`/profile/${friend.id}`}
              className='flex items-center space-x-3'
            >
              <Avatar>
                <AvatarImage src={friend.get_avatar} alt={friend.name} />
                <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className='font-semibold'>{friend.name}</p>
                <p className='text-sm text-gray-500'>
                  {friend.posts_count} 帖子 · {friend.friends_count} 好友
                </p>
              </div>
            </Link>
            <Link
              href={`/messages/${friend.id}`}
              className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full'
            >
              <MessageSquare className='h-5 w-5' />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
