import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/http';
import { toast } from 'react-hot-toast';
import { useProfile } from './useAuth';

// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  friends_count: number;
  posts_count: number;
  get_avatar: string;
  bio?: string;
}

// 好友请求类型
export interface FriendshipRequest {
  id: string;
  created_by: User;
  created_at: string;
  status: string;
  message?: string;
}

// 好友列表响应类型
export interface FriendsResponse {
  user: User;
  friends: User[];
  requests: FriendshipRequest[];
}

/**
 * ### 获取好友列表和好友请求
 * @returns 好友列表、好友请求和查询状态
 */
export const useFriends = () => {
  const { data: profile } = useProfile();

  return useQuery<FriendsResponse>({
    queryKey: ['friends'],
    queryFn: async () => {
      // 使用当前用户自己的ID
      const response = await get<FriendsResponse>(`/friends/${profile?.id}/`);
      return response;
    },
    // 仅在获取到用户信息后才执行查询
    enabled: !!profile?.id,
  });
};

/**
 * ### 接受好友请求
 * @returns 接受好友请求的mutation函数和状态
 */
export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await post(`/friends/${userId}/accepted/`);
      return response;
    },
    onSuccess: () => {
      // 刷新好友列表
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('已接受好友请求');
    },
    onError: (error: Error) => {
      toast.error('处理好友请求失败: ' + (error.message || '未知错误'));
    },
  });
};

/**
 * ### 拒绝好友请求
 * @returns 拒绝好友请求的mutation函数和状态
 */
export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await post(`/friends/${userId}/rejected/`);
      return response;
    },
    onSuccess: () => {
      // 刷新好友列表
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success('已拒绝好友请求');
    },
    onError: (error: Error) => {
      toast.error('处理好友请求失败: ' + (error.message || '未知错误'));
    },
  });
};

/**
 * ### 获取推荐好友
 * @returns 推荐好友列表和查询状态
 */
export const useFriendSuggestions = () => {
  return useQuery<User[]>({
    queryKey: ['friendSuggestions'],
    queryFn: async () => {
      const response = await get<User[]>('/friends/suggested/');
      return response;
    },
  });
};

/**
 * ### 获取热门用户列表（点赞最多）
 * @returns 点赞最多的用户列表和查询状态
 */
export const usePopularUsers = () => {
  return useQuery<User[]>({
    queryKey: ['popularUsers'],
    queryFn: async () => {
      const response = await get<User[]>('/visualization/popular-users/');
      return response;
    },
  });
};
