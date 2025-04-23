'use client';

import Render from '@/components/Rich/Render';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { UserAvatar } from '@/container/profile-contanier/UserAvatar';
import { useProfile } from '@/http/useAuth';
import {
  Comment,
  useCreateComment,
  useLikeComment,
  useLikePost,
  usePostDetail,
} from '@/http/usePost';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ArrowLeft, Heart, Loader2, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';

const CommentItem = ({
  comment,
  postId,
}: {
  comment: Comment;
  postId: string;
}) => {
  const { mutate: likeComment, isPending: isLiking } = useLikeComment(
    postId,
    comment.id
  );

  return (
    <div className='py-3 px-3'>
      <div className='flex gap-2'>
        <UserAvatar
          src={comment.created_by.get_avatar}
          alt={comment.created_by.name}
          size='sm'
        />
        <div className='flex-1'>
          <div className='flex items-center gap-1 flex-wrap'>
            <span className='font-bold hover:underline cursor-pointer text-sm'>
              {comment.created_by.name}
            </span>
            <span className='text-muted-foreground text-xs'>·</span>
            <span className='text-muted-foreground text-xs'>
              {comment.created_at_formatted}
            </span>
          </div>
          <p className='mt-1 text-sm leading-normal'>{comment.body}</p>
          <div className='flex items-center gap-2 mt-1'>
            <Button
              variant='ghost'
              size='sm'
              className={cn(
                'flex items-center gap-1 -ml-3 h-7 px-2 hover:text-pink-500 hover:bg-pink-500/10 transition-colors rounded-full group',
                comment.islike && 'text-pink-500'
              )}
              onClick={() => likeComment()}
              disabled={isLiking}
            >
              {comment.islike ? (
                <Heart
                  className={cn(
                    'h-3 w-3 transition-transform group-hover:scale-110 fill-current',
                    isLiking && 'animate-pulse'
                  )}
                />
              ) : (
                <Heart
                  className={cn(
                    'h-3 w-3 transition-transform group-hover:scale-110',
                    isLiking && 'animate-pulse'
                  )}
                />
              )}
              <span
                className={cn(
                  'text-xs group-hover:text-pink-500',
                  comment.islike && 'text-pink-500 font-bold'
                )}
              >
                {comment.likes_count || '点赞'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data, isLoading } = usePostDetail(id as string);
  const { mutate: likePost, isPending: isLiking } = useLikePost(id as string);
  const createComment = useCreateComment(id as string);
  const [newComment, setNewComment] = useState('');

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='h-6 w-6 animate-spin text-primary' />
      </div>
    );
  }

  if (!data?.post) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen gap-3'>
        <h1 className='text-xl font-bold'>帖子不存在</h1>
        <Button onClick={() => router.push('/')}>返回首页</Button>
      </div>
    );
  }

  const { post } = data;

  const handleCreateComment = () => {
    if (!newComment.trim()) return;
    createComment.mutate(
      { body: newComment },
      {
        onSuccess: () => {
          setNewComment('');
        },
      }
    );
  };

  return (
    <div className='max-w-2xl mx-auto'>
      {/* 顶部导航 */}
      <div className='sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 z-10'>
        <div className='flex items-center gap-4 p-2'>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full h-8 w-8'
            onClick={() => router.back()}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <h1 className='text-base font-bold'>帖子</h1>
        </div>
      </div>

      {/* 帖子内容 */}
      <div className='p-3 border-b border-border/40'>
        <div className='flex items-start gap-3'>
          <UserAvatar
            src={post.created_by.get_avatar}
            alt={post.created_by.name}
            size='md'
          />
          <div className='flex-1'>
            <div className='flex flex-col'>
              <span className='font-bold hover:underline cursor-pointer text-sm'>
                {post.created_by.name}
              </span>
              <span className='text-muted-foreground hover:underline cursor-pointer text-xs'>
                @{post.created_by.email}
              </span>
            </div>
            <div className='mt-2 text-base leading-normal whitespace-pre-wrap'>
              <Render data={post.body} />
            </div>
            {post.attachments.length > 0 && (
              <div
                className={cn(
                  'mt-2 gap-2 grid',
                  post.attachments.length === 1 ? 'grid-cols-1' :
                  post.attachments.length <= 3 ? 'grid-cols-3' :
                  post.attachments.length === 4 ? 'grid-cols-2' :
                  post.attachments.length <= 6 ? 'grid-cols-3 grid-rows-2' :
                  'grid-cols-3 grid-rows-3'
                )}
              >
                <PhotoProvider>
                  {post.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className='relative overflow-hidden bg-black/5 border border-border/40 flex items-center justify-center hover:border-primary/30 transition-colors aspect-square rounded-lg'
                    >
                      <PhotoView src={attachment.get_image}>
                        <div className="w-full h-full overflow-hidden">
                          <Image
                            width={180}
                            height={180}
                            src={attachment.get_image}
                            alt='图片'
                            className='hover:scale-105 transition-transform object-cover w-full h-full'
                          />
                        </div>
                      </PhotoView>
                    </div>
                  ))}
                </PhotoProvider>
              </div>
            )}
            <div className='mt-2 text-muted-foreground text-xs'>
              {format(new Date(post.created_at), 'PPpp', {
                locale: zhCN,
              })}
            </div>
            <div className='flex items-center gap-3 mt-2 pt-2 border-t border-border/40 text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <span className='font-bold text-foreground text-xs'>
                  {post.likes_count}
                </span>
                <span className='text-xs'>次点赞</span>
              </div>
            </div>
            <div className='flex items-center justify-around mt-2 pt-2 border-t border-border/40'>
              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-1 h-8 hover:text-blue-500 hover:bg-blue-500/10 transition-colors rounded-full group'
              >
                <MessageSquare className='h-4 w-4 transition-transform group-hover:scale-110' />
                <span className='group-hover:text-blue-500 text-xs'>
                  {post.comments_count}
                </span>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className={cn(
                  'flex items-center gap-1 h-8 hover:text-pink-500 hover:bg-pink-500/10 transition-colors rounded-full group',
                  post.is_liked && 'text-pink-500'
                )}
                onClick={() => likePost()}
                disabled={isLiking}
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    isLiking && 'animate-pulse',
                    post.is_liked && 'fill-current'
                  )}
                />
                <span
                  className={cn(
                    'group-hover:text-pink-500 text-xs',
                    post.is_liked && 'text-pink-500'
                  )}
                >
                  {post.likes_count}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 评论框 */}
      <div className='p-3 border-b border-border/40'>
        <div className='flex gap-2'>
          <UserAvatar
            src={profile?.avatar}
            alt={profile?.name || '用户'}
            size='sm'
          />
          <div className='flex-1'>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder='发表评论...'
              className='w-full p-2 text-sm resize-none focus:outline-none bg-transparent placeholder:text-muted-foreground/70 min-h-[60px]'
              rows={2}
            />
            <div className='flex justify-end mt-2'>
              <Button
                onClick={handleCreateComment}
                disabled={createComment.isPending || !newComment.trim()}
                className={cn(
                  'shadow-sm hover:shadow-md transition-all px-4 py-1 h-7 text-xs rounded-full',
                  !newComment.trim() && 'opacity-50 cursor-not-allowed'
                )}
              >
                {createComment.isPending ? (
                  <Loader2 className='h-3 w-3 animate-spin' />
                ) : (
                  '发布'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div className='divide-y divide-border/40'>
        {post.comments?.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={id as string}
          />
        ))}
      </div>
    </div>
  );
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(PostPage);
