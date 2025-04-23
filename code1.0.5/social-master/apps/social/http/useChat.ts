import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/http';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './useAuth';
import { useChatStore } from '@/store/chat';

// 消息类型定义
export interface ChatMessage {
  id?: string;
  sendId: string;
  converId: string;
  type: string;
  message: string;
  created_at?: string;
  conversationId?: string;
  body?: string;
  created_by?: {
    id: string;
    name: string;
    avatar?: string;
  };
  sent_to?: {
    id: string;
    name: string;
    avatar?: string;
  };
  created_at_formatted?: string;
}

// 会话类型定义
export interface Conversation {
  id: string;
  users: {
    id: string;
    name: string;
    avatar?: string;
    get_avatar?: string;
  }[];
  modified_at_formatted: string;
  messages?: ChatMessage[];
  // 前端需要的额外字段
  userId?: string;
  userName?: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount?: number;
  lastMessageTime?: string;
}

/**
 * ### 创建socket连接
 * @returns socket连接
 */
const createSocketConnection = () => {
  const socket = io('http://127.0.0.1:8100', {
    path: '/socket.io/',
    transports: ['websocket'],
    autoConnect: true,
  });
  return socket;
};

/**
 * ### 使用聊天连接
 * @param userId 当前用户ID
 * @returns socket连接
 */
export const useSocketConnection = (userId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const newSocket = createSocketConnection();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('connectChat', userId);
      newSocket.emit('initChat', { userId });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  return { socket, isConnected };
};

/**
 * ### 获取会话列表
 * @returns 会话列表
 */
export const useConversations = () => {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await get('/me/');
      return response;
    },
    enabled: !!getAccessToken(),
  });

  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      // 调用后端会话列表接口
      const response = await get<Conversation[]>('/chat/');

      // 处理返回的数据，添加前端需要的字段
      return response.map((conversation) => {
        const otherUser = conversation.users.find(
          (user) => user.id !== profile?.id.toString()
        );

        // 找到最新的消息
        let lastMessage = '';
        let lastMessageTime = '';

        if (conversation.messages && conversation.messages.length > 0) {
          const lastMsg =
            conversation.messages[conversation.messages.length - 1];
          lastMessage = lastMsg.body || '';
          lastMessageTime = lastMsg.created_at || '';
        }

        return {
          ...conversation,
          userId: otherUser?.id || '',
          userName: otherUser?.name || '',
          avatar: otherUser?.get_avatar,
          lastMessage,
          lastMessageTime,
          unreadCount: 0, // 暂不实现未读计数
        };
      });
    },
    enabled: !!getAccessToken() && !!profile,
  });
};

/**
 * ### 获取聊天历史
 * @param conversationId 会话ID
 * @returns 消息列表
 */
export const useChatHistory = (conversationId?: string) => {
  return useQuery<ChatMessage[]>({
    queryKey: ['chatHistory', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      // 调用后端获取会话详情接口
      const response = await get<Conversation>(`/chat/${conversationId}/`);

      // 将后端消息格式转换为前端所需格式
      return (response.messages || []).map((msg) => ({
        id: msg.id,
        sendId: msg.created_by?.id || '',
        converId: msg.sent_to?.id || '',
        message: msg.body || '',
        type: 'text',
        created_at: msg.created_at,
        created_by: msg.created_by,
        sent_to: msg.sent_to,
      }));
    },
    enabled: !!conversationId && !!getAccessToken(),
  });
};

/**
 * ### 使用实时聊天
 * @param userId 当前用户ID
 * @param targetId 目标用户ID
 * @param socket 聊天连接
 * @returns 消息列表
 */
export const useRealTimeChat = (
  userId?: string,
  targetId?: string,
  socket?: Socket | null,
  conversationId?: string
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const queryClient = useQueryClient();
  const { addUnreadMessage, setActiveConversationId } = useChatStore();

  useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
    }

    return () => {
      if (conversationId) {
        setActiveConversationId(null);
      }
    };
  }, [conversationId, setActiveConversationId]);

  useEffect(() => {
    if (!socket || !userId) return;

    // 监听新消息
    socket.on(`chat:${conversationId}`, (newMessage: ChatMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      const oldMessages = queryClient.getQueryData<ChatMessage[]>([
        'chatHistory',
        conversationId,
      ]);
      queryClient.setQueryData(
        ['chatHistory', conversationId],
        [...(oldMessages || []), newMessage]
      );
    });

    // 监听所有消息通知
    socket.on(
      'messageNotification',
      (data: { conversationId: string; message: string; sendId: string }) => {
        // 如果不是自己发的消息才添加通知
        if (data.sendId !== userId) {
          addUnreadMessage(data.conversationId, data.message, data.sendId);

          // 更新会话列表中的最新消息
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      }
    );

    return () => {
      socket.off(`chat:${conversationId}`);
      socket.off('messageNotification');
    };
  }, [socket, userId, targetId, conversationId, queryClient, addUnreadMessage]);

  // 发送消息
  const sendMessage = (content: string, conversationId?: string) => {
    if (!socket || !userId || !targetId) return;

    const message: ChatMessage = {
      sendId: userId,
      converId: targetId,
      type: 'text',
      message: content,
      conversationId,
    };

    socket.emit('sendMessage', message);
  };

  // 发送正在输入状态
  const sendTypingStatus = (status: 'typing' | 'idle') => {
    if (!socket || !userId || !targetId) return;

    socket.emit('awareness', {
      userId,
      targetId,
      status,
    });
  };

  return { messages, sendMessage, sendTypingStatus };
};

/**
 * ### 创建新会话或获取已存在会话
 * @returns 会话
 */
export const useCreateOrGetConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      // 调用后端获取或创建会话接口
      const response = await get<Conversation>(
        `/chat/${targetUserId}/get-or-create/`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

/**
 * ### 发送消息到会话
 * @param conversationId 会话ID
 * @returns 消息
 */
export const useSendMessage = (conversationId?: string) => {
  return useMutation({
    mutationFn: async (body: string) => {
      if (!conversationId) throw new Error('没有会话ID');

      // 调用后端发送消息接口
      const response = await post<ChatMessage>(
        `/chat/${conversationId}/send/`,
        { body }
      );
      return response;
    },
  });
};
