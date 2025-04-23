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
import { Post, useAdminUpdatePost } from '@/http/useAdmin';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface PostEditModalProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PostEditModal = ({ post, open, onOpenChange }: PostEditModalProps) => {
  const [body, setBody] = useState(post.body);
  const [isPrivate, setIsPrivate] = useState(post.is_private);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 每次打开模态框或帖子变更时重置表单状态
  useEffect(() => {
    if (post) {
      setBody(post.body);
      setIsPrivate(post.is_private);
    }
  }, [post, open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] rounded-xl'>
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
              className='rounded-lg   transition-colors'
            >
              {isSubmitting ? '正在保存...' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditModal;
