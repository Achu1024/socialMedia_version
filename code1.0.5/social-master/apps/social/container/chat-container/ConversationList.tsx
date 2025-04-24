import { Skeleton } from '@/components/ui/skeleton';
import { Conversation } from '@/http/useChat';
import { useFriends } from '@/http/useFriendship';
import { useRouter } from 'next/navigation';
import { FriendRequestsDialog } from '../friends-container';
import { ActiveConversation } from './ChatContainer';
import { ConversationItem } from './ConversationItem';
import { useChatStore } from '@/store/chat';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  activeId?: string;
  onSelect: (conversation: ActiveConversation) => void;
}

export const ConversationList = ({
  conversations,
  isLoading,
  activeId,
  onSelect,
}: ConversationListProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: friendsData, isLoading: isLoadingFriends } = useFriends();
  const { unreadMessages, clearUnreadMessages, setActiveConversationId } =
    useChatStore();

  // 当活跃的会话ID改变时，清除该会话的未读消息
  useEffect(() => {
    if (activeId) {
      clearUnreadMessages(activeId);
      setActiveConversationId(activeId);
    }
  }, [activeId, clearUnreadMessages, setActiveConversationId]);

  if (isLoading) {
    return (
      <div className='space-y-2 p-3'>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className='flex items-center space-x-3 p-2'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='space-y-2 flex-1'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-3 w-full' />
              </div>
            </div>
          ))}
      </div>
    );
  }

  // 合并会话数据和未读消息计数
  const conversationsWithUnread = conversations.map((conversation) => ({
    ...conversation,
    unreadCount: unreadMessages[conversation.id] || 0,
  }));

  return (
    <div className='flex flex-col h-full'>
      {/* 头部 */}
      <div className='p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center'>
        <span className='font-medium text-lg'>好友列表</span>
        {/* 好友申请按钮（弹窗） */}
        <FriendRequestsDialog
          requests={friendsData?.requests || []}
          isLoading={isLoadingFriends}
        />
      </div>

      {/* 会话列表 */}
      {conversationsWithUnread.length === 0 ? (
        <div className='h-full flex flex-col items-center justify-center p-4 text-gray-400'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='48'
            height='48'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mb-3 text-gray-300'
          >
            <path d='M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z' />
            <path d='M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1' />
          </svg>
          <p className='mb-2'>暂无会话</p>
          <p className='text-xs text-center'>通过好友列表开始新的对话</p>
        </div>
      ) : (
        <div className='overflow-auto flex-1 py-1'>
          {conversationsWithUnread.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeId === conversation.id}
              onClick={() => {
                // 选择会话时清除未读消息
                clearUnreadMessages(conversation.id);
                queryClient.invalidateQueries({
                  queryKey: ['chatHistory', conversation.id],
                });
                onSelect({
                  id: conversation.id,
                  userId: conversation.userId || '',
                  userName: conversation.userName || '',
                  avatar: conversation.avatar
                    ? conversation.avatar.startsWith('http')
                      ? conversation.avatar
                      : `${process.env.NEXT_PUBLIC_API_URL}${conversation.avatar}`
                    : undefined,
                });
                router.push(`/friends?active=${conversation.id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
