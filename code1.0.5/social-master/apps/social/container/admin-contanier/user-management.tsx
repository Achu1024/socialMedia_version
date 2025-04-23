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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminDeleteUser, useAdminUsersList, useAdminResetUserPassword, User } from '@/http/useAdmin';
import dayjs from 'dayjs';
import { debounce } from 'lodash-es';
import { Edit, MoreHorizontal, RefreshCw, Search, Trash, Key } from 'lucide-react';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import UserEditModal from './user-edit-modal';
import { toast } from 'react-hot-toast';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading, refetch } = useAdminUsersList(searchTerm);
  const deleteUser = useAdminDeleteUser(selectedUser?.id || '');
  const resetPassword = useAdminResetUserPassword(selectedUser?.id || '');

  const debouncedSearch = debounce(
    (value: string) => {
      setSearchTerm(value);
    },
    500,
    { maxWait: 500 }
  );
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleEdit = (user: User) => {
    flushSync(() => {
      setSelectedUser(user);
      setEditModalOpen(true);
    });
  };

  const handleDelete = (user: User) => {
    flushSync(() => {
      setSelectedUser(user);
      setDeleteDialogOpen(true);
    });
  };

  const handleResetPassword = (user: User) => {
    flushSync(() => {
      setSelectedUser(user);
      setResetPasswordDialogOpen(true);
    });
  };

  // 关闭编辑模态框时重置选中的用户
  const handleEditModalChange = (open: boolean) => {
    setEditModalOpen(open);
    if (!open) {
      // 当模态框关闭时，重置选中的用户
      setTimeout(() => {
        setSelectedUser(null);
      }, 100);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync();
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      // 删除成功后刷新用户列表
      refetch();
    } catch {}
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;

    try {
      const result = await resetPassword.mutateAsync();
      setNewPassword(result.new_password);
      // 不关闭对话框，而是显示新密码
    } catch (error) {
      toast.error('重置密码失败');
      setResetPasswordDialogOpen(false);
    }
  };

  return (
    <div className='p-1'>
      <div className='mb-6 flex items-center gap-3'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='搜索用户...'
            className='pl-10 h-10 rounded-xl border-gray-200 focus:border-purple focus:ring-1 focus:ring-purple transition-all'
            onChange={handleSearch}
          />
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
              <TableHead className='py-4'>用户信息</TableHead>
              <TableHead className='py-4'>注册时间</TableHead>
              <TableHead className='py-4'>角色</TableHead>
              <TableHead className='py-4'>状态</TableHead>
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
            ) : data?.users && data.users.length > 0 ? (
              data.users.map((user) => (
                <TableRow
                  key={user.id}
                  className='hover:bg-gray-50 transition-colors'
                >
                  <TableCell className='flex items-center gap-3 py-4'>
                    <Avatar className='h-10 w-10 border border-gray-100'>
                      <AvatarImage src={user.get_avatar} alt={user.name} />
                      <AvatarFallback className='bg-purple-light text-purple font-medium'>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='font-medium'>{user.name}</div>
                      <div className='text-xs text-gray-500'>{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className='text-sm text-gray-600'>
                    {dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {user.is_admin ? (
                      <Badge className='bg-purple-100 text-purple hover:bg-purple-200 transition-colors'>
                        超级管理员
                      </Badge>
                    ) : (
                      <Badge className='bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'>
                        普通用户
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge className='bg-green-100 text-green-600 hover:bg-green-200 transition-colors'>
                        已启用
                      </Badge>
                    ) : (
                      <Badge className='bg-red-100 text-red-600 hover:bg-red-200 transition-colors'>
                        已禁用
                      </Badge>
                    )}
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
                          onClick={() => handleEdit(user)}
                          className='cursor-pointer hover:text-purple focus:text-purple'
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          <span>编辑</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(user)}
                          className='cursor-pointer hover:text-purple focus:text-purple'
                        >
                          <Key className='mr-2 h-4 w-4' />
                          <span>重置密码</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
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
                  <div className='text-gray-500'>没有找到用户</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 编辑用户模态框 */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          open={editModalOpen}
          onOpenChange={handleEditModalChange}
        />
      )}

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='rounded-xl max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl'>确认删除用户</DialogTitle>
            <DialogDescription className='text-gray-600 mt-2'>
              你确定要删除用户{' '}
              <span className='font-medium text-black'>
                "{selectedUser?.name}"
              </span>
              <span className='text-gray-500'>({selectedUser?.email})</span>{' '}
              吗？
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
              disabled={deleteUser.isPending}
              className='rounded-lg bg-red-500 hover:bg-red-600 transition-colors'
            >
              {deleteUser.isPending ? '正在删除...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码确认对话框 */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className='rounded-xl max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl'>
              {newPassword ? '密码已重置' : '确认重置密码'}
            </DialogTitle>
            <DialogDescription className='text-gray-600 mt-2'>
              {!newPassword ? (
                <>
                  你确定要重置用户{' '}
                  <span className='font-medium text-black'>
                    "{selectedUser?.name}"
                  </span>
                  <span className='text-gray-500'>({selectedUser?.email})</span>{' '}
                  的密码吗？
                  <div className='mt-1 text-amber-500 text-sm'>
                    重置后将生成新的随机密码。
                  </div>
                </>
              ) : (
                <>
                  用户{' '}
                  <span className='font-medium text-black'>
                    "{selectedUser?.name}"
                  </span>
                  <span className='text-gray-500'>({selectedUser?.email})</span>{' '}
                  的密码已重置。
                  <div className='mt-4 bg-gray-100 p-3 rounded-lg'>
                    <div className='text-sm text-gray-600'>新密码:</div>
                    <div className='font-medium text-lg mt-1 text-purple break-all'>
                      {newPassword}
                    </div>
                  </div>
                  <div className='mt-2 text-amber-500 text-sm'>
                    请妥善保存此密码，关闭对话框后将无法再次查看！
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:justify-end mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setNewPassword('');
                setSelectedUser(null);
              }}
            >
              {newPassword ? '关闭' : '取消'}
            </Button>
            {!newPassword && (
              <Button
                type='button'
                onClick={confirmResetPassword}
                // className='bg-purple hover:bg-purple-dark'
                disabled={resetPassword.isPending}
              >
                {resetPassword.isPending ? '处理中...' : '确认重置'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
