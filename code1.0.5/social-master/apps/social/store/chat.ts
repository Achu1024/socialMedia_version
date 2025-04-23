import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationMessage {
  conversationId: string;
  message: string;
  sendId: string;
  timestamp: number;
}

interface ChatStore {
  // ai
  themeList: Set<string>;
  setThemeList: (strings: string) => void;
  // 未读消息计数，按会话ID存储
  unreadMessages: Record<string, number>;
  // 通知消息，按会话ID存储最新消息
  notifications: Record<string, NotificationMessage>;
  // 当前活跃的会话ID
  activeConversationId: string | null;
  // 添加未读消息
  addUnreadMessage: (
    conversationId: string,
    message: string,
    sendId: string
  ) => void;
  // 清除指定会话的未读消息
  clearUnreadMessages: (conversationId: string) => void;
  // 设置活跃会话
  setActiveConversationId: (conversationId: string | null) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      themeList: new Set(),
      unreadMessages: {},
      notifications: {},
      activeConversationId: null,
      setThemeList: (string) => {
        set((state) => ({ themeList: state.themeList.add(string) }));
      },
      addUnreadMessage: (conversationId, message, sendId) =>
        set((state) => {
          // 如果是当前活跃的会话，不增加未读计数
          if (state.activeConversationId === conversationId) {
            return state;
          }

          // 更新未读消息计数
          const currentCount = state.unreadMessages[conversationId] || 0;

          // 更新通知
          const notification: NotificationMessage = {
            conversationId,
            message,
            sendId,
            timestamp: Date.now(),
          };

          return {
            unreadMessages: {
              ...state.unreadMessages,
              [conversationId]: currentCount + 1,
            },
            notifications: {
              ...state.notifications,
              [conversationId]: notification,
            },
          };
        }),

      clearUnreadMessages: (conversationId) =>
        set((state) => ({
          unreadMessages: {
            ...state.unreadMessages,
            [conversationId]: 0,
          },
        })),

      setActiveConversationId: (conversationId) =>
        set((state) => {
          // 如果设置了新的活跃会话，清除该会话的未读消息
          if (conversationId) {
            return {
              activeConversationId: conversationId,
              unreadMessages: {
                ...state.unreadMessages,
                [conversationId]: 0,
              },
            };
          }

          return { activeConversationId: conversationId };
        }),
    }),
    {
      name: 'chat-storage',
      // 只持久化未读消息数量，不持久化通知内容
      partialize: (state) => ({
        unreadMessages: state.unreadMessages,
      }),
    }
  )
);
