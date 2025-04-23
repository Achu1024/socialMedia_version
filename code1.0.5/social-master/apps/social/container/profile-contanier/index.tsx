'use client';
import { PostItem } from '@/components/PostItem';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/http/useAuth';
import { useUserLikes, useUserProfile } from '@/http/useProfile';
import { personalityLabels } from '@/lib/utils';
import { Loader2, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { UserAvatar } from './UserAvatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { put } from '@/lib/http';

export { ProfileEditForm } from './ProfileEditForm';

export const ProfileContainer = () => {
  const params = useParams();
  const userId = typeof params?.id === 'string' ? params.id : undefined;
  const { data: profile, isLoading } = useProfile();
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const userPosts = useUserProfile(userId || profile?.id);
  const userLikes = useUserLikes(userId || profile?.id);
  const queryClient = useQueryClient();

  // 切换帖子可见性的mutation
  const togglePostVisibility = useMutation({
    mutationFn: async ({ postId, isPrivate }: { postId: string; isPrivate: boolean }) => {
      const response = await put(`/posts/${postId}/update/`, {
        is_private: isPrivate
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  // 处理可见性切换
  const handleToggleVisibility = (postId: string, currentState: boolean) => {
    togglePostVisibility.mutate(
      { postId, isPrivate: !currentState },
      {
        onSuccess: () => {
          toast.success(`帖子已设为${!currentState ? '私密' : '公开'}`);
        },
        onError: () => {
          toast.error('更新失败，请稍后重试');
        }
      }
    );
  };

  if (isLoading) return <>加载中...</>;
  if (!profile) {
    // router.push('/not-found');
    return <></>;
  }

  return (
    <div className='min-h-screen'>
      {/* 封面图 */}
      <div className='h-68 relative'>
        <div
          className='absolute top-0 left-0 w-full h-full'
          style={{
            backgroundImage: `url('/blackground.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom',
          }}
        />

        <div className='absolute -bottom-16 left-4 sm:left-8'>
          <UserAvatar src={profile.avatar} alt={profile.name} size='lg' />
        </div>
      </div>
      {/* 个人信息 */}
      <div className='px-4 sm:px-8 mt-20'>
        <div className='flex justify-between items-start mb-4'>
          <div>
            <h1 className='text-2xl font-bold'>{profile.name}</h1>
            <p className='text-muted-foreground'>{profile.email}</p>
            {profile.mbti_result && (
              <div className='mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary'>
                <span className='font-semibold'>
                  {profile.mbti_result.personality_type}
                </span>
                <span className='ml-1'>
                  -{' '}
                  {personalityLabels[profile.mbti_result.personality_type] ||
                    '未知类型'}
                </span>
              </div>
            )}
          </div>
          <Button variant='outline' className='rounded-full'>
            <Link href='/profile/edit'>编辑个人资料</Link>
          </Button>
        </div>
        {/* 个人简介 */}
        <p className='text-foreground/90 mb-6'>
          {profile.bio || '这位用户很懒，还没有填写个人简介'}
        </p>

        {/* MBTI测试结果 */}
        {profile.mbti_result ? (
          <Accordion
            type='single'
            collapsible
            className='w-full mb-6 border rounded-lg shadow-sm'
          >
            <AccordionItem value='mbti-result' className='border-none'>
              <AccordionTrigger className='py-4 px-4 hover:bg-muted/30 rounded-t-lg'>
                <div className='flex items-center'>
                  <div className='flex items-center'>
                    <div className='h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3'>
                      <span className='font-bold text-sm'>
                        {profile.mbti_result.personality_type.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className='font-semibold'>
                        {profile.mbti_result.personality_type}
                        <span className='ml-2 text-sm font-normal text-muted-foreground'>
                          {personalityLabels[
                            profile.mbti_result.personality_type
                          ] || '未知类型'}
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground mt-0.5'>
                        {profile.mbti_result.created_at
                          ? new Date(
                              profile.mbti_result.created_at
                            ).toLocaleDateString()
                          : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className='bg-card/50 px-6 pt-2 pb-4 rounded-b-lg'>
                <div className='space-y-6 pt-2'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-4 border p-4 rounded-lg bg-background shadow-sm'>
                      <h3 className='text-sm font-medium text-center'>
                        内向 vs 外向
                      </h3>
                      <div className='flex justify-between items-center'>
                        <span className='text-xs'>
                          内向 (I):{' '}
                          <span className='font-semibold'>
                            {profile.mbti_result.introversion_score}
                          </span>
                        </span>
                        <span className='text-xs'>
                          外向 (E):{' '}
                          <span className='font-semibold'>
                            {profile.mbti_result.extroversion_score}
                          </span>
                        </span>
                      </div>
                      <Progress
                        className='h-2'
                        value={
                          (profile.mbti_result.introversion_score /
                            (profile.mbti_result.introversion_score +
                              profile.mbti_result.extroversion_score)) *
                          100
                        }
                      />
                    </div>

                    <div className='space-y-4 border p-4 rounded-lg bg-background shadow-sm'>
                      <h3 className='text-sm font-medium text-center'>
                        直觉 vs 感觉
                      </h3>
                      <div className='flex justify-between items-center'>
                        <span className='text-xs'>
                          直觉 (N):{' '}
                          <span className='font-semibold'>
                            {profile.mbti_result.intuition_score}
                          </span>
                        </span>
                        <span className='text-xs'>
                          感觉 (S):{' '}
                          <span className='font-semibold'>
                            {profile.mbti_result.sensing_score}
                          </span>
                        </span>
                      </div>
                      <Progress
                        className='h-2'
                        value={
                          (profile.mbti_result.intuition_score /
                            (profile.mbti_result.intuition_score +
                              profile.mbti_result.sensing_score)) *
                          100
                        }
                      />
                    </div>

                    <div className='space-y-4 border p-4 rounded-lg bg-background shadow-sm'>
                      <h3 className='text-sm font-medium text-center'>
                        感性 vs 思考
                      </h3>
                      <div className='flex justify-between items-center'>
                        <span className='text-xs'>
                          感性 (F):{' '}
                          <span className='font-semibold'>
                            {profile.mbti_result.feeling_score}
                          </span>
                        </span>
                        <span className='text-xs'>
                          思考 (T):{' '}
                          <span className='font-semibold'>
                            {profile.mbti_result.thinking_score}
                          </span>
                        </span>
                      </div>
                      <Progress
                        className='h-2'
                        value={
                          (profile.mbti_result.feeling_score /
                            (profile.mbti_result.feeling_score +
                              profile.mbti_result.thinking_score)) *
                          100
                        }
                      />
                    </div>

                    <div className='space-y-4 border p-4 rounded-lg bg-background shadow-sm'>
                      <h3 className='text-sm font-medium text-center'>
                        判断 vs 感知
                      </h3>
                      <div className='flex justify-between items-center'>
                        <span className='text-xs'>
                          判断 (J):{' '}
                          <span className='font-semibold'>
                            {profile.mbti_result.judging_score}
                          </span>
                        </span>
                        <span className='text-xs'>
                          感知 (P):{' '}
                          <span className='font-semibold'>
                            {profile.mbti_result.perceiving_score}
                          </span>
                        </span>
                      </div>
                      <Progress
                        className='h-2'
                        value={
                          (profile.mbti_result.judging_score /
                            (profile.mbti_result.judging_score +
                              profile.mbti_result.perceiving_score)) *
                          100
                        }
                      />
                    </div>
                  </div>

                  <div className='text-xs text-muted-foreground mt-4'>
                    <p>
                      * MBTI人格测试结果仅供参考，人格特质可能随时间和环境而变化
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <Card className='w-full mb-6 p-4'>
            <CardHeader>
              <CardTitle>MBTI人格测试</CardTitle>
              <CardDescription>了解自己的性格特点</CardDescription>
            </CardHeader>
            <CardContent className='text-center py-6'>
              <p className='mb-4'>你还没有完成MBTI人格测试</p>
              <Button asChild>
                <Link href='/mbti'>开始测试</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      {/* 帖子和我的点赞 */}
      <div className='mt-8 px-4 sm:px-8'>
        <Tabs
          defaultValue='posts'
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'posts' | 'likes')}
        >
          <TabsList className='w-full justify-start border-b rounded-none h-auto p-0'>
            <TabsTrigger
              value='posts'
              className='rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-4'
            >
              帖子
            </TabsTrigger>
            <TabsTrigger
              value='likes'
              className='rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-4'
            >
              点赞
            </TabsTrigger>
          </TabsList>

          <TabsContent value='posts' className='mt-0'>
            <div className='divide-y divide-border/40'>
              {userPosts.isLoading ? (
                <div className='flex justify-center py-8'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
              ) : userPosts.data &&
                userPosts.data.posts &&
                userPosts.data.posts.length > 0 ? (
                userPosts.data.posts.map((post) => (
                  <div key={post.id} className="relative">
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                      <Badge variant={post.is_private ? "secondary" : "outline"} className="flex items-center gap-1">
                        {post.is_private ? 
                          <><EyeOff className="h-3 w-3" /> 私密</> : 
                          <><Eye className="h-3 w-3" /> 公开</>
                        }
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full hover:bg-primary/10"
                              onClick={() => handleToggleVisibility(post.id, post.is_private)}
                              disabled={togglePostVisibility.isPending}
                            >
                              {post.is_private ? 
                                <Unlock className="h-4 w-4" /> : 
                                <Lock className="h-4 w-4" />
                              }
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>设为{post.is_private ? '公开' : '私密'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <PostItem canDelete key={post.id} post={post} />
                  </div>
                ))
              ) : (
                <div className='py-12 text-center text-muted-foreground'>
                  <p>暂无帖子</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value='likes' className='mt-0'>
            <div className='divide-y divide-border/40'>
              {userLikes.isLoading ? (
                <div className='flex justify-center py-8'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
              ) : userLikes.data && userLikes.data.length > 0 ? (
                userLikes.data.map((post) => (
                  <PostItem key={post.id} post={post} />
                ))
              ) : (
                <div className='py-12 text-center text-muted-foreground'>
                  <p>暂无点赞内容</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
