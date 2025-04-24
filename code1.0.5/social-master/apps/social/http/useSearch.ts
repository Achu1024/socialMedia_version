import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { post } from '@/lib/http';
import { Post } from './usePost';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export interface SearchUser {
  id: string;
  name: string;
  email: string;
  friends_count: number;
  posts_count: number;
  get_avatar: string;
  bio: string;
}

export interface SearchResults {
  users: SearchUser[];
  posts: Post[];
}

interface SearchPostsPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Post[];
  total_count: number;
}

/**
 * ### 搜索用户和帖子
 * @returns 搜索功能的 mutation 函数和状态
 */
export const useSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await post<SearchResults>('/search/', { query });
      return response;
    },
  });
};

/**
 * ### 分页搜索帖子
 * @param query 搜索关键词
 * @returns 分页搜索功能的 query hook
 */
export const useSearchPostsPaginated = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get('query')
    ? `#${searchParams.get('query')}`
    : '';
  return useInfiniteQuery({
    queryKey: ['search_posts_paginated', query],
    queryFn: async ({ pageParam = '1' }) => {
      const response = await post<SearchPostsPaginatedResponse>(
        '/search/posts/',
        { query, page: +pageParam }
      );
      return response;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined;
      return String(allPages.length + 1);
    },
    initialPageParam: '1',
    getPreviousPageParam: (firstPage) => firstPage.previous,
  });
};

/**
 * ### 更新搜索结果中的点赞状态
 * @param postId 帖子ID
 * @param isLiked 是否点赞
 */
export const updateSearchPostsLikeStatus = (
  queryClient: any,
  postId: string,
  isLiked: boolean
) => {
  type SearchPostsData = {
    pages: SearchPostsPaginatedResponse[];
    pageParams: unknown[];
  };

  queryClient.setQueryData(['search_posts_paginated', ''], (old: SearchPostsData | undefined) => {
    if (!old) return old;
    
    return {
      ...old,
      pages: old.pages.map((page: SearchPostsPaginatedResponse) => ({
        ...page,
        results: page.results.map((post: Post) => {
          if (post.id === postId) {
            return {
              ...post,
              islike: isLiked,
              likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1,
            };
          }
          return post;
        }),
      })),
    };
  });
};
