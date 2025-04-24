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
import { useState, useRef, useEffect } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';

// 自定义图片查看组件，支持更好的预览体验
const EnhancedPhotoView = ({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) => {
  // 处理图片点击事件，防止冒泡
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <PhotoView src={src}>
      <div className="w-full h-full overflow-hidden" onClick={handleImageClick}>
        <Image
          width={width}
          height={height}
          src={src}
          alt={alt}
          className='hover:scale-105 transition-transform object-cover w-full h-full'
        />
      </div>
    </PhotoView>
  );
};

// Post comments component
const CommentItem = ({ comment }: { comment: Comment }) => {
  const { id: postId } = useParams();
  const { mutate: likeComment } = useLikeComment(postId as string, comment.id);
  
  // 添加本地状态管理
  const [localLikeState, setLocalLikeState] = useState({
    isLiked: comment.islike,
    count: comment.likes_count
  });
  
  // 防抖定时器
  const likeDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 同步props和状态
  useEffect(() => {
    setLocalLikeState({
      isLiked: comment.islike,
      count: comment.likes_count
    });
  }, [comment.islike, comment.likes_count]);
  
  // 处理点赞按钮点击
  const handleLikeClick = () => {
    // 防止连续快速点击
    if (likeDebounceTimer.current) {
      clearTimeout(likeDebounceTimer.current);
    }
    
    // 立即更新本地状态，提供即时反馈
    const newIsLiked = !localLikeState.isLiked;
    const newCount = newIsLiked 
      ? localLikeState.count + 1 
      : Math.max(0, localLikeState.count - 1);
      
    setLocalLikeState({
      isLiked: newIsLiked,
      count: newCount
    });
    
    // 添加防抖延迟发送API请求
    likeDebounceTimer.current = setTimeout(() => {
      likeComment();
    }, 300);
  };

  return (
    <div className='py-3 border-t border-border/40 first:border-none'>
      <div className='flex gap-3'>
        <UserAvatar
          src={comment.created_by.get_avatar}
          alt={comment.created_by.name}
          size='sm'
          className='mt-0.5'
        />
        <div className='flex-1'>
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              <span className='font-medium'>{comment.created_by.name}</span>
              <span className='text-muted-foreground text-xs'>·</span>
              <span className='text-muted-foreground text-xs'>
                {comment.created_at_formatted}
              </span>
            </div>
            <span className='text-muted-foreground text-xs'>
              @{comment.created_by.name}
            </span>
          </div>
          <p className='mt-1 text-[15px] leading-normal'>{comment.body}</p>
          <div className='flex items-center mt-2'>
            <Button
              variant='ghost'
              size='sm'
              className={cn(
                'flex items-center gap-1 hover:text-pink-500 hover:bg-pink-500/10 transition-all rounded-full hover:scale-105 active:scale-95',
                localLikeState.isLiked && 'text-red-500'
              )}
              onClick={handleLikeClick}
            >
              <Heart
                className={cn('h-4 w-4', localLikeState.isLiked && 'fill-red-500 text-red-500')}
              />
              <span className={cn(localLikeState.isLiked && 'text-red-500')}>
                {localLikeState.count || ''}
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
  const { mutate: likePost } = useLikePost(id as string);
  const createComment = useCreateComment(id as string);
  const [newComment, setNewComment] = useState('');
  
  // 添加本地点赞状态管理
  const [localPostLikeState, setLocalPostLikeState] = useState({
    isLiked: false,
    count: 0
  });
  
  // 防抖定时器
  const postLikeDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 同步props和状态
  useEffect(() => {
    if (data?.post) {
      setLocalPostLikeState({
        isLiked: data.post.islike,
        count: data.post.likes_count
      });
    }
  }, [data?.post]);
  
  // 处理帖子点赞按钮点击
  const handlePostLikeClick = () => {
    // 防止连续快速点击
    if (postLikeDebounceTimer.current) {
      clearTimeout(postLikeDebounceTimer.current);
    }
    
    // 立即更新本地状态，提供即时反馈
    const newIsLiked = !localPostLikeState.isLiked;
    const newCount = newIsLiked 
      ? localPostLikeState.count + 1 
      : Math.max(0, localPostLikeState.count - 1);
      
    setLocalPostLikeState({
      isLiked: newIsLiked,
      count: newCount
    });
    
    // 添加防抖延迟发送API请求
    postLikeDebounceTimer.current = setTimeout(() => {
      likePost();
    }, 300);
  };

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
    <div className='flex flex-col min-h-screen max-w-3xl mx-auto pb-20'>
      {/* 头部 */}
      <div className='sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 z-10 shadow-sm'>
        <div className='flex items-center p-4'>
          <Button
            variant='ghost'
            size='icon'
            className='mr-2 hover:bg-primary/10 transition-all rounded-full'
            onClick={() => router.back()}
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <h1 className='text-lg font-bold'>帖子详情</h1>
        </div>
      </div>

      {/* 帖子内容 */}
      <div className='p-4 border-b border-border/40'>
        <div className='flex gap-4'>
          <UserAvatar
            src={post.created_by.get_avatar}
            alt={post.created_by.name}
            size='md'
            className='mt-1'
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
                <PhotoProvider
                  maskOpacity={0.8}
                  maskClassName="backdrop-blur-sm"
                  loadingElement={<div className="flex justify-center items-center h-full">加载中...</div>}
                >
                  {post.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className='relative overflow-hidden bg-black/5 border border-border/40 flex items-center justify-center hover:border-primary/30 transition-colors aspect-square rounded-lg'
                    >
                      <EnhancedPhotoView
                        src={attachment.get_image}
                        alt='图片'
                        width={180}
                        height={180}
                      />
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
            <div className='flex items-center gap-3 mt-3'>
              <Button
                variant='ghost'
                size='sm'
                className={cn(
                  'flex items-center gap-1 hover:text-pink-500 hover:bg-pink-500/10 transition-all rounded-full hover:scale-105 active:scale-95',
                  localPostLikeState.isLiked && 'text-red-500'
                )}
                onClick={handlePostLikeClick}
              >
                <Heart
                  className={cn('h-4 w-4', localPostLikeState.isLiked && 'fill-red-500 text-red-500')}
                />
                <span className={cn(localPostLikeState.isLiked && 'text-red-500')}>
                  {localPostLikeState.count || ''}
                </span>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-1 hover:text-blue-500 hover:bg-blue-500/10 transition-all rounded-full hover:scale-105 active:scale-95'
              >
                <MessageSquare className='h-4 w-4' />
                <span>{post.comments_count || ''}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 评论表单 */}
      <div className='p-4 border-b border-border/40'>
        <div className='flex gap-3'>
          <UserAvatar
            src={profile?.avatar}
            alt={profile?.name || '用户'}
            size='sm'
            className='mt-1'
          />
          <div className='flex-1 flex flex-col gap-3'>
            <Textarea
              placeholder='写下你的评论...'
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className='min-h-[100px] resize-none bg-accent/10 hover:bg-accent/20 focus:bg-accent/20 transition-colors'
            />
            <Button
              onClick={handleCreateComment}
              disabled={createComment.isPending || !newComment.trim()}
              className={cn(
                'self-end',
                !newComment.trim() && 'opacity-50 cursor-not-allowed'
              )}
            >
              {createComment.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                '发表评论'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div className='divide-y divide-border/40'>
        {post.comments?.length ? (
          post.comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className='p-8 text-center text-muted-foreground'>
            暂无评论，快来发表第一条吧！
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuth(PostPage);
