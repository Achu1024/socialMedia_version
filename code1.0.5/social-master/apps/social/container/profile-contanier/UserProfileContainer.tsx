'use client';

import { PostItem } from '@/components/PostItem';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/http/useAuth';
import { useCreateOrGetConversation } from '@/http/useChat';
import {
  useSendFriendRequest,
  useUserLikes,
  useUserProfile,
  useRemoveFriend
} from '@/http/useProfile';
import { personalityLabels } from '@/lib/utils';
import { Loader2, Mail, UserCheck, UserPlus, UserMinus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { UserAvatar } from './UserAvatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// // 帖子项组件
// const PostItem = ({ post }: { post: Post }) => {
//   return (
//     <Link href={`/post/${post.id}`}>
//       <div className='p-4 hover:bg-muted/30 transition-colors border-b border-border/40'>
//         <div className='flex gap-3'>
//           <UserAvatar
//             src={post.created_by.get_avatar}
//             alt={post.created_by.name}
//             size='md'
//           />
//           <div className='flex-1'>
//             <div className='flex items-center gap-2'>
//               <span className='font-bold'>{post.created_by.name}</span>
//               <span className='text-muted-foreground'>·</span>
//               <span className='text-muted-foreground'>
//                 {post.created_at_formatted}
//               </span>
//             </div>
//             <p className='mt-2 text-[15px] whitespace-pre-wrap'>{post.body}</p>
//             {post.attachments && post.attachments.length > 0 && (
//               <div className='mt-3 grid grid-cols-2 gap-2'>
//                 {post.attachments.map((attachment) => (
//                   <Image
//                     key={attachment.id}
//                     src={attachment.file}
//                     alt='图片 '
//                     className='w-full h-full object-cover rounded-xl'
//                   />
//                 ))}
//               </div>
//             )}
//             <div className='flex items-center gap-6 mt-3'>
//               <div className='text-muted-foreground text-sm flex items-center gap-1'>
//                 <svg
//                   xmlns='http://www.w3.org/2000/svg'
//                   width='20'
//                   height='20'
//                   viewBox='0 0 24 24'
//                   fill='none'
//                   stroke='currentColor'
//                   strokeWidth='2'
//                   strokeLinecap='round'
//                   strokeLinejoin='round'
//                 >
//                   <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
//                 </svg>
//                 <span>{post.comments_count}</span>
//               </div>
//               <div className='text-muted-foreground text-sm flex items-center gap-1'>
//                 <svg
//                   xmlns='http://www.w3.org/2000/svg'
//                   width='20'
//                   height='20'
//                   viewBox='0 0 24 24'
//                   fill='none'
//                   stroke='currentColor'
//                   strokeWidth='2'
//                   strokeLinecap='round'
//                   strokeLinejoin='round'
//                   className='lucide lucide-heart'
//                 >
//                   <path d='M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'></path>
//                 </svg>
//                 <span>{post.likes_count}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// };

export const UserProfileContainer = () => {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { data: currentUser } = useProfile();
  const [activeTab, setActiveTab] = useState('posts');
  const { data, isLoading } = useUserProfile(userId);
  const sendFriendRequest = useSendFriendRequest(userId);
  const removeFriend = useRemoveFriend(userId);
  const userLikes = useUserLikes(userId);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [friendRequestMessage, setFriendRequestMessage] = useState('');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  // 创建或获取聊天会话
  const { mutate: createOrGetConversation, isPending: isCreatingChat } =
    useCreateOrGetConversation();

  // 处理发送消息按钮点击
  const handleSendMessage = () => {
    if (!userId) return;

    createOrGetConversation(userId, {
      onSuccess: () => {
        // 成功创建或获取会话后，跳转到好友页面并传递会话ID作为active参数
        router.push(`/friends?active=${userId}`);
        toast.success(`开始与 ${user.name} 的会话`);
      },
      onError: () => {
        toast.error('创建会话失败，请稍后再试');
      },
    });
  };

  // 处理删除好友操作
  const handleRemoveFriend = () => {
    removeFriend.mutate();
    setConfirmDialogOpen(false);
  };

  // 处理发送好友请求
  const handleSendFriendRequest = () => {
    sendFriendRequest.mutate(friendRequestMessage);
    setMessageDialogOpen(false);
    setFriendRequestMessage('');
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { user, posts, can_send_friendship_request, is_friend } = data;

  // 如果是查看自己的资料，重定向到个人资料页
  if (currentUser && currentUser.id.toString() === userId) {
    router.push('/profile');
    return null;
  }
  return (
    <div className='min-h-screen'>
      {/* 封面图 */}
      <div
        className='h-48 relative'
        style={{
          backgroundImage: `url('blackground.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className='absolute -bottom-16 left-4 sm:left-8'>
          <UserAvatar src={user.get_avatar} alt={user.name} size='lg' />
        </div>
      </div>

      {/* 个人信息 */}
      <div className='px-4 sm:px-8 mt-20'>
        <div className='flex justify-between items-start mb-4'>
          <div>
            <h1 className='text-2xl font-bold'>{user.name}</h1>
            <p className='text-muted-foreground'>{user.email}</p>
          </div>
          <div className='flex gap-2'>
            {can_send_friendship_request ? (
              <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size='sm'
                    className='rounded-full'
                    disabled={sendFriendRequest.isPending}
                  >
                    {sendFriendRequest.isPending ? (
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    ) : (
                      <UserPlus className='h-4 w-4 mr-2' />
                    )}
                    添加好友
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle>发送好友请求</DialogTitle>
                    <DialogDescription>
                      给{user.name}发送一条好友请求，可以附带一条不超过15个字的消息。
                    </DialogDescription>
                  </DialogHeader>
                  <div className='mt-4'>
                    <Input 
                      maxLength={15}
                      placeholder='添加好友留言（不超过15字）'
                      value={friendRequestMessage}
                      onChange={(e) => setFriendRequestMessage(e.target.value)}
                    />
                    <div className='text-right text-xs text-muted-foreground mt-1'>
                      {friendRequestMessage.length}/15
                    </div>
                  </div>
                  <DialogFooter className='mt-4'>
                    <Button 
                      variant='outline' 
                      onClick={() => setMessageDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button 
                      onClick={handleSendFriendRequest}
                      disabled={sendFriendRequest.isPending}
                    >
                      发送请求
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : is_friend ? (
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  className='rounded-full'
                  onClick={handleSendMessage}
                  disabled={isCreatingChat}
                >
                  <Mail className='h-4 w-4 mr-2' />
                  发送消息
                </Button>
                
                <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size='sm'
                      variant='destructive'
                      className='rounded-full'
                      disabled={removeFriend.isPending}
                    >
                      {removeFriend.isPending ? (
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      ) : (
                        <UserMinus className='h-4 w-4 mr-2' />
                      )}
                      删除好友
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>确认删除好友</DialogTitle>
                      <DialogDescription>
                        确定要删除 {user.name} 吗？此操作将同时删除与该好友的所有聊天记录，且无法恢复。
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setConfirmDialogOpen(false)}
                      >
                        取消
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleRemoveFriend}
                        disabled={removeFriend.isPending}
                      >
                        {removeFriend.isPending ? "处理中..." : "确认删除"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Button
                size='sm'
                variant='secondary'
                className='rounded-full'
                disabled
              >
                <UserCheck className='h-4 w-4 mr-2' />
                请求已发送
              </Button>
            )}
          </div>
        </div>

        {/* 个人简介 */}
        <p className='text-foreground/90 mb-4'>
          {user.bio || '这位用户很懒，还没有填写个人简介'}
        </p>

        {/* 统计信息 */}
        <div className='flex gap-4 text-sm text-muted-foreground mb-6'>
          <div>
            <span className='font-bold text-foreground'>
              {user.posts_count}
            </span>{' '}
            帖子
          </div>
          <div>
            <span className='font-bold text-foreground'>
              {user.friends_count}
            </span>{' '}
            好友
          </div>
        </div>
      </div>
      {/* MBTI 测试结果 */}
      <Accordion
        type='single'
        collapsible
        className='w-full mx-6 mb-6 border rounded-lg shadow-sm'
      >
        <AccordionItem value='mbti-result' className='border-none'>
          <AccordionTrigger className='py-4 px-4 hover:bg-muted/30 rounded-t-lg'>
            <div className='flex items-center'>
              <div className='flex items-center'>
                <div className='h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3'>
                  <span className='font-bold text-sm'>
                    {user.mbti_result?.personality_type.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className='font-semibold'>
                    {user.mbti_result?.personality_type}
                    <span className='ml-2 text-sm font-normal text-muted-foreground'>
                      {personalityLabels[
                        user.mbti_result?.personality_type || ''
                      ] || '未知类型'}
                    </span>
                  </div>
                  <div className='text-xs text-muted-foreground mt-0.5'>
                    {user.mbti_result?.created_at
                      ? new Date(
                          user.mbti_result.created_at
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
                        {user.mbti_result?.introversion_score}
                      </span>
                    </span>
                    <span className='text-xs'>
                      外向 (E):{' '}
                      <span className='font-semibold'>
                        {user.mbti_result?.extroversion_score}
                      </span>
                    </span>
                  </div>
                  <Progress
                    className='h-2'
                    value={
                      ((user.mbti_result?.introversion_score || 0) /
                        ((user.mbti_result?.introversion_score || 0) +
                          (user.mbti_result?.extroversion_score || 0))) *
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
                        {user.mbti_result?.intuition_score}
                      </span>
                    </span>
                    <span className='text-xs'>
                      感觉 (S):{' '}
                      <span className='font-semibold'>
                        {user.mbti_result?.sensing_score}
                      </span>
                    </span>
                  </div>
                  <Progress
                    className='h-2'
                    value={
                      ((user.mbti_result?.intuition_score || 0) /
                        ((user.mbti_result?.intuition_score || 0) +
                          (user.mbti_result?.sensing_score || 0))) *
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
                        {user.mbti_result?.feeling_score}
                      </span>
                    </span>
                    <span className='text-xs'>
                      思考 (T):{' '}
                      <span className='font-semibold'>
                        {user.mbti_result?.thinking_score}
                      </span>
                    </span>
                  </div>
                  <Progress
                    className='h-2'
                    value={
                      ((user.mbti_result?.feeling_score || 0) /
                        ((user.mbti_result?.feeling_score || 0) +
                          (user.mbti_result?.thinking_score || 0))) *
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
                        {user.mbti_result?.judging_score}
                      </span>
                    </span>
                    <span className='text-xs'>
                      感知 (P):{' '}
                      <span className='font-semibold'>
                        {user.mbti_result?.perceiving_score}
                      </span>
                    </span>
                  </div>
                  <Progress
                    className='h-2'
                    value={
                      ((user.mbti_result?.judging_score || 0) /
                        ((user.mbti_result?.judging_score || 0) +
                          (user.mbti_result?.perceiving_score || 0))) *
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
      {/* 标签页 */}
      <div className='px-4 sm:px-8'>
        <Tabs
          defaultValue='posts'
          value={activeTab}
          onValueChange={setActiveTab}
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
            {posts.length === 0 ? (
              <div className='py-10 text-center text-muted-foreground'>
                还没有发布任何帖子
              </div>
            ) : (
              <div className='divide-y divide-border/40'>
                {posts.map((post) => (
                  <PostItem key={post.id} post={post} />
                ))}
              </div>
            )}
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
