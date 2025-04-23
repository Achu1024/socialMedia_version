import { useFriends, useFriendSuggestions } from '@/http/useFriendship';
import { FriendRequestsDialog, FriendsList } from '.';
import { ChatContainer } from '../chat-container';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useConversations } from '@/http/useChat';
import { ActiveConversation } from '../chat-container/ChatContainer';

export const FriendsContainer = () => {
  const searchParams = useSearchParams();
  const activeConversationId = searchParams.get('active');
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(null);

  // 获取会话列表
  const { data: conversations } = useConversations();

  // 获取好友列表和好友请求
  const { error: friendsError } = useFriends();

  // 获取好友推荐
  const { error: suggestionsError } = useFriendSuggestions();

  // 当 activeConversationId 或会话列表变化时，设置当前活跃会话
  useEffect(() => {
    if (activeConversationId && conversations) {
      const conversation = conversations.find(
        (conv) => conv.id === activeConversationId
      );
      if (conversation) {
        setActiveConversation({
          id: conversation.id,
          userId: conversation.userId || '',
          userName: conversation.userName || '',
          avatar: conversation.avatar,
        });
      }
    }
  }, [activeConversationId, conversations]);

  if (friendsError || suggestionsError) {
    return (
      <div className='p-4 bg-red-50 text-red-600 rounded-lg'>
        加载数据失败，请稍后再试
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <ChatContainer initialActiveConversation={activeConversation} />
    </div>
  );
};
