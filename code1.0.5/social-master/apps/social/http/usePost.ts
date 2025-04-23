import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { del, get, post, put } from '@/lib/http';

export interface Comment {
  id: string;
  body: string;
  likes_count: number;
  islike: boolean;
  created_by: {
    id: string;
    name: string;
    get_avatar: string;
  };
  created_at_formatted: string;
}

export interface Post {
  id: string;
  body: string;
  is_private: boolean;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_by: {
    id: string;
    name: string;
    email: string;
    friends_count: number;
    posts_count: number;
    get_avatar: string;
    bio: string;
  };
  created_at_formatted: string;
  created_at: string;
  attachments: {
    id: string;
    get_image: string;
  }[];
  comments?: Comment[];
}

interface CreatePostData {
  body: string;
  attachments?: File[];
  is_private?: boolean;
}

export interface PostReport {
  id: string;
  post: Post;
  reported_by: {
    id: string;
    name: string;
    get_avatar: string;
  };
  reason: string;
  created_at: string;
  created_at_formatted: string;
}

/**
 * ### 获取帖子列表
 * @returns 帖子列表数据和加载状态
 */
export const usePosts = () => {
  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await get<Post[]>('/posts/');
      return response;
    },
  });
};

/**
 * ### 创建新帖子
 * @returns 创建帖子的 mutation 函数和状态
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const formData = new FormData();
      formData.append('body', data.body);

      // 添加is_private参数，默认为false
      formData.append('is_private', data.is_private ? 'true' : 'false');

      if (data.attachments && data.attachments.length > 0) {
        // 后端可能需要知道有多少图片
        formData.append(
          'attachments_count',
          data.attachments.length.toString()
        );

        // 添加多个图片 - 每个图片使用同一个字段名称
        // 这样后端可以使用request.FILES.getlist('image')来获取所有图片
        data.attachments.forEach((file) => {
          formData.append('image', file);
        });
      }

      const response = await post<Post>('/posts/create/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    },
    onSuccess: () => {
      // 创建成功后，刷新帖子列表
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

/**
 * ### 点赞/取消点赞帖子
 * @param postId 帖子ID
 * @returns 点赞操作的 mutation 函数和状态
 */
export const useLikePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await post<Post>(`/posts/${postId}/like/`);
      return response;
    },
    onSettled: () => {
      // 无论成功或失败，都重新获取最新数据
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['search_posts_paginated'] });
    },
  });
};

/**
 * ### 获取帖子详情
 * @param id 帖子ID
 * @returns 帖子详情数据和加载状态
 */
export const usePostDetail = (id: string) => {
  return useQuery<{ post: Post }>({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await get<{ post: Post }>(`/posts/${id}/`);
      return response;
    },
    enabled: !!id,
  });
};

/**
 * ### 创建评论
 * @param postId 帖子ID
 * @returns 创建评论的 mutation 函数和状态
 */
export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { body: string }) => {
      const response = await post<Post['comments']>(
        `/posts/${postId}/comment/`,
        data
      );
      return response;
    },
    onMutate: async (newComment) => {
      // 取消任何正在进行的重新获取
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      // 获取当前数据的快照
      const previousPost = queryClient.getQueryData<{ post: Post }>([
        'post',
        postId,
      ]);
      // 乐观更新详情数据
      // @ts-ignore
      queryClient.setQueryData<{ post: Post }>(['post', postId], (old) => {
        if (!old?.post) return undefined;
        return {
          post: {
            ...old.post,
            comments_count: old.post.comments_count + 1,
            comments: [
              ...(old.post.comments || []),
              {
                id: Date.now().toString(), // 临时 ID
                body: newComment.body,
                created_by: {
                  id: old.post.created_by.id,
                  name: old.post.created_by.name,
                  get_avatar: old.post.created_by.get_avatar,
                },
                created_at_formatted: '刚刚',
              },
            ],
          },
        };
      });

      // 返回快照用于回滚
      return { previousPost };
    },
    onError: (err, _, context) => {
      // 如果发生错误，回滚到快照
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSettled: () => {
      // 无论成功或失败，都重新获取最新数据
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

/**
 * ### 点赞/取消点赞评论
 * @param posId 帖子ID
 * @param commentId 评论ID
 * @returns 点赞操作的 mutation 函数和状态
 */
export const useLikeComment = (postId: string, commentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await post<Comment>(
        `/posts/${postId}/comments/${commentId}/like/`
      );
      return response;
    },
    onMutate: async () => {
      // 取消任何正在进行的重新获取
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      // 获取当前数据的快照
      const previousPost = queryClient.getQueryData<{ post: Post }>([
        'post',
        postId,
      ]);

      // 乐观更新详情数据
      queryClient.setQueryData<{ post: Post }>(['post', postId], (old) => {
        if (!old?.post) return undefined;

        const updatedComments = old.post.comments?.map((comment) => {
          if (comment.id === commentId) {
            // 切换点赞状态和数量
            const islikeNew = !comment.islike;
            const likesCountNew = islikeNew
              ? comment.likes_count + 1
              : Math.max(0, comment.likes_count - 1);

            return {
              ...comment,
              islike: islikeNew,
              likes_count: likesCountNew,
            };
          }
          return comment;
        });

        return {
          post: {
            ...old.post,
            comments: updatedComments,
          },
        };
      });

      return { previousPost };
    },
    onError: (error, _, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};

/**
 * ### 更新帖子
 * @param postId 帖子ID
 * @returns 更新帖子的 mutation 函数和状态
 */
export const useUpdatePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { is_private?: boolean }) => {
      const response = await put<Post>(`/posts/${postId}/update/`, data);
      return response;
    },
    onSuccess: () => {
      // 更新成功后，刷新相关数据
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      queryClient.invalidateQueries({ queryKey: ['search_posts_paginated'] });
    }
  });
};

interface Trend {
  id: number;
  hashtag: string;
  occurences: number;
}
/**
 * ### 获取趋势
 */
export const getTrend = () => {
  return useQuery<Trend[]>({
    queryKey: ['trend'],
    queryFn: async () => {
      const response = await get<Trend[]>('/posts/trends/');
      return response;
    },
  });
};

/**
 * ### 删除帖子
 * @param postId 帖子ID
 * @returns 删除帖子的 mutation 函数和状态
 */
export const useDeletePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await del<Post>(`/posts/${postId}/delete/`);
      return response;
    },
    onSuccess: () => {
      // 删除成功后刷新帖子列表
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user_posts'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
};

/**
 * ### 举报帖子
 * @param postId 帖子ID
 * @returns 举报帖子的 mutation 函数和状态
 */
export const useReportPost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { reason: string }) => {
      const response = await post<{ message: string; report: PostReport }>(
        `/posts/${postId}/report/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      // 举报成功后，可能需要刷新某些查询
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};
