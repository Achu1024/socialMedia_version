'use client';

import Render from '@/components/Rich/Render';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminPostDetail } from '@/http/useAdmin';
import dayjs from 'dayjs';
import { Loader, X } from 'lucide-react';
import Image from 'next/image';

interface PostViewModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PostViewModal = ({ postId, open, onOpenChange }: PostViewModalProps) => {
  const { data, isLoading } = useAdminPostDetail(postId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] rounded-xl fixed inset-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white'>
        <DialogHeader>
          <DialogTitle className='text-xl'>查看帖子</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='h-40 flex items-center justify-center'>
            <Loader className='h-6 w-6 text-purple animate-spin' />
          </div>
        ) : data?.post ? (
          <div className='overflow-y-auto space-y-6 pr-2 max-h-[calc(70vh-120px)]'>
            {/* 帖子信息 */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Avatar className='h-10 w-10 border border-gray-100 flex-shrink-0'>
                  <AvatarImage
                    src={data.post.created_by.get_avatar}
                    alt={data.post.created_by.name}
                  />
                  <AvatarFallback className='bg-purple-light text-purple font-medium'>
                    {data.post.created_by.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='font-medium'>{data.post.created_by.name}</div>
                  <div className='text-xs text-gray-500'>
                    {dayjs(data.post.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                </div>
              </div>

              <div className='p-3 bg-gray-50 rounded-lg border border-gray-200'>
                <p className='whitespace-pre-wrap break-words'>
                  <Render data={data.post.body} />
                </p>
              </div>

              {/* 帖子附件 */}
              {data.post.attachments && data.post.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">
                    图片附件 ({data.post.attachments.length})
                  </h3>
                  <div 
                    className={`grid gap-2 ${
                      data.post.attachments.length === 1 ? 'grid-cols-1' :
                      data.post.attachments.length === 2 ? 'grid-cols-2' :
                      data.post.attachments.length === 3 ? 'grid-cols-3' :
                      data.post.attachments.length === 4 ? 'grid-cols-2 grid-rows-2' :
                      'grid-cols-3'
                    }`}
                  >
                    {data.post.attachments.slice(0, 9).map((attachment) => (
                      <div
                        key={attachment.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                      >
                        <Image
                          src={attachment.get_image}
                          alt="帖子附件"
                          width={200}
                          height={200}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                  {data.post.attachments.length > 9 && (
                    <div className="text-center text-sm text-gray-500 mt-1">
                      还有 {data.post.attachments.length - 9} 张图片未显示
                    </div>
                  )}
                </div>
              )}

              {/* 互动信息 */}
              <div className='flex items-center gap-4 text-sm text-gray-500'>
                <span>
                  <span className='font-medium text-black'>
                    {data.post.likes_count}
                  </span>{' '}
                  点赞
                </span>
                <span>
                  <span className='font-medium text-black'>
                    {data.post.comments_count}
                  </span>{' '}
                  评论
                </span>
                <div className='flex-1'></div>
                <div className='flex items-center gap-2'>
                  {data.post.reports && data.post.reports.count > 0 && (
                    <Badge className='bg-red-100 text-red-600'>
                      {data.post.reports.count} 个举报
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 评论列表 */}
            {data.post.comments && data.post.comments.length > 0 ? (
              <div className='space-y-3'>
                <h3 className='font-medium'>
                  评论 ({data.post.comments.length})
                </h3>
                <div className='space-y-3'>
                  {data.post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className='p-3 rounded-lg border border-gray-200 space-y-2'
                    >
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-8 w-8 border border-gray-100 flex-shrink-0'>
                          <AvatarImage
                            src={comment.created_by.get_avatar}
                            alt={comment.created_by.name}
                          />
                          <AvatarFallback className='bg-purple-light text-purple font-medium text-xs'>
                            {comment.created_by.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                          <div className='text-sm font-medium'>
                            {comment.created_by.name}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {comment.created_at_formatted}
                          </div>
                        </div>
                        <div className='text-sm text-gray-500'>
                          <span className='font-medium text-black'>
                            {comment.likes_count}
                          </span>{' '}
                          点赞
                        </div>
                      </div>
                      <p className='text-sm'>{comment.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='text-center text-gray-500 py-4'>暂无评论</div>
            )}

            {/* 举报信息 */}
            {data.post.reports && data.post.reports.count > 0 && (
              <div className='space-y-3'>
                <h3 className='font-medium'>
                  举报用户 ({data.post.reports.count})
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {data.post.reports.users.map((user) => (
                    <div
                      key={user.id}
                      className='flex items-center gap-2 p-2 rounded-lg border border-gray-200'
                    >
                      <Avatar className='h-6 w-6 border border-gray-100 flex-shrink-0'>
                        <AvatarImage src={user.get_avatar} alt={user.name} />
                        <AvatarFallback className='bg-purple-light text-purple font-medium text-xs'>
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-sm'>{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='h-40 flex items-center justify-center'>
            <div className='text-gray-500'>找不到该帖子或已被删除</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostViewModal;
