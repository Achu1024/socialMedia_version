'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Comment, 
  Post, 
  useAdminDeleteComment, 
  useAdminPostDetail, 
  useAdminUpdatePost 
} from '@/http/useAdmin';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertCircle,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PostEditModalProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PostEditModal = ({ post, open, onOpenChange }: PostEditModalProps) => {
  const [body, setBody] = useState(post.body);
  const [isPrivate, setIsPrivate] = useState(post.is_private);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  // 获取帖子详情，包含评论列表
  const { data: postDetail, isLoading: isLoadingPostDetail, refetch } = 
    useAdminPostDetail(post.id);

  // 每次打开模态框或帖子变更时重置表单状态
  useEffect(() => {
    if (post) {
      setBody(post.body);
      setIsPrivate(post.is_private);
      // 打开模态框时刷新帖子详情
      if (open) {
        refetch();
      }
    }
  }, [post, open, refetch]);

  const updatePost = useAdminUpdatePost(post.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!body.trim()) {
      toast.error('帖子内容不能为空');
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePost.mutateAsync({
        body,
        is_private: isPrivate,
      });

      toast.success('帖子已成功更新');
      onOpenChange(false);
    } catch (error) {
      toast.error('更新帖子失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理删除评论
  const handleDeleteComment = (comment: Comment) => {
    setSelectedComment(comment);
    setDeleteCommentDialogOpen(true);
  };

  // 删除评论的mutation
  const deleteComment = useAdminDeleteComment(
    post.id,
    selectedComment?.id || ''
  );

  // 确认删除评论
  const confirmDeleteComment = async () => {
    if (!selectedComment) return;
    
    try {
      await deleteComment.mutateAsync();
      toast.success('评论已成功删除');
      setDeleteCommentDialogOpen(false);
      // 删除成功后刷新帖子详情
      refetch();
    } catch (error) {
      toast.error('删除评论失败');
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[600px] rounded-xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl'>编辑帖子</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6 mt-4'>
          {/* 用户信息 */}
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10 border border-gray-100'>
              <AvatarImage
                src={post.created_by.get_avatar}
                alt={post.created_by.name}
              />
              <AvatarFallback className='bg-purple-light text-purple font-medium'>
                {post.created_by.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className='font-medium'>{post.created_by.name}</div>
              <div className='text-xs text-gray-500'>
                {post.created_by.email}
              </div>
            </div>
          </div>

          {/* 帖子内容 */}
          <div className='space-y-2'>
            <Label htmlFor='body'>帖子内容</Label>
            <Textarea
              id='body'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder='请输入帖子内容...'
              className='resize-none rounded-lg border-gray-200 focus:border-purple focus:ring-1 focus:ring-purple transition-all'
            />
          </div>

          {/* 帖子状态 */}
          <div className='space-y-2'>
            <Label htmlFor='privacy'>可见性</Label>
            <Select
              value={isPrivate ? 'private' : 'public'}
              onValueChange={(value) => setIsPrivate(value === 'private')}
            >
              <SelectTrigger
                id='privacy'
                className='w-full rounded-lg border-gray-200 focus:border-purple focus:ring-1 focus:ring-purple'
              >
                <SelectValue placeholder='选择可见性' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='public'>公开</SelectItem>
                <SelectItem value='private'>下架</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 附件信息 */}
          {post.attachments && post.attachments.length > 0 && (
            <div className='space-y-2'>
              <Label>附件</Label>
              <div className='text-sm text-gray-500'>
                该帖子包含 {post.attachments.length} 张图片。
                <span className='text-amber-600'>
                  （目前不支持在此编辑附件）
                </span>
              </div>
            </div>
          )}

          {/* 互动信息 */}
          <div className='space-y-2'>
            <Label>互动数据</Label>
            <div className='flex gap-4 text-sm text-gray-500'>
              <span>
                <span className='font-medium text-black'>
                  {post.likes_count}
                </span>{' '}
                点赞
              </span>
              <span>
                <span className='font-medium text-black'>
                  {post.comments_count}
                </span>{' '}
                评论
              </span>
            </div>
          </div>

            {/* 评论列表 */}
            <div className='space-y-2 border-t pt-4'>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="comments">
                  <AccordionTrigger className="flex items-center">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>评论列表（{post.comments_count}）</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isLoadingPostDetail ? (
                      <div className='py-4 text-center text-gray-500'>加载评论中...</div>
                    ) : !postDetail || !postDetail.post.comments || postDetail.post.comments.length === 0 ? (
                      <div className='py-4 text-center text-gray-500'>暂无评论</div>
                    ) : (
                      <div className='space-y-4 mt-2'>
                        {postDetail.post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className='relative flex gap-3 border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors'
                          >
                            <Avatar className='h-8 w-8'>
                              <AvatarImage
                                src={comment.created_by.get_avatar}
                                alt={comment.created_by.name}
                              />
                              <AvatarFallback>
                                {getInitials(comment.created_by.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2'>
                                <span className='font-medium text-sm'>
                                  {comment.created_by.name}
                                </span>
                                <span className='text-xs text-gray-500'>
                                  {comment.created_at_formatted}前
                                </span>
                              </div>
                              <p className='text-sm mt-1'>{comment.body}</p>
                              <div className='text-xs text-gray-500 mt-1'>
                                {comment.likes_count} 个赞
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='absolute top-2 right-2 h-6 w-6 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50'
                              onClick={(e) => {
                                // 阻止事件冒泡和默认行为
                                e.stopPropagation();
                                e.preventDefault();
                                // 设置选中的评论并打开确认对话框
                                setSelectedComment(comment);
                                setDeleteCommentDialogOpen(true);
                                // 阻止对话框关闭
                                return false;
                              }}
                              type="button"
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

          <DialogFooter className='gap-2 sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='rounded-lg border-gray-200 hover:bg-gray-50 transition-colors'
            >
              取消
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
                className='rounded-lg transition-colors'
            >
              {isSubmitting ? '正在保存...' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      {/* 删除评论确认对话框 */}
      <AlertDialog
        open={deleteCommentDialogOpen}
        onOpenChange={(open) => {
          // 只在用户主动关闭对话框时更新状态
          if (!open) {
            setDeleteCommentDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent onClick={(e) => {
          // 阻止事件冒泡到父元素
          e.stopPropagation();
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除评论</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这条评论吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={(e) => {
                e.stopPropagation();
                setDeleteCommentDialogOpen(false);
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-500 text-white hover:bg-red-600'
              onClick={(e) => {
                // 阻止事件冒泡和默认行为
                e.stopPropagation();
                e.preventDefault();
                confirmDeleteComment();
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostEditModal;
