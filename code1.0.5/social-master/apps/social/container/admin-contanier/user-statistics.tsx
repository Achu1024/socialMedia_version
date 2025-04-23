'use client';

// import { Component as MBTIPieChart } from '@/components/echart/Pie';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminUserStatistics, useAdminPostStatistics, useAdminDeleteTrend, useAdminCreateTrend } from '@/http/useAdmin';
import dayjs from 'dayjs';
import { ShieldCheck, TrendingUp, UserCheck, Users, UserX, MessageSquare, Trash, PlusCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import React from 'react';

const UserStatistics = ({ children }: { children?: React.ReactNode }) => {
  const { data: userData, isLoading: userLoading } = useAdminUserStatistics();
  const { data: postData, isLoading: postLoading } = useAdminPostStatistics();

  if (userLoading || postLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader className='h-20 bg-muted/20' />
            <CardContent className='h-24 bg-muted/10' />
          </Card>
        ))}
      </div>
    );
  }

  if (!userData || !postData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>统计数据</CardTitle>
          <CardDescription>获取数据时出错</CardDescription>
        </CardHeader>
        <CardContent>
          <p>无法加载统计数据，请稍后再试。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='总用户数'
          value={userData.total_users}
          icon={<Users className='h-4 w-4' />}
          description='平台上的用户总数'
        />
        <StatCard
          title='正常用户'
          value={userData.active_users}
          icon={<UserCheck className='h-4 w-4' />}
          description='当前可登录用户数'
          colorClass='text-green-600 bg-green-100'
        />
        <StatCard
          title='禁用用户'
          value={userData.inactive_users}
          icon={<UserX className='h-4 w-4' />}
          description='已被禁用的用户数量'
          colorClass='text-red-600 bg-red-100'
        />
        <StatCard
          title='总帖子数'
          value={postData.total_posts}
          icon={<MessageSquare className='h-4 w-4' />}
          description='平台上的帖子总数'
          colorClass='text-blue-600 bg-blue-100'
        />
      </div>
      {children}
      
      {/* 话题管理 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            话题管理
          </CardTitle>
          <CardDescription className='flex items-center justify-between'>
            <span>最近最受欢迎的前50个话题</span>
            <CreateTrendButton />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4 max-h-[600px] overflow-y-auto pr-2'>
            {postData.trends && postData.trends.length > 0 ? (
              postData.trends.map((trend, index) => (
                <div
                  key={trend.hashtag}
                  className='flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      index < 3 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    } font-bold`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className='font-medium'>#{trend.hashtag}</p>
                      <p className='text-sm text-muted-foreground'>
                        热度 {trend.occurences} 
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5 text-primary' />
                    <DeleteTrendButton hashtag={trend.hashtag} />
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center text-muted-foreground py-4'>
                暂无热门话题数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  colorClass?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  description,
  colorClass = 'text-primary bg-primary/10',
}: StatCardProps) => (
  <Card>
    <CardHeader className='flex flex-row items-center justify-between pb-2'>
      <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      <div className={`rounded-full p-1 ${colorClass}`}>{icon}</div>
    </CardHeader>
    <CardContent>
      <div className='text-2xl font-bold'>{value}</div>
      <p className='text-xs text-muted-foreground'>{description}</p>
    </CardContent>
  </Card>
);

interface DeleteTrendButtonProps {
  hashtag: string;
}

const DeleteTrendButton = ({ hashtag }: DeleteTrendButtonProps) => {
  const { mutate: deleteTrend, isPending } = useAdminDeleteTrend(hashtag);
  const [open, setOpen] = React.useState(false);

  const handleDelete = () => {
    deleteTrend(undefined, {
      onSuccess: (data) => {
        toast.success(data.message);
        setOpen(false);
      },
      onError: (error) => {
        toast.error('删除失败：' + (error as any).message);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className='p-1 text-destructive hover:bg-destructive/10 rounded-full transition-colors'
        title='删除话题'
      >
        <Trash className='h-4 w-4' />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除热门话题</DialogTitle>
            <DialogDescription>
              确定要删除话题 #{hashtag} 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface CreateTrendButtonProps {}

const CreateTrendButton = ({}: CreateTrendButtonProps) => {
  const { mutate: createTrend, isPending } = useAdminCreateTrend();
  const [open, setOpen] = React.useState(false);
  const [hashtag, setHashtag] = React.useState('');
  const [occurences, setOccurences] = React.useState(1000);

  const handleCreate = () => {
    if (!hashtag.trim()) {
      toast.error('话题标签不能为空');
      return;
    }

    createTrend(
      { hashtag, occurences },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          setOpen(false);
          setHashtag('');
          setOccurences(1000);
        },
        onError: (error) => {
          toast.error('创建失败：' + (error as any).message);
        },
      }
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className='flex items-center gap-1 text-primary hover:text-primary/80 transition-colors'
        title='添加热门话题'
      >
        <PlusCircle className='h-4 w-4' />
        <span className='text-xs'>添加话题</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加热门话题</DialogTitle>
            <DialogDescription>
              创建新的热门话题，将显示在话题列表最前面
            </DialogDescription>
          </DialogHeader>
          
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>话题标签</label>
              <input
                type='text'
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder='输入话题名称（不需要加#）'
                className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
              />
            </div>
            
            <div className='space-y-2'>
              <label className='text-sm font-medium'>初始热度</label>
              <input
                type='number'
                value={occurences}
                onChange={(e) => setOccurences(Number(e.target.value))}
                min="1"
                className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
              />
              <p className='text-xs text-muted-foreground'>设置初始热度值，数值越大排名越靠前</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={isPending || !hashtag.trim()}>
              {isPending ? '添加中...' : '确认添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserStatistics;
