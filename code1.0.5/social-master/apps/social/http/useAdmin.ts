import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/http';

export interface User {
  id: string;
  email: string;
  name: string;
  get_avatar: string;
  bio: string;
  is_active: boolean;
  friends_count: number;
  posts_count: number;
  date_joined: string;
  created_at: string;
  is_admin: boolean;
}

export interface UserDetail extends User {
  friendship_requests: {
    received: number;
    sent: number;
  };
  mibt_result: {
    personality_type: string;
    personality_category: string;
    created_at: string;
  } | null;
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  staff_users: number;
  superusers: number;
  admin_users: number;
  total_posts: number;
  recent_users: User[];
  daily_new_users: Array<{
    date: string;
    count: number;
  }>;
  most_popular_users?: Array<{
    id: string;
    name: string;
    likes_received: number;
  }>;
}

interface CreateUserData {
  email: string;
  name: string;
  password: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

interface UpdateUserData {
  email?: string;
  name?: string;
  bio?: string;
  password?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

// 帖子相关接口定义
export interface PostAttachment {
  id: string;
  get_image: string;
}

export interface Post {
  id: string;
  body: string;
  is_private: boolean;
  likes_count: number;
  comments_count: number;
  created_by: User;
  created_at: string;
  created_at_formatted: string;
  attachments: PostAttachment[];
  islike: boolean;
  reports_count?: number;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  body: string;
  created_by: User;
  created_at_formatted: string;
  likes_count: number;
  islike: boolean;
}

export interface PostDetail extends Post {
  comments: Comment[];
  reports?: {
    count: number;
    users: User[];
  };
}

export interface PostStatistics {
  total_posts: number;
  private_posts: number;
  public_posts: number;
  reported_posts: number;
  recent_posts: Post[];
  most_commented: Post[];
  most_liked: Post[];
  trends: { hashtag: string; occurences: number }[];
}

interface CreatePostData {
  body: string;
  is_private?: boolean;
  user_id?: string;
  attachments?: string[];
}

interface UpdatePostData {
  body?: string;
  is_private?: boolean;
  attachments?: string[];
}

export interface PostReport {
  id: string;
  post: Post;
  reported_by: User;
  reason: string;
  created_at: string;
  created_at_formatted: string;
}

export interface ReportedPostWithDetails {
  post: Post;
  reports_count: number;
  reports: PostReport[];
}

/**
 * ### 获取所有用户列表
 * @param search 搜索关键词
 * @param isActive 是否仅显示活跃用户
 * @param isStaff 是否仅显示管理员用户
 * @returns 用户列表查询结果
 */
export const useAdminUsersList = (
  search?: string,
  isActive?: boolean,
  isStaff?: boolean
) => {
  let url = '/admin/users/';
  const params = new URLSearchParams();

  if (search) params.append('search', search);
  if (isActive !== undefined) params.append('is_active', String(isActive));
  if (isStaff !== undefined) params.append('is_staff', String(isStaff));

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  return useQuery<{ users: User[] }>({
    queryKey: ['admin', 'users', search, isActive, isStaff],
    queryFn: async () => {
      const response = await get<{ users: User[] }>(url);
      return response;
    },
  });
};

/**
 * ### 获取用户统计信息
 * @returns 用户统计信息查询结果
 */
export const useAdminUserStatistics = () => {
  return useQuery<UserStatistics>({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: async () => {
      const response = await get<UserStatistics>('/admin/users/stats/');
      return response;
    },
  });
};

/**
 * ### 获取用户详情
 * @param userId 用户ID
 * @returns 用户详情查询结果
 */
export const useAdminUserDetail = (userId: string) => {
  return useQuery<{
    user: User;
    friendship_requests: { received: number; sent: number };
    mibt_result: any;
  }>({
    queryKey: ['admin', 'user', userId],
    queryFn: async () => {
      const response = await get<{
        user: User;
        friendship_requests: { received: number; sent: number };
        mibt_result: any;
      }>(`/admin/users/${userId}/`);
      return response;
    },
    enabled: !!userId,
  });
};

/**
 * ### 创建新用户
 * @returns 创建用户的mutation函数和状态
 */
export const useAdminCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await post<{ success: boolean; user: User }>(
        '/admin/users/create/',
        data
      );
      return response;
    },
    onSuccess: () => {
      // 创建成功后，刷新用户列表和统计数据
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'stats'] });
    },
  });
};

/**
 * ### 更新用户信息
 * @param userId 用户ID
 * @returns 更新用户的mutation函数和状态
 */
export const useAdminUpdateUser = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserData) => {
      const response = await put<{ success: boolean; user: User }>(
        `/admin/users/${userId}/update/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      // 更新成功后，刷新用户详情、用户列表和统计数据
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'stats'] });
    },
  });
};

/**
 * ### 删除用户
 * @param userId 用户ID
 * @returns 删除用户的mutation函数和状态
 */
export const useAdminDeleteUser = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await del<{ success: boolean; message: string }>(
        `/admin/users/${userId}/delete/`
      );
      return response;
    },
    onSuccess: () => {
      // 删除成功后，刷新用户列表和统计数据
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'stats'] });
    },
  });
};

/**
 * ### 重置用户密码
 * @param userId 用户ID
 * @returns 重置密码的mutation函数和状态
 */
export const useAdminResetUserPassword = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await post<{ 
        success: boolean; 
        message: string;
        new_password: string;
      }>(`/admin/users/${userId}/reset-password/`, {});
      return response;
    },
    onSuccess: () => {
      // 重置成功后，刷新用户详情
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
    },
  });
};

// 以下是帖子管理相关的 hooks

/**
 * ### 获取所有帖子列表
 * @param search 搜索关键词（可搜索帖子内容或发布者名字/邮箱）
 * @param userId 按用户筛选
 * @param isPrivate 是否仅显示私密帖子
 * @param hasReports 是否仅显示被举报帖子
 * @param sortBy 排序方式
 * @param page 当前页码
 * @param pageSize 每页数量
 * @returns 帖子列表查询结果
 */
export const useAdminPostsList = (
  search?: string,
  userId?: string,
  isPrivate?: boolean,
  hasReports?: boolean,
  sortBy: string = '-created_at',
  page: number = 1,
  pageSize: number = 10
) => {
  let url = '/posts/admin/posts/';
  const params = new URLSearchParams();

  if (search) params.append('search', search);
  if (userId) params.append('user_id', userId);
  if (isPrivate !== undefined) params.append('is_private', String(isPrivate));
  if (hasReports !== undefined)
    params.append('has_reports', String(hasReports));
  if (sortBy) params.append('sort_by', sortBy);
  if (page) params.append('page', String(page));
  if (pageSize) params.append('page_size', String(pageSize));

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  return useQuery<{
    count: number;
    next: string | null;
    previous: string | null;
    results: { posts: Post[] };
  }>({
    queryKey: [
      'admin',
      'posts',
      search,
      userId,
      isPrivate,
      hasReports,
      sortBy,
      page,
      pageSize,
    ],
    queryFn: async () => {
      const response = await get<{
        count: number;
        next: string | null;
        previous: string | null;
        results: { posts: Post[] };
      }>(url);
      return response;
    },
  });
};

/**
 * ### 获取帖子统计信息
 * @returns 帖子统计信息查询结果
 */
export const useAdminPostStatistics = () => {
  return useQuery<PostStatistics>({
    queryKey: ['admin', 'posts', 'stats'],
    queryFn: async () => {
      const response = await get<PostStatistics>('/posts/admin/posts/stats/');
      return response;
    },
  });
};

/**
 * ### 获取被举报的帖子列表
 * @param page 当前页码
 * @param pageSize 每页数量
 * @returns 被举报帖子列表查询结果
 */
export const useAdminReportedPosts = (
  page: number = 1,
  pageSize: number = 10
) => {
  let url = '/posts/admin/posts/reports/';
  const params = new URLSearchParams();

  if (page) params.append('page', String(page));
  if (pageSize) params.append('page_size', String(pageSize));

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  return useQuery<{
    count: number;
    next: string | null;
    previous: string | null;
    results: { reported_posts: ReportedPostWithDetails[] };
  }>({
    queryKey: ['admin', 'posts', 'reports', page, pageSize],
    queryFn: async () => {
      const response = await get<{
        count: number;
        next: string | null;
        previous: string | null;
        results: { reported_posts: ReportedPostWithDetails[] };
      }>(url);
      return response;
    },
  });
};

/**
 * ### 获取帖子详情
 * @param postId 帖子ID
 * @returns 帖子详情查询结果
 */
export const useAdminPostDetail = (postId: string) => {
  return useQuery<{ post: PostDetail }>({
    queryKey: ['admin', 'post', postId],
    queryFn: async () => {
      const response = await get<{ post: PostDetail }>(
        `/posts/admin/posts/${postId}/`
      );
      return response;
    },
    enabled: !!postId,
  });
};

/**
 * ### 创建新帖子
 * @returns 创建帖子的mutation函数和状态
 */
export const useAdminCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const response = await post<{ success: boolean; post: PostDetail }>(
        '/posts/admin/posts/create/',
        data
      );
      return response;
    },
    onSuccess: () => {
      // 创建成功后，刷新帖子列表和统计数据
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts', 'stats'] });
    },
  });
};

/**
 * ### 更新帖子信息
 * @param postId 帖子ID
 * @returns 更新帖子的mutation函数和状态
 */
export const useAdminUpdatePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePostData) => {
      const response = await put<{ success: boolean; post: PostDetail }>(
        `/posts/admin/posts/${postId}/update/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      // 更新成功后，刷新帖子详情、帖子列表和统计数据
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts', 'stats'] });
    },
  });
};

/**
 * ### 删除帖子
 * @param postId 帖子ID
 * @returns 删除帖子的mutation函数和状态
 */
export const useAdminDeletePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await del<{ success: boolean; message: string }>(
        `/posts/admin/posts/${postId}/delete/`
      );
      return response;
    },
    onSuccess: () => {
      // 删除成功后，刷新帖子列表和统计数据
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts', 'stats'] });
    },
  });
};

/**
 * ### 清除帖子举报
 * @param postId 帖子ID
 * @returns 清除帖子举报的mutation函数和状态
 */
export const useAdminClearPostReports = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await post<{ success: boolean; message: string }>(
        `/posts/admin/posts/${postId}/clear-reports/`,
        {}
      );
      return response;
    },
    onSuccess: () => {
      // 清除举报成功后，刷新帖子详情、被举报帖子列表和统计数据
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', postId] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'posts', 'reports'],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts', 'stats'] });
    },
  });
};

/**
 * ### 处理单个举报
 * @param reportId 举报ID
 * @returns 处理举报的mutation函数和状态
 */
export const useAdminHandleReport = (reportId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      action: 'dismiss' | 'ban_user' | 'delete_post';
      notes?: string;
    }) => {
      const response = await post<{ success: boolean; message: string }>(
        `/posts/admin/reports/${reportId}/handle/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      // 处理成功后，刷新相关数据
      queryClient.invalidateQueries({
        queryKey: ['admin', 'posts', 'reports'],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts', 'stats'] });
    },
  });
};

/**
 * ### 获取单个举报详情
 * @param reportId 举报ID
 * @returns 举报详情查询结果
 */
export const useAdminReportDetail = (reportId: string) => {
  return useQuery<{ report: PostReport }>({
    queryKey: ['admin', 'report', reportId],
    queryFn: async () => {
      const response = await get<{ report: PostReport }>(
        `/posts/admin/reports/${reportId}/`
      );
      return response;
    },
    enabled: !!reportId,
  });
};

// 可视化相关接口定义
export interface DateCount {
  date: string;
  count: number;
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface PublicPrivateRatio {
  public: number;
  private: number;
}

export interface ActiveInactiveRatio {
  active: number;
  inactive: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  group: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

export interface NetworkVisualization {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface UserStatistics {
  users_by_date: DateCount[];
  active_vs_inactive: ActiveInactiveRatio;
  personality_distribution: CategoryCount[];
  total_users: number;
}

export interface PostStatistics {
  posts_by_date: DateCount[];
  top_liked_posts: Post[];
  top_commented_posts: Post[];
  public_vs_private: PublicPrivateRatio;
  top_trends: { hashtag: string; occurences: number }[];
  total_posts: number;
}

export interface InteractionStatistics {
  likes_by_month: MonthCount[];
  comments_by_month: MonthCount[];
  friend_requests_by_month: MonthCount[];
  friendship_status: { status: string; count: number }[];
  total_likes: number;
  total_comments: number;
}

export interface UserActivitySummary {
  posts_by_date: DateCount[];
  received_likes: number;
  comments_made: number;
  likes_given: number;
  friends_count: number;
  total_posts: number;
}

export interface AdminDashboardWeeklyStats {
  week_start: string;
  week_end: string;
  new_users: number;
  new_posts: number;
  new_likes: number;
  new_comments: number;
}

export interface AdminDashboardSummary {
  total_users: number;
  new_users_30d: number;
  total_posts: number;
  new_posts_30d: number;
  total_likes: number;
  new_likes_30d: number;
  total_comments: number;
  new_comments_30d: number;
  total_reports: number;
  new_reports_30d: number;
}

export interface AdminDashboardAverages {
  avg_posts_per_user: number;
  avg_likes_per_post: number;
  avg_comments_per_post: number;
  user_activity_rate: number;
}

export interface AdminDashboardTopUsers {
  most_active: { id: string; name: string; posts_count: number }[];
  most_popular: { id: string; name: string; likes_received: number }[];
}

export interface AdminDashboard {
  summary: AdminDashboardSummary;
  averages: AdminDashboardAverages;
  weekly_stats: AdminDashboardWeeklyStats[];
  top_users: AdminDashboardTopUsers;
}

/**
 * ### 获取管理员仪表盘数据
 * @returns 管理员仪表盘数据查询结果
 */
export const useAdminDashboard = () => {
  return useQuery<AdminDashboard>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await get<AdminDashboard>(
        '/visualization/admin/dashboard/'
      );
      return response;
    },
  });
};

/**
 * ### 获取用户统计可视化数据
 * @returns 用户统计可视化数据查询结果
 */
export const useUserStatisticsVisualization = () => {
  return useQuery<UserStatistics>({
    queryKey: ['visualization', 'users', 'stats'],
    queryFn: async () => {
      const response = await get<UserStatistics>('/visualization/users/stats/');
      return response;
    },
  });
};

/**
 * ### 获取帖子统计可视化数据
 * @returns 帖子统计可视化数据查询结果
 */
export const usePostStatisticsVisualization = () => {
  return useQuery<PostStatistics>({
    queryKey: ['visualization', 'posts', 'stats'],
    queryFn: async () => {
      const response = await get<PostStatistics>('/visualization/posts/stats/');
      return response;
    },
  });
};

/**
 * ### 获取互动统计可视化数据
 * @returns 互动统计可视化数据查询结果
 */
export const useInteractionStatisticsVisualization = () => {
  return useQuery<InteractionStatistics>({
    queryKey: ['visualization', 'interactions', 'stats'],
    queryFn: async () => {
      const response = await get<InteractionStatistics>(
        '/visualization/interactions/stats/'
      );
      return response;
    },
  });
};

/**
 * ### 获取用户活动概览
 * @returns 用户活动概览查询结果
 */
export const useUserActivitySummary = () => {
  return useQuery<UserActivitySummary>({
    queryKey: ['visualization', 'user', 'activity'],
    queryFn: async () => {
      const response = await get<UserActivitySummary>(
        '/visualization/user/activity/'
      );
      return response;
    },
  });
};

/**
 * ### 获取用户社交网络可视化数据
 * @returns 用户社交网络可视化数据查询结果
 */
export const useUserNetworkVisualization = () => {
  return useQuery<NetworkVisualization>({
    queryKey: ['visualization', 'user', 'network'],
    queryFn: async () => {
      const response = await get<NetworkVisualization>(
        '/visualization/user/network/'
      );
      return response;
    },
  });
};

/**
 * ### 删除热门话题
 * @param hashtag 话题标签
 * @returns 删除话题的mutation函数和状态
 */
export const useAdminDeleteTrend = (hashtag: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await del<{ success: boolean; message: string }>(
        `/posts/admin/trends/${hashtag}/delete/`
      );
      return response;
    },
    onSuccess: () => {
      // 删除成功后，刷新帖子统计数据
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts', 'stats'] });
      // 同时刷新热门话题列表，确保首页右侧边栏能显示最新的话题列表
      queryClient.invalidateQueries({ queryKey: ['trend'] });
    },
  });
};

/**
 * ### 创建热门话题
 * @returns 创建话题的mutation函数和状态
 */
export const useAdminCreateTrend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { hashtag: string; occurences?: number }) => {
      const response = await post<{ 
        success: boolean; 
        message: string;
        trend: { hashtag: string; occurences: number } 
      }>('/posts/admin/trends/create/', data);
      return response;
    },
    onSuccess: () => {
      // 创建成功后，刷新帖子统计数据
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts', 'stats'] });
      // 同时刷新热门话题列表，确保首页右侧边栏能显示最新添加的话题
      queryClient.invalidateQueries({ queryKey: ['trend'] });
    },
  });
};

/**
 * ### 管理员删除评论
 * @param postId 帖子ID
 * @param commentId 评论ID
 * @returns 删除评论的mutation
 */
export const useAdminDeleteComment = (postId: string, commentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await del(
        `/posts/admin/posts/${postId}/comments/${commentId}/delete/`
      );
      return response;
    },
    onSuccess: () => {
      // 删除成功后刷新帖子详情
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', postId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    }
  });
};
