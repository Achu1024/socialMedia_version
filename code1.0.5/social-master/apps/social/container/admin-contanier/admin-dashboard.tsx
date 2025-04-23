import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  useAdminDashboard,
  useUserStatisticsVisualization,
  usePostStatisticsVisualization,
  useInteractionStatisticsVisualization,
  useAdminUserStatistics,
} from '@/http/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, BarChart2, MessageSquare, Users } from 'lucide-react';

// 颜色配置
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82ca9d',
  '#ffc658',
  '#8dd1e1',
  '#a4de6c',
  '#d0ed57',
];

const AdminDashboard: React.FC = () => {
  const { data: dashboardData, isLoading: isDashboardLoading } =
    useAdminDashboard();
  const { data: userStats, isLoading: isUserStatsLoading } =
    useUserStatisticsVisualization();
  const { data: postStats, isLoading: isPostStatsLoading } =
    usePostStatisticsVisualization();
  const { data: interactionStats, isLoading: isInteractionStatsLoading } =
    useInteractionStatisticsVisualization();
  const { data: userData, isLoading: userLoading } = useAdminUserStatistics();

  // 格式化日期函数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 每周统计图数据处理
  const getWeeklyStatsData = () => {
    if (!dashboardData) return [];
    return dashboardData.weekly_stats
      .map((week) => ({
        name: `${formatDate(week.week_start)}-${formatDate(week.week_end)}`,
        用户: week.new_users,
        帖子: week.new_posts,
        点赞: week.new_likes,
        评论: week.new_comments,
      }))
      .reverse();
  };

  // 用户活跃度饼图数据
  const getUserActivityData = () => {
    if (!dashboardData) return [];
    const { user_activity_rate } = dashboardData.averages;
    
    return [
      { name: '活跃用户', value: user_activity_rate },
      { name: '非活跃用户', value: 100 - user_activity_rate },
    ];
  };

  // 公开/私密帖子比例饼图数据
  const getPostPrivacyData = () => {
    if (!postStats) return [];
    return [
      { name: '公开帖子', value: postStats.public_vs_private.public },
      { name: '私密帖子', value: postStats.public_vs_private.private },
    ];
  };

  return (
    <div className='container mx-auto p-4'>
      {/* {isDashboardLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className='pb-2'>
                <Skeleton className='h-4 w-1/2' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-10 w-20' />
                <Skeleton className='h-4 w-full mt-2' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>总用户数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dashboardData?.summary.total_users}
              </div>
              <p className='text-xs text-muted-foreground'>
                最近30天新增: {dashboardData?.summary.new_users_30d}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>总帖子数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dashboardData?.summary.total_posts}
              </div>
              <p className='text-xs text-muted-foreground'>
                最近30天新增: {dashboardData?.summary.new_posts_30d}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>总点赞数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dashboardData?.summary.total_likes}
              </div>
              <p className='text-xs text-muted-foreground'>
                最近30天新增: {dashboardData?.summary.new_likes_30d}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>总评论数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dashboardData?.summary.total_comments}
              </div>
              <p className='text-xs text-muted-foreground'>
                最近30天新增: {dashboardData?.summary.new_comments_30d}
              </p>
            </CardContent>
          </Card>
        </div>
      )} */}
              <Tabs defaultValue='users' className='mb-8'>
          <TabsList className='mb-4 mt-4'>
            <TabsTrigger value='users'>用户数据</TabsTrigger>
            <TabsTrigger value='posts'>帖子数据</TabsTrigger>
            <TabsTrigger value='interactions'>互动数据</TabsTrigger>
          </TabsList>
          <TabsContent value='users'>
            <div className=''>
              <Card>
                <CardHeader>
                  <CardTitle>用户注册趋势</CardTitle>
                  <CardDescription>用户注册随时间变化</CardDescription>
                </CardHeader>
                <CardContent className='h-[300px]'>
                  {isUserStatsLoading ? (
                    <Skeleton className='h-full w-full' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart
                        data={userStats?.users_by_date.map((item) => ({
                          date: formatDate(item.date),
                          用户数: item.count,
                        }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id='colorUsers'
                            x1='0'
                            y1='0'
                            x2='0'
                            y2='1'
                          >
                            <stop
                              offset='5%'
                              stopColor='#0088FE'
                              stopOpacity={0.8}
                            />
                            <stop
                              offset='95%'
                              stopColor='#0088FE'
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey='date' />
                        <YAxis />
                        <CartesianGrid strokeDasharray='3 3' />
                        <Tooltip />
                        <Area
                          type='monotone'
                          dataKey='用户数'
                          stroke='#0088FE'
                          fillOpacity={1}
                          fill='url(#colorUsers)'
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle>MBTI人格类型分布</CardTitle>
                  <CardDescription>用户性格类型统计</CardDescription>
                </CardHeader>
                <CardContent className='h-[300px]'>
                  {isUserStatsLoading ? (
                    <Skeleton className='h-full w-full' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={userStats?.personality_distribution}
                          cx='50%'
                          cy='50%'
                          labelLine={true}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill='#8884d8'
                          nameKey='category'
                          dataKey='count'
                        >
                          {userStats?.personality_distribution.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card> */}
            </div>
          </TabsContent>

          <TabsContent value='posts'>
            <div className='grid grid-cols-1  gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>帖子发布趋势</CardTitle>
                  <CardDescription>帖子数量随时间变化</CardDescription>
                </CardHeader>
                <CardContent className='h-[300px]'>
                  {isPostStatsLoading ? (
                    <Skeleton className='h-full w-full' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart
                        data={postStats?.posts_by_date.map((item) => ({
                          date: formatDate(item.date),
                          帖子数: item.count,
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='date' />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type='monotone'
                          dataKey='帖子数'
                          stroke='#00C49F'
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle>公开/私密帖子比例</CardTitle>
                  <CardDescription>帖子隐私设置分布</CardDescription>
                </CardHeader>
                <CardContent className='h-[300px]'>
                  {isPostStatsLoading ? (
                    <Skeleton className='h-full w-full' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={getPostPrivacyData()}
                          cx='50%'
                          cy='50%'
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill='#8884d8'
                          dataKey='value'
                        >
                          <Cell fill='#0088FE' />
                          <Cell fill='#FFBB28' />
                        </Pie>
                        <Tooltip formatter={(value) => `${value}篇`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card> */}
            </div>
          </TabsContent>

          <TabsContent value='interactions'>
            <div className='grid grid-cols-1 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>互动趋势</CardTitle>
                  <CardDescription>点赞和评论数量随时间变化</CardDescription>
                </CardHeader>
                <CardContent className='h-[300px]'>
                  {isInteractionStatsLoading ? (
                    <Skeleton className='h-full w-full' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart
                        data={interactionStats?.likes_by_month.map(
                          (item, index) => ({
                            month: new Date(item.month).toLocaleDateString(
                              'zh-CN',
                              {
                                year: 'numeric',
                                month: 'short',
                              }
                            ),
                            点赞数: item.count,
                            评论数:
                              interactionStats?.comments_by_month[index]?.count ||
                              0,
                          })
                        )}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='month' />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type='monotone'
                          dataKey='点赞数'
                          stroke='#FF8042'
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type='monotone'
                          dataKey='评论数'
                          stroke='#8884D8'
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
 <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* <Card>
          <CardHeader>
            <CardTitle>最活跃用户</CardTitle>
            <CardDescription>发帖最多的用户</CardDescription>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <div className='space-y-2'>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className='h-6 w-full' />
                ))}
              </div>
            ) : (
              <div className='space-y-2'>
                {dashboardData?.top_users.most_active.map((user, index) => (
                  <div
                    key={user.id}
                    className='flex justify-between items-center'
                  >
                    <div className='flex items-center gap-2'>
                      <span className='font-bold'>{index + 1}.</span>
                      <span>{user.name}</span>
                    </div>
                    <span className='font-medium'>{user.posts_count} 帖子</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card> */}


<Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart2 className='h-5 w-5 text-blue-500' />
              平均指标
            </CardTitle>
            <CardDescription>平台关键指标</CardDescription>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <div className='space-y-2'>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className='h-4 w-full' />
                ))}
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='flex justify-between items-center p-3 border rounded-lg hover:bg-muted/10 transition-colors'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500'>
                      <Users className='h-4 w-4' />
                    </div>
                    <span>每用户发帖数:</span>
                  </div>
                  <span className='text-lg font-bold text-blue-600'>
                    {dashboardData?.averages.avg_posts_per_user.toFixed(2)}
                  </span>
                </div>
                
                <div className='flex justify-between items-center p-3 border rounded-lg hover:bg-muted/10 transition-colors'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500'>
                      <Heart className='h-4 w-4' />
                    </div>
                    <span>每帖子获赞数:</span>
                  </div>
                  <span className='text-lg font-bold text-red-600'>
                    {dashboardData?.averages.avg_likes_per_post.toFixed(2)}
                  </span>
                </div>
                
                <div className='flex justify-between items-center p-3 border rounded-lg hover:bg-muted/10 transition-colors'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-500'>
                      <MessageSquare className='h-4 w-4' />
                    </div>
                    <span>每帖子评论数:</span>
                  </div>
                  <span className='text-lg font-bold text-green-600'>
                    {dashboardData?.averages.avg_comments_per_post.toFixed(2)}
                  </span>
                </div>
                
                <div className='flex justify-between items-center p-3 border rounded-lg hover:bg-muted/10 transition-colors'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-500'>
                      <Users className='h-4 w-4' />
                    </div>
                    <span>用户活跃率:</span>
                  </div>
                  <span className='text-lg font-bold text-purple-600'>
                    {dashboardData?.averages.user_activity_rate.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Heart className='h-5 w-5 text-red-500' />
              最受欢迎用户
            </CardTitle>
            <CardDescription>获得最多点赞的用户</CardDescription>
          </CardHeader>
          <CardContent>
            {userLoading ? (
              <div className='space-y-2'>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className='h-6 w-full' />
                ))}
              </div>
            ) : (
              <div className='space-y-4 max-h-[400px] overflow-y-auto pr-2'>
                {userData?.most_popular_users && userData.most_popular_users.length > 0 ? (
                  userData.most_popular_users.slice(0, 20).map((user, index) => (
                    <div
                      key={user.id}
                      className='flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          index < 3 ? 'bg-red-500 text-white' : 'bg-red-100 text-red-500'
                        } font-bold`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className='font-medium'>{user.name}</p>
                          <p className='text-sm text-muted-foreground'>
                            获赞 {user.likes_received} 
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-center text-muted-foreground py-4'>
                    暂无用户数据
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        <Card>
          <CardHeader>
            <CardTitle>用户活跃度分布</CardTitle>
            <CardDescription>过去30天用户活跃情况</CardDescription>
          </CardHeader>
          <CardContent className='h-[200px]'>
            {isDashboardLoading ? (
              <Skeleton className='h-full w-full' />
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={getUserActivityData()}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {getUserActivityData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div> */}


     
    </div>
  );
};

export default AdminDashboard;
