'use client';

import Render from '@/components/Rich/Render';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  PostReport,
  ReportedPostWithDetails,
  useAdminClearPostReports,
  useAdminHandleReport,
  useAdminReportedPosts,
} from '@/http/useAdmin';
import dayjs from 'dayjs';
import {
  Check,
  EyeIcon,
  Heart,
  MessageSquare,
  RefreshCw,
  Trash,
  UserX,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const ReportManagement = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPost, setSelectedPost] =
    useState<ReportedPostWithDetails | null>(null);
  const [selectedReport, setSelectedReport] = useState<PostReport | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  const { data, isLoading, refetch } = useAdminReportedPosts(page, pageSize);
  const clearReports = useAdminClearPostReports(selectedPost?.post.id || '');
  const handleReport = useAdminHandleReport(selectedReport?.id || '');

  const handleView = (post: ReportedPostWithDetails) => {
    setSelectedPost(post);
    setViewDialogOpen(true);
  };

  const handleClearReports = async () => {
    if (!selectedPost) return;

    try {
      await clearReports.mutateAsync();
      toast.success('已清除所有举报');
      setViewDialogOpen(false);
      setSelectedPost(null);
      refetch();
    } catch (error) {
      toast.error('操作失败，请重试');
    }
  };

  const handleReportAction = async (
    action: 'dismiss' | 'ban_user' | 'delete_post'
  ) => {
    if (!selectedReport) return;

    try {
      await handleReport.mutateAsync({
        action,
        notes: actionNotes,
      });

      toast.success('处理成功');
      setActionDialogOpen(false);
      setSelectedReport(null);
      setActionNotes('');
      refetch();
    } catch (error) {
      toast.error('操作失败，请重试');
    }
  };

  return (
    <div className='p-1'>
      <div className='mb-6 flex items-center gap-3'>
        <div className='flex-1'>
          <h1 className='text-2xl font-bold'>举报管理</h1>
          <p className='text-gray-500 text-sm mt-1'>管理用户举报的帖子内容</p>
        </div>
        <Button
          variant='outline'
          onClick={() => refetch()}
          className='h-10 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-purple hover:border-purple transition-colors flex items-center gap-2'
        >
          <RefreshCw className='h-4 w-4' />
          刷新
        </Button>
      </div>

      <div className='rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white'>
        <Table>
          <TableHeader className='bg-gray-50'>
            <TableRow className='hover:bg-gray-50'>
              <TableHead className='py-4'>帖子内容</TableHead>
              <TableHead className='py-4'>发布者</TableHead>
              <TableHead className='py-4'>举报次数</TableHead>
              <TableHead className='py-4'>最近举报时间</TableHead>
              <TableHead className='text-right py-4'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  <div className='flex justify-center items-center gap-2'>
                    <RefreshCw className='h-4 w-4 animate-spin text-purple' />
                    <span className='text-gray-500'>加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data?.results?.reported_posts &&
              data.results.reported_posts.length > 0 ? (
              data.results.reported_posts.map((postData) => (
                <TableRow
                  key={postData.post.id}
                  className='hover:bg-gray-50 transition-colors'
                >
                  <TableCell className='py-4 max-w-md'>
                    <div className='line-clamp-2 text-sm text-gray-700'>
                      <Render data={postData.post.body} />
                    </div>
                  </TableCell>
                  <TableCell className='flex items-center gap-3 py-4'>
                    <Avatar className='h-10 w-10 border border-gray-100'>
                      <AvatarImage
                        src={postData.post.created_by.get_avatar}
                        alt={postData.post.created_by.name}
                      />
                      <AvatarFallback className='bg-purple-light text-purple font-medium'>
                        {postData.post.created_by.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='font-medium'>
                        {postData.post.created_by.name}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {postData.post.created_by.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className='bg-red-100 text-red-600 hover:bg-red-200 transition-colors'>
                      {postData.reports_count} 次举报
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-gray-600'>
                    {postData.reports && postData.reports.length > 0
                      ? dayjs(postData.reports[0].created_at).format(
                          'YYYY-MM-DD HH:mm:ss'
                        )
                      : '无记录'}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='ghost'
                      className='h-8 rounded-lg hover:bg-gray-100 text-purple'
                      onClick={() => handleView(postData)}
                    >
                      <EyeIcon className='h-4 w-4 mr-2' />
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  <div className='text-gray-500'>没有找到举报记录</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {data && data.count > pageSize && (
          <div className='flex items-center justify-between px-4 py-4 border-t border-gray-200'>
            <div className='text-sm text-gray-500'>
              共 {data.count} 条记录，当前显示 {page * pageSize - pageSize + 1}{' '}
              - {Math.min(page * pageSize, data.count)}
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={!data.previous}
                onClick={() => setPage(page - 1)}
                className='rounded-lg'
              >
                上一页
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={!data.next}
                onClick={() => setPage(page + 1)}
                className='rounded-lg'
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 帖子详情对话框 */}
      {selectedPost && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className='rounded-xl max-w-3xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='text-xl'>举报详情</DialogTitle>
              <DialogDescription className='text-gray-600 mt-2'>
                查看帖子被举报的详细信息
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue='post' className='mt-4'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='post'>帖子内容</TabsTrigger>
                <TabsTrigger value='reports'>
                  举报记录 ({selectedPost.reports_count})
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value='post'
                className='mt-4 p-4 border rounded-lg bg-gray-50'
              >
                <div className='flex items-center gap-3 mb-3'>
                  <Avatar className='h-10 w-10 border border-gray-100'>
                    <AvatarImage
                      src={selectedPost.post.created_by.get_avatar}
                      alt={selectedPost.post.created_by.name}
                    />
                    <AvatarFallback className='bg-purple-light text-purple font-medium'>
                      {selectedPost.post.created_by.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='font-medium'>
                      {selectedPost.post.created_by.name}
                    </div>
                    <div className='text-xs text-gray-500'>
                      发布于{' '}
                      {dayjs(selectedPost.post.created_at).format(
                        'YYYY-MM-DD HH:mm:ss'
                      )}
                    </div>
                  </div>
                </div>

                <div className='p-3 bg-white rounded-lg border mb-2'>
                  <Render data={selectedPost.post.body} />
                </div>

                <div className='flex gap-2'>
                  <Badge className='bg-blue-100 text-blue-600'>
                    <MessageSquare className='h-3 w-3 mr-1' />
                    {selectedPost.post.comments_count} 评论
                  </Badge>
                  <Badge className='bg-pink-100 text-pink-600'>
                    <Heart className='h-3 w-3 mr-1' />
                    {selectedPost.post.likes_count} 点赞
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value='reports' className='mt-4'>
                <div className='border rounded-lg overflow-hidden'>
                  {selectedPost.reports && selectedPost.reports.length > 0 ? (
                    <Accordion type='single' collapsible className='w-full'>
                      {selectedPost.reports.map((report, index) => (
                        <AccordionItem value={report.id} key={report.id}>
                          <AccordionTrigger className='px-4 py-3 hover:bg-gray-50'>
                            <div className='flex items-center gap-3 text-left'>
                              <Avatar className='h-8 w-8 border border-gray-100'>
                                <AvatarImage
                                  src={report.reported_by.get_avatar}
                                  alt={report.reported_by.name}
                                />
                                <AvatarFallback className='bg-orange-light text-orange font-medium'>
                                  {report.reported_by.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className='font-medium text-sm'>
                                  {report.reported_by.name}
                                </div>
                                <div className='text-xs text-gray-500'>
                                  举报于{' '}
                                  {dayjs(report.created_at).format(
                                    'YYYY-MM-DD HH:mm:ss'
                                  )}
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className='px-4 py-3 bg-gray-50'>
                            <div className='p-3 bg-white rounded-lg border mb-3'>
                              <h4 className='text-sm font-medium mb-1 text-gray-700'>
                                举报原因：
                              </h4>
                              <p className='text-sm text-gray-600'>
                                {report.reason}
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className='p-4 text-center text-gray-500'>
                      没有找到举报记录
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className='gap-2 sm:justify-end mt-4'>
              <Button
                variant='outline'
                onClick={() => setViewDialogOpen(false)}
                className='rounded-lg border-gray-200 hover:bg-gray-50 transition-colors'
              >
                关闭
              </Button>
              <Button
                variant='destructive'
                onClick={handleClearReports}
                disabled={clearReports.isPending}
                className='rounded-lg bg-red-500 hover:bg-red-600 transition-colors'
              >
                {clearReports.isPending ? '处理中...' : '清除所有举报'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 处理举报对话框 */}
      {selectedReport && (
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent className='rounded-xl max-w-md'>
            <DialogHeader>
              <DialogTitle className='text-xl'>处理举报</DialogTitle>
              <DialogDescription className='text-gray-600 mt-2'>
                请选择处理方式
              </DialogDescription>
            </DialogHeader>

            <div className='mt-4'>
              <h4 className='text-sm font-medium mb-2'>处理备注（可选）：</h4>
              <Textarea
                placeholder='添加处理备注...'
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className='min-h-[80px]'
              />
            </div>

            <div className='grid grid-cols-1 gap-3 mt-4'>
              <Button
                variant='outline'
                className='justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                onClick={() => handleReportAction('dismiss')}
              >
                <Check className='h-4 w-4 mr-2 text-green-500' />
                驳回举报
              </Button>
              <Button
                variant='outline'
                className='justify-start text-gray-600 hover:bg-red-50 hover:text-red-800'
                onClick={() => handleReportAction('delete_post')}
              >
                <Trash className='h-4 w-4 mr-2 text-red-500' />
                删除帖子
              </Button>
              <Button
                variant='outline'
                className='justify-start text-gray-600 hover:bg-orange-50 hover:text-orange-800'
                onClick={() => handleReportAction('ban_user')}
              >
                <UserX className='h-4 w-4 mr-2 text-orange-500' />
                封禁用户
              </Button>
            </div>

            <DialogFooter className='gap-2 sm:justify-end mt-4'>
              <Button
                variant='outline'
                onClick={() => setActionDialogOpen(false)}
                className='rounded-lg border-gray-200 hover:bg-gray-50 transition-colors'
              >
                取消
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReportManagement;
