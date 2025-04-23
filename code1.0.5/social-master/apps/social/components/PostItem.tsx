'use client';

import { UserAvatar } from '@/container/profile-contanier/UserAvatar';
import {
  Post,
  useDeletePost,
  useLikePost,
  useReportPost,
} from '@/http/usePost';
import { cn } from '@/lib/utils';
import { AlertDialogCancel } from '@radix-ui/react-alert-dialog';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Flag, Heart, MessageSquare, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import Render from './Rich/Render';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { useProfile } from '@/http/useAuth';

export const PostItem = ({
  post,
  canDelete = false,
}: {
  post: Post;
  canDelete?: boolean;
}) => {
  const { mutate: likePost } = useLikePost(post.id);
  const { mutate: reportPost, isPending: isReporting } = useReportPost(post.id);
  const router = useRouter();
  const { mutate: deletePost } = useDeletePost(post.id);
  const [reportReason, setReportReason] = useState('');
  const { data: currentUser } = useProfile();

  // 检查是否为用户自己的帖子
  const isOwnPost = currentUser?.id === post.created_by.id;

  const handleReport = () => {
    if (!reportReason.trim()) {
      toast.error('请填写举报原因');
      return;
    }

    reportPost(
      { reason: reportReason },
      {
        onSuccess: (data) => {
          toast.success(data.message || '举报成功');
          setReportReason(''); // 重置表单
        },
        onError: (error) => {
          toast.error('举报失败，请稍后重试');
        },
      }
    );
  };

  return (
    <>
      <div
        onClick={() => {
          router.push(`/post/${post.id}`);
        }}
        className='p-4 m-5 hover:bg-accent/30 cursor-pointer transition-all duration-200'
      >
        <div className='flex gap-4'>
          <div className='w-13 h-13 rounded-full bg-muted shadow-sm overflow-hidden group'>
            {post.created_by.get_avatar && (
              <UserAvatar
                src={post.created_by.get_avatar}
                alt={post.created_by.name}
                className='w-full h-full object-cover transition-transform group-hover:scale-110'
              />
            )}
          </div>
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <span className='font-bold hover:underline cursor-pointer hover:text-primary transition-colors'>
                {post.created_by.name}
              </span>
              <span className='text-muted-foreground hover:underline cursor-pointer text-sm'>
                @{post.created_by.email}
              </span>
              <span className='text-muted-foreground'>·</span>
            </div>
            <span className='text-muted-foreground hover:underline cursor-pointer ml-auto text-xs pb-10'>
              {format(new Date(post.created_at), 'PP', {
                locale: zhCN,
              })}
            </span>
            <div className='text-[15px] leading-relaxed'>
              <Render data={post.body} />
            </div>
            {post.attachments && post.attachments.length > 0 && (
              <div
                className={cn(
                  'mt-3 gap-3 grid',
                  post.attachments.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                  post.attachments.length <= 3 ? 'grid-cols-3' :
                  post.attachments.length === 4 ? 'grid-cols-2' :
                  post.attachments.length <= 6 ? 'grid-cols-3 grid-rows-2' :
                  'grid-cols-3 grid-rows-3'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <PhotoProvider>
                  {post.attachments.map((attachment) => {
                    return (
                      <div
                        key={attachment.id}
                        className='relative overflow-hidden bg-black/5 border border-border/40 flex items-center justify-center hover:border-primary/30 transition-colors aspect-square rounded-xl'
                      >
                        <PhotoView src={attachment.get_image}>
                          <div className="w-full h-full overflow-hidden">
                            <Image
                              width={200}
                              height={200}
                              src={attachment.get_image}
                              alt='图片'
                              className='hover:scale-105 transition-transform object-cover w-full h-full'
                            />
                          </div>
                        </PhotoView>
                      </div>
                    );
                  })}
                </PhotoProvider>
              </div>
            )}
            <div className='flex items-center pt-2'>
              <section className='ml-auto flex gap-3'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='flex items-center gap-1 hover:text-blue-500 hover:bg-blue-500/10 transition-all duration-200 rounded-full hover:scale-105 active:scale-95'
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/post/${post.id}`);
                  }}
                >
                  <MessageSquare className='h-4 w-4' />
                  <span>{post.comments_count || ''}</span>
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className={cn(
                    'flex items-center gap-1 hover:text-pink-500 hover:bg-pink-500/10 transition-all duration-200 rounded-full hover:scale-105 active:scale-95',
                    post.is_liked && 'text-pink-500'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    likePost();
                  }}
                >
                  <Heart
                    className={cn('h-4 w-4', post.is_liked && 'fill-current')}
                  />
                  <span className={cn(post.is_liked && 'text-pink-500')}>
                    {post.likes_count || ''}
                  </span>
                </Button>
                {!isOwnPost && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className='flex items-center gap-1 hover:text-orange-500 hover:bg-orange-500/10 transition-all duration-200 rounded-full hover:scale-105 active:scale-95'
                      >
                        <Flag className='h-4 w-4' />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>举报内容</AlertDialogTitle>
                        <AlertDialogDescription>
                          请详细描述您举报的原因，管理员会尽快处理您的举报。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className='mt-2'>
                        <Textarea
                          placeholder='请输入举报原因...'
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className='min-h-[100px] resize-none'
                        />
                      </div>
                      <AlertDialogFooter className='mt-4'>
                        <AlertDialogCancel asChild>
                          <Button
                            variant='outline'
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportReason('');
                            }}
                          >
                            取消
                          </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReport();
                            }}
                            disabled={isReporting || !reportReason.trim()}
                            className='bg-orange-500 hover:bg-orange-700 transition-all duration-200'
                          >
                            {isReporting ? '提交中...' : '提交举报'}
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className='flex items-center gap-1 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 rounded-full hover:scale-105 active:scale-95'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除这条帖子吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                          <Button
                            variant='outline'
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            取消
                          </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePost();
                          }}
                          className='bg-red-500 hover:bg-red-700 transition-all duration-200'
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
      <Separator className='h-[1px] bg-border/40' />
    </>
  );
};
