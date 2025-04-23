import { Conversation } from '@/http/useChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useChatStore } from '@/store/chat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem = ({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) => {
  const { notifications } = useChatStore();

  // 获取最新的消息通知
  const notification = notifications[conversation.id];

  // 格式化最后消息时间
  const formattedTime = conversation.lastMessageTime
    ? formatDistanceToNow(new Date(conversation.lastMessageTime), {
        addSuffix: true,
        locale: zhCN,
      })
    : '';

  // 处理头像URL，确保使用完整路径
  const avatarUrl = conversation.avatar
    ? conversation.avatar.startsWith('http')
      ? conversation.avatar
      : `${process.env.NEXT_PUBLIC_API_URL}${conversation.avatar}`
    : '';

  // 获取要显示的最后消息内容
  const lastMessage = notification?.message || conversation.lastMessage || '';

  return (
    <div
      className={cn(
        'flex items-start p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150',
        isActive && 'bg-green-50 hover:bg-green-50 border-l-4 border-green-700'
      )}
      onClick={onClick}
    >
      <Avatar className='h-12 w-12 mr-3 ring-2 ring-offset-2 ring-opacity-10 ring-gray-200 flex-shrink-0'>
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className='bg-green-700 text-white'>
          {conversation.userName?.charAt(0) || '用户'}
        </AvatarFallback>
      </Avatar>

      <div className='flex-1 min-w-0 text-left'>
        <div className='flex justify-between items-center mb-1'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'font-medium truncate max-w-[120px] inline-block', 
                    isActive && 'text-green-700'
                  )}
                >
                  {conversation.userName}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start">
                {conversation.userName}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {formattedTime && (
            <span className='text-xs text-gray-500 ml-1 whitespace-nowrap flex-shrink-0'>
              {formattedTime}
            </span>
          )}
        </div>

        <div className='flex items-center'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p
                  className={cn(
                    'text-sm truncate mr-2 max-w-[160px]',
                    conversation.unreadCount
                      ? 'text-gray-800 font-medium'
                      : 'text-gray-500'
                  )}
                >
                  {lastMessage}
                </p>
              </TooltipTrigger>
              {lastMessage && (
                <TooltipContent side="bottom" align="start" className="max-w-xs">
                  <p className="text-sm">{lastMessage}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {conversation.unreadCount ? (
            <span className='bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1.5 flex-shrink-0'>
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
