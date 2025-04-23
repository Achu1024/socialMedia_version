import { useProfile } from '@/http/useAuth';
import { useConversations, useSocketConnection } from '@/http/useChat';
import { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatBox } from './ChatBox';
import { useChatStore } from '@/store/chat';

export interface ActiveConversation {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
}

interface ChatContainerProps {
  initialActiveConversation?: ActiveConversation | null;
}

export const ChatContainer = ({
  initialActiveConversation,
}: ChatContainerProps) => {
  const { data: profile } = useProfile();
  const userId = profile?.id.toString();

  // 连接 Socket
  const { socket, isConnected } = useSocketConnection(userId);

  // 获取chatStore中的方法
  const { addUnreadMessage } = useChatStore();

  // 获取会话列表
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
  } = useConversations();

  // 选中的会话
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(initialActiveConversation || null);

  // 当 initialActiveConversation 变化时更新选中的会话
  useEffect(() => {
    if (initialActiveConversation) {
      setActiveConversation(initialActiveConversation);
    }
  }, [initialActiveConversation]);

  // 全局监听消息通知
  useEffect(() => {
    if (!socket || !userId) return;

    // 监听所有会话的消息通知
    socket.on(
      'messageNotification',
      (data: { conversationId: string; message: string; sendId: string }) => {
        // 如果不是自己发送的消息，且不是当前活跃会话的消息，才添加通知
        if (
          data.sendId !== userId &&
          (!activeConversation || activeConversation.id !== data.conversationId)
        ) {
          addUnreadMessage(data.conversationId, data.message, data.sendId);
        }
      }
    );

    return () => {
      socket.off('messageNotification');
    };
  }, [socket, userId, activeConversation, addUnreadMessage]);

  if (conversationsError) {
    return (
      <div className='p-4 bg-red-50 text-red-600 rounded-lg'>
        加载数据失败，请稍后再试
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-120px)] rounded-lg shadow-sm overflow-hidden bg-white'>
      {/* 左侧会话列表 */}
      <div className='w-[300px] border-r border-gray-100'>
        <ConversationList
          conversations={conversations || []}
          isLoading={isLoadingConversations}
          activeId={activeConversation?.id}
          onSelect={setActiveConversation}
        />
      </div>

      {/* 右侧聊天区域 */}
      <div className='flex-1 flex flex-col border-2 border-gray-100'>
        {activeConversation ? (
          <ChatBox
            conversation={activeConversation}
            userId={userId}
            socket={socket}
            isConnected={isConnected}
          />
        ) : (
          <div className='flex-1 flex items-center justify-center text-gray-400 flex-col'>
            <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='text-gray-400'
              >
                <path d='M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z' />
                <path d='M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1' />
              </svg>
            </div>
            选择一个会话开始聊天
          </div>
        )}
      </div>
    </div>
  );
};
