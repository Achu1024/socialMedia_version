'use client';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAdminPostsList,
  useAdminDeletePost,
  useAdminClearPostReports,
  Post,
} from '@/http/useAdmin';
import dayjs from 'dayjs';
import { debounce } from 'lodash-es';
import {
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash,
} from 'lucide-react';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { toast } from 'react-hot-toast';
import PostEditModal from './post-edit-modal';
import PostViewModal from './post-view-modal';
import Render from '@/components/Rich/Render';

const PostManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [isPrivate, setIsPrivate] = useState<boolean | undefined>(undefined);
  const [hasReports, setHasReports] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearReportsDialogOpen, setClearReportsDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useAdminPostsList(
    searchTerm,
    userId,
    isPrivate,
    hasReports,
    sortBy,
    page,
    pageSize
  );

  const deletePost = useAdminDeletePost(selectedPost?.id || '');
  const clearReports = useAdminClearPostReports(selectedPost?.id || '');

  const debouncedSearch = debounce(
    (value: string) => {
      setSearchTerm(value);
      setPage(1); // 搜索时重置页码
    },
    500,
    { maxWait: 500 }
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleEdit = (post: Post) => {
    flushSync(() => {
      setSelectedPost(post);
      setEditModalOpen(true);
    });
  };

  const handleView = (post: Post) => {
    flushSync(() => {
      setSelectedPost(post);
      setViewModalOpen(true);
    });
  };

  const handleDelete = (post: Post) => {
    flushSync(() => {
      setSelectedPost(post);
      setDeleteDialogOpen(true);
    });
  };

  const handleClearReports = (post: Post) => {
    flushSync(() => {
      setSelectedPost(post);
      setClearReportsDialogOpen(true);
    });
  };

  // 关闭编辑模态框时重置选中的帖子
  const handleEditModalChange = (open: boolean) => {
    setEditModalOpen(open);
    if (!open) {
      // 当模态框关闭时，重置选中的帖子
      setTimeout(() => {
        setSelectedPost(null);
      }, 100);
    }
  };

  // 关闭查看模态框时重置选中的帖子
  const handleViewModalChange = (open: boolean) => {
    setViewModalOpen(open);
    if (!open) {
      // 当模态框关闭时，重置选中的帖子
      setTimeout(() => {
        setSelectedPost(null);
      }, 100);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPost) return;

    try {
      await deletePost.mutateAsync();
      setDeleteDialogOpen(false);
      setSelectedPost(null);
      toast.success('帖子已成功删除');
      // 删除成功后刷新帖子列表
      refetch();
    } catch (error) {
      toast.error('删除帖子失败');
    }
  };

  const confirmClearReports = async () => {
    if (!selectedPost) return;

    try {
      await clearReports.mutateAsync();
      setClearReportsDialogOpen(false);
      setSelectedPost(null);
      toast.success('帖子举报已清除');
      // 清除成功后刷新帖子列表
      refetch();
    } catch (error) {
      toast.error('清除举报失败');
    }
  };

  const handleResetFilters = () => {
    setIsPrivate(undefined);
    setHasReports(undefined);
    setSortBy('-created_at');
    setPage(1);
  };

  const getTotalPages = () => {
    if (!data?.count) return 1;
    return Math.ceil(data.count / pageSize);
  };

  const renderPagination = () => {
    const totalPages = getTotalPages();
    if (totalPages <= 1) return null;

    const items = [];

    // 添加前一页按钮
    items.push(
      <PaginationItem key='prev'>
        <PaginationPrevious
          onClick={() => setPage(Math.max(1, page - 1))}
          className={page === 1 ? 'pointer-events-none opacity-50' : ''}
        />
      </PaginationItem>
    );

    // 添加页码
    const maxPageItems = 5;
    if (totalPages <= maxPageItems) {
      // 少于5页时全部显示
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink isActive={page === i} onClick={() => setPage(i)}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // 超过5页时显示首页、当前页附近和尾页
      items.push(
        <PaginationItem key={1}>
          <PaginationLink isActive={page === 1} onClick={() => setPage(1)}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (page > 3) {
        items.push(
          <PaginationItem key='ellipsis1'>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const rangeStart = Math.max(2, page - 1);
      const rangeEnd = Math.min(totalPages - 1, page + 1);

      for (let i = rangeStart; i <= rangeEnd; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink isActive={page === i} onClick={() => setPage(i)}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (page < totalPages - 2) {
        items.push(
          <PaginationItem key='ellipsis2'>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={page === totalPages}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // 添加下一页按钮
    items.push(
      <PaginationItem key='next'>
        <PaginationNext
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          className={
            page === totalPages ? 'pointer-events-none opacity-50' : ''
          }
        />
      </PaginationItem>
    );

    return (
      <Pagination className='mt-4'>
        <PaginationContent>{items}</PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className='p-1'>
      <div className='mb-6 flex flex-wrap items-center gap-3'>
        <div className='relative flex-1 min-w-[300px]'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='搜索帖子内容...'
            className='pl-10 h-10 rounded-xl border-gray-200 focus:border-purple focus:ring-1 focus:ring-purple transition-all'
            onChange={handleSearch}
          />
        </div>

        <div className='flex items-center gap-2'>
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-36 h-10 rounded-xl border-gray-200 focus:border-purple focus:ring-1 focus:ring-purple'>
              <SelectValue placeholder='排序方式' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='-created_at'>最新发布</SelectItem>
              <SelectItem value='created_at'>最早发布</SelectItem>
              <SelectItem value='-likes_count'>点赞最多</SelectItem>
              <SelectItem value='-comments_count'>评论最多</SelectItem>
            </SelectContent>
          </Select>

          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='h-10 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-purple hover:border-purple transition-colors flex items-center gap-2'
              >
                <Filter className='h-4 w-4' />
                筛选
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56 rounded-xl shadow-md border-gray-200'>
              <DropdownMenuLabel>筛选条件</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className='p-2'>
                <p className='text-sm text-gray-500 mb-1'>私密帖子</p>
                <Select
                  value={
                    isPrivate === undefined
                      ? 'all'
                      : isPrivate
                      ? 'true'
                      : 'false'
                  }
                  onValueChange={(value) => {
                    setIsPrivate(
                      value === 'all' ? undefined : value === 'true'
                    );
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='w-full h-8 rounded-lg border-gray-200'>
                    <SelectValue placeholder='全部' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部</SelectItem>
                    <SelectItem value='true'>私密帖子</SelectItem>
                    <SelectItem value='false'>公开帖子</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='p-2'>
                <p className='text-sm text-gray-500 mb-1'>举报状态</p>
                <Select
                  value={
                    hasReports === undefined
                      ? 'all'
                      : hasReports
                      ? 'true'
                      : 'false'
                  }
                  onValueChange={(value) => {
                    setHasReports(
                      value === 'all' ? undefined : value === 'true'
                    );
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='w-full h-8 rounded-lg border-gray-200'>
                    <SelectValue placeholder='全部' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部</SelectItem>
                    <SelectItem value='true'>已举报</SelectItem>
                    <SelectItem value='false'>未举报</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DropdownMenuSeparator /> */}
              {/* <div className='p-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleResetFilters}
                  className='w-full rounded-lg border-gray-200'
                >
                  重置筛选
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* <Button
            variant='outline'
            onClick={() => refetch()}
            className='h-10 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-purple hover:border-purple transition-colors flex items-center gap-2'
          >
            <RefreshCw className='h-4 w-4' />
            刷新
          </Button> */}
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white '>
        <Table>
          <TableHeader className='bg-gray-50'>
            <TableRow className='hover:bg-gray-50'>
              <TableHead className='py-4'>帖子内容</TableHead>
              <TableHead className='py-4'>发布者</TableHead>
              <TableHead className='py-4'>发布时间</TableHead>
              <TableHead className='py-4'>互动</TableHead>
              <TableHead className='text-right py-4'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  <div className='flex justify-center items-center gap-2'>
                    <RefreshCw className='h-4 w-4 animate-spin text-purple' />
                    <span className='text-gray-500'>加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data?.results?.posts && data.results.posts.length > 0 ? (
              data.results.posts.map((post) => (
                <TableRow
                  key={post.id}
                  className='hover:bg-gray-50 transition-colors '
                >
                  <TableCell className='py-4 max-w-lg'>
                    <div className='line-clamp-2'>
                      <Render data={post.body} />
                    </div>
                    {post.attachments.length > 0 && (
                      <Badge variant='outline' className='mt-1 text-gray-500'>
                        {post.attachments.length} 张图片
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className='py-4'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-8 w-8 border border-gray-100'>
                        <AvatarImage
                          src={post.created_by.get_avatar}
                          alt={post.created_by.name}
                        />
                        <AvatarFallback className='bg-purple-light text-purple font-medium'>
                          {post.created_by.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium text-sm'>
                          {post.created_by.name}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {post.created_by.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-sm text-gray-600'>
                    {dayjs(post.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='text-sm'>
                        <span className='font-medium'>{post.likes_count}</span>{' '}
                        <span className='text-gray-500'>点赞</span>
                      </span>
                      <span className='text-sm'>
                        <span className='font-medium'>
                          {post.comments_count}
                        </span>{' '}
                        <span className='text-gray-500'>评论</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          className='h-8 w-8 p-0 rounded-full hover:bg-gray-100'
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='rounded-xl shadow-md border-gray-200'
                      >
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleView(post)}
                          className='cursor-pointer hover:text-purple focus:text-purple'
                        >
                          <Eye className='mr-2 h-4 w-4' />
                          <span>查看</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(post)}
                          className='cursor-pointer hover:text-purple focus:text-purple'
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          <span>编辑</span>
                        </DropdownMenuItem>
                        {post.reports_count && post.reports_count > 0 && (
                          <DropdownMenuItem
                            onClick={() => handleClearReports(post)}
                            className='cursor-pointer hover:text-amber-600 focus:text-amber-600'
                          >
                            <ShieldAlert className='mr-2 h-4 w-4' />
                            <span>清除举报</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(post)}
                          className='text-red-500 hover:text-red-600 focus:text-red-600 cursor-pointer'
                        >
                          <Trash className='mr-2 h-4 w-4' />
                          <span>删除</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  <div className='text-gray-500'>没有找到帖子</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {renderPagination()}

      {/* 查看帖子模态框 */}
      {selectedPost && (
        <PostViewModal
          postId={selectedPost.id}
          open={viewModalOpen}
          onOpenChange={handleViewModalChange}
        />
      )}

      {/* 编辑帖子模态框 */}
      {selectedPost && (
        <PostEditModal
          post={selectedPost}
          open={editModalOpen}
          onOpenChange={handleEditModalChange}
        />
      )}

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='rounded-xl max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl'>确认删除帖子</DialogTitle>
            <DialogDescription className='text-gray-600 mt-2'>
              你确定要删除这篇帖子吗？这将同时删除该帖子的所有评论和点赞数据。
              <div className='mt-2 p-2 bg-gray-50 rounded-lg text-sm border border-gray-200 max-h-20 overflow-y-auto'>
                <span className='line-clamp-3'>{selectedPost?.body}</span>
              </div>
              <div className='mt-1 text-red-500 text-sm'>此操作不可逆。</div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:justify-end mt-4'>
            <Button
              variant='outline'
              onClick={() => setDeleteDialogOpen(false)}
              className='rounded-lg border-gray-200 hover:bg-gray-50 transition-colors'
            >
              取消
            </Button>
            <Button
              variant='destructive'
              onClick={confirmDelete}
              disabled={deletePost.isPending}
              className='rounded-lg bg-red-500 hover:bg-red-600 transition-colors'
            >
              {deletePost.isPending ? '正在删除...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清除举报确认对话框 */}
      <Dialog
        open={clearReportsDialogOpen}
        onOpenChange={setClearReportsDialogOpen}
      >
        <DialogContent className='rounded-xl max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl'>确认清除举报</DialogTitle>
            <DialogDescription className='text-gray-600 mt-2'>
              你确定要清除这篇帖子的所有举报记录吗？
              <div className='mt-2 p-2 bg-gray-50 rounded-lg text-sm border border-gray-200 max-h-20 overflow-y-auto'>
                <span className='line-clamp-3'>{selectedPost?.body}</span>
              </div>
              <div className='mt-1 text-amber-500 text-sm'>
                举报次数: {selectedPost?.reports_count || 0}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:justify-end mt-4'>
            <Button
              variant='outline'
              onClick={() => setClearReportsDialogOpen(false)}
              className='rounded-lg border-gray-200 hover:bg-gray-50 transition-colors'
            >
              取消
            </Button>
            <Button
              variant='default'
              onClick={confirmClearReports}
              disabled={clearReports.isPending}
              className='rounded-lg bg-amber-500 hover:bg-amber-600 transition-colors'
            >
              {clearReports.isPending ? '正在清除...' : '确认清除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostManagement;
